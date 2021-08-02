# Opening something in a window


<script><button click={async () => {
  var url = "https://lively-kernel.org/lively4/lively4-jens/demos/"
  var comp = await lively.openBrowser(url)
  comp.parentElement.toggleMaximize()
}}>hello</button></script>