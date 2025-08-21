// Simplified test for recurring mitzvah requests
const BASE_URL = 'http://localhost:3001';

async function testRecurringRequest() {
  console.log('🧪 Testing recurring mitzvah request functionality...\n');

  try {
    // Register a new test user
    console.log('1. Registering test user...');
    const testEmail = `test-${Date.now()}@example.com`;
    const registerData = {
      email: testEmail,
      password: 'Password123!',
      displayName: 'Test User',
      bio: 'Testing recurring requests',
      city: 'Test City',
      languages: ['English'],
      skills: ['Testing']
    };

    const registerResponse = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerData)
    });

    if (!registerResponse.ok) {
      const errorText = await registerResponse.text();
      throw new Error(`Registration failed: ${registerResponse.status} - ${errorText}`);
    }

    const registerResult = await registerResponse.json();
    const token = registerResult.token;
    console.log('✅ User registered successfully');

    // Create a recurring request
    console.log('\n2. Creating recurring mitzvah request...');
    const requestData = {
      title: 'Weekly Grocery Shopping Help',
      description: 'I need help with grocery shopping every week. This is a recurring need.',
      category: 'ERRANDS',
      urgency: 'NORMAL',
      locationDisplay: 'Test City, USA',
      requirements: ['Must have car/license'],
      isRecurring: true,
      recurrenceType: 'WEEKLY',
      recurrenceEndDate: '2024-12-31'
    };

    const createResponse = await fetch(`${BASE_URL}/api/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestData)
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`Create request failed: ${createResponse.status} - ${errorText}`);
    }

    const createData = await createResponse.json();
    console.log('✅ Recurring request created successfully!');
    console.log('Request ID:', createData.request.id);
    console.log('Is Recurring:', createData.request.isRecurring);
    console.log('Recurrence Type:', createData.request.recurrenceType);
    console.log('Recurrence End Date:', createData.request.recurrenceEndDate);

    // Test with custom interval
    console.log('\n3. Creating custom interval recurring request...');
    const customRequestData = {
      title: 'Every 10 Days Tech Support',
      description: 'I need help with computer issues every 10 days.',
      category: 'TECHNOLOGY',
      urgency: 'NORMAL',
      locationDisplay: 'Test City, USA',
      requirements: ['Experience preferred'],
      isRecurring: true,
      recurrenceType: 'CUSTOM',
      recurrenceInterval: 10
    };

    const customResponse = await fetch(`${BASE_URL}/api/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(customRequestData)
    });

    if (!customResponse.ok) {
      const errorText = await customResponse.text();
      throw new Error(`Create custom request failed: ${customResponse.status} - ${errorText}`);
    }

    const customData = await customResponse.json();
    console.log('✅ Custom interval recurring request created successfully!');
    console.log('Request ID:', customData.request.id);
    console.log('Is Recurring:', customData.request.isRecurring);
    console.log('Recurrence Type:', customData.request.recurrenceType);
    console.log('Recurrence Interval:', customData.request.recurrenceInterval);

    // Test error handling with invalid data
    console.log('\n4. Testing validation...');
    const invalidRequestData = {
      title: 'Invalid Recurring Request',
      description: 'This should fail because recurrenceType is invalid.',
      category: 'OTHER',
      urgency: 'NORMAL',
      locationDisplay: 'Test City, USA',
      isRecurring: true,
      recurrenceType: 'INVALID_TYPE'
    };

    const invalidResponse = await fetch(`${BASE_URL}/api/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(invalidRequestData)
    });

    if (invalidResponse.ok) {
      console.log('❌ Expected validation to fail, but it passed');
    } else {
      const errorData = await invalidResponse.json();
      console.log('✅ Validation correctly rejected invalid recurrenceType:', errorData.error);
    }

    // Verify we can fetch the recurring requests
    console.log('\n5. Fetching requests to verify data...');
    const fetchResponse = await fetch(`${BASE_URL}/api/requests`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!fetchResponse.ok) {
      throw new Error(`Fetch requests failed: ${fetchResponse.status}`);
    }

    const fetchData = await fetchResponse.json();
    const recurringRequests = fetchData.requests.filter(r => r.isRecurring);
    console.log(`✅ Found ${recurringRequests.length} recurring requests in database`);
    
    recurringRequests.forEach((req, index) => {
      console.log(`   ${index + 1}. "${req.title}" - ${req.recurrenceType}${req.recurrenceInterval ? ` (every ${req.recurrenceInterval} days)` : ''}`);
    });

    console.log('\n🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testRecurringRequest();
