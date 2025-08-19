// Script to clear any existing authentication tokens
console.log('Clearing authentication tokens...');

// This simulates what happens when a user opens a fresh browser session
if (typeof localStorage !== 'undefined') {
  console.log('Current localStorage auth_token:', localStorage.getItem('auth_token'));
  localStorage.removeItem('auth_token');
  console.log('localStorage cleared');
}

if (typeof sessionStorage !== 'undefined') {
  console.log('Current sessionStorage auth_token:', sessionStorage.getItem('auth_token'));
  sessionStorage.removeItem('auth_token');
  console.log('sessionStorage cleared');
}

console.log('Authentication tokens cleared. Site should now show login button instead of user info.');
