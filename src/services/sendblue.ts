export async function sendBlueMessage(to: string, content: string) {
  const apiKey = process.env.SENDBLUE_API_KEY;
  const apiSecret = process.env.SENDBLUE_API_SECRET;
  
  if (!apiKey || !apiSecret) {
    console.error("Sendblue credentials missing");
    return;
  }

  try {
    const response = await fetch("https://api.sendblue.co/api/send-message", {
      method: "POST",
      headers: {
        "sb-api-key-id": apiKey,
        "sb-api-secret-key": apiSecret,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        number: to,
        content: content,
        from_number: process.env.SENDBLUE_FROM_NUMBER,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Sendblue API error:", errorText);
    } else {
      const data = await response.json();
      return data;
    }
  } catch (error) {
    console.error("Error sending Sendblue message:", error);
  }
}

export async function sendBlueTypingIndicator(to: string) {
  const apiKey = process.env.SENDBLUE_API_KEY;
  const apiSecret = process.env.SENDBLUE_API_SECRET;
  
  if (!apiKey || !apiSecret) return;

  try {
    // Sendblue typing indicator API
    await fetch("https://api.sendblue.co/api/send-typing-indicator", {
      method: "POST",
      headers: {
        "sb-api-key-id": apiKey,
        "sb-api-secret-key": apiSecret,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        number: to,
        from_number: process.env.SENDBLUE_FROM_NUMBER,
      }),
    });
  } catch (error) {
    console.error("Error sending typing indicator:", error);
  }
}
