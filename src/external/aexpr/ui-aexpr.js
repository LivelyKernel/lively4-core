import { checkTicking as check } from "aexpr-ticking";

const UI_AEXPRS = new Set();
const METADATA_BY_AEXPR = new Map();

// #TODO: refactor this mess
function clearUnusedListenersAndAExprs() {
  Array.from(METADATA_BY_AEXPR).forEach(([aexpr, metadata]) => {
    // each listener handles one DOM node, check if that DOM node is detached from the DOM
    Array.from(metadata)
      .filter(listenerData => listenerData.nodeDetachedFromDOM())
      // if so, remove that listener
      .forEach(listenerData => {
        aexpr.offChange(listenerData.updateCallback);
        metadata.delete(listenerData);
        //lively.notify("DETACHED CALLBACK", "no longer in DOM", undefined, undefined, "yellow");
      });
    // was the last ui-callback removed from the aexpr?
    if(metadata.size === 0) {
      //lively.notify("DELETED AEXPR", "no callbacks", undefined, undefined, "yellow");
      UI_AEXPRS.delete(aexpr);
      METADATA_BY_AEXPR.delete(aexpr);
    }
  });
}

// update UI once per frame
let checkRequest;
function checkUIAExprs() {
  check(UI_AEXPRS);
  clearUnusedListenersAndAExprs()
  checkRequest = requestAnimationFrame(checkUIAExprs);
}
checkRequest = requestAnimationFrame(checkUIAExprs);

// `this` is an ActiveExpression 
export function toDOMNode(builder = x => x) {
  this.enabled = true; // have to do this to enable ticking check
  UI_AEXPRS.add(this);

  let currentNode = builder(this.getCurrentValue());

  function updateDOMNode(val) {
    // lively.notify("change aexpr result", val)
    const newNode = builder(val);
    currentNode.replaceWith(newNode);
    currentNode = newNode;
  };
  
  this.onChange(updateDOMNode);

  if(!METADATA_BY_AEXPR.has(this)) {
    METADATA_BY_AEXPR.set(this, new Set());
  }
  METADATA_BY_AEXPR.get(this).add({
    updateCallback: updateDOMNode,
    nodeDetachedFromDOM: () => currentNode.getRootNode({composed:true}) !== document
  });
  
  // () => {
  //   if(!document.body.contains(currentNode)) { 
  //     this.offChange(updateDOMNode);
  //     return true;
  //   }
  //   return false;
  // }
  
  return currentNode;
}

export function __unload__() {
  cancelAnimationFrame(checkRequest);
  // lively.notify("unload module", "UI AEXPR", undefined, null, "red");
}
