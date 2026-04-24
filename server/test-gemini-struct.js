require('dotenv').config({ path: __dirname + '/.env' });
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
async function test() {
  const chat = model.startChat({});
  const result = await chat.sendMessage("hello");
  console.log("has response?", !!result.response);
  console.log("is text a function on response?", typeof result.response.text === 'function');
  console.log("is functionCalls a function on response?", typeof result.response.functionCalls === 'function');
}
test();
