import * as events from './event-helpers.js';
import * as nodes from './node-helpers.js';
import * as config from './config.js';

var grabOffset = config.GRAB_OFFSET || 0;

var grabTarget;
var grabStartPosition;
var isGrabbing = false;
var droppingBlacklist;

$.getJSON(config.SCRIPT_LOCATION + 'droppingBlacklist.json', function(json) {
    droppingBlacklist = json;
});

export function activate() {
  console.log("using Grabbing");
  $("body").on("mousedown", start);
  $("body").on("mousemove", move);
  $("body").on("mouseup", stop);
}

export function deactivate() {
  console.log("deactivate Grabbing");
  $("body").off("mousedown", start);
  $("body").off("mousemove", move);
  $("body").off("mouseup", stop);
}

function start(e) {
  grabTarget = events.elementsUnder(e)[0];
  grabTarget = document.body === grabTarget ? null : grabTarget;
  grabStartPosition = events.globalPosition(e);
  e.preventDefault();
}

function move(e) {
  var eventPosition = events.globalPosition(e);
  if (grabTarget && !isGrabbing && events.distanceTo(e, grabStartPosition) > grabOffset) {
    nodes.setPositionMode(grabTarget, 'relative');
    isGrabbing = true;
  }
  if (isGrabbing) {
    dropAtEvent(grabTarget, e);
    e.preventDefault();
  }
}

function dropAtEvent(node, e) {
  var droptarget = droptargetAtEvent(node, e);
  if (droptarget) {
    var pos = {
      x: e.pageX,
      y: e.pageY
    }
    moveNodeToTargetAtPosition(node, droptarget, pos);
  }
}

function canDropInto(node, targetNode) {
  return node !== targetNode &&
    $.inArray(targetNode.tagName.toLowerCase(), droppingBlacklist[node.tagName.toLowerCase()] || []) < 0 &&
    $.inArray(targetNode.tagName.toLowerCase(), droppingBlacklist['*'] || []) < 0
}

function droptargetAtEvent(node, e) {
  var elementsUnderCursor = events.elementsUnder(e);
  for (var i = 0; i < elementsUnderCursor.length; i++) {
    var targetNode = elementsUnderCursor[i];
    if (canDropInto(node, targetNode)) {
      return targetNode;
    }
  }
}

function stop(e) {
  if (isGrabbing) {
    e.preventDefault();
    isGrabbing = false;
  }
  grabTarget = null;
  grabStartPosition = null;
}

function moveNodeToTargetAtPosition(node, targetNode, pos) {
  var children = targetNode.childNodes;
  var nextChild = Array.from(children).find(child => {
    return child.nodeType === 1 && nodeComesBehind(child, pos);
  });
  targetNode.insertBefore(node, nextChild);
}

function nodeComesBehind(node, pos) {
  var childTop = $(node).offset().top;
  var childLeft = $(node).offset().left;
  var childBottom = childTop + $(node).height();
  var childRight = childLeft + $(node).width();
  var toTheRight = childTop <= pos.y <= childBottom
      && childLeft > pos.x;
  var below = childTop > pos.y;
  return toTheRight || below;
}
