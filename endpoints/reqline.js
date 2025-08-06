const createExpressHandler = require('../core/express/create-handler');
const { axios } = require('../core/http-request');

function parseReqline(reqline) {
  // Strict parser implementation (no regex)
  if (!reqline || typeof reqline !== 'string') {
    throw new Error('Missing required HTTP keyword');
  }

  const trimmed = reqline.trim();
  if (!trimmed) {
    throw new Error('Missing required HTTP keyword');
  }

  const requiredKeywords = ['HTTP', 'URL'];
  const allowedKeywords = ['HTTP', 'URL', 'HEADERS', 'QUERY', 'BODY'];
  const result = { headers: {}, query: {}, body: {} };

  // Split by pipe with proper quote handling
  const parts = [];
  let currentPart = '';
  let inQuotes = false;
  let escapeNext = false;

  for (let i = 0; i < trimmed.length; i += 1) {
    const char = trimmed[i];

    if (escapeNext) {
      currentPart += char;
      escapeNext = false;
    } else if (char === '\\') {
      escapeNext = true;
      currentPart += char;
    } else if (char === '"') {
      inQuotes = !inQuotes;
      currentPart += char;
    } else if (char === '|' && !inQuotes) {
      // Check spacing around pipe
      if (i === 0 || trimmed[i - 1] !== ' ') {
        throw new Error('Invalid spacing around pipe delimiter');
      }
      if (i === trimmed.length - 1 || trimmed[i + 1] !== ' ') {
        throw new Error('Invalid spacing around pipe delimiter');
      }

      parts.push(currentPart.trim());
      currentPart = '';
      i += 1; // skip space after |
    } else {
      currentPart += char;
    }
  }

  if (currentPart) {
    parts.push(currentPart.trim());
  }

  if (parts.length < 2) {
    if (parts.length === 0) {
      throw new Error('Missing required HTTP keyword');
    }
    throw new Error('Missing required URL keyword');
  }

  // Parse each part
  const seen = {};
  for (let idx = 0; idx < parts.length; idx += 1) {
    const part = parts[idx];

    // Find first space
    const firstSpace = part.indexOf(' ');
    if (firstSpace === -1) {
      throw new Error('Missing space after keyword');
    }

    // Check for multiple consecutive spaces
    if (part.indexOf('  ') !== -1) {
      throw new Error('Multiple spaces found where single space expected');
    }

    const keyword = part.substring(0, firstSpace);
    const value = part.substring(firstSpace + 1);

    // Check if keyword is valid
    if (!allowedKeywords.includes(keyword)) {
      // Check if it's a lowercase version of a valid keyword
      const upperKeyword = keyword.toUpperCase();
      if (allowedKeywords.includes(upperKeyword)) {
        throw new Error('Keywords must be uppercase');
      }
      throw new Error(`Unknown keyword: ${keyword}`);
    }

    // Check for duplicates
    if (seen[keyword]) {
      throw new Error(`Duplicate keyword: ${keyword}`);
    }
    seen[keyword] = true;

    // Validate order for required keywords
    if (keyword === 'HTTP' && idx !== 0) {
      throw new Error('Missing required HTTP keyword');
    }
    if (keyword === 'URL' && idx !== 1) {
      throw new Error('Missing required URL keyword');
    }

    // Parse based on keyword
    if (keyword === 'HTTP') {
      const method = value.trim();
      if (!method) {
        throw new Error('Missing HTTP method');
      }

      if (method !== 'GET' && method !== 'POST') {
        // Check if it's a valid method but lowercase
        if (method.toLowerCase() === 'get' || method.toLowerCase() === 'post') {
          throw new Error('HTTP method must be uppercase');
        }
        throw new Error('Invalid HTTP method. Only GET and POST are supported');
      }

      result.method = method;
    } else if (keyword === 'URL') {
      const url = value.trim();
      if (!url) {
        throw new Error('Missing URL value');
      }
      result.url = url;
    } else if (keyword === 'HEADERS') {
      try {
        result.headers = value.trim() ? JSON.parse(value.trim()) : {};
        if (
          typeof result.headers !== 'object' ||
          result.headers === null ||
          Array.isArray(result.headers)
        ) {
          throw new Error('Invalid JSON format in HEADERS section');
        }
      } catch (error) {
        throw new Error('Invalid JSON format in HEADERS section');
      }
    } else if (keyword === 'QUERY') {
      try {
        result.query = value.trim() ? JSON.parse(value.trim()) : {};
        if (
          typeof result.query !== 'object' ||
          result.query === null ||
          Array.isArray(result.query)
        ) {
          throw new Error('Invalid JSON format in QUERY section');
        }
      } catch (error) {
        throw new Error('Invalid JSON format in QUERY section');
      }
    } else if (keyword === 'BODY') {
      try {
        result.body = value.trim() ? JSON.parse(value.trim()) : {};
        if (typeof result.body !== 'object' || result.body === null || Array.isArray(result.body)) {
          throw new Error('Invalid JSON format in BODY section');
        }
      } catch (error) {
        throw new Error('Invalid JSON format in BODY section');
      }
    }
  }

  // Check for required keywords
  const requiredKeywordsLength = requiredKeywords.length;
  for (let i = 0; i < requiredKeywordsLength; i += 1) {
    const keyword = requiredKeywords[i];
    if (!seen[keyword]) {
      throw new Error(`Missing required ${keyword} keyword`);
    }
  }

  return result;
}

module.exports = createExpressHandler({
  method: 'post',
  path: '/',
  handler: async ({ body }) => {
    try {
      // Validate request body
      if (!body || typeof body.reqline !== 'string') {
        return {
          status: 400,
          data: {
            error: true,
            message: 'Missing required HTTP keyword',
          },
        };
      }

      // Parse reqline
      let parsed;
      try {
        parsed = parseReqline(body.reqline);
      } catch (parseError) {
        return {
          status: 400,
          data: {
            error: true,
            message: parseError.message,
          },
        };
      }

      // Build full URL with query parameters
      let fullUrl = parsed.url;
      const queryKeys = Object.keys(parsed.query || {});
      if (queryKeys.length > 0) {
        const queryParams = [];
        const queryKeysLength = queryKeys.length;
        for (let i = 0; i < queryKeysLength; i += 1) {
          const key = queryKeys[i];
          const esc = encodeURIComponent;
          queryParams.push(`${esc(key)}=${esc(parsed.query[key])}`);
        }
        fullUrl += `?${queryParams.join('&')}`;
      }

      // Prepare axios request configuration
      const reqConfig = {
        method: parsed.method.toLowerCase(),
        url: fullUrl,
        headers: parsed.headers || {},
        validateStatus: () => true, // Don't throw on any status code
      };

      // Add body data for POST requests
      if (parsed.method === 'POST' && Object.keys(parsed.body || {}).length > 0) {
        reqConfig.data = parsed.body;
      }

      // Execute request with timing
      const requestStartTimestamp = Date.now();
      let axiosResponse;
      let requestStopTimestamp;

      try {
        axiosResponse = await axios(reqConfig);
        requestStopTimestamp = Date.now();
      } catch (networkError) {
        requestStopTimestamp = Date.now();

        // For network errors, return a response with 0 status
        return {
          status: 200,
          data: {
            request: {
              query: parsed.query || {},
              body: parsed.body || {},
              headers: parsed.headers || {},
              full_url: fullUrl,
            },
            response: {
              http_status: 0,
              duration: requestStopTimestamp - requestStartTimestamp,
              request_start_timestamp: requestStartTimestamp,
              request_stop_timestamp: requestStopTimestamp,
              response_data: null,
            },
          },
        };
      }

      // Return successful response
      return {
        status: 200,
        data: {
          request: {
            query: parsed.query || {},
            body: parsed.body || {},
            headers: parsed.headers || {},
            full_url: fullUrl,
          },
          response: {
            http_status: axiosResponse.status,
            duration: requestStopTimestamp - requestStartTimestamp,
            request_start_timestamp: requestStartTimestamp,
            request_stop_timestamp: requestStopTimestamp,
            response_data: axiosResponse.data,
          },
        },
      };
    } catch (generalError) {
      return {
        status: 400,
        data: {
          error: true,
          message: generalError.message || 'Unknown error',
        },
      };
    }
  },
});

// Export parseReqline for testing
module.exports.parseReqline = parseReqline;
