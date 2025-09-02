#!/usr/bin/env node

// Simple script to test Vercel API deployment
const https = require('https');

const DOMAIN = process.argv[2] || 'your-domain.vercel.app';

console.log('🧪 Testing Vercel API Deployment...');
console.log(`🌐 Domain: ${DOMAIN}`);

// Test the /api/test endpoint
function testEndpoint(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: DOMAIN,
      port: 443,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: responseData
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function runTests() {
  console.log('\n1. Testing /api/test endpoint...');
  try {
    const testResult = await testEndpoint('/api/test');
    console.log(`   Status: ${testResult.status}`);
    console.log(`   Response: ${testResult.data}`);
    
    if (testResult.status === 200) {
      console.log('   ✅ Test endpoint working!');
    } else {
      console.log('   ❌ Test endpoint failed');
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }

  console.log('\n2. Testing /api/recipe endpoint...');
  try {
    const recipeResult = await testEndpoint('/api/recipe', 'POST', {
      query: 'chicken curry'
    });
    console.log(`   Status: ${recipeResult.status}`);
    console.log(`   Response: ${recipeResult.data.substring(0, 200)}...`);
    
    if (recipeResult.status === 200) {
      console.log('   ✅ Recipe endpoint working!');
    } else {
      console.log('   ❌ Recipe endpoint failed');
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }

  console.log('\n🏁 Testing complete!');
}

if (DOMAIN === 'your-domain.vercel.app') {
  console.log('❌ Please provide your Vercel domain:');
  console.log('   node test-deployment.js your-actual-domain.vercel.app');
  process.exit(1);
}

runTests();
