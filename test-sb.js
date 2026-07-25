require('dotenv').config({ path: '.env.local' });
fetch("https://api.sendblue.co/api/send-message", {
  method: "POST",
  headers: {
    "sb-api-key-id": process.env.SENDBLUE_API_KEY,
    "sb-api-secret-key": process.env.SENDBLUE_API_SECRET,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    number: process.env.SENDBLUE_FROM_NUMBER,
    content: "Testing script",
  }),
}).then(async r => {
  console.log(r.status);
  console.log(await r.text());
}).catch(console.error);
