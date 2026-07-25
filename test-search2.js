require('dotenv').config({ path: '.env.local' });
const { Composio } = require('@composio/core');

async function test() {
  try {
    const composio = new Composio({ apiKey: process.env.NEXT_PUBLIC_COMPOSIO_API_KEY });
    const response = await composio.tools.execute("GMAIL_FETCH_EMAILS", {
      connectedAccountId: "ca_1E95df1O-7FV",
      arguments: { q: "Shihab" },
      userId: "voicemail-user",
      dangerouslySkipVersionCheck: true,
    });
    console.log(response.data.messages.length);
    console.log(response.data.messages[0].subject);
  } catch(e) {}
}
test();
