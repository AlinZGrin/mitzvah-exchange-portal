const axios = require('axios');

async function simpleTest() {
  console.log('Testing server connection...');
  
  try {
    // Test basic connectivity
    const response = await axios.get('http://localhost:3000', { timeout: 5000 });
    console.log('✅ Server responded with status:', response.status);
    
    // Test login API
    console.log('\nTesting login API...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@mitzvahexchange.com',
      password: 'admin123'
    }, { timeout: 10000 });
    
    console.log('✅ Login API responded with status:', loginResponse.status);
    console.log('✅ Token present:', !!loginResponse.data.token);
    
    if (loginResponse.data.token) {
      // Test creating a request
      console.log('\nTesting request creation...');
      const requestResponse = await axios.post('http://localhost:3000/api/requests', {
        title: 'Simple Integration Test',
        description: 'Testing the create request functionality',
        category: 'ERRANDS',
        urgency: 'NORMAL',
        locationDisplay: 'Test Location'
      }, {
        headers: {
          'Authorization': `Bearer ${loginResponse.data.token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      console.log('✅ Request creation responded with status:', requestResponse.status);
      console.log('✅ All core functionality working!');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

simpleTest();
