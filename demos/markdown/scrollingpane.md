# Scrolling Pane

Hold CTRL+Drag to scroll

<div id="pane" style="position: relative; background-color: lightgray; width: 200px; height: 200px; overflow: hidden">
  <div class="lively-content" style="background-color: blue; border: 1px solid gray; position: absolute; width: 245px; height: 193.182px; left: 68.8707px; top: 80.7599px;">
  </div>
</div>

Insight: the scrolling pane has to be positioned absolute or relative to make it scrolling!

<script>

var pane = lively.query(this.parentElement, "#pane")

lively.showElement(pane)
var scroll = pane
pane.style.overflow = "auto"


var lastMove
function onPanningMove(evt) {
  var pos = lively.getPosition(evt)
  var delta = pos.subPt(lastMove)
  scroll.scrollTop -= delta.y
  scroll.scrollLeft -= delta.x

  lively.showEvent(evt)
  lastMove = pos

}

lively.removeEventListener("dev", pane)
lively.addEventListener("dev", pane, "pointerdown", evt => {
  if (evt.ctrlKey) {
    lastMove = lively.getPosition(evt)
    lively.addEventListener("changegraph", document.body.parentElement, "pointermove", evt => onPanningMove(evt))
    lively.addEventListener("changegraph", document.body.parentElement, "pointerup", evt => {
      lively.removeEventListener("changegraph", document.body.parentElement)
    })
    lively.showEvent(evt)
    evt.stopPropagation()
    evt.preventDefault()
  }
}, true)





</script>