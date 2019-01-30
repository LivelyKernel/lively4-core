import Morph from 'src/components/widgets/lively-morph.js';
import * as cop from "src/client/ContextJS/src/contextjs.js";
import events from "src/client/morphic/events.js";
import boundEval from "src/client/bound-eval.js";

export default class JsxRay extends Morph {
  async initialize() {
    lively.warn('initialize')
    this.windowTitle = "JSX-Ray";

    this.livelyLoad()
    
    lively.removeEventListener('jsx-ray', document);
    lively.addEventListener('jsx-ray', document, 'keydown', evt => JsxRay.onKeyDown(evt), { capture: true, passive: true})
    lively.addEventListener('jsx-ray', document, 'keyup', evt => JsxRay.onKeyUp(evt), { capture: true, passive: true})
  }

  static onKeyDown(evt) {
    if (evt.keyCode !== 17 ) { return; } // Control key

    document.body.querySelectorAll('jsx-ray')
      .forEach(jsxRay => jsxRay.setPickThrough(false));
  }
  
  static onKeyUp(evt) {
    if (evt.keyCode !== 17 ) { return; } // Control key

    document.body.querySelectorAll('jsx-ray')
      .forEach(jsxRay => jsxRay.setPickThrough(true));
  }
  
  setPickThrough(pickThrough) {
    if (pickThrough) {
      this.frame.classList.add('pickThrough');
    } else {
      this.frame.classList.remove('pickThrough');
    }
  }

  onDragStart(evt) {
    if(evt.altKey || evt.shiftKey || evt.ctrlKey) return 
    this.isdragging = true
    // this.updateWorld()
    this.dragOffset = lively.getPosition(this).subPt(lively.getPosition(evt))
    lively.addEventListener('mirror-dragging', document.body.parentElement,'pointermove', evt => this.onDrag(evt));
    lively.addEventListener('mirror-dragging', document.body.parentElement,'pointerup', evt => this.onDragStop(evt));
  }

  onDrag(evt) {
    if(!this.isdragging) return
    lively.setPosition(this, this.dragOffset.addPt(lively.getPosition(evt)))
    this.ajustRootPosition()
  }

  onDragStop(evt) {
    this.isdragging = false
    lively.removeEventListener('mirror-dragging', document.body.parentElement)
  }

  onDragHandleStart(evt) {
    if(evt.altKey || evt.shiftKey) return 
    this.isdragging = true
    this.dragOffset = lively.getPosition(this.handle).subPt(lively.getPosition(evt))
    lively.addEventListener('mirror-dragging', document.body.parentElement,'pointermove', evt => this.onDragHandle(evt));
    lively.addEventListener('mirror-dragging', document.body.parentElement,'pointerup', evt => this.onDragHandleStop(evt));
    evt.stopPropagation()
  }

  onDragHandle(evt) {
    if(!this.isdragging) return
    lively.setPosition(this.handle, this.dragOffset.addPt(lively.getPosition(evt)))
    this.ajustRootPosition()
    evt.stopPropagation()
  }

  onDragHandleStop(evt) {
    this.isdragging = false
    lively.removeEventListener('mirror-dragging', document.body.parentElement)
    evt.stopPropagation()
  }
  
  showElement(element) {
    this.hideHighlight();
    
    this.highlight = lively.showElement(element, 10000);
    this.highlight.innerHTML = '';
    this.highlight.style.border = '1px blue solid';
    
    return this.highlight;
  }
  hideHighlight() {
    if (this.highlight) {
      this.highlight.remove();
    }
  }

  async selectElement(element, evt) {
    this.buildElementListFor(element);
  }
  
  innerSelect(element) {
    this.showElement(element);
    this.buildEditorFor(element);
  }
  
  buildElementListFor(element) {

    this.parentElements.style.display = 'block';
    this.parentElements.innerHTML = '';
    
    this.parentListElementByElement = new Map();
    this.elementByParentListElement = new Map();
    
    [element, ...lively.allParents(element, [], true)].reverse().forEach(ele => {
      let entry;

      if (ele instanceof ShadowRoot) {
        entry = <span class="element-shadow-root">#shadow-root</span>;
      } else {
        function buildAttribute(name, value) {
          return <span><span class="attribute-name"> {name}</span><span class="attribute-syntax">=</span><span class="attribute-value">'{value}'</span></span>;
        }
        const id = ele.id ? buildAttribute('id', ele.id) : '';
        const classes = ele.classList.length >= 1 ? buildAttribute('class', ele.classList.toString()) : '';

        entry = <span><span class="element-tag">&lt;{ele.localName}</span>{id}{classes}<span class="element-tag">&gt;</span></span>;
      }

      let jsxCSSClass = '';
      if (ele.jsxMetaData) {
        jsxCSSClass = 'jsx-element';

        if (ele.jsxMetaData.aexpr) {
          jsxCSSClass += ' active-expression';
        }

        if (ele.jsxMetaData.activeGroup) {
          jsxCSSClass += ' active-group-item';
        }
      }

      const container = <div mouseenter={evt => {
        this.innerSelect(ele)
        this.selectElementForParentElementsList(ele)
      }} click={evt => this.hardSelect(ele)} class={jsxCSSClass}>{entry}</div>;
      container.isMetaNode = true;
      this.parentElements.appendChild(container);

      this.parentListElementByElement.set(ele, container);
      this.elementByParentListElement.set(container, ele);
    })

    this.positionRightOf(element, this.parentElements, lively.pt(30, 0));
    
    this.selectElementForParentElementsList(element);
  }
  
  // #TODO: from hover
  selectElementForParentElementsList(subject) {
    Array.from(this.parentElements.children).forEach(div => {
      div.classList.remove('selected-node');
    })
    const container = this.parentListElementByElement.get(subject);
    if (container) {
      container.classList.add('selected-node');
    }
    this.innerSelect(subject);
  }
  
  positionRightOf(anchor, element, offset = lively.pt(0, 0)) {
    const toolsOrigin = lively.getTotalGlobalBounds(anchor)
    let rightCenter = toolsOrigin.rightCenter()
    rightCenter = rightCenter.addPt(offset)
    rightCenter = rightCenter.subPt(lively.pt(0, lively.getExtent(element).y / 2))
    lively.setGlobalPosition(element, rightCenter)
  }
  
  hardSelect(element) {
    lively.showHalo(element);
  }
  
  async buildEditorFor(element) {
    if (element.jsxMetaData) {
      const location = element.jsxMetaData.sourceLocation;
      
      if (location.file !== this.sourceEditor.getURLString()) {
        this.sourceEditor.setURL(location.file);
        await this.sourceEditor.loadFile();
      }
      
      this.sourceEditor.style.display = 'block';

      this.sourceEditor.currentEditor().scrollIntoView({
        line: location.start.line - 1,
        ch: location.start.column
      }, 50);
      
      this.sourceEditor.currentEditor().setSelection({
        line: location.start.line - 1,
        ch: location.start.column
      }, {
        line: location.end.line - 1,
        ch: location.end.column
      }, { scroll: false });

      this.positionRightOf(this.parentElements, this.sourceEditor, lively.pt(5, 0));
    } else {
      this.sourceEditor.style.display = 'none';
    }
  }

  async onNodeFilterChanged() {
    const result = await boundEval(this.nodeFilter.value);
    if (!result.isError) {
      this.nodeFilterFunc = result.value;
      this.nodeFilter.classList.remove('error')
      this.updateWorld()
    } else {
      this.nodeFilter.classList.add('error')
    }
  }
  
  // #TODO, #refactor: duplicated code
  async onEventFilterChanged() {
    const result = await boundEval(this.eventFilter.value);
    if (!result.isError) {
      this.eventFilterFunc = result.value;
      this.eventFilter.classList.remove('error')
      this.updateWorld()
    } else {
      this.eventFilter.classList.add('error')
    }
  }
  
  filterElements(all) {
    if(!this.nodeFilterFunc) {debugger}
    return Array.from(all)
      .filter(ea => ea && ea.tagName)
      .filter(this.nodeFilterFunc)
      .slice(0, 200)
  }

  updateWorld() {
    this.world.innerHTML = ""
    this.addElements(lively.allElements(true))
    // this.stopHierrachyObservation(document.body)

    this.startHierrachyObservation(document.body)
  }

  removeElements(elements) {
    if (!this.elementMap || !elements) return;

    elements.forEach(ea => {
      if (!ea || !ea.tagName) return;
      lively.allElements(true, ea).forEach(element => {
        var mirrorElement = this.elementMap.get(element)

        if (mirrorElement) {
          // console.log("remove", mirrorElement)
          lively.html.removeContextStyleChangeListener(ea, mirrorElement.updatePosition)
          mirrorElement.remove()
        }
      })
    })
  }

  stopHierrachyObservation(obj, visited = new Set()) {
    if (obj.isMetaNode) return;
    if (obj instanceof Text) return

    if (!this.hierrachyObservers) {
      return // nothing to do
    }
    if (visited.has(obj)) return // guard endless loops
    visited.add(obj)
    this.removeElements([obj])
    // console.log("stopHierrachyObservation", obj)


    var observer = this.hierrachyObservers.get(obj)
    if (observer) {
      observer.disconnect()
      this.hierrachyObservers.set(obj, null)
    }
    // recursively, stop it for all children and its children
    if (obj.childNodes) {
      obj.childNodes.forEach(ea => {
        this.stopHierrachyObservation(ea)
      })
    }
    if (obj.shadowRoot) {
       this.stopHierrachyObservation(obj.shadowRoot)
    }
  }

  buildMirrorElement(subject, all) {
    const mirrorElement = <div class="mirror-element"></div>;
    mirrorElement.isMetaNode = true;
    mirrorElement.target = subject;
    
    if (all.length < 200) {
      mirrorElement.appendChild(<div class="element-label">{subject.localName}</div>);
    }

    if (subject.jsxMetaData) {
      mirrorElement.classList.add('jsx-element');

      if (subject.jsxMetaData.aexpr) {
        mirrorElement.classList.add('renders-active-expression');
      }

      if (subject.jsxMetaData.activeGroup) {
        mirrorElement.classList.add('renders-active-group-item');
      }
    }

    mirrorElement.updatePosition = () => {
      const bounds = lively.getGlobalBounds(subject)
      lively.setGlobalPosition(mirrorElement, bounds.topLeft())
      lively.setExtent(mirrorElement, bounds.extent())      
    }

    mirrorElement.addEventListener("mousemove", evt => {
      this.selectElement(subject, evt)
    })

    mirrorElement.addEventListener("mouseout", evt => {
      if (evt.ctrlKey) {
        this.sourceEditor.style.display = 'none';
        this.parentElements.style.display = 'none';
        this.hideHighlight();
      }
    })
        
    mirrorElement.addEventListener("click", evt => {
      this.selectElement(subject, evt);
      this.hardSelect(subject);
    })
        
    return mirrorElement;
  }
  
  addElements(elements) {
    if (!elements) { return; }

    const all = this.filterElements(elements)

    if (!this.elementMap) {
      this.elementMap = new WeakMap()
    }

    // this.label.innerHTML = " on " + all.size + " elements "
    all.forEach(subject => {
      if (subject === this || subject.isMetaNode || subject instanceof Text) { return; }
      // console.log("added " + subject)

      let mirrorElement = this.elementMap.get(subject)

      if (!mirrorElement) {
        mirrorElement = this.buildMirrorElement(subject, all);

        this.elementMap.set(subject, mirrorElement)
        // console.log("add",mirrorElement)

        lively.html.addContextStyleChangeListener(subject, mirrorElement.updatePosition)
      } 

      if (!mirrorElement.parentElement) {
        this.world.appendChild(mirrorElement)
      }

      mirrorElement.updatePosition()
    })
  }

  onClose() {
    this.stopAll()
  }
  
  stopAll() {
    this.stopHierrachyObservation(document.body)
  
    this.disableEventXRay()
  }

  registerOnClose(obj) {
    if (!obj || !obj.parentElement) return;

    if (obj.__onCloseObserver) obj.__onCloseObserver.disconnect();

    var observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {  
          if(mutation.type == "childList") {
            mutation.removedNodes.forEach(ea => {
              if (ea == obj) {
                obj.dispatchEvent(new CustomEvent("on-close"))
              }  
            })
          }
        });
      })
    observer.observe(obj.parentElement, { 
      childList: true,
    });

    obj.__onCloseObserver = observer
  }

  startHierrachyObservation(obj, visited=new Set()) {
    if (obj.isMetaNode) return;
    if (!obj) return
    if (obj instanceof Text) return

    if (!this.hierrachyObservers) {
      this.hierrachyObservers = new WeakMap()
    }
    if (visited.has(obj)) return // guard endless loops
    visited.add(obj)
    this.addElements([obj])

    var observer = this.hierrachyObservers.get(obj)
    if (!observer) {
      // console.log("startHierrachyObservation", obj)
      observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {  
          if(mutation.type == "childList") {
            mutation.removedNodes.forEach(ea => {
              this.stopHierrachyObservation(ea) 
            })
            mutation.addedNodes.forEach(ea => {
              this.startHierrachyObservation(ea)
            })
          }
        });
      })
      this.hierrachyObservers.set(obj, observer)
      observer.observe(obj, { 
        // subtree: true, /* does not go into shadow root, and does not allow to filter */
        childList: true,
      });

      // recursively, stop it for all children and its children
      if (obj.childNodes) {
        obj.childNodes.forEach(ea => {
          this.startHierrachyObservation(ea)
        })
      }
      if (obj.shadowRoot) {
         this.startHierrachyObservation(obj.shadowRoot)
      }
    }
  }

  get frame() { return this.get('#frame'); }
  get world() { return this.get('#world'); }
  get nodeFilter() { return this.get('#nodeFilter'); }
  get eventFilter() { return this.get('#eventFilter'); }
  get handle() { return this.get('#handle'); }
  get frameHandlesLeft() { return this.get('#frameHandlesLeft'); }
  get frameHandlesLeftLabel() { return this.get('#frameHandlesLeftLabel'); }
  get sourceEditor() { return this.get('#sourceEditor'); }
  get parentElements() { return this.get('#parentElements'); }
  get nodeAncestryList() { return this.get('#nodeAncestryList'); }

  mirrorWorld() {
    this.frame.isMetaNode = true
    lively.setExtent(this.frame, lively.pt(300,300))
    lively.setPosition(this.frame, lively.pt(0,0))

    this.world.isMetaNode = true

    this.nodeFilter.isMetaNode = true
    this.nodeFilter.addEventListener("keyup", evt => {
      if (evt.keyCode == 13) { // ENTER
        this.onNodeFilterChanged();
      }
    });

    this.eventFilter.isMetaNode = true
    this.eventFilter.addEventListener("keyup", evt => {
      if (evt.keyCode == 13) { // ENTER
        this.onEventFilterChanged();
      }
    });

    this.handle.isMetaNode = true
    lively.addEventListener('dragging', this.handle, 'pointerdown', evt => this.onDragHandleStart(evt));

    this.frameHandlesLeft.isMetaNode = true
    lively.setExtent(this.frameHandlesLeft, lively.pt(10,300))
    lively.setPosition(this.frameHandlesLeft, lively.pt(-10,-20))
    lively.addEventListener('dragging', this.frameHandlesLeft, 'pointerdown', evt => this.onDragStart(evt));

    this.frameHandlesLeftLabel.isMetaNode = true

    this.sourceEditor.isMetaNode = true
    lively.setExtent(this.sourceEditor, lively.pt(600,150))
    lively.warn('reset')
    lively.setPosition(this.sourceEditor, lively.pt(0,200))
    this.sourceEditor.hideToolbar();

    this.ajustRootPosition()
    this.updateWorld()
  }

  ajustRootPosition() {
    const extent = lively.getPosition(this.handle).maxPt(lively.pt(200,200))
    lively.setPosition(this.handle, extent)

    lively.setGlobalPosition(this.world, lively.getGlobalPosition(document.body))
    lively.setExtent(this.frame, extent)

    lively.setExtent(this.frameHandlesLeft, lively.pt(10,extent.y + 20))

    var barHeight = extent.y + 20
    lively.setExtent(this.frameHandlesLeft, lively.pt(20, barHeight))
    lively.setPosition(this.frameHandlesLeftLabel, lively.pt(0, barHeight - 10))
}

  livelyLoad() {
    this.cop = cop;
    this.events = events;
    
    this.nodeFilterFunc = node => node.jsxMetaData; // ea.tagName && ea.tagName.match(/-/)
    this.eventFilterFunc = (obj, type, evt) => type === 'mousedown';

    this.registerOnClose(this)
    lively.removeEventListener("self", this)
    lively.addEventListener("self", this, "on-close", () => this.onClose())

    this.mirrorWorld()
    lively.html.registerContextStyleObserver(document.body, "XRay")
    // lively.html.disconnectContextStyleObserver(document.body, "XRay")  

    this.enableEventXRay()
  }

  logEvent(obj, type, evt) {
    if (obj.isMetaNode) return;
    if (obj === this) return;
    if (!this.eventFilterFunc || !this.eventFilterFunc(obj, type, evt)) { return; }

    this.eventTypeCounter.set(type, (this.eventTypeCounter.get(type) || 0) + 1)
    this.eventElementCounter.set(this, (this.eventElementCounter.get(obj) || 0) + 1)
    // // this.limit = 100
    // if (!this.limit || this.limit <= 0) {
    //   return
    // } 
    // this.limit -= 1
    console.log("evt", evt)

    var div = lively.showEvent(evt)
    div.style.fontSize = "8px"
    div.style.color = "blue"
    // div.style.width = "max-content";
    div.innerHTML = type + ' ' + evt.target
    div.isMetaNode = true
    var pos = lively.getGlobalPosition(div)

    this.world.appendChild(div)
    if (pos.x == 0 && pos.y == 0) { // keyboard events... etc.
      lively.setGlobalPosition(div, lively.getGlobalPosition(obj))
    } else {
      lively.setGlobalPosition(div, pos)
    }

  }
  disableEventXRay() {
    if (this.xRayLayer) {
      this.xRayLayer.beNotGlobal()
    }
    if (this.events && this.logBeforeEvent) {
      this.events.disconnectBeforeEvent(this.logBeforeEvent)
    }
  }

  enableEventXRay() {
    if (!this.events) return;

    this.disableEventXRay()

    this.eventElementCounter = new WeakMap()
    this.eventTypeCounter= new Map()

    this.logBeforeEvent = (obj, type, evt) => this.logEvent(obj, type, evt)
    this.events.registerBeforeEvent(this.logBeforeEvent)

    // ------------- old non-event xray -----------
    
    this.eventXRay = true
    this.eventElementCounter = new WeakMap()
    this.eventTypeCounter= new Map()

    if (this.xRayLayer) {
      this.xRayLayer.beNotGlobal()
    }

    var cop = this.cop
    var self = this
    var map = this.elementMap || new Map() 

    if (!this.cbMap) {
      this.cbMap = new WeakMap()
    }
    var cbMap = this.cbMap

    var layer = cop.layer("EventListener")
    layer.refineClass(HTMLElement, {
      removeEventListener(type, cb, ...rest) {
        var wrappedCB = cbMap.get(cb) // we have to keep the illusion
        return cop.proceed(type, wrappedCB || cb, ...rest)
      },

      addEventListener(type, cb, ...rest) {
        // console.log("addEventListener " + type)
        // we cannot just wrapp a callback cb, because callbacks are also used in removeEventListener...
        var counter = 0
        var func = cbMap.get(cb) || (function(...args) {
          // console.log('func ' + type)

          cop.withoutLayers([layer], () => {
            if (this.isMetaNode) return;
            self.eventTypeCounter.set(type, (self.eventTypeCounter.get(type) || 0) + 1)
            self.eventElementCounter.set(this, (self.eventElementCounter.get(this) || 0) + 1)
            if (self.elementMap) {
              var mirrorElement = self.elementMap.get(this)
              var evt = args[0]
              if (mirrorElement && evt) {
                var div = lively.showEvent(evt)
                div.style.fontSize = "8px"
                div.style.color = "blue"
                div.innerHTML = type + "_" + counter
                div.isMetaNode = true
                var pos = lively.getGlobalPosition(div)
                mirrorElement.appendChild(div)
                console.log("evt", evt, "pos", pos)
                if (pos.x == 0 && pos.y == 0){ // keyboard events... etc.
                  lively.setPosition(div, lively.pt(0, 20 * (counter++ % 40)))
                } else {
                  lively.setGlobalPosition(div, pos)
                }
              }
            }    
          })
          return cb.apply(this, args)
        }) 
        cbMap.set(cb, func)
        cop.proceed(type, func, ...rest) 
      }
    })
    this.xRayLayer = layer
    window.xRayLayer =  this.xRayLayer
    this.xRayLayer.beGlobal()
  }
  
  /* Lively-specific API */

  livelyPreMigrate() {
    // is called on the old object before the migration
  }
  
  livelyMigrate(other) {
    lively.warn('migrate')
    this.stopAll()
  }
  
  livelyInspect(contentNode, inspector) {
  }
  
  livelyPrepareSave() {
  }
  
  async livelyExample() {
  }
}