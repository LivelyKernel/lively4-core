
import bar from './relative-imports2.js'

export default function foo() {
  return '[foo] found file ' + lively.stack().getFrame(0).file + `
` + bar()
}
