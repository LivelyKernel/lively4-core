export function activate() {
  console.log("using Resizing");
  $("body").on("keydown", changeSize);
  // showHandles(window.that);
  // Object.observe(window.observables, thatChangedCallback);
}

export function deactivate() {
  console.log("deactivate Resizing");
  $("body").off("keydown", changeSize);
  // hideHandles(window.that);
  // Object.unobserve(window.observables, thatChangedCallback);
}

// function thatChangedCallback(changes) {
//   hideHandles(changes[0].oldValue);
//   showHandles(changes[0].object.that);
// }

function changeSize(e) {
  if (!window.that) return;
  dispatchArrow(e.keyCode);
}

function dispatchArrow(keyCode) {
  switch(keyCode) {
    case 37: return left();
    case 38: return up();
    case 39: return right();
    case 40: return down();
 }
}


function setStyle(node, property, value) {
  node.style.setProperty(property, value)
}

function sizeof(node) {
  return {
    x: parseInt(node.style.getPropertyValue('width')) || 10,
    y: parseInt(node.style.getPropertyValue('height')) || 10
  }
}

function right() {
  setStyle(that, 'width', '' + (sizeof(that).x + 10) + 'px');
}

function left() {
  setStyle(that, 'width', '' + Math.max(sizeof(that).x - 10, 10) + 'px');
}

function down() {
  setStyle(that, 'height', '' + (sizeof(that).y + 10) + 'px');
}

function up() {
  setStyle(that, 'height', '' + Math.max(sizeof(that).y - 10, 10) + 'px');
}

// function hideHandles(node) {

// }

// function showHandles(node) {

// }
