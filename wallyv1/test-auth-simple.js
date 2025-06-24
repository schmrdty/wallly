const http = require('http');

const data = JSON.stringify({
    message: 'test message',
    signature: 'test signature',
    fid: 12345,
    username: 'test'
});

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/farcaster',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => {
        body += chunk;
    });

    res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Response:', body);
    });
});

req.on('error', (e) => {
    console.error('Error:', e.message);
});

req.write(data);
req.end();
