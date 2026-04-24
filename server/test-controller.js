require('dotenv').config({ path: __dirname + '/.env' });
const controller = require('./controllers/chatbotController');

// Mock req and res
const req = {
  user: { id: 1 },
  body: { message: "Hello, what clinics do you have?" }
};

const res = {
  status: function(code) { console.log('Status:', code); return this; },
  json: function(data) { console.log('Response JSON:', data); }
};

async function test() {
  await controller.processMessage(req, res);
}

test();
