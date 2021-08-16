## 2020-11-19 #Ohm Example
*Author: @JensLincke*


```javascript


import ohm from "https://unpkg.com/ohm-js@15.2.1/dist/ohm.js"


var myGrammar = ohm.grammar('MyGrammar { greeting = "Hello" | "Hola"  }');



var userInput = 'Hello';
var m = myGrammar.match(userInput);


var userInput = 'Hallo';
var m = myGrammar.match(userInput);

```