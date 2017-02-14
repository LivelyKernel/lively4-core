import {pt,rect} from '../graphics.js'

export function setPosition(node, pos) {
  node.style.left = '' + pos.x + 'px';
  node.style.top = '' + pos.y + 'px';
}

export function getPosition(node) {
  return pt(
    parseInt(node.style.left) || 0,
    parseInt(node.style.top) || 0)
}

export function getExtent(node) {
  return pt(
    parseInt(node.style.width) || 0,
    parseInt(node.style.height) || 0)
}

export function setExtent(node, extent) {
  node.style.width = '' + extent.x + 'px';
  node.style.height = '' + extent.y + 'px';
}

export function getBounds(node) {
  var pos = getPosition(node)
  return rect(pos, pos.addPt(getExtent(node)))
}

export function globalPosition(node) {
  var left = 0;
  var top = 0;
  while (node && node !== document.body) {
    left += node.offsetLeft;
    top += node.offsetTop;
    node = node.offsetParent;
  }
  return pt(left, top)
}
