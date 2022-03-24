// preloading dependencies and web components for Stefan's (@Onsetsu) GS Project

const HACK = {};

async function setupPaperJS() {
  const paperJSURL = lively4url + '/src/external/paper-core.js';
  await lively.loadJavaScriptThroughDOM("paper-core.js", paperJSURL);
  const canvas = document.createElement('canvas')
  return paper.setup(canvas);
}

let paperScopePromise;
async function ensurePaperJS() {
  if (paperScopePromise) {
    return paperScopePromise
  }
  return paperScopePromise = setupPaperJS();
}

// preload gs web components
export default async function preloadGSVisualEditor() {
  const templatePaths = lively.components.getTemplatePaths();
  if (!templatePaths.some(path => path.includes('gs/components'))) {
    throw new Error(`do not have a gs/component path, but [${templatePaths}]`);
  }
  
  await ensurePaperJS()

  const tagNames = [
    'gs-visual-editor',
    'gs-visual-editor-canvas',
    'gs-visual-editor-node',
    'gs-visual-editor-edge',
    'gs-visual-editor-port',
    'gs-visual-editor-add-node-menu',
    'gs-visual-editor-lasso-selection',
    'gs-visual-editor-rectangle-selection',
    'gs-visual-editor-input-checkbox',
    'gs-visual-editor-input-select',
    'gs-visual-editor-input-text',
  ];

  const loadingPromises = tagNames.map(tagName => {
    const tag = document.createElement(tagName);
    tag.style.display = 'none';
    tag.setAttribute('for-preload', 'true');
    document.body.append(tag);
    function removeTag(arg) {
      tag.remove();
      return arg;
    }
    return lively.components.ensureLoadByName(tagName, undefined, tag).then(removeTag, removeTag);
  });
  return Promise.all(loadingPromises);
}
