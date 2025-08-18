/*
 * ServerAuth - Shared authentication utilities for lively4-server interactions
 * 
 * This module provides centralized authentication handling for GitHub OAuth
 * and lively4-server login functionality, eliminating code duplication across
 * terminal.js, lively-xterm.js, and lively-sync.js components.
 * 
 * Usage:
 *   const auth = new ServerAuth({ silent: true })
 *   await auth.ensureAuthenticated(serverUrl)
 *   const headers = await auth.getAuthHeaders('/some/path')
 */

export default class ServerAuth {
  constructor(options = {}) {
    this.silent = options.silent || false
    this.storagePrefix = options.storagePrefix || "LivelySync_"
  }

  /**
   * Get authentication headers for server requests
   * @param {string} cwd - Current working directory (optional)
   * @returns {Promise<Object>} Auth headers object
   */
  async getAuthHeaders(cwd = null) {
    const username = await this.loadValue("githubUsername")
    const token = await this.loadValue("githubToken")
    
    const headers = {
      gitusername: username,
      gitpassword: token
    }
    
    if (cwd) {
      headers.cwd = cwd
    }
    
    return headers
  }

  /**
   * Load cached credentials
   * @returns {Promise<Object>} Object with username and token
   */
  async loadCredentials() {
    const username = await this.loadValue("githubUsername")
    const token = await this.loadValue("githubToken")
    
    return { username, token }
  }

  /**
   * Store GitHub credentials in local storage
   * @param {string} username - GitHub username
   * @param {string} token - GitHub token
   */
  async storeCredentials(username, token) {
    await this.storeValue("githubUsername", username)
    await this.storeValue("githubToken", token)
    
    if (!this.silent) {
      lively.notify("GitHub authentication successful")
    }
  }

  /**
   * Clear stored credentials (logout)
   */
  async clearCredentials() {
    await this.storeValue("githubToken", null)
    await this.storeValue("githubUsername", null)
    await this.storeValue("githubEmail", null)
    
    if (!this.silent) {
      lively.notify("Logged out successfully")
    }
  }

  /**
   * Load a value from local storage with prefix
   * @param {string} key - Storage key (without prefix)
   * @returns {Promise<string>} Stored value
   */
  async loadValue(key) {
    return lively.focalStorage.getItem(this.storagePrefix + key)
  }

  /**
   * Store a value in local storage with prefix
   * @param {string} key - Storage key (without prefix)  
   * @param {string} value - Value to store
   */
  async storeValue(key, value) {
    return lively.focalStorage.setItem(this.storagePrefix + key, value)
  }

  /**
   * Perform GitHub OAuth authentication flow
   * @returns {Promise<Object>} Object with username and token
   */
  async performGitHubAuth() {
    return new Promise((resolve, reject) => {
      lively.authGithub.challengeForAuth(Date.now(), async (token) => {
        try {
          // Get user info from GitHub API
          const userResponse = await fetch("https://api.github.com/user", {
            headers: { Authorization: "token " + token }
          })
          const user = await userResponse.json()
          const username = user.login
          
          // Store credentials
          await this.storeCredentials(username, token)
          
          resolve({ username, token })
          
        } catch (error) {
          reject(error)
        }
      })
    })
  }

  /**
   * Perform server login with GitHub credentials
   * @param {string} serverUrl - Base server URL
   * @param {string} username - GitHub username
   * @param {string} token - GitHub token
   * @returns {Promise<boolean>} Success status
   */
  async performServerLogin(serverUrl, username, token) {
    const serverBaseURL = ServerAuth.extractServerBaseURL(serverUrl)
    const loginURL = `${serverBaseURL}/_auth/login`
    
    const loginResponse = await fetch(loginURL, {
      method: "POST",
      headers: {
        'gitusername': username,
        'gitpassword': token
      }
    })
    
    if (!loginResponse.ok) {
      const errorText = await loginResponse.text()
      throw new Error(`Server login failed: ${loginResponse.status} - ${errorText}`)
    }
    
    return true
  }

  /**
   * Ensure we have valid authentication for the server
   * @param {string} serverUrl - Server URL (defaults to lively4url)
   * @returns {Promise<boolean>} Success status
   */
  async ensureAuthenticated(serverUrl = null) {
    try {
      serverUrl = serverUrl || lively4url
      
      // First check if we have cached credentials
      let { username, token } = await this.loadCredentials()
      
      if (!username || !token) {
        // Perform GitHub OAuth flow
        const credentials = await this.performGitHubAuth()
        username = credentials.username
        token = credentials.token
      }
      
      if (!username || !token) {
        throw new Error("Authentication cancelled or failed")
      }
      
      // Perform server login
      await this.performServerLogin(serverUrl, username, token)
      
      return true
      
    } catch (error) {
      const message = `Authentication failed: ${error.message}`
      
      if (this.silent) {
        throw new Error(message)
      } else {
        lively.warn(message)
        return false
      }
    }
  }

  /**
   * Extract server base URL without repository path
   * @param {string} url - Full lively4 URL
   * @returns {string} Server base URL
   */
  static extractServerBaseURL(url) {
    return url.replace(/\/[^\/]*$/, "")
  }

  /**
   * Check if user is currently authenticated
   * @returns {Promise<boolean>} Authentication status
   */
  async isAuthenticated() {
    const { username, token } = await this.loadCredentials()
    return !!(username && token)
  }

  /**
   * Get GitHub username if authenticated
   * @returns {Promise<string|null>} Username or null
   */
  async getUsername() {
    return await this.loadValue("githubUsername")
  }

  /**
   * Get GitHub token if authenticated  
   * @returns {Promise<string|null>} Token or null
   */
  async getToken() {
    return await this.loadValue("githubToken")
  }
}