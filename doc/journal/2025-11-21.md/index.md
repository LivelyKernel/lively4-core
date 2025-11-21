## 2025-11-21
*Author: @JensLincke*

### Tracing with ContextJS



```javascript
import Tracer from "src/client/tracer.js"
import LivelyOpenCode from "src/components/tools/lively-opencode.js"
import AiWorkspace  from "src/components/tools/lively-ai-workspace.js"


import Strings from 'src/client/strings.js'  

let logWorkspace = that

logWorkspace.value = ""
let logTarget = {
    level: 0,
    log(obj, className, methodName, args, id) {
      // console.log(className + "." + methodName)
      // debugger
      
      
      
      let printArgs = Array.from(args).map(ea => "" + ea).join(", ")
      logWorkspace.value += Strings.indent(className + "." + methodName +  "(" + printArgs +  ")\n", this.level)
      // logWorkspace.value += args.map(ea => "" + ea).join(", ") + "\n"
      logWorkspace.scrollToLine(logWorkspace.editor.lineCount())
      this.level ++  
    },
  
    logResult(obj, className, methodName, args, id, result) {
      this.level --
      
      // let printArgs = Array.from(args).map(ea => "" + ea).join(", ")
      // logWorkspace.value += Strings.indent(className + "." + methodName +  "(" + printArgs +  ")\n", level)
      // logWorkspace.value += args.map(ea => "" + ea).join(", ") + "\n"
        
      logWorkspace.scrollToLine(logWorkspace.editor.lineCount())
    }
}

Tracer.logTarget = logTarget


Tracer.trace(LivelyOpenCode)
Tracer.trace(AiWorkspace)

Tracer.enable()
updateOpenCodeStatus

```