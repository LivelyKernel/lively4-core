import rasterizeHTML from "src/external/rasterizeHTML.js"
import {pt} from "src/client/graphics.js"

/* ## Workspace Snipped for interactive Testing

```
  import {CloneDeepHTML} from "src/client/rasterize.js"

  $morph("Cloned").innerHTML = ""
  var cloned = CloneDeepHTML.deepCopyAsHTML($morph("Original"))
  $morph("Cloned").appendChild(cloned)
```
*/

// the rasterization code expects only plain HTML and cannot deal with shadow dom, so we flatten it away
export class CloneDeepHTML {

  // computes the styles of a and b and prints the difference CSS
  static diffCSS(a,b) {
    var astyle = getComputedStyle(a)
    var bstyle = getComputedStyle(b)
    var css = ""
    for(var i=0; i < astyle.length; i++) {
      var name = astyle.item(i)
      if (!name.match("-webkit")) {
        if (astyle.getPropertyValue(name) != bstyle.getPropertyValue(name)) {
          css += name +": " + astyle.getPropertyValue(name) +";\n"
        }        
      }
    }
    return css
  }
  
  
  static shallowClone(obj, parent, root) {
    if (!obj) return;
    var node
    if (obj.constructor.name == "Text") {
      if (obj.parentElement && obj.parentElement.tagName == "STYLE") {
        // #Hack hot fix font-awesome styles...
        node = document.createTextNode(obj.textContent.replace(/url\('\.\.\/fonts\/fontawesome-webfont/g, 
          `url('${lively4url}/src/external/font-awesome/fonts/fontawesome-webfont`)) 
      } else {
        node = document.createTextNode(obj.textContent) 
      }
    } else if (obj.tagName == "CONTENT"){
      node = document.createElement("div")
      node.id = "CONTENTNODE"
      if (root) {
        root._shadowRootContentNode = node
      }      
      return node
    } else if (obj.tagName == "STYLE"){
      node = document.createElement("style")
      
      return node
    } else if (obj instanceof SVGElement) {
      // console.log("svg element " + obj)
      node = document.createElementNS("http://www.w3.org/2000/svg", obj.tagName); 
      Array.from(obj.attributes).forEach(ea => {
        try {
          // console.log("attr " + ea.name + " " + ea.value)
          node.setAttribute(ea.name, ea.value)        
        } catch(e) {
          console.log('rasterize: could not write attribute ' + ea.name + " from " + obj)
        }
      })
      return node
    } else if ( obj.shadowRoot){
      node = document.createElement("div")
    } else {
      if (!obj.tagName) {
        // comments...
      } else{
        node = document.createElement(obj.tagName);
      }
    }
    if (obj.tagName == "H1") {
      lively.showElement(obj)
    }
    
    if (obj.attributes) {
      Array.from(obj.attributes).forEach(ea => {
        if (ea.name == "style") return;
        try {
          node[ea.name] = "" + ea.value        
        } catch(e) {
          console.log('rasterize: could not write attribute ' + ea.name + " from " + obj)
        }
      })
      if (obj.style) {
        node.style = this.diffCSS(obj, node)      
      }
      
      var beforeElementStyle = getComputedStyle(obj, ':before')
      var beforeContent = beforeElementStyle.content
      if (beforeContent && beforeContent.length > 0 && beforeContent !== 'none') {
        var text = document.createElement("span")
        
        try {
          text.textContent = "" + JSON.parse(beforeContent)
        } catch(e) {
          lively.warn('could not parse ' + beforeContent, e);
        }
        text.style  = beforeContent.cssText
        node.appendChild(text)
      }
    }
    if (obj.tagName == "INPUT") {
      // weired... why are they not connected?
      node.value = obj.value
      node.setAttribute("value", obj.value)
    }
    
    return node
  }

  static deepCopyAsHTML(obj) {
    var to = this.shallowClone(obj)
    this.deepCopyAsHTMLFromTo(obj, to, undefined)
    return to
  }

  static deepCopyAsHTMLFromTo(from, to, root) {
    var target = to;
    
    if (from.shadowRoot) {
      this.deepCopyAsHTMLFromTo(from.shadowRoot, to, from)
      
      var contentNode  = from._shadowRootContentNode
      if (contentNode) {
        target = contentNode;
      }
    }
    
    from.childNodes.forEach( fromChild => {
      var toChild = this.shallowClone(fromChild, target, root);
      if (toChild) {
        target.appendChild(toChild);
        this.deepCopyAsHTMLFromTo(fromChild, toChild, root);    
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
  
   static async elementToCanvas(element, zoom=1) {
    // zoom = 2; // see   tmp.style.transform = "scale(2)" in (rc/client/html.js)
    var bounds = lively.getTotalGlobalBounds(element)
    var extent = pt(bounds.width, bounds.height)

    await lively.sleep(100); // give the element some time to render...
    
    var cloned = CloneDeepHTML.deepCopyAsHTML(element)
    
    
    var h = document.createElement("html")
    h.appendChild(document.createElement("body"))
    // var style = document.createElement("style")
    // style.textContent = await fetch(lively4url + "/src/external/font-awesome/css/font-awesome.css").then(r => r.text())
    // h.appendChild(document.createElement("head"))
    // h.querySelector("head").appendChild(style)
    h.querySelector("body").appendChild(cloned)

    lively.setPosition(cloned, pt(0,0))
    var canvas = document.createElement("canvas")
    var minExtent = pt(1,1);
    canvas.width = Math.max(extent.x * zoom, minExtent.x);
    canvas.height = Math.max(extent.y * zoom, minExtent.y);
    await rasterizeHTML.drawHTML(h.outerHTML, canvas)
    
    canvas = this.trimCanvas(canvas)
    return canvas
  } 

  static async elementToDataURL(element, zoom) {
    var canvas = await this.elementToCanvas(element, zoom)
    return canvas.toDataURL("image/png")
  } 

  
  static async elementToURL(element, url, zoom) {
    var dataURL = await this.elementToDataURL(element, zoom)
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

export class TemplatePreview {
  
  static async createPreview(url, templateName) {
    if (!url) throw new Error("url argument missing");
    if (!templateName) throw new Error("templateName argument missing");    
    console.log("PREVIEW work on:" + templateName)
    try {
      var comp = await Promise.race([
        lively.openComponentInWindow(templateName),
        new Promise(r => setTimeout(r, 4000))
      ])
      if (!comp) {
        console.log("could not load component in time: " + templateName)
        return 
      }
      
      if (comp.livelyExample) {
        await comp.livelyExample()
      }
      
      var a = $morph("RasterImg"); if(a) a.remove();
      var img = await Rasterize.openAsImage(comp.windowTitle ? comp.parentElement : comp).then(img => {
        img.id = "RasterImg"
        img.style.width = (img.width * 1) + "px"
        img.style.position = "fixed"
        img.style.top  = "0px"
        img.style.right  = "0px"
        
        return img
      })
      // img.remove()

      var imgData = await fetch(img.src).then(r => r.blob())      
      var imgURL = url + templateName + ".png";
      await fetch(imgURL, { method: "PUT", body: imgData})
      console.log("PREVIEW wrote " + imgURL)
    } catch(e) {
      console.error(e)
    } finally {
      if (comp && comp.parentElement) {
        comp.parentElement.remove()  
      }  
    }
    return imgURL
  }
  
  static async generate(dry) {
    let urls = lively.components.getTemplatePaths();
    for(let url of urls) {
      console.log("generate preview in: " + url)
      let dir = await fetch(url, {
          method: "OPTIONS"
        }).then( r => r.json())
        let templates = dir.contents
          .filter(ea => ea.name.match(/\.html$/))
        for(let ea of templates) {
          let name = ea.name.replace(/\.html$/,"")
          let previewUrl = (url + name + ".png")
          try {
            console.log("next " + previewUrl)
            if (! await lively.files.existFile(previewUrl)) {
              if (TemplatePreview.stoped) return;
              if (dry) {
                console.warn("would generate " + url)
              } else {
                try {
                  await Promise.race([
                    this.createPreview(url, name),
                    new Promise(r => setTimeout(r, 6000))
                  ])
                } catch(e) {
                  console.warn("GeneratePreview Errro: " + e)
                }
              }
            } else {
              console.warn("Preview exists: " + previewUrl)
            }            
          } catch(e) {
            console.warn("Error when generating preview: " + e)
          }
          
        }
      }      
    }
}


// TemplatePreview.generate()

// Rasterize.openAsImage(that)