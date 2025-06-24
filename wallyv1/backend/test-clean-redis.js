import { createClient } from 'redis';

const testCleanRedis = async () => {
  console.log('🔍 Testing clean Redis setup...');
  
  const client = createClient({
    url: 'redis://localhost:6379' // No password needed for fresh install
  });

  client.on('error', (err) => {
    console.log('❌ Redis Error:', err.message);
  });

  client.on('ready', () => {
    console.log('✅ Redis: Connected successfully!');
  });

  try {
    await client.connect();
    const pong = await client.ping();
    console.log('✅ Redis ping response:', pong);
    
    // Test basic operations
    await client.set('test', 'hello-wally');
    const value = await client.get('test');
    console.log('✅ Redis test value:', value);
    
    await client.del('test');
    console.log('✅ Cleanup successful');
    
    await client.quit();
    console.log('✅ All tests passed! Redis is working correctly.');
  } catch (err) {
    console.error('❌ Redis test failed:', err.message);
  }
};

testCleanRedis();