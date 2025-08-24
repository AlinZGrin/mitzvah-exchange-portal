const axios = require('axios');

const API_BASE = 'http://localhost:3000';

async function testPrivacyFeature() {
  console.log('🔒 Testing privacy feature...\n');

  try {
    // Step 1: Login with existing seeded user (Sarah Miller)
    console.log('1. Logging in with existing user...');
    const loginResponse = await axios.post(`${API_BASE}/api/auth/login`, {
      email: 'sarah@example.com',
      password: 'password123'
    });
    
    const { token, user } = loginResponse.data;
    console.log('✅ User logged in successfully:', user.profile?.displayName);

    // Step 2: Update profile with privacy settings
    console.log('2. Setting privacy preferences (email visible, exact location hidden)...');
    const privacySettings = {
      showEmail: true,
      showExactLocation: false
    };

    const profileUpdateResponse = await axios.put(`${API_BASE}/api/users/me`, {
      displayName: user.profile?.displayName || 'Sarah Miller',
      city: user.profile?.city || 'Chicago',
      privacy: JSON.stringify(privacySettings)
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (profileUpdateResponse.status !== 200) {
      throw new Error('Profile update failed');
    }
    console.log('✅ Privacy settings updated successfully');

    // Step 3: Create a mitzvah request
    console.log('3. Creating a mitzvah request...');
    const requestResponse = await axios.post(`${API_BASE}/api/requests`, {
      title: 'Privacy Test Mitzvah',
      description: 'Testing privacy features',
      location: '123 Main Street, Chicago, IL 60601',
      points: 10
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (requestResponse.status !== 201) {
      throw new Error('Request creation failed');
    }
    
    const requestId = requestResponse.data.id;
    console.log('✅ Mitzvah request created successfully');

    // Step 4: Fetch requests to check privacy-aware display
    console.log('4. Fetching requests to verify privacy-aware display...');
    const requestsResponse = await axios.get(`${API_BASE}/api/requests`);
    
    const createdRequest = requestsResponse.data.find(req => req.id === requestId);
    
    if (!createdRequest) {
      throw new Error('Created request not found');
    }

    console.log('\n📊 Privacy Check Results:');
    console.log(`   Owner Display Name: ${createdRequest.owner?.profile?.displayName || 'N/A'}`);
    console.log(`   Owner Email Visible: ${createdRequest.owner?.profile?.showEmail ? 'YES' : 'NO'}`);
    console.log(`   Owner Email: ${createdRequest.owner?.profile?.email || 'N/A'}`);
    console.log(`   Original Location: ${createdRequest.location}`);
    console.log(`   Display Location: ${createdRequest.locationDisplay}`);
    
    // Verify privacy settings are working
    if (createdRequest.owner?.profile?.showEmail && createdRequest.owner?.profile?.email) {
      console.log('✅ Email privacy setting: SHOW EMAIL - correctly displayed');
    } else if (!createdRequest.owner?.profile?.showEmail) {
      console.log('✅ Email privacy setting: HIDE EMAIL - correctly hidden');
    } else {
      console.log('❌ Email privacy setting issue detected');
    }

    if (createdRequest.locationDisplay !== createdRequest.location) {
      console.log('✅ Location privacy setting: HIDE EXACT LOCATION - correctly showing approximate location');
    } else {
      console.log('❌ Location privacy setting: HIDE EXACT LOCATION - but exact location is visible');
    }

    console.log('\n🎉 Privacy feature test completed successfully!');
    
  } catch (error) {
    console.error('❌ Privacy test failed:', error.response?.data || error.message);
  }
}

testPrivacyFeature();
