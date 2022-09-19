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
