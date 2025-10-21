# Claude Pro OAuth Authentication

⚠️ **IMPORTANT: This OAuth flow is documented for educational purposes only.**

While this implementation successfully obtains OAuth tokens using the same flow as Claude Code CLI, **API calls using these tokens will fail** with the error: *"This credential is only authorized for use with Claude Code and cannot be used for other API requests."*

Anthropic restricts OAuth tokens to official Claude Code clients through mechanisms beyond just checking headers and client IDs. For working OAuth API access, use the official Claude Code CLI.

---

## Overview

This document describes the OAuth 2.0 PKCE flow used by Claude Code CLI. The flow itself works correctly and can obtain valid tokens, but Anthropic restricts their usage to official clients.

Claude Pro authentication uses **OAuth 2.0 with PKCE** (Proof Key for Code Exchange) to securely authenticate without client secrets. Once authenticated, you receive access and refresh tokens.

## Authentication Flow

### 1. Generate PKCE Code Verifier and Challenge

```javascript
// Generate random code verifier (43-128 characters)
function generateCodeVerifier() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

// Create SHA-256 hash challenge
async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(new Uint8Array(hash));
}

function base64UrlEncode(array) {
  const base64 = btoa(String.fromCharCode.apply(null, array));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
```

### 2. Build Authorization URL

```javascript
const CLIENT_ID = '9d1c250a-e61b-44d9-88ed-5944d1962f5e';
const REDIRECT_URI = 'https://console.anthropic.com/oauth/code/callback';
const SCOPES = 'org:create_api_key user:profile user:inference';

function buildAuthUrl(codeChallenge, verifier) {
  const params = new URLSearchParams({
    code: 'true',  // IMPORTANT: Required parameter
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state: verifier  // IMPORTANT: Use verifier as state
  });

  return `https://claude.ai/oauth/authorize?${params.toString()}`;
}
```

### 3. User Authorization

1. Open the authorization URL in a browser
2. User logs in to Claude.ai (if not already logged in)
3. User grants permission
4. Browser redirects to `https://console.anthropic.com/oauth/code/callback?code=...#state...`
5. **Extract the full code**: Format is `code_value#state_value` (note the `#` separator, not `&`)

### 4. Exchange Authorization Code for Tokens

**IMPORTANT**: The authorization code comes in format `code#state` and must be split!

```javascript
async function exchangeCodeForTokens(codeWithState, codeVerifier) {
  // Split code and state (format: "code#state")
  const [code, state] = codeWithState.split('#');

  const response = await fetch('https://console.anthropic.com/v1/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',  // JSON, not form-urlencoded!
    },
    body: JSON.stringify({
      code: code,
      state: state,  // IMPORTANT: Must include state
      grant_type: 'authorization_code',
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      code_verifier: codeVerifier,
    }),
  });

  if (!response.ok) {
    throw new Error(`Token exchange failed: ${await response.text()}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,  // sk-ant-oat01-...
    refreshToken: data.refresh_token, // sk-ant-ort01-...
    expiresIn: data.expires_in,       // seconds until expiration
    expiresAt: Date.now() + (data.expires_in * 1000)
  };
}
```

### 5. Refresh Access Token

Access tokens expire, so you'll need to refresh them:

```javascript
async function refreshAccessToken(refreshToken) {
  const response = await fetch('https://console.anthropic.com/v1/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',  // JSON format!
    },
    body: JSON.stringify({
      grant_type: 'refresh_token',
      client_id: CLIENT_ID,
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error(`Token refresh failed: ${await response.text()}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
    expiresAt: Date.now() + (data.expires_in * 1000)
  };
}
```

## Making API Calls (DOES NOT WORK)

⚠️ **This section documents what SHOULD work but DOESN'T due to Anthropic's token restrictions.**

### Send a Message to Claude (Expected to Fail)

```javascript
async function sendMessage(message, accessToken) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'oauth-2025-04-20,claude-code-20250219,interleaved-thinking-2025-05-14,fine-grained-tool-streaming-2025-05-14',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        { role: 'user', content: message }
      ]
    })
  });

  const data = await response.json();
  // Will return: {"type":"error","error":{"type":"invalid_request_error",
  //  "message":"This credential is only authorized for use with Claude Code..."}}
  return data.content[0].text;
}
```

## Key Technical Details

### OAuth Endpoints

- **Authorization**: `https://claude.ai/oauth/authorize` (for Max plan)
- **Token Exchange**: `https://console.anthropic.com/v1/oauth/token` (NOT the API endpoint!)
- **Token Refresh**: `https://console.anthropic.com/v1/oauth/token`
- **API**: `https://api.anthropic.com/v1/messages`

### Client ID

- **Public Client ID**: `9d1c250a-e61b-44d9-88ed-5944d1962f5e`
- This is the same client ID used by Claude Code CLI
- No client secret is required (PKCE provides security)

### Token Formats

- **Access Token**: Starts with `sk-ant-oat01-` (OAuth Access Token)
- **Refresh Token**: Starts with `sk-ant-ort01-` (OAuth Refresh Token)
- **API Key** (different): Starts with `sk-ant-api03-`

### Required Headers

- `Authorization: Bearer <access_token>`
- `anthropic-version: 2023-06-01`
- `anthropic-beta: oauth-2025-04-20,claude-code-20250219,interleaved-thinking-2025-05-14,fine-grained-tool-streaming-2025-05-14` (enables OAuth support and Claude Code features)

### Scopes

- `user:inference` - Make API calls to Claude models
- `user:profile` - Access user profile information
- `org:create_api_key` - Create API keys (optional)

## Why This DOESN'T Work

Despite using the exact same OAuth flow as Claude Code CLI, tokens created by this implementation are rejected for API calls. Here's what we verified:

### What We Matched Exactly ✅
1. **Client ID**: `9d1c250a-e61b-44d9-88ed-5944d1962f5e` (same as OpenCode)
2. **OAuth Flow**: Identical PKCE parameters, endpoints, and flow
3. **Headers**: All required `anthropic-beta` flags included
4. **Endpoints**: Same authorization, token exchange, and API endpoints
5. **HTTP Protocol**: HTTP/1.1 (verified via Wireshark)
6. **Token Format**: Correctly formed `sk-ant-oat01-` access tokens

### What Still Fails ❌
- API calls return: `"This credential is only authorized for use with Claude Code"`
- Even with freshly refreshed tokens
- Even with identical headers to OpenCode
- Tokens from official OpenCode CLI work fine with same code

### Investigation Results (2025-10-21)

**Wireshark Analysis:**
- OpenCode makes requests to `console.anthropic.com` (token refresh) then `api.anthropic.com` (API calls)
- Uses HTTP/1.1, TLS 1.3
- Our implementation uses identical endpoints and protocol

**Token Comparison:**
- OpenCode tokens: Work with API
- Our tokens: OAuth flow succeeds, but API calls rejected
- Refreshing our tokens doesn't help

### Suspected Restrictions

Anthropic likely restricts tokens through one or more of these mechanisms:

1. **OAuth Flow Fingerprinting**: Tracks browser session, IP, or other metadata during authorization
2. **TLS Fingerprinting**: Detects differences in TLS handshake between official client and custom implementations
3. **Runtime Environment Detection**: May check User-Agent or other client characteristics during token creation
4. **Server-Side Token Marking**: Flags tokens created outside official clients at the authorization stage
5. **Account-Level Tracking**: May require OAuth flow to originate from specific client contexts

### Conclusion

The OAuth flow itself is correctly implemented and can obtain valid tokens. However, Anthropic enforces additional restrictions at the authorization or validation level that we cannot bypass without reverse-engineering their official client more deeply.

**For working OAuth API access, use the official Claude Code CLI.**

## Security Considerations

- Never share your access or refresh tokens
- Store tokens securely (not in plain text files)
- Tokens should be stored with `600` permissions if in files
- Access tokens expire and must be refreshed
- PKCE prevents authorization code interception attacks

## Storage Format

If you need to store credentials (similar to `~/.claude/.credentials.json`):

```json
{
  "claudeAiOauth": {
    "accessToken": "sk-ant-oat01-...",
    "refreshToken": "sk-ant-ort01-...",
    "expiresAt": 1234567890000,
    "scopes": ["user:inference", "user:profile"]
  }
}
```

## Complete Example Flow (OAuth Works, API Calls Don't)

```javascript
// 1. Generate PKCE
const verifier = generateCodeVerifier();
const challenge = await generateCodeChallenge(verifier);

// 2. Build and open auth URL
const authUrl = buildAuthUrl(challenge);
console.log('Visit:', authUrl);

// 3. User authorizes and gets code
const code = 'code_from_redirect_url';

// 4. Exchange for tokens ✅ THIS WORKS
const tokens = await exchangeCodeForTokens(code, verifier);
console.log('Access Token:', tokens.accessToken);

// 5. Make API call ❌ THIS FAILS
try {
  const response = await sendMessage('Hello, Claude!', tokens.accessToken);
  console.log('Response:', response);
} catch (error) {
  // Will fail with: "This credential is only authorized for use with Claude Code"
  console.error('API call failed:', error);
}

// 6. Later, refresh when expired ✅ REFRESH WORKS
const newTokens = await refreshAccessToken(tokens.refreshToken);
// But the refreshed token will also fail for API calls ❌
```

## References

- [Anthropic API Documentation](https://docs.anthropic.com/en/api)
- [OAuth 2.0 PKCE RFC 7636](https://datatracker.ietf.org/doc/html/rfc7636)
- [Claude Code IAM Documentation](https://docs.claude.com/en/docs/claude-code/iam)

## Demo Component

See [lively-claude-auth-demo](open://lively-claude-auth-demo) for a reference implementation in Lively4.

**Note**: The component successfully demonstrates the OAuth flow and can obtain tokens, but API calls using these tokens will fail as documented above. It serves as an educational example of the OAuth 2.0 PKCE flow.
