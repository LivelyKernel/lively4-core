#!/usr/bin/env node
/**
 * Lively4 Browser Test Runner - Initial Exploration
 * 
 * This script explores when Lively4 is ready for testing by:
 * 1. Launching a browser with Puppeteer
 * 2. Navigating to lively4-server
 * 3. Monitoring the loading process
 * 4. Detecting when the environment is ready
 */

const puppeteer = require('puppeteer');
const path = require('path');

class Lively4Explorer {
  constructor(options = {}) {
    this.options = {
      headless: !process.env.DEBUG, // Set DEBUG=1 to see browser
      serverUrl: 'http://localhost:9005',
      timeout: 60000, // 60 seconds
      ...options
    };
  }

  async explore() {
    console.log('🚀 Launching browser to explore Lively4 loading...');
    
    const browser = await puppeteer.launch({ 
      headless: this.options.headless,
      defaultViewport: { width: 1280, height: 720 }
    });
    
    try {
      const page = await browser.newPage();
      
      // Set up console monitoring
      this.setupConsoleMonitoring(page);
      
      // Set up network monitoring
      this.setupNetworkMonitoring(page);
      
      // Navigate to Lively4
      console.log(`📡 Navigating to ${this.options.serverUrl}/lively4-core/start.html`);
      const startTime = Date.now();
      
      await page.goto(`${this.options.serverUrl}/lively4-core/start.html`, {
        waitUntil: 'domcontentloaded',
        timeout: this.options.timeout
      });
      
      console.log(`📄 DOM loaded in ${Date.now() - startTime}ms`);
      
      // Monitor loading stages
      await this.monitorLoadingStages(page);
      
      // Try to interact with Lively4
      await this.testLively4Interaction(page);
      
    } catch (error) {
      console.error('❌ Error during exploration:', error.message);
      throw error;
    } finally {
      if (!process.env.DEBUG) {
        await browser.close();
      } else {
        console.log('🔍 Browser left open for debugging (DEBUG=1)');
      }
    }
  }
  
  setupConsoleMonitoring(page) {
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      
      // Log important console messages
      if (type === 'error') {
        console.log(`🔴 Browser Error: ${text}`);
      } else if (type === 'warn') {
        console.log(`🟡 Browser Warning: ${text}`);
      } else if (text.includes('lively') || text.includes('SystemJS') || text.includes('loaded')) {
        console.log(`📝 Browser Log: ${text}`);
      }
    });
    
    page.on('pageerror', error => {
      console.log(`💥 Page Error: ${error.message}`);
    });
  }
  
  setupNetworkMonitoring(page) {
    let requestCount = 0;
    let responseCount = 0;
    
    page.on('request', request => {
      requestCount++;
      const url = request.url();
      if (url.includes('lively4') && !url.includes('.png') && !url.includes('.jpg')) {
        console.log(`🌐 Request: ${url.replace(/.*\//, '')}`);
      }
    });
    
    page.on('response', response => {
      responseCount++;
      const url = response.url();
      const status = response.status();
      
      if (status >= 400 && url.includes('lively4')) {
        console.log(`❌ Failed Response: ${status} ${url.replace(/.*\//, '')}`);
      }
    });
  }
  
  async monitorLoadingStages(page) {
    console.log('\n🔍 Monitoring Lively4 loading stages...');
    
    const stages = [
      {
        name: 'Document Ready',
        check: () => document.readyState === 'complete'
      },
      {
        name: 'Window Lively Available',
        check: () => typeof window.lively !== 'undefined'
      },
      {
        name: 'SystemJS Available',
        check: () => typeof window.System !== 'undefined'
      },
      {
        name: 'Lively Components Available',
        check: () => window.lively && typeof window.lively.components !== 'undefined'
      },
      {
        name: 'Lively Files Available',
        check: () => window.lively && typeof window.lively.files !== 'undefined'
      },
      {
        name: 'Body Contains Content',
        check: () => document.body && document.body.children.length > 0
      },
      {
        name: 'Test Runner Available',
        check: () => window.lively && window.lively.components && 
                    typeof window.lively.components.loadByName === 'function'
      }
    ];
    
    for (const stage of stages) {
      const startTime = Date.now();
      
      try {
        await page.waitForFunction(stage.check, { 
          timeout: 30000,
          polling: 100 
        });
        
        const duration = Date.now() - startTime;
        console.log(`✅ ${stage.name} - Ready in ${duration}ms`);
        
      } catch (error) {
        console.log(`❌ ${stage.name} - Timeout after 30s`);
        break; // Don't continue if a stage fails
      }
    }
  }
  
  async testLively4Interaction(page) {
    console.log('\n🧪 Testing Lively4 interactions...');
    
    try {
      // Test 1: Check lively object properties
      const livelyInfo = await page.evaluate(() => {
        if (!window.lively) return { available: false };
        
        return {
          available: true,
          hasComponents: !!window.lively.components,
          hasFiles: !!window.lively.files,
          hasOpenComponentInWindow: typeof window.lively.openComponentInWindow === 'function',
          bodyChildrenCount: document.body.children.length,
          url: window.location.href
        };
      });
      
      console.log('📊 Lively4 Status:', JSON.stringify(livelyInfo, null, 2));
      
      // Test 2: Try to load a simple component
      if (livelyInfo.hasOpenComponentInWindow) {
        console.log('🔧 Testing component loading...');
        
        const componentTest = await page.evaluate(async () => {
          try {
            // Try to load the test runner component
            const component = await window.lively.openComponentInWindow('lively-testrunner');
            return {
              success: true,
              componentType: component ? component.tagName : 'unknown',
              hasSetTestPath: typeof component.setTestPath === 'function'
            };
          } catch (error) {
            return {
              success: false,
              error: error.message
            };
          }
        });
        
        console.log('🧩 Component Test:', JSON.stringify(componentTest, null, 2));
      }
      
      // Test 3: Check if we can access test files
      if (livelyInfo.hasFiles) {
        console.log('📁 Testing file system access...');
        
        const fileTest = await page.evaluate(async () => {
          try {
            const testFiles = await window.lively.files.statFile('https://lively4/test/');
            return {
              success: true,
              isDirectory: JSON.parse(testFiles).type === 'directory'
            };
          } catch (error) {
            return {
              success: false,
              error: error.message
            };
          }
        });
        
        console.log('📂 File System Test:', JSON.stringify(fileTest, null, 2));
      }
      
    } catch (error) {
      console.log(`❌ Interaction test failed: ${error.message}`);
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const options = {};
  
  // Parse simple command line arguments
  if (args.includes('--visible')) {
    options.headless = false;
  }
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Lively4 Browser Test Explorer

Usage: node scripts/explore-lively4.js [options]

Options:
  --visible    Show browser window (same as DEBUG=1)
  --help, -h   Show this help

Environment Variables:
  DEBUG=1      Show browser window for debugging
  
Examples:
  node scripts/explore-lively4.js
  DEBUG=1 node scripts/explore-lively4.js
  node scripts/explore-lively4.js --visible
`);
    return;
  }
  
  const explorer = new Lively4Explorer(options);
  
  try {
    await explorer.explore();
    console.log('\n🎉 Exploration completed successfully!');
  } catch (error) {
    console.error('\n💥 Exploration failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = Lively4Explorer;
