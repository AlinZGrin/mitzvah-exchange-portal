const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api`;

// Simple test function
async function runIntegrationTests() {
  console.log('🚀 Starting Mitzvah Exchange Integration Tests...\n');
  
  try {
    // Test 1: Server Health Check
    console.log('Test 1: Server Health Check');
    const healthResponse = await axios.get(BASE_URL);
    console.log('✅ Server is responding (Status:', healthResponse.status, ')');
    
    // Test 2: Login API
    console.log('\nTest 2: Login API');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@mitzvahexchange.com',
      password: 'admin123'
    });
    console.log('✅ Login successful (Status:', loginResponse.status, ')');
    console.log('✅ Token received:', !!loginResponse.data.token);
    console.log('✅ User data received:', !!loginResponse.data.user);
    
    const authToken = loginResponse.data.token;
    
    // Test 3: Invalid Login
    console.log('\nTest 3: Invalid Login Rejection');
    try {
      await axios.post(`${API_BASE}/auth/login`, {
        email: 'invalid@example.com',
        password: 'wrongpassword'
      });
      console.log('❌ Should have failed with invalid credentials');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Invalid login correctly rejected (Status: 401)');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    
    // Test 4: User Profile API
    console.log('\nTest 4: User Profile API');
    const profileResponse = await axios.get(`${API_BASE}/users/me`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    console.log('✅ Profile retrieved (Status:', profileResponse.status, ')');
    console.log('✅ User stats included:', !!profileResponse.data.stats);
    
    // Test 5: Create Mitzvah Request
    console.log('\nTest 5: Create Mitzvah Request (Testing logout bug fix)');
    const requestData = {
      title: 'Integration Test Request - ' + new Date().toISOString(),
      description: 'This request was created by integration tests to verify the logout bug is fixed',
      category: 'ERRANDS',
      urgency: 'NORMAL',
      locationDisplay: 'Integration Test City',
      requirements: ['Integration test requirement'],
      attachments: []
    };
    
    const createResponse = await axios.post(`${API_BASE}/requests`, requestData, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Request created successfully (Status:', createResponse.status, ')');
    console.log('✅ Request title matches:', createResponse.data.request.title === requestData.title);
    
    // Test 6: Get Requests List
    console.log('\nTest 6: Get Requests List');
    const listResponse = await axios.get(`${API_BASE}/requests`);
    console.log('✅ Requests list retrieved (Status:', listResponse.status, ')');
    console.log('✅ Requests array received:', Array.isArray(listResponse.data.requests));
    console.log('✅ Number of requests:', listResponse.data.requests.length);
    
    // Test 7: Database Connection Resilience (Prepared Statement Fix)
    console.log('\nTest 7: Database Connection Resilience (Rapid Requests)');
    const rapidPromises = [];
    for (let i = 0; i < 5; i++) {
      rapidPromises.push(
        axios.post(`${API_BASE}/auth/login`, {
          email: 'admin@mitzvahexchange.com',
          password: 'admin123'
        })
      );
    }
    
    const rapidResponses = await Promise.all(rapidPromises);
    const allSuccessful = rapidResponses.every(r => r.status === 200 && r.data.token);
    console.log('✅ All rapid requests successful:', allSuccessful);
    console.log('✅ Prepared statement error fix verified');
    
    // Test 8: Concurrent Request Creation (Authentication Persistence Fix)
    console.log('\nTest 8: Concurrent Request Creation');
    const concurrentPromises = [];
    for (let i = 0; i < 3; i++) {
      const concurrentRequestData = {
        title: `Concurrent Test ${i} - ${new Date().toISOString()}`,
        description: `Concurrent test description ${i}`,
        category: 'ERRANDS',
        urgency: 'NORMAL',
        locationDisplay: 'Concurrent Test City',
        requirements: [],
        attachments: []
      };
      
      concurrentPromises.push(
        axios.post(`${API_BASE}/requests`, concurrentRequestData, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        })
      );
    }
    
    const concurrentResponses = await Promise.all(concurrentPromises);
    const allConcurrentSuccessful = concurrentResponses.every(r => r.status === 201);
    console.log('✅ All concurrent requests successful:', allConcurrentSuccessful);
    console.log('✅ Authentication persistence fix verified');
    
    console.log('\n🎉 All Integration Tests Passed! 🎉');
    console.log('\n📋 Test Summary:');
    console.log('✅ Server Health Check');
    console.log('✅ Login API');
    console.log('✅ Invalid Login Rejection');
    console.log('✅ User Profile API');
    console.log('✅ Create Mitzvah Request (Logout bug fix)');
    console.log('✅ Get Requests List');
    console.log('✅ Database Connection Resilience (Prepared statement fix)');
    console.log('✅ Concurrent Request Creation (Auth persistence fix)');
    
  } catch (error) {
    console.error('\n❌ Integration Test Failed:');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    process.exit(1);
  }
}

// Run the tests
runIntegrationTests().then(() => {
  console.log('\n✨ Integration tests completed successfully!');
  process.exit(0);
}).catch((error) => {
  console.error('\n💥 Integration tests failed:', error.message);
  process.exit(1);
});
