'use strict'

import Morph from './Morph.js';
import generateUUID from '../../src/client/uuid.js';
import * as scriptManager from  "../../src/client/script-manager.js";

export default class ObjectEditor extends Morph {
  initialize() {
    this.getSubmorph("#editor").changeMode("javascript");
  }
  /*
   * HTMLElement callbacks
   */
  attachedCallback() {
    this.attached = true;

    this.saveElementReferences();
    this.addElementEvents();

    this.render();

    this.initializeAttributes();
  }

  saveElementReferences() {
    this.tabView = this.shadowRoot.querySelector('#tabView');

    this.propertyList = this.shadowRoot.querySelector('#property-list');
    this.editor = this.shadowRoot.querySelector('#editor');

    this.attributesMap = this.shadowRoot.querySelector('#attributesMap');
    this.attributesContent = this.shadowRoot.querySelector('#attributesContent');

    this.propertiesMap = this.shadowRoot.querySelector('#propertiesMap');
    this.propertiesContent = this.shadowRoot.querySelector('#propertiesContent');

    this.connectionsContent = this.shadowRoot.querySelector('#connectionsContent');

    this.addButton = this.shadowRoot.querySelector('#add-script');
    this.removeButton = this.shadowRoot.querySelector('#remove-script');
    this.saveButton = this.shadowRoot.querySelector('#save-script');
    this.runButton = this.shadowRoot.querySelector('#run-script');

    this.addConnectionButton = this.shadowRoot.querySelector('#addConnectionButton');
    this.removeConnectionButton = this.shadowRoot.querySelector('#removeConnectionButton');
    this.connectionList = this.shadowRoot.querySelector('#connectionList');

    this.addAttributeButton = this.shadowRoot.querySelector('#addAttributeButton');
    this.addPropertyButton = this.shadowRoot.querySelector('#addPropertyButton');
  }

  addElementEvents() {
    this.propertyList.addEventListener('change', (e) => { this.listChanged(e) });
    this.addButton.addEventListener('click', (e) => { this.addButtonClicked(e) });
    this.removeButton.addEventListener('click', (e) => { this.removeButtonClicked(e) });
    this.saveButton.addEventListener('click', (e) => { this.saveButtonClicked(e) });
    this.runButton.addEventListener('click', (e) => { this.runButtonClicked(e) });
    this.addConnectionButton.addEventListener('click', (e) => { this.addConnectionButtonClicked(e) });
    this.removeConnectionButton.addEventListener('click', (e) => { this.removeConnectionButtonClicked(e) });
    this.addPropertyButton.addEventListener('click', (e) => { this.addPropertyButtonClicked(e) });
    this.addAttributeButton.addEventListener('click', (e) => { this.addAttributeButtonClicked(e) });

    this.editor.addEventListener('keydown', (e) => { this.editorKeyDown(e) });

    this.attributesMap.addEventListener('commit', (e) => { this.attributeChanged(e) });
    this.propertiesMap.addEventListener('commit', (e) => { this.propertyChanged(e) });

    this.tabView.addEventListener('tabChange', (e) => {
      switch(e.detail.id) {
        case("scriptsContent"):
          break;
        case("attributesContent"):
          this.showAttributes();
          break;
        case("propertiesContent"):
          this.showProperties();
          break;
        case("connectionsContent"):
          this.showConnections();
          break;
        default:
          //
      }
    });
  }

  initializeAttributes() {
    for (let i = 0; i < this.attributes.length; i++) {
      var attribute = this.attributes[i];

      this.attributeChangedCallback(attribute.name, null, attribute.value);
    }
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
        var selector = newValue
        , element  = null;

        if(!selector) {
          break;
        }

        if (selector[0] === '$') {
          this.targetElement = document.querySelector('[data-lively-id="' + selector.substr(1) + '"]');
        } else {
          this.targetElement = document.querySelector(selector);
        }

        break;
      default:
        //
    }
  }

  // Target element
  get targetElement() {
    return this._targetElement;
  }

  set targetElement(val) {
    if(val == this.targetElement)
      return;

    console.log('new target element:', val);

    if (this.targetElement) {
      this.releaseTarget();
    }

    this._targetElement = val;
    this.render();

    if (typeof this.targetElement.__scripts__ === 'undefined') {
      this.targetElement.__scripts__ = {};
    }

    if (!this.targetElement.dataset['livelyId']) {
      var uuid = generateUUID();

      $(this.targetElement).attr('data-lively-id', uuid);
      this.setAttribute('target', '$' + uuid);
    }

    this.createObservers();
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
    // this.scriptsObserver = new MutationObserver((changes) => { this.scriptsObserver(changes) });
    // this.scriptsObserver.observe(this.targetElement.__scripts__, {
    //   attributes: true
    // });

    this.domObserver = new MutationObserver((changes) => { this.attributesObserver(changes) });
    this.domObserver.observe(this.targetElement, {
      attributes: true
    });
  }

  destroyObservers() {
    // Object.unobserve(this.targetElement.__scripts__, this.scriptsObserverWrapper);
    // this.scriptsObserver.disconnect();
    this.domObserver.disconnect();
  }

  attributesObserver(changes) {
    this.showAttributes();
  }
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
    if(this.parentElement.tagName != 'LIVELY-WINDOW') {
      //parent is not a window, so cannot set title
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
  saveAttribute(attributeName) {
    this.targetElement.setAttribute(attributeName, this.editor.value);
  }
  attributeChanged(e) {
    let attribute = e.detail;

    this.targetElement.setAttribute(attribute.key, attribute.value);
  }

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

    let properties = {};
    for(let i = 0; i < editableProperties.length; i++) {
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
    console.log("Property changed: " + property);

    this.targetElement[property.key] = property.value;
  }

  addPropertyButtonClicked(e) {
    if (!this.targetElement) {
      return;
    }

    var propertyName = prompt('Please enter the name of the property', '');
    if (!propertyName || propertyName.length == 0) {
      return;
    }

    var propertyValue = prompt('Please enter the (new) value', '');
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

    var attributeName = prompt('Please enter the name of the attribute', '');
    if (!attributeName || attributeName.length == 0) {
      return;
    }

    var attributeValue = prompt('Please enter the (new) value', '');
    if (!attributeValue || attributeValue.length == 0) {
      return;
    }

    this.targetElement.setAttribute(attributeName, attributeValue);
  }

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

    var eventName = prompt('Please enter the event to be connected', '');
    if (!eventName || eventName.length == 0) {
      return;
    }

    var scriptName = prompt('Please enter the name of the script to be executed', '');
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
    console.log('removing connection', removedConnection);
    this.targetElement.removeEventListener(removedConnection.eventName, removedConnection.listener);
    this.targetElement.__connections__.splice(this.connectionList.selectedIndex);

    this.showConnections();
  }

  addButtonClicked(e) {
    if (!this.targetElement) {
      return;
    }

    if (typeof this.targetElement.__scripts__ === 'undefined') {
      this.targetElement.__scripts__ = {};
    }

    var scriptName = prompt('Please enter a new script name', '');
    if (!scriptName || scriptName.length <= 0) {
      return;
    }

    if (typeof this.targetElement.__scripts__[scriptName] !== 'undefined') {
      alert('Script name already in use.');
      return;
    }

    scriptManager.addScript(this.targetElement, eval('(function ' + scriptName + '() {\n  \n})'));
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

  saveButtonClicked(e) {
    if (this.targetElement && this.propertyList.activeLeaf !== null) {
      let data = this.propertyList.activeLeaf.dataset;

      if (typeof data['scriptName'] !== 'undefined') {
        scriptManager.updateScript(
          this.targetElement,
          eval('(' + this.editor.value + ')'),
          { name: data['scriptName'] }
        );
        console.log('saved!');
      } else if (typeof data['attributeName'] !== 'undefined') {
        this.saveAttribute(data['attributeName']);
      }
    }
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
      this.saveButtonClicked();
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
    if (this.propertyList.activeLeaf) {
      let activeLeafData = this.propertyList.activeLeaf.dataset;
      if(activeLeafData.scriptName)
        activeLeaf = activeLeafData.scriptName;
    }

    let scriptHtml = '';
    if (this.targetElement && typeof this.targetElement.__scripts__ !== 'undefined') {
      for (let scriptName in this.targetElement.__scripts__) {
        let isActive = scriptName == activeLeaf;
        scriptHtml += '<li><span class="leaf' + (isActive ? ' active' : '') + '" data-script-name="' + scriptName + '">' + scriptName + '</span></li>';
      }
    }
    this.shadowRoot.querySelector('#script-nodes').innerHTML = scriptHtml;
  }
}
