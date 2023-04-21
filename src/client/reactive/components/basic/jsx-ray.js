import Morph from 'src/components/widgets/lively-morph.js';
import * as cop from "src/client/ContextJS/src/contextjs.js";
import events from "src/client/morphic/events.js";
import boundEval from "src/client/bound-eval.js";

export default class JsxRay extends Morph {
  async initialize() {
    lively.warn('initialize')
    this.windowTitle = "JSX-Ray";

    this.livelyLoad2()
    
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
  
  showHighlight(element) {
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

  hoverElement(element, evt) {
    this.nodeAncestryList.buildElementListFor(element);
  }
  
  selectElement(element) {
    lively.showHalo(element);
  }
  
  unhoverElement() {
    this.nodeAncestryList.hide();
    this.hideHighlight();
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

    if (subject.elementMetaData) {
      mirrorElement.classList.add('element-meta-data');

      if (subject.elementMetaData.jsx) {
        mirrorElement.classList.add('jsx');
      }

      if (subject.elementMetaData.aexpr) {
        mirrorElement.classList.add('renders-active-expression');
      }

      if (subject.elementMetaData.activeGroup) {
        mirrorElement.classList.add('renders-active-group-item');
      }
    }

    mirrorElement.updatePosition = () => {
      const bounds = lively.getClientBounds(subject)
      lively.setClientPosition(mirrorElement, bounds.topLeft())
      lively.setExtent(mirrorElement, bounds.extent())      
    }

    mirrorElement.addEventListener("mousemove", evt => {
      this.hoverElement(subject, evt)
    })

    mirrorElement.addEventListener("mouseout", evt => {
      if (evt.ctrlKey) {
        this.unhoverElement();
      }
    })
        
    mirrorElement.addEventListener("click", evt => {
      this.hoverElement(subject, evt);
      this.selectElement(subject);
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

    lively.warn('reset')
    this.nodeAncestryList.isMetaNode = true
    this.nodeAncestryList.init(this)
    
    this.ajustRootPosition()
    this.updateWorld()
  }

  ajustRootPosition() {
    const extent = lively.getPosition(this.handle).maxPt(lively.pt(200,200))
    lively.setPosition(this.handle, extent)

    lively.setClientPosition(this.world, lively.getClientPosition(document.body))
    lively.setExtent(this.frame, extent)

    lively.setExtent(this.frameHandlesLeft, lively.pt(10,extent.y + 20))

    var barHeight = extent.y + 20
    lively.setExtent(this.frameHandlesLeft, lively.pt(20, barHeight))
    lively.setPosition(this.frameHandlesLeftLabel, lively.pt(0, barHeight - 10))
}

  livelyLoad2() {
    this.cop = cop;
    this.events = events;
    
    this.nodeFilterFunc = node => node.elementMetaData; // ea.tagName && ea.tagName.match(/-/)
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
    var pos = lively.getClientPosition(div)

    this.world.appendChild(div)
    if (pos.x == 0 && pos.y == 0) { // keyboard events... etc.
      lively.setClientPosition(div, lively.getClientPosition(obj))
    } else {
      lively.setClientPosition(div, pos)
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
                var pos = lively.getClientPosition(div)
                mirrorElement.appendChild(div)
                console.log("evt", evt, "pos", pos)
                if (pos.x == 0 && pos.y == 0){ // keyboard events... etc.
                  lively.setPosition(div, lively.pt(0, 20 * (counter++ % 40)))
                } else {
                  lively.setClientPosition(div, pos)
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
    this.stopAll();
    
    this.nodeFilter.value = other.nodeFilter.value;
    this.eventFilter.value = other.eventFilter.value;

    lively.setPosition(this.handle, lively.getPosition(other.handle));
    this.ajustRootPosition();
  }
  
  livelyInspect(contentNode, inspector) {
  }
  
  livelyPrepareSave() {
  }
  
  async livelyExample() {
  }
}