#!/usr/bin/env node

/**
 * Test script untuk mengetes timeout issue dengan prompt "Build a todo app with React"
 * Script ini akan melakukan test langsung ke API endpoint dengan berbagai timeout settings
 */

const https = require('https');
const http = require('http');

const TEST_PROMPT = "Build a todo app with React";
const API_URL = process.env.TEST_URL || 'http://localhost:3000';

// Test configurations dengan timeout yang berbeda
const TEST_CONFIGS = [
  { name: '30 seconds', timeout: 30000 },
  { name: '60 seconds', timeout: 60000 },
  { name: '2 minutes', timeout: 120000 },
  { name: '5 minutes', timeout: 300000 },
  { name: '10 minutes', timeout: 600000 }
];

function makeRequest(config) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    console.log(`\n🧪 Testing with timeout: ${config.name} (${config.timeout}ms)`);
    console.log(`📤 Sending prompt: "${TEST_PROMPT}"`);
    console.log(`⏰ Started at: ${new Date().toISOString()}`);
    
    const postData = JSON.stringify({
      message: TEST_PROMPT,
      chatId: null
    });

    const url = new URL('/api/chat', API_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 3000),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: config.timeout
    };

    const client = url.protocol === 'https:' ? https : http;
    
    const req = client.request(options, (res) => {
      console.log(`📊 Response status: ${res.statusCode} ${res.statusMessage}`);
      console.log(`📋 Response headers:`, res.headers);
      
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
        const elapsed = Date.now() - startTime;
        console.log(`📦 Data chunk received (${chunk.length} bytes) - Elapsed: ${elapsed}ms`);
      });
      
      res.on('end', () => {
        const elapsed = Date.now() - startTime;
        console.log(`✅ Request completed in ${elapsed}ms`);
        
        if (res.statusCode === 200) {
          try {
            const result = JSON.parse(data);
            console.log(`🎉 SUCCESS: Received valid response`);
            console.log(`📄 Response data:`, {
              id: result.id,
              demo: !!result.demo,
              messagesLength: result.messages?.length
            });
            resolve({ success: true, elapsed, data: result, status: res.statusCode });
          } catch (e) {
            console.log(`⚠️  SUCCESS but JSON parse error:`, e.message);
            resolve({ success: false, elapsed, error: 'JSON_PARSE_ERROR', status: res.statusCode, data });
          }
        } else {
          console.log(`❌ FAILED: HTTP ${res.statusCode}`);
          console.log(`📄 Error response:`, data.substring(0, 500));
          resolve({ success: false, elapsed, error: 'HTTP_ERROR', status: res.statusCode, data });
        }
      });
    });

    req.on('error', (error) => {
      const elapsed = Date.now() - startTime;
      console.log(`❌ Request error after ${elapsed}ms:`, error.message);
      resolve({ success: false, elapsed, error: error.message, status: null });
    });

    req.on('timeout', () => {
      const elapsed = Date.now() - startTime;
      console.log(`⏰ Request timeout after ${elapsed}ms`);
      req.destroy();
      resolve({ success: false, elapsed, error: 'TIMEOUT', status: null });
    });

    req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log(`🚀 Starting timeout tests against: ${API_URL}`);
  console.log(`📝 Test prompt: "${TEST_PROMPT}"`);
  console.log(`📅 Test started: ${new Date().toISOString()}`);
  console.log('='.repeat(80));

  const results = [];

  for (const config of TEST_CONFIGS) {
    try {
      const result = await makeRequest(config);
      results.push({ config, result });
      
      // Jika berhasil, tidak perlu test timeout yang lebih lama
      if (result.success) {
        console.log(`🎯 Found working timeout: ${config.name}`);
        break;
      }
      
      // Tunggu sebentar sebelum test berikutnya
      console.log('⏳ Waiting 5 seconds before next test...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
    } catch (error) {
      console.log(`💥 Unexpected error:`, error);
      results.push({ config, result: { success: false, error: error.message } });
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(80));
  
  results.forEach(({ config, result }) => {
    const status = result.success ? '✅ SUCCESS' : '❌ FAILED';
    const elapsed = result.elapsed ? `${result.elapsed}ms` : 'N/A';
    const error = result.error ? ` (${result.error})` : '';
    
    console.log(`${status} | ${config.name.padEnd(12)} | ${elapsed.padEnd(8)} | HTTP ${result.status || 'N/A'}${error}`);
  });

  // Recommendations
  console.log('\n🔍 ANALYSIS & RECOMMENDATIONS:');
  
  const successful = results.find(r => r.result.success);
  if (successful) {
    console.log(`✅ Minimum working timeout: ${successful.config.name}`);
    console.log(`📈 Recommendation: Set client timeout to at least ${successful.config.timeout + 30000}ms`);
  } else {
    const timeouts = results.filter(r => r.result.error === 'TIMEOUT');
    const httpErrors = results.filter(r => r.result.error === 'HTTP_ERROR');
    const networkErrors = results.filter(r => r.result.error && !['TIMEOUT', 'HTTP_ERROR'].includes(r.result.error));
    
    if (httpErrors.length > 0) {
      console.log(`🚨 HTTP Error (likely nginx timeout): Status ${httpErrors[0].result.status}`);
      console.log(`💡 Recommendation: Increase nginx proxy_read_timeout to at least 600s`);
    }
    
    if (timeouts.length > 0) {
      console.log(`⏰ Client timeouts detected`);
      console.log(`💡 Recommendation: API processing time exceeds all tested timeouts`);
    }
    
    if (networkErrors.length > 0) {
      console.log(`🌐 Network errors detected`);
      console.log(`💡 Recommendation: Check network connectivity and DNS resolution`);
    }
  }
  
  console.log('\n🛠️  NEXT STEPS:');
  console.log('1. Check nginx configuration: proxy_read_timeout, proxy_connect_timeout');
  console.log('2. Monitor API response time in production');
  console.log('3. Consider implementing progress updates for long-running requests');
  console.log('4. Add request queuing for high-load scenarios');
  
  console.log(`\n✨ Test completed at: ${new Date().toISOString()}`);
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage: node test-timeout.js [options]

Options:
  --url <url>     Test URL (default: http://localhost:3000)
  --help, -h      Show this help message

Environment Variables:
  TEST_URL        Test URL to use (same as --url)

Examples:
  node test-timeout.js
  node test-timeout.js --url https://v0.madewgn.eu.org
  TEST_URL=https://v0.madewgn.eu.org node test-timeout.js
`);
  process.exit(0);
}

const urlIndex = args.indexOf('--url');
if (urlIndex !== -1 && args[urlIndex + 1]) {
  process.env.TEST_URL = args[urlIndex + 1];
}

runTests().catch(console.error);
