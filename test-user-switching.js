const axios = require('axios');

async function testUserSwitching() {
  try {
    console.log('Testing user switching...');
    
    // Login as first user (Sarah)
    console.log('\n1. Logging in as Sarah Miller...');
    const sarahLogin = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'sarah.miller@example.com',
      password: 'password123'
    });
    
    const sarahUser = await axios.get('http://localhost:3000/api/users/me', {
      headers: { 'Authorization': `Bearer ${sarahLogin.data.token}` }
    });
    
    console.log('✅ Sarah logged in:', sarahUser.data.user.profile.displayName);
    console.log('Sarah email:', sarahUser.data.user.email);
    
    // Logout Sarah
    console.log('\n2. Logging out Sarah...');
    await axios.post('http://localhost:3000/api/auth/logout', {}, {
      headers: { 'Authorization': `Bearer ${sarahLogin.data.token}` }
    });
    console.log('✅ Sarah logged out');
    
    // Login as second user (David)
    console.log('\n3. Logging in as David Cohen...');
    const davidLogin = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'david.cohen@example.com',
      password: 'password123'
    });
    
    const davidUser = await axios.get('http://localhost:3000/api/users/me', {
      headers: { 'Authorization': `Bearer ${davidLogin.data.token}` }
    });
    
    console.log('✅ David logged in:', davidUser.data.user.profile.displayName);
    console.log('David email:', davidUser.data.user.email);
    
    // Verify tokens are different
    console.log('\n4. Verifying user data is different...');
    console.log('Sarah ID:', sarahUser.data.user.id);
    console.log('David ID:', davidUser.data.user.id);
    console.log('Tokens are different:', sarahLogin.data.token !== davidLogin.data.token);
    console.log('Users are different:', sarahUser.data.user.id !== davidUser.data.user.id);
    
    console.log('\n✅ User switching test completed successfully!');
    
  } catch (error) {
    console.error('❌ User switching test failed:', error.response?.data || error.message);
  }
}

testUserSwitching();
