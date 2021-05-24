<link rel="stylesheet" type="text/css" href="https://lively-kernel.org/lively4/swd21-croquet/demos/swd21/croquet/style.css" data-href="https://lively-kernel.org/lively4/swd21-croquet/demos/swd21/croquet/style.css">

<h1>Crouquet Example</h1>

<script>
    var frame = <iframe id="croquetFrame" src="https://lively-kernel.org/lively4/swd21-croquet/demos/swd21/croquet/dice.html" style="height:250px;width:100%" name="iframe_a"></iframe>

    var result = <div id="result"></div>

    function clickFunction() {
      
      var x = frame.name;
      result.innerHTML = x
    }
    
    <div>
      {frame}
      {result}
      <button click={event => clickFunction()}>Try it</button>
      
    </div>
    
</script>

