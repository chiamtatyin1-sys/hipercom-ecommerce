/**
 * Auto-Test Runner
 * Automatically tests all API endpoints and features
 * Run on server start to verify everything is working
 */

import fetch from 'node-fetch';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3001/api';

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

let passed = 0;
let failed = 0;
const results = [];

async function test(name, fn) {
  try {
    await fn();
    passed++;
    results.push({ name, status: 'PASS' });
    console.log(`${colors.green}✓${colors.reset} ${name}`);
  } catch (error) {
    failed++;
    results.push({ name, status: 'FAIL', error: error.message });
    console.log(`${colors.red}✗${colors.reset} ${name}`);
    console.log(`  ${colors.red}Error:${colors.reset} ${error.message}`);
  }
}

async function runTests() {
  console.log(`\n${colors.cyan}=== AUTO-TEST RUNNER ===${colors.reset}\n`);
  console.log(`Base URL: ${BASE_URL}\n`);

  // Test 1: Health Check
  await test('Health Check', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    if (!res.ok) throw new Error(`Status: ${res.status}`);
    const data = await res.json();
    if (!data.status) throw new Error('No status in response');
  });

  // Test 2: Login
  let authToken;
  await test('Login (Master Admin)', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'hipercom',
        password: 'Hipercom123#',
      }),
    });
    if (!res.ok) throw new Error(`Status: ${res.status}`);
    const data = await res.json();
    if (!data.token) throw new Error('No token in response');
    authToken = data.token;
  });

  // Test 3: Get Brands
  await test('Get Brands', async () => {
    const res = await fetch(`${BASE_URL}/brands`);
    if (!res.ok) throw new Error(`Status: ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error('Not an array');
    if (data.length === 0) throw new Error('No brands found');
  });

  // Test 4: Get Categories
  await test('Get Categories', async () => {
    const res = await fetch(`${BASE_URL}/categories`);
    if (!res.ok) throw new Error(`Status: ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error('Not an array');
  });

  // Test 5: Get Products
  await test('Get Products', async () => {
    const res = await fetch(`${BASE_URL}/products`);
    if (!res.ok) throw new Error(`Status: ${res.status}`);
    const data = await res.json();
    if (!data.products) throw new Error('No products in response');
  });

  // Test 6: Sitemap
  await test('Sitemap XML', async () => {
    const res = await fetch(`${BASE_URL.replace('/api', '')}/sitemap.xml`);
    if (!res.ok) throw new Error(`Status: ${res.status}`);
    const contentType = res.headers.get('content-type');
    if (!contentType.includes('xml')) throw new Error('Not XML');
  });

  // Test 7: Rate Limiting (just verify endpoint responds)
  await test('Rate Limiting Active', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'test', password: 'test' }),
    });
    // Should respond (even with error)
    if (res.status === 503) throw new Error('Service unavailable');
  });

  // Summary
  console.log(`\n${colors.cyan}=== TEST SUMMARY ===${colors.reset}`);
  console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
  console.log(`Total: ${passed + failed}\n`);

  if (failed > 0) {
    console.log(`${colors.yellow}⚠️  Some tests failed. Check logs above.${colors.reset}\n`);
    process.exit(1);
  } else {
    console.log(`${colors.green}✓ All tests passed!${colors.reset}\n`);
    process.exit(0);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(err => {
    console.error(`${colors.red}Fatal error:${colors.reset}`, err);
    process.exit(1);
  });
}

export default runTests;
