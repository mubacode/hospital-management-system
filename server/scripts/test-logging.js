const http = require('http');

const runTest = async () => {
  // We use require to load the app, which starts it because of index.js.
  // We need to set NODE_ENV to production to test the JSON formatting to file.
  process.env.NODE_ENV = 'production';
  const app = require('../index');
  const PORT = process.env.PORT || 5000;

  console.log('Testing normal HTTP request...');
  await new Promise((resolve) => {
    http.get(`http://localhost:${PORT}/api/auth/login`, (res) => {
      console.log(`Status: ${res.statusCode}`);
      resolve();
    }).on('error', (e) => {
      console.error(`Got error: ${e.message}`);
      resolve();
    });
  });

  console.log('Simulating an unhandled rejection...');
  // This will trigger the global handler and shut down the server
  Promise.reject(new Error('This is a test unhandled promise rejection'));

  // Give it a second to flush logs and exit
  setTimeout(() => {
    console.log('Test complete (if it hasn\'t exited yet)');
  }, 1000);
};

runTest();
