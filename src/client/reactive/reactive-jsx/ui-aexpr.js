import { PausableLoop } from 'utils';

const REMOVE_LISTENER_BY_CHECK_FUNCTION = new Map(); // nodeDetachedFromDOM -> removeListener

function removeObsoleteListeners() {
  Array.from(REMOVE_LISTENER_BY_CHECK_FUNCTION).forEach(([nodeDetachedFromDOM, removeListener]) => {
    if (nodeDetachedFromDOM()) {
      removeListener();
      REMOVE_LISTENER_BY_CHECK_FUNCTION.delete(nodeDetachedFromDOM);
    }
  });
  if (REMOVE_LISTENER_BY_CHECK_FUNCTION.size === 0) {
    removeLoop.pause();
  }
}

// `this` is an ActiveExpression 
export function toDOMNode(builder = x => x) {
  const { value } = this.evaluateToCurrentValue();
  let currentNode = builder(value);

  function updateDOMNode(val) {
    // lively.notify("change aexpr result", val)
    const newNode = builder(val);
    currentNode.replaceWith(newNode);
    currentNode = newNode;
  };

  function nodeDetachedFromDOM() {
    return currentNode.getRootNode({ composed: true }) !== document;
  }

  const removeListener = () => this.offChange(updateDOMNode);

  this.onChange(updateDOMNode);

  REMOVE_LISTENER_BY_CHECK_FUNCTION.set(nodeDetachedFromDOM, removeListener);
  removeLoop.ensureRunning();

  return currentNode;
}

const removeLoop = new PausableLoop(removeObsoleteListeners);

export function __unload__() {
  removeLoop.pause();
  //cancelAnimationFrame(checkRequest);
  // lively.notify("unload module", "UI AEXPR", undefined, null, "red");
}