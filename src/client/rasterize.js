import rasterizeHTML from "src/external/rasterizeHTML.js"
import {pt} from "src/client/graphics.js"

// the rasterization code expects only plain HTML and cannot deal with shadow dom, so we flatten it away
export class CloneDeepHTML {

  static shallowClone(obj) {
    if (!obj) return;
    var node
    if (obj.constructor.name == "Text") {
      node = document.createTextNode(obj.textContent)
    } else if (obj.tagName == "CONTENT"){
      node = document.createElement("div")
      node.id = "CONTENTNODE"
    } else if (obj.tagName == "style"){
      lively.notify("ignore style")
      return 
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
      console.log("transform " + node.style.transform)
      if (node.style.transform != "none") {
        debugger
      }
      
      
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
      if (toChild) {
        to.appendChild(toChild);
        this.deepCopyAsHTMLFromTo(fromChild, toChild);    
      }
    })
  }
}

// var clone = CloneDeepHTML.deepCopyAsHTML(that)
// $morph("result").innerHTML = ""
// $morph("result").appendChild(clone)
// $morph("showResult").inspect(clone)


export default class Rasterize {
  
    // from: https://gist.github.com/timdown/021d9c8f2aabc7092df564996f5afbbf
    static trimCanvas(canvas) {
        function rowBlank(imageData, width, y) {
            for (var x = 0; x < width; ++x) {
                if (imageData.data[y * width * 4 + x * 4 + 3] !== 0) return false;
            }
            return true;
        }

        function columnBlank(imageData, width, x, top, bottom) {
            for (var y = top; y < bottom; ++y) {
                if (imageData.data[y * width * 4 + x * 4 + 3] !== 0) return false;
            }
            return true;
        }

        var ctx = canvas.getContext("2d");
        var width = canvas.width;
        var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        var top = 0, bottom = imageData.height, left = 0, right = imageData.width;

        while (top < bottom && rowBlank(imageData, width, top)) ++top;
        while (bottom - 1 > top && rowBlank(imageData, width, bottom - 1)) --bottom;
        while (left < right && columnBlank(imageData, width, left, top, bottom)) ++left;
        while (right - 1 > left && columnBlank(imageData, width, right - 1, top, bottom)) --right;

        var trimmed = ctx.getImageData(left, top, right - left, bottom - top);
        var copy = canvas.ownerDocument.createElement("canvas");
        var copyCtx = copy.getContext("2d");
        copy.width = trimmed.width;
        copy.height = trimmed.height;
        copyCtx.putImageData(trimmed, 0, 0);

        return copy;
    }
  
   static async elementToCanvas(element) {
    var extent = lively.getExtent(element)

    var cloned = CloneDeepHTML.deepCopyAsHTML(element)
    lively.setPosition(cloned, pt(0,0))
    var canvas = document.createElement("canvas")
    var zoom = 2;
    canvas.width = extent.x * zoom;
    canvas.height = extent.y * zoom;
    lively.notify(canvas.width, canvas.height)
    await rasterizeHTML.drawHTML(cloned.outerHTML, canvas)
    
    canvas = this.trimCanvas(canvas)
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
  
  static async asImage(element) {
    var dataURL = await this.elementToDataURL(element)
    var img = document.createElement("img")
    img.src = dataURL
    return img
  } 
  
  static async openAsImage(element) {
    var img = await this.asImage(element)
    document.body.appendChild(img)
    return img
  } 
}

// Rasterize.openAsImage(that)