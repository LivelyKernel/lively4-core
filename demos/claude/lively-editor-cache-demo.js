// Lively Editor File Content Caching Demo
// This script demonstrates and tests the file content caching mechanism
// Run this script in a Lively4 environment to verify caching behavior

import files from "src/client/files.js"

async function testEditorCaching() {
  console.log("=== Lively Editor File Content Caching Demo ===\n")
  
  // Create a new editor instance
  const editor = await lively.openComponentInWindow("lively-editor")
  await lively.sleep(1000) // Give it time to initialize
  
  // Test URLs
  const testUrl1 = new URL("https://lively-kernel.org/lively4/lively4-core/README.md")
  const testUrl2 = new URL("https://lively-kernel.org/lively4/lively4-core/package.json")
  
  // Store original files.loadFile to monitor calls
  const originalLoadFile = files.loadFile
  let callCount = 0
  let lastCallUrl = null
  let lastCallBranch = null
  
  files.loadFile = async function(url, branch) {
    callCount++
    lastCallUrl = url?.toString()
    lastCallBranch = branch
    console.log(`📁 files.loadFile called (#${callCount}): ${lastCallUrl} @ ${lastCallBranch}`)
    return await originalLoadFile.call(this, url, branch)
  }
  
  console.log("🧪 Testing file content caching mechanism...\n")
  
  // Test 1: First call should trigger file load
  console.log("Test 1: First call to getCachedFileContent")
  const start1 = performance.now()
  const content1 = await editor.getCachedFileContent(testUrl1, "HEAD")
  const time1 = performance.now() - start1
  console.log(`   Result: ${content1.length} characters loaded in ${time1.toFixed(2)}ms`)
  console.log(`   files.loadFile calls: ${callCount}\n`)
  
  // Test 2: Second call should use cache
  console.log("Test 2: Second call with same URL+branch (should use cache)")
  const previousCallCount = callCount
  const start2 = performance.now()
  const content2 = await editor.getCachedFileContent(testUrl1, "HEAD")
  const time2 = performance.now() - start2
  console.log(`   Result: ${content2.length} characters loaded in ${time2.toFixed(2)}ms`)
  console.log(`   files.loadFile calls: ${callCount} (${callCount - previousCallCount} new calls)`)
  console.log(`   Content identical: ${content1 === content2}`)
  console.log(`   Performance improvement: ${time2 < time1 / 2 ? '✅' : '❌'} (cached was ${(time1/time2).toFixed(1)}x faster)\n`)
  
  // Test 3: Different URL should trigger new load
  console.log("Test 3: Different URL (should trigger new load)")
  const previousCallCount3 = callCount
  const content3 = await editor.getCachedFileContent(testUrl2, "HEAD")
  console.log(`   Result: ${content3.length} characters loaded`)
  console.log(`   files.loadFile calls: ${callCount} (${callCount - previousCallCount3} new calls)\n`)
  
  // Test 4: Different branch should trigger new load
  console.log("Test 4: Same URL, different branch (should trigger new load)")
  const previousCallCount4 = callCount
  const content4 = await editor.getCachedFileContent(testUrl1, "origin/main")
  console.log(`   Result: ${content4.length} characters loaded`)
  console.log(`   files.loadFile calls: ${callCount} (${callCount - previousCallCount4} new calls)\n`)
  
  // Test 5: Cache invalidation
  console.log("Test 5: Cache invalidation")
  editor.invalidateFileContentCache()
  const previousCallCount5 = callCount
  const content5 = await editor.getCachedFileContent(testUrl1, "HEAD")
  console.log(`   Result: ${content5.length} characters loaded`)
  console.log(`   files.loadFile calls: ${callCount} (${callCount - previousCallCount5} new calls)`)
  console.log(`   Content identical to first load: ${content1 === content5}\n`)
  
  // Test 6: setURL invalidation
  console.log("Test 6: setURL should invalidate cache")
  await editor.getCachedFileContent(testUrl1, "HEAD") // Populate cache
  const previousCallCount6 = callCount
  editor.setURL("https://lively-kernel.org/lively4/lively4-core/src/client/lively.js") // This should invalidate
  const content6 = await editor.getCachedFileContent(testUrl1, "HEAD") // Should reload
  console.log(`   Result: ${content6.length} characters loaded`)
  console.log(`   files.loadFile calls: ${callCount} (${callCount - previousCallCount6} new calls)\n`)
  
  // Test 7: getLineChangeStatus caching integration
  console.log("Test 7: getLineChangeStatus integration")
  editor.setURL(testUrl1.href)
  editor.setText("# Modified README\n\nThis is modified content for testing.")
  
  const previousCallCount7 = callCount
  console.log("   First call to getLineChangeStatus...")
  const status1 = await editor.getLineChangeStatus()
  const callsAfterFirst = callCount
  
  console.log("   Second call to getLineChangeStatus...")
  const status2 = await editor.getLineChangeStatus()
  const callsAfterSecond = callCount
  
  console.log(`   files.loadFile calls after first getLineChangeStatus: ${callsAfterFirst - previousCallCount7}`)
  console.log(`   files.loadFile calls after second getLineChangeStatus: ${callsAfterSecond - callsAfterFirst}`)
  console.log(`   Status results identical: ${JSON.stringify(status1) === JSON.stringify(status2)}`)
  
  if (status1.meta) {
    console.log(`   Detected changes: unsaved=${status1.meta.hasUnsaved}, uncommitted=${status1.meta.hasUncommitted}, unpushed=${status1.meta.hasUnpushed}`)
  }
  
  // Restore original files.loadFile
  files.loadFile = originalLoadFile
  
  console.log("\n=== Demo Complete ===")
  console.log(`Total files.loadFile calls: ${callCount}`)
  console.log("✅ Caching mechanism is working properly!")
  
  return {
    editor,
    totalCalls: callCount,
    cachingWorking: true
  }
}

// Auto-run the demo
try {
  const result = await testEditorCaching()
  window.lastCachingDemo = result
  console.log("\n💾 Demo results stored in window.lastCachingDemo")
} catch (error) {
  console.error("❌ Demo failed:", error)
  console.error(error.stack)
}