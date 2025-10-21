import Morph from 'src/components/widgets/lively-morph.js';
import Terminal from 'src/client/terminal.js';

/**
 * Claude Pro OAuth Authentication Demo
 *
 * ⚠️ EXPECTED TO FAIL ⚠️
 *
 * This component successfully implements the OAuth 2.0 PKCE flow used by Claude Code,
 * and can successfully obtain access/refresh tokens. However, API calls using these
 * tokens will fail with: "This credential is only authorized for use with Claude Code"
 *
 * Investigation Summary (2025-10-21):
 * - OAuth flow works correctly (same client_id, parameters as OpenCode)
 * - Token exchange succeeds (gets valid access/refresh tokens)
 * - API calls fail even with correct headers (anthropic-beta flags, etc.)
 * - Tokens created by official OpenCode CLI work fine
 * - Tokens created by this custom implementation are rejected
 *
 * Root Cause (suspected):
 * Anthropic appears to fingerprint/track the OAuth authorization flow at a deeper level
 * than just checking client_id and headers. Possible mechanisms:
 * - TLS fingerprinting of the client making requests
 * - Tracking which browser/session completed the OAuth authorization
 * - Server-side marking of tokens created outside official Claude Code clients
 * - Runtime environment detection (Node.js vs Bun/official client)
 *
 * What Works:
 * - OAuth PKCE flow (authorization URL generation, code exchange)
 * - Token refresh (can get new access tokens from refresh tokens)
 * - All the OAuth plumbing matches OpenCode exactly
 *
 * What Fails:
 * - Actual API calls to https://api.anthropic.com/v1/messages
 * - Even with freshly refreshed tokens
 * - Even with identical headers to OpenCode
 *
 * Conclusion:
 * This implementation is useful for understanding the OAuth flow and could work
 * if Anthropic changes their token restrictions, but currently cannot be used
 * for actual API calls. Use official Claude Code CLI for working OAuth access.
 *
 * See: demos/claude/claude-auth.md for detailed OAuth flow documentation
 */
export default class LivelyClaudeAuthDemo extends Morph {
  async initialize() {
    this.windowTitle = "Claude Pro OAuth Demo";
    this.registerButtons();

    // OAuth configuration
    this.CLIENT_ID = '9d1c250a-e61b-44d9-88ed-5944d1962f5e';
    this.REDIRECT_URI = 'https://console.anthropic.com/oauth/code/callback';
    this.SCOPES = 'org:create_api_key user:profile user:inference';

    // State
    this.codeVerifier = null;
    this.tokens = null;
    this.chatHistory = [];

    // Restore state if exists
    this.restoreState();
  }

  // ===== OAuth PKCE Implementation =====

  generateCodeVerifier() {
    const array = new Uint8Array(64);  // Changed from 32 to 64 to match OpenCode
    crypto.getRandomValues(array);
    return this.base64UrlEncode(array);
  }

  async generateCodeChallenge(verifier) {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return this.base64UrlEncode(new Uint8Array(hash));
  }

  base64UrlEncode(array) {
    const base64 = btoa(String.fromCharCode.apply(null, array));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  buildAuthUrl(codeChallenge, verifier) {
    const params = new URLSearchParams({
      code: 'true',  // Required parameter
      client_id: this.CLIENT_ID,
      redirect_uri: this.REDIRECT_URI,
      response_type: 'code',
      scope: this.SCOPES,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      state: verifier  // Use verifier as state
    });

    return `https://claude.ai/oauth/authorize?${params.toString()}`;
  }

  async exchangeCodeForTokens(codeWithState) {
    if (!this.codeVerifier) {
      throw new Error('No code verifier found. Please start the OAuth flow first.');
    }

    // Split code and state (format: "code#state")
    const [code, state] = codeWithState.split('#');

    // Use Terminal to run curl command (avoids CORS)
    const terminal = this.getTerminal();
    const payload = JSON.stringify({
      code: code,
      state: state,
      grant_type: 'authorization_code',
      client_id: this.CLIENT_ID,
      redirect_uri: this.REDIRECT_URI,
      code_verifier: this.codeVerifier,
    });

    const command = `curl -X POST https://console.anthropic.com/v1/oauth/token \\
      -H "Content-Type: application/json" \\
      -d '${payload.replace(/'/g, "'\\''")}'`;

    const result = await terminal.run(command);

    if (result.error) {
      throw new Error(`Token exchange failed: ${result.error}`);
    }

    if (!result.stdout || result.stdout.trim().length === 0) {
      throw new Error('Token exchange failed: Empty response');
    }

    const data = JSON.parse(result.stdout);
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      expiresAt: Date.now() + (data.expires_in * 1000)
    };
  }

  getTerminal() {
    if (!this.terminal) {
      this.terminal = new Terminal();
    }
    return this.terminal;
  }

  async refreshAccessToken() {
    if (!this.tokens || !this.tokens.refreshToken) {
      throw new Error('No refresh token available');
    }

    // Use Terminal to run curl command (avoids CORS)
    const terminal = this.getTerminal();
    const payload = JSON.stringify({
      grant_type: 'refresh_token',
      client_id: this.CLIENT_ID,
      refresh_token: this.tokens.refreshToken,
    });

    const command = `curl -X POST https://console.anthropic.com/v1/oauth/token \\
      -H "Content-Type: application/json" \\
      -d '${payload.replace(/'/g, "'\\''")}'`;

    const result = await terminal.run(command);

    if (result.error) {
      throw new Error(`Token refresh failed: ${result.error}`);
    }

    if (!result.stdout || result.stdout.trim().length === 0) {
      throw new Error('Token refresh failed: Empty response');
    }

    const data = JSON.parse(result.stdout);
    this.tokens.accessToken = data.access_token;
    this.tokens.expiresIn = data.expires_in;
    this.tokens.expiresAt = Date.now() + (data.expires_in * 1000);

    this.saveState();
    this.displayTokens();
  }

  // ===== Claude API =====

  async sendMessage(message) {
    if (!this.tokens || !this.tokens.accessToken) {
      throw new Error('Not authenticated. Please complete OAuth flow first.');
    }

    // Check if token is expired and refresh if needed
    if (Date.now() >= this.tokens.expiresAt - 60000) { // Refresh 1 min before expiry
      await this.refreshAccessToken();
    }

    // Use Terminal to run curl command (avoids CORS)
    const terminal = this.getTerminal();
    const payload = JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        { role: 'user', content: message }
      ]
    });

    const command = `curl -X POST https://api.anthropic.com/v1/messages \\
      -H "Authorization: Bearer ${this.tokens.accessToken}" \\
      -H "Content-Type: application/json" \\
      -H "anthropic-version: 2023-06-01" \\
      -H "anthropic-beta: oauth-2025-04-20,claude-code-20250219,interleaved-thinking-2025-05-14,fine-grained-tool-streaming-2025-05-14" \\
      -H "User-Agent: opencode" \\
      -d '${payload.replace(/'/g, "'\\''")}'`;

    const result = await terminal.run(command);

    if (result.error) {
      throw new Error(`API call failed: ${result.error}`);
    }

    if (!result.stdout || result.stdout.trim().length === 0) {
      throw new Error('API call failed: Empty response');
    }

    const data = JSON.parse(result.stdout);

    if (data.error) {
      throw new Error(`API call failed: ${JSON.stringify(data.error)}`);
    }

    return data.content[0].text;
  }

  // ===== UI Event Handlers =====

  async onStartAuthButton(evt) {
    try {
      // Generate PKCE
      this.codeVerifier = this.generateCodeVerifier();
      const codeChallenge = await this.generateCodeChallenge(this.codeVerifier);

      // Build and open auth URL
      const authUrl = this.buildAuthUrl(codeChallenge, this.codeVerifier);

      // Open in new window
      window.open(authUrl, '_blank');

      // Show instructions
      this.get('#authUrlDisplay').style.display = 'block';
      this.showStatus('OAuth flow started. Please authorize in the new window and copy the FULL code (including #state part) from the redirect URL.', 'info');
    } catch (error) {
      this.showStatus(`Error: ${error.message}`, 'error');
    }
  }

  async onExchangeButton(evt) {
    try {
      const code = this.get('#codeInput').value.trim();
      if (!code) {
        this.showStatus('Please enter the authorization code', 'error');
        return;
      }

      this.showStatus('Exchanging code for tokens...', 'info');

      // Exchange code for tokens
      this.tokens = await this.exchangeCodeForTokens(code);

      // Save state
      this.saveState();

      // Display tokens
      this.displayTokens();

      // Enable chat
      this.get('#sendButton').disabled = false;

      this.showStatus('Authentication successful! You can now chat with Claude.', 'success');
    } catch (error) {
      this.showStatus(`Error: ${error.message}`, 'error');
    }
  }

  async onSendButton(evt) {
    try {
      const messageInput = this.get('#messageInput');
      const message = messageInput.value.trim();

      if (!message) {
        this.showStatus('Please enter a message', 'error');
        return;
      }

      // Add user message to chat
      this.addMessageToChat('user', message);
      messageInput.value = '';

      this.showStatus('Sending message to Claude...', 'info');

      // Send to Claude API
      const response = await this.sendMessage(message);

      // Add assistant response to chat
      this.addMessageToChat('assistant', response);

      this.showStatus('Message sent successfully', 'success');
    } catch (error) {
      this.showStatus(`Error: ${error.message}`, 'error');
    }
  }

  onClearButton(evt) {
    this.chatHistory = [];
    this.get('#chatDisplay').innerHTML = '';
    this.showStatus('Chat cleared', 'info');
  }

  async onCopyTokenButton(evt) {
    if (!this.tokens || !this.tokens.accessToken) {
      this.showStatus('No token available to copy', 'error');
      return;
    }

    try {
      await navigator.clipboard.writeText(this.tokens.accessToken);
      this.showStatus('Access token copied to clipboard!', 'success');
    } catch (error) {
      this.showStatus(`Failed to copy: ${error.message}`, 'error');
    }
  }

  // ===== Display Functions =====

  displayTokens() {
    if (!this.tokens) return;

    const tokenDisplay = this.get('#tokenDisplay');
    tokenDisplay.style.display = 'block';

    this.get('#accessToken').textContent = this.tokens.accessToken.substring(0, 30) + '...';
    this.get('#refreshToken').textContent = this.tokens.refreshToken.substring(0, 30) + '...';
    this.get('#expiresAt').textContent = new Date(this.tokens.expiresAt).toLocaleString();
  }

  addMessageToChat(role, content) {
    this.chatHistory.push({ role, content });

    const chatDisplay = this.get('#chatDisplay');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;

    const label = document.createElement('div');
    label.className = 'message-label';
    label.textContent = role === 'user' ? 'You:' : 'Claude:';

    const contentDiv = document.createElement('div');
    contentDiv.textContent = content;

    messageDiv.appendChild(label);
    messageDiv.appendChild(contentDiv);
    chatDisplay.appendChild(messageDiv);

    // Scroll to bottom
    chatDisplay.scrollTop = chatDisplay.scrollHeight;
  }

  showStatus(message, type = 'info') {
    const statusDisplay = this.get('#statusDisplay');
    statusDisplay.innerHTML = `<div class="status ${type}">${message}</div>`;

    // Auto-clear after 5 seconds
    setTimeout(() => {
      statusDisplay.innerHTML = '';
    }, 5000);
  }

  // ===== State Persistence =====

  saveState() {
    const state = {
      tokens: this.tokens,
      chatHistory: this.chatHistory
    };
    localStorage.setItem('lively-claude-auth-demo-state', JSON.stringify(state));
  }

  restoreState() {
    const saved = localStorage.getItem('lively-claude-auth-demo-state');
    if (saved) {
      try {
        const state = JSON.parse(saved);
        this.tokens = state.tokens;
        this.chatHistory = state.chatHistory || [];

        if (this.tokens) {
          this.displayTokens();
          this.get('#sendButton').disabled = false;

          // Restore chat history
          this.chatHistory.forEach(msg => {
            this.addMessageToChat(msg.role, msg.content);
          });
          this.chatHistory = []; // Clear to avoid duplication
        }
      } catch (error) {
        console.error('Failed to restore state:', error);
      }
    }
  }

  // ===== Lively Example =====

  async livelyExample() {
    this.showStatus('Ready to authenticate with Claude Pro', 'info');
  }
}
