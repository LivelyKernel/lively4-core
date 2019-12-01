<!-- markdown-config presentation=true -->

<link rel="stylesheet" type="text/css" href="../../doc/presentation/style.css"  />


<!-- markdown-config presentation=true -->
<link rel="stylesheet" type="text/css" href="./style.css"  />

<script>
import Presentation from "src/components/widgets/lively-presentation.js"
Presentation.config(this, {
    pageNumbers: true,
    logo: "https://lively-kernel.org/lively4/lively4-jens/media/lively4_logo_smooth_100.png"
})
</script>


<div class="title">
  A Title
</div>

<div class="authors">
  by Somebody
</div>

<div class="credentials">
  2019<br>
  <br>
  Somewhere
</div>

---

# A presentation in Lively


<script>
(async () => {
  await lively.sleep(1000) 
  return <div>this is dynamic content: <br /> {new Date()}</div>
})()

</script>
