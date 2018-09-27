const events = {};
const selectors = {};
let animationCount = 0;
const styles = document.createElement('style');
const keyframes = document.createElement('style');
const head = document.getElementsByTagName('head')[0];
const startNames = ['animationstart'];
const startEvent = function(event) {
			event.selector = (events[event.animationName] || {}).selector;
			((this.selectorListeners || {})[event.animationName] || []).forEach(function(fn){
				fn.call(this, event);
			}, this);
		};
const prefix = (function() {
			var duration = 'animation-duration: 0.001s;';
      var name = 'animation-name: SelectorListener !important;';
      var computed = window.getComputedStyle(document.documentElement, '');
      var pre = (Array.prototype.slice.call(computed).join('').match(/moz|webkit|ms/)||(computed.OLink===''&&['o']))[0];
			return {
				css: '-' + pre + '-',
				properties: '{' + duration + name + '-' + pre + '-' + duration + '-' + pre + '-' + name + '}',
				keyframes: !!(window.CSSKeyframesRule || window[('WebKit|Moz|MS|O').match(new RegExp('(' + pre + ')', 'i'))[1] + 'CSSKeyframesRule'])
			};
		})();
		
styles.type = keyframes.type = "text/css";
head.appendChild(styles);
head.appendChild(keyframes);

HTMLDocument.prototype.addSelectorListener = HTMLElement.prototype.addSelectorListener = function(selector, fn){
  var key = selectors[selector],
    listeners = this.selectorListeners = this.selectorListeners || {};

  if (key) {
    events[key].count++;
  } else {
    key = selectors[selector] = 'SelectorListener-' + animationCount++;
    let node = document.createTextNode(`@keyframes ${key} {
from { outline-color: #fff; } to { outline-color: #000; }
}`);
    keyframes.appendChild(node);
    styles.sheet.insertRule(selector + prefix.properties.replace(/SelectorListener/g, key), 0);
    events[key] = {
      count: 1,
      selector: selector,
      keyframe: node,
      rule: styles.sheet.cssRules[0]
    };
  } 

  if (listeners.count) {
    listeners.count++;
  } else {
    listeners.count = 1;
    startNames.forEach(name => {
      this.addEventListener(name, startEvent, false);
    });
  }

  (listeners[key] = listeners[key] || []).push(fn);
};

HTMLDocument.prototype.removeSelectorListener = HTMLElement.prototype.removeSelectorListener = function(selector, fn){
  var listeners = this.selectorListeners || {},
    key = selectors[selector],
    listener = listeners[key] || [],
    index = listener.indexOf(fn);

  if (index > -1){
    var event = events[selectors[selector]];
    event.count--;
    if (!event.count){
      styles.sheet.deleteRule(styles.sheet.cssRules.item(event.rule));
      keyframes.removeChild(event.keyframe);
      delete events[key];
      delete selectors[selector];
    }

    listeners.count--;
    listener.splice(index, 1);
    if (!listeners.count) startNames.forEach(name => {
      this.removeEventListener(name, startEvent, false);
    });
  }
};

document.addSelectorListener('lively-window', animationEvent => {
  lively.success("WINDOW99!");
  lively.showElement(animationEvent.target, 2000);
});
document.addSelectorListener('input[value="foobar"]', () => lively.success("INPUT!"));
document.addSelectorListener('button', () => lively.success("BUTTON!"));
that.addSelectorListener('input', () => lively.success("INPUT222!"))
document.querySelector('input[value=""]')

//let foobar = <div id="foobar"></div>;
//document.body.appendChild(foobar)
//debugger

export function __unload__() {
  styles.remove();
  keyframes.remove();
}