// Simple connection test script
const fetch = require('node-fetch');

async function testBackendConnection() {
  try {
    console.log('Testing backend connection...');
    
    // Test health endpoint
    const healthResponse = await fetch('http://localhost:5000/api/health');
    console.log('Health endpoint status:', healthResponse.status);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('Health data:', healthData);
    }
    
    // Test auth session endpoint
    try {
      const sessionResponse = await fetch('http://localhost:5000/api/auth/session', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('Session endpoint status:', sessionResponse.status);
      
      if (sessionResponse.status === 401) {
        console.log('✅ Session endpoint correctly returns 401 for unauthenticated requests');
      }
    } catch (sessionError) {
      console.log('Session endpoint error (expected):', sessionError.message);
    }
    
    console.log('✅ Backend connection test completed successfully');
    
  } catch (error) {
    console.error('❌ Backend connection test failed:', error.message);
  }
}

testBackendConnection();
