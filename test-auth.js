const axios = require('axios');

async function testAuth() {
  try {
    console.log('Testing authentication flow...');
    
    // Test login
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'sarah.miller@example.com',
      password: 'password123'
    });
    
    console.log('✅ Login successful!');
    console.log('Token received:', !!loginResponse.data.token);
    
    // Test getting current user with token
    const userResponse = await axios.get('http://localhost:3000/api/users/me', {
      headers: {
        'Authorization': `Bearer ${loginResponse.data.token}`
      }
    });
    
    console.log('✅ User data retrieved!');
    console.log('User:', userResponse.data.user.profile.displayName);
    console.log('Email:', userResponse.data.user.email);
    
    // Test logout
    const logoutResponse = await axios.post('http://localhost:3000/api/auth/logout', {}, {
      headers: {
        'Authorization': `Bearer ${loginResponse.data.token}`
      }
    });
    
    console.log('✅ Logout successful!');
    
  } catch (error) {
    console.error('❌ Auth test failed:', error.response?.data || error.message);
  }
}

testAuth();
