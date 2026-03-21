# Lively Container


<script>
  let container = lively.query(this, "lively-container")
  let diagram = await (<lively-class-diagram></lively-class-diagram>)
  diagram.addURL(lively4url + "/src/components/tools/lively-container.js")
  diagram.addURL(lively4url + "/src/components/tools/lively-container-navbar.js")
  diagram.addURL(lively4url + "/src/components/tools/lively-editor.js")
  diagram.addURL(lively4url + "/src/components/widgets/lively-code-mirror.js")
  
  // diagram.appendMermaid(`
  //     HTMLElement <|--   LivelyCodeMirror
  //     HTMLElement <|--   Morph
  
  // `)


  
  diagram
</script>