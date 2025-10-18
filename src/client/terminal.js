
/*
 * Terminal - Client-side terminal interface for non-interactive command execution
 * 
 * This provides a programmatic interface to execute commands on the lively4-server
 * without requiring a UI component. It handles authentication and session management
 * automatically.
 */

import ServerAuth from './server-auth.js'

export default class Terminal {
  constructor(options = {}) {
    this.url = options.url || lively4url
    this.cwd = options.cwd || "/lively4-core"
    this.serverAuth = new ServerAuth({ silent: true })
  }

  /**
   * Execute a command non-interactively and return the result
   * @param {string} command - The command to execute
   * @returns {Promise<Object>} Promise resolving to {stdout, stderr, error}
   */
  async run(command) {
    if (!command || typeof command !== 'string') {
      throw new Error("Command must be a non-empty string")
    }
    
    try {
      // Ensure we're authenticated first
      await this.serverAuth.ensureAuthenticated(this.url)
      
      // Extract server base URL without repository path
      var serverBaseURL = ServerAuth.extractServerBaseURL(this.url)
      const runURL = `${serverBaseURL}/_terminal/run`
      
      const response = await fetch(runURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ command })
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Command execution failed: ${response.status} - ${errorText}`)
      }
      
      const result = await response.json()
      return result
      
    } catch (error) {
      throw new Error(`Error executing command: ${error.message}`)
    }
  }

  /**
   * Execute a command and return only the stdout as a string
   * @param {string} command - The command to execute
   * @returns {Promise<string>} Promise resolving to stdout
   */
  async exec(command) {
    const result = await this.run(command)
    if (result.error) {
      throw new Error(`Command failed: ${result.stderr || result.error.message || 'Unknown error'}`)
    }
    return result.stdout
  }

  /**
   * Set the working directory for commands
   */
  setCwd(cwd) {
    this.cwd = cwd
  }

  /**
   * Get the current working directory
   */
  getCwd() {
    return this.cwd
  }

  /**
   * Check if user is authenticated
   * @returns {Promise<boolean>} Authentication status
   */
  async isAuthenticated() {
    return await this.serverAuth.isAuthenticated()
  }

  /**
   * Get the current GitHub username
   * @returns {Promise<string|null>} Username or null
   */
  async getUsername() {
    return await this.serverAuth.getUsername()
  }

  /**
   * Logout (clear stored credentials)
   */
  async logout() {
    await this.serverAuth.clearCredentials()
  }
}