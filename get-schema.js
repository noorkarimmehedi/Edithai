const { Composio } = require("@composio/core");
const composio = new Composio({ apiKey: process.env.NEXT_PUBLIC_COMPOSIO_API_KEY });
async function test() {
  try {
    const res = await fetch("https://backend.composio.dev/api/v1/actions/GOOGLECALENDAR_UPDATE_EVENT", {
      headers: { "x-api-key": process.env.NEXT_PUBLIC_COMPOSIO_API_KEY }
    });
    const data = await res.json();
    console.log(JSON.stringify(data.parameters, null, 2));
  } catch (e) {
    console.log(e);
  }
}
test();
