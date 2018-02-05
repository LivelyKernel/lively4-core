// import shaven from 'src/external/shaven/index.js'
import esprima from 'src/external/esprima.js'
import esprimaDefaults from './esprima-defaults.js'
import toHtmlError from './toHtmlError.js'

// import codemirror from 'src/external/code-mirror/src/edit/main.js'
// import 'src/external/code-mirror/mode/javascript/javascript.js'

import arrayExpression from './visualizers/array-expression.js'
import arrayPattern from './visualizers/array-pattern.js'
import arrowFunctionExpression from './visualizers/arrow-function-expression.js'
import assignmentExpression from './visualizers/assignment-expression.js'
import assignmentPattern from './visualizers/assignment-pattern.js'
import awaitExpression from './visualizers/await-expression.js'
import binaryExpression from './visualizers/binary-expression.js'
import blockStatement from './visualizers/block-statement.js'
import breakStatement from './visualizers/break-statement.js'
import callExpression from './visualizers/call-expression.js'
import catchClause from './visualizers/catch-clause.js'
import classBody from './visualizers/class-body.js'
import classDeclaration from './visualizers/class-declaration.js'
import classExpression from './visualizers/class-expression.js'
import conditionalExpression from './visualizers/conditional-expression.js'
import continueStatement from './visualizers/continue-statement.js'
import doWhileStatement from './visualizers/do-while-statement.js'
import emptyStatement from './visualizers/empty-statement.js'
import exportAllDeclaration from './visualizers/export-all-declaration.js'
import exportDefaultDeclaration from './visualizers/export-default-declaration.js'
import exportNamedDeclaration from './visualizers/export-named-declaration.js'
import exportSpecifier from './visualizers/export-specifier.js'
import expressionStatement from './visualizers/expression-statement.js'
import forInStatement from './visualizers/for-in-statement.js'
import forOfStatement from './visualizers/for-of-statement.js'
import forStatement from './visualizers/for-statement.js'
import functionDeclaration from './visualizers/function-declaration.js'
import functionExpression from './visualizers/function-expression.js'
import identifier from './visualizers/identifier.js'
import ifStatement from './visualizers/if-statement.js'
import importDeclaration from './visualizers/import-declaration.js'
import importDefaultSpecifier from './visualizers/import-default-specifier.js'
import importNamespaceSpecifier from './visualizers/import-namespace-specifier.js'
import importSpecifier from './visualizers/import-specifier.js'
import labeledStatement from './visualizers/labeled-statement.js'
import literal from './visualizers/literal.js'
import logicalExpression from './visualizers/logical-expression.js'
import memberExpression from './visualizers/member-expression.js'
import methodDefinition from './visualizers/method-definition.js'
import newExpression from './visualizers/new-expression.js'
import objectExpression from './visualizers/object-expression.js'
import objectPattern from './visualizers/object-pattern.js'
import propertyComment from './visualizers/property-comment.js'
import property from './visualizers/property.js'
import returnStatement from './visualizers/return-statement.js'
import spreadElement from './visualizers/spread-element.js'
import superElement from './visualizers/super.js'
import switchCase from './visualizers/switch-case.js'
import switchStatement from './visualizers/switch-statement.js'
import taggedTemplateExpression from './visualizers/tagged-template-expression.js'
import templateElement from './visualizers/template-element.js'
import templateLiteral from './visualizers/template-literal.js'
import thisExpression from './visualizers/this-expression.js'
import throwStatement from './visualizers/throw-statement.js'
import tryStatement from './visualizers/try-statement.js'
import unaryExpression from './visualizers/unary-expression.js'
import updateExpression from './visualizers/update-expression.js'
import variableDeclaration from './visualizers/variable-declaration.js'
import variableDeclarator from './visualizers/variable-declarator.js'
import whileStatement from './visualizers/while-statement.js'



// function onEdit (fileData, editEvent) {
//   editEvent.target.textContent = 'visualize'
//   editEvent.target.removeEventListener('click', onEdit)
//   const fileContainer = editEvent.target.parentNode.parentNode
//   const renderingContainer = fileContainer.querySelector('.body')
//   renderingContainer.style.display = 'none'

//   const editorContainer = document.createElement('div')
//   editorContainer.className = 'editor'
//   fileContainer.append(editorContainer)

//   const editor = codemirror(
//     editorContainer,
//     {
//       value: fileData.content,
//       mode: 'javascript',
//       lineNumbers: true,
//     }
//   )

//   function reVisualize (event) {
//     fileData.content = editor.getValue()
//     const outputElement = document.getElementById('output')

//     try {
//       event.target.removeEventListener('click', reVisualize)
//       const ast = esprima.parse(fileData.content, esprimaDefaults)
//       const rendering = [walkTree(ast, fileData)]

//       outputElement.innerHTML = ''
//       // renderingContainer.style.display = 'initial'
//       // editorContainer.style.display = 'initial'

//       shaven([outputElement, rendering])
//     }
//     catch (error) {
//       const div = document.createElement('div')
//       div.innerHTML = toHtmlError(error)
//       fileContainer.prepend(div)
//     }
//   }

//   editEvent.target.addEventListener('click', reVisualize)
// }


// visualizerNames
//   .filter(name => /.+\.js$/i.test(name))
//   .forEach(name => {

//     const nameInCamelCase = name
//       .replace('.js', '')
//       .split('-')
//       .map(capitalize)
//       .join('')

//     visualizers[nameInCamelCase] = path.join(
//       path.join(__dirname, 'visualizers'),
//       name
//     )
//   })


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
            console.log('clicked button')
            // element.addEventListener('click', clickEvent =>
            //   onEdit(fileData, clickEvent)
            // )
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

  if (window[node.type]) {
    const visualizer = window[node.type]
    return visualizer(node)
  }
  else {
    return ['p.error', node.type]
  }
}

export default walkTree
