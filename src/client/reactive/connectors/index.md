# Connectors
<div id="rectangle" class="lively-content" style="width: 100pt; height: 100px; border: 1px solid black; position: relative; background-color: rgba(40, 40, 80, 0.5);"></div>

<div id="number">
 42
</div>

<input id="slider" type="range"> </input>

<script>
  let slider = lively.query(this, "#slider");
  let number  = lively.query(this, "#number");
  debugger
  let rectangle  = lively.query(this, "#rectangle");
  let ae1 = aexpr(() => slider.value);
  ae1.onChange(svalue => rectangle.style.width= svalue+"pt")
  ae1.onChange(svalue => number.innerHTML = svalue)
</script>
