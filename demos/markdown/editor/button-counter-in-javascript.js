// this is a JavaScript comment... mut not all comments are equal, some are more equal than others! They are 
// special HTML and MD comments that are parsed and rendered

/*MD ## And here comes Button created by a script in markdown... 
This button contains code that reflects about itself, the editor and when pressed it will change the content of the editor.
To be on the save side, the first thing the button does is replacing a line before its own code with some friendly incrementing counter!

MD*/




// hello counter 12 !

/*MD
<script>
  var counter = 0;
  (<button click={() => {
      let codeMirror = lively.query(this, "lively-code-mirror");
      let mywidget = lively.query(this, ".inline-embedded-widget");
      var myrange = mywidget.marker.find() // this can change
      var pos = myrange.from
      codeMirror.editor.replaceRange(`// hello counter ${counter++} !\n`,
        {line:pos.line - 2, ch:0},
        {line:pos.line - 1, ch:0},
      )
  }}>Count</button>)
</script>
MD*/



/*MD ## Changing it's own code... 

or at least own something in it's own region of code?

### So first something that counts....

MD*/



/*MD
<script>
var counter = 0;
var counterElement = <div id="counter"></div>;
(<div>
  Counter: {counterElement}  
    <button click={() => {
        var myrange = mywidget.marker.find() // this can change
        
        counterElement.innerHTML = counter++
        
        // var pos = myrange.from
        // codeMirror.editor.replaceRange(`// hello counter ${counter++} !\n`,
        //   {line:pos.line - 2, ch:0},
        //   {line:pos.line - 1, ch:0},
        // )
    }}>Count in inner div element (created by JavaScript)</button>
</div>)
</script>
MD*/


/*MD ### But lets separate HTML from JavaScript

btw. this is hml embeded in JavaScript embedded in HTML embedded in Markdown embedded in JavaScript
... somebody mentioned Inception? 
MD*/


/*MD
<div>Counter: <span id="counter"></span></div>

<script>
var counterElement = lively.query(this.parentElement, "#counter");;
var counter = 0;
(<button click={() => {
  var myrange = mywidget.marker.find() // this can change       
  counterElement.innerHTML = counter++
}}>Count in div element</button>)
</script>
MD*/


/*MD ### ... and then let us reflect MD*/


/*MD
<div>This should be my source: <div id="mycode" style="white-space: pre-wrap; font-family: courier">xxx</div></div>

<script>
var rootElement = this.parentElement // just assume we know which one it is...
var sourceReflectionElement = lively.query(this.parentElement, "#mycode");
(<button click={() => {
  sourceReflectionElement.textContent = rootElement.outerHTML
}}>Show Source</button>)
</script>
MD*/

/*MD As you can see, this is a proper mirror since pressing it serveral times reflects itself while reflecting itself! 

But it is still only affects the live HTML element, not it's actual source code as the first element did.

Why not combine both approaches? 

- a) we know how to actually edit source code in our own editor
- b) we know how to generate source code from out live objects, e.g. the HTML elements including the script... 

MD*/

/*MD ### The simplest thing to mutate myself is to self destruct MD*/


/*MD
<script>
  (<button click={() => {
    let codeMirror = lively.query(this, "lively-code-mirror");  
    let mywidget = lively.query(this, ".inline-embedded-widget");
    var myrange = mywidget.marker.find() // this can change
    codeMirror.editor.replaceRange("// here was once a button!", myrange.from, myrange.to)
  }}>delete me!</button>)
</script>
MD*/



/*MD
So lets do a counter that mutates and persists itself!


 a) we do a little index hack so we do not actually loose the widget iself... 
 b) it does not work because some whitespace is lost amd we have Markdown here an not HTML...
    - maybe do an HTML version?
MD*/

// bla bla

/*MD
<div>Counter: <span id="counter">0</span></div>

<lively-script><script>
  (<button click={() => {
    var rootElement = this.parentElement // just assume we know which one it is...
    var counterElement = lively.query(this.parentElement, "#counter");;
    let codeMirror = lively.query(this, "lively-code-mirror");  
    let mywidget = lively.query(this, ".inline-embedded-widget");
    var myrange = mywidget.marker.find() // this can change
    counterElement.textContent = parseInt(counterElement.textContent) + 1
    codeMirror.editor.replaceRange(""+"*MD\n " + rootElement.innerHTML + " \nMD*"+"" , 
      {line:myrange.from.line, ch:myrange.from.ch + 1},
      {line:myrange.to.line, ch:myrange.to.ch - 1})
  }}>Count and Remember!</button>)
</script></lively-script>
MD*/





// The End.