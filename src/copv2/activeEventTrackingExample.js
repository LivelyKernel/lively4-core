import notify from './activeEventTracking.js';

// random colors - taken from http://www.paulirish.com/2009/random-hex-color-code-snippets/
function randomColors() {
    return '#' + Math.floor(Math.random() * 16777215).toString(16);
}

// whenever we click on a div element, assign a random color to it
notify('click', 'div', e => e.target.style['background-color'] = randomColors());

// TODO: add a button that creates new div
// TODO: running example
// TODO: .md as doc
