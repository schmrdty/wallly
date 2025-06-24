const axios = require('axios');

async function testBackendFrom3000() {
    console.log('🧪 Testing backend connectivity from localhost:3000...');

    try {
        // Test basic connectivity
        console.log('1. Testing basic health endpoint...');
        const healthResponse = await axios.get('http://localhost:5000/health', {
            headers: {
                'Origin': 'http://localhost:3000'
            }
        });
        console.log('✅ Health endpoint accessible:', healthResponse.status);

        // Test Farcaster auth endpoint with test data
        console.log('2. Testing Farcaster auth endpoint...');
        const authResponse = await axios.post('http://localhost:5000/api/auth/farcaster', {
            message: 'test-message',
            signature: '0x' + '1'.repeat(130),
            fid: 123456,
            username: 'testuser',
            displayName: 'Test User',
            pfpUrl: 'https://example.com/avatar.png',
            custody: '0x' + '1'.repeat(40),
            verifications: []
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'http://localhost:3000'
            }
        });

        console.log('✅ Auth endpoint response:', authResponse.status);
        console.log('✅ Auth response data:', authResponse.data);

    } catch (error) {
        if (error.response) {
            console.log('🔍 Response received but with error:');
            console.log('   Status:', error.response.status);
            console.log('   Data:', error.response.data);
            if (error.response.status === 401) {
                console.log('✅ 401 error is expected with test data - backend is working!');
            }
        } else {
            console.error('❌ Network error:', error.message);
        }
    }
}

testBackendFrom3000().catch(console.error);
