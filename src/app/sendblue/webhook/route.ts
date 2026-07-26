import { sendBlueMessage, sendBlueTypingIndicator } from "@/services/sendblue";
import OpenAI, { toFile } from "openai";
import { Composio } from "@composio/core";
import { calendarTools, gmailTools } from "@/services/realtime";

// Map our local tool names to Composio action names
function getComposioAction(toolName: string, params: any) {
  switch (toolName) {
    case "get_emails": return { action: "GMAIL_FETCH_EMAILS", mappedParams: params };
    case "search_emails": return { action: "GMAIL_FETCH_EMAILS", mappedParams: params };
    case "manage_email": return { action: "GMAIL_ADD_LABEL_TO_EMAIL", mappedParams: params }; // Simplification
    case "send_email": return { action: params.action === "draft" ? "GMAIL_CREATE_EMAIL_DRAFT" : "GMAIL_SEND_EMAIL", mappedParams: params };
    
    case "get_events": return { 
      action: "GOOGLECALENDAR_EVENTS_LIST", 
      mappedParams: { 
        ...params, 
        timeMin: params.timeMin || new Date().toISOString(),
        singleEvents: true 
      } 
    };
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
    let messageContent = body.content || body.text || "";

    // Handle voice notes via Whisper API
    if (body.media_url) {
      try {
        console.log("Downloading media from:", body.media_url);
        const openai = new OpenAI();
        const mediaResponse = await fetch(body.media_url);
        const arrayBuffer = await mediaResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        let fileToUpload;
        
        // iMessage sends voice notes as .caf which Whisper rejects. Convert to MP3 using ffmpeg.
        if (body.media_url.includes('.caf') || body.media_url.includes('Audio')) {
          console.log("Converting .caf to .mp3 using ffmpeg...");
          const fs = require('fs');
          const path = require('path');
          const os = require('os');
          const ffmpeg = require('fluent-ffmpeg');
          const ffmpegPath = require('ffmpeg-static');
          ffmpeg.setFfmpegPath(ffmpegPath);
          
          const tempInput = path.join(os.tmpdir(), `input-${Date.now()}.caf`);
          const tempOutput = path.join(os.tmpdir(), `output-${Date.now()}.mp3`);
          fs.writeFileSync(tempInput, buffer);
          
          await new Promise((resolve, reject) => {
            ffmpeg(tempInput)
              .audioChannels(1)
              .audioBitrate('32k')
              .toFormat('mp3')
              .on('end', resolve)
              .on('error', reject)
              .save(tempOutput);
          });
          
          const outputBuffer = fs.readFileSync(tempOutput);
          fileToUpload = await toFile(outputBuffer, 'audio.mp3');
          
          fs.unlinkSync(tempInput);
          fs.unlinkSync(tempOutput);
        } else {
          fileToUpload = await toFile(buffer, 'audio.m4a');
        }
        
        console.log("Transcribing audio with Whisper...");
        const transcription = await openai.audio.transcriptions.create({
          file: fileToUpload,
          model: 'whisper-1',
        });
        
        messageContent = transcription.text;
        console.log("Transcription successful:", messageContent);
      } catch (err) {
        console.error("Failed to transcribe audio:", err);
      }
    }

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
            8. MEMORY & IDs: Because your memory relies on your past responses, you MUST securely memorize exact email addresses and Event IDs for later use. To do this without cluttering the user's text message, wrap all technical IDs at the very end of your response inside a hidden block like this: [HIDDEN: Email: example@gmail.com, EventID: 12345]. This block will be saved to your memory but hidden from the user.
            
            You have access to Gmail and Google Calendar tools. If the user asks you to check email or schedule something, DO IT using your tools.`
          }
        ];

        // Initialize Convex client
        const { ConvexHttpClient } = require("convex/browser");
        const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "");
        const { api } = require("../../../../convex/_generated/api");
        
        // Run Convex tasks concurrently: add message, fetch history, and get connection ID
        let history: any[] = [];
        let dynamicConnectionId: string | null = null;
        
        try {
          const [historyResult, connectionResult] = await Promise.all([
            convex.query(api.users.getMessages, { phoneNumber: senderNumber }),
            convex.query(api.users.getConnectionId, { phoneNumber: senderNumber }).catch(() => null),
            convex.mutation(api.users.addMessage, { phoneNumber: senderNumber, role: "user", content: messageContent })
          ]);
          history = historyResult;
          dynamicConnectionId = connectionResult;
        } catch (err) {
          console.error("Failed to fetch initial Convex data:", err);
        }

        if (history && history.length > 0) {
          for (const msg of history) {
            messages.push({ role: msg.role, content: msg.content });
          }
          // The newly added message might not be in the immediate query return due to DB latency
          if (messages[messages.length - 1].content !== messageContent) {
            messages.push({ role: "user", content: messageContent });
          }
        } else {
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
            // Trigger typing indicator again while the tool executes
            sendBlueTypingIndicator(senderNumber).catch(console.error);
          }

          messages.push(message);
          
          const composio = new Composio({ apiKey });
          
          // Pre-fetch active Composio accounts to avoid repeated lookups (run concurrently)
          let gmailAccountId: string | null = null;
          let calendarAccountId: string | null = null;
          try {
            const [gmailAccounts, calAccounts] = await Promise.all([
              composio.connectedAccounts.list({ userIds: ["voicemail-user"], toolkitSlugs: ["gmail"], statuses: ["ACTIVE"] }).catch(() => ({ items: [] })),
              composio.connectedAccounts.list({ userIds: ["voicemail-user"], toolkitSlugs: ["googlecalendar"], statuses: ["ACTIVE"] }).catch(() => ({ items: [] }))
            ]);
            
            if (gmailAccounts.items && gmailAccounts.items.length > 0) {
              gmailAccountId = gmailAccounts.items[0].id;
            }
            if (calAccounts.items && calAccounts.items.length > 0) {
              calendarAccountId = calAccounts.items[0].id;
            }
          } catch(err) {
            console.error("Failed to pre-fetch Composio accounts:", err);
          }

          // Execute all tool calls concurrently
          const toolResults = await Promise.all(
            message.tool_calls.map(async (toolCall: any) => {
              let resultData = { success: false, error: "Action not mapped" };
              
              try {
                const params = JSON.parse(toolCall.function.arguments || "{}");
                const mapping = getComposioAction(toolCall.function.name, params);
                
                if (mapping) {
                  console.log(`Executing Composio Action: ${mapping.action}`);
                  try {
                    const isGmail = mapping.action.startsWith("GMAIL");
                    const toolkitConnectionId = isGmail ? gmailAccountId : calendarAccountId;
                    
                    if (!toolkitConnectionId) {
                      throw new Error(`No active connection found on Composio for this tool.`);
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
              
              return {
                role: "tool",
                tool_call_id: toolCall.id,
                name: toolCall.function.name,
                content: JSON.stringify(resultData),
              };
            })
          );

          // Append all concurrent tool results to messages
          messages.push(...toolResults);

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
        console.log("Original AI Reply:", finalReplyText);
        
        // Strip out hidden memory tags before sending to the user
        // Fire and forget non-blocking tasks concurrently
        const userFacingText = finalReplyText.replace(/\[HIDDEN:[\s\S]*?\]/gi, "").trim();
        console.log("Sending reply back via Sendblue:", userFacingText);
        
        Promise.all([
          convex.mutation(api.users.addMessage, { phoneNumber: senderNumber, role: "assistant", content: finalReplyText }).catch(err => console.error("Convex error:", err)),
          sendBlueMessage(senderNumber, userFacingText).catch(err => console.error("Sendblue error:", err))
        ]);
      } catch (err) {
        console.error("Background processing error:", err);
      }
    };

    // Spawn the background process asynchronously on the next tick
    // This forces Node.js to immediately flush the 200 OK HTTP response
    // back to Ngrok/Sendblue before we start doing heavy OpenAI/Convex work.
    setTimeout(() => {
      processMessageInBackground();
    }, 50);

    // Immediately return success so Sendblue doesn't retry or hang
    return Response.json({ success: true, note: "Processing in background" });
  } catch (error) {
    console.error("Webhook payload error:", error);
    return Response.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
