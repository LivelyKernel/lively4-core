# Template-based Code Completion
This component allows for context dependend highly adaptable codecompletions. They are integrated into a codemirror instance and can easily be adjusted by feeding new completion objects into the system. 

## Features
- Context sensitive
- Based on incremental editing
- Robust against errors or uncompleted lines in the code
- Supports gaps in code lines
- Designed to support constraints between attributes(e.g. variable values/names)
- Highly customizable & easy to extend to other languages

## Usage/Editor hotkeys
To use open the livelyCodecompletion component and start coding. At any point in the code you can press one of the hotkeys, which will look for possible completions.
| Hotkey | Function |
| ------ | ------ |
| Alt-1 | Triggers auto completions menue |
| Alt-2 | Finds previous gap (not yet implemented) |
| Alt-3 | Finds next gap |
| Ctrl-Space | Triggers the default codemirror auto completion menue |
## Currently supported completions

## CodeTree
This component is based on code represenation which allows for projectional editing. This tree is build as follows. 
### Node
The core unit is a Node object with the following attributes.
| Attribute | Explanation |
| ------ | ------ |
|nameTag | name of the unit |
| attributes | represent the smallest unit e.g. variable names or values |
| beginning | Contains all Nodes that represent the first line of block |
| ending | Contains all Nodes that represent the last line a block |
| children | Contains all nodes between the first and last line of a block |
| matchedCode | the code that was parsed to create this node |
| parent | The next layer i.e. parent node |
| protected | is an experimental feature to protect auto completed blocks |

Since everything in this component is line based, there is also a special line node. This line has the nametag 'line' and is for example used to find a specific position in the code represention.

### CodeTree
Is an object that manages all changes in the code. 
Starting point of each operation is the root, which is also an attribute of the CodeTree object.
It provides the following functions
| Function | Explanation |
| ------ | ------ |
|findNexGap( currLine, currCh ) | Looks for the next gap in the code starting at the current cursor position and returns the position of that gap |
|addNewLine(linePos) | Inserts an empty line before the given position |
|updateLine( line, content ) | updates the given line with the new content and ensures that all scopes are still valid |
|findLine (linePos) | Returns the searched line or null if the line was not found |
|removeLine( linePos) | Removes the line at the given position |
|tree2Code | Returns a string representation of the codeTree with indentations for recognized code blocks |

There are other functions that are primarily used internally and I suggest to not use them outside of the codeTree object.

### Tokenparsing
Tokens represent the smallest logical unit in the codeTree. They are supposed to be small keywords or low level logical units like statements. 
The tokens are defined by a tokenList, which can be found in the codeTree file (probably not the ideal location...). The tokenList contains objects with the attributes:
| Attribute | Explanation |
| ------ | ------ |
|regex | Regular expression that matches the token. |
|token | Nametag for the token |
|attributes | An array that contains informations about attributes that contained in the token. The attribute objects contain Information about: The attribute name, a regex of the code that comes before the attribute and a regex for the code that comes after the attribute |
|codeEquivalent | Used to transform the codeTree back to real code. attributes can be inserted via $attrName  |
The parsing always starts at the beginning of a codeline and tries to match one of the tokens from the tokenList, therefore if multiple tokens are possible the one that appears first in the list is used. Code that is not recognized is tagged as 'unfinished'. As long as only attributes changed and no tokens, the line is not parsed from scratch, instead only the attributes are updated. This is meant to preserves constraints and gaps in the line.

### Blockparsing
The blockparsing is used to create codeblocks/ recognize scopes. This is managed through the parserList, which is defined in the codeTree file.

| Attribute | Explanation |
| ------ | ------ |
|regex | Regular expression that matches the block. |
|name | Nametag for the block |
|attributes | An array that contains informations about attributes that contained in the token. The attribute objects contain Information about: The attribute name, a regex of the code that comes before the attribute and a regex for the code that comes after the attribute. One of the attributes has to be content, which represents everything inside a code block. Everything before the content will be assumed to be the first line of the block and everything afterwards the last line. |

For the block parsing the codeTree object creates a string containing all nameTags of the tokens or blocks contained in the current scope seperated by spaces. This string is then used to match the regexes of the parserList.

### Gaps

To insert a gap, insert 'gap' somewhere in a completion. Gaps are marked as gaps in the attribute field of a token. As long as that attribute isn't otherwise assigned the gap is preserved. This works fine as long as the line is only updated and not completely parsed from scratch, since this would remove all existing gaps in this line.

There is already an attempt to make this more stable, which is not working so far (see protected attr.).


### Constraints
Constraints are so far only prepared and not yet supported. 
All constraints are saved in an array which is located in the constraints.js file as objects with the following attributes:
| Attribute | Explanation |
| ------ | ------ |
|nodeList | List of all nodes that are affected by the constraint |
|attrList | List of all attr that are affected by the constraint |
|lastVals | List of the values the attr had after the last enforcing of the constraint |
|funcSign | Function that enforces the constraint, which takes the parameters nodeList, attrList, lastVals|


## How to customize/add completions 
All the completions are contained in the completion.js file. It has an attribute completions which is in array with all supported completions.

| Attribute | Explanation |
| ------ | ------ |
|regex | Regular expression that matches the block. |
|displayText | A one sentence long text, that can used to show what the completion does. At the moment it is mostly the first line of the completion |
|explanation | A longer explanation of what the completion does. This explanation is only shown, when the corresponding completion is selected in the completion menue. |
|codeLines | An array with the code that is to be completed, seperated by lines. |
|contextFunc ( line, root ) | Function that returns a boolean and calculates if a completion is possible in the current context. |
|applyFunc (cm, codelines, updateValue, codeTree) | Function that is used to apply the chosen completion. This is especially useful if you want to complete code at non consecutive positions e.g. import statements. |
|adaptCompletionFunc (codelines, root, line | This function is used to apply changes to the codelines. This can be useful if the content of the completion is context dependent. |

To add a completion simply add an entry in the completions array and make sure, that every mentioned attribute is provided.

## TODO/ Future work
 - support multiline operations (copy paste, delete multiple lines, etc.)  (almost done)
 - fix delete bug (also pretty much done I hope)
 - ranking of completion suggestions
 - Dynamic addition of completions
    - Automatically add completions during coding
    - e.g. variables are safed as completions with the according context condition
- Make gaps more robust
    - Maybe directly change codeTree instead of parsing each line   
- Find a way to reuse context & constraint functions
- Abstract to not be limited to lines
