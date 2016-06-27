
function toHTML(desc) {
  if (typeof desc === 'object') {
    let el = document.createElement(desc.elementName)

    if (desc.children) {
      for (let child of desc.children) {
        el.appendChild(toHTML(child))
      }
    }

    return el
  } else {
    return document.createTextNode(desc.toString())
  }
}

class FileBrowser extends HTMLElement {
  constructor() {
    super();
  }

  createdCallback() {
    let a = toHTML(<div>
      <h2>File Browser</h2>
    </div>)

    this.appendChild(a)
  }

  attachedCallback() {
    console.log('attached')
  }

  detachedCallback() {
    console.log('detached')
  }

  attributeChangedCallback() {
    console.log('attribute changed')
  }
}

document.registerElement('file-browser', FileBrowser)

const fb = document.createElement('file-browser')

document.body.appendChild(fb)

console.log('whee')
