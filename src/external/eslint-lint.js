// CodeMirror Lint addon to use ESLint, copyright (c) by Angelo ZERR and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

// Depends on eslint.js from https://github.com/eslint/eslint
(function(CodeMirror) {
  
  const defaultConfig = {
    parserOptions: {
      ecmaVersion: 8,
      sourceType: "module",
      ecmaFeatures: {
        jsx: true,
        modules: true,
        experimentalObjectRestSpread: true
      }
    },
    env: {
        browser: true,
        node: false,
        amd: false,
        mocha: true,
        jasmine: false,
        es6: true
    },
    globals: {
        lively: true,
        aexpr: false,
        Promise: true,
        lively4url: true,
        System: true,
        SystemJS: true,
        CodeMirror: true,
        Map: true,
        Set: true,
    },
    //extends: "eslint:recommended", // seems not to work
    rules: {
      // https://eslint.org/docs/rules/
      // generated using:
      //   Array.from(this.querySelectorAll("tr")).map(tr => {
      //     const ok = !!tr.querySelector(".glyphicon-ok");
      //     const children = Array.from(tr.querySelectorAll("p"));
      //     const label = children[0].textContent
      //     const comment = children[1].textContent
      //     return `${ok ? "" : "//"} "${label}": ["error"], // ${comment}`  
      //   }).join("\n");

      // "for-direction": 2, // enforce “for” loop update clause moving the counter in the right direction.
      // "getter-return": 2, // enforce return statements in getters
      // "no-await-in-loop": 2, // disallow await inside of loops
      "no-compare-neg-zero": 2, // disallow comparing against -0
      "no-cond-assign": 2, // disallow assignment operators in conditional expressions
      "no-console": [1, { allow: ["warn", "error"] }], // disallow the use of console
      "no-constant-condition": 2, // disallow constant expressions in conditions
      "no-control-regex": 2, // disallow control characters in regular expressions
      "no-debugger": 2, // disallow the use of debugger
      "no-dupe-args": 2, // disallow duplicate arguments in function definitions
      "no-dupe-keys": 2, // disallow duplicate keys in object literals
      "no-duplicate-case": 2, // disallow duplicate case labels
      "no-empty": 2, // disallow empty block statements
      "no-empty-character-class": 2, // disallow empty character classes in regular expressions
      "no-ex-assign": 2, // disallow reassigning exceptions in catch clauses
      "no-extra-boolean-cast": 2, // disallow unnecessary boolean casts
      // "no-extra-parens": 2, // disallow unnecessary parentheses
      "no-extra-semi": 2, // disallow unnecessary semicolons
      "no-func-assign": 2, // disallow reassigning function declarations
      "no-inner-declarations": 2, // disallow variable or function declarations in nested blocks
      "no-invalid-regexp": 2, // disallow invalid regular expression strings in RegExp constructors
      "no-irregular-whitespace": 2, // disallow irregular whitespace outside of strings and comments
      "no-obj-calls": 2, // disallow calling global object properties as functions
      // "no-prototype-builtins": 2, // disallow calling some Object.prototype methods directly on objects
      "no-regex-spaces": 2, // disallow multiple spaces in regular expressions
      "no-sparse-arrays": 2, // disallow sparse arrays
      // "no-template-curly-in-string": 2, // disallow template literal placeholder syntax in regular strings
      "no-unexpected-multiline": 2, // disallow confusing multiline expressions
      "no-unreachable": 2, // disallow unreachable code after return, throw, continue, and break statements
      "no-unsafe-finally": 2, // disallow control flow statements in finally blocks
      "no-unsafe-negation": 2, // disallow negating the left operand of relational operators
      "use-isnan": 2, // require calls to isNaN() when checking for NaN
      // "valid-jsdoc": 2, // enforce valid JSDoc comments
      "valid-typeof": 2, // enforce comparing typeof expressions against valid strings
      // "accessor-pairs": 2, // enforce getter and setter pairs in objects
      // "array-callback-return": 2, // enforce return statements in callbacks of array methods
      // "block-scoped-var": 2, // enforce the use of variables within the scope they are defined
      // "class-methods-use-this": 2, // enforce that class methods utilize this
      // "complexity": 2, // enforce a maximum cyclomatic complexity allowed in a program
      // "consistent-return": 2, // require return statements to either always or never specify values
      // "curly": 2, // enforce consistent brace style for all control statements
      // "default-case": 2, // require default cases in switch statements
      // "dot-location": 2, // enforce consistent newlines before and after dots
      // "dot-notation": 2, // enforce dot notation whenever possible
      // "eqeqeq": 2, // require the use of === and !==
      // "guard-for-in": 2, // require for-in loops to include an if statement
      // "no-alert": 2, // disallow the use of alert, confirm, and prompt
      // "no-caller": 2, // disallow the use of arguments.caller or arguments.callee
      "no-case-declarations": 2, // disallow lexical declarations in case clauses
      // "no-div-regex": 2, // disallow division operators explicitly at the beginning of regular expressions
      // "no-else-return": 2, // disallow else blocks after return statements in if statements
      // "no-empty-function": 2, // disallow empty functions
      "no-empty-pattern": 2, // disallow empty destructuring patterns
      // "no-eq-null": 2, // disallow null comparisons without type-checking operators
      // "no-eval": 2, // disallow the use of eval()
      // "no-extend-native": 2, // disallow extending native types
      // "no-extra-bind": 2, // disallow unnecessary calls to .bind()
      // "no-extra-label": 2, // disallow unnecessary labels
      "no-fallthrough": 2, // disallow fallthrough of case statements
      // "no-floating-decimal": 2, // disallow leading or trailing decimal points in numeric literals
      "no-global-assign": 2, // disallow assignments to native objects or read-only global variables
      // "no-implicit-coercion": 2, // disallow shorthand type conversions
      // "no-implicit-globals": 2, // disallow variable and function declarations in the global scope
      // "no-implied-eval": 2, // disallow the use of eval()-like methods
      // "no-invalid-this": 2, // disallow this keywords outside of classes or class-like objects
      // "no-iterator": 2, // disallow the use of the __iterator__ property
      // "no-labels": 2, // disallow labeled statements
      // "no-lone-blocks": 2, // disallow unnecessary nested blocks
      // "no-loop-func": 2, // disallow function declarations and expressions inside loop statements
      // "no-magic-numbers": 2, // disallow magic numbers
      // "no-multi-spaces": 2, // disallow multiple spaces
      // "no-multi-str": 2, // disallow multiline strings
      // "no-new": 2, // disallow new operators outside of assignments or comparisons
      // "no-new-func": 2, // disallow new operators with the Function object
      // "no-new-wrappers": 2, // disallow new operators with the String, Number, and Boolean objects
      "no-octal": 2, // disallow octal literals
      // "no-octal-escape": 2, // disallow octal escape sequences in string literals
      // "no-param-reassign": 2, // disallow reassigning function parameters
      // "no-proto": 2, // disallow the use of the __proto__ property
      "no-redeclare": 2, // disallow variable redeclaration
      // "no-restricted-properties": 2, // disallow certain properties on certain objects
      // "no-return-assign": 2, // disallow assignment operators in return statements
      // "no-return-await": 2, // disallow unnecessary return await
      // "no-script-url": 2, // disallow javascript: urls
      "no-self-assign": 2, // disallow assignments where both sides are exactly the same
      // "no-self-compare": 2, // disallow comparisons where both sides are exactly the same
      // "no-sequences": 2, // disallow comma operators
      "no-throw-literal": 1, // disallow throwing literals as exceptions
      // "no-unmodified-loop-condition": 2, // disallow unmodified loop conditions
      // "no-unused-expressions": 2, // disallow unused expressions
      "no-unused-labels": 1, // disallow unused labels
      // "no-useless-call": 2, // disallow unnecessary calls to .call() and .apply()
      // "no-useless-concat": 2, // disallow unnecessary concatenation of literals or template literals
      "no-useless-escape": 1, // disallow unnecessary escape characters
      // "no-useless-return": 2, // disallow redundant return statements
      // "no-void": 2, // disallow void operators
      // "no-warning-comments": 2, // disallow specified warning terms in comments
      "no-with": 1, // disallow with statements
      // "prefer-promise-reject-errors": 2, // require using Error objects as Promise rejection reasons
      // "radix": 2, // enforce the consistent use of the radix argument when using parseInt()
      // "require-await": 2, // disallow async functions which have no await expression
      // "vars-on-top": 2, // require var declarations be placed at the top of their containing scope
      // "wrap-iife": 2, // require parentheses around immediate function invocations
      // "yoda": 2, // require or disallow “Yoda” conditions
      // "strict": 2, // require or disallow strict mode directives
      // "init-declarations": 2, // require or disallow initialization in variable declarations
      // "no-catch-shadow": 2, // disallow catch clause parameters from shadowing variables in the outer scope
      "no-delete-var": 2, // disallow deleting variables
      // "no-label-var": 2, // disallow labels that share a name with a variable
      // "no-restricted-globals": 2, // disallow specified global variables
      // "no-shadow": 2, // disallow variable declarations from shadowing variables declared in the outer scope
      // "no-shadow-restricted-names": 2, // disallow identifiers from shadowing restricted names
      "no-undef": 2, // disallow the use of undeclared variables unless mentioned in /*global */ comments
      // "no-undef-init": 2, // disallow initializing variables to undefined
      // "no-undefined": 2, // disallow the use of undefined as an identifier
      "no-unused-vars": 1, // disallow unused variables
      // "no-use-before-define": 2, // disallow the use of variables before they are defined
      // "callback-return": 2, // require return statements after callbacks
      // "global-require": 2, // require require() calls to be placed at top-level module scope
      // "handle-callback-err": 2, // require error handling in callbacks
      // "no-buffer-constructor": 2, // disallow use of the Buffer() constructor
      // "no-mixed-requires": 2, // disallow require calls to be mixed with regular variable declarations
      // "no-new-require": 2, // disallow new operators with calls to require
      // "no-path-concat": 2, // disallow string concatenation with __dirname and __filename
      // "no-process-env": 2, // disallow the use of process.env
      // "no-process-exit": 2, // disallow the use of process.exit()
      // "no-restricted-modules": 2, // disallow specified modules when loaded by require
      // "no-sync": 2, // disallow synchronous methods
      // "array-bracket-newline": 2, // enforce linebreaks after opening and before closing array brackets
      // "array-bracket-spacing": 2, // enforce consistent spacing inside array brackets
      // "array-element-newline": 2, // enforce line breaks after each array element
      // "block-spacing": 2, // disallow or enforce spaces inside of blocks after opening block and before closing block
      // "brace-style": 2, // enforce consistent brace style for blocks
      // "camelcase": 2, // enforce camelcase naming convention
      // "capitalized-comments": 2, // enforce or disallow capitalization of the first letter of a comment
      // "comma-dangle": 2, // require or disallow trailing commas
      // "comma-spacing": 2, // enforce consistent spacing before and after commas
      // "comma-style": 2, // enforce consistent comma style
      // "computed-property-spacing": 2, // enforce consistent spacing inside computed property brackets
      // "consistent-this": 2, // enforce consistent naming when capturing the current execution context
      // "eol-last": 2, // require or disallow newline at the end of files
      // "func-call-spacing": 2, // require or disallow spacing between function identifiers and their invocations
      // "func-name-matching": 2, // require function names to match the name of the variable or property to which they are assigned
      // "func-names": 2, // require or disallow named function expressions
      // "func-style": 2, // enforce the consistent use of either function declarations or expressions
      // "function-paren-newline": 2, // enforce consistent line breaks inside function parentheses
      // "id-blacklist": 2, // disallow specified identifiers
      // "id-length": 2, // enforce minimum and maximum identifier lengths
      // "id-match": 2, // require identifiers to match a specified regular expression
      // "implicit-arrow-linebreak": 2, // enforce the location of arrow function bodies
      // "indent": 2, // enforce consistent indentation
      // "jsx-quotes": 2, // enforce the consistent use of either double or single quotes in JSX attributes
      // "key-spacing": 2, // enforce consistent spacing between keys and values in object literal properties
      // "keyword-spacing": 2, // enforce consistent spacing before and after keywords
      // "line-comment-position": 2, // enforce position of line comments
      // "linebreak-style": 2, // enforce consistent linebreak style
      // "lines-around-comment": 2, // require empty lines around comments
      // "lines-between-class-members": 2, // require or disallow an empty line between class members
      // "max-depth": 2, // enforce a maximum depth that blocks can be nested
      // "max-len": 2, // enforce a maximum line length
      // "max-lines": 2, // enforce a maximum number of lines per file
      // "max-nested-callbacks": 2, // enforce a maximum depth that callbacks can be nested
      // "max-params": 2, // enforce a maximum number of parameters in function definitions
      // "max-statements": 2, // enforce a maximum number of statements allowed in function blocks
      // "max-statements-per-line": 2, // enforce a maximum number of statements allowed per line
      // "multiline-comment-style": 2, // enforce a particular style for multiline comments
      // "multiline-ternary": 2, // enforce newlines between operands of ternary expressions
      // "new-cap": 2, // require constructor names to begin with a capital letter
      // "new-parens": 2, // require parentheses when invoking a constructor with no arguments
      // "newline-per-chained-call": 2, // require a newline after each call in a method chain
      // "no-array-constructor": 2, // disallow Array constructors
      // "no-bitwise": 2, // disallow bitwise operators
      // "no-continue": 2, // disallow continue statements
      // "no-inline-comments": 2, // disallow inline comments after code
      // "no-lonely-if": 2, // disallow if statements as the only statement in else blocks
      // "no-mixed-operators": 2, // disallow mixed binary operators
      "no-mixed-spaces-and-tabs": 2, // disallow mixed spaces and tabs for indentation
      // "no-multi-assign": 2, // disallow use of chained assignment expressions
      // "no-multiple-empty-lines": 2, // disallow multiple empty lines
      // "no-negated-condition": 2, // disallow negated conditions
      // "no-nested-ternary": 2, // disallow nested ternary expressions
      // "no-new-object": 2, // disallow Object constructors
      // "no-plusplus": 2, // disallow the unary operators ++ and --
      // "no-restricted-syntax": 2, // disallow specified syntax
      // "no-tabs": 2, // disallow all tabs
      // "no-ternary": 2, // disallow ternary operators
      // "no-trailing-spaces": 2, // disallow trailing whitespace at the end of lines
      // "no-underscore-dangle": 2, // disallow dangling underscores in identifiers
      // "no-unneeded-ternary": 2, // disallow ternary operators when simpler alternatives exist
      // "no-whitespace-before-property": 2, // disallow whitespace before properties
      // "nonblock-statement-body-position": 2, // enforce the location of single-line statements
      // "object-curly-newline": 2, // enforce consistent line breaks inside braces
      // "object-curly-spacing": 2, // enforce consistent spacing inside braces
      // "object-property-newline": 2, // enforce placing object properties on separate lines
      // "one-var": 2, // enforce variables to be declared either together or separately in functions
      // "one-var-declaration-per-line": 2, // require or disallow newlines around variable declarations
      // "operator-assignment": 2, // require or disallow assignment operator shorthand where possible
      // "operator-linebreak": 2, // enforce consistent linebreak style for operators
      // "padded-blocks": 2, // require or disallow padding within blocks
      // "padding-line-between-statements": 2, // require or disallow padding lines between statements
      // "quote-props": 2, // require quotes around object literal property names
      // "quotes": 2, // enforce the consistent use of either backticks, double, or single quotes
      // "require-jsdoc": 2, // require JSDoc comments
      // "semi": 2, // require or disallow semicolons instead of ASI
      // "semi-spacing": 2, // enforce consistent spacing before and after semicolons
      // "semi-style": 2, // enforce location of semicolons
      // "sort-keys": 2, // require object keys to be sorted
      // "sort-vars": 2, // require variables within the same declaration block to be sorted
      // "space-before-blocks": 2, // enforce consistent spacing before blocks
      // "space-before-function-paren": 2, // enforce consistent spacing before function definition opening parenthesis
      // "space-in-parens": 2, // enforce consistent spacing inside parentheses
      // "space-infix-ops": 2, // require spacing around infix operators
      // "space-unary-ops": 2, // enforce consistent spacing before or after unary operators
      // "spaced-comment": 2, // enforce consistent spacing after the // or /* in a comment
      // "switch-colon-spacing": 2, // enforce spacing around colons of switch statements
      // "template-tag-spacing": 2, // require or disallow spacing between template tags and their literals
      // "unicode-bom": 2, // require or disallow Unicode byte order mark (BOM)
      // "wrap-regex": 2, // require parenthesis around regex literals
      // "arrow-body-style": 2, // require braces around arrow function bodies
      // "arrow-parens": 2, // require parentheses around arrow function arguments
      // "arrow-spacing": 2, // enforce consistent spacing before and after the arrow in arrow functions
      "constructor-super": 2, // require super() calls in constructors
      // "generator-star-spacing": 2, // enforce consistent spacing around * operators in generator functions
      "no-class-assign": 2, // disallow reassigning class members
      // "no-confusing-arrow": 2, // disallow arrow functions where they could be confused with comparisons
      "no-const-assign": 2, // disallow reassigning const variables
      "no-dupe-class-members": 2, // disallow duplicate class members
      // "no-duplicate-imports": 2, // disallow duplicate module imports
      "no-new-symbol": 2, // disallow new operators with the Symbol object
      // "no-restricted-imports": 2, // disallow specified modules when loaded by import
      "no-this-before-super": 2, // disallow this/super before calling super() in constructors
      // "no-useless-computed-key": 2, // disallow unnecessary computed property keys in object literals
      // "no-useless-constructor": 2, // disallow unnecessary constructors
      // "no-useless-rename": 2, // disallow renaming import, export, and destructured assignments to the same name
      // "no-var": 2, // require let or const instead of var
      // "object-shorthand": 2, // require or disallow method and property shorthand syntax for object literals
      // "prefer-arrow-callback": 2, // require using arrow functions for callbacks
      // "prefer-const": 2, // require const declarations for variables that are never reassigned after declared
      // "prefer-destructuring": 2, // require destructuring from arrays and/or objects
      // "prefer-numeric-literals": 2, // disallow parseInt() and Number.parseInt() in favor of binary, octal, and hexadecimal literals
      // "prefer-rest-params": 2, // require rest parameters instead of arguments
      // "prefer-spread": 2, // require spread operators instead of .apply()
      // "prefer-template": 2, // require template literals instead of string concatenation
      "require-yield": 2, // require generator functions to contain yield
      // "rest-spread-spacing": 2, // enforce spacing between rest and spread operators and their expressions
      // "sort-imports": 2, // enforce sorted import declarations within modules
      // "symbol-description": 2, // require symbol descriptions
      // "template-curly-spacing": 2, // require or disallow spacing around embedded expressions of template strings
      // "yield-star-spacing": 2, // require or disallow spacing around the * in yield* expressions
    }
  }
  
  function validator(text, options) {
    var result = [], config = defaultConfig;
    var errors = new eslint().verify(text, config);
    for (var i = 0; i < errors.length; i++) {
      var error = errors[i];
      result.push({message: error.message,
                 severity: getSeverity(error),
                 from: getPos(error, true),
                   to: getPos(error, false)});	
    }
    return result;	  
  }

  CodeMirror.registerHelper("lint", "javascript", validator);

  function getPos(error, from) {
    var line = error.line-1, ch = from ? error.column : error.column+1;
    if (error.node && error.node.loc) {
      line = from ? error.node.loc.start.line -1 : error.node.loc.end.line -1;
      ch = from ? error.node.loc.start.column : error.node.loc.end.column;
    }
    return CodeMirror.Pos(line, ch);
  }
  
  function getSeverity(error) {
    switch(error.severity) {
      case 1:
        return "warning";
      case 2:
      return "error";	    
      default:
      return "error";
    }    
  }
})(CodeMirror);
