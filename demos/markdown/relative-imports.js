
import bar from './relative-imports2.js'

var a = Math.random()

export default function foo() {
  return `[foo] ${a} found file ` + lively.stack().getFrame(0).file + `
` + bar()
}
