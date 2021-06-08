<!-- markdown-config presentation=true -->

<style data-src="../../src/client/presentation.css"></style>

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

# A presentation in Lively!


<script>
(async () => {
  await lively.sleep(1000) 
  return <div>this is dynamic content: <br /> {new Date()}</div>
})()

</script>


---

whatever [browse a file](browse://src/client/lively.js)

---

- cool
- absolute


---
# A Slide

- Top Level Bullet Points
- More 
  - And here some 
  - Subs

And ordered:

1. Foo
2. Bar
   - With Subs
   - Bla

And **tasks**:

- [ ] check boxes
- [ ] done
- [ ] not done 
  - [ ] sub task
  - [x] xxx
  
  
---
# And some imported HTML


![](../../src/parts/ConnectorExample.html)


  
