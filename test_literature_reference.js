// Test script for LiteratureReference refactoring

import { LiteratureReference } from "./src/client/literature.js"

// Test basic functionality
console.log("Testing LiteratureReference...")

// Test creation from alexid
const ref1 = LiteratureReference.fromAlexId("W2166901142")
console.log("ref1:", ref1.id, ref1.type, ref1.alexid)

// Test creation from DOI
const ref2 = LiteratureReference.fromDOI("10.1234/example")
console.log("ref2:", ref2.id, ref2.type, ref2.alexid)

// Test equality
const ref3 = LiteratureReference.fromAlexId("W2166901142")
console.log("ref1 equals ref3:", ref1.equals(ref3))
console.log("ref1 equals ref2:", ref1.equals(ref2))

// Test toString
console.log("ref1 toString:", ref1.toString())

// Test object creation
const ref4 = new LiteratureReference({ id: "W123456", type: "alexid" })
console.log("ref4:", ref4.id, ref4.type, ref4.alexid)

console.log("LiteratureReference tests completed!")
