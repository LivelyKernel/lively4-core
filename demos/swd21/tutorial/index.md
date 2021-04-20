# Tutorial


## A simple counter

<script>
  var counter = 0
  var view = <div click={(evt) => view.textContent = counter++}>{counter}</div>
  view
</script>


## Async Stuff

<script>

import CoolView from "./coolview.js"

var url = lively4url + "/demos/swd21/tutorial/list.txt";

CoolView.render(url)

</script>