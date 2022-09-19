export default async function preloaWebComponents(tagNames) {
  // check already loaded components
  const namesToPreload = tagNames.difference(Object.keys(lively.components.templates))
  
  const loadingPromises = namesToPreload.map(tagName => {
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
