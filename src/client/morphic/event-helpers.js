import * as nodes from './node-helpers.js';
import {pt} from '../graphics.js';

// todo: export class wrappers

/**
Event(e).globalPosition();
*/

var offset = 30;

export function globalPosition(e) {
  return pt(e.pageX, e.pageY)
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
