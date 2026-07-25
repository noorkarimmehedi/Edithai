const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
ffmpeg.setFfmpegPath(ffmpegPath);
const { OpenAI, toFile } = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function run() {
  try {
    const url = "https://storage.googleapis.com/inbound-file-store/29kVg2kr_Audio%20Message.caf";
    const res = await fetch(url);
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Write buffer to temp file
    const tempInput = path.join(__dirname, 'temp.caf');
    const tempOutput = path.join(__dirname, 'temp.mp3');
    fs.writeFileSync(tempInput, buffer);
    
    await new Promise((resolve, reject) => {
      ffmpeg(tempInput)
        .toFormat('mp3')
        .on('end', resolve)
        .on('error', reject)
        .save(tempOutput);
    });
    
    const outputBuffer = fs.readFileSync(tempOutput);
    const file = await toFile(outputBuffer, 'audio.mp3');
    const transcription = await openai.audio.transcriptions.create({ file: file, model: 'whisper-1' });
    console.log("Success with ffmpeg converted mp3:", transcription.text);
    
    fs.unlinkSync(tempInput);
    fs.unlinkSync(tempOutput);
  } catch(e) {
    console.log(e);
  }
}
run();
