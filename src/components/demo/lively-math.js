

import Morph from 'src/components/widgets/lively-morph.js'
import Math from 'src/external/math.js'

export default class LivelyMath extends Morph {

  initialize() {
    var workspace = this.shadowRoot.querySelector('#workspace')
    workspace.boundEval = function (str) {
      return Promise.resolve({value: Math.eval(str)})
    } 
// #TODO get autocompletion work again in CodeMirror math workspace
// #TODO how can we make use of Math.js in other code? #DSL
//     workspace.enableAutocompletion = function(filename) {
//       return this.aceRequire("ace/ext/language_tools").then( module => {
//         if (!this.editor) return
        
//         this.editor.setOptions({
//             enableBasicAutocompletion: true,
//             enableSnippets: true,
//             enableLiveAutocompletion: false
//         });
//         this.editor.completers[3] =  {
//           getCompletions: function(editor, session, pos, prefix, callback) {
//               // console.log("getCompletions: " + pos + " prefix " + prefix)
//               var curLine = session.getDocument().getLine(pos.row);
//               var curTokens = curLine.slice(0, pos.column).split(/\s+/);
//               var curCmd = _.last(curTokens);
//               // console.log("line : " + curLine + " curTokens: " + curTokens + " curCmd:" + curCmd)
//               if (!curCmd) return;
//               try {
//                 var wordList = [];
//               wordList = lively.allProperties(lively.math);
//               // console.log("complete: " + curCmd +"\n" + wordList)
//                 callback(null, _.keys(wordList).map(function(ea) {
//                   return {name: ea, value: ea, score: 300, meta: wordList[ea]};
//                   }));
//               } catch(err) {
//                 console.log("Could not complete: " + curCmd +", because of:" + err)
//               }
//             }
//           }
//       })
//     }
//     workspace.enableAutocompletion()
     
//     }
  }
    
}