const fs = require('fs')
const path = require('path')

const shaven = require('shaven').default
const esprima = require('esprima')
const esprimaDefaults = require('./esprima-defaults')
const toHtmlError = require('./toHtmlError')

const codemirror = require('codemirror')
require('codemirror/mode/javascript/javascript.js')


function onEdit (fileData, editEvent) {
  editEvent.target.textContent = 'visualize'
  editEvent.target.removeEventListener('click', onEdit)
  const fileContainer = editEvent.target.parentNode.parentNode
  const renderingContainer = fileContainer.querySelector('.body')
  renderingContainer.style.display = 'none'

  const editorContainer = document.createElement('div')
  editorContainer.className = 'editor'
  fileContainer.append(editorContainer)

  const editor = codemirror(
    editorContainer,
    {
      value: fileData.content,
      mode: 'javascript',
      lineNumbers: true,
    }
  )

  function reVisualize (event) {
    fileData.content = editor.getValue()
    const outputElement = document.getElementById('output')

    try {
      event.target.removeEventListener('click', reVisualize)
      const ast = esprima.parse(fileData.content, esprimaDefaults)
      const rendering = [walkTree(ast, fileData)]

      outputElement.innerHTML = ''
      // renderingContainer.style.display = 'initial'
      // editorContainer.style.display = 'initial'

      shaven([outputElement, rendering])
    }
    catch (error) {
      const div = document.createElement('div')
      div.innerHTML = toHtmlError(error)
      fileContainer.prepend(div)
    }
  }

  editEvent.target.addEventListener('click', reVisualize)
}



// Do not refactor as code is analyzed statically and only works this way
const visualizerNames = fs.readdirSync(path.join(__dirname, 'visualizers'))

const visualizers = {}
visualizerNames
  .filter(name => /.+\.js$/i.test(name))
  .forEach(name => {

    const nameInCamelCase = name
      .replace('.js', '')
      .split('-')
      .map(capitalize)
      .join('')

    visualizers[nameInCamelCase] = path.join(
      path.join(__dirname, 'visualizers'),
      name
    )
  })


function capitalize (word) {
  return word[0].toUpperCase() + word.substr(1)
}


function hasLeadingComments (element) {
  return element.hasOwnProperty('leadingComments')
}


function commentTemplate (comment) {
  return [
    'p',
    {class: 'comment ' + comment.type.toLowerCase()},
    comment.value.replace(/\n/g, '<br>'),
  ]
}


function walkTree (node, fileData) {
  if (!node || (Array.isArray(node) && !node.length)) {
    return ''
  }

  // Convert comments in objects to a table friendly format
  if (
    node.type === 'ObjectExpression' &&
    node.properties.some(hasLeadingComments)
  ) {

    node.properties.forEach((property, propertyIndex) => {
      if (!hasLeadingComments(property)) return

      node.properties.splice(
        propertyIndex,
        0,
        property.leadingComments.map(comment => ({
          type: 'PropertyComment',
          value: comment.value,
        }))
      )
      delete property.leadingComments
    })
  }


  if (Array.isArray(node.leadingComments)) {
    if (node.leadingComments.length) {
      if (node.leadingComments.some(comment => comment.value)) {
        const comments = node.leadingComments
          .map(comment => {
            if (comment.value === null) return ''
            const commentArray = commentTemplate(comment)
            comment.value = null
            return commentArray
          })

        return ['.commentedSection',
          ['.leadingComments', ...comments],
          walkTree(node, fileData),
        ]
      }
    }
    else {
      delete node.leadingComments
      return walkTree(node, fileData)
    }
  }

  if (Array.isArray(node.trailingComments)) {
    if (node.loc.end.line === node.trailingComments[0].loc.end.line) {
      if (
        node.trailingComments[0].value !== null &&
        node.trailingComments[0].type === 'Line'
      ) {
        const commentArray = [
          'span.trailing.comment',
          node.trailingComments[0].value.trim(),
        ]

        node.trailingComments[0].value = null

        return ['.withTrailingComment',
          walkTree(node, fileData),
          commentArray,
        ]
      }
    }
    else {
      node.trailingComments = 'null'
      return walkTree(node, fileData)
    }
  }


  if (Array.isArray(node) && node.length) {
    return node.map(walkTree)
  }

  if (node.type === 'Program') {
    let shebang = ''

    if (fileData.shebang) {
      shebang = ['.shebang', fileData.shebang]
    }

    return ['section.file',
      shebang,
      ['header',
        fileData ? fileData.path : false,
        ['button.edit',
          'edit',
          element => {
            element.addEventListener('click', clickEvent =>
              onEdit(fileData, clickEvent)
            )
          },
        ],
      ],
      ['.body',
        ...node.body.map(walkTree),
        Array.isArray(node.comments)
          ? [
            '.comments',
            ...node.comments
              .filter(comment => comment.value)
              .map(comment => {
                return commentTemplate(comment)
              }),
          ]
          : true,
      ],
    ]
  }

  if (visualizers[node.type]) {
    const visualizer = require(visualizers[node.type])
    return visualizer(node)
  }
  else {
    return ['p.error', node.type]
  }
}

module.exports = walkTree
