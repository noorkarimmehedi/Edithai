require('dotenv').config({ path: '.env.local' });
const { Composio } = require('@composio/core');

async function test() {
  try {
    const composio = new Composio({ apiKey: process.env.NEXT_PUBLIC_COMPOSIO_API_KEY });
    const response = await composio.tools.execute("GMAIL_FETCH_EMAILS", {
      connectedAccountId: "ca_1E95df1O-7FV",
      arguments: {},
      userId: "+8801967803596",
      dangerouslySkipVersionCheck: true,
    });
    console.log("Success:", JSON.stringify(response, null, 2));
  } catch(e) {
    console.log("Error object keys:", Object.keys(e));
    console.log("Error code:", e.code);
    console.log("Error message:", e.message);
    if(e.response) console.log("Response data:", e.response.data);
    if(e.details) console.log("Details:", e.details);
    console.log(e);
  }
}
test();
