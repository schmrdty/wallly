// Quick test script to verify the backend auth endpoint
const axios = require('axios');

async function testFarcasterAuth() {
    try {
        console.log('🧪 Testing Farcaster Auth Endpoint...');

        const testData = {
            message: 'Test SIWF message',
            signature: '0xtestsignature',
            fid: 213310,
            username: 'schmidtiest.eth',
            displayName: 'Schmidt Test',
            pfpUrl: 'https://example.com/avatar.png',
            custody: '0x1234567890123456789012345678901234567890',
            verifications: []
        };

        const response = await axios.post('http://localhost:5000/api/auth/farcaster', testData, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Success! Backend response:', response.data);
        return response.data;
    } catch (error) {
        console.log('❌ Error:', error.response?.data || error.message);
        return null;
    }
}

testFarcasterAuth();
