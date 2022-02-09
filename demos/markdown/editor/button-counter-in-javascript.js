// this is JavaScript


// And here comes Markdown... which we use so we have the nice lively4 scripts...







/*MD
<script>
  var counter = 0;
  let codeMirror = lively.query(this, "lively-code-mirror");
  let mywidget = lively.query(this, ".inline-embedded-widget");
  (<button click={() => {
      var myrange = mywidget.marker.find() // this can change
      var pos = myrange.from
      codeMirror.editor.replaceRange(`// hello counter ${counter++} !\n`,
        {line:pos.line - 2, ch:0},
        {line:pos.line - 1, ch:0},
      )
  }}>Count</button>)
</script>
MD*/