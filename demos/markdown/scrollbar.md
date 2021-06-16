# Scrollbar

Can we create a custom Scrollbar?

<script>

async function customScrollbar() {
  var bar = <div class="bar" style="position: relative; height: 20px; width:500px; background-color: lightgray"></div>
  var knob = <div class="knob" style="position: absolute; top: 0px; left: 40px; height: 20px; width:50px; background-color: gray"></div>
  bar.appendChild(knob)
  bar.addEventListener("mousedown", () => {
  
  })  
  return bar
}


customScrollbar()
</script>