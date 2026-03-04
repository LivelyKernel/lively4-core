# Lively Literature


<script>
  let container = lively.query(this, "lively-container")
  let diagram = await (<lively-class-diagram></lively-class-diagram>)
  diagram.addURL(container.getDir())
  diagram
</script>