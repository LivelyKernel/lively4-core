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
  button.onclick = (async () => {
    var codeBlocks = []
    dependencies.forEach(ea => {
      codeBlocks.push(...ctx.parentElement.querySelectorAll("." + ea))
    })
    codeBlocks.push(...ctx.parentElement.querySelectorAll("." + exampleName))
    codeBlocks = _.sortBy(codeBlocks, ea => lively.getGlobalPosition(ea).y)
    for(var code of codeBlocks) {
      var result  = await boundEval(code.textContent, ctx);    
      if (result.isError) {
        code.parentElement.style.border = "1px solid red";
        lively.showError(result.value)
        var error = <div style="color: red">Error: {result.value}</div>
        code.parentElement.insertBefore(error, code.nextSibling)
        return    
      } else {
        code.parentElement.style.border = "1px dashed darkgreen";
        if (code.classList.contains("NoResult")) continue;
        var element;
        var value = result.value
        if (value && value.then) value = await value;
        result = code.parentElement.querySelector(".result")
        if (result) result.remove()

        if (value instanceof HTMLElement) {
          element = <div class="result" style="color: blue; font-style='italic'"></div>
          element.appendChild(value)
          element.style.position = "relative"
          lively.sleep(100).then(()=> {
            lively.setExtent(element, lively.getExtent(value)) // #LayoutHack
            element.style.margin = "20px"
          })
          code.parentElement.insertBefore(element, code.nextSibling)
        } else if (value && value.beGlobal) {
          element = toggleLayer(value.name)
          element.classList.add("result")
          code.parentElement.insertBefore(element, code.nextSibling)
        } else if (value !== undefined) { 
          element = <div class="result" style="color: blue; font-style='italic'"> => {value}</div>
          code.parentElement.insertBefore(element, code.nextSibling)

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


