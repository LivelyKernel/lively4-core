// This is a JavaScript file

class Foo {

  bar() {
    return  3 + 4
  }

}



// hello counter 57 !

/*HTML
<div class="lively-content" style="position: relative; width: 200px; height: 100px; border: 1px solid black; background-color: rgba(40, 40, 80, 0.5);"><div class="lively-text lively-content" contenteditable="true" style="width: 100px; position: absolute; left: 24px; top: 21px;">Hello World</div></div>
HTML*/

// This







/*MD 

![](html-in-javascript.drawio)
MD*/


/*MD 

- <edit://src/components/tools/lively-editor.js#showEmbeddedWidgets>

MD*/

// Btw... we composition goes realy wild here... and this is just the vertical composition hierrachy...



/*MD 

<style>
li {
     margin-left:-33px;
  }
</style>

 - body
   - **lively-window.global**
     - **lively-container**
       - ShadowRoot
         - div#layout-full
           - div#layout-center
             - div#container-rightpane
               - div#container-editor
                 - **lively-editor#editor**
                   - ShadowRoot
                     - div.container
                       - **lively-code-mirror#editor**
                         - ShadowRoot
                           - div#code-mirror-container
                             - div.CodeMirror.cm-s-default.CodeMirror-simplescroll.CodeMirror-wrap
                               - div.CodeMirror-scroll
                                 - div.CodeMirror-sizer
                                   - div
                                     - div.CodeMirror-lines
                                       - div
                                         - div.CodeMirror-code
                                           - div
                                             - pre.CodeMirror-line
                                               - span
                                                 - span.CodeMirror-widget
                                                   - **span.lively-widget**
                                                     - div.inline-embedded-widget
                                                       - div.lively-content

MD*/







/*MD The normal setup MD*/



/*MD ## Helper Functions MD*/

function printAllParents(element) {
  var indent = ""
  
  return lively.allParents(element, [], true).reverse().map(ea => {
    if (ea instanceof ShadowRoot) return "ShadowRoot"
    return ea.localName 
      + (ea.id ? "#" + ea.id : "") 
      + "" 
      + (ea.classList && ea.classList.length > 0  ? "." + Array.from(ea.classList).join(".") : "")
  }).map(ea => {
    indent += "  "
    return indent + " - " + ea
  }).join("\n")
}


/*MD ## Some #Notes to from Jens to Tom

![](html-in-javascript-example.png){width=300px}

der excalidraw font löst übrigens ein Problem das ich beim Ebedden von content in code hatte... zu unterscheiden was kommentar ist und was code...

Ursprünglich hatte ich den kommentaren einen Farbhintergrund gegeben um das eindeutiger zu machen, aber meine User (Stefan) mochte das nicht... +

aber durch den sketchinessfont ist das sofort klar

btw... das was ich da mache ist glaube ich genau der benchmark wo du sagst was mit code etc schwierig ist... wenn ich eine stelle ändere fällt vielleicht alles zusammen. Was aber spannend ist. Es gibt noch eine stabile ebene zwischen textuellem code und sandblocks.

Und zwar in code mirror sind die annotationen materialisiert. Sie kleben an den Buchstaben... wenn ich also meine datei parse und sage... hier ist javascript und hier ist markdown oder html... dann muss ich dass nur einmal machen und ich kann beliebige syntaxfehler im JavaScript teil und im HTML Teil machen... vielleicht kann ich die Datei danach nicht mehr lesen. Aber zur Laufzeit fällt mir zumindest nicht die UI auseinander.



MD*/
