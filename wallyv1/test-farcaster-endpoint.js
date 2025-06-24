// Test script to check if the Farcaster endpoint is accessible
const axios = require('axios');

async function testFarcasterEndpoint() {
    try {
        console.log('🧪 Testing Farcaster endpoint accessibility...');

        // First, test a simple OPTIONS request to check CORS
        try {
            const optionsResponse = await axios.options('http://localhost:5000/api/auth/farcaster');
            console.log('✅ OPTIONS request successful:', optionsResponse.status);
        } catch (error) {
            console.log('⚠️ OPTIONS request failed (might be normal):', error.response?.status || error.message);
        }

        // Then test with minimal valid data
        const testData = {
            message: 'example.com wants you to sign in with your Ethereum account:\n0x1234567890123456789012345678901234567890\n\nTest message\n\nURI: https://example.com\nVersion: 1\nChain ID: 1\nNonce: testnonce\nIssued At: 2025-06-09T18:00:00.000Z',
            signature: '0x' + '1'.repeat(130), // Valid length signature format
            fid: 213310,
            username: 'schmidtiest.eth',
            displayName: 'Test User',
            pfpUrl: 'https://example.com/avatar.png',
            custody: '0x1234567890123456789012345678901234567890',
            verifications: []
        };

        console.log('🔄 Sending test request...');
        const response = await axios.post('http://localhost:5000/api/auth/farcaster', testData, {
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'http://localhost:3001'
            }
        });

        console.log('✅ Success! Response:', response.data);

    } catch (error) {
        console.log('❌ Error details:');
        console.log('- Status:', error.response?.status);
        console.log('- Headers:', error.response?.headers);
        console.log('- Data:', error.response?.data);
        console.log('- Message:', error.message);

        if (error.code === 'ECONNREFUSED') {
            console.log('🔧 Backend server is not running or not accessible');
        } else if (error.response?.status === 404) {
            console.log('🔧 Endpoint not found - check route configuration');
        } else if (error.response?.status >= 400 && error.response?.status < 500) {
            console.log('🔧 Client error - check request format');
        }
    }
}

testFarcasterEndpoint();
