require('dotenv').config({ path: __dirname + '/.env' });
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
async function test() {
  try {
    const chat = model.startChat({});
    const result = await chat.sendMessage("hello");
    console.log("Success:", result.response.text());
  } catch(e) {
    console.error("Error:", e.message);
  }
}
test();
