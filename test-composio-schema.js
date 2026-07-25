const { Composio } = require("@composio/core");
const composio = new Composio({ apiKey: process.env.NEXT_PUBLIC_COMPOSIO_API_KEY });
async function run() {
  const actions = await composio.actions.list({ actions: ["GOOGLECALENDAR_CREATE_EVENT", "GOOGLECALENDAR_UPDATE_EVENT"] });
  console.log(JSON.stringify(actions, null, 2));
}
run();
