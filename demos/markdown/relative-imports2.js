
export default function bar() {
  return '[bar] found import at ' + lively.stack().getFrame(0).file
}
