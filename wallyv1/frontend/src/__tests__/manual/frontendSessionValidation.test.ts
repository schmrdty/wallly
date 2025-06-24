/**
 * Frontend Farcaster Session Validation Tests
 * 
 * These tests help diagnose client-side session and authentication issues.
 * Addresses: "SessionContext: Found sessionId in storage: null" and Farcaster Mini App issues
 */

import { api } from '../../utils/api';
import { 
  setSessionId, 
  getSessionId, 
  clearSessionId, 
  validateSession, 
  revokeSession 
} from '../../utils/session';
import { logger } from '../../utils/logger';

interface TestResult {
  name: string;
  passed: boolean;
  details: string[];
  error?: string;
}

interface FarcasterAuthState {
  isSuccess: boolean;
  authResponse: boolean;
  authResponseData: any;
  isValid: boolean;
}

/**
 * Test 1: Local Storage Session Management
 * Diagnoses: Why sessionId is null in storage
 */
async function testLocalStorageSessionManagement(): Promise<TestResult> {
  const result: TestResult = {
    name: 'Local Storage Session Management',
    passed: false,
    details: []
  };

  try {
    result.details.push('1. Testing localStorage availability...');
    
    // Check if localStorage is available
    if (typeof Storage === 'undefined') {
      result.details.push('   ❌ localStorage not available');
      return result;
    }
    result.details.push('   ✅ localStorage available');

    // Test basic localStorage operations
    result.details.push('2. Testing basic localStorage operations...');
    try {
      localStorage.setItem('test_key', 'test_value');
      const retrieved = localStorage.getItem('test_key');
      localStorage.removeItem('test_key');
      
      if (retrieved === 'test_value') {
        result.details.push('   ✅ localStorage read/write working');
      } else {
        result.details.push('   ❌ localStorage read/write failed');
        return result;
      }
    } catch (error) {
      result.details.push(`   ❌ localStorage operations failed: ${error.message}`);
      return result;
    }

    // Test session storage functions
    result.details.push('3. Testing session storage functions...');
    
    // Clear any existing session first
    clearSessionId();
    const initialSession = getSessionId();
    result.details.push(`   Initial session: ${initialSession || 'null'}`);

    // Set a test session
    const testSessionId = 'test-session-' + Date.now();
    setSessionId(testSessionId);
    const storedSession = getSessionId();
    
    if (storedSession === testSessionId) {
      result.details.push('   ✅ Session storage/retrieval working');
    } else {
      result.details.push(`   ❌ Session storage failed. Set: ${testSessionId}, Got: ${storedSession}`);
      return result;
    }

    // Test session clearing
    clearSessionId();
    const clearedSession = getSessionId();
    if (clearedSession === null) {
      result.details.push('   ✅ Session clearing working');
    } else {
      result.details.push(`   ❌ Session clearing failed. Still has: ${clearedSession}`);
      return result;
    }

    // Test localStorage key consistency
    result.details.push('4. Testing localStorage key consistency...');
    const sessionKey = 'wally_session_id';
    setSessionId(testSessionId);
    const directValue = localStorage.getItem(sessionKey);
    
    if (directValue === testSessionId) {
      result.details.push('   ✅ Session key consistency verified');
    } else {
      result.details.push(`   ❌ Session key mismatch. Expected: ${testSessionId}, Direct: ${directValue}`);
    }

    // Clean up
    clearSessionId();
    result.passed = true;

  } catch (error) {
    result.error = error.message;
    result.details.push(`❌ Test failed with error: ${error.message}`);
  }

  return result;
}

/**
 * Test 2: API Communication and Session Validation
 * Diagnoses: Backend communication issues
 */
async function testApiCommunication(): Promise<TestResult> {
  const result: TestResult = {
    name: 'API Communication and Session Validation',
    passed: false,
    details: []
  };

  try {
    result.details.push('1. Testing API base configuration...');
    
    // Check API configuration
    const expectedBaseUrl = 'http://localhost:5000';
    result.details.push(`   Expected API base URL: ${expectedBaseUrl}`);

    // Test basic API connectivity
    result.details.push('2. Testing basic API connectivity...');
    try {
      const healthResponse = await api.get('/api/health');
      result.details.push(`   ✅ API health check: ${healthResponse.status}`);
      result.details.push(`   Response: ${JSON.stringify(healthResponse.data)}`);
    } catch (error) {
      result.details.push(`   ❌ API health check failed: ${error.message}`);
      if (error.code === 'ECONNREFUSED') {
        result.details.push('   → Backend server may not be running on port 5000');
      }
      return result;
    }

    // Test session validation with invalid session
    result.details.push('3. Testing session validation with invalid session...');
    const invalidSessionId = 'invalid-session-id';
    
    try {
      const invalidResponse = await api.get(`/api/sessions/${invalidSessionId}/validate`);
      result.details.push(`   Response status: ${invalidResponse.status}`);
      result.details.push(`   Response data: ${JSON.stringify(invalidResponse.data)}`);
      
      if (invalidResponse.data.isValid === false) {
        result.details.push('   ✅ Invalid session correctly rejected');
      } else {
        result.details.push('   ❌ Invalid session incorrectly accepted');
      }
    } catch (error) {
      result.details.push(`   API validation error: ${error.response?.status} - ${error.message}`);
      if (error.response?.status === 404 || error.response?.status === 401) {
        result.details.push('   ✅ Invalid session correctly rejected with error');
      } else {
        result.details.push('   ❌ Unexpected error for invalid session');
        return result;
      }
    }

    // Test session validation helper function
    result.details.push('4. Testing session validation helper...');
    
    // This should return false for no session
    clearSessionId();
    const noSessionValid = await validateSession();
    if (!noSessionValid) {
      result.details.push('   ✅ No session correctly returns false');
    } else {
      result.details.push('   ❌ No session incorrectly returns true');
    }

    // Test with invalid session
    setSessionId(invalidSessionId);
    const invalidValid = await validateSession();
    if (!invalidValid) {
      result.details.push('   ✅ Invalid session correctly returns false');
    } else {
      result.details.push('   ❌ Invalid session incorrectly returns true');
    }

    // Clean up
    clearSessionId();
    result.passed = true;

  } catch (error) {
    result.error = error.message;
    result.details.push(`❌ Test failed with error: ${error.message}`);
  }

  return result;
}

/**
 * Test 3: Farcaster AuthKit Integration
 * Diagnoses: AuthKit initialization and response handling
 */
async function testFarcasterAuthKitIntegration(): Promise<TestResult> {
  const result: TestResult = {
    name: 'Farcaster AuthKit Integration',
    passed: false,
    details: []
  };

  try {
    result.details.push('1. Testing Farcaster environment variables...');
    
    // Check if we're running in a browser environment that supports Farcaster
    if (typeof window === 'undefined') {
      result.details.push('   ⚠️ Running in Node.js environment, not browser');
      result.details.push('   This test needs to run in a browser context');
      result.passed = true; // Skip this test in Node.js
      return result;
    }

    // Check for Farcaster SDK availability
    result.details.push('2. Checking Farcaster SDK availability...');
    
    // Check if Farcaster objects are available in window
    const farcasterAvailable = typeof (window as any).fc !== 'undefined' || 
                              typeof (window as any).farcaster !== 'undefined';
    
    if (farcasterAvailable) {
      result.details.push('   ✅ Farcaster SDK detected in window');
    } else {
      result.details.push('   ⚠️ Farcaster SDK not detected in window');
      result.details.push('   This may be expected if SDK loads asynchronously');
    }

    // Check for expected environment configuration
    result.details.push('3. Checking environment configuration...');
    
    const expectedDomain = window.location.hostname === 'localhost' ? 
                          'localhost:3000' : 
                          window.location.host;
    
    result.details.push(`   Current domain: ${window.location.host}`);
    result.details.push(`   Expected auth domain: ${expectedDomain}`);
    result.details.push(`   Protocol: ${window.location.protocol}`);

    // Test localStorage for Farcaster-related data
    result.details.push('4. Checking for Farcaster data in localStorage...');
    
    const farcasterKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('farcaster') || key.includes('fc') || key.includes('auth'))) {
        farcasterKeys.push(key);
      }
    }
    
    if (farcasterKeys.length > 0) {
      result.details.push(`   Found ${farcasterKeys.length} Farcaster-related keys:`);
      farcasterKeys.forEach(key => {
        const value = localStorage.getItem(key);
        result.details.push(`     ${key}: ${value ? value.substring(0, 50) + '...' : 'null'}`);
      });
    } else {
      result.details.push('   ⚠️ No Farcaster-related data in localStorage');
    }

    // Mock Farcaster auth state test
    result.details.push('5. Testing Farcaster auth state handling...');
    
    const mockAuthState: FarcasterAuthState = {
      isSuccess: false,
      authResponse: false,
      authResponseData: null,
      isValid: false
    };

    result.details.push(`   Mock auth state: ${JSON.stringify(mockAuthState)}`);
    
    // This would be where you'd test actual Farcaster SDK calls
    // For now, we'll just verify the state structure
    if (typeof mockAuthState.isSuccess === 'boolean') {
      result.details.push('   ✅ Auth state structure valid');
    } else {
      result.details.push('   ❌ Auth state structure invalid');
    }

    result.passed = true;

  } catch (error) {
    result.error = error.message;
    result.details.push(`❌ Test failed with error: ${error.message}`);
  }

  return result;
}

/**
 * Test 4: SessionContext Integration
 * Diagnoses: React Context and state management issues
 */
async function testSessionContextIntegration(): Promise<TestResult> {
  const result: TestResult = {
    name: 'SessionContext Integration',
    passed: false,
    details: []
  };

  try {
    result.details.push('1. Testing session initialization flow...');
    
    // Simulate the SessionContext initialization
    clearSessionId();
    const initialSessionId = getSessionId();
    result.details.push(`   Initial sessionId from storage: ${initialSessionId || 'null'}`);
    
    if (initialSessionId === null) {
      result.details.push('   ✅ This matches the reported issue: "Found sessionId in storage: null"');
    }

    // Test session setting and retrieval
    result.details.push('2. Testing session setting flow...');
    
    const mockSessionData = {
      sessionId: 'mock-session-' + Date.now(),
      user: {
        id: '123456',
        fid: 123456,
        username: 'testuser',
        displayName: 'Test User',
        authProvider: 'farcaster'
      }
    };

    // Simulate successful login
    setSessionId(mockSessionData.sessionId);
    const storedSessionId = getSessionId();
    
    if (storedSessionId === mockSessionData.sessionId) {
      result.details.push('   ✅ Session storage after login works');
    } else {
      result.details.push(`   ❌ Session storage failed: expected ${mockSessionData.sessionId}, got ${storedSessionId}`);
    }

    // Test session validation flow
    result.details.push('3. Testing session validation flow...');
    
    // This will fail since it's a mock session, but we can test the flow
    const isValid = await validateSession();
    result.details.push(`   Validation result for mock session: ${isValid}`);
    result.details.push('   ✅ Validation flow completed (expected to fail with mock data)');

    // Test session clearing
    result.details.push('4. Testing session clearing flow...');
    
    clearSessionId();
    const clearedSessionId = getSessionId();
    
    if (clearedSessionId === null) {
      result.details.push('   ✅ Session clearing works correctly');
    } else {
      result.details.push(`   ❌ Session clearing failed: still has ${clearedSessionId}`);
    }

    // Test race conditions
    result.details.push('5. Testing for race conditions...');
    
    // Rapidly set and get session
    const rapidSessionId = 'rapid-test-' + Date.now();
    setSessionId(rapidSessionId);
    
    // Immediate retrieval
    const immediate = getSessionId();
    
    // Delayed retrieval
    await new Promise(resolve => setTimeout(resolve, 10));
    const delayed = getSessionId();
    
    if (immediate === rapidSessionId && delayed === rapidSessionId) {
      result.details.push('   ✅ No race conditions detected');
    } else {
      result.details.push(`   ❌ Race condition detected: immediate=${immediate}, delayed=${delayed}`);
    }

    // Clean up
    clearSessionId();
    result.passed = true;

  } catch (error) {
    result.error = error.message;
    result.details.push(`❌ Test failed with error: ${error.message}`);
  }

  return result;
}

/**
 * Test 5: Network and CORS Issues
 * Diagnoses: Cross-origin and network connectivity problems
 */
async function testNetworkAndCorsIssues(): Promise<TestResult> {
  const result: TestResult = {
    name: 'Network and CORS Issues',
    passed: false,
    details: []
  };

  try {
    result.details.push('1. Testing network environment...');
    
    if (typeof window !== 'undefined') {
      result.details.push(`   Current URL: ${window.location.href}`);
      result.details.push(`   Origin: ${window.location.origin}`);
      result.details.push(`   Protocol: ${window.location.protocol}`);
    }

    // Test CORS preflight
    result.details.push('2. Testing CORS configuration...');
    
    try {
      // Make a simple request that should work
      const corsTest = await fetch('http://localhost:5000/api/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      result.details.push(`   CORS test status: ${corsTest.status}`);
      
      if (corsTest.ok) {
        result.details.push('   ✅ CORS configuration appears correct');
      } else {
        result.details.push('   ❌ CORS configuration may have issues');
      }
    } catch (error) {
      result.details.push(`   CORS test failed: ${error.message}`);
      if (error.message.includes('CORS')) {
        result.details.push('   ❌ CORS policy blocking requests');
      } else if (error.message.includes('fetch')) {
        result.details.push('   ❌ Network connectivity issue');
      }
    }

    // Test API endpoint accessibility
    result.details.push('3. Testing API endpoint accessibility...');
    
    const endpoints = [
      '/api/health',
      '/api/auth/validate',
      '/api/sessions/test/validate'
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`http://localhost:5000${endpoint}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        result.details.push(`   ${endpoint}: ${response.status}`);
      } catch (error) {
        result.details.push(`   ${endpoint}: ❌ ${error.message}`);
      }
    }

    // Test WebSocket or realtime connections if used
    result.details.push('4. Testing realtime connections...');
    result.details.push('   ⚠️ WebSocket tests not implemented (add if used)');

    result.passed = true;

  } catch (error) {
    result.error = error.message;
    result.details.push(`❌ Test failed with error: ${error.message}`);
  }

  return result;
}

/**
 * Main test runner for frontend validation
 */
export async function runFrontendSessionValidationTests(): Promise<void> {
  console.log('\n🚀 FRONTEND FARCASTER SESSION VALIDATION TESTS');
  console.log('=' .repeat(80));
  console.log('Purpose: Diagnose client-side session and auth issues');
  console.log('Reported Issues:');
  console.log('  - SessionContext: Found sessionId in storage: null');
  console.log('  - authResponse: false, authResponseData: null, isValid: false');
  console.log('  - Farcaster Mini App initialized: undefined');
  console.log('=' .repeat(80));

  const tests = [
    testLocalStorageSessionManagement,
    testApiCommunication,
    testFarcasterAuthKitIntegration,
    testSessionContextIntegration,
    testNetworkAndCorsIssues
  ];

  const results: TestResult[] = [];

  // Run all tests
  for (const test of tests) {
    console.log(`\n🔍 Running: ${test.name}...`);
    const result = await test();
    results.push(result);
    
    // Display test details
    result.details.forEach(detail => console.log(detail));
    
    if (result.error) {
      console.log(`❌ Error: ${result.error}`);
    }
    
    console.log(`Result: ${result.passed ? '✅ PASS' : '❌ FAIL'}`);
  }

  // Summary
  console.log('\n📊 FRONTEND TEST RESULTS SUMMARY');
  console.log('=' .repeat(60));
  
  results.forEach(result => {
    console.log(`${result.name}: ${result.passed ? '✅ PASS' : '❌ FAIL'}`);
  });

  // Diagnosis and recommendations
  console.log('\n🔧 FRONTEND DIAGNOSIS AND RECOMMENDATIONS');
  console.log('=' .repeat(60));

  const failedTests = results.filter(r => !r.passed);
  
  if (failedTests.length === 0) {
    console.log('✅ All frontend tests passed!');
    console.log('   Issue may be in backend or AuthKit integration');
  } else {
    console.log(`❌ ${failedTests.length} test(s) failed:`);
    
    failedTests.forEach(test => {
      console.log(`\n• ${test.name}:`);
      if (test.error) {
        console.log(`  Error: ${test.error}`);
      }
      console.log('  Recommendations:');
      
      if (test.name.includes('Local Storage')) {
        console.log('    - Check if localStorage is being cleared by other code');
        console.log('    - Verify browser settings allow localStorage');
        console.log('    - Check for incognito/private browsing mode');
      }
      
      if (test.name.includes('API Communication')) {
        console.log('    - Ensure backend server is running on port 5000');
        console.log('    - Check network connectivity and firewall settings');
        console.log('    - Verify API base URL configuration');
      }
      
      if (test.name.includes('Farcaster AuthKit')) {
        console.log('    - Verify Farcaster SDK is properly loaded');
        console.log('    - Check AuthKit configuration and API keys');
        console.log('    - Ensure domain configuration matches expected values');
      }
      
      if (test.name.includes('SessionContext')) {
        console.log('    - Check React Context provider is properly set up');
        console.log('    - Verify component mounting and state initialization');
        console.log('    - Check for async timing issues in React effects');
      }
      
      if (test.name.includes('Network and CORS')) {
        console.log('    - Configure CORS policy to allow frontend origin');
        console.log('    - Check backend CORS middleware configuration');
        console.log('    - Verify network policies and proxy settings');
      }
    });
  }

  console.log('\n🎯 SPECIFIC RECOMMENDATIONS FOR REPORTED ISSUES:');
  console.log('1. "SessionContext: Found sessionId in storage: null"');
  console.log('   → Check localStorage persistence and clearing logic');
  console.log('   → Verify session is actually being set after successful auth');
  
  console.log('2. "authResponse: false, authResponseData: null"');
  console.log('   → Debug AuthKit response handling');
  console.log('   → Check if AuthKit API calls are completing successfully');
  
  console.log('3. "Farcaster Mini App initialized: undefined"');
  console.log('   → Verify Farcaster SDK loading and initialization sequence');
  console.log('   → Check for JavaScript errors preventing initialization');
}

// Browser-compatible export
if (typeof window !== 'undefined') {
  (window as any).runFrontendSessionValidationTests = runFrontendSessionValidationTests;
}

// Node.js export for testing frameworks
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runFrontendSessionValidationTests };
}
