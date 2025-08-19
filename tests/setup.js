// Global test setup
const axios = require('axios');

// Set default timeout for all tests
jest.setTimeout(30000);

// Configure axios defaults
axios.defaults.timeout = 10000;

// Global beforeAll
beforeAll(async () => {
  console.log('🚀 Starting integration tests...');
  
  // Wait for server to be ready
  let serverReady = false;
  let attempts = 0;
  const maxAttempts = 30;
  
  while (!serverReady && attempts < maxAttempts) {
    try {
      await axios.get('http://localhost:3000');
      serverReady = true;
      console.log('✅ Server is ready');
    } catch (error) {
      attempts++;
      console.log(`⏳ Waiting for server... (${attempts}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  if (!serverReady) {
    throw new Error('❌ Server failed to start within expected time');
  }
});

// Global afterAll
afterAll(async () => {
  console.log('🏁 Integration tests completed');
});

// Global error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

module.exports = {};
