const axios = require('axios');

const API_BASE = 'http://localhost:3000';

async function testPrivacySettings() {
  console.log('🔒 Testing profile privacy settings...\n');

  try {
    // Test login with a known user (from seed data)
    console.log('1. Attempting login with seed user...');
    
    // Try multiple seed users
    const seedUsers = [
      { email: 'sarah@example.com', name: 'Sarah Miller' },
      { email: 'david@example.com', name: 'David Cohen' },
      { email: 'admin@example.com', name: 'Admin User' }
    ];
    
    let loggedInUser = null;
    let token = null;
    
    for (const testUser of seedUsers) {
      try {
        const loginResponse = await axios.post(`${API_BASE}/api/auth/login`, {
          email: testUser.email,
          password: 'password123'
        });
        
        token = loginResponse.data.token;
        loggedInUser = loginResponse.data.user;
        console.log(`✅ Successfully logged in as: ${testUser.name} (${testUser.email})`);
        break;
      } catch (error) {
        console.log(`❌ Failed to login as ${testUser.email}`);
      }
    }
    
    if (!loggedInUser || !token) {
      console.log('❌ Could not login with any seed user. Creating a new user...');
      
      // Create a new user for testing
      const timestamp = Date.now();
      const email = `test-privacy-${timestamp}@example.com`;
      
      const registerResponse = await axios.post(`${API_BASE}/api/auth/register`, {
        email: email,
        password: 'password123',
        displayName: 'Privacy Test User',
        city: 'Test City'
      });
      
      console.log('✅ User registered. Note: Email verification required for full functionality.');
      return;
    }

    // Test getting current profile
    console.log('\n2. Getting current profile...');
    const profileResponse = await axios.get(`${API_BASE}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const currentProfile = profileResponse.data.profile;
    console.log('Current privacy settings:', currentProfile.privacy);

    // Test updating privacy settings
    console.log('\n3. Updating privacy settings...');
    const newPrivacySettings = {
      showEmail: true,
      showExactLocation: true
    };
    
    const updateResponse = await axios.put(`${API_BASE}/api/users/me`, {
      displayName: currentProfile.displayName,
      bio: currentProfile.bio,
      city: currentProfile.city,
      languages: currentProfile.languages,
      skills: currentProfile.skills,
      privacy: newPrivacySettings
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Privacy settings updated successfully');
    console.log('New privacy settings:', updateResponse.data.profile.privacy);

    // Test creating a request to see if privacy is applied
    console.log('\n4. Creating a test request...');
    const requestResponse = await axios.post(`${API_BASE}/api/requests`, {
      title: 'Privacy Test Request',
      description: 'Testing privacy settings display',
      location: '123 Exact Address Street, Miami, FL 33101',
      points: 5
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Test request created');

    // Test fetching requests to see privacy-aware display
    console.log('\n5. Checking privacy-aware display in requests...');
    const requestsResponse = await axios.get(`${API_BASE}/api/requests`);
    
    const testRequest = requestsResponse.data.requests.find(req => req.title === 'Privacy Test Request');
    
    if (testRequest) {
      console.log('\n📊 Privacy Test Results:');
      console.log(`   Request Title: ${testRequest.title}`);
      console.log(`   Owner: ${testRequest.owner?.profile?.displayName}`);
      console.log(`   Email Visible: ${testRequest.owner?.profile?.showEmail ? 'YES' : 'NO'}`);
      console.log(`   Email Value: ${testRequest.owner?.profile?.email || 'NULL'}`);
      console.log(`   Show Exact Location: ${testRequest.owner?.profile?.privacy ? JSON.parse(testRequest.owner.profile.privacy).showExactLocation : 'UNKNOWN'}`);
      console.log(`   Original Location: ${testRequest.location || 'NULL'}`);
      console.log(`   Display Location: ${testRequest.locationDisplay}`);
      
      // Verify privacy settings work
      const ownerPrivacy = testRequest.owner?.profile?.privacy ? JSON.parse(testRequest.owner.profile.privacy) : {};
      
      if (ownerPrivacy.showEmail && testRequest.owner?.profile?.email) {
        console.log('✅ Email privacy: WORKING (email shown because showEmail=true)');
      } else if (!ownerPrivacy.showEmail && !testRequest.owner?.profile?.email) {
        console.log('✅ Email privacy: WORKING (email hidden because showEmail=false)');
      } else {
        console.log('❌ Email privacy: NOT WORKING');
      }
      
      if (ownerPrivacy.showExactLocation && testRequest.location) {
        console.log('✅ Location privacy: WORKING (exact location available because showExactLocation=true)');
      } else if (!ownerPrivacy.showExactLocation && !testRequest.location) {
        console.log('✅ Location privacy: WORKING (exact location hidden because showExactLocation=false)');
      } else {
        console.log('❌ Location privacy: NEEDS VERIFICATION');
      }
    }

    console.log('\n🎉 Privacy settings test completed!');
    
  } catch (error) {
    console.error('❌ Privacy test failed:', error.response?.data || error.message);
  }
}

testPrivacySettings();
