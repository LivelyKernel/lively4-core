import Node from './node.js'
import PrintUtils from './print.js'
import Utils from './utils.js'

var tokenList = [
    {regex:"function\\s",token:"functionTag",attributes:[],codeEquivalent:"function \\s"},
    {regex:"\n",token:"newline",attributes:[],codeEquivalent:""},
    {regex: "<gap>",token:"gap",attributes:[],codeEquivalent:""},
    {regex: "for", token: "for", attributes: [],codeEquivalent:"for"},
    {
        regex: "var .*?=.*?;",
        token: "statement",
        attributes: [{name: "var", before: "var", after: "="}, {name: "val", before: "=", after: ";"}],
        codeEquivalent:"var \\s $var \\s = \\s $val ;"
    },
    {
        regex: "[^(\\(|\\n|;|\{|\})]*?((==)|&&|(\\|\\|)|<|>|<=|>=)(.*?);",
        token: "condition",
        attributes: [{name: "var", before: "^", after: "(<|>=|==|\\|\\||>|<=|&&)"}, {
            name: "conditionVal",
            before: "[<|=|\\||>|&]\+",
            after: "\\s*?;"
        }, {name: "conditionOp", before: "[^(<|>=|==|\\|\\||>|<=|&&)]*", after: "[^(<|>=|==|\\|\\||>|<=|&&)]*$"}],
        codeEquivalent:"$var \\s $conditionOp \\s $conditionVal ;"
    },
    {
        regex: "[^(\\(|\\{|;)]*?(\\+\\+|\\-\\-)",
        token: "increment",
        attributes: [{name: "var", before: "", after: "(\\+\\+|\\-\\-)"}, {
            name: "op",
            before: "^[^(\\+|\\-)]*",
            after: "$"
        }],
        codeEquivalent:"$var $op "
    },
    {regex: "{", token: "openBrace", attributes: [],codeEquivalent:"{"},
    {regex: "}", token: "closeBrace", attributes: [],codeEquivalent:"}"},
    {regex: "\\(", token: "openBracket", attributes: [],codeEquivalent:"("},
    {regex: "\\)", token: "closeBracket", attributes: [],codeEquivalent:")"},
]
var gapSym="'gap'"

var parserList = [
    {
      name:"function",
      regex:"functionTag\\s((?!(openBracket)).)*\\sopenBracket\\s((?!(closeBracket)).)*\\scloseBracket\\sopenBrace\\snewline((?!(closeBrace)).)*\\scloseBrace",
      attributes:[
        
        {
          name:"params",
          before:"functionTag\\s((?!(openBracket)).)*\\sopenBracket\\s",
          after:"closeBracket\\sopenBrace"
        },
        {
          name:"content",
          before:"functionTag\\s((?!(openBracket)).)*\\sopenBracket\\s((?!(closeBracket)).)*\\scloseBracket\\sopenBrace\\snewline",
          after:"closeBrace(\\snewline|$)"
        }
      ]
    },
    {
        name: "forLoop",
        regex: "for\\sopenBracket\\sstatement\\scondition\\sincrement\\scloseBracket\\s(openBrace)\\snewline((?!(closeBrace)).)*\\scloseBrace(\\snewline|$)",
        attributes: [
            {
                name: "content",
                before: "for\\sopenBracket\\sstatement\\scondition\\sincrement\\scloseBracket\\sopenBrace\\snewline",
                after: "closeBrace(\\snewline|$)"
            }],
    },
    {
          name: "describeFunction",
          regex: "describe\\sopenBracket\\s(.*?)\\sfunctionTag\\sopenBracket\\scloseBracket\\sopenBrace\\snewline\\s((?!(closeBrace)).)*closeBrace\\scloseBracket(\\snewline|$)",
          attributes: [
              {
                  name: "content",
                  before: "describe\\sopenBracket\\s(.*?)\\sfunctionTag\\sopenBracket\\scloseBracket\\sopenBrace\\snewline",
                  after: "closeBrace\\scloseBracket(\\snewline|$)"
              }],
      },
      {
          name: "itFunction",
          regex: "it\\sopenBracket\\s(.*?)\\sfunctionTag\\sopenBracket\\scloseBracket\\sopenBrace\\snewline((?!(closeBrace)).)*\\scloseBrace\\scloseBracket(\\snewline|$)",
          attributes: [
              {
                  name: "content",
                  before: "it\\sopenBracket\\s(.*?)\\sfunctionTag\\sopenBracket\\scloseBracket\\sopenBrace\\snewline",
                  after: "closeBrace\\scloseBracket(\\snewline|$)"
              }],
      }
]
export default class CodeTree {
  
    constructor() {
        this.gaps=[]
        this.root= new Node();
        this.root.nameTag="Root";
        this.addNewLine(this.root,0);
        this.Utils=new Utils();
    }
    /**
     * Uses the tokenizelist to tokenize a given line
     * @param line Line which is to be tokenized
     */
    tokenizeLine(line) {
        var newLine = new Node();
        newLine.nameTag = "line";
        var tokenReplaced = true;
        var unfinished = ""
        while (line.length > 0) {
            if (tokenReplaced) {
                tokenReplaced = false;
                for (var i = 0; i < tokenList.length; i++) {
                    var token = tokenList[i];
                    var match = line.match(new RegExp(token.regex));
                    if (match && match.index === 0) {
                        line = line.substring(match[0].length);
                        var newToken = new Node();
                        for (var j = 0; j < token.attributes.length; j++) {
                            var attribute = token.attributes[j];
                            // calc position of attribute value
                            var beforeMatch = match[0].match(new RegExp(attribute.before));
                            var afterMatch = match[0].match(new RegExp(attribute.after));

                            if (beforeMatch && afterMatch) {
                                var indexOfAfter = afterMatch.index;
                                var indexOfBefore = beforeMatch.index;
                                var attributeValue = match[0].substring(indexOfBefore + beforeMatch[0].length, indexOfAfter);
                                newToken.attributes[attribute.name]={name: attribute.name, value: attributeValue.trim()}
                            } else {
                                console.log("Attribute " + attribute.name + " not found.")
                            }
                        }
                        if (unfinished !== "") {
                            var unfinishedToken = new Node();
                            unfinishedToken.matchedCode = unfinished;
                            unfinishedToken.nameTag = "unfinished";
                            newLine.children.push(unfinishedToken);
                            unfinished = "";
                        }
                        newToken.matchedCode = match[0];
                        newToken.nameTag = tokenList[i].token;
                        newLine.children.push(newToken);
                        tokenReplaced = true;
                    }
                }
            } else {
                unfinished += line.charAt(0);
                line = line.substring(1);
                tokenReplaced = true;
            }
        }
        if (unfinished !== "") {
            var restToken = new Node();
            restToken.matchedCode = unfinished;
            restToken.nameTag = "unfinished"
            restToken.parent = newLine;
            newLine.children.push(restToken);
        }

        return newLine;
    }
    /**
     * Creates a string out of the nametags of the nodes in the current context
     * @param node Parent node which defines the context
     * @returns {string} String with all nametags separated by spaces.
     */
    children2String(node) {
        var result = "";
        for (var i = 0; i < node.children.length; i++) {
            if (node.children[i].nameTag === "line") {
                result += " " + this.children2String(node.children[i]);
            } else {
              if(node.children[i].nameTag==="unfinished"){
                result += " "+ node.children[i].matchedCode.trim();
              }else{
                result += " " + node.children[i].nameTag;
              }
            }
        }
        result = result.trim();
        return result;
    }
    /**
     * Extracts nodes for a given regex match
     * @param match Regex match of nodes which should be extracted
     * @param tokenString String of text which was used to match against
     * @param parent Parent of the current context
     * @param index Index of the start of the match
     * @returns {{nodes: T[], startIndex: number, endIndex: number}} Returns an object with the extracted nodes and the start and end index of parents children array for the node sequence.
     */
    extractNodes(match, tokenString, parent, index) {
        var matchLength = tokenString.substring(index, index + match[0].length).trim().split(" ").length;
        var tokensBefore = tokenString.substring(0, index).trim().split(" ").length
        if (tokenString.substring(0, index) === "") {
            tokensBefore = 0;
        }
        var tokenCounter = 0;
        var startIndex = 0;
        var startSet=false;
        var endSet=false;
        var endIndex = 0;
        for (var i = 0; i < parent.children.length; i++) {
            if (tokenCounter >= tokensBefore&&!startSet) {
              console.log("tokencounter="+tokenCounter+" "+tokensBefore)
              startSet=true;
                startIndex = i;
            }
            if (parent.children[i].nameTag === "line") {
                tokenCounter += parent.children[i].children.length;
            } else {
                tokenCounter++;
            }
            if (tokenCounter === matchLength + tokensBefore) {
                endIndex = i;
                break;
            }
          console.log("tokenCounter "+tokenCounter)
        }
      console.log("startindex "+startIndex)
        return {nodes: parent.children.slice(startIndex, endIndex+1), startIndex: startIndex, endIndex: endIndex}
    }
    /**
     * Sets the parent for either all beginning, children or ending..
     * @param array Array of nodes for which the parent should be set
     * @param parent The new parent of the array elements.
     */
    setParent(array, parent) {
        for (var i = 0; i < array.length; i++) {
            array[i].parent = parent;
        }
    }
    /**
     * Uses the parser Array to parse one context and create new tokens
     * @param startLine An arbitrary line in the context you want to parse
     */
    parse(startLine) {
        var start = startLine.parent;
        var tokenString = this.children2String(start);
        console.log("tokenString :"+tokenString)
        for (var i = 0; i < parserList.length; i++) {
            var parser = parserList[i];
            var match = tokenString.match(new RegExp(parser.regex));
            if (match) {
                console.log("match")
                var newParser = new Node();
                newParser.nameTag = parser.name
                var startIndex=0;
                var endIndex=0;
                if (parser.attributes && parser.attributes.length > 0) {
                    for (var j = 0; j < parser.attributes.length; j++) {
                      console.log("attribtueString: "+match[0])
                        var attribute = parser.attributes[j];
                        // calc position of attribute value
                        var beforeMatch = match[0].match(new RegExp(attribute.before));
                        console.log("before Match")
                      console.log(beforeMatch)
                        var afterMatch = match[0].match(new RegExp(attribute.after));
                        if (beforeMatch && afterMatch) {
                            var indexOfAfter = afterMatch.index;
                            var indexOfBefore = beforeMatch.index;
                            var beforeNodes = this.extractNodes(beforeMatch, tokenString, start, beforeMatch.index + match.index);
                          console.log("beforeNodes")
                          console.log(beforeNodes)
                          console.log("after match");
                          console.log(afterMatch)
                            var afterNodes = this.extractNodes(afterMatch, tokenString, start, afterMatch.index + match.index);
                            var children = start.children.slice(beforeNodes.endIndex + 1, afterNodes.startIndex);
                            console.log(afterNodes)
                            if(attribute.name==="content"){
                              newParser.beginning = beforeNodes.nodes;
                              newParser.ending = afterNodes.nodes;
                              newParser.children = children;
                              newParser.parent = start;
                              this.setParent(newParser.children, newParser);
                              this.setParent(newParser.beginning, newParser);
                              this.setParent(newParser.ending, newParser);
                              startIndex=beforeNodes.startIndex;
                              endIndex=afterNodes.endIndex+1;
                            }
                            var attributeValue = match[0].substring(indexOfBefore + beforeMatch[0].length, indexOfAfter);
                            newParser.attributes[attribute.name]={name: attribute.name, value: attributeValue.trim()}
                         
                        } else {
                            console.log("Attribute " + attribute.name + " not found.")
                        }
                    }
                }
                start.children.splice(beforeNodes.startIndex, afterNodes.endIndex + 1, newParser);
                tokenString = tokenString.substring(0, match.index) + " " + parser.name + " " + tokenString.substring(match.index + match[0].length);
            }
        }
    }
    /**
     * Removes a specific line.
     * @param line Line which should
     */
    removeLine(line) {
        var searchedLine = this.findLine(line);
        
        if (searchedLine === null) {
            console.log("Could'nt remove line " + line + ", because line was not found.")
        }
        var parent = searchedLine.parent;
        if (parent.children.indexOf(searchedLine) !== -1) {
            parent.children.splice(parent.children.indexOf(searchedLine), 1);

        } else {
            if(parent.beginning.indexOf(searchedLine) !== -1){
              parent.beginning.splice(parent.beginning.indexOf(searchedLine), 1);
            }else{
              parent.ending.splice(parent.ending.indexOf(searchedLine), 1);
            }
            this.moveNodeHigher(parent);
        }
    }
    registerGapsInLine(tokenizedLine,line){
      for(var i=0;i<tokenizedLine.children.length;i++){
        for(var key in tokenizedLine.children[i].attributes){
          if(tokenizedLine.children[i].attributes[key].value==="'gap'"){
            this.gaps.push({attribute:tokenizedLine.children[i].attributes[key],line:line});
          }
        }
      }
      this.gaps.sort(this.gapSortFunction);
    }
    /**
    Removes a given attribute from the list of gaps
    */
    removeAttributeInGaps(attribute){
      for(var i=0;i<this.gaps.length;i++){
        if(this.gaps[i].attribute===attribute){
          this.gaps.splice(i,1);
        }
      }
    }
  gapSortFunction(a,b){
    if(a.line<b){
      return -1;
    }
    if(a.line>b){
      return 1;
    }
    return 0;
  }
  /**
  Finds the position of an attribute in a line and returns the character position
  */
    getGapCh(line,attribute){
      var searchedLine= this.findLine(line);
      var parent=searchedLine;
      var codeString="";
      var level=-1;
      while(parent.parent){
        if(parent.parent.children.indexOf(parent)!==-1){
           level++;
        }
        parent=parent.parent;
      }
    
      for(var i=0;i<searchedLine.children.length;i++){
        var token= searchedLine.children[i];
        var index= this.findTokenIndex(token.nameTag);
        var syms=tokenList[index].codeEquivalent.split(" ");
        
        if(token.nameTag==="unfinished"){
              codeString+=token.matchedCode;
              continue;
          }
          for(var j=0;j<syms.length;j++){
              if(syms[j].startsWith("$")){
                  if(token.attributes[syms[j].substring(1)]){
                    if(token.attributes[syms[j].substring(1)].value!=="'gap'"){
                      codeString+=token.attributes[syms[j].substring(1)].value;
                    }else{
                      if(token.attributes[syms[j].substring(1)]===attribute){
                        return codeString.length+level;
                      }
                    }
                  }
              }else{
                  if(syms[j]==="\\s"){
                      codeString+=" ";
                  }else{
                      codeString+=syms[j];
                  }
              }
          }
      }
      return -1;
    }
    findNextGap(line,ch){
      var possibleGaps=[];
      for(var i=0;i<this.gaps.length;i++){
        if(this.gaps[i].line>=line){
          possibleGaps.push(this.gaps[i]);
        }
      }
      var posSol=null;
      for(var i=0;i<possibleGaps.length;i++){
        if(posSol===null||(possibleGaps[i].line<=posSol.line)&&possibleGaps[i].ch<posSol.ch){
          var newCh= this.getGapCh(possibleGaps[i].line,possibleGaps[i].attribute);
          if(possibleGaps[i].line>line||(possibleGaps[i].line===line&&newCh>ch)){
            posSol={line:possibleGaps[i].line,ch:newCh};
          }
        }
      }
      return posSol;
    }
    /**
     * Updates a single line of code with a tokenized string.
     * @param topNode Root Node
     * @param line Line which is updated.
     * @param content New content of line
     * @returns {*} The line with the new content or null if update failed.
     */
    updateLine(line, content) {     
        var searchedLine = this.findLine(line);
        var tokenizedLine = this.tokenizeLine(content);
        if (searchedLine && searchedLine.parent) {
            var parent = searchedLine.parent;
            tokenizedLine.parent = parent;
            if (parent.beginning.indexOf(searchedLine) !== -1) {
                if(this.updateChangedTokens(searchedLine,tokenizedLine)) {
                    this.registerGapsInLine(tokenizedLine,line);
                    parent.beginning[parent.beginning.indexOf(searchedLine)] = tokenizedLine;
                    this.moveNodeHigher(parent, searchedLine);
                    this.parse(tokenizedLine)
                }
                return tokenizedLine;
            }
            if (parent.children.indexOf(searchedLine) !== -1) {
                if(this.updateChangedTokens(searchedLine,tokenizedLine)) {
                   console.log("inside this thing")
                    this.registerGapsInLine(tokenizedLine,line);
                    parent.children[parent.children.indexOf(searchedLine)] = tokenizedLine;
                    this.parse(tokenizedLine)
                }
                return tokenizedLine;
            }
            if (parent.ending.indexOf(searchedLine) !== -1) {
                if(this.updateChangedTokens(searchedLine,tokenizedLine)) {
                    this.registerGapsInLine(tokenizedLine,line);
                    parent.ending[parent.ending.indexOf(searchedLine)] = tokenizedLine;
                    this.moveNodeHigher(parent, searchedLine);
                    this.parse(tokenizedLine)
                }
                return tokenizedLine;
            }
        } else {
            console.log("The line " + line + " you want to update does'nt exist. No parent for searched line was found");
            return null;
        }
    }
    /**
     * Checks if a line was structurally changed or if just the attributes changed. If nothing has changed it also replaces the attributes of the old line with the ones of the new line.
     * @param searchedLine Old line
     * @param tokenizedLine New line based on tokenized content
     * @returns {boolean} Returns true if something has changed.
     */
    updateChangedTokens(searchedLine,tokenizedLine){
      console.log("inside")
        if(searchedLine.protected){
          var tokLineString= this.reconstructTokenCode(tokenizedLine);
          console.log(searchedLine);
          console.log(tokLineString)
          for(var i=0;i<searchedLine.children.length;i++){
            var regex=this.getTokenRegex(searchedLine.children[i].nameTag);
            var partialMatch=this.Utils.partialMatch(regex,tokLineString);
            for(var j=1;j<tokLineString.length;j++){
              var matchString = tokLineString.substring(0,j)
              if(partialMatch[0]){
                partialMatch=this.Utils.partialMatch(regex,matchString);
              }
            }
            console.log(tokLineString)
            console.log(partialMatch)
            if(partialMatch[0]&&partialMatch[1].index===0){
              console.log("partial match: "+partialMatch[1][0])
              tokLineString=tokLineString.substring(partialMatch[1][0].length);
              searchedLine.children[i].matchedCode=partialMatch[1]
              this.calcAttributesProtected(this.findTokenIndex(searchedLine.children[i].nameTag),tokLineString,searchedLine.children[i]);
            }
          }
          console.log("after.... "+tokLineString)
          if(tokLineString.length===0){
            return true;
          }
          searchedLine.protected=false;
          console.log("updatechange is false");
        }
        if(searchedLine.children.length!==tokenizedLine.children.length){
            return true;
        }
        for(var i=0;i<searchedLine.children.length;i++){
            if(searchedLine.children[i].nameTag!==tokenizedLine.children[i].nameTag){
                return true;
            }
        }
        
        for(var i=0;i<searchedLine.children.length;i++){
          for (var key in searchedLine.children[i].attributes) {
            if(searchedLine.children[i].attributes[key].value==="'gap'"&&tokenizedLine.children[i].attributes[key]&&tokenizedLine.children[i].attributes[key].value===""){  
              console.log("gap not replaced")
            }else{
              if(searchedLine.children[i].attributes[key].value==="'gap'"){
                this.removeAttributeInGaps(searchedLine.children[i].attributes[key]);
              }
              searchedLine.children[i].attributes[key].value=tokenizedLine.children[i].attributes[key].value;
            }
          }
          searchedLine.children[i].matchedCode=tokenizedLine.children[i].matchedCode;
        }
        console.log("nothing has changed")
        return false;
    }
  
  makeLineProtected(line){
    var searchedLine= this.findLine(line);
    searchedLine.protected=true;
  }
    calcAttributesProtected(tokenListIndex,string,el){
      var tokenEl= tokenList[tokenListIndex];
      for(var i=0;i<tokenEl.attributes.length;i++){
        var attribute = tokenEl.attributes[i];
        if(attribute.value===gapSym){
          continue;
        }
        // calc position of attribute value
        var beforeMatch = string.match(new RegExp(attribute.before));
        var afterMatch = string.match(new RegExp(attribute.after));

        if (beforeMatch && afterMatch) {
            var indexOfAfter = afterMatch.index;
            var indexOfBefore = beforeMatch.index;
            var attributeValue = string.substring(indexOfBefore + beforeMatch[0].length, indexOfAfter);
            el.attributes[attribute.name]={name: attribute.name, value: attributeValue.trim()}
        } else {
            console.log("Attribute " + attribute.name + " not found.")
        }
      }
      return el;
    }
  
    getTokenRegex(tokenName){
      console.log("looking for regex "+tokenName)
      var index= this.findTokenIndex(tokenName);
      console.log("index "+index)
      if(index===-1){
        return null;
      }
      return tokenList[index].regex;
    }
    /**
     * Moves all subnodes of parsed node one level higher
     * @param root Node that is supposed to be removed
     */
    moveNodeHigher(root) {
        var concatChild = root.beginning.concat(root.children, root.ending);

        if (root.parent.beginning.indexOf(root) !== -1) {
            var index = root.parent.beginning.indexOf(root);
            root.parent.beginning.splice(index, 1, ...concatChild);
            this.setParent(root.parent.beginning, root.parent);
            return
        }
        if (root.parent.children.indexOf(root) !== -1) {
            var index = root.parent.children.indexOf(root);
            root.parent.children.splice(index, 1, ...concatChild);
            this.setParent(root.parent.children, root.parent);
            return
        }
        if (root.parent.ending.indexOf(parent) !== -1) {
            var index = root.parent.ending.indexOf(root);
            root.parent.ending.splice(index, 1, ...concatChild);
            this.setParent(root.parent.ending, root.parent);
            return
        }
    }
    /**
     * Adds a new line at a specific position
     * @param topNode Root of tree
     * @param line Position at which to insert the line
     * @returns {null} Newly inserted line or null if line could not be inserted
     */
    addNewLine(line) {
        var newLine = new Node();
        newLine.nameTag = "line"
        if (line === 0) {
            this.root.children.splice(0, 0, newLine)
            newLine.parent = this.root;
            return newLine;
        }
        if (this.root.beginning.length + this.root.children.length + this.root.ending.length === 0) {
            newLine.parent = this.root;
            this.root.children.push(newLine);
            return newLine;
        }
        var searchedLine = this.findLine(line);
     
        if (searchedLine === null) {
            console.log("Error: serachedLine: " + line + " can not be found.")
            return null;
        }
        var parent = searchedLine.parent;
        if (parent && parent.children.indexOf(searchedLine) !== -1) {
          
            var index = parent.children.indexOf(searchedLine);
            newLine.parent = parent;
            parent.children.splice(index + 1, 0, newLine);
            return newLine;
        }
        if(parent && parent.beginning.indexOf(searchedLine)!==-1){
          newLine.parent=parent;
          parent.children.splice(0,0,newLine);
          return newLine;
        }
      if(parent&&parent.ending.indexOf(searchedLine)!==-1){
        newLine.parent=parent.parent;
        var index=parent.parent.children.indexOf(parent);
        parent.parent.children.splice(index+1,0,newLine);
        return newLine;
      }

        console.log("Error: Line could not be inserted at pos: " + line);
        //line could not be inserted
        return null;

    }
  
    findLine(line){
      var beginningLength = this.calcLength(this.root.beginning);
        var childrenLength = this.calcLength(this.root.children);
        var endingLength = this.calcLength(this.root.ending);
        
        if (line <= beginningLength) {
            return this.findLineInArray(this.root.beginning, line, 0);
        }
        if (line <= beginningLength + childrenLength ) {
            return this.findLineInArray(this.root.children, line, beginningLength);

        }
        if (line <= beginningLength + childrenLength + endingLength) {
            return this.findLineInArray(this.root.ending, line, beginningLength+childrenLength);
        }
        //line not found
        return null;
    }
    /**
     * Finds a specific line in the Tree
     * @param topNode Top node from which to start the search
     * @param line Line to be found
     * @param currentLine currentline counter
     * @returns {*} The searched line or null if line was not found
     */
    findLineHelper(topNode, line, currentLine) {
        var beginningLength = this.calcLength(topNode.beginning);
        var childrenLength = this.calcLength(topNode.children);
        var endingLength = this.calcLength(topNode.ending);
        
        if (line <= beginningLength + currentLine) {
            return this.findLineInArray(topNode.beginning, line, currentLine);
        }
        if (line <= beginningLength + childrenLength + currentLine) {
            return this.findLineInArray(topNode.children, line, currentLine+beginningLength);

        }
        if (line <= beginningLength + childrenLength + endingLength + currentLine) {
            return this.findLineInArray(topNode.ending, line, currentLine+beginningLength+childrenLength);
        }
        //line not found
        return null;
    }
    /**
     * Finds a specific line in an array of nodes
     * @param nodeArray Array of nodes
     * @param line Line number to be found
     * @param currentLine The current linecounter
     * @returns {*} Node object representing the line
     */
    findLineInArray(nodeArray, line, currentLine) {

        var currentLineCounter = currentLine;
        for (var i = 0; i < nodeArray.length; i++) {
            var lineSearch = null;
            if (nodeArray[i].nameTag === "line") {
                currentLineCounter++;
            } else {
                lineSearch = this.findLineHelper(nodeArray[i], line, currentLineCounter);
                if (lineSearch !== null) {
                    return lineSearch;
                }else{
                  console.log("updted currentLine")
                  currentLineCounter+=this.calcLength([nodeArray[i]]);
                }
            }

            if (currentLineCounter === line) {
                return nodeArray[i];
            }
        }
        //line not found
        return null;
    }
    /**
     * Calculates the number of lines a nodes occupies
     * @param array Array with nodes
     * @returns {number} Number of lines
     */
    calcLength(node) {
        var length = 0;
        for (var i = 0; i < node.length; i++) {
            if (node[i].nameTag === "line") {
                length++;
            } else {
                length += this.calcLength(node[i].beginning) + this.calcLength(node[i].children) + this.calcLength(node[i].ending);
            }
        }
        return length;
    }
    /**
     * Finds the index of a token in the tokenlist
     * @param tokenName Name of the token you want to find
     * @returns {number} Return index of the token or -1 if token was'nt found
     */
    findTokenIndex(tokenName){
        for(var i=0;i<tokenList.length;i++){
            if(tokenList[i].token===tokenName){
                return i;
            }
        }
        return -1;
    }
      /**
     * Returns a string with formatted code according to code tree. Only takes the root node as input.
     * @param root Root node of the code tree
     * @returns {*} Returns code as string with no newline at the end.
     */
    tree2Code(){
        var code=this.tree2CodeHelper(this.root,-1);
        code=code.replace(/\n$/, "");
        return code;
    }
    /**
     * Returns a string with formatted code according to code tree
     * @param root Root node of the code tree
     */
    tree2CodeHelper(root,level){
        if(root.nameTag==="line"){
            return this.indentString(this.reconstructTokenCode(root),level);
        }
        var string="";
        if(root.beginning.length>0){
            for(var i=0;i<root.beginning.length;i++){
                string+=this.tree2CodeHelper(root.beginning[i],level);
            }
        }
        if(root.children.length>0){
            for(var i=0;i<root.children.length;i++){
                string+=this.tree2CodeHelper(root.children[i],level+1);
            }
        }
        if(root.ending.length>0){
            for(var i=0;i<root.ending.length;i++){
                string+=this.tree2CodeHelper(root.ending[i],level);
            }
        }
        return string;
    }
    /**
     * Reconstructs a line of code from a line of tokens
     * @param line Line node which is to be transformed
     * @returns {string} Line of code
     */
    reconstructTokenCode(line){
        var result="";
        var tokens=line.children;
        for(var i=0;i<tokens.length;i++){
            if(tokens[i].nameTag==="unfinished"){
                result+=tokens[i].matchedCode;
                continue;
            }
            var index= this.findTokenIndex(tokens[i].nameTag);
            var syms=tokenList[index].codeEquivalent.split(" ");
            for(var j=0;j<syms.length;j++){
                if(syms[j].startsWith("$")){
                    if(tokens[i].attributes[syms[j].substring(1)]&&tokens[i].attributes[syms[j].substring(1)].value!=="'gap'"){
                        result+=tokens[i].attributes[syms[j].substring(1)].value;
                    }
                }else{
                    if(syms[j]==="\\s"){
                        result+=" ";
                    }else{
                        result+=syms[j];
                    }
                }
            }
        }
        return result+"\n"
    }
    /**
     * Indents a string to a certain level
     * @param level number of indentations
     * @param string String that should be indented
     * @returns {string} Return the indented string
     */
    indentString(string,level){
        var indentation="";
        for(var i=0;i<level;i++){
            indentation+=" ";
        }
        return indentation+string;
    }

}




























