require('dotenv').config({ path: '.env.local' });
fetch("https://api.sendblue.co/api/send-message", {
  method: "POST",
  headers: {
    "sb-api-key-id": process.env.SENDBLUE_API_KEY,
    "sb-api-secret-key": process.env.SENDBLUE_API_SECRET,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    number: "+8801967803596",
    content: "This is a direct API test from the server to verify outbound works.",
    from_number: process.env.SENDBLUE_FROM_NUMBER
  }),
}).then(async r => {
  console.log("Status:", r.status);
  console.log("Body:", await r.text());
}).catch(console.error);
