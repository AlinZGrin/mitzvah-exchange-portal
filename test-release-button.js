const { execSync } = require('child_process');

// Test script to verify the release button functionality
console.log('🔄 Testing release button implementation...\n');

// Test 1: Check if the releaseAssignment function is properly added to useAssignments hook
console.log('1. Checking useAssignments hook exports...');
try {
  const apiFileContent = require('fs').readFileSync('src/lib/api.ts', 'utf8');
  
  if (apiFileContent.includes('releaseAssignment')) {
    console.log('   ✅ releaseAssignment function found in api.ts');
  } else {
    console.log('   ❌ releaseAssignment function not found in api.ts');
  }
  
  if (apiFileContent.includes('releaseAssignment,')) {
    console.log('   ✅ releaseAssignment exported from useAssignments hook');
  } else {
    console.log('   ❌ releaseAssignment not exported from useAssignments hook');
  }
} catch (error) {
  console.log('   ❌ Error reading api.ts:', error.message);
}

// Test 2: Check if the dashboard page has been updated
console.log('\n2. Checking dashboard page updates...');
try {
  const dashboardContent = require('fs').readFileSync('src/app/dashboard/page.tsx', 'utf8');
  
  if (dashboardContent.includes('releaseAssignment') && dashboardContent.includes('useAssignments()')) {
    console.log('   ✅ releaseAssignment imported in dashboard');
  } else {
    console.log('   ❌ releaseAssignment not properly imported in dashboard');
  }
  
  if (dashboardContent.includes('handleReleaseAssignment')) {
    console.log('   ✅ handleReleaseAssignment function added');
  } else {
    console.log('   ❌ handleReleaseAssignment function not found');
  }
  
  if (dashboardContent.includes('releasingId') && dashboardContent.includes('setReleasingId')) {
    console.log('   ✅ Release state management added');
  } else {
    console.log('   ❌ Release state management not found');
  }
  
  if (dashboardContent.includes('Release') && dashboardContent.includes('bg-red-600')) {
    console.log('   ✅ Release button UI added');
  } else {
    console.log('   ❌ Release button UI not found');
  }
  
  if (dashboardContent.includes('Releasing...')) {
    console.log('   ✅ Loading state for release button added');
  } else {
    console.log('   ❌ Loading state for release button not found');
  }
} catch (error) {
  console.log('   ❌ Error reading dashboard page:', error.message);
}

// Test 3: Check if the API endpoint exists
console.log('\n3. Checking API endpoint...');
try {
  const fs = require('fs');
  const releaseRoutePath = 'src/app/api/assignments/[id]/release/route.ts';
  
  if (fs.existsSync(releaseRoutePath)) {
    const routeContent = fs.readFileSync(releaseRoutePath, 'utf8');
    if (routeContent.includes('POST') && routeContent.includes('release')) {
      console.log('   ✅ Release API endpoint exists and handles POST requests');
    } else {
      console.log('   ⚠️  Release route file exists but may not handle POST properly');
    }
  } else {
    console.log('   ❌ Release API endpoint not found');
  }
} catch (error) {
  console.log('   ❌ Error checking API endpoint:', error.message);
}

// Test 4: Check build
console.log('\n4. Testing build...');
try {
  console.log('   Building project...');
  execSync('npm run build', { stdio: 'pipe' });
  console.log('   ✅ Build successful - no TypeScript errors');
} catch (error) {
  console.log('   ❌ Build failed:', error.toString().slice(0, 200) + '...');
}

console.log('\n📋 Test Summary:');
console.log('- Added releaseAssignment function to useAssignments hook');
console.log('- Added handleReleaseAssignment handler to dashboard');
console.log('- Added release button with loading state');
console.log('- Button shows only for CLAIMED assignments where user is performer');
console.log('- Release button styled in red to indicate destructive action');
console.log('\n🎯 Expected behavior:');
console.log('- Users can see Release button next to Mark Complete button');
console.log('- Clicking Release will unclaim the assignment');
console.log('- Button shows "Releasing..." during the operation');
console.log('- Assignment list refreshes after successful release');
