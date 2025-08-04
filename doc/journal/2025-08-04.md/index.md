## 2025-08-04 Browser-Based Testing CLI Integration

### META 

**This is the first entry that uses agent support for generation!**


### Problem
Karma test execution has significant overhead (~20-25s) due to full startup cycle. Need command-line interface to existing lively4-server for faster individual test runs.

### Solution
Implemented Puppeteer-based test runner that automates headless Chrome to execute tests in Lively4 environment.

**Architecture**: CLI → Puppeteer → Chrome → Lively4 → Mocha

### Implementation

#### Files Created:
1. [scripts/explore-lively4.js](edit://scripts/explore-lively4.js) - Environment loading analysis
2. [scripts/test-runner.js](edit://scripts/test-runner.js) - Production CLI test runner  
3. Updated [package.json](edit://package.json) - Added puppeteer dependency and npm scripts

#### Technical Approach:
- **Browser Automation**: Puppeteer launches Chrome, navigates to start.html
- **Readiness Detection**: Wait for `window.lively`, `window.System` availability
- **Mocha Integration**: Dynamic loading when not pre-loaded, setup with 'bdd' interface
- **Module Loading**: Uses `lively.reloadModule()` + `System.import()` pattern
- **Result Parsing**: Extract pass/fail counts from Mocha HTML output

#### Service Worker Compatibility:
Lively4's custom URL schemes (`cached:`, font-awesome) fail in Puppeteer. Implemented error filtering:
```javascript
isIgnorableError(message) {
  return /cached:.*URL scheme.*not supported/.test(message) ||
         /Failed to load resource.*font-awesome/.test(message);
}
```

#### CLI Interface:
```bash
npm run test-single test/lively-test.js    # Headless execution
npm run test-debug test/utils-test.js      # Visible browser + devtools  
npm run test-list                          # List available tests
```

### Results
- **Performance**: 8-13s vs 20-25s (50% improvement)
- **Test Compatibility**: 100% - uses existing test files unchanged
- **Verification**: Successfully ran test/lively-test.js (17 tests) and test/utils-test.js (21 tests)

### Technical Issues Resolved
1. **Argument Parsing**: Position-independent CLI argument handling
2. **Mocha Loading**: Dynamic framework injection when unavailable  
3. **Service Worker Errors**: Non-critical resource failure filtering
4. **Module System**: Integration with Lively4's hot reloading

## Puppeteer Capabilities Analysis

### What Puppeteer Provides:
- **Browser automation** - Launch, navigate, control Chrome programmatically
- **JavaScript execution** - Run code in browser context, get results back  
- **Console capture** - Capture all console.log, errors from tests
- **Exception handling** - Browser errors become Node.js exceptions
- **Network monitoring** - Track file loading success/failure
- **Performance timing** - Measure test execution time

### What We Need to Build:
- **Lively4 readiness detection** - Know when environment is fully loaded
- **Test result extraction** - Get structured Mocha results 
- **CLI interface** - Argument parsing, colored terminal output
- **Session attachment** - Connect to existing browser for hot-loading

## Implementation Sketch

```js
// scripts/test-runner.js
const puppeteer = require('puppeteer');

class Lively4TestRunner {
  async runTest(testFile, options = {}) {
    if (options.attach) {
      return this.runInExistingSession(testFile);
    } else {
      return this.runInFreshSession(testFile);
    }
  }
  
  async runInFreshSession(testFile) {
    const browser = await puppeteer.launch({ headless: !process.env.DEBUG });
    const page = await browser.newPage();
    
    // Navigate and wait for Lively4
    await page.goto('http://localhost:9005/lively4-core/start.html');
    await this.waitForLively4Ready(page);
    
    // Execute test using existing lively-testrunner
    const results = await page.evaluate(async (testFile) => {
      const runner = await lively.openComponentInWindow('lively-testrunner');
      runner.setTestPath(testFile);
      await runner.clearTests();
      await runner.resetMocha();
      await runner.loadTests();
      return await runner.runTests();
    }, testFile);
    
    await browser.close();
    return results;
  }
  
  async waitForLively4Ready(page) {
    await page.waitForFunction(() => {
      return window.lively && 
             window.lively.components && 
             document.readyState === 'complete';
    }, { timeout: 30000 });
  }
}
```

## Benefits

### Performance Comparison:
| Workflow | Startup Time | Test Execution | Hot Reload |
|----------|--------------|----------------|------------|
| Karma | ~10-30s | Normal | No |
| Fresh Browser | ~3-5s | Fast | Yes |  
| Hot-Load | ~0.5s | Very Fast | Yes |

### Developer Experience:
- **Instant feedback** during TDD workflows
- **Preserve development context** with hot-loading
- **Standard CLI interface** integrates with existing tools
- **Same test files** - no duplication needed

## Next Steps

1. **Add Puppeteer dependency** - ~300MB but very powerful
2. **Implement basic fresh session runner** 
3. **Add CLI interface** with colored output
4. **Integrate with npm scripts** - `npm run test:single <file>`
5. **Explore session attachment** for hot-loading approach

## Architecture Insight

This leverages Lively4's core strengths:
- **Persistent lively4-server** avoids cold starts
- **SystemJS + Babel** provides module loading/transpilation  
- **Hot module reloading** enables instant test updates
- **Component architecture** allows focused test runners
- **Browser-native environment** - no impedance mismatch

The key is providing a **command-line interface** to the existing excellent browser-based test infrastructure, rather than rebuilding it.

## Discussion Points

- Should we assume lively4-server is running or auto-start it?
- Preferred output format: colored terminal, JSON, or TAP?  
- Integration with existing npm scripts vs standalone tool?
- Session attachment via Chrome debugging protocol?

This could provide the best of both worlds: **command-line convenience** with **browser development speed**.

---

## Implementation - COMPLETED

### Files
- [scripts/explore-lively4.js](edit://scripts/explore-lively4.js) - Environment loading analysis
- [scripts/test-runner.js](edit://scripts/test-runner.js) - CLI test runner
- [package.json](edit://package.json) - Added npm scripts, Puppeteer dependency

### Features
- [x] CLI: `npm run test-single <file>`
- [x] Error filtering (service worker, font-awesome)
- [x] Dynamic Mocha loading
- [x] Module system integration (`lively.reloadModule()` + `System.import()`)
- [x] Exit codes, debug mode (`--headless=false --devtools`)

### Performance
- Karma: 20-25s → New runner: 8-13s (50% improvement)
- Test results: `test/lively-test.js` (17 tests), `test/utils-test.js` (21 tests)

### Technical Issues
1. Service worker custom URLs (`cached:`) filtered as non-critical
2. Mocha availability timing handled with dynamic loading
3. Module loading integrated with hot reloading

### Usage
```bash
npm run test-single test/lively-test.js
npm run test-list
npm run test-single test/utils-test.js --headless=false --devtools
```

### Architecture
Leverages persistent lively4-server, SystemJS+Babel, component system, browser environment for 100% test compatibility.

### Future
- [ ] Hot browser sessions (1-2s target)
- [ ] Parallel testing
- [ ] Test pattern matching
- [ ] VS Code integration
