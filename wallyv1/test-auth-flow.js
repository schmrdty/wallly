// Test script to verify auth flow
import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:5000';

async function testBackendAuth() {
    console.log('🧪 Testing backend auth endpoint...');

    try {
        // Test basic connectivity
        const healthResponse = await fetch(`${API_BASE_URL}/health`);
        console.log('✅ Health check:', healthResponse.status);

        // Test Farcaster auth endpoint
        const authData = {
            message: 'Test message',
            signature: 'profile-based-auth', // Use profile-based auth for testing
            fid: 213310,
            username: 'schmidtiest.eth',
            displayName: 'Schmidtiest',
            pfpUrl: '',
            custody: '0x1234567890123456789012345678901234567890',
            verifications: []
        };

        console.log('📤 Sending auth request...');
        const authResponse = await fetch(`${API_BASE_URL}/api/auth/farcaster`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(authData)
        });

        const responseText = await authResponse.text();
        console.log('📥 Auth response status:', authResponse.status);
        console.log('📥 Auth response body:', responseText);

        if (authResponse.ok) {
            const responseData = JSON.parse(responseText);
            console.log('✅ Auth successful!');
            console.log('🎯 Session ID:', responseData.sessionId);
            console.log('👤 User:', responseData.user);
        } else {
            console.log('❌ Auth failed');
        }

    } catch (error) {
        console.error('💥 Test failed:', error);
    }
}

testBackendAuth();
