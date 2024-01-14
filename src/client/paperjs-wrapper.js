/* global paper */

const paperJSURL = lively4url + '/src/external/paper-core.js';
await lively.loadJavaScriptThroughDOM("paper-core.js", paperJSURL);
const canvas = document.createElement('canvas')
paper.setup(canvas);

export {paper as default};
