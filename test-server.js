const axios = require('axios');

async function testServer() {
  console.log('Starting server test...');

  // Wait for server to start
  await new Promise((resolve) => {
    setTimeout(resolve, 2000);
  });

  try {
    const response = await axios.post(
      'http://localhost:3000/',
      {
        reqline: 'HTTP GET | URL https://dummyjson.com/quotes/3 | QUERY {"refid": 1920933}',
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ Server test PASSED');
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ Server test FAILED');
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('Error:', error.message);
    }
  }
}

// Run the test
testServer();
