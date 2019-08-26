# Handwriting Demo

Has anybody said "Graffiti"? See [**Demo Video**](190821_handwriting.mp4) or try it yourself.

<script>
(async () => {
  var handwriting = await (<lively-handwriting></lively-handwriting>)
  var editor = await (<lively-code-mirror  style="border: 1px solid gray; width:700px;height:150px"></lively-code-mirror>);
  handwriting.target = editor
  return <div>{handwriting}{editor}</div>
})()
</script>

The `Handwriting` component will recognize one-character-strokes and show the interpreted characters. It can optionally send the characters to and editor via setting a `target` or using the `document.activeElement`. 