export function setPosition(node, pos) {
  node.style.left = '' + pos.x + 'px';
  node.style.top = '' + pos.y + 'px';
}

export function globalPosition(node) {
  var left = 0;
  var top = 0;
  while (node && node !== document.body) {
    left += node.offsetLeft;
    top += node.offsetTop;
    node = node.offsetParent;
  }
  return {
    x: left,
    y: top
  }
}

export function setPositionMode(node, aModeString) {
  switch(aModeString) {
    case 'relative': {
      node.style.removeProperty('position');
      node.style.removeProperty('top');
      node.style.removeProperty('left');
      break;
    }
    case 'absolute': {
      node.style.position = 'absolute';
      break;
    }
  }
}
