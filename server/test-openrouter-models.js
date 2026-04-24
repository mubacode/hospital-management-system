require('dotenv').config({ path: __dirname + '/.env' });
const OpenAI = require('openai');
const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY
});

const modelsToTest = [
  'meta-llama/llama-3.1-8b-instruct:free',
  'google/gemma-2-9b-it:free',
  'huggingfaceh4/zephyr-7b-beta:free',
  'qwen/qwen-2.5-72b-instruct:free',
  'sophosympatheia/rogue-rose-103b-v0.2:free'
];

async function testModels() {
  for (const model of modelsToTest) {
    try {
      console.log(`\nTesting ${model}...`);
      const response = await openai.chat.completions.create({
        model: model,
        messages: [{ role: 'user', content: 'Say hello.' }]
      });
      console.log(`SUCCESS: ${model}`);
      return; // Stop at first success
    } catch(e) {
      console.log(`FAIL: ${model} - ${e.status} ${e.message}`);
    }
  }
}
testModels();
