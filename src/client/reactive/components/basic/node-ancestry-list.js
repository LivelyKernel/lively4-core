"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';

export default class NodeAncestryList extends Morph {
  async initialize() {
    this.windowTitle = "NodeAncestryList";

    this.isMetaNode = true
    this.parentElements.isMetaNode = true
    this.sourceEditor.isMetaNode = true
    
    lively.setExtent(this.sourceEditor, lively.pt(600,150))
    lively.setPosition(this.sourceEditor, lively.pt(0,200))
    this.sourceEditor.hideToolbar();
  }
  
  init(jsxRay) {
    this.jsxRay = jsxRay;
  }
  
  get parentElements() { return this.get('#parentElements'); }
  get sourceEditor() { return this.get('#sourceEditor'); }

  openBrowserForElementOrigin(ele) {
    if (ele.elementMetaData && ele.elementMetaData.sourceLocation) {
      const srcRange = ele.elementMetaData.sourceLocation;
      lively.success('open!!');
      lively.openBrowser(srcRange, true, srcRange);
    } else {
      lively.warn('no source');
    }
  }
  buildElementListFor(element) {

    this.parentElements.style.display = 'block';
    this.parentElements.innerHTML = '';
    
    this.parentListElementByElement = new Map();
    this.elementByParentListElement = new Map();
    
    [element, ...lively.allParents(element, [], true)]
      .reverse()
      .filter(ele => !(ele instanceof ShadowRoot))
      .forEach(ele => {
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
        if (ele.elementMetaData) {
          jsxCSSClass = 'element-meta-data ';

          if (ele.elementMetaData.jsx) {
            jsxCSSClass += 'jsx ';
          }

          if (ele.elementMetaData.aexpr) {
            jsxCSSClass += 'active-expression ';
          }

          if (ele.elementMetaData.activeGroup) {
            jsxCSSClass += 'active-group-item ';
          }
        }
      
        const clickHandler = evt => {
          if (evt.shiftKey || evt.ctrlKey) {
            this.openBrowserForElementOrigin(ele);
          } else {
            this.jsxRay.selectElement(ele);
          }
        }

        const container = <div mouseenter={evt => {
          this.innerSelect(ele)
          this.selectElementForParentElementsList(ele)
        }} click={clickHandler} class={jsxCSSClass}>{entry}</div>;
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
  
  innerSelect(element) {
    this.jsxRay.showHighlight(element);
    this.buildEditorFor(element);
  }
  
  positionRightOf(anchor, element, offset = lively.pt(0, 0)) {
    const toolsOrigin = lively.getTotalClientBounds(anchor)
    let rightCenter = toolsOrigin.rightCenter()
    rightCenter = rightCenter.addPt(offset)
    rightCenter = rightCenter.subPt(lively.pt(0, lively.getExtent(element).y / 2))
    lively.setClientPosition(element, rightCenter)
  }
  
  async buildEditorFor(element) {
    if (element.elementMetaData) {
      const location = element.elementMetaData.sourceLocation;
      
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

      // this case is for finding locations of web components
      // it currently results in rendering issues by the browser, wierd issues O_o?
//     } else if (element.localName.includes('-')) {
//       const fileName = await lively.components.searchTemplateFilename(element.localName + '.js');

//       if (!fileName) {
//         this.sourceEditor.style.display = 'none';
//         return;
//       }
//       if (fileName !== this.sourceEditor.getURLString()) {
//         this.sourceEditor.setURL(fileName);
//         await this.sourceEditor.loadFile();
//       }
        
//       this.sourceEditor.style.display = 'block';

//       this.sourceEditor.currentEditor().scrollIntoView({
//         line: 0,
//         ch: 0
//       }, 50);

    } else {
      this.sourceEditor.style.display = 'none';
    }

    this.positionRightOf(this.parentElements, this.sourceEditor, lively.pt(5,   0));
  }
  
  hide() {
    this.sourceEditor.style.display = 'none';
    this.parentElements.style.display = 'none';
  }

}