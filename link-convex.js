require('dotenv').config({ path: '.env.local' });
const { Composio } = require('@composio/core');
const { ConvexHttpClient } = require('convex/browser');
const { api } = require('./convex/_generated/api');

async function link() {
  const composio = new Composio({ apiKey: process.env.NEXT_PUBLIC_COMPOSIO_API_KEY });
  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);
  
  try {
    const accounts = await composio.connectedAccounts.list({
      userIds: ["voicemail-user"],
      statuses: ["ACTIVE"],
    });
    
    if (accounts.items.length === 0) {
      console.log("No active Composio accounts found.");
      return;
    }
    
    const activeId = accounts.items[0].id;
    console.log("Found Active Composio Connection ID:", activeId);
    
    await convex.mutation(api.users.saveUser, {
      phoneNumber: "+8801967803596",
      composioConnectionId: activeId
    });
    
    console.log("Successfully linked to Convex!");
  } catch(e) {
    console.error(e);
  }
}
link();
