'enable aexpr';

import _ from 'src/external/lodash/lodash.js';
import { DiffDOM } from 'src/external/diffDom.js';
import Morph from 'src/components/widgets/lively-morph.js';

export default class ReactiveMorph extends Morph {
  
  /* properties */
  get aexpr() { 
    return this._aexpr || (this._aexpr = { untagged: [] });
  }
  
  get diffDom() {
    return this._diffDom || (this._diffDom = new DiffDOM({
      filterOuterDiff: (t1, t2) => this.filterOuterDiff(t1, t2)
    }));
  }
  
  get props() {
    return this._props || (this._props = {});
  }

  /* component lifecycle */
  connectedCallback() {
    if(this.isDummy()) return Promise.resolve();
    return this.hookRender();
  }

  disconnectedCallback() {
    this.disposeAExpr();
  }
 
  /* form binding */
  registerForms() {
    this.register('form', 'submit');
  }
  
  registerButtons() {
    this.register(':not(form):not(fieldset) > button', 'click');
  }
  
  register(query, eventListenerType) {
    Array.from((this.shadowRoot || this).querySelectorAll(query)).forEach(node => {
      var name = node.id;
      if (name) {
        var funcName = name.replace(/^./, c => 'on'+ c.toUpperCase());
        if (this[funcName] instanceof Function) {
          node.removeEventListener(eventListenerType, this[funcName]);
          this[funcName] = this[funcName].bind(this);
          node.addEventListener(eventListenerType, this[funcName]);
        }
      }
    });
  }

  /* Render */  
  hookRender() {
    this.addAExpr(aexpr(() => this._render())
                  .onChange(nextHtmlDocPromise => 
                        Promise.resolve(nextHtmlDocPromise)
                          .then(htmlDoc => this.lastResolvedRender = htmlDoc)));
    this.addAExpr(aexpr(() => this.lastResolvedRender)
                  .onChange((nextHtmlDoc, { lastValue: prevHtmlDoc }) => {
      if ((nextHtmlDoc && nextHtmlDoc.outerHTML) !== (prevHtmlDoc && prevHtmlDoc.outerHTML)) {
        this.differentialUpdate(nextHtmlDoc);
        this.registerButtons();
        this.registerForms();
      } else if (this.tagName !== 'LINK-RP19' && nextHtmlDoc && prevHtmlDoc)
         this.assignProperties(nextHtmlDoc, this.shadowRoot ? this.get('#root') : this.lastChild, true);
    }));
    return Promise
      .resolve(this._render())
      .then(nextHtmlDoc => this.lastResolvedRender = nextHtmlDoc)
      .then(htmlDoc => this.differentialUpdate(htmlDoc))
      .then(() => {
        this.registerButtons();
        this.registerForms();
      });
  }

  differentialUpdate(nextHtmlDoc) {
    if (this.shadowRoot)
      this.differentialUpdateOnShadowRoot(nextHtmlDoc);
    else
      this.differentialUpdateOnThis(nextHtmlDoc);
  }

  differentialUpdateOnThis(nextHtmlDoc) {
    const clone = this.cloneNode();
    clone.appendChild(nextHtmlDoc || document.createTextNode(''));
    const diff = this.diffDom.diff(this, clone);
    if (diff.length && this.diffDom.apply(this, diff) && nextHtmlDoc)
      this.assignProperties(nextHtmlDoc, this.lastChild);
  }

  differentialUpdateOnShadowRoot(nextHtmlDoc) {
    const root = this.get('#root');
    if (!root) throw Error('DIV with id "root" is missing!');
    const wrapped = (
      <div id='root'>
        { nextHtmlDoc || '' }
      </div>
    );
    const diff = this.diffDom.diff(root, wrapped);
    if(diff.length && this.diffDom.apply(root, diff))
      this.assignProperties(wrapped, root);
  }

  assignProperties(from, to, webComponentsOnly = false) {
    const includeNative = ['onclick', 'onkeydown', 'onblur', '_props'];
    // const excludeNative = ['elementMetaData', '_aexpr', '_lively4created', '_diffDom'];
    // const keysToCopy = [..._.difference(_.keys(from), excludeNative), ...includeNative];
    if (!webComponentsOnly || from.tagName.includes('-'))
      _.forEach(includeNative, key =>
        to[key] = from[key]);
    if (from.tagName === 'ROUTER-RP19' || !from.tagName.includes('-'))
      _.zip([...from.children], [...to.children])
        .forEach(([f, t]) => f && t && this.assignProperties(f, t));
  }
  
  render() { return (<div />); } 
  
  _render() {
    return Promise.resolve(this.render())
            .then(htmlDoc => this.mapFalseToEmptyString(htmlDoc))
  }
  
  mapFalseToEmptyString(htmlDoc) {
    if (!htmlDoc || !htmlDoc.nodeType) return htmlDoc;
    if (htmlDoc.nodeType === Node.TEXT_NODE && this.isFalse(htmlDoc.textContent))
      htmlDoc.remove();
    else
      _([...htmlDoc.childNodes]).forEach(child =>
        this.mapFalseToEmptyString(child));
    return htmlDoc;
  }
  
  /* DiffDOM */ 
  filterOuterDiff(t1, t2) {
    if (t1.nodeName === 'TEXTAREA')
      t2.value = t1.value;
    if (t1.nodeName === 'LINK-RP19') return;
    if (t1.nodeName === t2.nodeName && 
        t1.nodeName !== this.tagName &&
        t1.nodeName.includes('-')) {
      t1.innerDone = true;
    }
  }
  
  /* conditionals */
  isDummy(node = this) {
    return !!node.parentNode && (
      node.parentNode.getAttribute('id') === 'livelySpawnArea' || 
      node.parentNode.tagName === 'ROUTER-RP19'
    )
  }
  
  isFalse(value) {
    return !value || 
      value === 'undefined' || 
      value === 'false' || 
      value === 'null';
  }
  
  /* aexpr helper */
  addAExpr(aexpr, group) {
    if (group && !_.has(this.aexpr, group)) 
      this.aexpr[group] = [];
    this.aexpr[group || 'untagged'].push(aexpr);
  }
  
  disposeAExpr(group) {
    const toDispose = group ? this.aexpr[group] || [] : _.flatten(_.values(this.aexpr));
    toDispose.forEach(aexpr => aexpr.dispose())
  }
}