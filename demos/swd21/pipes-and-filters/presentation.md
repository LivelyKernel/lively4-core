<!-- markdown-config presentation=true -->


<style data-src="../../../src/client/presentation.css"></style>

<script>
import Presentation from "src/components/widgets/lively-presentation.js"
Presentation.config(this, {
    pageNumbers: false,
    logo: "https://lively-kernel.org/lively4/lively4-jens/media/lively4_logo_smooth_100.png"
})
</script>

<div class="title">
  Pipes and Filters
</div>

<div class="authors">
  Sven Kästle & Nicolas Walk
</div>

<div class="credentials">
  2021<br>
  <br>
  HPI SWA
</div>

---

# Pipes and Filters

---

# Pipe
<div style="height: 500px;"><lively-import style="position:relative" src="https://lively-kernel.org/lively4/swd21-pipes-and-filters/src/parts/PipesAndFilterExample.html"></lively-import></div>

---

# Filter
<div style="height: 500px;"><lively-import id="example2" style="position:relative; height: 500px; width:500px; background-color:gray" src="https://lively-kernel.org/lively4/swd21-pipes-and-filters/src/parts/PipesAndFilterExample2.html"></lively-import></div>

---

# Example Button

<script>

var example2 = lively.query(this, "#example2");
(async () => { 
  var buttons = <div> <button click={
    () => { var connector = example2.shadowRoot.querySelector("lively-connector")                 lively.showElement(connector) }}>hello</button> <button click={() => { var connector = example2.shadowRoot.querySelector("lively-connector") lively.showElement(connector) }}>world</button> </div> return buttons })()

</script>

---
# Beispiele

* Compiler
* ls --help | grep "dired"

---

# Austauschbarkeit

> Beispiel durchlauf bei dem ein Filter ausgetauscht wird

---

# Active Filter vs Active Pipe

> Beispiele für Aktive filter und Aktive pipe

---

# Multithreading