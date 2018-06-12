import boundEval from "src/client/bound-eval.js";
import _ from 'src/external/lodash/lodash.js'

export function toggleLayer(name) {
  var checkbox=<input  type="checkbox"></input>
  var layer = window[name]
  if (layer && layer.beGlobal) {
    checkbox.checked = layer.isGlobal()       
  }
  
  function update() {
    var layer = window[name]
    if (layer && layer.beGlobal) {
      if (checkbox.checked == true) {
        layer.beGlobal()
      } else {
        layer.beNotGlobal()
      }
    } else {
      // checkbox.style.backgroundColor = "red"
    }
  }

  checkbox.addEventListener("click", update);
  return <span>{checkbox} {name}</span>
}

export function showVariable(name, self) {
  var div=<div class="variable" 
    style="display: inline-block; max-height: 100px; overflow: auto; background-color: gray; color: white; padding: 4px; font-style: italic; white-space: pre-wrap"></div>
  
  
  // #TODO garbage collect them...
  // window.setInterval(async () => {
  //   var result  = await boundEval(name);    
  //   if (!result.isError) {
  //     div.textContent = name + " = " + result.value
  //   }
  // }, 500);
  // #TODO garbage collect them...
  var lastValue
  async function updateVariable () {
    var result  = await boundEval(name, self);    
    if (!result.isError && (lastValue !== result.value)) {
      if (result.value.forEach) {
        div.textContent = name + "\n"
        result.value.forEach((value, key) => {
          div.textContent += key.replace(/\n/g,"").slice(0,70) + ":" + value +"\n"
        })
      } else {
        div.textContent = name + " = " + result.value
      }
      
    }
    
    lastValue = result.value
    if (!lively.findWorldContext(div)) { // we are still open
      clearInterval(intervalId);
    }
    // #TODO start me again... if I should become open again?
  }
  
  var intervalId = setInterval(updateVariable, 1000);
  
  return div
}


export function runExampleButton(exampleName, ctx, dependencies=[]) {
  var button=<button>{exampleName}</button>
  var appendResult = function(code, element) {
    element.classList.add("result")
    code.parentElement.insertBefore(element, code.nextSibling)
  }
  
  button.onclick = (async () => {
    // gather all dependent code blocks
    var codeBlocks = []
    dependencies.forEach(ea => {
      codeBlocks.push(..._.sortBy(ctx.parentElement.querySelectorAll("." + ea), 
                      ea => lively.getGlobalPosition(ea).y))
    })
    codeBlocks.push(..._.sortBy(ctx.parentElement.querySelectorAll("." + exampleName), 
                      ea => lively.getGlobalPosition(ea).y))
    
  
    // codeBlocks = _.sortBy(codeBlocks, ea => lively.getGlobalPosition(ea).y)
    // go through all code blocks and (re-)execute them and show result (and errors)
    
    ctx.parentElement.querySelectorAll(".indexElement").forEach(ea => {
      ea.remove()
    });
      
    
    var i=1
    for(var code of codeBlocks) {
      var indexElement = <div class="indexElement" style="color: blue">{i++}</div>
      code.parentElement.insertBefore(indexElement, code)

      // show only the latest result
      var resultElement = code.parentElement.querySelector(".result")
      if (resultElement) resultElement.remove()
      var result  = await boundEval(code.textContent, ctx);    
      if (result.isError) {
        code.parentElement.style.border = "1px solid red";
        lively.showError(result.value)
        var error = <div class="result error" style="color: red">Error: {result.value}</div>
        code.parentElement.insertBefore(error, code.nextSibling)
        return
      } else {
        code.parentElement.style.border = "1px dashed darkgreen";
        if (code.classList.contains("NoResult")) continue;
        var element;
        var value = result.value
        if (value && value.then) {
          try {
            value = await value;
          } catch(e) {
            let error = <div class="error" style="color: red">Error in Promise: {e}</div>
            appendResult(code, error)
          return    
          }
        }
        if (value instanceof HTMLElement) {
          element = <div style="color: blue; font-style='italic'"></div>
          element.appendChild(value)
          element.style.position = "relative"
          lively.sleep(100).then(()=> {
            lively.setExtent(element, lively.getExtent(value)) // #LayoutHack
            element.style.margin = "20px"
          })
          appendResult(code, element)
        } else if (value && value.beGlobal) {
          element = toggleLayer(value.name)
          appendResult(code, element)

        } else if (value !== undefined && value instanceof Object) {
          var inspector = await (<lively-inspector style="position:absolute; top:0px; left:0px; width: 100%; height: 100%"></lively-inspector>)
          inspector.inspect(value)
          inspector.hideWorkspace()
          var element  = <div style="display: inline-block; position:relative; top:0px; left:0px; height: 100px; width: 500px;background: white; white-space: wrap">{inspector}</div>
          
          appendResult(code, element)
        } else if (value !== undefined) { 
          element = <div style="color: blue; font-style='italic'"> => {value}</div>
          appendResult(code, element)
        }
      }
    }
    return  ""
  });
  return button
}

export async function inspectVariable(name) {
  var inspector = await (<lively-inspector></lively-inspector>)
  var result  = await boundEval(name);    
  inspector.inspect(result.value)
  inspector.hideWorkspace()
  // window.setInterval(async () => {
  //   var result  = await boundEval(name);    
  //   inspector.inspect(result.value)
  // }, 1000);
  return inspector
}

export async function hideHiddenElements(ctx) {
  ctx.parentElement.querySelectorAll(".Hidden").forEach( ea => {
    if (ea.tagName == "CODE") {
     ea.parentElement.style.display = "none"
    }
  })
}


