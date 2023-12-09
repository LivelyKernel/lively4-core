"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import ComponentLoader from "src/client/morphic/component-loader.js";

import { Layer, proceed } from 'src/client/ContextJS/src/Layers.js';
import { AExprRegistry } from 'src/client/reactive/active-expression/ae-registry.js'
import * as cop from "src/client/ContextJS/src/contextjs.js"

lively.addEventListener('is online', window, 'offline', updateOnline)
lively.addEventListener('is online', window, 'online', updateOnline)

function isOfflineX() {
  return !navigator.onLine || self.__forceOffline__
}
function updateOnline() {
  self.__isOffline__ = isOfflineX()
}

export default class Cop22Demo extends Morph {
  async initialize() {
    this.windowTitle = "Layered Editor";
    lively.html.registerKeys(this);

    this.aexprs = new Set();
    
    this.initializeShadowRoot()
  }
  
  initializeShadowRoot() {
    this.registerButtons();
    
    this.aexprs.forEach(ae => ae.dispose());

    const isOnline = aexpr(() => !isOfflineX());
    this.aexprs.add(isOnline);
    isOnline.dataflow(online => {
      this.isOnlineText.innerHTML = online ? 'ONLINE' : 'OFFLINE'
    }
      );
    
    const forceOffline = aexpr(() => !self.__forceOffline__);
    this.aexprs.add(forceOffline);
    forceOffline.dataflow(online => {
      this.get('#go-offline').innerHTML = online ? 'force offline' : 'allow online'
    }
      );
    
    always: this.get('#label4').innerHTML = !self.__forceOffline__ ? 'A' : 'B';
    // cheeky way to get a handle in the signal's AE
    this.aexprs.add(AExprRegistry.allAsArray().last);
  }

  onSave(...args) {
    lively.success('base method')
  }

  get isOnlineText() {
    return this.get('#isOnline');
  }

  connectedCallback() {
    lively.success("%cEdge", "background: steelblue; border-right: 3px red solid; border-radius: 100px;", this);
  }

  disconnectedCallback() {
    this.aexprs.forEach(ae => ae.dispose());

    lively.warn('detached Edge');
  }

  onKeyDown(evt) {
    lively.notify("Key Down!" + evt.charCode);
  }

  onGoOffline() {
    self.__forceOffline__ = !self.__forceOffline__;
  }

  onMinusButton() {
    this.get("#textField").value = parseFloat(this.get("#textField").value) - 1;
  }

  /*MD ## Lively-specific API MD*/

  // store something that would be lost
  livelyPrepareSave() {
  }

  livelyPreMigrate() {
    // is called on the old object before the migration
  }

  livelyMigrate(other) {}

  async livelyExample() {}

  get livelyUpdateStrategy() {
    return 'inplace';
  }
  
  livelyUpdate() {
    this.shadowRoot.innerHTML = "";
    ComponentLoader.applyTemplate(this, this.localName);
    this.initializeShadowRoot();

    lively.showElement(this, 300);
  }

}

if (self.__offlineLayer__) {
  self.__offlineLayer__.clearActiveWhile();
  delete self.__offlineLayer__;
}

const ol = self.__offlineLayer__ = new Layer('Offline Layer');
ol.refineClass(Cop22Demo, {
  onSave(...args) {
    lively.warn('offline layer::save')
    proceed(...args)
  }
})

ol.activeWhile(() => isOfflineX());
ol.onActivate(() => lively.warn('went offline'));
ol.onDeactivate(() => lively.success('back online'));





















'HACK'