require('dotenv').config({ path: '.env.local' });
const { Composio } = require('@composio/core');

async function test() {
  try {
    const composio = new Composio({ apiKey: process.env.NEXT_PUBLIC_COMPOSIO_API_KEY });
    const response = await composio.tools.execute("GMAIL_FETCH_EMAILS", {
      connectedAccountId: "ca_1E95df1O-7FV",
      arguments: { query: "Shihab" },
      userId: "voicemail-user",
      dangerouslySkipVersionCheck: true,
    });
    console.log("Success:", JSON.stringify(response, null, 2));
  } catch(e) {
    console.log(e.response ? e.response.data : e.message);
  }
}
test();
