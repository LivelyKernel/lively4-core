export function editSelf(element) {
  const container = lively.ancestry(element).find(e => e && e.localName === 'lively-container')
  if (container) {
    return <a href=' ' click={evt => {
        lively.openBrowser(container.getURL() + '', true)
        evt.preventDefault()
      }}>edit this file</a>
  } else {
    return <span>huhu</span>
  }
}
