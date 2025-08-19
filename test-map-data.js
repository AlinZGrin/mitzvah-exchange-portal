const axios = require('axios');

async function testMapData() {
  try {
    console.log('Testing map data retrieval...');
    
    // Test getting requests from the API
    const response = await axios.get('http://localhost:3000/api/requests');
    
    console.log('✅ Requests API successful');
    console.log('Number of requests:', response.data.requests.length);
    console.log('Total available:', response.data.total);
    
    // Show sample request data for map
    if (response.data.requests.length > 0) {
      const sampleRequest = response.data.requests[0];
      console.log('\nSample request for map:');
      console.log('- Title:', sampleRequest.title);
      console.log('- Location:', sampleRequest.locationDisplay);
      console.log('- Category:', sampleRequest.category);
      console.log('- Urgency:', sampleRequest.urgency);
      console.log('- Status:', sampleRequest.status);
    }
    
  } catch (error) {
    console.error('❌ Map data test failed:', error.response?.data || error.message);
  }
}

testMapData();
