const axios = require('axios');

async function testSessionBehavior() {
  try {
    console.log('Testing session-based authentication behavior...');
    
    // Simulate a fresh browser session - no stored tokens
    console.log('\n1. Testing fresh session (no tokens)...');
    
    // Try to access protected endpoint without token
    try {
      await axios.get('http://localhost:3000/api/users/me');
      console.log('❌ ERROR: Should not be able to access protected endpoint without token');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Correctly rejected access without token (401)');
      } else {
        console.log('❌ Unexpected error:', error.response?.status || error.message);
      }
    }
    
    // Login and verify token works
    console.log('\n2. Testing login and session token...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'sarah.miller@example.com',
      password: 'password123'
    });
    
    console.log('✅ Login successful, token received');
    
    // Use the token to access protected endpoint
    const userResponse = await axios.get('http://localhost:3000/api/users/me', {
      headers: { 'Authorization': `Bearer ${loginResponse.data.token}` }
    });
    
    console.log('✅ Authenticated request successful');
    console.log('User:', userResponse.data.user.profile.displayName);
    
    // Test logout
    console.log('\n3. Testing logout...');
    await axios.post('http://localhost:3000/api/auth/logout', {}, {
      headers: { 'Authorization': `Bearer ${loginResponse.data.token}` }
    });
    
    console.log('✅ Logout successful');
    
    // Verify token is no longer valid
    console.log('\n4. Testing token after logout...');
    try {
      await axios.get('http://localhost:3000/api/users/me', {
        headers: { 'Authorization': `Bearer ${loginResponse.data.token}` }
      });
      console.log('❌ ERROR: Token should be invalid after logout');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Token correctly invalidated after logout');
      } else {
        console.log('❌ Unexpected error:', error.response?.status || error.message);
      }
    }
    
    console.log('\n✅ Session behavior test completed!');
    console.log('\nNOTE: With sessionStorage, tokens will be cleared when browser is closed.');
    console.log('This means users will need to login again when they open a new browser session.');
    
  } catch (error) {
    console.error('❌ Session behavior test failed:', error.response?.data || error.message);
  }
}

testSessionBehavior();
