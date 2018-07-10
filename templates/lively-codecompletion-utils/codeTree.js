import Node from './node.js'
import PrintUtils from './print.js'

var tokenList = [
    {regex:"\n",token:"newline",attributes:[],codeEquivalent:""},
    {regex: "<gap>",token:"gap",attributes:[],codeEquivalent:""},
    {regex: "for", token: "for", attributes: [],codeEquivalent:"for"},
    {
        regex: "var .*?=.*?;",
        token: "statement",
        attributes: [{name: "var", before: "var", after: "="}, {name: "val", before: "=", after: ";"}],
        context: {},
        codeEquivalent:"var \\s $var \\s = \\s $val ;"
    },
    {
        regex: "[^(\\(|\\n|;|\{|\})]*\?((==)|&&|(\\|\\|)|<|>|<=|>=)(.*\?);",
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

var parserList = [
    {
        name: "forLoop",
        context: [{name: "", attribute: []}],
        regex: "for\\sopenBracket\\sstatement\\scondition\\sincrement\\scloseBracket\\s(openBrace)\\snewline((?!(closeBrace)).)*\\scloseBrace(\\snewline|$)",
        attributes: [
            {
                name: "content",
                before: "for\\sopenBracket\\sstatement\\scondition\\sincrement\\scloseBracket\\sopenBrace\\snewline",
                after: "closeBrace(\\snewline|$)"
            }],
    }
]
export default class CodeTree {
  
    constructor() {
        this.gaps=[]
        this.root=null;
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
              console.log("unfinished:"+unfinished)
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
                result += " " + node.children[i].nameTag;
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
        var matchLength = tokenString.substring(index, index + match[0].length).split(" ").length;
        var tokensBefore = tokenString.substring(0, index).trim().split(" ").length
        if (tokenString.substring(0, index) === "") {
            tokensBefore = 0;
        }
        var tokenCounter = 0;
        var startIndex = 0;
        var endIndex = 0;
        for (var i = 0; i < parent.children.length; i++) {
            if (tokenCounter === tokensBefore) {
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
        }
        return {nodes: parent.children.slice(startIndex, endIndex + 1), startIndex: startIndex, endIndex: endIndex}
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
                if (parser.attributes && parser.attributes.length > 0) {
                    for (var j = 0; j < parser.attributes.length; j++) {
                        var attribute = parser.attributes[j];
                        // calc position of attribute value
                        var beforeMatch = match[0].match(new RegExp(attribute.before));

                        var afterMatch = match[0].match(new RegExp(attribute.after));
                        if (beforeMatch && afterMatch) {
                            var indexOfAfter = afterMatch.index;
                            var indexOfBefore = beforeMatch.index;
                            var beforeNodes = this.extractNodes(beforeMatch, tokenString, start, beforeMatch.index + match.index);
                            var afterNodes = this.extractNodes(afterMatch, tokenString, start, afterMatch.index + match.index);
                            var children = start.children.slice(beforeNodes.endIndex + 1, afterNodes.startIndex);
                            newParser.beginning = beforeNodes.nodes;

                            newParser.ending = afterNodes.nodes;
                            newParser.children = children;
                            newParser.parent = start;
                            this.setParent(newParser.children, newParser);
                            this.setParent(newParser.beginning, newParser);
                            this.setParent(newParser.ending, newParser);
                            var attributeValue = match[0].substring(indexOfBefore + beforeMatch[0].length, indexOfAfter);
                            newParser.attributes[attribute.name]={name: attribute.name, value: attributeValue.trim()}
                            start.children.splice(beforeNodes.startIndex, afterNodes.endIndex + 1, newParser);
                        } else {
                            console.log("Attribute " + attribute.name + " not found.")
                        }
                    }
                }
                tokenString = tokenString.substring(0, match.index) + " " + parser.name + " " + tokenString.substring(match.index + match[0].length);
            }
        }
    }
    /**
     * Removes a specific line.
     * @param topNode Root node.
     * @param line Line which should
     */
    removeLine(topNode, line) {
        var searchedLine = this.findLine(topNode, line, 0);
        
        if (searchedLine === null) {
            console.log("Could'nt remove line " + line + ", because line was not found.")
        }
        var parent = searchedLine.parent;
        if (parent.children.indexOf(searchedLine) !== -1) {
            parent.children.splice(parent.children.indexOf(searchedLine), 1);

        } else {
            this.moveNodeHigher(parent, searchedLine);
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
      var searchedLine= this.findLine(this.root,line,0);
      var parent=searchedLine;
      var codeString="";
      var level=-1;
      console.log("searched")
      console.log(searchedLine);
      while(parent.parent){
        if(parent.parent.children.indexOf(parent)!==-1){
           level++;
        }
        parent=parent.parent;
      }
      console.log("level: "+level)
      // codeString=codeString.substring(1);
    
      for(var i=0;i<searchedLine.children.length;i++){
        var token= searchedLine.children[i];
        var index= this.findTokenIndex(token.nameTag);
        var syms=tokenList[index].codeEquivalent.split(" ");
        
        if(token.nameTag==="unfinished"){
              codeString+=token.matchedCode;
              continue;
          }
          for(var j=0;j<syms.length;j++){
            console.log("sym: "+codeString);
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
      console.log("possibleGaps");
      console.log(possibleGaps)
      for(var i=0;i<possibleGaps.length;i++){
        if(posSol===null||(possibleGaps[i].line<=posSol.line)&&possibleGaps[i].ch<posSol.ch){
          var newCh= this.getGapCh(possibleGaps[i].line,possibleGaps[i].attribute);
          console.log("newCH "+possibleGaps[i].attribute)
          console.log(newCh)
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
    updateLine(topNode, line, content) {
        var searchedLine = this.findLine(topNode, line, 0);
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
    addNewLine(topNode, line) {
        var newLine = new Node();
        newLine.nameTag = "line"
        if (line === 0) {
            topNode.children.splice(0, 0, newLine)
            newLine.parent = topNode;
            return newLine;
        }
        if (topNode.beginning.length + topNode.children.length + topNode.ending.length === 0) {
            newLine.parent = topNode;
            topNode.children.push(newLine);
            return newLine;
        }
        var searchedLine = this.findLine(topNode, line, 0);
     
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
    /**
     * Finds a specific line in the Tree
     * @param topNode Top node from which to start the search
     * @param line Line to be found
     * @param currentLine currentline counter
     * @returns {*} The searched line or null if line was not found
     */
    findLine(topNode, line, currentLine) {
        var beginningLength = this.calcLength(topNode.beginning);
        var childrenLength = this.calcLength(topNode.children);
        var endingLength = this.calcLength(topNode.ending);
        console.log(topNode.nameTag+"-> "+line);
        console.log("beginning: "+beginningLength);
      console.log("children: "+childrenLength);
      console.log("ending: "+endingLength)
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
                lineSearch = this.findLine(nodeArray[i], line, currentLineCounter);
                if (lineSearch !== null) {
                    return lineSearch;
                }else{
                  console.log("updted currentLine")
                  currentLineCounter+=this.calcLength([nodeArray[i]]);
                }
            }

            console.log("currentcounter "+currentLineCounter)
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
    tree2Code(root){
        var code=this.tree2CodeHelper(root,-1);
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




























