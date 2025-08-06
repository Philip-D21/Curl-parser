# Reqline Parser Implementation

This is a technical assessment implementation of a curl-like tool called `reqline` that parses HTTP request statements and executes them using axios.

## Overview

The reqline parser accepts HTTP request statements in a specific format and converts them into executable HTTP requests. It follows strict syntax rules and provides comprehensive error handling.

## Syntax

```
HTTP [method] | URL [URL value] | HEADERS [header json value] | QUERY [query value json] | BODY [body value json]
```

### Example
```
HTTP GET | URL https://dummyjson.com/quotes/3 | QUERY {"refid": 1920933}
```

This becomes: `https://dummyjson.com/quotes/3?refid=1920933`

## Syntax Rules

- All keywords are **UPPERCASE**: HTTP, HEADERS, QUERY, BODY
- Single delimiter: pipe `|`
- Exactly one space on each side of keywords and delimiters
- HTTP methods: GET or POST only (uppercase)
- HTTP and URL are required and fixed order
- Other keywords (HEADERS, QUERY, BODY) can appear in any order or be omitted

## Valid Examples

```
HTTP GET | URL https://dummyjson.com/quotes/3 | QUERY {"refid": 1920933}
HTTP GET | URL https://dummyjson.com/quotes/3 | HEADERS {"Content-Type": "application/json"} | QUERY {"refid": 1920933}
HTTP POST | URL https://api.example.com/users | HEADERS {"Content-Type": "application/json"} | BODY {"name": "John", "email": "john@example.com"}
```

## Implementation Details

### Files Structure
- `endpoints/reqline.js` - Main endpoint handler with parser and request execution
- `test-reqline.js` - Parser unit tests
- `test-server.js` - Server integration tests

### Parser Features
- **No regex usage** - Pure string parsing for better control
- **Strict spacing validation** - Enforces exact spacing rules
- **Quote handling** - Properly handles JSON values with quotes
- **Comprehensive error messages** - Specific error messages for each validation failure
- **Order validation** - Ensures HTTP and URL appear in correct order

### Error Handling
The parser provides specific error messages for various validation failures:

- "Missing required HTTP keyword"
- "Missing required URL keyword"
- "Invalid HTTP method. Only GET and POST are supported"
- "HTTP method must be uppercase"
- "Invalid spacing around pipe delimiter"
- "Invalid JSON format in HEADERS section"
- "Invalid JSON format in QUERY section"
- "Invalid JSON format in BODY section"
- "Keywords must be uppercase"
- "Missing space after keyword"
- "Multiple spaces found where single space expected"

## API Endpoint

### POST /
Accepts requests in format: `{"reqline": "[REQLINE STATEMENT]"}`

### Success Response (HTTP 200)
```json
{
  "request": {
    "query": {"refid": 1920933},
    "body": {},
    "headers": {},
    "full_url": "https://dummyjson.com/quotes/3?refid=1920933"
  },
  "response": {
    "http_status": 200,
    "duration": 347,
    "request_start_timestamp": 1691234567890,
    "request_stop_timestamp": 1691234568237,
    "response_data": {
      "id": 3,
      "quote": "Thinking is the capital, Enterprise is the way, Hard Work is the solution.",
      "author": "Abdul Kalam"
    }
  }
}
```

### Error Response (HTTP 400)
```json
{
  "error": true,
  "message": "Specific reason for the error"
}
```

## Testing

### Run Parser Tests
```bash
node test-reqline.js
```

### Run Server Tests
```bash
# Start server
$env:PORT=3000; node app.js

# In another terminal
node test-server.js
```

### Manual Testing with curl
```bash
curl -X POST http://localhost:3000/ \
  -H "Content-Type: application/json" \
  -d '{"reqline":"HTTP GET | URL https://dummyjson.com/quotes/3 | QUERY {\"refid\": 1920933}"}'
```

### Manual Testing with PowerShell
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/" -Method POST -ContentType "application/json" -Body '{"reqline":"HTTP GET | URL https://dummyjson.com/quotes/3 | QUERY {\"refid\": 1920933}"}'
```

## Technical Implementation

### Parser Algorithm
1. **Input validation** - Check for required string input
2. **Tokenization** - Split by pipe delimiter with proper quote handling
3. **Spacing validation** - Ensure exact spacing around delimiters
4. **Keyword validation** - Verify all keywords are uppercase and valid
5. **Order validation** - Ensure HTTP and URL appear in correct order
6. **JSON parsing** - Parse HEADERS, QUERY, and BODY as JSON objects
7. **Method validation** - Ensure HTTP method is GET or POST (uppercase)

### Request Execution
1. **URL construction** - Build full URL with query parameters
2. **Axios configuration** - Set up request with headers, body, and method
3. **Timing measurement** - Track request start and end timestamps
4. **Error handling** - Handle network errors gracefully
5. **Response formatting** - Return structured response with timing data

## Dependencies
- `axios` - HTTP client for making requests
- `express` - Web framework (via @app-core/server)
- `@app-core/express` - Backend template express utilities

## Backend Template Integration
The implementation follows the provided backend template structure:
- Uses `createExpressHandler` for endpoint definition
- Integrates with the existing server configuration
- Follows the established error handling patterns
- Maintains consistency with the codebase architecture 