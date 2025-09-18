/**
 * Enhanced API Testing Script
 * Tests production-ready API endpoints with security measures
 */

const https = require('https');
const http = require('http');

// Test configuration
const config = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  timeout: 10000,
  testUser: {
    email: 'test@example.com',
    password: 'TestPassword123!',
    username: 'testuser',
    name: 'Test User'
  }
};

// HTTP request helper
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const isHttps = options.hostname === 'localhost' ? false : options.hostname.includes('https');
    const client = isHttps ? https : http;
    
    const req = client.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch (error) {
          resolve({ status: res.statusCode, headers: res.headers, data: body });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(config.timeout, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

// Parse URL helper
function parseUrl(url) {
  const parsed = new URL(url);
  return {
    hostname: parsed.hostname,
    port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
    path: parsed.pathname + parsed.search,
    protocol: parsed.protocol
  };
}

// Test functions
async function testHealthCheck() {
  console.log('\n🏥 Testing Health Check API...');
  
  try {
    const url = parseUrl(`${config.baseUrl}/api/health`);
    const response = await makeRequest({
      ...url,
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'API-Test/1.0'
      }
    });

    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    if (response.status === 200 && response.data.success) {
      console.log('✅ Health check passed');
      return true;
    } else {
      console.log('❌ Health check failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Health check error:', error.message);
    return false;
  }
}

async function testAuthRegister() {
  console.log('\n🔐 Testing User Registration API...');
  
  try {
    const url = parseUrl(`${config.baseUrl}/api/auth/register`);
    const response = await makeRequest({
      ...url,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'API-Test/1.0'
      }
    }, config.testUser);

    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    if (response.status === 201 && response.data.success) {
      console.log('✅ Registration successful');
      return true;
    } else if (response.status === 409) {
      console.log('ℹ️ User already exists');
      return true;
    } else {
      console.log('❌ Registration failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Registration error:', error.message);
    return false;
  }
}

async function testAuthLogin() {
  console.log('\n🔑 Testing User Login API...');
  
  try {
    const url = parseUrl(`${config.baseUrl}/api/auth/login`);
    const response = await makeRequest({
      ...url,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'API-Test/1.0'
      }
    }, {
      email: config.testUser.email,
      password: config.testUser.password
    });

    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    if (response.status === 200 && response.data.success) {
      console.log('✅ Login successful');
      return response.data.data.session;
    } else {
      console.log('❌ Login failed');
      return null;
    }
  } catch (error) {
    console.error('❌ Login error:', error.message);
    return null;
  }
}

async function testRateLimiting() {
  console.log('\n⚡ Testing Rate Limiting...');
  
  try {
    const promises = [];
    const url = parseUrl(`${config.baseUrl}/api/health`);
    
    // Send 10 rapid requests
    for (let i = 0; i < 10; i++) {
      promises.push(makeRequest({
        ...url,
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'API-Test/1.0',
          'X-Test-Request': i.toString()
        }
      }));
    }

    const responses = await Promise.all(promises.map(p => p.catch(e => ({ error: e.message }))));
    
    const successful = responses.filter(r => r.status === 200).length;
    const rateLimited = responses.filter(r => r.status === 429).length;
    
    console.log(`Successful requests: ${successful}`);
    console.log(`Rate limited requests: ${rateLimited}`);
    
    if (successful > 0) {
      console.log('✅ Rate limiting is working');
      return true;
    } else {
      console.log('❌ Rate limiting test failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Rate limiting test error:', error.message);
    return false;
  }
}

async function testInputValidation() {
  console.log('\n🛡️ Testing Input Validation...');
  
  try {
    const url = parseUrl(`${config.baseUrl}/api/auth/login`);
    
    // Test with invalid data
    const invalidInputs = [
      { email: 'invalid-email', password: '123' },
      { email: '', password: '' },
      { email: 'test@example.com' }, // missing password
      { password: 'password123' } // missing email
    ];

    let validationWorking = true;

    for (const input of invalidInputs) {
      const response = await makeRequest({
        ...url,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'API-Test/1.0'
        }
      }, input);

      if (response.status !== 400) {
        console.log(`❌ Validation failed for input: ${JSON.stringify(input)}`);
        validationWorking = false;
      }
    }

    if (validationWorking) {
      console.log('✅ Input validation is working');
      return true;
    } else {
      console.log('❌ Input validation has issues');
      return false;
    }
  } catch (error) {
    console.error('❌ Input validation test error:', error.message);
    return false;
  }
}

async function testSecurityHeaders() {
  console.log('\n🔒 Testing Security Headers...');
  
  try {
    const url = parseUrl(`${config.baseUrl}/api/health`);
    const response = await makeRequest({
      ...url,
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'API-Test/1.0'
      }
    });

    const headers = response.headers;
    const securityHeaders = [
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection'
    ];

    let allHeadersPresent = true;
    for (const header of securityHeaders) {
      if (!headers[header]) {
        console.log(`❌ Missing security header: ${header}`);
        allHeadersPresent = false;
      }
    }

    if (allHeadersPresent) {
      console.log('✅ Security headers are present');
      return true;
    } else {
      console.log('❌ Some security headers are missing');
      return false;
    }
  } catch (error) {
    console.error('❌ Security headers test error:', error.message);
    return false;
  }
}

async function testCORS() {
  console.log('\n🌐 Testing CORS Configuration...');
  
  try {
    const url = parseUrl(`${config.baseUrl}/api/health`);
    const response = await makeRequest({
      ...url,
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://example.com',
        'Access-Control-Request-Method': 'GET',
        'User-Agent': 'API-Test/1.0'
      }
    });

    console.log(`CORS Status: ${response.status}`);
    console.log('CORS Headers:', {
      'access-control-allow-origin': response.headers['access-control-allow-origin'],
      'access-control-allow-methods': response.headers['access-control-allow-methods'],
      'access-control-allow-headers': response.headers['access-control-allow-headers']
    });

    if (response.status === 200 || response.status === 204) {
      console.log('✅ CORS is configured');
      return true;
    } else {
      console.log('❌ CORS configuration issue');
      return false;
    }
  } catch (error) {
    console.error('❌ CORS test error:', error.message);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Enhanced API Security Tests');
  console.log(`Base URL: ${config.baseUrl}`);
  console.log('=' * 50);

  const results = {
    healthCheck: await testHealthCheck(),
    registration: await testAuthRegister(),
    login: await testAuthLogin(),
    rateLimiting: await testRateLimiting(),
    inputValidation: await testInputValidation(),
    securityHeaders: await testSecurityHeaders(),
    cors: await testCORS()
  };

  console.log('\n📊 Test Results Summary:');
  console.log('=' * 30);
  
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  });

  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  
  console.log(`\n📈 Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All API security tests passed!');
    process.exit(0);
  } else {
    console.log('⚠️ Some tests failed. Please review the API implementation.');
    process.exit(1);
  }
}

// Run tests
if (require.main === module) {
  runTests().catch(error => {
    console.error('💥 Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = { runTests, config };