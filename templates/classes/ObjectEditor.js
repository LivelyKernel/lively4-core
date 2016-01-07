'use strict'

import Morph from './Morph.js';
import generateUUID from '../../src/client/uuid.js';

export default class ObjectEditor extends Morph {
  /*
   * HTMLElement callbacks
   */
  attachedCallback() {
    console.log('editor attachedCallback!');
    this.attached = true;

    this.propertyList = this.shadowRoot.querySelector('#property-list');
    this.editor = this.shadowRoot.querySelector('#editor');
    this.addButton = this.shadowRoot.querySelector('#add-script');
    this.removeButton = this.shadowRoot.querySelector('#remove-script');
    this.saveButton = this.shadowRoot.querySelector('#save-script');
    this.attributesLeaf = this.shadowRoot.querySelector('#attributes-leaf');
    this.propertiesLeaf = this.shadowRoot.querySelector('#properties-leaf');
    this.attributesMap = this.shadowRoot.querySelector('#attributesMap');
    this.attributesContent = this.shadowRoot.querySelector('#attributesContent');
    this.propertiesMap = this.shadowRoot.querySelector('#propertiesMap');
    this.propertiesContent = this.shadowRoot.querySelector('#propertiesContent');
    this.tabView = this.shadowRoot.querySelector('#tabView');

    this.propertyList.addEventListener('change', (e) => { this.listChanged(e) });
    this.addButton.addEventListener('click', (e) => { this.addButtonClicked(e) });
    this.removeButton.addEventListener('click', (e) => { this.removeButtonClicked(e) });
    this.saveButton.addEventListener('click', (e) => { this.saveButtonClicked(e) });

    this.attributesMap.addEventListener('commit', (e) => { this.attributeChanged(e) });

    this.tabView.addEventListener('tabChange', (e) => {
      console.log("event", e);
      switch(e.detail.id) {
        case("scriptsContent"):
          break;
        case("attributesContent"):
          this.showAttributes();
          break;
        case("propertiesContent"):
          this.showProperties();
          break;
        default:
          //
      }
    });

    this.render();

    for (let i = 0; i < this.attributes.length; i++) {
      var attribute = this.attributes[i];
      console.log('Initializing attribute ' + attribute);

      this.attributeChangedCallback(attribute.name, null, attribute.value);
    }
  }

  detachedCallback() {
    this.attached = false;

    console.log('editor detachedCallback');
    if (this.targetElement) {
      this.releaseTarget();
    }
  }

  attributeChangedCallback(attrName, oldValue, newValue) {
    console.log('Attribute changed ' + attrName);

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

    console.log(this.scriptsObserver);

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
    console.log(changes);
    this.updateAttributes();
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
    console.log('editor render!');
    if (!this.attached) {
      return;
    }

    this.updateList();
  }

  showAttributes() {
    console.log("attr clicked");

    if (!this.targetElement) {
      return;
    }

    let attributes = {};
    for (let i = 0; i < this.targetElement.attributes.length; i++) {
      attributes[this.targetElement.attributes[i].name] = this.targetElement.attributes[i].value;
    }
    this.shadowRoot.querySelector("#attributesMap").map = attributes;
  }
  showProperties() {
    console.log("prop clicked");

    if (!this.targetElement) {
      return;
    }

    let editableProperties = [
      "dir",
      "draggable",
      "hidden",
      "lang",

      "offsetHeight",
      "offsetWidth",
      "offsetParent",
      "offsetTop",
      "offsetLeft",

      "clientHeight",
      "clientLeft",
      "clientTop",
      "clientWidth",

      "style",
      "tabIndex",

      "innerHTML",
      "outerHTML",
      "value",

      "scrollTop",
      "scrollLeft",
    ];

    let properties = {};
    for(let i = 0; i < editableProperties.length; i++) {
      let propertyName = editableProperties[i];
      properties[propertyName] = this.targetElement[propertyName];
    }

    this.propertiesMap.map = properties;
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
      } else if (typeof data['attributeName'] !== 'undefined') {
        this.saveAttribute(data['attributeName']);
      }
    }
  }

  listChanged(e) {
    if (this.propertyList.activeLeaf !== null) {
      let data = this.propertyList.activeLeaf.dataset;

      if (typeof data['scriptName'] !== 'undefined') {
        this.loadScript(data['scriptName']);
      } else if (typeof data['attributeName'] !== 'undefined') {
        this.loadAttribute(data['attributeName']);
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
    this.shadowRoot.querySelector('#editor').value = this.targetElement.__scripts__[scriptName];
  }
  loadAttribute(attributeName) {
    this.editor.value = this.targetElement.attributes[attributeName].value;
  }

  saveAttribute(attributeName) {
    this.targetElement.setAttribute(attributeName, this.editor.value);
  }

  updateList() {
    this.updateScripts();
    this.updateAttributes();
    // this.updateProperties();
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
  updateAttributes() {
    return;
    var activeLeaf = null;
    if (this.propertyList.activeLeaf) {
      let activeLeafData = this.propertyList.activeLeaf.dataset;
      if(activeLeafData.attributeName)
        activeLeaf = activeLeafData.attributeName;
    }

    let html = '';
    if (this.targetElement) {
      for (let i = 0; i < this.targetElement.attributes.length; i++) {
        let attr = this.targetElement.attributes[i];
        let isActive = attr.name == activeLeaf;
        html += '<li><span class="leaf' + (isActive ? ' active' : '') + '" data-attribute-name="' + attr.name + '">' + attr.name + '</span></li>';
      }
    }
    this.shadowRoot.querySelector('#attribute-nodes').innerHTML = html;
  }

  attributeChanged(e) {
    let attribute = e.detail;

    this.targetElement.setAttribute(attribute.key, attribute.value);
  }

  propertyChanged(e) {
    let property = e.detail;

    console.log("Property changed: " + property);
  }
}
