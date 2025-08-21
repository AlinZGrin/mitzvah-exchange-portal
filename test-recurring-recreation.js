// Test script for recurring mitzvah auto-recreation
const BASE_URL = 'http://localhost:3000';

async function testRecurringAutoRecreation() {
  console.log('🧪 Testing recurring mitzvah auto-recreation...\n');

  try {
    // Register two test users (one requester, one helper)
    console.log('1. Registering test users...');
    const requesterEmail = `requester-${Date.now()}@example.com`;
    const helperEmail = `helper-${Date.now()}@example.com`;
    
    // Register requester
    const requesterResponse = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: requesterEmail,
        password: 'Password123!',
        displayName: 'Test Requester',
        bio: 'Testing recurring requests',
        city: 'Test City'
      })
    });

    if (!requesterResponse.ok) {
      throw new Error(`Requester registration failed: ${requesterResponse.status}`);
    }

    const requesterData = await requesterResponse.json();
    const requesterToken = requesterData.token;
    console.log('✅ Requester registered');

    // Register helper
    const helperResponse = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: helperEmail,
        password: 'Password123!',
        displayName: 'Test Helper',
        bio: 'Testing completion flow',
        city: 'Test City'
      })
    });

    if (!helperResponse.ok) {
      throw new Error(`Helper registration failed: ${helperResponse.status}`);
    }

    const helperData = await helperResponse.json();
    const helperToken = helperData.token;
    console.log('✅ Helper registered');

    // Create a recurring request
    console.log('\n2. Creating recurring mitzvah request...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const requestData = {
      title: 'Weekly Test Recurring Task',
      description: 'This is a test recurring task that should auto-recreate.',
      category: 'OTHER',
      urgency: 'NORMAL',
      locationDisplay: 'Test City, USA',
      requirements: [],
      isRecurring: true,
      recurrenceType: 'WEEKLY',
      timeWindowStart: tomorrow.toISOString().split('.')[0]
    };

    const createResponse = await fetch(`${BASE_URL}/api/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${requesterToken}`
      },
      body: JSON.stringify(requestData)
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`Create request failed: ${createResponse.status} - ${errorText}`);
    }

    const createData = await createResponse.json();
    const requestId = createData.request.id;
    console.log('✅ Recurring request created:', requestId);

    // Helper claims the request
    console.log('\n3. Helper claiming the request...');
    const claimResponse = await fetch(`${BASE_URL}/api/requests/${requestId}/claim`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${helperToken}`
      }
    });

    if (!claimResponse.ok) {
      const errorText = await claimResponse.text();
      throw new Error(`Claim failed: ${claimResponse.status} - ${errorText}`);
    }

    const claimData = await claimResponse.json();
    const assignmentId = claimData.assignment.id;
    console.log('✅ Request claimed, assignment ID:', assignmentId);

    // Helper marks as complete
    console.log('\n4. Helper marking task as complete...');
    const completeResponse = await fetch(`${BASE_URL}/api/assignments/${assignmentId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${helperToken}`
      },
      body: JSON.stringify({
        notes: 'Completed the test task successfully!'
      })
    });

    if (!completeResponse.ok) {
      const errorText = await completeResponse.text();
      throw new Error(`Complete failed: ${completeResponse.status} - ${errorText}`);
    }

    console.log('✅ Task marked as complete');

    // Requester confirms completion
    console.log('\n5. Requester confirming completion...');
    const confirmResponse = await fetch(`${BASE_URL}/api/assignments/${assignmentId}/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${requesterToken}`
      },
      body: JSON.stringify({
        rating: 5,
        review: 'Great job on this recurring task!'
      })
    });

    if (!confirmResponse.ok) {
      const errorText = await confirmResponse.text();
      throw new Error(`Confirm failed: ${confirmResponse.status} - ${errorText}`);
    }

    console.log('✅ Task confirmed');

    // Check if a new recurring request was created
    console.log('\n6. Checking for new recurring request...');
    const fetchResponse = await fetch(`${BASE_URL}/api/requests`, {
      headers: {
        'Authorization': `Bearer ${requesterToken}`
      }
    });

    if (!fetchResponse.ok) {
      throw new Error(`Fetch requests failed: ${fetchResponse.status}`);
    }

    const fetchData = await fetchResponse.json();
    const openRecurringRequests = fetchData.requests.filter(r => 
      r.title === 'Weekly Test Recurring Task' && 
      r.status === 'OPEN'
    );

    if (openRecurringRequests.length > 0) {
      console.log('🎉 SUCCESS! New recurring request was automatically created!');
      console.log(`   Found ${openRecurringRequests.length} open recurring request(s)`);
      openRecurringRequests.forEach((req, index) => {
        console.log(`   ${index + 1}. ID: ${req.id}, Status: ${req.status}, Created: ${req.createdAt}`);
      });
    } else {
      console.log('❌ FAILED: No new recurring request was created automatically');
    }

    console.log('\n🎉 Test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testRecurringAutoRecreation();
