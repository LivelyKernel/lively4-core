// TODO: Use native URL module when browserify supports it
// const URL = require('whatwg-url').URL

// import shaven from 'src/external/shaven.min.js'
import esprima from 'src/external/esprima.js'
import esprimaDefaults from './esprima-defaults.js'

import walkTree from './walkTree.js'
// import toHtmlError from './toHtmlError.js'


// :: String -> Result Error ShavenArray
export default function (fileData) {
  // Workaround to render JSON
  if (fileData.url.pathname.endsWith('.json')) {
    fileData.content = '(' + fileData.content + ')'
  }

  const indexOfFirstNewline = fileData.content.indexOf('\n')

  if (fileData.content.startsWith('#!')) {
    fileData.shebang = fileData.content.slice(0, indexOfFirstNewline)
    fileData.content = fileData.content.slice(indexOfFirstNewline)
  }

  try {
    const syntaxTree = esprima.parse(fileData.content, esprimaDefaults)
    
    if (esprimaDefaults.errors) {
      return esprimaDefaults.errors
    }
    else {
      const vDom = walkTree(syntaxTree, fileData)
      return vDom
    }
  }
  catch (error) {
    return error
  }
}


// :: String -> String
// function toNormalizedUrl (urlString) {
//   const fileUrl = new URL(urlString)

//   // GitHub specific normalizations
//   if (fileUrl.hostname === 'github.com') {
//     fileUrl.hostname = 'raw.githubusercontent.com'
//     fileUrl.pathname = fileUrl.pathname.replace('/blob/', '/')
//   }

//   return fileUrl
// }


// :: String -> String
// function toFileUrl (filePath) {
//   return filePath.startsWith('http')
//     ? toNormalizedUrl(filePath)
//     : toNormalizedUrl(`${window.location.origin}/files/${filePath}`)
// }


// :: String -> Eff (Result Error FileData)
// async function loadFile (fileUrl, filePath) {
//   let fileContentResponse
//   try {
//     fileContentResponse = await fetch(fileUrl.href)
//   }
//   catch (error) {
//     error.message = `Tried to load "${fileUrl}":${error.message}`
//     return error
//   }

//   if (!fileContentResponse || !fileContentResponse.ok) {
//     return new Error(
//       `Error while trying to load ${fileUrl}: ${fileContentResponse.statusText}`
//     )
//   }

//   const fileData = {
//     url: fileUrl,
//     path: filePath,
//     content: await fileContentResponse.text(),
//   }
//   return fileData
// }


// :: String -> Eff
// async function loadAndRender (filePath) {
//   const fileUrl = toFileUrl(filePath)
//   const result = await loadFile(fileUrl, filePath)
//   const outputElement = document.getElementById('output')
//   outputElement.innerHTML = ''

//   if (result instanceof Error) {
//     outputElement.innerHTML = toHtmlError(result)
//   }
//   else {
//     const shavenArray = renderSyntax(result)

//     if (shavenArray.errors) {
//       outputElement.innerHTML = toHtmlError(result)
//     }
//     else {
//       shaven([outputElement, shavenArray])[0]
//     }
//   }
// }


// :: Eff
// async function main () {
//   const filePathResponse = await fetch('/filename')
//   const filePath = await filePathResponse.text()

//   await loadAndRender(filePath)

//   const fileUrlForm = document.getElementById('fileUrl')

//   fileUrlForm.addEventListener('submit', async (event) => {
//     event.preventDefault()
//     const fileUrlInput = event.target.querySelector('input')

//     await loadAndRender(fileUrlInput.value)
//   })
// }
