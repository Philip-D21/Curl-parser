const { parseReqline } = require('./endpoints/reqline');

// Test cases
const testCases = [
  {
    name: 'Valid GET request with query',
    input: 'HTTP GET | URL https://dummyjson.com/quotes/3 | QUERY {"refid": 1920933}',
    expected: {
      method: 'GET',
      url: 'https://dummyjson.com/quotes/3',
      query: { refid: 1920933 },
      headers: {},
      body: {},
    },
  },
  {
    name: 'Valid POST request with headers and body',
    input:
      'HTTP POST | URL https://api.example.com/users | HEADERS {"Content-Type": "application/json"} | BODY {"name": "John", "email": "john@example.com"}',
    expected: {
      method: 'POST',
      url: 'https://api.example.com/users',
      query: {},
      headers: { 'Content-Type': 'application/json' },
      body: { name: 'John', email: 'john@example.com' },
    },
  },
  {
    name: 'Valid GET request with all optional parts',
    input:
      'HTTP GET | URL https://dummyjson.com/quotes/3 | HEADERS {"Authorization": "Bearer token"} | QUERY {"refid": 1920933} | BODY {}',
    expected: {
      method: 'GET',
      url: 'https://dummyjson.com/quotes/3',
      query: { refid: 1920933 },
      headers: { Authorization: 'Bearer token' },
      body: {},
    },
  },
];

// Error test cases
const errorTestCases = [
  {
    name: 'Missing HTTP keyword',
    input: 'GET | URL https://example.com',
    expectedError: 'Missing space after keyword',
  },
  {
    name: 'Lowercase HTTP method',
    input: 'HTTP get | URL https://example.com',
    expectedError: 'HTTP method must be uppercase',
  },
  {
    name: 'Invalid HTTP method',
    input: 'HTTP PUT | URL https://example.com',
    expectedError: 'Invalid HTTP method. Only GET and POST are supported',
  },
  {
    name: 'Missing URL keyword',
    input: 'HTTP GET | https://example.com',
    expectedError: 'Missing space after keyword',
  },
  {
    name: 'Invalid spacing around pipe',
    input: 'HTTP GET| URL https://example.com',
    expectedError: 'Invalid spacing around pipe delimiter',
  },
  {
    name: 'Invalid JSON in QUERY',
    input: 'HTTP GET | URL https://example.com | QUERY {invalid json}',
    expectedError: 'Invalid JSON format in QUERY section',
  },
  {
    name: 'Lowercase keyword',
    input: 'HTTP GET | url https://example.com',
    expectedError: 'Keywords must be uppercase',
  },
];

// Helper function to compare objects regardless of property order
function deepEqual(obj1, obj2) {
  if (obj1 === obj2) return true;
  if (obj1 == null || obj2 == null) return false;
  if (typeof obj1 !== typeof obj2) return false;

  if (typeof obj1 !== 'object') return obj1 === obj2;

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  const keys1Length = keys1.length;
  for (let i = 0; i < keys1Length; i += 1) {
    const key = keys1[i];
    if (!keys2.includes(key)) return false;
    if (!deepEqual(obj1[key], obj2[key])) return false;
  }

  return true;
}

console.log('Testing reqline parser...\n');

// Test valid cases
console.log('=== Valid Cases ===');
const testCasesLength = testCases.length;
for (let i = 0; i < testCasesLength; i += 1) {
  const testCase = testCases[i];
  try {
    const result = parseReqline(testCase.input);
    const passed = deepEqual(result, testCase.expected);
    console.log(`${i + 1}. ${testCase.name}: ${passed ? 'PASS' : 'FAIL'}`);
    if (!passed) {
      console.log(`   Expected: ${JSON.stringify(testCase.expected)}`);
      console.log(`   Got: ${JSON.stringify(result)}`);
    }
  } catch (error) {
    console.log(`${i + 1}. ${testCase.name}: FAIL - ${error.message}`);
  }
}

console.log('\n=== Error Cases ===');
const errorTestCasesLength = errorTestCases.length;
for (let i = 0; i < errorTestCasesLength; i += 1) {
  const testCase = errorTestCases[i];
  try {
    parseReqline(testCase.input);
    console.log(`${i + 1}. ${testCase.name}: FAIL - Expected error but got success`);
  } catch (error) {
    const passed = error.message === testCase.expectedError;
    console.log(`${i + 1}. ${testCase.name}: ${passed ? 'PASS' : 'FAIL'}`);
    if (!passed) {
      console.log(`   Expected: "${testCase.expectedError}"`);
      console.log(`   Got: "${error.message}"`);
    }
  }
}

console.log('\nTesting complete!');
