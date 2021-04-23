# Event Sourcing

<script>
  <a click={() => window.open("https://lively-kernel.org/lively4/swd21-event-sourcing/start.html")}>dev repository</a>
</script>


## A simple counter

<script>
  var counter = 0
  var view = <div click={(evt) => view.textContent = counter++}>{counter}</div>
  view
</script>


## Async Stuff

<script>

import CoolView from "./coolview.js"

var url = "https://lively-kernel.org/lively4/lively4-eventsourcing/demos/swd21/event-sourcing/list.txt";

CoolView.render(url)

</script>