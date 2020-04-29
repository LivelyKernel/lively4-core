<!-- markdown-config presentation=true -->

<link rel="stylesheet" type="text/css" href="../../../src/client/presentation.css"  />
<link rel="stylesheet" type="text/css" href="../../../src/client/lively.css"  />
<link rel="stylesheet" type="text/css" href="../../../templates/livelystyle.css"  />

<style>
  .centered {
    display: block; 
    margin-left: auto; 
    margin-right: auto;
  }

  .left {
    position: absolute;
    width: 40%;
    left: 20px;
    top: 150px;
  }

  .right {
    position: absolute;
    width: 50%;
    right: 10px;
    top: 150px;
  }


  .bottomLeft {
    width: 50%;
    position: absolute;
    bottom: 40px; 
    left: 20px;
  }
  
  .bottomRight {
    width: 50%;
    position: absolute;
    bottom: 40px; 
    right: 20px;
  }

  h2 {
    text-align: center;
  }

  
  a:visited.plain, a:link.plain {
    color: inherit;
    text-decoration: none;
  }

</style>

# Babylonian-style Programming



---
<!-- #TODO pull this up into presentation? -->
<script>
// poor men's slide master #Hack #TODO How to pull this better into lively-presentation?
var ctx = this;
(async () => {
  await lively.sleep(500)
  var presentation = lively.query(ctx, "lively-presentation")
  if (presentation && presentation.slides) {
    presentation.slides().forEach(ea => {
      var img = document.createElement("img")
      img.classList.add("logo")
      img.src="https://lively-kernel.org/lively4/lively4-seminars/PX2018/media/hpi_logo.png" 
      img.setAttribute("width", "50px")
      ea.appendChild(img)
      var div = document.createElement("div")
      div.classList.add("page-number")
      ea.appendChild(div)
    });
  } 
  return ""
})()
</script>