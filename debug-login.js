// Debug script to test the login flow step by step
const axios = require('axios');

async function debugLoginFlow() {
  try {
    console.log('🔍 Debugging login flow...');
    
    // Step 1: Ensure we start clean
    console.log('\n1. Checking initial state (should be unauthenticated)...');
    try {
      const initialCheck = await axios.get('http://localhost:3000/api/users/me');
      console.log('❌ WARNING: Already authenticated!', initialCheck.data.user.email);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Starting clean - no authentication');
      } else {
        console.log('❌ Unexpected error:', error.response?.status);
      }
    }
    
    // Step 2: Login
    console.log('\n2. Performing login...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'sarah.miller@example.com',
      password: 'password123'
    });
    
    console.log('✅ Login API call successful');
    console.log('Token received:', !!loginResponse.data.token);
    console.log('Token length:', loginResponse.data.token?.length || 0);
    
    // Step 3: Immediately try to get user data with the new token
    console.log('\n3. Testing immediate user data retrieval...');
    const userResponse = await axios.get('http://localhost:3000/api/users/me', {
      headers: { 'Authorization': `Bearer ${loginResponse.data.token}` }
    });
    
    console.log('✅ User data retrieved immediately after login');
    console.log('User:', userResponse.data.user.profile.displayName);
    console.log('Email:', userResponse.data.user.email);
    console.log('Stats:', userResponse.data.stats);
    
    // Step 4: Test without Authorization header to simulate sessionStorage check
    console.log('\n4. Testing sessionStorage behavior (without explicit token)...');
    try {
      const sessionCheck = await axios.get('http://localhost:3000/api/users/me');
      console.log('❌ ERROR: Should not work without Authorization header');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Correctly requires Authorization header');
        console.log('NOTE: This means the frontend must use the token from sessionStorage');
      }
    }
    
    console.log('\n📋 ANALYSIS:');
    console.log('- Login API works correctly');
    console.log('- Token is valid immediately');
    console.log('- User data can be fetched with token');
    console.log('- The issue is likely in React state management');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.response?.data || error.message);
  }
}

debugLoginFlow();
