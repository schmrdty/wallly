import { createClient } from 'redis';

// Hard-code the password for testing (since env vars are tricky)
const REDIS_PASSWORD = 'W4L1yR3di$';  // Use your new simple password

const testHosts = [
  'localhost',
  '127.0.0.1', 
  '84.32.129.52',
  'db.schmidtiest.xyz',
  'admin.schmidtiest.xyz',
  // Add more potential hosts
];

const testRedisHost = async (host) => {
  console.log(`\n🔍 Testing Redis host: ${host}`);
  
  const client = createClient({
    url: `redis://:${REDIS_PASSWORD}@${host}:6379`,
    socket: { connectTimeout: 5000 }
  });

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      console.log(`❌ ${host}: Connection timeout`);
      client.destroy().catch(() => {});
      resolve(false);
    }, 6000);

    client.on('error', (err) => {
      console.log(`❌ ${host}: ${err.message}`);
      clearTimeout(timeout);
      resolve(false);
    });

    client.on('ready', () => {
      console.log(`✅ ${host}: Connected successfully!`);
      clearTimeout(timeout);
      client.destroy().catch(() => {});
      resolve(true);
    });

    client.connect().catch(() => {});
  });
};

const testAllHosts = async () => {
  console.log('Testing Redis hosts...\n');
  
  for (const host of testHosts) {
    await testRedisHost(host);
  }
  
  console.log('\n=== Testing complete ===');
};

testAllHosts();