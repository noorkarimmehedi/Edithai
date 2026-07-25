require('dotenv').config({ path: '.env.local' });
const { Composio } = require('@composio/core');

async function test() {
  try {
    const composio = new Composio({ apiKey: process.env.NEXT_PUBLIC_COMPOSIO_API_KEY });
    const response = await composio.tools.execute("GMAIL_FETCH_EMAILS", {
      connectedAccountId: process.env.NEXT_PUBLIC_COMPOSIO_CONNECTION_ID,
      arguments: {},
      userId: "voicemail-user",
      dangerouslySkipVersionCheck: true,
    });
    console.log("Success:", JSON.stringify(response, null, 2));
  } catch(e) {
    console.log("Error:", e.message);
    if(e.response) console.log(e.response.data);
  }
}
test();
