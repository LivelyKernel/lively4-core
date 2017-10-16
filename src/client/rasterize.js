import rasterizeHTML from "src/external/rasterizeHTML.js"

// the rasterization code expects only plain HTML and cannot deal with shadow dom, so we flatten it away
export class CloneDeepHTML {

  static shallowClone(obj) {
    if (!obj) return;
    console.log("shallow...")
    var node
    if (obj.constructor.name == "Text") {
      node = document.createTextNode(obj.textContent)
    } else if (obj.tagName == "CONTENT"){
      node = document.createElement("div")
      node.id = "CONTENTNODE"
    } else if ( obj.shadowRoot){
      node = document.createElement("div")
    } else {
      node = document.createElement(obj.tagName);
    }    
    if (obj.attributes) {
      Array.from(obj.attributes).forEach(ea => {
        node[ea.name] = "" + ea.value
      })
      node.style = getComputedStyle(obj).cssText
      
      var beforeElementStyle = getComputedStyle(obj, ':before')
      var beforeContent = beforeElementStyle.content
      if (beforeContent && beforeContent.length > 0) {
        var text = document.createElement("span")
        text.textContent = JSON.parse(beforeContent)
        text.style  = beforeContent.cssText
        node.appendChild(text)
      }
      
    }
    return node
  }

  static deepCopyAsHTML(obj) {
    var to = this.shallowClone(obj)
    this.deepCopyAsHTMLFromTo(obj, to)
    return to
  }

  static deepCopyAsHTMLFromTo(from, to) {
    if (from.shadowRoot) {
      this.deepCopyAsHTMLFromTo(from.shadowRoot, to)
      var contentNode  = to.querySelector("#CONTENTNODE")
      if (contentNode) to = contentNode;
    }
    
    from.childNodes.forEach( fromChild => {
      var toChild = this.shallowClone(fromChild);
      to.appendChild(toChild);
      this.deepCopyAsHTMLFromTo(fromChild, toChild);
    })
  }
}

// var clone = CloneDeepHTML.deepCopyAsHTML(that)
// $morph("result").innerHTML = ""
// $morph("result").appendChild(clone)
// $morph("showResult").inspect(clone)


export default class Rasterize {
   static async elementToCanvas(element, width=512, height=512) {
    var cloned = CloneDeepHTML.deepCopyAsHTML(element)
     
    var canvas = document.createElement("canvas")
    canvas.height = height
    canvas.width = width
    await rasterizeHTML.drawHTML(cloned.outerHTML, canvas)
    return canvas
  } 

  static async elementToDataURL(element) {
    var canvas = await this.elementToCanvas(element)
    return canvas.toDataURL("image/png")
  } 

  
  static async elementToURL(element, url) {
    var dataURL = await this.elementToDataURL(element)
    return lively.files.copyURLtoURL(dataURL, url)
  } 
  
  static async openAsImage(element) {
    var dataURL = await this.elementToDataURL(element)
    var img = document.createElement("img")
    img.src = dataURL
    document.body.appendChild(img)
    return img
  } 
}

// Rasterize.openAsImage(that)