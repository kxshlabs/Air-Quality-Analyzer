/**
 * API integration tests for Air Quality API.
 * Uses Node built-in modules only — no external test libraries.
 *
 * Requires the server to be running on localhost:5000 before executing.
 * Run: node api/tests/test_api.js
 */

const assert = require("assert");
const http = require("http");

/**
 * Makes a GET request and returns { status, data }.
 * @param {string} path - URL path (e.g. "/health")
 * @returns {Promise<{ status: number, data: object }>}
 */
function makeRequest(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:5000${path}`, (res) => {
      let raw = "";
      res.on("data", (chunk) => (raw += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(raw) });
        } catch {
          reject(new Error("Invalid JSON response"));
        }
      });
    }).on("error", reject);
  });
}

// --- Tests ---

async function test_health_endpoint() {
  const { status, data } = await makeRequest("/health");
  assert.strictEqual(status, 200, `Expected 200, got ${status}`);
  assert.strictEqual(data.status, "ok", `Expected status "ok", got "${data.status}"`);
  assert.strictEqual(data.database, "connected", `Expected database "connected", got "${data.database}"`);
  assert.ok(data.cities_in_db > 0, `Expected cities_in_db > 0, got ${data.cities_in_db}`);
}

async function test_get_all_cities() {
  const { status, data } = await makeRequest("/api/aqi");
  assert.strictEqual(status, 200, `Expected 200, got ${status}`);
  assert.ok(data.count > 0, `Expected count > 0, got ${data.count}`);
  assert.ok(Array.isArray(data.data), "Expected data.data to be an array");
  assert.ok("city" in data.data[0], "Expected first element to have city field");
  assert.ok("aqi" in data.data[0], "Expected first element to have aqi field");
}

async function test_get_fresh_cities() {
  const { status, data } = await makeRequest("/api/aqi/fresh");
  assert.strictEqual(status, 200, `Expected 200, got ${status}`);
  const valid = new Set(["Live", "Recent"]);
  for (const city of data.data) {
    assert.ok(
      valid.has(city.freshness),
      `City "${city.city}" has unexpected freshness "${city.freshness}"`
    );
  }
}

async function test_get_rankings() {
  const { status, data } = await makeRequest("/api/aqi/rankings");
  assert.strictEqual(status, 200, `Expected 200, got ${status}`);
  assert.strictEqual(data.rankings[0].rank, 1, `Expected first rank to be 1, got ${data.rankings[0].rank}`);
  assert.ok(data.total > 0, `Expected total > 0, got ${data.total}`);
  assert.strictEqual(typeof data.most_polluted, "string", "Expected most_polluted to be a string");
  assert.strictEqual(typeof data.average_aqi, "number", "Expected average_aqi to be a number");
}

async function test_rankings_order() {
  const { data } = await makeRequest("/api/aqi/rankings");
  const rankings = data.rankings;
  for (let i = 0; i < rankings.length - 1; i++) {
    const curr = rankings[i].aqi ?? -Infinity;
    const next = rankings[i + 1].aqi ?? -Infinity;
    assert.ok(
      curr >= next,
      `Rankings out of order at index ${i}: ${rankings[i].city} (${curr}) < ${rankings[i + 1].city} (${next})`
    );
  }
}

async function test_get_city_found() {
  const { status, data } = await makeRequest("/api/aqi/London");
  assert.strictEqual(status, 200, `Expected 200, got ${status}`);
  assert.ok("city" in data, "Expected response to have city field");
  assert.strictEqual(typeof data.aqi, "number", `Expected aqi to be a number, got ${typeof data.aqi}`);
}

async function test_get_city_not_found() {
  const { status, data } = await makeRequest("/api/aqi/FAKECITYXYZ999");
  assert.strictEqual(status, 404, `Expected 404, got ${status}`);
  assert.ok("error" in data, "Expected response to have error field");
}

// --- Runner ---

async function runTests() {
  const tests = [
    test_health_endpoint,
    test_get_all_cities,
    test_get_fresh_cities,
    test_get_rankings,
    test_rankings_order,
    test_get_city_found,
    test_get_city_not_found,
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      await test();
      console.log(`[PASS] ${test.name}`);
      passed++;
    } catch (err) {
      console.log(`[FAIL] ${test.name}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\nAPI Tests: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
