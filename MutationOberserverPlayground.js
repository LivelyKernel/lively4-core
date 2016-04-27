//CMD-A + CMD-D and check console while switching windows :)
  //outputs active window, and window with 101 z-index
  //rotates rectangle, when turned red
  
let activeDOM = [
  {
    tagName: 'lively-window',
    attribute: 'active',
    newValue: 'true',
    callback: function(target) {
      console.log('Window is active:', target);
    }
  },
  {
    tagName: 'lively-window',
    attribute: 'style',
    style: 'z-index',
    newValue: '101',
    callback: function(target) {
      console.warn('Do not get confused, it seems that the style attribute is not updated yet in the console output, but it indeed is in the target object!');
      console.warn('Also the mutation observer fires on each style change - not only the observed one. Probably will need to compare with the old value to figure out which style really changed.');
      console.log('Window has 101 z-index:', target);
      console.log('Window z-index:', target.style['z-index']);
    }
  },
  {
    tagName: 'div',
    attribute: 'style',
    style: 'background-color',
    newValue: 'red',
    callback: function(target) {
      var style = document.createElement('style');
      style.innerHTML = '@keyframes rotate {from{transform:rotateY(0deg);}to{transform:rotateY(360deg);}}';
      document.body.appendChild(style);
      
      target.style['animation'] = 'rotate 2s linear infinite';
    }
  }
];

function filterAttributeMutation(mutation) {
  activeDOM.forEach(function(expression) {
    if(expression.attribute == mutation.attributeName) {
      if(mutation.attributeName == 'style') {
        if(expression.newValue == mutation.target.style[expression.style]) {
          expression.callback(mutation.target);
        }  
      } else {
        if(expression.newValue == mutation.target.getAttribute(expression.attribute)) {
          
          expression.callback(mutation.target);
        }
      }
    }
  });
}

function filterMutation(mutation) {
  
  switch(mutation.type) {
      case("attributes"):
        filterAttributeMutation(mutation);
      case("characterData"):
        //TODO
        break;
      case("childList"):
        //nothing
        break;
    }
}

if(typeof observer !== "undefined") {
  console.info('Old observer successfully disconnected.');
  observer.disconnect();
}

window.observer = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
    filterMutation(mutation);
  });
});
console.info('Created new MutationObserver.');

let config = {
  subtree: true,
  childList: true,
  attributes: true,
  characterData: true
};

observer.observe(document, config);
console.info('Observer successfully started.');

//run this to end observation
//observer.disconnect();