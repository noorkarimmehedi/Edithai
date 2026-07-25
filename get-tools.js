require('dotenv').config({ path: '.env.local' });
const { Composio } = require('@composio/core');

async function test() {
  const composio = new Composio({ apiKey: process.env.NEXT_PUBLIC_COMPOSIO_API_KEY });
  const tools = await composio.tools.get({ apps: ["gmail"] });
  console.log(JSON.stringify(tools, null, 2));
}
test();
