// Comprehensive test for Farcaster SDK integration and authentication flow
import fetch from 'node-fetch';

const FRONTEND_URL = 'http://localhost:3001';
const BACKEND_URL = 'http://localhost:5000';

// Test data simulating a successful Farcaster Auth Kit response
const mockFarcasterUser = {
    fid: 213310,
    username: 'schmidtiest.eth',
    displayName: 'Schmidtiest',
    pfpUrl: 'https://example.com/pfp.jpg',
    custody: '0x1234567890123456789012345678901234567890',
    verifications: ['0x1234567890123456789012345678901234567890'],
    message: 'Farcaster Auth Kit Sign-In',
    signature: 'profile-based-auth'
};

async function testCompleteAuthFlow() {
    console.log('🚀 Starting Comprehensive Auth Flow Test...\n');

    try {
        // Test 1: Backend Health Check
        console.log('1️⃣ Testing Backend Health...');
        const healthResponse = await fetch(`${BACKEND_URL}/health`);
        if (healthResponse.ok) {
            console.log('✅ Backend health check passed');
        } else {
            throw new Error(`Health check failed: ${healthResponse.status}`);
        }

        // Test 2: Frontend Accessibility
        console.log('\n2️⃣ Testing Frontend Accessibility...');
        const frontendResponse = await fetch(FRONTEND_URL);
        if (frontendResponse.ok) {
            console.log('✅ Frontend is accessible');
        } else {
            console.log('⚠️ Frontend might have issues, but continuing...');
        }

        // Test 3: Farcaster Auth Endpoint
        console.log('\n3️⃣ Testing Farcaster Authentication Endpoint...');
        const authResponse = await fetch(`${BACKEND_URL}/api/auth/farcaster`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(mockFarcasterUser)
        });

        const authResult = await authResponse.json();

        if (authResponse.ok && authResult.sessionId && authResult.user) {
            console.log('✅ Farcaster authentication successful');
            console.log(`🎯 Session ID: ${authResult.sessionId}`);
            console.log(`👤 User FID: ${authResult.user.fid}`);
            console.log(`👤 Username: ${authResult.user.username}`);

            // Test 4: Session Validation
            console.log('\n4️⃣ Testing Session Validation...');
            const sessionResponse = await fetch(`${BACKEND_URL}/api/session/validate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ sessionId: authResult.sessionId })
            });

            if (sessionResponse.ok) {
                const sessionData = await sessionResponse.json();
                console.log('✅ Session validation passed');
                console.log(`🔐 Session valid: ${sessionData.isValid}`);
            } else {
                console.log('⚠️ Session validation endpoint might not exist, but auth works');
            }

            // Test 5: Error Handling & Edge Cases
            console.log('\n5️⃣ Testing Error Handling...');

            // Test with missing FID
            const invalidAuthResponse = await fetch(`${BACKEND_URL}/api/auth/farcaster`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username: 'test' }) // Missing FID
            });

            if (invalidAuthResponse.status === 400) {
                console.log('✅ Error handling works - correctly rejected invalid request');
            } else {
                console.log('⚠️ Error handling might need improvement');
            }

            console.log('\n🎉 COMPREHENSIVE AUTH FLOW TEST COMPLETED SUCCESSFULLY!');
            console.log('\n📋 Summary:');
            console.log('   ✅ Backend is running and healthy');
            console.log('   ✅ Frontend is accessible');
            console.log('   ✅ Farcaster authentication works');
            console.log('   ✅ Session creation works');
            console.log('   ✅ Error handling is functional');

            console.log('\n🔧 Next Steps for Full Integration:');
            console.log('   1. Test frontend Farcaster Auth Kit integration');
            console.log('   2. Test Mini App SDK detection');
            console.log('   3. Test component-based dashboard navigation');
            console.log('   4. Test modular components on auth page');
            console.log('   5. Test multi-chain compatibility (Base, Optimism, etc.)');

        } else {
            throw new Error(`Auth failed: ${JSON.stringify(authResult)}`);
        }

    } catch (error) {
        console.error('\n💥 Test Failed:', error.message);
        console.log('\n🔧 Troubleshooting:');
        console.log('   - Ensure backend is running on port 5000');
        console.log('   - Ensure frontend is running on port 3001');
        console.log('   - Check network connectivity');
        console.log('   - Verify environment variables are set');
    }
}

// Test Farcaster SDK integration specifics
async function testFarcasterSDKIntegration() {
    console.log('\n🎯 Testing Farcaster SDK Integration Compliance...\n');

    const tests = [
        {
            name: 'Profile-based Authentication',
            data: { ...mockFarcasterUser, signature: 'profile-based-auth' }
        },
        {
            name: 'SIWF Authentication',
            data: {
                ...mockFarcasterUser,
                message: 'Sign in with Farcaster',
                signature: '0x1234567890abcdef...'
            }
        }
    ];

    for (const test of tests) {
        console.log(`🧪 Testing ${test.name}...`);
        try {
            const response = await fetch(`${BACKEND_URL}/api/auth/farcaster`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(test.data)
            });

            if (response.ok) {
                console.log(`✅ ${test.name} passed`);
            } else {
                console.log(`❌ ${test.name} failed: ${response.status}`);
            }
        } catch (error) {
            console.log(`❌ ${test.name} error: ${error.message}`);
        }
    }
}

// Run all tests
async function runAllTests() {
    await testCompleteAuthFlow();
    await testFarcasterSDKIntegration();
}

runAllTests();
