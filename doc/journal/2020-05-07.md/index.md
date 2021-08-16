## 2020-05-07 #ESLint Bug
*Author: @JensLincke*

in <src/external/eslint/eslint.js> there is a #bug, because it cannot handle:

```javscript
this.foo += 1
```

Here is the code that need to be fixed, but it is compiled at the moment...


```javascript
,{"../ast-utils":113,"../util/fix-tracker":401}],223:[function(require,module,exports){
/**
 * @fileoverview Rule to flag the use of empty character classes in regular expressions
 * @author Ian Christian Myers
 */

"use strict";

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

/*
 * plain-English description of the following regexp:
 * 0. `^` fix the match at the beginning of the string
 * 1. `\/`: the `/` that begins the regexp
 * 2. `([^\\[]|\\.|\[([^\\\]]|\\.)+\])*`: regexp contents; 0 or more of the following
 * 2.0. `[^\\[]`: any character that's not a `\` or a `[` (anything but escape sequences and character classes)
 * 2.1. `\\.`: an escape sequence
 * 2.2. `\[([^\\\]]|\\.)+\]`: a character class that isn't empty
 * 3. `\/` the `/` that ends the regexp
 * 4. `[gimuy]*`: optional regexp flags
 * 5. `$`: fix the match at the end of the string
 */

var regex = /^\/([^\\[]|\\.|\[([^\\\]]|\\.)+])*\/[gimuy]*$/;

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = {
    meta: {
        docs: {
            description: "disallow empty character classes in regular expressions",
            category: "Possible Errors",
            recommended: true
        },

        schema: []
    },

    create: function create(context) {
        var sourceCode = context.getSourceCode();

        return {
            Literal: function Literal(node) {
                var token = sourceCode.getFirstToken(node);

                if (token.type === "RegularExpression" && !regex.test(token.value)) {
                    context.report({ node: node, message: "Empty class." });
                }
            }
        };
    }
};
```