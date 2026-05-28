#!/usr/bin/env node
/**
 * Backend Connection Test
 * Run this to verify the backend is working properly
 */

const http = require('http');

const API_BASE = 'http://localhost:3000/api';
const tests = [];
let passed = 0;
let failed = 0;

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            body: JSON.parse(data)
          });
        } catch {
          resolve({
            status: res.statusCode,
            body: data
          });
        }
      });
    });
    
    req.on('error', reject);
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('\n🧪 Testing Backend Connection...\n');
  console.log('='.repeat(60));
  
  // Test 1: Health Check
  try {
    const res = await makeRequest(`${API_BASE}/health`);
    if (res.status === 200) {
      console.log('✅ Test 1: Health check - PASSED');
      passed++;
    } else {
      console.log('❌ Test 1: Health check - FAILED');
      failed++;
    }
  } catch (error) {
    console.log('❌ Test 1: Health check - FAILED');
    console.log('   Error:', error.message);
    console.log('   Is the server running? Try: node server.js');
    failed++;
  }
  
  // Test 2: Get Public Letters
  try {
    const res = await makeRequest(`${API_BASE}/public/letters`);
    if (res.status === 200) {
      const letters = res.body;
      console.log(`✅ Test 2: Get public letters - PASSED (${Array.isArray(letters) ? letters.length : 0} letters)`);
      passed++;
    } else {
      console.log('❌ Test 2: Get public letters - FAILED');
      failed++;
    }
  } catch (error) {
    console.log('❌ Test 2: Get public letters - FAILED');
    console.log('   Error:', error.message);
    failed++;
  }
  
  // Test 3: Get Categories
  try {
    const res = await makeRequest(`${API_BASE}/public/categories`);
    if (res.status === 200) {
      const categories = res.body;
      console.log(`✅ Test 3: Get categories - PASSED (${Array.isArray(categories) ? categories.length : 0} categories)`);
      passed++;
    } else {
      console.log('❌ Test 3: Get categories - FAILED');
      failed++;
    }
  } catch (error) {
    console.log('❌ Test 3: Get categories - FAILED');
    console.log('   Error:', error.message);
    failed++;
  }
  
  // Test 4: Get Authors
  try {
    const res = await makeRequest(`${API_BASE}/public/authors`);
    if (res.status === 200) {
      const authors = res.body;
      console.log(`✅ Test 4: Get authors - PASSED (${Array.isArray(authors) ? authors.length : 0} authors)`);
      passed++;
    } else {
      console.log('❌ Test 4: Get authors - FAILED');
      failed++;
    }
  } catch (error) {
    console.log('❌ Test 4: Get authors - FAILED');
    console.log('   Error:', error.message);
    failed++;
  }
  
  // Summary
  console.log('='.repeat(60));
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed\n`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed! Backend is working correctly.');
    console.log('\nNext steps:');
    console.log('  1. Create an admin user (see BACKEND_CONNECTION_SUMMARY.md)');
    console.log('  2. Run: node import-pdf-letters.js');
    console.log('  3. View letters at: http://localhost:8080/letters.html\n');
  } else {
    console.log('⚠️  Some tests failed. Please check:');
    console.log('  - Is the backend server running? (node server.js)');
    console.log('  - Is it running on port 3000?');
    console.log('  - Check server logs for errors\n');
  }
  
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
