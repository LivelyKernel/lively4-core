// import shaven from 'src/external/shaven/index.js'
import esprima from 'src/external/esprima.js'
import esprimaDefaults from './esprima-defaults.js'
import toHtmlError from './toHtmlError.js'

// import codemirror from 'src/external/code-mirror/src/edit/main.js'
// import 'src/external/code-mirror/mode/javascript/javascript.js'

import ArrayExpression from './visualizers/array-expression.js'
import ArrayPattern from './visualizers/array-pattern.js'
import ArrowFunctionExpression from './visualizers/arrow-function-expression.js'
import AssignmentExpression from './visualizers/assignment-expression.js'
import AssignmentPattern from './visualizers/assignment-pattern.js'
import AwaitExpression from './visualizers/await-expression.js'
import BinaryExpression from './visualizers/binary-expression.js'
import BlockStatement from './visualizers/block-statement.js'
import BreakStatement from './visualizers/break-statement.js'
import CallExpression from './visualizers/call-expression.js'
import CatchClause from './visualizers/catch-clause.js'
import ClassBody from './visualizers/class-body.js'
import ClassDeclaration from './visualizers/class-declaration.js'
import ClassExpression from './visualizers/class-expression.js'
import ConditionalExpression from './visualizers/conditional-expression.js'
import ContinueStatement from './visualizers/continue-statement.js'
import DoWhileStatement from './visualizers/do-while-statement.js'
import EmptyStatement from './visualizers/empty-statement.js'
import ExportAllDeclaration from './visualizers/export-all-declaration.js'
import ExportDefaultDeclaration from './visualizers/export-default-declaration.js'
import ExportNamedDeclaration from './visualizers/export-named-declaration.js'
import ExportSpecifier from './visualizers/export-specifier.js'
import ExpressionStatement from './visualizers/expression-statement.js'
import ForInStatement from './visualizers/for-in-statement.js'
import ForOfStatement from './visualizers/for-of-statement.js'
import ForStatement from './visualizers/for-statement.js'
import FunctionDeclaration from './visualizers/function-declaration.js'
import FunctionExpression from './visualizers/function-expression.js'
import Identifier from './visualizers/identifier.js'
import IfStatement from './visualizers/if-statement.js'
import ImportDeclaration from './visualizers/import-declaration.js'
import ImportDefaultSpecifier from './visualizers/import-default-specifier.js'
import ImportNamespaceSpecifier from './visualizers/import-namespace-specifier.js'
import ImportSpecifier from './visualizers/import-specifier.js'
import LabeledStatement from './visualizers/labeled-statement.js'
import Literal from './visualizers/literal.js'
import LogicalExpression from './visualizers/logical-expression.js'
import MemberExpression from './visualizers/member-expression.js'
import MethodDefinition from './visualizers/method-definition.js'
import NewExpression from './visualizers/new-expression.js'
import ObjectExpression from './visualizers/object-expression.js'
import ObjectPattern from './visualizers/object-pattern.js'
import PropertyComment from './visualizers/property-comment.js'
import Property from './visualizers/property.js'
import ReturnStatement from './visualizers/return-statement.js'
import SpreadElement from './visualizers/spread-element.js'
import Super from './visualizers/super.js'
import SwitchCase from './visualizers/switch-case.js'
import SwitchStatement from './visualizers/switch-statement.js'
import TaggedTemplateExpression from './visualizers/tagged-template-expression.js'
import TemplateElement from './visualizers/template-element.js'
import TemplateLiteral from './visualizers/template-literal.js'
import ThisExpression from './visualizers/this-expression.js'
import ThrowStatement from './visualizers/throw-statement.js'
import TryStatement from './visualizers/try-statement.js'
import UnaryExpression from './visualizers/unary-expression.js'
import UpdateExpression from './visualizers/update-expression.js'
import VariableDeclaration from './visualizers/variable-declaration.js'
import VariableDeclarator from './visualizers/variable-declarator.js'
import WhileStatement from './visualizers/while-statement.js'


const visualizers = {
  ArrayExpression,
  ArrayPattern,
  ArrowFunctionExpression,
  AssignmentExpression,
  AssignmentPattern,
  AwaitExpression,
  BinaryExpression,
  BlockStatement,
  BreakStatement,
  CallExpression,
  CatchClause,
  ClassBody,
  ClassDeclaration,
  ClassExpression,
  ConditionalExpression,
  ContinueStatement,
  DoWhileStatement,
  EmptyStatement,
  ExportAllDeclaration,
  ExportDefaultDeclaration,
  ExportNamedDeclaration,
  ExportSpecifier,
  ExpressionStatement,
  ForInStatement,
  ForOfStatement,
  ForStatement,
  FunctionDeclaration,
  FunctionExpression,
  Identifier,
  IfStatement,
  ImportDeclaration,
  ImportDefaultSpecifier,
  ImportNamespaceSpecifier,
  ImportSpecifier,
  LabeledStatement,
  Literal,
  LogicalExpression,
  MemberExpression,
  MethodDefinition,
  NewExpression,
  ObjectExpression,
  ObjectPattern,
  PropertyComment,
  Property,
  ReturnStatement,
  SpreadElement,
  Super,
  SwitchCase,
  SwitchStatement,
  TaggedTemplateExpression,
  TemplateElement,
  TemplateLiteral,
  ThisExpression,
  ThrowStatement,
  TryStatement,
  UnaryExpression,
  UpdateExpression,
  VariableDeclaration,
  VariableDeclarator,
  WhileStatement,
}




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
  
  if (visualizers[node.type]) {
    const visualizer = visualizers[node.type]
    return visualizer(node)
  }
  else {
    return ['p.error', node.type]
  }
}

export default walkTree
