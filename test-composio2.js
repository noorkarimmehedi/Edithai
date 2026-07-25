require('dotenv').config({ path: '.env.local' });
const { Composio } = require('@composio/core');

async function test() {
  try {
    const composio = new Composio({ apiKey: process.env.NEXT_PUBLIC_COMPOSIO_API_KEY });
    const response = await composio.tools.execute("GMAIL_FETCH_EMAILS", {
      connectedAccountId: "ca_DHX8YcBgl6j_",
      arguments: {},
      userId: "+8801967803596",
      dangerouslySkipVersionCheck: true,
    });
    console.log("Success:", JSON.stringify(response, null, 2));
  } catch(e) {
    console.log("Error name:", e.name);
    console.log("Error message:", e.message);
    if(e.response) console.log("Error details:", JSON.stringify(e.response.data, null, 2));
  }
}
test();
