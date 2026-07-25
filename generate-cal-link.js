require('dotenv').config({ path: '.env.local' });
const { Composio } = require('@composio/core');

async function getLink() {
  const composio = new Composio({ apiKey: process.env.NEXT_PUBLIC_COMPOSIO_API_KEY });
  
  // Get auth config for calendar
  const authConfigs = await composio.authConfigs.list({ toolkit: "googlecalendar" });
  if (!authConfigs.items || authConfigs.items.length === 0) {
    console.log("No auth config found for Google Calendar!");
    return;
  }
  
  const authConfig = authConfigs.items[0];
  
  const connectionRequest = await composio.connectedAccounts.link(
    "voicemail-user",
    authConfig.id,
    { allowMultiple: false }
  );
  
  console.log("---");
  console.log("CLICK THIS LINK TO AUTHENTICATE GOOGLE CALENDAR:");
  console.log(connectionRequest.redirectUrl);
  console.log("---");
}
getLink();
