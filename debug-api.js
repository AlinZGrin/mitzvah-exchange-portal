const axios = require('axios');

const API_BASE = 'http://localhost:3000';

async function checkAPIResponse() {
  console.log('🔍 Checking API response structure...\n');

  try {
    const response = await axios.get(`${API_BASE}/api/requests`);
    
    console.log('Status:', response.status);
    console.log('Response type:', typeof response.data);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ API test failed:', error.response?.data || error.message);
    console.log('Status:', error.response?.status);
  }
}

checkAPIResponse();
