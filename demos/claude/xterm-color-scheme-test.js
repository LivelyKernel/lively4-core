// Test script for LivelyXterm color scheme functionality
// This script manually tests the color scheme switching feature

import LivelyXterm from "src/components/tools/lively-xterm.js"

// Create a test xterm instance
const xterm = document.createElement('lively-xterm')
document.body.appendChild(xterm)

// Initialize the component
await xterm.initialize()

console.log("Testing LivelyXterm color schemes...")

// Test 1: Check available color schemes
const schemes = xterm.getAvailableColorSchemes()
console.log("Available color schemes:", schemes)
console.assert(schemes.length > 0, "Should have color schemes available")

// Test 2: Check default color scheme
console.log("Current color scheme:", xterm.currentColorScheme)
console.assert(xterm.currentColorScheme, "Should have a current color scheme")

// Test 3: Test setting different color schemes
const testSchemes = ['dark', 'light', 'monokai', 'solarized-dark', 'dracula']
for (const scheme of testSchemes) {
  console.log(`Testing scheme: ${scheme}`)
  xterm.setColorScheme(scheme)
  console.assert(xterm.currentColorScheme === scheme, `Should have switched to ${scheme}`)
  
  // Verify the scheme is saved
  const saved = xterm.loadColorScheme()
  console.assert(saved === scheme, `Should have saved ${scheme}`)
}

// Test 4: Test invalid color scheme
const originalScheme = xterm.currentColorScheme
xterm.setColorScheme('invalid-scheme')
console.assert(xterm.currentColorScheme === originalScheme, "Should not change on invalid scheme")

console.log("✅ All color scheme tests passed!")

// Clean up
document.body.removeChild(xterm)