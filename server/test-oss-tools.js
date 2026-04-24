require('dotenv').config({ path: __dirname + '/.env' });
const OpenAI = require('openai');
const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY
});

async function testTools() {
  try {
    const response = await openai.chat.completions.create({
      model: 'openai/gpt-oss-120b:free',
      messages: [{ role: 'user', content: 'What clinics do you have?' }],
      tools: [{
        type: 'function',
        function: {
          name: 'get_clinics',
          description: 'Get a list of clinics.',
          parameters: { type: 'object', properties: {} }
        }
      }]
    });
    console.log("SUCCESS");
    console.log(response.choices[0].message);
  } catch(e) {
    console.log("ERROR TRACE:");
    console.log(e.message);
  }
}
testTools();
