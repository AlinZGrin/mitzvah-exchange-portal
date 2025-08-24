// Test the coordinate mapping function
const testAddresses = [
  '123 Biscayne Blvd, Miami, FL 33132',
  '456 Miracle Mile, Coral Gables, FL 33134', 
  '789 Aventura Blvd, Aventura, FL 33180',
  '321 Ocean Drive, Miami Beach, FL 33139',
  'Downtown Miami area',
  'South Beach',
  'Coral Gables neighborhood'
];

// Simplified version of the coordinate function for testing
const getCoordinatesFromLocation = (location) => {
  const locationMap = {
    'Biscayne Blvd': [25.7850, -80.1900],
    'Ocean Drive': [25.7850, -80.1300],
    'Miracle Mile': [25.7217, -80.2685],
    'Aventura Blvd': [25.9565, -80.1393],
    'Downtown Miami': [25.7825, -80.1998],
    'South Beach': [25.7850, -80.1300],
    'Coral Gables': [25.7217, -80.2685],
    'Miami Beach': [25.7907, -80.1300],
  };
  
  // Try exact match first
  if (locationMap[location]) {
    return locationMap[location];
  }
  
  // Try partial matches
  const lowerLocation = location.toLowerCase();
  for (const [key, coords] of Object.entries(locationMap)) {
    if (lowerLocation.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerLocation)) {
      return coords;
    }
  }
  
  // Enhanced address parsing
  if (lowerLocation.includes('biscayne')) {
    return [25.7850, -80.1900];
  }
  if (lowerLocation.includes('ocean drive')) {
    return [25.7850, -80.1300];
  }
  if (lowerLocation.includes('miracle mile')) {
    return [25.7217, -80.2685];
  }
  if (lowerLocation.includes('aventura')) {
    return [25.9565, -80.1393];
  }
  
  // Default Miami for Florida
  if (lowerLocation.includes('florida') || lowerLocation.includes('fl')) {
    return [25.7617, -80.1918];
  }
  
  return [25.7617, -80.1918]; // Default Miami
};

console.log('🗺️ Testing coordinate mapping for addresses:\n');

testAddresses.forEach(address => {
  const coords = getCoordinatesFromLocation(address);
  console.log(`📍 "${address}"`);
  console.log(`   → [${coords[0]}, ${coords[1]}]`);
  console.log(`   → ${coords[0] !== 25.7617 || coords[1] !== -80.1918 ? '✅ SPECIFIC LOCATION' : '⚠️ DEFAULT MIAMI'}\n`);
});

console.log('🎯 Summary: Addresses should now map to specific coordinates instead of default Miami!');
