#!/usr/bin/env node

/**
 * Lively4 Test Runner - Command-line interface to run tests in browser environment
 * 
 * This script launches a headless browser, navigates to Lively4, and executes
 * individual test files using the existing lively-testrunner infrastructure.
 * 
 * Usage:
 *   node scripts/test-runner.js <test-file>
 *   npm run test-single test/some-test.js
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

class Lively4TestRunner {
  constructor(options = {}) {
    this.options = {
      headless: options.headless !== false, // default true
      devtools: options.devtools === true,  // default false
      timeout: options.timeout || 60000,    // 60 second default (increased)
      lively4Url: options.lively4Url || 'http://localhost:9005/lively4-core/start.html',
      ...options
    };
    this.browser = null;
    this.page = null;
  }

  // Helper methods to filter out known non-critical errors
  isIgnorableError(message) {
    const ignorablePatterns = [
      /cached:.*URL scheme.*not supported/,
      /Failed to load resource.*font-awesome/,
      /Failed to load resource.*\.lively4bundle\.zip/,
      /net::ERR_NAME_NOT_RESOLVED.*font/,
      /WARNING cached fetch failed/
    ];
    
    return ignorablePatterns.some(pattern => pattern.test(message));
  }

  isIgnorableWarning(message) {
    const ignorablePatterns = [
      /WARNING cached fetch failed/,
      /fillTemplateStyle/,
      /SWX registration/,
      /ServiceWorker registration/
    ];
    
    return ignorablePatterns.some(pattern => pattern.test(message));
  }

  isIgnorableRequestFailure(url, failure) {
    // Ignore failures for font files, cached URLs, and bundle files
    return url.includes('font-awesome') || 
           url.includes('fontawesome') ||
           url.startsWith('cached:') ||
           url.includes('.lively4bundle.zip') ||
           url.includes('.woff') ||
           url.includes('.woff2') ||
           url.includes('.ttf');
  }

  async launch() {
    console.log('🚀 Starting Lively4 Test Runner...');
    
    this.browser = await puppeteer.launch({
      headless: this.options.headless,
      devtools: this.options.devtools,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    this.page = await this.browser.newPage();
    
    // Set up console logging
    this.page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      
      // Filter out known non-critical errors
      if (type === 'error' && !this.isIgnorableError(text)) {
        console.log('🔴 Browser Error:', text);
      } else if (type === 'warning' && !this.isIgnorableWarning(text)) {
        console.log('🟡 Browser Warning:', text);
      } else if (this.options.verbose) {
        console.log('📝 Browser Log:', text);
      }
    });

    // Set up error handling
    this.page.on('pageerror', error => {
      if (!this.isIgnorableError(error.message)) {
        console.error('💥 Page Error:', error.message);
      }
    });

    // Set up request failure handling
    this.page.on('requestfailed', request => {
      const url = request.url();
      const failure = request.failure();
      
      if (!this.isIgnorableRequestFailure(url, failure)) {
        console.log('🔴 Request Failed:', url, failure?.errorText);
      }
    });

    console.log('🌐 Loading Lively4...');
    await this.page.goto(this.options.lively4Url, { 
      waitUntil: 'domcontentloaded',
      timeout: this.options.timeout 
    });
    
    // Wait for Lively4 to finish loading
    await this.waitForLively4Ready();
    console.log('✅ Lively4 ready for testing!');
  }

  async waitForLively4Ready() {
    console.log('⏳ Waiting for Lively4 to finish loading...');
    
    // Wait for the basic lively object first
    try {
      await this.page.waitForFunction(() => {
        return window.lively && window.System;
      }, { timeout: 30000 });
      console.log('✅ Basic Lively4 systems available');
    } catch (error) {
      console.log('⚠️ Timeout waiting for basic systems, checking what we have...');
    }

    // Wait a bit longer for mocha to load (it might be slower due to service worker issues)
    try {
      await this.page.waitForFunction(() => {
        return window.mocha;
      }, { timeout: 15000 });
      console.log('✅ Mocha test framework available');
    } catch (error) {
      console.log('⚠️ Mocha not yet available, will try to proceed anyway');
    }

    // Check what's actually available
    const status = await this.page.evaluate(() => {
      return {
        hasLively: !!window.lively,
        hasSystem: !!window.System,
        hasMocha: !!window.mocha,
        hasReloadModule: window.lively && typeof window.lively.reloadModule === 'function',
        hasLively4Url: !!window.lively4url,
        bodyChildren: document.body ? document.body.children.length : 0,
        currentUrl: window.location.href
      };
    });
    
    console.log('🔍 Lively4 Status:', status);
    
    // If we have the essentials, try to continue
    if (!status.hasLively || !status.hasSystem) {
      throw new Error('Essential Lively4 systems not available');
    }
    
    // Wait a bit more for things to settle, especially service worker registration
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('✅ Proceeding with available systems');
  }

  async runTest(testFilePath) {
    console.log(`🧪 Running test: ${testFilePath}`);
    
    // Resolve the test path relative to the project root
    const absoluteTestPath = path.resolve(testFilePath);
    
    // Check if test file exists
    try {
      await fs.access(absoluteTestPath);
    } catch (error) {
      throw new Error(`Test file not found: ${testFilePath}`);
    }

    // Convert to URL path for Lively4 (relative to lively4-core)
    const relativePath = path.relative(process.cwd(), absoluteTestPath);
    console.log(`📁 Loading test from: ${relativePath}`);

    // Run the test in browser using lively-testrunner approach
    const testResult = await this.page.evaluate(async (testPath) => {
      try {
        // Load Mocha if not available
        if (!window.mocha) {
          console.log('Loading Mocha test framework...');
          
          // Load Mocha CSS
          const cssLink = document.createElement('link');
          cssLink.rel = 'stylesheet';
          cssLink.href = `${window.lively4url}/src/external/mocha.css`;
          document.head.appendChild(cssLink);
          
          // Load Mocha JS
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `${window.lively4url}/src/external/mocha.js`;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
          
          // Wait for Mocha to be available
          let attempts = 0;
          while (!window.mocha && attempts < 20) {
            await new Promise(resolve => setTimeout(resolve, 250));
            attempts++;
          }
          
          if (!window.mocha) {
            return { success: false, error: 'Failed to load Mocha test framework' };
          }
          
          // Set up Mocha
          window.mocha.setup('bdd');
          console.log('Mocha loaded and configured');
        }

        console.log('Mocha available, setting up test environment...');

        // Clear previous tests
        if (window.mocha.suite) {
          window.mocha.suite.tests.length = 0; 
          window.mocha.suite.suites.length = 0; 
        }

        // Create a container for test output
        let mochaDiv = document.querySelector('#mocha');
        if (!mochaDiv) {
          mochaDiv = document.createElement('div');
          mochaDiv.id = 'mocha';
          document.body.appendChild(mochaDiv);
        }
        mochaDiv.innerHTML = '';

        // Set up Mocha reporter to capture results
        let testResults = {
          passed: 0,
          failed: 0,
          total: 0,
          failures: [],
          output: ''
        };

        // Load the test file using lively's module system
        const testUrl = `${window.lively4url}/${testPath}`;
        console.log(`Loading test from: ${testUrl}`);
        
        // Reload and import the test module
        await window.lively.reloadModule(testUrl);
        await window.System.import(testUrl);

        console.log('Test module loaded, running tests...');

        // Run tests and capture results
        return new Promise((resolve) => {
          window.mocha.run((failures) => {
            // Capture the test output
            const mochaContent = mochaDiv.innerHTML;
            const textContent = mochaDiv.textContent || mochaDiv.innerText;
            
            // Parse results from mocha output
            const passMatch = textContent.match(/(\d+)\s+passing/);
            const failMatch = textContent.match(/(\d+)\s+failing/);
            
            testResults.passed = passMatch ? parseInt(passMatch[1]) : 0;
            testResults.failed = failMatch ? parseInt(failMatch[1]) : 0;
            testResults.total = testResults.passed + testResults.failed;
            testResults.output = textContent;
            testResults.html = mochaContent;
            testResults.success = failures === 0;

            console.log('Test execution completed:', testResults);
            resolve(testResults);
          });
        });
        
      } catch (error) {
        console.error('Test execution error:', error);
        return {
          success: false,
          error: error.message,
          stack: error.stack
        };
      }
    }, relativePath);

    return testResult;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      console.log('👋 Browser closed');
    }
  }

  // Utility method to list available tests
  static async listTests(testDir = './test') {
    try {
      const files = await fs.readdir(testDir);
      return files.filter(file => file.endsWith('.js') || file.endsWith('.spec.js'));
    } catch (error) {
      throw new Error(`Cannot read test directory: ${testDir}`);
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
🧪 Lively4 Test Runner

Usage:
  node scripts/test-runner.js <test-file>     # Run a specific test
  node scripts/test-runner.js --list          # List available tests
  node scripts/test-runner.js --help          # Show this help

Options:
  --headless=false    # Run in visible browser (default: headless)
  --devtools          # Open browser devtools
  --verbose           # Show all browser console output
  --timeout=30000     # Test timeout in milliseconds

Examples:
  node scripts/test-runner.js test/syntax-test.js
  node scripts/test-runner.js test/lively-test.js --headless=false --verbose
`);
    process.exit(0);
  }

  if (args[0] === '--list') {
    try {
      const tests = await Lively4TestRunner.listTests();
      console.log('📋 Available tests:');
      tests.forEach(test => console.log(`  - ${test}`));
    } catch (error) {
      console.error('❌ Error listing tests:', error.message);
      process.exit(1);
    }
    return;
  }

  if (args[0] === '--help') {
    console.log('🧪 Lively4 Test Runner - see usage above');
    return;
  }

  // Parse arguments - separate options from test file
  const options = {};
  let testFile = null;
  
  args.forEach(arg => {
    if (arg.startsWith('--headless=')) {
      options.headless = arg.split('=')[1] === 'true';
    } else if (arg === '--devtools') {
      options.devtools = true;
    } else if (arg === '--verbose') {
      options.verbose = true;
    } else if (arg.startsWith('--timeout=')) {
      options.timeout = parseInt(arg.split('=')[1]);
    } else if (!arg.startsWith('--')) {
      // This is the test file
      testFile = arg;
    }
  });

  if (!testFile) {
    console.error('❌ No test file specified');
    process.exit(1);
  }

  const runner = new Lively4TestRunner(options);

  try {
    await runner.launch();
    const result = await runner.runTest(testFile);
    
    console.log('\n📊 Test Results:');
    console.log('================');
    
    if (result.success) {
      console.log('✅ Tests passed!');
      console.log(result.output);
      process.exit(0);
    } else {
      console.log('❌ Tests failed!');
      if (result.error) {
        console.error('Error:', result.error);
      }
      if (result.output) {
        console.log(result.output);
      }
      process.exit(1);
    }
    
  } catch (error) {
    console.error('💥 Test runner error:', error.message);
    process.exit(1);
  } finally {
    await runner.close();
  }
}

// Handle script termination
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, closing browser...');
  process.exit(0);
});

// Export for use as a module
module.exports = Lively4TestRunner;

// Run CLI if this script is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Unhandled error:', error);
    process.exit(1);
  });
}
