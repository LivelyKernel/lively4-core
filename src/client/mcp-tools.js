/*MD 
# MCP Tools

Client-side MCP (Model Context Protocol) tool implementations for Lively4.
These tools are executed in the browser and handle the actual work requested by Claude Code through the MCP protocol.

**Architecture:**
- Each tool follows the exact naming from the MCP protocol specification
- Tools receive arguments and a context object for interacting with the UI component
- Consistent error handling and result serialization across all tools

MD*/

import boundEval from "src/client/bound-eval.js";

/**
 * MCP Tools implementation for Lively4 browser environment
 */
export const Tools = {
  /**
   * Execute JavaScript code in the live Lively4 environment
   * Uses boundEval for proper SystemJS integration and workspace management
   * Returns structured MCP response with result, console output, and error details
   */
  'evaluate-code': {
    metadata: {
      description: "Execute JavaScript code in a Lively4 browser session. If sessionId is not provided, automatically selects an available session.",
      inputSchema: {
        type: "object",
        properties: {
          sessionId: {
            type: "string",
            description: "Target Lively4 session ID (optional - auto-selects if not provided)"
          },
          code: {
            type: "string",
            description: "JavaScript code to evaluate in the live environment"
          },
          timeout: {
            type: "number",
            description: "Timeout in milliseconds (default: 30000)",
            default: 30000
          }
        },
        required: ["code"]
      }
    },

    async execute(args, context) {
      const { code } = args;
      context.logActivity('request', `Evaluating: ${code.substring(0, 50)}${code.length > 50 ? '...' : ''}`);
      
      // Capture console messages
      const consoleMessages = [];
      const originalConsole = {
        log: console.log,
        warn: console.warn,
        error: console.error,
        info: console.info,
        debug: console.debug
      };
      
      // Override console methods to capture output
      const captureConsole = (level, originalMethod) => {
        console[level] = (...args) => {
          // Call original method to maintain normal browser console behavior
          originalMethod.apply(console, args);
          
          // Capture the message for our response
          const message = args.map(arg => {
            if (typeof arg === 'object') {
              try {
                return JSON.stringify(arg, null, 2);
              } catch {
                return String(arg);
              }
            }
            return String(arg);
          }).join(' ');
          
          consoleMessages.push({ level, message });
        };
      };
      
      captureConsole('log', originalConsole.log);
      captureConsole('warn', originalConsole.warn);
      captureConsole('error', originalConsole.error);
      captureConsole('info', originalConsole.info);
      captureConsole('debug', originalConsole.debug);
      
      try {
        let evalResult;
        try {
          // Use boundEval for proper evaluation with SystemJS support
          evalResult = await boundEval(code, this, lively4url + "/");
        } catch (systemError) {
          // Catch any SystemJS or module loading errors
          throw new Error(`Code evaluation failed: ${systemError.message || systemError}`);
        }

        // Check if evaluation resulted in an error
        if (evalResult.isError) {
          const error = evalResult.value;

          // Enhance error message with console output if any
          if (consoleMessages.length > 0) {
            const consoleOutput = consoleMessages.map(({level, message}) => `${level}: ${message}`).join('\n');
            const enhancedMessage = `${error.message}\n\nConsole output before error:\n${consoleOutput}`;
            const enhancedError = new Error(enhancedMessage);
            enhancedError.name = error.name;
            enhancedError.stack = error.stack;
            throw enhancedError;
          }

          throw error;
        }

        // Transpilation errors are now properly propagated from boundEval via System.import
        // No need for console.log workaround anymore - see bound-eval.js and systemjs-config.js

        let result = evalResult.value;

        // Handle promises by awaiting them
        if (result && typeof result === 'object' && typeof result.then === 'function') {
          try {
            result = await result;
          } catch (promiseError) {
            // Enhance promise error with console output
            if (consoleMessages.length > 0) {
              const consoleOutput = consoleMessages.map(({level, message}) => `${level}: ${message}`).join('\n');
              const enhancedMessage = `Promise rejected: ${promiseError.message}\n\nConsole output before error:\n${consoleOutput}`;
              const enhancedError = new Error(enhancedMessage);
              enhancedError.name = promiseError.name || 'PromiseRejectionError';
              enhancedError.stack = promiseError.stack;
              throw enhancedError;
            }
            throw new Error(`Promise rejected: ${promiseError.message || promiseError}`);
          }
        }
        
        // Convert result to string for display
        let resultString;
        if (typeof result === 'object') {
          try {
            resultString = JSON.stringify(result, null, 2);
          } catch (jsonError) {
            resultString = String(result);
          }
        } else if (result === undefined) {
          resultString = 'undefined';
        } else {
          resultString = String(result);
        }
        
        // Return formatted result with console output
        return this.formatExecutionResult({
          success: true,
          result: resultString,
          consoleOutput: consoleMessages,
          code: code
        });
        
      } catch (error) {
        // Re-throw the original error
        throw error;
        
      } finally {
        // Restore original console methods
        Object.assign(console, originalConsole);
      }
    },
    
    /**
     * Serialize error object with full details
     */
    serializeError(error) {
      return {
        name: error.name || 'Error',
        message: error.message || String(error),
        stack: error.stack || null,
        type: error.constructor?.name || 'Error'
      };
    },
    
    /**
     * Format execution result for MCP response
     */
    formatExecutionResult({ success, result, error, consoleOutput, code }) {
      let output = [];
      
      if (success) {
        output.push(`✅ Code executed successfully:\n\`\`\`javascript\n${code}\n\`\`\``);
        output.push(`**Result:** ${result}`);
      } else {
        output.push(`❌ Code execution failed:\n\`\`\`javascript\n${code}\n\`\`\``);
        output.push(`**Error:** ${error.name}: ${error.message}`);
        
        if (error.stack) {
          // Clean up stack trace for better readability
          const cleanStack = error.stack
            .split('\n')
            .filter(line => !line.includes('workspace:') && !line.includes('SystemJS'))
            .slice(0, 5) // Limit to first 5 relevant lines
            .join('\n');
          
          if (cleanStack.trim()) {
            output.push(`**Stack trace:**\n\`\`\`\n${cleanStack}\n\`\`\``);
          }
        }
      }
      
      // Add console output if any
      if (consoleOutput.length > 0) {
        output.push('\n**Console output:**');
        consoleOutput.forEach(({ level, message }) => {
          const emoji = {
            log: '📝',
            warn: '⚠️',
            error: '🔴',
            info: 'ℹ️',
            debug: '🐛'
          }[level] || '📝';
          
          output.push(`${emoji} **${level}:** ${message}`);
        });
      }
      
      return output.join('\n');
    }
  },

  /**
   * Run tests in a browser session using a persistent test runner
   * Supports filtering tests by pattern and errors-only mode for minimal output
   */
  'run-tests': {
    metadata: {
      description: "Run tests in a Lively4 browser session using a persistent test runner. Can run all tests or a single file. Supports minimal output mode to reduce token usage.",
      inputSchema: {
        type: "object",
        properties: {
          sessionId: {
            type: "string",
            description: "Target Lively4 session ID (optional - auto-selects if not provided)"
          },
          testPath: {
            type: "string",
            description: "Path to test file relative to lively4-core (e.g., 'test/client/strings-test.js'). Not required if runAll is true."
          },
          runAll: {
            type: "boolean",
            description: "If true, run all test files in the test/ directory. Returns minimal summary output. (default: false)",
            default: false
          },
          grep: {
            type: "string",
            description: "Optional Mocha grep pattern to filter tests by name (e.g., 'toUpperCaseFirst')"
          },
          errorsOnly: {
            type: "boolean",
            description: "If true, only return failed tests to minimize output (default: false)",
            default: false
          }
        },
        required: []
      }
    },

    async execute(args, context) {
      const { testPath, runAll = false, grep, errorsOnly = false } = args;

      // Validate parameters
      if (!runAll && !testPath) {
        throw new Error('Either testPath or runAll=true must be provided');
      }

      // Handle runAll case - execute all tests with minimal output
      if (runAll) {
        return await this.runAllTests(args, context);
      }

      context.logActivity('request', `Running tests: ${testPath}${grep ? ` (filtered: ${grep})` : ''}`);

      try {
        // Find or create persistent test runner with MCP label
        let testRunner = await this.findOrCreateTestRunner(context);

        // Import the test runner component to access its methods
        const TestRunner = await System.import('src/components/tools/lively-testrunner.js');

        // Ensure Mocha is loaded and initialized
        if (!window.mocha) {
          context.logActivity('info', 'Loading Mocha...');
          await lively.loadJavaScriptThroughDOM("mochaJS", lively4url + "/src/external/mocha.js", true);
          mocha.setup("bdd");
        }

        // Clear any previous tests
        if (window.mocha && window.mocha.suite) {
          mocha.suite.suites = [];
          mocha.suite.tests = [];
        }

        // Build full test file URL
        const testUrl = lively4url + '/' + testPath.replace(/^\//, '');

        context.logActivity('info', `Loading test file: ${testUrl}`);

        // Reload and import the test module
        await lively.reloadModule(testUrl);
        await System.import(testUrl);

        // Set up grep filter if provided
        if (grep && window.mocha) {
          mocha.grep(grep);
        }

        // Collect test results
        const results = {
          passed: [],
          failed: [],
          hookFailures: [],
          startTime: Date.now()
        };

        // Set up custom reporter to capture results
        if (window.mocha) {
          mocha.reporter(function CustomReporter(runner) {
            runner.on('pass', (test) => {
              results.passed.push({
                title: test.fullTitle(),
                duration: test.duration
              });
            });

            runner.on('fail', (test, error) => {
              const failureData = {
                title: test.fullTitle(),
                duration: test.duration,
                error: {
                  name: error.name || 'Error',
                  message: error.message || String(error),
                  stack: error.stack || null
                }
              };
              
              // Distinguish between test failures and hook failures
              if (test.type === 'hook') {
                results.hookFailures.push(failureData);
              } else {
                results.failed.push(failureData);
              }
            });
          });
        }

        context.logActivity('info', 'Executing tests...');

        // Run the tests and wait for completion
        const failures = await new Promise((resolve, reject) => {
          if (!window.mocha) {
            reject(new Error('Mocha not loaded'));
            return;
          }

          try {
            mocha.run((failureCount) => {
              resolve(failureCount);
            });
          } catch (error) {
            reject(error);
          }
        });

        results.endTime = Date.now();
        results.totalDuration = results.endTime - results.startTime;

        context.logActivity('success', `Tests completed: ${results.passed.length} passed, ${results.failed.length} failed`);

        // Format and return results
        return this.formatTestResults(results, errorsOnly, testPath, grep);

      } catch (error) {
        context.logActivity('error', `Test execution failed: ${error.message}`);
        throw new Error(`Failed to run tests: ${error.message}`);
      }
    },

    /**
     * Find existing MCP test runner or create a new one
     */
    async findOrCreateTestRunner(context) {
      // Look for existing test runner with MCP label
      const existingRunners = document.querySelectorAll('lively-testrunner');
      for (let runner of existingRunners) {
        if (runner.getAttribute('data-mcp-label') === 'test-runner') {
          context.logActivity('info', 'Using existing MCP test runner');
          return runner;
        }
      }

      // Create new test runner if none found
      context.logActivity('info', 'Creating new MCP test runner');
      const runner = await lively.openComponentInWindow('lively-testrunner');

      // Label it for future use
      if (runner && runner.tagName === 'LIVELY-TESTRUNNER') {
        runner.setAttribute('data-mcp-label', 'test-runner');
      } else if (runner && runner.childNodes) {
        // If runner is a window, find the actual component inside
        const actualRunner = runner.querySelector('lively-testrunner');
        if (actualRunner) {
          actualRunner.setAttribute('data-mcp-label', 'test-runner');
        }
      }

      return runner;
    },

    /**
     * Format test results for MCP response
     */
    formatTestResults(results, errorsOnly, testPath, grep) {
      const { passed, failed, hookFailures = [], totalDuration } = results;
      const totalTests = passed.length + failed.length;

      let output = [];

      // Hook failures prevent tests from running - show them prominently
      if (hookFailures.length > 0) {
        output.push(`⚠️  **${hookFailures.length} hook failure${hookFailures.length > 1 ? 's' : ''} prevented tests from running**`);
        output.push('');
        
        hookFailures.forEach((hook, index) => {
          output.push(`**Hook Failure ${index + 1}:** ${hook.title}`);
          output.push(`   ${hook.error.name}: ${hook.error.message}`);
          
          if (hook.error.stack) {
            const stackLines = hook.error.stack.split('\n').slice(1, 4);
            if (stackLines.length > 0) {
              output.push('   ```');
              stackLines.forEach(line => output.push(`   ${line.trim()}`));
              output.push('   ```');
            }
          }
          output.push('');
        });
        
        output.push(`**Tests run before hook failure:** ${passed.length} passed, ${failed.length} failed`);
        output.push('');
        output.push('💡 Fix the hook failures to run all tests');
        output.push('');
      }

      if (errorsOnly) {
        // Minimal output mode - only show failures
        if (failed.length === 0 && hookFailures.length === 0) {
          output.push(`✅ All ${totalTests} tests passed in ${testPath}`);
          if (grep) {
            output.push(`   Filtered by: ${grep}`);
          }
        } else if (failed.length > 0) {
          output.push(`❌ ${failed.length} test${failed.length > 1 ? 's' : ''} failed out of ${totalTests} total`);
          if (grep) {
            output.push(`   Filtered by: ${grep}`);
          }
          output.push('');

          failed.forEach((test, index) => {
            output.push(`**FAILED ${index + 1}:** ${test.title}`);
            output.push(`   ${test.error.name}: ${test.error.message}`);

            // Include first few lines of stack trace
            if (test.error.stack) {
              const stackLines = test.error.stack.split('\n').slice(1, 4);
              if (stackLines.length > 0) {
                output.push('   ```');
                stackLines.forEach(line => output.push(`   ${line.trim()}`));
                output.push('   ```');
              }
            }
            output.push('');
          });
        }
      } else {
        // Full output mode
        if (hookFailures.length === 0) {
          output.push(`# Test Results: ${testPath}`);
          if (grep) {
            output.push(`Filtered by: \`${grep}\``);
          }
          output.push('');
        }
        
        output.push(`✅ ${passed.length} test${passed.length !== 1 ? 's' : ''} passed`);
        output.push(`❌ ${failed.length} test${failed.length !== 1 ? 's' : ''} failed`);
        output.push(`⏱️  Total time: ${totalDuration}ms`);
        output.push('');

        if (failed.length > 0) {
          output.push('## Test Failures');
          output.push('');

          failed.forEach((test, index) => {
            output.push(`### ${index + 1}. ${test.title}`);
            output.push(`**Duration:** ${test.duration}ms`);
            output.push(`**Error:** ${test.error.name}: ${test.error.message}`);

            if (test.error.stack) {
              output.push('');
              output.push('**Stack trace:**');
              output.push('```');
              output.push(test.error.stack);
              output.push('```');
            }
            output.push('');
          });
        }

        if (passed.length > 0 && failed.length === 0 && hookFailures.length === 0) {
          output.push('## All Tests Passed');
          output.push('');
          passed.forEach((test, index) => {
            output.push(`${index + 1}. ✅ ${test.title} (${test.duration}ms)`);
          });
        }
      }

      return output.join('\n');
    },

    /**
     * Run all test files in the test directory
     * Returns minimal summary output to save tokens
     */
    async runAllTests(args, context) {
      const { grep } = args;

      context.logActivity('request', 'Running all tests...');

      try {
        // Find or create persistent test runner
        let testRunner = await this.findOrCreateTestRunner(context);

        // Import isTestFile function
        const { isTestFile } = await System.import('src/components/tools/lively-testrunner.js');

        // Discover all test files
        context.logActivity('info', 'Discovering test files...');
        const testFiles = await this.findAllTestFiles(context, isTestFile);

        context.logActivity('info', `Found ${testFiles.length} test files`);

        // Aggregate results
        const aggregatedResults = {
          totalFiles: testFiles.length,
          completedFiles: 0,
          totalPassed: 0,
          totalFailed: 0,
          totalHookFailures: 0,
          fileResults: [],
          startTime: Date.now()
        };

        // Run each test file sequentially
        for (const testPath of testFiles) {
          try {
            context.logActivity('info', `Running ${testPath}...`);

            // Run single test file
            const fileResults = await this.runSingleTestFile(testPath, grep, context);

            aggregatedResults.completedFiles++;
            aggregatedResults.totalPassed += fileResults.passed.length;
            aggregatedResults.totalFailed += fileResults.failed.length;
            aggregatedResults.totalHookFailures += (fileResults.hookFailures?.length || 0);
            aggregatedResults.fileResults.push({
              testPath,
              passCount: fileResults.passed.length,
              failCount: fileResults.failed.length,
              hookFailCount: fileResults.hookFailures?.length || 0,
              duration: fileResults.totalDuration,
              passed: fileResults.passed,
              failed: fileResults.failed,
              hookFailures: fileResults.hookFailures || []
            });

            const hookMsg = fileResults.hookFailures?.length > 0 
              ? `, ${fileResults.hookFailures.length} hook failures` 
              : '';
            context.logActivity('success',
              `${aggregatedResults.completedFiles}/${testFiles.length}: ${testPath} - ` +
              `${fileResults.passed.length} passed, ${fileResults.failed.length} failed${hookMsg}`
            );

          } catch (error) {
            context.logActivity('error', `Failed to run ${testPath}: ${error.message}`);

            aggregatedResults.completedFiles++;
            aggregatedResults.fileResults.push({
              testPath,
              passCount: 0,
              failCount: 0,
              duration: 0,
              error: error.message,
              passed: [],
              failed: []
            });
          }
        }

        aggregatedResults.endTime = Date.now();
        aggregatedResults.totalDuration = aggregatedResults.endTime - aggregatedResults.startTime;

        // Store results in test runner for later inspection
        if (testRunner && testRunner.storeTestResults) {
          testRunner.storeTestResults(aggregatedResults);
        }

        context.logActivity('success',
          `All tests completed: ${aggregatedResults.totalPassed} passed, ${aggregatedResults.totalFailed} failed`
        );

        // Return minimal summary
        return this.formatAggregatedResults(aggregatedResults);

      } catch (error) {
        context.logActivity('error', `Failed to run all tests: ${error.message}`);
        throw new Error(`Failed to run all tests: ${error.message}`);
      }
    },

    /**
     * Find all test files in standard test directories
     */
    async findAllTestFiles(context, isTestFile) {
      const testDirs = ['test'];
      let allFiles = [];

      for (const dir of testDirs) {
        try {
          const files = await lively.files.walkDir(lively4url + '/' + dir);
          const testFiles = files.filter(url => {
            const path = url.replace(lively4url + '/', '');
            return isTestFile(path);
          });

          allFiles = allFiles.concat(testFiles.map(url => url.replace(lively4url + '/', '')));
        } catch (error) {
          context.logActivity('warn', `Could not scan directory ${dir}: ${error.message}`);
        }
      }

      return allFiles.sort();
    },

    /**
     * Run a single test file and return results
     */
    async runSingleTestFile(testPath, grep, context) {
      // Ensure Mocha is loaded
      if (!window.mocha) {
        await lively.loadJavaScriptThroughDOM("mochaJS", lively4url + "/src/external/mocha.js", true);
        mocha.setup("bdd");
      }

      // Clear any previous tests
      if (window.mocha && window.mocha.suite) {
        mocha.suite.suites = [];
        mocha.suite.tests = [];
      }

      // Build full test file URL
      const testUrl = lively4url + '/' + testPath.replace(/^\//, '');

      // Reload and import the test module
      await lively.reloadModule(testUrl);
      await System.import(testUrl);

      // Set up grep filter if provided
      if (grep && window.mocha) {
        mocha.grep(grep);
      }

      // Collect test results
      const results = {
        passed: [],
        failed: [],
        hookFailures: [],
        startTime: Date.now()
      };

      // Set up custom reporter to capture results
      if (window.mocha) {
        mocha.reporter(function CustomReporter(runner) {
          runner.on('pass', (test) => {
            results.passed.push({
              title: test.fullTitle(),
              duration: test.duration
            });
          });

          runner.on('fail', (test, error) => {
            const failureData = {
              title: test.fullTitle(),
              duration: test.duration,
              error: {
                name: error.name || 'Error',
                message: error.message || String(error),
                stack: error.stack || null
              }
            };
            
            // Distinguish between test failures and hook failures
            if (test.type === 'hook') {
              results.hookFailures.push(failureData);
            } else {
              results.failed.push(failureData);
            }
          });
        });
      }

      // Run the tests and wait for completion
      await new Promise((resolve, reject) => {
        if (!window.mocha) {
          reject(new Error('Mocha not loaded'));
          return;
        }

        try {
          mocha.run((failureCount) => {
            resolve(failureCount);
          });
        } catch (error) {
          reject(error);
        }
      });

      results.endTime = Date.now();
      results.totalDuration = results.endTime - results.startTime;

      return results;
    },

    /**
     * Format aggregated test results with minimal output
     */
    formatAggregatedResults(results) {
      const { totalFiles, completedFiles, totalPassed, totalFailed, totalHookFailures = 0, totalDuration, fileResults } = results;

      let output = [];

      // Show hook failures prominently if any
      if (totalHookFailures > 0) {
        const filesWithHooks = fileResults.filter(f => f.hookFailCount > 0);
        output.push(`⚠️  **${totalHookFailures} hook failure${totalHookFailures > 1 ? 's' : ''} in ${filesWithHooks.length} file${filesWithHooks.length > 1 ? 's' : ''}**`);
        output.push('');
        
        filesWithHooks.forEach(file => {
          output.push(`  **${file.testPath}** (${file.hookFailCount} hook${file.hookFailCount > 1 ? 's' : ''} failed)`);
          if (file.hookFailures && file.hookFailures.length > 0) {
            file.hookFailures.forEach(hook => {
              output.push(`    • ${hook.title}: ${hook.error.message}`);
            });
          }
        });
        
        output.push('');
        output.push(`**Tests run before hook failures:** ${totalPassed} passed, ${totalFailed} failed`);
        output.push('');
      }

      if (totalFailed === 0 && totalHookFailures === 0) {
        // All green!
        output.push(`✅ **All green!** ${totalPassed} tests passed across ${completedFiles} files`);
        output.push(`   Total time: ${(totalDuration / 1000).toFixed(1)}s`);
      } else if (totalFailed > 0) {
        // Some test failures
        output.push(`❌ **${totalFailed} test${totalFailed > 1 ? 's' : ''} failed** (${totalPassed} passed) across ${completedFiles} files`);
        output.push(`   Total time: ${(totalDuration / 1000).toFixed(1)}s`);
        output.push('');

        // List files with failures (minimal: just file names and counts)
        const failedFiles = fileResults.filter(f => f.failCount > 0);
        output.push('**Failed files:**');
        failedFiles.forEach(file => {
          output.push(`  - ${file.testPath} (${file.failCount} failure${file.failCount > 1 ? 's' : ''})`);
        });

        output.push('');
        output.push('**Failed test titles:**');
        failedFiles.forEach(file => {
          if (file.failed && file.failed.length > 0) {
            output.push(`  ${file.testPath}:`);
            file.failed.forEach(test => {
              output.push(`    • ${test.title}`);
            });
          }
        });

        output.push('');
        output.push('💡 Use `inspect-test-results` tool to see error details and stack traces');
      }

      return output.join('\n');
    }
  },

  /**
   * Inspect stored test results from last test run
   * Allows querying specific details without re-running tests
   * Supports hierarchical navigation: summary → suite view → test detail
   */
  'inspect-test-results': {
    metadata: {
      description: "Inspect stored test results from the last test run. Supports hierarchical navigation: no params = summary, file = suite view, file+suite = test detail.",
      inputSchema: {
        type: "object",
        properties: {
          sessionId: {
            type: "string",
            description: "Target Lively4 session ID (optional - auto-selects if not provided)"
          },
          file: {
            type: "string",
            description: "Optional: inspect specific test file (e.g., 'test/client/strings-test.js')"
          },
          suite: {
            type: "string",
            description: "Optional: drill down to specific suite (e.g., 'ClaudeMessage'). Requires file parameter."
          },
          failedOnly: {
            type: "boolean",
            description: "If true, only show failed tests (default: false)",
            default: false
          },
          includeStacks: {
            type: "boolean",
            description: "If true, include full error stack traces (default: false)",
            default: false
          }
        },
        required: []
      }
    },

    async execute(args, context) {
      const { file, suite, failedOnly = false, includeStacks = false } = args;

      context.logActivity('request', 'Inspecting test results...');

      try {
        // Find the test runner with stored results
        const testRunner = await this.findTestRunnerWithResults(context);

        if (!testRunner) {
          return 'No test results available. Run tests first using run-tests tool.';
        }

        const results = testRunner.getLastTestResults();

        if (!results) {
          return 'No test results available. Run tests first using run-tests tool.';
        }

        context.logActivity('info', `Found results from ${results.timestamp}`);

        // Validate suite parameter requires file parameter
        if (suite && !file) {
          return 'Error: suite parameter requires file parameter to be specified.';
        }

        // Format and return inspection results
        return this.formatInspectionResults(results, file, suite, failedOnly, includeStacks);

      } catch (error) {
        context.logActivity('error', `Failed to inspect results: ${error.message}`);
        throw new Error(`Failed to inspect results: ${error.message}`);
      }
    },

    /**
     * Find test runner with stored results
     */
    async findTestRunnerWithResults(context) {
      const existingRunners = document.querySelectorAll('lively-testrunner');
      for (let runner of existingRunners) {
        if (runner.getAttribute('data-mcp-label') === 'test-runner' && runner.lastTestRun) {
          context.logActivity('info', 'Found test runner with stored results');
          return runner;
        }
      }
      return null;
    },

    /**
     * Parse test hierarchy from full title
     * @param {string} fullTitle - Full test title like "Suite A > Suite B > test name"
     * @returns {Object} - { suites: ['Suite A', 'Suite B'], testName: 'test name', fullPath: 'Suite A > Suite B' }
     */
    parseTestHierarchy(fullTitle) {
      const parts = fullTitle.split(' > ').map(p => p.trim());
      const testName = parts[parts.length - 1];
      const suites = parts.slice(0, -1);
      const fullPath = suites.join(' > ');

      return { suites, testName, fullPath };
    },

    /**
     * Build suite tree from flat test list
     * @param {Array} tests - Array of test objects with title property
     * @returns {Object} - Tree structure with suite hierarchy
     */
    buildSuiteTree(tests) {
      const tree = {};

      tests.forEach(test => {
        const { suites, testName } = this.parseTestHierarchy(test.title);

        // Navigate/create tree structure
        let current = tree;
        suites.forEach((suiteName, index) => {
          if (!current[suiteName]) {
            current[suiteName] = {
              name: suiteName,
              path: suites.slice(0, index + 1).join(' > '),
              tests: [],
              suites: {},
              passCount: 0,
              failCount: 0
            };
          }
          current = current[suiteName].suites;
        });

        // Add test to the deepest suite
        const parentSuite = suites.length > 0 ? suites[suites.length - 1] : null;
        if (parentSuite) {
          let parent = tree;
          suites.slice(0, -1).forEach(s => parent = parent[s].suites);
          const suite = parent[parentSuite];
          suite.tests.push({
            ...test,
            testName
          });

          // Update counts
          if (test.error) {
            suite.failCount++;
          } else {
            suite.passCount++;
          }
        }
      });

      return tree;
    },

    /**
     * Format inspection results based on query parameters
     * Supports 3 levels: summary (no file), suite view (file), detail view (file+suite)
     */
    formatInspectionResults(results, file, suite, failedOnly, includeStacks) {
      const { timestamp, totalPassed, totalFailed, completedFiles, fileResults } = results;

      // Level 1: Summary view (no file specified)
      if (!file) {
        return this.formatSummaryView(results, failedOnly);
      }

      // Find the specific file
      const fileResult = fileResults.find(f => f.testPath === file);
      if (!fileResult) {
        return `No results found for file: ${file}`;
      }

      // Level 2: Suite tree view (file specified, no suite)
      if (!suite) {
        return this.formatSuiteTreeView(fileResult, failedOnly);
      }

      // Level 3: Detail view (file + suite specified)
      return this.formatDetailView(fileResult, suite, failedOnly, includeStacks);
    },

    /**
     * Format Level 1: Summary view showing file-level counts
     */
    formatSummaryView(results, failedOnly) {
      const { timestamp, totalPassed, totalFailed, completedFiles, fileResults } = results;

      let output = [];
      output.push(`# Test Results Summary`);
      output.push(`**Last run:** ${timestamp}`);
      output.push(`**Total:** ${totalPassed} passed, ${totalFailed} failed across ${completedFiles} files`);
      output.push('');

      // Filter files if failedOnly
      let filesToShow = failedOnly ? fileResults.filter(f => f.failCount > 0) : fileResults;

      if (filesToShow.length === 0) {
        return output.join('\n') + '\n✅ All tests passed!';
      }

      if (failedOnly) {
        output.push(`## Files with Failures (${filesToShow.length})`);
      } else {
        output.push(`## All Files (${filesToShow.length})`);
      }
      output.push('');

      filesToShow.forEach(file => {
        const icon = file.failCount > 0 ? '❌' : '✅';
        const failInfo = file.failCount > 0 ? `, ${file.failCount} failed` : '';
        output.push(`${icon} **${file.testPath}** - ${file.passCount} passed${failInfo}`);
      });

      output.push('');
      output.push('💡 Use `inspect-test-results(file: "path")` to see suite details');

      return output.join('\n');
    },

    /**
     * Format Level 2: Suite tree view showing suite hierarchy
     */
    formatSuiteTreeView(fileResult, failedOnly) {
      const { testPath, passCount, failCount, duration, passed, failed } = fileResult;

      let output = [];
      output.push(`## ${testPath}`);
      output.push(`**Summary:** ${passCount} passed, ${failCount} failed, ${duration}ms`);
      output.push('');

      // Combine all tests to build suite tree
      const allTests = [...(passed || []), ...(failed || [])];
      if (allTests.length === 0) {
        return output.join('\n') + '\nNo tests found.';
      }

      const suiteTree = this.buildSuiteTree(allTests);

      output.push('**Suites:**');
      this.renderSuiteTree(output, suiteTree, 0, failedOnly);

      output.push('');
      output.push('💡 Use `inspect-test-results(file: "' + testPath + '", suite: "SuiteName")` to see test details');

      return output.join('\n');
    },

    /**
     * Render suite tree recursively with indentation
     */
    renderSuiteTree(output, tree, indent, failedOnly) {
      const indentStr = '  '.repeat(indent);

      Object.keys(tree).forEach(suiteName => {
        const suite = tree[suiteName];
        const totalTests = suite.passCount + suite.failCount;

        // Skip suites with no failures if failedOnly
        if (failedOnly && suite.failCount === 0) {
          return;
        }

        const icon = suite.failCount > 0 ? '❌' : '✅';
        const failInfo = suite.failCount > 0 ? `, ${suite.failCount} failed` : '';

        output.push(`${indentStr}${icon} **${suiteName}** (${totalTests} test${totalTests !== 1 ? 's' : ''}${failInfo})`);

        // Recursively render child suites
        if (Object.keys(suite.suites).length > 0) {
          this.renderSuiteTree(output, suite.suites, indent + 1, failedOnly);
        }
      });
    },

    /**
     * Format Level 3: Detail view showing individual tests in a suite
     */
    formatDetailView(fileResult, suiteName, failedOnly, includeStacks) {
      const { testPath, passed, failed } = fileResult;

      // Combine all tests
      const allTests = [...(passed || []), ...(failed || [])];

      // Filter tests that belong to the specified suite
      const suiteTests = allTests.filter(test => {
        const { suites } = this.parseTestHierarchy(test.title);
        // Match if suiteName appears anywhere in the suite path
        return suites.some(s => s.includes(suiteName) || suiteName.includes(s));
      });

      if (suiteTests.length === 0) {
        return `No tests found in suite: ${suiteName}`;
      }

      // Calculate counts
      const passedTests = suiteTests.filter(t => !t.error);
      const failedTests = suiteTests.filter(t => t.error);

      let output = [];
      output.push(`## ${testPath}`);
      output.push(`### Suite: ${suiteName}`);
      output.push(`**Summary:** ${passedTests.length} passed, ${failedTests.length} failed`);
      output.push('');

      // Show failed tests first
      if (failedTests.length > 0) {
        output.push('**Failed Tests:**');
        failedTests.forEach(test => {
          const { testName } = this.parseTestHierarchy(test.title);
          output.push(`  ❌ **${testName}**`);
          output.push(`     ${test.error.name}: ${test.error.message}`);

          if (includeStacks && test.error.stack) {
            output.push('     ```');
            test.error.stack.split('\n').forEach(line => {
              output.push(`     ${line}`);
            });
            output.push('     ```');
          }
          output.push('');
        });
      }

      // Show passed tests if not failedOnly
      if (!failedOnly && passedTests.length > 0) {
        output.push('**Passed Tests:**');
        passedTests.forEach(test => {
          const { testName } = this.parseTestHierarchy(test.title);
          output.push(`  ✅ ${testName} (${test.duration}ms)`);
        });
      }

      return output.join('\n');
    }
  }

};

/**
 * Extract tool definitions with metadata for MCP server discovery
 * @returns {Array} Array of tool definitions with name, description, and inputSchema
 */
export function getToolDefinitions() {
  return Object.keys(Tools).map(name => ({
    name,
    description: Tools[name].metadata.description,
    inputSchema: Tools[name].metadata.inputSchema
  }));
}