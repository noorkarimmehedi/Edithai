require('dotenv').config({ path: '.env.local' });
const { Composio } = require('@composio/core');

async function getLink() {
  const composio = new Composio({ apiKey: process.env.NEXT_PUBLIC_COMPOSIO_API_KEY });
  const authConfigs = await composio.authConfigs.list({ toolkit: "gmail" });
  if (!authConfigs.items || authConfigs.items.length === 0) {
    console.log("No auth config found for Gmail on your Composio account!");
    return;
  }
  
  const authConfig = authConfigs.items[0];
  
  const connectionRequest = await composio.connectedAccounts.link(
    "voicemail-user",
    authConfig.id,
    { allowMultiple: false } // Force replacing the old one
  );
  
  console.log("---");
  console.log("CLICK THIS LINK TO RE-AUTHENTICATE GMAIL:");
  console.log(connectionRequest.redirectUrl);
  console.log("---");
}
getLink();
