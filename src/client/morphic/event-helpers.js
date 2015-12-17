import * as nodes from './node-helpers.js'

// todo: export class wrappers
/**
Event(e).globalPosition();
*/

var offset = 30;

export function globalPosition(e) {
  var targetPos = nodes.globalPosition(e.target);
  return {
    x: e.offsetX + targetPos.x,
    y: e.offsetY + targetPos.y
  }
}

export function elementsUnder(e) {
  var pos = globalPosition(e);
  return document.elementsFromPoint(e.clientX, e.clientY);
}

export function distanceTo(e, pos) {
  var yDist = Math.abs(pos.y - globalPosition(e).y);
  var xDist = Math.abs(pos.x - globalPosition(e).x);
  return Math.sqrt((xDist * xDist) + (yDist * yDist))
}

export function getTargetNode(e) {
  var target = elementsUnder(e)[0];
  return document.body === target ? null : target;
}

export function noticableDistanceTo(e, pos) {
  return distanceTo(e, pos) > offset;
}
