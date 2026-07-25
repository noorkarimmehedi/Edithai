const { OpenAI, toFile } = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function run() {
  try {
    const url = "https://storage.googleapis.com/inbound-file-store/29kVg2kr_Audio%20Message.caf";
    const res = await fetch(url);
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log("Trying as .m4a...");
    try {
      const file1 = await toFile(buffer, 'audio.m4a');
      const t1 = await openai.audio.transcriptions.create({ file: file1, model: 'whisper-1' });
      console.log("Success with m4a:", t1.text);
      return;
    } catch(e) { console.log("Failed m4a:", e.message); }

    console.log("Trying as .webm...");
    try {
      const file2 = await toFile(buffer, 'audio.webm');
      const t2 = await openai.audio.transcriptions.create({ file: file2, model: 'whisper-1' });
      console.log("Success with webm:", t2.text);
      return;
    } catch(e) { console.log("Failed webm:", e.message); }
    
  } catch(e) {
    console.log(e);
  }
}
run();
