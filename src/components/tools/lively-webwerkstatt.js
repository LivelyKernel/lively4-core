import Morph from 'src/components/widgets/lively-morph.js';
import {pt,rect} from 'src/client/graphics.js'


export default class LivelyWebwerkstatt extends Morph {
  async initialize() {
   
    this.updateView()
  }
  
  setURL(url) {
    this.setAttribute("url", url)
    this.updateView()
  }

  getURL() {
    return this.getAttribute("url")
  }
  
  
  async loadSource() {
    return lively.files.loadFile(this.getURL())
  }

  async loadDocument() {
    var s = await this.loadSource()
    var parser = new DOMParser();
    var xmlDoc = parser.parseFromString(s,"text/xml");
    return xmlDoc
  }

  
  async load() {    
    var json;
    var xmlDoc = await this.loadDocument()
    var serializedWorld = xmlDoc.querySelector("#LivelyJSONWorld")
    
    if (!serializedWorld) {
      return 
    }
    json = serializedWorld.textContent

    var registry;
    function reviver(key, value) {
      if (this.registry && this.id == 0) {
        registry = this.registry;
      }


      if (value && value.__isSmartRef__) {
        // console.log("replace smart ref " + value.id)
        if (registry) {
          return registry[value.id]
        } else {
          console.log("warning: registry not there for deserializing " + value.id)
        }

      } 

    //     if (value.$ref) {
    //       return idToObj.getOrCreate(value.$ref, () => value.$isArray ? [] : {});
    //     }


    //     if (!value) {
    //       return value;
    //     }

    //     if (value.$ref) {
    //       return idToObj.getOrCreate(value.$ref, () => value.$isArray ? [] : {});
    //     }

    //     if (value.$id) {
    //       const id = value.$id;
    //       delete value.$id;

    //       const array = value.$array;

    //       if (idToObj.has(id)) {
    //         const proxy = idToObj.get(id);

    //         if (array) {
    //           proxy.push(...array);
    //           value = proxy;
    //         } else {
    //           value = Object.assign(proxy, value);
    //         }
    //       } else {
    //         if (array) {
    //           value = array;
    //         }
    //         idToObj.set(id, value);
    //       }
    //     }

    //     if (value.$class) {
    //       const className = value.$class;
    //       delete value.$class;

    //       const classToRestore = classes[className];
    //       if (classToRestore) {
    //         value.migrateTo(classToRestore);
    //       }
    //     }
      return value;
    }

    var o2= JSON.parse(json, reviver)
    return o2.registry[0]
  }
  
  async updateView() {
    if (!this.getURL()) return;
    this.world = await this.load()
    this.content = this.get("#content")
    this.content.innerHTML = ""
    
    if (!this.world) {
      var doc = await this.loadDocument()
      this.doc = doc
      this.printDocument(doc, this.content)
    } else {
      if (this.world.__SourceModuleName__ == "Global.lively.oldCore.Morphs") {
        this.printOldMorph(this.world, this.content)      
      } else {
        this.printMorph(this.world, this.content)
      }
    }
    var dir = this.getURL().replace(/[^/]*$/,"")
    lively.html.fixLinks(this.content.querySelectorAll("image") , dir, url => lively.openBrowser(url) )
    
  }
  
  /*
    var doc = this.doc
  */
  async printDocument(doc, parent) {
    var body = doc.querySelector("body")
    
    for(let ea of Array.from(body.childNodes)) {
      parent.appendChild(ea)
    }
    var svgElement = parent.querySelector("svg#canvas")
    if (svgElement) {
      svgElement.style.width = svgElement.getBBox().width
      svgElement.style.height = svgElement.getBBox().height
    }
  }
  
  getProp(obj, prop) {
    try {
      var value = eval( obj[prop])
    } catch(e) {
      console.log("[lively-webwerkstatt] could not evaluate "  + value)
    }
    return value
  }
  
  getPropDo(obj, prop, cb) {
    var value = this.getProp(obj, prop)
    if (value !== undefined) cb(value)
  }
  
  getValueDo(obj, prop, cb) {
    var value = obj[prop]
    if (value !== undefined) cb(value)
  }
  
  getColorDo(obj, prop, cb) {
    var color = obj[prop]
    if (color !== undefined) {
      if (color && color.__LivelyClassName__) {
        
        color = `rgba(${color.r * 255},${color.g * 255},${color.b * 255}, ${color.a})`
      } else if (color && color.replace) {
        color = color.replace(/Color\./,"")
      }
      cb(color)
    }
  }
  
  fillToColor(fill) {
    if (fill && fill.__LivelyClassName__ == "Color") { 
      var color = `rgb(${fill.r * 255},${fill.g * 255},${fill.b* 255},${fill.a})`
      return color
    }
   
  }
  
  printOldMorph(morph, parent) {
    var div = <div class="morph"></div>
    div.morph = morph
    parent.appendChild(div)
    if (morph.origin) {
      lively.setPosition(div, lively.pt(morph.origin.x,morph.origin.y))
    }
    
    var shape = <div class="shape"></div>
    div.appendChild(shape)
    if (morph.shape) {
         // nothing 
      if (morph.shape._x !== undefined) {
        lively.setPosition(shape, pt(morph.shape._x, morph.shape._y))
      }
      
      if (morph.shape._width !== undefined) {
        lively.setExtent(shape, pt(morph.shape._width, morph.shape._height))
      } else {
        div.style.whiteSpace = "pre"
        // shape.width = "fit-content"
        //  nothing?        
      }
      
      shape.style.backgroundColor = this.fillToColor(morph.shape._fill)
     
      
//       this.getValueDo(morph.shape, "_BorderWidth", width => {
//         shape.style.borderStyle = "solid"
//         shape.style.borderWidth = width + "px"
       
//       }) 
//       this.getColorDo(morph.shape, "_BorderColor", color => {
//         shape.style.borderColor = color
//       })
    } 
    if (morph.textString) {
      var text = <div class="text"></div>
      // lively.setPosition(text, lively.pt(0,0))
      text.textContent = morph.textString
      
      text.style.fontSize = morph.fontSize + "px" // pt seems to be wrong here...?
      text.style.fontFamily = morph.fontFamily
      text.style.color = this.fillToColor(morph.textColor)
      
      // this.getColorDo(morph, "_TextColor", color => text.style.color = color)
      
      
      shape.appendChild(text)
      
    } 
    if (morph.submorphs) {
      for(let ea of morph.submorphs) {
        this.printOldMorph(ea, div) 
      }
    }
  }
  
  
  
  printMorph(morph, parent) {
    var div = <div class="morph"></div>
    div.morph = morph
    parent.appendChild(div)
    var scale = 1
    var rotation = 0
    this.getValueDo(morph, "_Scale", value => scale = value) 
    this.getValueDo(morph, "_Rotation", value => rotation = value) 
    
    div.style.transform = `scale(${scale}) rotate(${rotation}rad)`
    div.style.transformOrigin="0 0"

    
    this.getPropDo(morph, "_Position", pos => lively.setPosition(div, pos))
    var shape = <div class="shape"></div>
    div.appendChild(shape)
    if (morph.shape) {
      this.getPropDo(morph.shape, "_Position", pos => lively.setPosition(shape, pos))
      this.getPropDo(morph.shape, "_Extent", extent => lively.setExtent(shape, extent))
      this.getValueDo(morph.shape, "_BorderWidth", width => {
        shape.style.borderStyle = "solid"
        shape.style.borderWidth = width + "px"
       
      }) 
      this.getColorDo(morph.shape, "_BorderColor", color => {
        shape.style.borderColor = color
      })
      
      
      this.getColorDo(morph.shape, "_Fill", color => {
        if (color && color.replace) {
          shape.style.backgroundColor = color
        }
      })      
    } 
    if (morph.textChunks) {
      var text = <div class="text"></div>
      lively.setPosition(text, lively.pt(0,0))
      this.getPropDo(morph, "_Padding", rect => text.style.padding = 
                     rect.x +"px " + rect.y +"px " + rect.width +"px " + rect.height +"px")
      for(let chunk of morph.textChunks) {
        var span = <span>{chunk.storedString}</span>
        if (chunk.style) {
          this.getColorDo(chunk.style, "color", color => span.style.color = color)
        }
        text.appendChild(span)
      }
      
      
      this.getValueDo(morph, "_FontFamily", string => text.style.fontFamily = string)
      this.getValueDo(morph, "_FontSize", size => text.style.fontSize = size + "pt")
      this.getColorDo(morph, "_TextColor", color => text.style.color = color)
      shape.appendChild(text)
      if (morph._MinTextWidth) {
        text.style.width = morph._MinTextWidth + "px"
      }
    } 
    
    
    this.getValueDo(morph, "_ClipMode", value => div.style.overflow = value)
    
    if (morph.name) {
      div.id = morph.name
    }
    
    if (morph.submorphs) {
      for(let ea of morph.submorphs) {
        this.printMorph(ea, div) 
      }
    }
  }
  
  
  async livelyExample() {
    this.setURL("http://localhost:9005/Dropbox/Journal/2011/2011-JanFebMar.xhtml")
    
    // this.setURL("http://localhost:9005/Dropbox/Thesis/webwerkstatt/WriteFirst/2015-01-15.xhtml")
    //this.setURL("https://lively-kernel.org/repository/webwerkstatt/webwerkstatt.xhtml")
  }
  
  
}