const { ConvexHttpClient } = require("convex/browser");
const convex = new ConvexHttpClient("https://bright-jaguar-418.convex.cloud");

async function check() {
  const { api } = require("./convex/_generated/api");
  const history = await convex.query(api.users.getMessages, { phoneNumber: "+8801967803596" });
  console.log(JSON.stringify(history, null, 2));
}
check();
