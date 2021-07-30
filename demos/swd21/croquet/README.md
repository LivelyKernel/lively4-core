<h1> Croquet Szenarios </h1>

The simplest Croquet implementation is a counter. While starting the scenario every 1000 ms a counter ticks high. Therefore it is initialized a CounterModel which extend from Croquet and is used to count for all related Clients inside the same session. A CounterView also extended from Croquet handle the user interaction which is a counter reset by clicking inside the iFrame-Display.
<script>
  <button style="font-weight:bold; font-size:1em, padding-left:20px" click={async () => {
    var url = "https://lively-kernel.org/lively4/swd21-croquet/demos/swd21/croquet/counter/croquetCounter.md"
    var comp = await lively.openBrowser(url, true)
    comp.parentElement.toggleMaximize()
  }}>Open Example
  </button>
</script>
<br>

In a second example, there is implemented a dice game where each registered user sees their dice. The dice itself is built by css and transformed/transitioned by style attributes. For this example application, two versions exist.<br> 
In the 1st version, the user is rolling the dice by clicking the display. Then the user's view sends the model the information that the user-xy wishes to roll the dice. The model itself publishes this event to its connected view which in turn is rolling the dice. The dice roll takes place here only in the view - not replicated. Therefore the result is different in each.
<script>
  <button style="font-weight:bold; font-size:1em, padding-left:20px" click={async () => {
    var url = "https://lively-kernel.org/lively4/swd21-croquet/demos/swd21/croquet/old-dice/bump-dice/bumpDiceCroquetPage.md"
    var comp = await lively.openBrowser(url, true)
    comp.parentElement.toggleMaximize()
  }}>Open Example
  </button>
</script>
<br>

In the 2nd version, the model is rolling for the user. Here the user clicks the display which published the event through the replicator to all registered models - replicated. Each model is calculating the new dice position and sends that one to the corresponding view. Therefore it calculates a random x and y degree around which the cube will rotate. Since the model is replicated each view is showing the same animation.
<script>
  <button style="font-weight:bold; font-size:1em, padding-left:20px" click={async () => {
    var url = "https://lively-kernel.org/lively4/swd21-croquet/demos/swd21/croquet/old-dice/roll-dice/rollDiceCroquetPage.md"
    var comp = await lively.openBrowser(url, true)
    comp.parentElement.toggleMaximize()
  }}>Open Example
  </button>
</script>
<br>

In the last example, there is implemented a dice game where each registered user brings to a shared user session their dice. The difference to the previous one is, that the dice is build and animated by THREE.js. For this example application, two versions exist.<br> 
In the 1st version, the user is rolling the dice by clicking the display. Then the user's view sends the model the information that the user-xy wishes to roll the dice. The model itself publishes this event to its connected view which in turn is rolling the dice. The dice roll takes place here only in the view - not replicated. Therefore the result is different in each.