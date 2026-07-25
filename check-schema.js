require('dotenv').config({ path: '.env.local' });
const { Composio } = require('@composio/core');

async function test() {
  const composio = new Composio({ apiKey: process.env.NEXT_PUBLIC_COMPOSIO_API_KEY });
  const action = await composio.actions.get("GMAIL_FETCH_EMAILS");
  console.log(JSON.stringify(action.parameters, null, 2));
}
test();
