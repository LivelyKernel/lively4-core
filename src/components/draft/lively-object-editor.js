'use strict';

import Morph from 'src/components/widgets/lively-morph.js';
import { uuid as generateUUID } from 'utils';
import scriptManager from  "src/client/script-manager.js";

export default class ObjectEditor extends Morph {
  initialize() {
    // this.getSubmorph("#editor").changeMode("javascript");
    var codeEditor = this.shadowRoot.querySelector('lively-code-mirror');
    // codeEditor.enableAutocompletion();
    
      
    codeEditor.doSave = text => {
      this.onSave()
    }
    
  }

  /*
   * HTMLElement callbacks
   */
  attachedCallback() {
    this.attached = true;

    this.saveElementReferences();
    this.addElementEvents();

    // this.render();

    // this.initializeAttributes();
  }

  detachedCallback() {
    this.attached = false;

    if (this.targetElement) {
      this.releaseTarget();
    }
  }

  attributeChangedCallback(attrName, oldValue, newValue) {
    switch(attrName) {
      case 'target':
        var selector = newValue, element  = null;

        if(!selector) {
          break;
        }

        // target attribute changed, find new target element
        if (selector[0] === '$') {
          this.targetElement = document.querySelector('[data-lively-id="' + selector.substr(1) + '"]');
        } else {
          this.targetElement = document.querySelector(selector);
        }

        break;
    }
  }

  /*
   * ObjectEditor methods
   */
  saveElementReferences() {
    this.propertyList = this.get('#property-list');
    this.editor = this.get('#editor');
  }

  addElementEvents() {
    this.propertyList.addEventListener('change', (e) => { this.listChanged(e) });
    this.get('#add-script').addEventListener('click', (e) => { this.addButtonClicked(e) });
    this.get('#remove-script').addEventListener('click', (e) => { this.removeButtonClicked(e) });
    this.get('#save-script').addEventListener('click', (e) => { this.onSave(e) });
    this.get('#run-script').addEventListener('click', (e) => { this.runButtonClicked(e) });
    
    
    // this.editor.addEventListener('keydown', (e) => { this.editorKeyDown(e) });
  }

  initializeAttributes() {
    for (let i = 0; i < this.attributes.length; i++) {
      var attribute = this.attributes[i];

      this.attributeChangedCallback(attribute.name, null, attribute.value);
    }
  }

  // Target element
  get targetElement() {
    return this._targetElement;
  }

  set targetElement(val) {
    if(val == this.targetElement) {
      return;
    }

    if (this.targetElement) {
      this.releaseTarget();
    }

    this._targetElement = val;
    this.render();

    if (typeof this.targetElement.__scripts__ === 'undefined') {
      this.targetElement.__scripts__ = {};
    }

    lively.ensureID(this.targetElement)

    this.createObservers();
    
    this.shadowRoot.querySelector("#editor").doitContext = val
  }

  releaseTarget() {
    if(!this.targetElement) {
      return;
    }

    this.destroyObservers();
    this.destroyUUID();
  }

  /*
   * Observers for attributes, scripts, etc.
   */
  createObservers() {
    // NOTE: We need to wait for Google to bring Proxy to V8
    // if (this.targetElement.__scripts__) {
    //   this.scriptsObserver = new MutationObserver((changes) => { this.scriptsObserver(changes) });
    //   this.scriptsObserver.observe(this.targetElement.__scripts__, {
    //     attributes: true
    //   });      
    // }

    // this.domObserver = new MutationObserver((changes) => { this.attributesObserver(changes) });
    // this.domObserver.observe(this.targetElement, {
    //   attributes: true
    // });
  }

  destroyObservers() {
    if (this.domObserver) this.domObserver.disconnect(); // #TODO why is that sometimes not initialized ?
  }

  // attributesObserver(changes) {
  //   this.showAttributes();
  // }

  scriptsObserver(changes) {
    this.updateScripts();
  }

  destroyUUID() {
    var uuid = this.targetElement.dataset.livelyId;
    if(!uuid) {
      return;
    }

    var expectedTargetCount = this.attached ? 1 : 0;

    if(document.querySelectorAll('[target="$' + uuid + '"]').length > expectedTargetCount) {
      return;
    }

    delete this.targetElement.dataset.livelyId;
  }

  render() {
    if (!this.attached) {
      return;
    }

    this.updateList();
    this.setWindowTitle();
  }

  setWindowTitle() {
    if(!this.targetElement) return;
    if(this.parentElement.tagName != 'LIVELY-WINDOW') {
      // parent is not a window, so cannot set title
      return;
    }

    let windowElement = this.parentElement;
    let title = '';

    if (this.targetElement.name) {
        title = this.targetElement.name;
    } else if (this.targetElement.id) {
        title = '#'+ this.targetElement.id;
    }

    title += ' <small>' + this.targetElement.tagName.toLowerCase() + '</small>';

    windowElement.setAttribute('title', title);
  }

  /* 
   * Attributes Tab
   */
  showAttributes() {
    if (!this.targetElement) {
      return;
    }

    let attributes = {};
    for (let i = 0; i < this.targetElement.attributes.length; i++) {
      attributes[this.targetElement.attributes[i].name] = this.targetElement.attributes[i].value;
    }
    this.shadowRoot.querySelector("#attributesMap").map = attributes;
  }

  saveAttribute(data, source) {
    let attributeName = data['attributeName']
    this.targetElement.setAttribute(attributeName, source);
  }

  attributeChanged(e) {
    let attribute = e.detail;

    this.targetElement.setAttribute(attribute.key, attribute.value);
  }

  /*
   * Properties Tab
   */
  showProperties() {
    if (!this.targetElement) {
      return;
    }

    let editableProperties = [
      { name: 'dir', type: 'string', readonly: true },
      { name: 'lang', type: 'string' },
      { name: 'className', type: 'string' },
      { name: 'contentEditable', type: 'string' },
      { name: 'id', type: 'string' },

      { name: 'offsetHeight', type: 'number', readonly: true },
      { name: 'offsetWidth', type: 'number', readonly: true },
      { name: 'offsetTop', type: 'number', readonly: true },
      { name: 'offsetLeft', type: 'number', readonly: true },

      { name: 'clientHeight', type: 'number', readonly: true },
      { name: 'clientLeft', type: 'number', readonly: true },
      { name: 'clientTop', type: 'number', readonly: true },
      { name: 'clientWidth', type: 'number', readonly: true },

      { name: 'tabIndex', type: 'number' },

      { name: 'innerHTML', type: 'string' },
      { name: 'outerHTML', type: 'string', readonly: true },
      { name: 'value', type: 'string' },
      { name: 'title', type: 'string' },
      { name: 'tagName', type: 'string', readonly: true },

      { name: 'scrollTop', type: 'number' },
      { name: 'scrollLeft', type: 'number' }
    ];
    
    Object.keys(this.targetElement).forEach( ea => {
      if (ea.match(/^__/)) return;
      var readonly = true;
      var propType = typeof this.targetElement[ea]
      if (propType == "function") return
      if (propType == "string" || propType == "number") readonly = false;
      editableProperties.push({name: ea, type: propType, readonly: readonly})
    })
    

    let properties = {};
    for (let i = 0; i < editableProperties.length; i++) {
      let property = editableProperties[i];
      properties[property.name] = {
        value: this.targetElement[property.name],
        type: property.type,
        readonly: property.readonly
      }
    }

    this.propertiesMap.map = properties;
  }

  propertyChanged(e) {
    let property = e.detail;

    this.targetElement[property.key] = property.value;
  }

  addPropertyButtonClicked(e) {
    if (!this.targetElement) {
      return;
    }

    var propertyName = window.prompt('Please enter the name of the property', '');
    if (!propertyName || propertyName.length == 0) {
      return;
    }

    var propertyValue = window.prompt('Please enter the (new) value', '');
    if (!propertyValue || propertyValue.length == 0) {
      return;
    }

    this.targetElement[propertyName] = propertyValue;

    this.showProperties();
  }

  addAttributeButtonClicked(e) {
    if (!this.targetElement) {
      return;
    }

    var attributeName = window.prompt('Please enter the name of the attribute', '');
    if (!attributeName || attributeName.length == 0) {
      return;
    }

    var attributeValue = window.prompt('Please enter the (new) value', '');
    if (!attributeValue || attributeValue.length == 0) {
      return;
    }

    this.targetElement.setAttribute(attributeName, attributeValue);
  }

  /*
   * Connections Tab
   */
  showConnections() {
    if (!this.targetElement) {
      return;
    }
    if (!this.targetElement.__connections__) {
      this.targetElement.__connections__ = [];
    }

    let values = '';
    this.targetElement.__connections__.forEach(function(conn) {
      values += '<option>' + conn.name + '</option>';
    });

    this.connectionList.innerHTML = values;
  }

  addConnectionButtonClicked(e) {
    if (!this.targetElement) {
      return;
    }
    if (!this.targetElement.__connections__) {
      this.targetElement.__connections__ = [];
    }

    var eventName = window.prompt('Please enter the event to be connected', '');
    if (!eventName || eventName.length == 0) {
      return;
    }

    var scriptName = window.prompt('Please enter the name of the script to be executed', '');
    if (!scriptName || scriptName.length == 0) {
      return;
    }

    if (typeof this.targetElement[scriptName] === 'undefined') {
      alert('Could not find that script on the target element!');
      return;
    }

    // connect it
    var target = this.targetElement;
    var listener = function(e) {
      target[scriptName](e);
    };

    this.targetElement.addEventListener(eventName, listener);
    this.targetElement.__connections__.push({
      eventName: eventName,
      listener: listener,
      name: eventName + ' >> ' + scriptName
    });

    this.showConnections();
  }

  removeConnectionButtonClicked(e) {
    if (!this.targetElement) {
      return;
    }
    if (!this.targetElement.__connections__) {
      this.targetElement.__connections__ = [];
    }

    if (this.connectionList.selectedIndex < 0) {
      return;
    }

    let removedConnection = this.targetElement.__connections__[this.connectionList.selectedIndex];
    this.targetElement.removeEventListener(removedConnection.eventName, removedConnection.listener);
    this.targetElement.__connections__.splice(this.connectionList.selectedIndex);

    this.showConnections();
  }

  /*
   * Scripts Tab
   */
  addButtonClicked(e) {
    if (!this.targetElement) {
      return;
    }

    if (typeof this.targetElement.__scripts__ === 'undefined') {
      this.targetElement.__scripts__ = {};
    }

    var scriptName = "methodName"
    if (!scriptName || scriptName.length <= 0) {
      return;
    }

    if (typeof this.targetElement.__scripts__[scriptName] !== 'undefined') {
      alert('Script name already in use.');
      return;
    }

    ///this.addEmptyScript(scriptName);
    var source = 'function ' + scriptName + '() {\n  \n}'
    this.get("#editor").value = source
    this.get("#editor").editor.setSelection({line: 0, ch: 9 }, {line: 0, ch: 9 + scriptName.length})
    this.get("#editor").focus()
  }
  
  addEmptyScript(scriptName) {
    this.addScript(scriptName, 'function ' + scriptName + '() {\n  \n}')
  }

  addScript(scriptName, funcOrString) {
    scriptManager.addScript(this.targetElement, funcOrString, {name: scriptName});
    this.updateScripts();
    this.propertyList.selectLeaf(this.propertyList.querySelector('.leaf[data-script-name="'+scriptName+'"]'));
    this.listChanged();
  }

  removeButtonClicked(e) {
    if (this.targetElement) {
      if (this.propertyList.activeLeaf !== null) {
        let scriptName = this.propertyList.activeLeaf.dataset['scriptName'];
        scriptManager.removeScript(this.targetElement, scriptName);
      }
      this.editor.value = '';
      this.updateScripts();
    }
  }

  isScriptData(data) {
    return typeof data['scriptName'] !== 'undefined'
  }
  
  isAttributeData(data) {
    return typeof data['attributeName'] !== 'undefined'
  }

  

  hideErrorBorder() {
    this.get('lively-code-mirror').style.border = ""
  }

  showErrorBorder() {
    this.get('lively-code-mirror').style.border = "2px solid red"
  }
  

  onSave(e) {
    if (!this.targetElement) return;
    let source = this.editor.value;
    let m = source.match(/^(?:async +)?function +([a-zA-Z][a-zA-Z0-9$_]+) *\(/)
    var scriptName = m && m[1]
    this.hideErrorBorder()
    if (!scriptName) {
      lively.notify("[ObjectEditor] Could not save", source)  
      this.showErrorBorder()
      return 
    }
    if (this.propertyList.activeLeaf !== null) {
      let data = this.propertyList.activeLeaf.dataset;
      
      if (this.isScriptData(data)) {
        if (scriptName === data['scriptName']) {
          this.saveScript(data, source);
        } else {
          try {
            this.addScript(scriptName, source)  
          } catch(e) {
            lively.notify("Could not save " + scriptName, e) 
            this.showErrorBorder()

          }
        }
      } else if (this.isAttributeData(data)) {
        this.saveAttribute(data, source);
      }
    } else {
      if(scriptName) {
        debugger
        this.addScript(scriptName, source)
        lively.notify("[ObjectEditor] added new script " + scriptName)
      } else {
      // #here go the new attributes?
      lively.notify("[ObjectEditor] Could not save.")
      this.showErrorBorder()
      }
    }
  }
  
  saveScript(data, source) {
    try {
      // #FEATURE can we parse it before to show better syntax errors?
      var functionObj = eval('(' + source + ')')
    } catch(e) {
      lively.notify("[ObjectEditor] Eror compiling script! ", 
        "" + e, 10, () => { lively.showError(e)}, "red")
      functionObj = source
      return
    }
    let scriptName =  data['scriptName']
    scriptManager.updateScript(
      this.targetElement,
      functionObj,
      { name: scriptName }
    );
    lively.notify("[ObjectEditor] Saved script " + scriptName, "", 2, null, "green" )
  }
  

  runButtonClicked(e) {
    if (this.targetElement && this.propertyList.activeLeaf !== null) {
      let data = this.propertyList.activeLeaf.dataset;
      let func = eval('(' + this.editor.value + ')');

      func.apply(this.targetElement);
    }
  }

  editorKeyDown(e) {
    if (e.metaKey && e.keyCode === 83) {
      this.onSave();
      e.preventDefault();
    }
  }

  listChanged(e) {
    if (this.propertyList.activeLeaf !== null) {
      let data = this.propertyList.activeLeaf.dataset;

      if (typeof data['scriptName'] !== 'undefined') {
        this.loadScript(data['scriptName']);
      }
    } else {
      this.editor.value = '';
    }
  }

  loadScript(scriptName) {
    if (typeof this.targetElement.__scripts__ === 'undefined' ||
      typeof this.targetElement.__scripts__[scriptName] === 'undefined') {
      return;
    }
    this.editor.value = this.targetElement.__scripts__[scriptName];
  }

  updateList() {
    this.updateScripts();
  }

  updateScripts() {
    var activeLeaf = null;
    // if (this.propertyList.activeLeaf) {
    //   let activeLeafData = this.propertyList.activeLeaf.dataset;
    //   if(activeLeafData.scriptName)
    //     activeLeaf = activeLeafData.scriptName;
    // }

    let scriptHtml = '';
    if (this.targetElement && typeof this.targetElement.__scripts__ !== 'undefined') {
      for (let scriptName in this.targetElement.__scripts__) {
        let isActive = scriptName == activeLeaf;
        scriptHtml += '<li class="leaf' + (isActive ? ' active' : '') + '" data-script-name="' + scriptName + '">' + scriptName + '</li>';
      }
    }
    this.shadowRoot.querySelector('#script-nodes').innerHTML = scriptHtml;
  }
  
  updateBackgroundColor() {
    console.log("update color")
    var color = this.shadowRoot.querySelector("#background-color").value;
    this.targetElement.style.backgroundColor = color;
  }
  
  livelyLoad() {
    // this.releaseTarget()
    // this.targetElement = that
    // var target = lively.elementByID(this.getAttribute("target"))
    // if (target) {
    //   this.targetElement = target
    // }
  }
  
  livelyMigrate(oldInstance) {
    this.targetElement = oldInstance.targetElement
    this.updateScripts()
  }
}