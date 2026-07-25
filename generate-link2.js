require('dotenv').config({ path: '.env.local' });
const { Composio } = require('@composio/core');

async function getLink() {
  const composio = new Composio({ apiKey: process.env.NEXT_PUBLIC_COMPOSIO_API_KEY });
  
  // Wipe all existing connections for voicemail-user to ensure a clean slate
  const accounts = await composio.connectedAccounts.list({ userIds: ["voicemail-user"] });
  for (const acc of accounts.items) {
    try {
      console.log("Removing old account:", acc.id);
      await composio.connectedAccounts.delete(acc.id);
    } catch(e) {}
  }

  // Get auth config
  const authConfigs = await composio.authConfigs.list({ toolkit: "gmail" });
  if (!authConfigs.items || authConfigs.items.length === 0) {
    console.log("No auth config found for Gmail on your Composio account!");
    return;
  }
  
  const authConfig = authConfigs.items[0];
  
  // Generate a brand new, clean link
  const connectionRequest = await composio.connectedAccounts.link(
    "voicemail-user",
    authConfig.id,
    { allowMultiple: false }
  );
  
  console.log("---");
  console.log("CLICK THIS LINK TO RE-AUTHENTICATE GMAIL:");
  console.log(connectionRequest.redirectUrl);
  console.log("---");
}
getLink();
