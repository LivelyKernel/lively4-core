import * as events from './event-helpers.js';
import * as nodes from './node-helpers.js';
import * as config from './config.js';

var grabTarget;
var grabStartEventPosition;
var grabOffset;
export var isGrabbing = false;
var grabShadow;

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

export function start(e) {
  if (isGrabbing) return;
  grabTarget = window.that;
  if (grabTarget) {
    initGrabbingAtEvent(e);
  }
}

export function move(e) {
  if (grabTarget) {
    startOffsetGrabbing(e);
  }
  if (isGrabbing) {
    moveGrabbedNodeToEvent(e);
  }
}

export function stop(e) {
  if (isGrabbing) {
    stopGrabbingAtEvent(e);
  }
  grabTarget = null;
  grabStartEventPosition = null;
  grabShadow = null;
}

function initGrabbingAtEvent(anEvent) {
  grabStartEventPosition = events.globalPosition(anEvent);
  grabOffset = {
    x: events.globalPosition(anEvent).x - nodes.globalPosition(grabTarget).x,
    y: events.globalPosition(anEvent).y - nodes.globalPosition(grabTarget).y
  }
  anEvent.preventDefault();
}

function startOffsetGrabbing(anEvent) {
  if (!isGrabbing && events.noticableDistanceTo(anEvent, grabStartEventPosition)) {
    initGrabShadow();
    prepareGrabTarget();
    isGrabbing = true;
  }
}

function prepareGrabTarget() {
  document.body.appendChild(grabTarget);
  grabTarget.style.position = 'absolute';
  grabTarget.style.removeProperty('top');
  grabTarget.style.removeProperty('left');
}

function initGrabShadow() {
  grabShadow = grabTarget.cloneNode(true);
  grabShadow.style.opacity = '0.5';
  grabShadow.style.position = 'relative';
}

function moveGrabbedNodeToEvent(anEvent) {
  var eventPosition = events.globalPosition(anEvent);
  dropAtEvent(grabShadow, anEvent);
  nodes.setPosition(grabTarget, {
    x: eventPosition.x - grabOffset.x,
    y: eventPosition.y - grabOffset.y
  })
  anEvent.preventDefault();
}

function stopGrabbingAtEvent(anEvent) {
  insertGrabTargetBeforeShadow();
  removeGrabShadow();
  grabTarget.style.position = 'relative';
  grabTarget.style.removeProperty('top');
  grabTarget.style.removeProperty('left');
  anEvent.preventDefault();
  isGrabbing = false;
}

function removeGrabShadow() {
  grabShadow.parentNode.removeChild(grabShadow);
}

function dropAtEvent(node, e) {
  var droptarget = droptargetAtEvent(node, e);
  if (droptarget) {
    var pos = {
      x: e.pageX,
      y: e.pageY
    }
    moveGrabShadowToTargetAtPosition(droptarget, pos);
  }
}

function insertGrabTargetBeforeShadow() {
  if (grabShadow && grabTarget) {
    grabShadow.parentNode.insertBefore(grabTarget, grabShadow);
  }
}

function droptargetAtEvent(node, e) {
  var elementsUnderCursor = Array.from(events.elementsUnder(e)).filter(function (elementUnder) {
    return elementUnder !== grabTarget && elementUnder !== grabShadow;
  });
  for (var i = 0; i < elementsUnderCursor.length; i++) {
    var targetNode = elementsUnderCursor[i];
    if (canDropInto(node, targetNode) ) {
      return targetNode;
    }
  }
  return document.body;
}

function moveGrabShadowToTargetAtPosition(targetNode, pos) {
  var children = targetNode.childNodes;
  var nextChild = Array.from(children).find(child => {
    return child !== grabShadow && child !== grabTarget &&
      child.nodeType === 1 && nodeComesBehind(child, pos);
  });
  targetNode.insertBefore(grabShadow, nextChild);
}

function canDropInto(node, targetNode) {
  return node !== targetNode &&
    // !Array.from(targetNode.getElementsByTagName('*')).includes(node) &&
    !Array.from(node.getElementsByTagName('*')).includes(targetNode) &&
    $.inArray(targetNode.tagName.toLowerCase(), config.droppingBlacklist[node.tagName.toLowerCase()] || []) < 0 &&
    $.inArray(targetNode.tagName.toLowerCase(), config.droppingBlacklist['*'] || []) < 0
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
