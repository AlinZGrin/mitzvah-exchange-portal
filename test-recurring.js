// Test script for recurring mitzvah requests
const BASE_URL = 'http://localhost:3000';

async function testRecurringRequest() {
  console.log('🧪 Testing recurring mitzvah request functionality...\n');

  try {
    // First, login to get a token
    console.log('1. Logging in...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@test.com',
        password: 'password123'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status} - ${await loginResponse.text()}`);
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login successful');

    // Create a recurring request
    console.log('\n2. Creating recurring mitzvah request...');
    const requestData = {
      title: 'Weekly Grocery Shopping Help',
      description: 'I need help with grocery shopping every week. This is a recurring need.',
      category: 'ERRANDS',
      urgency: 'NORMAL',
      locationDisplay: 'Anytown, USA',
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
      title: 'Bi-weekly Tech Support',
      description: 'I need help with computer issues every 10 days.',
      category: 'TECHNOLOGY',
      urgency: 'NORMAL',
      locationDisplay: 'Anytown, USA',
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
      locationDisplay: 'Anytown, USA',
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

    console.log('\n🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testRecurringRequest();
}

module.exports = { testRecurringRequest };
