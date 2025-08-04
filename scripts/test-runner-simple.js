#!/usr/bin/env node

/**
 * Lively4 Test Runner - Simple version that focuses on functionality
 * 
 * Usage:
 *   node scripts/test-runner-simple.js <test-file>
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

class Lively4TestRunner {
  constructor(options = {}) {
    this.options = {
      headless: options.headless !== false,
      devtools: options.devtools === true,
      timeout: options.timeout || 60000,
      lively4Url: options.lively4Url || 'http://localhost:9005/lively4-core/start.html',
      verbose: options.verbose === true,
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

    console.log('⏳ Loading Lively4...');
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
    
    // Wait a bit more for things to settle
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

        // Load the test file using lively's module system
        const testUrl = `${window.lively4url}/${testPath}`;
        console.log(`Loading test from: ${testUrl}`);
        
        // Reload and import the test module
        await window.lively.reloadModule(testUrl);
        await window.System.import(testUrl);

        console.log('Test module loaded, running tests...');

        // Run tests and capture results
        return new Promise((resolve) => {
          const startTime = Date.now();
          
          const runner = window.mocha.run((failures) => {
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            // Capture the test output
            const mochaContent = mochaDiv.innerHTML;
            const textContent = mochaDiv.textContent || mochaDiv.innerText;
            
            // Parse results from mocha output - handle the actual format
            const passMatch = textContent.match(/passes:\s*(\d+)/) || textContent.match(/(\d+)\s+passing/);
            const failMatch = textContent.match(/failures:\s*(\d+)/) || textContent.match(/(\d+)\s+failing/);
            
            const passed = passMatch ? parseInt(passMatch[1]) : 0;
            const failed = failMatch ? parseInt(failMatch[1]) : 0;
            const total = passed + failed;
            
            const result = {
              success: failures === 0,
              passed: passed,
              failed: failed,
              total: total,
              duration: duration,
              output: textContent,
              html: mochaContent
            };

            console.log('Test execution completed:', result);
            resolve(result);
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
      console.log('ℹ️ Browser closed');
    }
  }

  // Parse individual tests from HTML and display results
  static printTestResults(result, testFile) {
    const fileName = path.basename(testFile);
    
    console.log(`\n═══════════════════════════════════════════════════════════`);
    console.log(`Test Results: ${fileName}`);
    console.log(`═══════════════════════════════════════════════════════════`);
    
    if (!result.success && result.error) {
      console.log(`❌ Test execution failed: ${result.error}`);
      return;
    }
    
    // Parse individual tests from HTML
    const tests = this.parseIndividualTests(result.html);
    
    console.log(`📊 Total: ${result.total} tests`);
    console.log(`✅ Passed: ${result.passed}`);
    console.log(`❌ Failed: ${result.failed}`);
    console.log(`⏱️  Duration: ${(result.duration / 1000).toFixed(2)}s`);
    
    // Show individual test results
    if (tests.length > 0) {
      console.log(`\n� Individual Test Results:`);
      tests.forEach((test, index) => {
        const status = test.passed ? '✅' : '❌';
        const duration = test.duration ? ` (${test.duration})` : '';
        console.log(`  ${status} ${test.name}${duration}`);
        
        if (!test.passed && test.error) {
          console.log(`     💥 ${test.error}`);
        }
      });
    }
    
    console.log(`═══════════════════════════════════════════════════════════`);
    
    if (result.success) {
      console.log(`\n🎉 ALL TESTS PASSED`);
    } else {
      console.log(`\n💥 SOME TESTS FAILED`);
    }
  }

  // Parse individual test details from Mocha HTML output
  static parseIndividualTests(html) {
    if (!html) return [];
    
    const tests = [];
    
    // Use regex to find test elements in the HTML
    const testPattern = /<li class="test (pass|fail)[^"]*"[^>]*>[\s\S]*?<h2[^>]*>(.*?)<span class="duration">([^<]*)<\/span>[\s\S]*?<\/li>/g;
    
    let match;
    while ((match = testPattern.exec(html)) !== null) {
      const [, status, nameHtml, duration] = match;
      
      // Clean up the test name (remove HTML tags and decode entities)
      const name = nameHtml
        .replace(/<[^>]+>/g, '') // Remove HTML tags
        .replace(/&gt;/g, '>')   // Decode HTML entities
        .replace(/&lt;/g, '<')
        .replace(/&amp;/g, '&')
        .trim();
      
      tests.push({
        name: name,
        passed: status === 'pass',
        failed: status === 'fail',
        duration: duration.trim(),
        error: null // Could extract error details if needed
      });
    }
    
    return tests;
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: node scripts/test-runner-simple.js <test-file>');
    process.exit(1);
  }
  
  const testFile = args[0];
  const options = {
    verbose: args.includes('--verbose'),
    headless: !args.includes('--headless=false'),
    devtools: args.includes('--devtools')
  };
  
  const runner = new Lively4TestRunner(options);
  
  try {
    await runner.launch();
    const result = await runner.runTest(testFile);
    
    Lively4TestRunner.printTestResults(result, testFile);
    
    // Exit with appropriate code
    process.exit(result.success ? 0 : 1);
    
  } catch (error) {
    console.error('💥 Test runner failed:', error.message);
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    await runner.close();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = Lively4TestRunner;
