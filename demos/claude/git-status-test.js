// Git Status Test File
// This file tests the new git line status visualization feature

console.log("Testing git status indicators...")

// Add some code here to test unsaved changes
function testFunction() {
  return "This line should show red indicator when modified"
}

x
x
s
s
s
s
x
s

s

// More test content
const testVariable = "modify this to see changes"

// Test array
const testArray = [1, 2, 3, 4, 5]

// Test object  
const testObject = {
  name: "test",
  value: 42,
  active: true
}
console.log("Git status test file loaded")

// Test remote version fetching
async function testRemoteVersion() {
  const filePath = "/lively4-core/demos/claude/git-status-test.js"
  try {
    const response = await fetch(filePath, {
      headers: { fileversion: "origin/gh-pages" }
    })
    console.log("Remote version test:", response.status, response.ok)
    if (response.ok) {
      const text = await response.text()
      console.log("Remote version text length:", text.length)
      console.log("Remote version first 100 chars:", text.substring(0, 100))
    }
  } catch (error) {
    console.log("Remote version test error:", error)
  }
}

testRemoteVersion()
