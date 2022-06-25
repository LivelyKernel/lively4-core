export function getParentByTagName(element, tagName) {
  return lively.allParents(element, undefined, true).find(parent => parent && parent.tagName === tagName);
}

export function getEditor(element) {
  return getParentByTagName(element, 'OFFSET-MINI-EDITOR')
}

export function elementByID(id, context) {
  return lively.elementByID(id, context, false);
}

export function withAllChildren(element) {
  return [element, ...element.querySelectorAll('*')];
}

export function remove(item) {
  const index = this.indexOf(item);
  const hasItem = index > -1;
  if (hasItem) {
    this.splice(index, 1);
  }
  return hasItem;
}

function debounceRequestAnimationFrame(func) {
  if (typeof func != 'function') {
    throw new TypeError('FUNC_ERROR_TEXT');
  }

  let lastArgs;
  let lastThis;
  let timerId;

  function clearData() {
    lastArgs = lastThis = timerId = undefined;
  }

  function invokeFunc() {
    const args = lastArgs;
    const thisArg = lastThis;

    clearData();
    func.apply(thisArg, args);
  }

  function cancel() {
    if (timerId !== undefined) {
      cancelAnimationFrame(timerId);
    }
    clearData();
  }

  function debounced() {
    lastArgs = arguments;
    lastThis = this;

    if (timerId === undefined) {
      timerId = requestAnimationFrame(invokeFunc);
    }
  }
  
  debounced.cancel = cancel;
  return debounced;
}

export function debounceFrame(context, callback) {
  context = 'debounce$$' + context;
  // debouncedFrameId
  this[context] = this[context] || debounceRequestAnimationFrame(() => {
    delete this[context];
    callback();
  });
  this[context]();
}