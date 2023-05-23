"disable deepeval"
/*MD # Lively4 ContextMenu 

creates the "world menu" for Lively4

- [worldMenuItems](#worldMenuItems)
- [targetMenuItems](#targetMenuItems)


MD*/

import html from './html.js';
import {pt} from './graphics.js';
import ViewNav from 'src/client/viewnav.js'
import Layout from "src/client/layout.js"
import Windows from "src/components/widgets/lively-window.js"
import {Grid} from "src/client/morphic/snapping.js"
import Info from "src/client/info.js"
import * as _ from 'src/external/lodash/lodash.js'
import Rasterize from 'src/client/rasterize.js'
import Favorites from "src/client/favorites.js"
import { applicationFolder } from 'src/client/vivide/utils.js';
import { createView } from 'src/client/vivide/scripts/loading.js';
import SearchRoots from "src/client/search-roots.js"
import Connection from "src/components/halo/Connection.js";
import { iconStringForFileEntry } from 'src/client/utils/font-awesome-utils.js'

// import lively from './lively.js'; #TODO resinsert after we support cycles again

export default class ContextMenu {
  
  constructor(target, optItems, options) {
    this.target = target;
    this.items = optItems;
    this.options = options;
  }
  
  openIn(container, evt, target, worldContext) {
     return ContextMenu.openIn(container, evt, target, worldContext, this.items, this.options);
  }
  
  static hide() {
    if (this.menu) this.menu.remove();
    lively.removeEventListener("contextMenu",  document.documentElement);
    delete this.menu
  }
  
  static visible() {
    return this.menu && this.menu.parentElement
  }
  
  static openComponentInWindow (name, evt, worldContext, extent) {
    this.hide();
    return lively.openComponentInWindow(name, 
      lively.getPosition(evt), 
      extent, worldContext).then( comp => {
      if(extent) {
        lively.setExtent(comp.parentElement, extent)
      }
      comp.focus()
      return comp
    });
  }
  
  static insertElementAtEvent(morph, evt, worldContext) {
    var pos = lively.getPosition(evt)
    this.openCenteredAt(morph, worldContext, evt)          


    // lively.hand.startGrabbing(morph, evt)
    window.that = morph
    lively.haloService.showHalos(morph)
    var grab = lively.halo.get('lively-halo-grab-item')
    var delta = pos.subPt(lively.getClientPosition(grab)).subPt(lively.pt(10,10))
    lively.moveBy(morph, delta)
    lively.haloService.showHalos(morph)

    grab.start(evt)

    lively.addEventListener("ContextMenuInsert", document.body.parentElement, "mousemove", (evt) => {
      grab.move(evt)
      lively.haloService.showHalos(morph)

    })

    lively.addEventListener("ContextMenuInsert",  document.body.parentElement, "mouseup", (evt) => {
      lively.removeEventListener("ContextMenuInsert", document.body.parentElement)
      grab.stop(evt)

    })
  }
  
  
  
  static get windowExtentOffeset() {
    return pt(2,21)
  }
  
  // #duplication #TODO see lively.openComponentInWindow
  static async openInWindow(comp) {
    // wrap an existing component in a window
    var pos = lively.getClientPosition(comp);
    var w = await lively.create("lively-window")
    w.focus()
    document.body.appendChild(w)
    lively.setClientPosition(w, lively.getClientPosition(comp))
    w.appendChild(comp)
    lively.setPosition(comp, pt(0,0))
    lively.setExtent(w, lively.getExtent(comp).addPt(this.windowExtentOffeset))
    comp.style.position = ""
    comp.style.width = "100%"
    comp.style.height = "100%"
    if (comp.id) w.setAttribute("title", comp.id)
    return w
  }
  
  static async stripWindow(comp, evt) {
    var w = comp.parentElement
    if (w.localName !== "lively-window") {
      throw new Error("Could not strip window, because there is none")
    }
    var extent = lively.getExtent(w).subPt(this.windowExtentOffeset)
    w.parentElement.appendChild(comp) 
    lively.setClientPosition(comp, lively.getClientPosition(w))
    lively.setExtent(comp, extent.addPt(this.windowExtentOffeset))
    w.remove()
    return comp
  }

  
  // #important
  static targetMenuItems(target) {
    var wasEditable = (target.contentEditable == "true");
    var wasDisabled = (target.disabled == "true");
    var targetInWindow = target.parentElement && target.parentElement.tagName == 'LIVELY-WINDOW';
    return [
      ["show", () => {
         this.hide();
         lively.showElement(target);
      },"", '<i class="fa fa-eye" aria-hidden="true"></i>'],
      ["open halo",
        [
          ["self", () => {lively.showHalo(target)}],
          ["parents", lively.allParents(target, [], true)
             .reverse()  
             .map(
              ea => [
                  (ea.localName && ea.localName.match(/-/)) ?
                      `<b>${ea.localName}</b>`
                      : lively.elementToCSSName(ea), 
                () => {lively.showHalo(ea)}])
          ],
          ["children",  Array.from(target.childNodes)
             .filter(ea => ea.localName)  
             .map( 
                ea => [lively.elementToCSSName(ea), () => {lively.showHalo(ea)}])
          ],
        ],
        "", '<i class="fa fa-search" aria-hidden="true"></i>'
      ],
      ["browse template source", (evt) => {
         this.hide();
         lively.showSource(target, evt);
      },
      "", '<i class="fa fa-file-image-o" aria-hidden="true"></i>'
      ],
      ["browse class source", (evt) => {
         this.hide();
         lively.showClassSource(target, evt);
      },
        "", '<i class="fa fa-file-code-o" aria-hidden="true"></i>'
      ],
      ["browse component class source" ,
        lively.allParents(target, [], true)
         .filter(ea => ea.localName && ea.localName.match(/-/))
         .reverse()
         .map( 
            ea => [ea.localName, (evt) => {lively.showClassSource(ea, evt)}])
      ],
      // ["trace", (evt) => {
      //    System.import("src/client/tracer.js").then(tracer => {
      //      tracer.default.traceObject(target);
      //    });
      //    this.hide();
      // }],
      ["remove", () => {
         target.remove()
         this.hide();
      },
      "", '<i class="fa fa-trash-o" aria-hidden="true"></i>'
      ],
      ["go back", () => {
        target.parentElement.insertBefore(target, target.parentElement.childNodes[0])
         this.hide();
      },
      "", '<i class="fa fa-backward" aria-hidden="true"></i>'
      ],
      ["come forward", () => {
        target.parentElement.appendChild(target)
        this.hide();
      },
      "", '<i class="fa fa-forward" aria-hidden="true"></i>'
      ],
      [
        "make space", () => {
          Layout.makeLocalSpace(target)
          this.hide()
        },
         "", '<i class="fa fa-file-code-o" aria-hidden="true"></i>'
      ],
      [wasEditable ? "make uneditable" : "make editable", () => {
         this.hide();
         target.contentEditable = !wasEditable;
      },     
        "", '<i class="fa fa-pencil" aria-hidden="true"></i>'
      ],
      [wasDisabled ? "enable" : "disable", () => {
         this.hide();
         target.disabled = !wasDisabled;
      },
        "", '<i class="fa fa-bolt" aria-hidden="true"></i>'
      ],
      [targetInWindow ? "strip window" : "open in window", (evt) => {
          this.hide();
          targetInWindow ?
            this.stripWindow(target, evt) :
            this.openInWindow(target, evt);
        },
        "", '<i class="fa fa-window-restore" aria-hidden="true"></i>'
      ],
      ["edit", async () => {
          if (target instanceof Image) {
            var url = target.getAttribute("src")
            if (url.match(/^data\:/)) {
              var editor = await lively.openComponentInWindow("lively-image-editor")
              editor.setTarget(target)
              
            } else {
              lively.openBrowser(url, true)
            }
            
          } else {
              lively.openInspector(target)
          }
        },
        "", '<i class="fa fa-file-image-o" aria-hidden="true"></i>'
      ],
      target.localName == "lively-file" ?
        [ "become content", async () => {
            if (target.url && target.name.match(/\.png$/)) {
              var element = await (<img id={target.name}></img>)
              element.src = target.url
              target.parentElement.appendChild(element)
              lively.setPosition(element, lively.getPosition(target))
              target.remove()
            } else {
               lively.notify("not supported")
            }
          },
          "", '<i class="fa fa-file-image-o" aria-hidden="true"></i>'
        ] :
      [  "become file", async () => {
            if (target.src) {
              var name  = this.id || await lively.prompt("convert to file named: ", "newfile.png")
              var element = await (<lively-file name={name}></lively-file>)
              target.parentElement.appendChild(element)
              
              element.setAttribute("url",await lively.files.readBlobAsDataURL(await fetch(target.src).then(r => r.blob())))
              lively.setPosition(element, lively.getPosition(target))

              target.remove()

            } else {
              lively.notify("not supported")
            }
          },
          "", '<i class="fa fa-file-image-o" aria-hidden="true"></i>'
        ],
      ["save as png ...", async () => {
          var previewAttrName = "data-lively-preview-src"
          var url = target.getAttribute(previewAttrName)
          if (!url) {
            var name = target.id || 
                target.textContent.slice(0,30) || 
                target.tagName.toLowerCase();
            url = lively4url + "/" + name + ".png"            
          }        
          url = await lively.prompt("save as png", url);
          if (url) {
            target.setAttribute(previewAttrName, url)
            if (target instanceof Image) {
              await lively.files.copyURLtoURL(target.src, url) 
            } else {
              await Rasterize.elementToURL(target, url)
            }
            lively.notify("saved image to ", url, 10, () => {
              lively.openBrowser(url)
            })
          }
        },
        "", '<i class="fa fa-file-image-o" aria-hidden="true"></i>'
      ],
      ["save as...", async () => {
        var partName = target.getAttribute("data-lively-part-name") || target.id ||  "element"
        var name = await lively.prompt("save element as: ", `src/parts/${partName}.html`)
        if (!name) return;
        // var name = "foo.html"
        var url = name
        
        if (!url.match(/https?:\/\//)) {
          if (url.match(/^[a-zA-Z0-9]+\:/)) {
            // url = lively.swxURL(url)
          } else {
            url = lively4url + "/" + url 
          }
        }
        var source = ""
        if (name.match(/\.html$/)) {
          source = target.outerHTML  
        } else if (name.match(/\.svg/)) {
          var element = target.querySelector("svg")
          if (!element) throw new Error("Could not find SVG elment in target");
          var extent = lively.getExtent(element)
          var tmp = document.createElement("div")
          tmp.innerHTML = element.outerHTML
          tmp.querySelector("svg").setAttribute("width", extent.x)
          tmp.querySelector("svg").setAttribute("height", extent.y)
          source = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' + 
            tmp.innerHTML  
        } else if (name.match(/\.png/)) {
          if (target.tagName == "IMG") 
            element = target
          else
            target.querySelector("img")
          if (!element) throw new Error("Could not find img elment in target");
          // var extent = lively.getExtent(element)
          // var tmp = document.createElement("div")
          // tmp.innerHTML = element.outerHTML
          source = await fetch(element.src).then(r => r.blob())
        } else{
          // fall back to text
          source = target.outerText
        }
        await lively.files.saveFile (url, source)
        lively.notify("saved ", name, 10, () => {
          lively.openBrowser(url)
        })
      },
      "", '<i class="fa fa-file-o" aria-hidden="true"></i>'
      ]
    ];
  }
  
  static openCenteredAt(morph, worldContext, evt) {
    worldContext.appendChild(morph);
    lively.setClientPosition(morph, pt(evt.clientX, evt.clientY)
      .subPt(lively.getExtent(morph).scaleBy(0.5)))
  }
  
  static preferenceEntry(preferenceKey) {
    let enabledIcon = function(enabled) {
      return enabled ? 
        '<i class="fa fa-check-square-o" aria-hidden="true"></i>' :
        '<i class="fa fa-square-o" aria-hidden="true"></i>'    
    }
    
    return [
      lively.preferences.shortDescription(preferenceKey), (evt, item) => {
        evt.stopPropagation();
        evt.preventDefault();
        
        if (lively.preferences.get(preferenceKey))  {
          lively.preferences.disable(preferenceKey)
        } else {
          lively.preferences.enable(preferenceKey)    
        }
        item.querySelector(".icon").innerHTML = enabledIcon(lively.preferences.get(preferenceKey)); 
      },"", enabledIcon(lively.preferences.get(preferenceKey))
    ]
  }
  
  // #important
  static worldMenuItems(worldContext) {
    
    let connections = []
    Connection.allConnections.forEach(connection => {
      connections.push(connection)
    })
    let existingConnectionsMenu = connections.map(connection => [connection.getFullLabel(), 
      async () => {
        let editor = await lively.openComponentInWindow('lively-connection-editor')
        lively.setExtent(editor.parentElement, lively.pt(800, 50))
        editor.setConnection(connection)
      }]);

    async function fetchSubEntries(path) {
      try {
        const { contents } = await path.fetchStats()
        const nonHiddenEntries = contents.filter(entry => !entry.name.startsWith('.') && !entry.name.endsWith('.l4d'));
        const { file: files = [], directory: directories = [] } = nonHiddenEntries.sortBy('name').groupBy(entry => {
          if (entry.name.endsWith('.md') && entry.type === 'directory') {
            return 'file'
          }
          return entry.type
        })
        
        const directoryEntries = directories.map(entry => menuEntryForDirectoryPath(`${path}/${entry.name}`, entry))
        const fileEntries = files.map(entry => menuEntryForFilePath(`${path}/${entry.name}`, entry))
        
        return [...directoryEntries, ...fileEntries]
      } catch (e) {
        return [['error on query']]
      }
    }
    
    function menuEntryForDirectoryPath(path, entry) {
      return {
        name: entry.name,
        get children() { return fetchSubEntries(path) },
        callback: async evt => {
          const container = await ContextMenu.openComponentInWindow("lively-container", evt, worldContext, pt(1210, 700));
          container.followPath(path + "/");
        },
        icon: '<i class="fa fa-folder" style="color: #e99a01;"></i>'
      }
    }

    function menuEntryForFilePath(path, entry) {
      return [entry.name, async evt => {
          const container = await ContextMenu.openComponentInWindow("lively-container", evt, worldContext, pt(1210, 700));
          container.followPath(path);
      }, entry.name.replace(/.*\./, ''), iconStringForFileEntry(entry)]
    }
    
    async function mainDirectories() {
      const folders = await fetchSubEntries(lively4url);
      
      const searchRoots = SearchRoots.getSearchRoots();
      if (searchRoots.length === 0) {
        return folders
      }
      
      return [
        ...searchRoots.map(root => {
          const rootPath = root.slice(0, -1);
          return menuEntryForDirectoryPath(rootPath, { name: rootPath.replace(/.*\//, ''), type: 'directory' })}),
        '---',
        ...folders
      ]
    }

    var items =  [
      ["Workspace", evt => {
        this.hide();
        lively.openWorkspace("", evt.clientX && lively.getPosition(evt), worldContext)
      }, "CMD+K", '<i class="fa fa-window-maximize" aria-hidden="true"></i>'],
      {
        name: "Browse/Edit",
        get children() { return mainDirectories() },
        callback: async(evt) => {
          var container = _.last(document.querySelectorAll("lively-container"));
          this.openComponentInWindow("lively-container", evt, worldContext, pt(1210, 700)).then(comp => {
            if (container)
              comp.followPath("" + container.getURL());
            else
              comp.followPath(lively4url +"/");
          });
        }, 
        right: "CMD+SHIFT+B",
        icon: '<i class="fa fa-cogs" aria-hidden="true"></i>'
      },
      // ["File Editor", evt => this.openComponentInWindow("lively-editor", evt)],
      // ["File Browser", evt => this.openComponentInWindow("lively-file-browser", evt)],
      ["Component Bin", evt => 
        this.openComponentInWindow("lively-component-bin", evt, worldContext,  pt(950, 660)),
       "CMD+O", '<i class="fa fa-th" aria-hidden="true"></i>'],
      ["Insert", [
        ["Text", evt => {
          var morph  = document.createElement("div");
          morph.classList.add("lively-text")

          morph.innerHTML = "Hello";
          morph.contentEditable = true;
          morph.style.width = "100px"
          worldContext.appendChild(morph);
          if (worldContext === document.body) {
            morph.classList.add("lively-content")
          }
          
          this.insertElementAtEvent(morph, evt, worldContext)
          
          this.hide();
        }, "", '<i class="fa fa-font" aria-hidden="true"></i>'],
        ["Rectangle", async (evt) => {
          var morph  = <div></div>;
          morph.style.width = "200px";
          morph.style.height = "100px";
          morph.style.border = "1px solid black"
          
          // morph.style.backgroundColor = "blue";
          if (worldContext === document.body) {
            morph.classList.add("lively-content")
          }
          morph.style.backgroundColor = 'rgba(40,40,80,0.5)';
          
          this.insertElementAtEvent(morph, evt, worldContext)
         
          
          
          this.hide();
        }, "", '<i class="fa fa-square-o" aria-hidden="true"></i>'],
        ["Slider", async evt => {
          var morph  = document.createElement("input");
          morph.setAttribute('type', 'range')
          worldContext.appendChild(morph);
          if (worldContext === document.body) {
            morph.classList.add("lively-content")
          }
          this.insertElementAtEvent(morph, evt, worldContext)
          
          this.hide();
        }, "", '<i class="fa fa-sliders" aria-hidden="true"></i>'],
         ["Drawing", async evt => {
          var morph  = document.createElement("lively-drawboard");
          morph.setAttribute("width", "400px");
          morph.setAttribute("height", "400px");
          await lively.components.openIn(worldContext, morph);

          // morph.style.backgroundColor = "blue";
          if (worldContext === document.body) {
            morph.classList.add("lively-content")
          }
          this.insertElementAtEvent(morph, evt, worldContext)
          morph.style.backgroundColor = 'rgb(255,250,205)';
          this.hide();
        }, "", '<i class="fa fa-pencil-square-o" aria-hidden="true"></i>'], 
        ["Button", async evt => {
          var morph  = await lively.openPart("button")
          // morph.style.backgroundColor = "blue";
          if (worldContext === document.body) {
            morph.classList.add("lively-content")
          }
           this.insertElementAtEvent(morph, evt, worldContext)
          this.hide();
        }],
        ["List", async evt => {
          var morph  = await (<lively-list>
              <li>one</li>
              <li>two</li>
              <li>three</li>
              <li>four</li>
            </lively-list>)
          if (worldContext === document.body) {
            morph.classList.add("lively-content")
          }
           this.insertElementAtEvent(morph, evt, worldContext)
          this.hide();
        }],
        ["Path", async evt => {
          var morph  = await lively.openPart("path")
          morph.classList.add("lively-content")
          this.insertElementAtEvent(morph, evt, worldContext)
          this.hide();
        }],
        ["Connector", async evt => {
          var morph  = await (<lively-connector></lively-connector>)
          this.insertElementAtEvent(morph, evt, worldContext)
          this.hide();
        }],
        
       
        
      ]],
      ["Tools", [
        // ["Services", evt => this.openComponentInWindow("lively-services", evt)],
        // ["Terminal", evt => this.openComponentInWindow("lively-terminal", evt)],
        ["Plugin Explorer", async evt => {
            const explorer = await this.openComponentInWindow('lively-plugin-explorer', evt, worldContext);
            explorer.livelyExample();
        }, "", '<i class="fa fa-plug" aria-hidden="true"></i>'],
        ["AST Explorer", evt => this.openComponentInWindow("lively-ast-explorer", evt, worldContext),
          undefined, '<i class="fa fa-tree" aria-hidden="true"></i>'],
        ["System Activity Trace", async evt => {
            await this.openComponentInWindow('lively-system-activity', evt, worldContext);
        }, "", '<i class="fa fa-bar-chart" aria-hidden="true"></i>'],
        // ['Debugger', evt => lively.openDebugger().then( cmp), 
        //   "", '<i class="fa fa-chrome" aria-hidden="true"></i>'],
        ["Test Runner", evt => this.openComponentInWindow("lively-testrunner", evt, worldContext),
          "", '<i class="fa fa-check-square-o" aria-hidden="true"></i>'],
        ["Inspector", evt => lively.openInspector(document.body)],
        
        ["Console", evt => this.openComponentInWindow("lively-console", evt, worldContext), 
          "CMD+J", '<i class="fa fa-terminal" aria-hidden="true"></i>'],
        ["Search", evt => this.openComponentInWindow("lively-search", evt, worldContext),
          "CMD+SHIFT+F",'<i class="fa fa-search" aria-hidden="true"></i>'],
        ["Drawboard", evt => this.openComponentInWindow("lively-drawboard", evt, worldContext),
          "", '<i class="fa fa-pencil-square-o" aria-hidden="true"></i>'],
        ["Storage Setup", evt => this.openComponentInWindow("lively-filesystems", evt, worldContext),
          "", '<i class="fa fa-cloud" aria-hidden="true"></i>'],
        ["Graph Control", evt => this.openComponentInWindow("graph-control", evt, worldContext),
          "Ctrl+Alt+G", '<i class="fa fa-globe" aria-hidden="true"></i>'],
        ["Diary", async evt => {
          const diary = await this.openComponentInWindow("research-diary", evt, worldContext);
          diary.selectFirstEntry();
        },
          "Ctrl+Alt+D", '<i class="fa fa-book" aria-hidden="true"></i>'],
        ["Quicklinks", async evt => {
          var morph  = await lively.openPart("quicklinks")          
          lively.setPosition(morph, lively.pt(0,0), "fixed")
          this.hide();
        }],
        ["X-Ray", async evt => {
          var morph  = await lively.openPart("WorldMirror") 
          lively.setClientPosition(morph, lively.getPosition(evt))
          this.hide();
        }, undefined, '<i class="fa fa-tv" aria-hidden="true"></i>'], 
        ["X-Ray Events", async evt => {
          var morph  = await lively.openPart("XRayEvents") 
          lively.setClientPosition(morph, lively.getPosition(evt))
          this.hide();
        }, undefined, '<i class="fa fa-tv" aria-hidden="true"></i>'],
        ["JSX-Ray ", async evt => {
          const jsxRay  = await lively.create("jsx-ray", document.body) 
          lively.setClientPosition(jsxRay, lively.getPosition(evt))
          this.hide();
        }, undefined, '<i class="fa fa-tv" aria-hidden="true"></i>'],
        ["Invalidate caches", async evt => {
          lively4invalidateFileCaches()
        }],
        ["Terminal", evt => this.openComponentInWindow("lively-xterm", evt, worldContext),
          "", '<i class="fa fa-terminal" aria-hidden="true"></i>'],
        ["Chrome Service-Workers", async evt => {
          // does not work... security?
          // window.open("chrome://inspect/#service-workers")
          // fuck it... just display it... better that nothing
          var workspace = await lively.openWorkspace("chrome://inspect/#service-workers")
          workspace.parentElement.setAttribute("title","open this in a tab...")
          workspace.mode = "text"
        }],
        ["Handwriting", async evt => {
          var morph  = await this.openComponentInWindow("lively-handwriting", evt, worldContext)
          
          lively.setExtent(morph.parentElement, lively.getExtent(morph).addPt(pt(0,20)))
          // lively.setPosition(morph, lively.pt(0,0), "fixed")
          // morph.style.bottom = "0px"
          // morph.style.right= "0px"
          this.hide();
        }],
        ["Change Graph", async evt => {
          lively.openBrowser(lively4url + "/doc/files/changesgraph.md")
          this.hide();
        }],
        
        ["Keyevent Display", async evt => {
          var comp = await (<keyevent-display></keyevent-display>)
          document.body.appendChild(comp)
          comp.style.zIndex = 10000
          lively.setClientPosition(comp, lively.getPosition(evt))
        }],
        // ["BP2019 Workspace", async evt => {
        //   const workspace = await this.openComponentInWindow("bp2019-workspace", evt, worldContext);
        // },
        //   "", '<i class="fa fa-terminal" aria-hidden="true"></i>'],
        ["MLE IDE", evt => {this.openComponentInWindow("lively-mle-ide", evt, worldContext).then(w => {w.parentNode.style.height="100vh";w.parentNode.style.width="100vw";lively.setClientPosition(w.parentNode, [0,0])})}, "", '<i class="fa fa-database" aria-hidden="true"></i>']
      ], undefined, '<i class="fa fa-wrench" aria-hidden="true"></i>'],
      ["Server", [
         ["Invalidate Transpiled Files", async evt => {
           
          const FilesCaches = await System.import("src/client/files-caches.js")
          var list = await FilesCaches.invalidateTranspiledFiles()
          var workspace = await lively.openWorkspace("" + list)
          workspace.parentElement.setAttribute("title","Purged Transpiled Files")
          workspace.mode = "text"
          
        }],
         ["Purged Transpiled Files WARNING! SLOW!", async evt => {
           
          const FilesCaches = await System.import("src/client/files-caches.js")
          var list = await FilesCaches.purgeTranspiledFiles()
          var workspace = await lively.openWorkspace("" + list.join("\n"))
          workspace.parentElement.setAttribute("title","Purged Transpiled Files")
          workspace.mode = "text"
          
        }],
         ["Update Cached Bootfiles", async evt => {
           
          const FilesCaches = await System.import("src/client/files-caches.js")
          var list = await FilesCaches.updateCachedFilesList()
          lively.openBrowser(lively4url + "/.lively4bootfilelist", true)        
        }],
      ], undefined, '<i class="fa fa-wrench" aria-hidden="true"></i>'],
      [
        "Favorites",
          Favorites.get().then(urls => {
            return urls.map(url => [
              url.replace(/\/index.md$/i, '').replace(/.*\//i, ''), // only files names
              async evt => {
                const comp = await this.openComponentInWindow("lively-container", evt, worldContext, pt(1000,600));
                return comp.editFile(url);
              },
              <span click={function (event) {
                const li = lively.query(this, 'li');
                if(li) { li.remove(); }
                event.stopPropagation();
                Favorites.remove(url);
              }}><i class="fa fa-close" aria-hidden="true"></i></span>,
              undefined
            ]);
          }), undefined, '<i class="fa fa-star" aria-hidden="true"></i>'
      ],
      [
        "Parts",
          fetch(lively4url + "/src/parts", {
            method: "OPTIONS"
          }).then(r => r.json()).then( json => json.contents.filter(ea => ea.name.match(/\.html/)).map(ea => {
            var partName = "" + ea.name.replace(/\.html/,"");
            return [
              partName, 
              async (evt) =>  {
                var morph  = await lively.openPart(partName)          
                lively.setClientPosition(morph, lively.getPosition(evt))
                lively.hand.startGrabbing(morph, evt)
                morph.classList.add("lively-content")
                this.hide();
              }]}).concat([[
            "Vivide Applications",
            lively.files.statFile(applicationFolder).then(r => (JSON.parse(r).contents || [])
              .filter(({ type }) => type=== 'file')
              .map(({ name }) => [name.split('.')[0], async () => {
                const content = JSON.parse(await lively.files.loadFile(applicationFolder+name));
                const n = name.split('.')[0];
                await createView(content, false, true, n);}
              ]))
          ]])), undefined, '<i class="fa fa-th-large" aria-hidden="true"></i>'
      ],
      [
        "Windows", 
        Windows.allWindows().map(ea => [
          "" + ea.getAttribute("title"),
          () => lively.gotoWindow(ea),
          (<span click={function (event) {
            ea.remove();
            const li = lively.query(this, 'li')
            if(li) {
             li.remove();
            }
            event.stopPropagation();
          }}><i class="fa fa-close" aria-hidden="true"></i></span>),
          ea.getAttribute("icon")
        ]).concat([["Close all", async () => {
          if(await lively.confirm('Close all windows?')) {
            document.body.querySelectorAll('lively-window').forEach(w => w.remove())
          } 
        }]]), undefined, '<i class="fa fa-window-restore" aria-hidden="true"></i>'
      ],
      ["Debug", [
          ['Connections', existingConnectionsMenu, '', '<i class="fa fa-arrow-right" aria-hidden="true"></i>'],
          ['Restore content', 
            lively.persistence.restoreBackupContextMenuItems()
          ]
        ], undefined, '<i class="fa fa-bug" aria-hidden="true"></i>'
      ],
      
      ["View", [
        ["Reset View", () => ViewNav.resetView(), 
          "",'<i class="fa fa-window-restore" aria-hidden="true"></i>'],
        
        !document.webkitIsFullScreen ?
            ["Enter Fullscreen", () => {
                document.documentElement.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT)
              },
              "F11", '<i class="fa fa-arrows-alt" aria-hidden="true"></i>'
            ] :
            ["Leave Fullscreen", () => document.webkitCancelFullScreen(),
              "F11", '<i class="fa fa-times-circle-o" aria-hidden="true"></i>'
          ],

        ["Gather Windows", () => {
            var pos = pt(0,0)
            _.sortBy(worldContext.querySelectorAll(":scope > lively-window"), ea => {
              return getComputedStyle(ea).zIndex
            }).forEach(ea => {
              lively.setPosition(ea, pos)
              pos = pos.addPt(pt(20,20))
            })
          },
          "", '<i class="fa fa-window-restore" aria-hidden="true"></i>'
        ],
        ["Explode Windows", () => {
            Layout.expandUntilNoIntersectionsExplosion()
          },
          "", '<i class="fa fa-window-restore" aria-hidden="true"></i>'
        ],
        ["Show Windows", () => {
            var pos = pt(0,0)
            var windowsByWidth = _.groupBy(document.body.querySelectorAll("lively-window"), ea => ea.clientWidth) 
            Object.keys(windowsByWidth).forEach( width => {
              windowsByWidth[width].forEach( ea => {
                lively.setPosition(ea, pos)
                pos = pos.addPt(pt(0, Math.max(lively.getExtent(ea).y, 50) + 10))
              })
              pos = pt(pos.x + Math.min(1000, Number(width)), 0)
            })
          },
          "", '<i class="fa fa-window-restore" aria-hidden="true"></i>',
        ],
        ["Snap All to Grid Now", () => {
          Grid.snapAllTopLevelContent()
        },
        "", '<i class="fa fa-th" aria-hidden="true"></i>'
        ]
      ]],
      ["Documentation", [
        ["Keyboard Shortcuts", () => {
          lively.openBrowser(lively4url + "/doc/manual/shortcuts.md")
          }, 
          "", '<i class="fa fa-file-text-o" aria-hidden="true"></i>'],
        ["Devdocs.io", (evt) => {
            this.openComponentInWindow("lively-help",  evt, worldContext);
          }, 
          "CMD+H", '<i class="fa fa-book" aria-hidden="true"></i>'],
        ["Docs", (evt) => {
          this.openComponentInWindow("lively-container", evt, worldContext).then(comp => {
              comp.followPath(lively4url + "/doc/index.md");
            });
          },
          "",'<i class="fa fa-file-text-o" aria-hidden="true"></i>'
        ],
        ["Vivide CheatSheet", evt => {
          this.openComponentInWindow("lively-container", evt, worldContext).then(comp => {
            comp.followPath(lively4url + "/src/client/vivide/cheatsheet.md");
          });
        },undefined, '<i class="fa fa-inbox" aria-hidden="true"></i>'],
        ["Vivide Scripts", evt => this.openComponentInWindow("lively-container", evt, worldContext).then(comp => comp.followPath(lively4url+"/src/client/vivide/scripts/index.md")), /* shortcut info */undefined, "<i class='fa fa-wrench' aria-hidden='true'></i>"],
        ["Journal", (evt) => {
          this.openComponentInWindow("lively-container", evt, worldContext, pt(1000,600)).then(comp => {
            comp.followPath(lively4url + "/doc/journal/index.md");
          });
        },
          "",'<i class="fa fa-file-text-o" aria-hidden="true"></i>'],
        ["Issues", (evt) => { 
          window.open("https://github.com/LivelyKernel/lively4-core/issues") ;
        },undefined, '<i class="fa fa-bug" aria-hidden="true"></i>'],
        ["Project Board", (evt) => {
           window.open("https://github.com/LivelyKernel/lively4-core/projects/1") ;
        },undefined, '<i class="fa fa-bug" aria-hidden="true"></i>'],
        ["Module Info", () => {
          Info.showModuleInfo()
          },undefined, '<i class="fa fa-info" aria-hidden="true"></i>']
      ]],
      ["Preferences",
        [["Search Roots", [["update all", () => {
          SearchRoots.updateAllSearchRoots()
        }]].concat(
          SearchRoots.getSearchRoots().map(ea => {
            return [ea.replace(lively4url.replace(/\/[^/]*$/,""),""), [
              ["browse", () => lively.openBrowser(ea)],
              ["update", () => SearchRoots.addSearchRoot(ea)],
              ["remove", () => SearchRoots.removeSearchRoot(ea)],
            ]]  
          }))]].concat(
          lively.preferences.listBooleans()
            .map(ea => this.preferenceEntry(ea)))
      ],
      ["Sync Github", (evt) => this.openComponentInWindow("lively-sync", evt, worldContext, pt(900, 500)), 
        "CMD+SHIFT+G",'<i class="fa fa-github" aria-hidden="true"></i>']
    ];
    
    
    if (worldContext !== document.body) {
      items.push(...[["save as ..", () => {
          if (worldContext.onSaveAs)
            worldContext.onSaveAs() 
          else html.saveCurrentPageAs();
        }],

        ["Save", () => {
            if (worldContext.onSave)
              worldContext.onSave()
            else
              html.saveCurrentPage();
          },
          "CMD+S", '<i class="fa fa-cloud-upload" aria-hidden="true"></i>']])      
    }
    
    return items
  }
  
  static items (target, worldContext = document.body) {
    console.log("[context menu] " + worldContext)
    if (target) {
      return this.targetMenuItems(target);
    } else {
      return this.worldMenuItems(worldContext);
    }
  }
  
  static openIn(container, evt, target, worldContext, optItems, options) {
    this.hide();
    this.firstEvent = evt

    var menu = lively.components.createComponent("lively-menu");
    return lively.components.openIn(container, menu).then(() => {
      if (this.menu) this.menu.remove();
      this.menu = menu;
      if (evt) {
        if (evt.clientX !== undefined && evt.clientY !== undefined) {
          lively.setClientPosition(menu, pt(evt.clientX, evt.clientY))
        } else if(evt.x !== undefined && evt.y !== undefined) {
          lively.setClientPosition(menu, pt(evt.x, evt.y))
        } else {
          lively.setClientPosition(menu, lively.getClientPosition(target))
        }
      }
      // menu.focus()
      lively.focusWithoutScroll(menu)
      menu.openOn(optItems || this.items(target, worldContext), evt, undefined, options)
      
      // defere event registration to prevent closing the menu as it was opened
      setTimeout(() => {
        lively.addEventListener("contextMenu", document.documentElement, "click", () => {
          this.hide();
        });        
      }, 0)
      
      return menu;
    });
  }
}

if (self.lively && lively.contextmenu) {
  lively.contextmenu = ContextMenu // make it live...
}
