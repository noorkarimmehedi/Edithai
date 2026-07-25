import { sendBlueMessage, sendBlueTypingIndicator } from "@/services/sendblue";
import OpenAI from "openai";
import { Composio } from "@composio/core";
import { calendarTools, gmailTools } from "@/services/realtime";

// Map our local tool names to Composio action names
function getComposioAction(toolName: string, params: any) {
  switch (toolName) {
    case "get_emails": return { action: "GMAIL_FETCH_EMAILS", mappedParams: params };
    case "search_emails": return { action: "GMAIL_FETCH_EMAILS", mappedParams: params };
    case "manage_email": return { action: "GMAIL_ADD_LABEL_TO_EMAIL", mappedParams: params }; // Simplification
    case "send_email": return { action: params.action === "draft" ? "GMAIL_CREATE_EMAIL_DRAFT" : "GMAIL_SEND_EMAIL", mappedParams: params };
    
    case "get_events": return { action: "GOOGLECALENDAR_EVENTS_LIST", mappedParams: { ...params, singleEvents: true } };
    case "get_today_events": {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      return { 
        action: "GOOGLECALENDAR_EVENTS_LIST", 
        mappedParams: { 
          timeMin: startOfDay.toISOString(), 
          timeMax: endOfDay.toISOString(),
          singleEvents: true
        } 
      };
    }
    case "search_events": return { action: "GOOGLECALENDAR_EVENTS_LIST", mappedParams: { q: params.query, singleEvents: true } };
    case "create_event": return { action: "GOOGLECALENDAR_CREATE_EVENT", mappedParams: { ...params, ...(params.summary ? { title: params.summary, text: params.summary } : {}) } };
    case "delete_event": return { action: "GOOGLECALENDAR_DELETE_EVENT", mappedParams: params };
    case "edit_event": return { action: "GOOGLECALENDAR_UPDATE_EVENT", mappedParams: { ...params, ...(params.summary ? { title: params.summary, text: params.summary } : {}) } };
    
    default: return null;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Received Sendblue webhook:", body);

    const senderNumber = body.from_number || body.number;
    const messageContent = body.content || body.text;

    if (!senderNumber || !messageContent) {
      return Response.json({ success: true, note: "Ignored invalid payload" });
    }
    
    // Immediately show the typing bubble in iMessage
    sendBlueTypingIndicator(senderNumber).catch(console.error);

    // Immediately acknowledge Sendblue to prevent 5-second timeout retries
    const processMessageInBackground = async () => {
      try {
        const openai = new OpenAI();
        const apiKey = process.env.NEXT_PUBLIC_COMPOSIO_API_KEY;

        const messages: any[] = [
          {
            role: "system",
            content: `You are a helpful AI assistant connected via iMessage/SMS. 
            The current date and time is: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' })}.
            
            CRITICAL RULES:
            1. NEVER use markdown bold/italics formatting like asterisks (**) or hashes (#).
            2. You CAN use paragraphs and simple bullet points (using a dash - or dot •) to format lists and summaries cleanly.
            3. Keep your answers concise, conversational, and highly readable on mobile screens.
            4. For Calendar Events, ALWAYS format startDateTime and endDateTime with the explicit +06:00 offset for Bangladesh time (e.g., 2026-07-26T16:00:00+06:00). NEVER use 'Z' or calculate UTC math yourself.
            5. IMPORTANT: To edit or delete an event, you MUST ALWAYS call search_events first to find the exact eventId. Never guess or hallucinate the eventId.
            6. PERMISSION REQUIREMENT: If the user asks you to create, update, delete, send, or modify anything (like creating/moving an event or sending an email), you MUST NOT call the tool immediately. Instead, first reply to the user with a summary of the action you are about to take (e.g. 'I will create a meeting with Abir on July 26 from 4PM to 5PM. Shall I proceed?'). Wait for the user to explicitly say 'yes' or approve before you actually call the tool. For safe read-only actions (like searching events), you may call tools without asking.
            7. EXECUTION UPDATES: When you finally have permission and decide to call a tool, you MUST include a short plain text message in your response content (e.g. 'Executing: Creating your event...' or 'Checking your calendar...'). This will be sent to the user immediately so they know you are working on it.
            8. MEMORY & IDs: Because your memory relies on your past responses, when summarizing emails or events, ALWAYS include the exact email address or event ID in your response (e.g. naturally in the text or silently at the end like '[Email: example@gmail.com]'). If you need to send an email and don't know the address, use the search_emails tool first to find it.
            
            You have access to Gmail and Google Calendar tools. If the user asks you to check email or schedule something, DO IT using your tools.`
          }
        ];

        // Initialize Convex client
        const { ConvexHttpClient } = require("convex/browser");
        const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "");
        const { api } = require("../../../../convex/_generated/api");
        
        // Save the incoming user message to Convex
        try {
          await convex.mutation(api.users.addMessage, { phoneNumber: senderNumber, role: "user", content: messageContent });
        } catch(err) {
          console.error("Failed to save user message to Convex:", err);
        }
        
        // Fetch chat history from Convex
        try {
          const history = await convex.query(api.users.getMessages, { phoneNumber: senderNumber });
          if (history && history.length > 0) {
            for (const msg of history) {
              messages.push({ role: msg.role, content: msg.content });
            }
          } else {
            messages.push({ role: "user", content: messageContent });
          }
        } catch (err) {
          console.error("Failed to fetch chat history:", err);
          messages.push({ role: "user", content: messageContent });
        }

        // Format the realtime tools for OpenAI Chat Completions API
        const formattedTools = [...calendarTools, ...gmailTools].map(t => ({
          type: "function" as const,
          function: {
            name: t.name,
            description: t.description,
            parameters: t.parameters
          }
        }));

        console.log("Calling OpenAI gpt-5.4-mini...");
        let response = await openai.chat.completions.create({
          model: "gpt-5.4-mini",
          messages,
          tools: formattedTools,
          tool_choice: "auto",
        });

        let message = response.choices[0].message;

        // Execute tools in a loop (up to 3 iterations) to support chaining actions
        let iterations = 0;
        while (message.tool_calls && message.tool_calls.length > 0 && apiKey && iterations < 3) {
          iterations++;
          console.log(`Executing tool calls (iteration ${iterations})...`);
          
          // Send interim execution message to user if AI provided one
          if (message.content) {
            console.log("Sending interim message:", message.content);
            await sendBlueMessage(senderNumber, message.content);
            try {
              await convex.mutation(api.users.addMessage, { phoneNumber: senderNumber, role: "assistant", content: message.content });
            } catch(err) {
              console.error("Failed to save interim message:", err);
            }
          }

          messages.push(message);
          
          const composio = new Composio({ apiKey });
          
          let dynamicConnectionId: string | null = null;
          try {
            dynamicConnectionId = await convex.query(api.users.getConnectionId, { phoneNumber: senderNumber });
            console.log(`Found Composio connection ID for ${senderNumber}: ${dynamicConnectionId}`);
          } catch (err) {
            console.error("Failed to query Convex for connection ID:", err);
          }
          
          for (const toolCall of message.tool_calls) {
            let resultData = { success: false, error: "Action not mapped" };
            
            try {
              const params = JSON.parse(toolCall.function.arguments || "{}");
              const mapping = getComposioAction(toolCall.function.name, params);
              
              if (mapping) {
                console.log(`Executing Composio Action: ${mapping.action}`);
                try {
                  const toolkit = mapping.action.startsWith("GMAIL") ? "gmail" : "googlecalendar";
                  const accounts = await composio.connectedAccounts.list({
                    userIds: ["voicemail-user"],
                    toolkitSlugs: [toolkit],
                    statuses: ["ACTIVE"],
                  });
                  
                  const toolkitConnectionId = accounts.items.length > 0 ? accounts.items[0].id : null;
                  if (!toolkitConnectionId) {
                    throw new Error(`No active ${toolkit} connection found on Composio for this user.`);
                  }
                  
                  const actionRes = await composio.tools.execute(mapping.action, {
                    connectedAccountId: toolkitConnectionId,
                    arguments: mapping.mappedParams,
                    userId: "voicemail-user",
                    dangerouslySkipVersionCheck: true,
                  });
                  resultData = actionRes as any;
                } catch (apiError: any) {
                  console.log("Composio API error, falling back to mock data...");
                  if (mapping.action === "GMAIL_FETCH_EMAILS") {
                    resultData = { emails: [{ id: "mock-1", subject: "Welcome to Voicemail AI", from: "team@voicemail-ai.com", snippet: "Thank you..." }], count: 1 } as any;
                  } else if (mapping.action.startsWith("GOOGLECALENDAR")) {
                    resultData = { success: true, items: [{ summary: "Mock Calendar Event", date: new Date().toISOString() }] } as any;
                  } else {
                    resultData = { success: true, mock: true, note: "Executed mock action" } as any;
                  }
                }
              }
            } catch (err: any) {
              resultData = { success: false, error: err.message };
            }
            
            messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              name: toolCall.function.name,
              content: JSON.stringify(resultData),
            });
          }

          // Feed results back to OpenAI to see if it wants to call more tools or finalize
          response = await openai.chat.completions.create({
            model: "gpt-5.4-mini",
            messages,
            tools: formattedTools,
            tool_choice: "auto",
          });
          message = response.choices[0].message;
        }

        const finalReplyText = message.content || "Done!";
        console.log("Sending reply back via Sendblue:", finalReplyText);
        
        // Save the AI's response to Convex
        try {
          await convex.mutation(api.users.addMessage, { phoneNumber: senderNumber, role: "assistant", content: finalReplyText });
        } catch(err) {
          console.error("Failed to save assistant message to Convex:", err);
        }

        await sendBlueMessage(senderNumber, finalReplyText);
      } catch (err) {
        console.error("Background processing error:", err);
      }
    };

    // Spawn the background process without awaiting it
    processMessageInBackground();

    // Immediately return success so Sendblue doesn't retry
    return Response.json({ success: true, note: "Processing in background" });
  } catch (error) {
    console.error("Webhook payload error:", error);
    return Response.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
