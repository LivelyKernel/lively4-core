<!-- markdown-config presentation=true -->

<link rel='stylesheet' href='https://lively-kernel.org/lively4/swd21-pipes-and-filters/demos/swd21/pipes-and-filters/presentation/src/html/styles.css'>

<style data-src="../../../../src/client/presentation.css"></style>

<script>
import Presentation from "src/components/widgets/lively-presentation.js"
Presentation.config(this, {
    pageNumbers: false,
    logo: "https://hpi.de/fileadmin/user_upload/hpi/bilder/logos/hpi_logo.jpg"
})
</script>

<div class="title">
  Pipes and Filters
</div>

<div class="authors">
  Sven Kästle & Nicolas Walk
</div>

<div class="credentials">
  Summer  2021
  <br>
  <br>
  HPI - Software-Design Seminar <br>
  Software Architecture Group
</div>

---
# Pipes and Filters
---
# Pipes and Filters
## grep

<pre>
  <code> more example.json</code>
</pre>

<img src="./src/ressources/1.png" alt="drawing" width="80%"/>

---
# Pipes and Filters
## grep

<pre>
  <code> more example.json | grep circle </code>
</pre>

![](./src/ressources/2.png)

---
# Pipes and Filters
## grep

<pre>
  <code> more example.json | grep circle | sed 's/circle/square/'</code>
</pre>

![](./src/ressources/3.png)

---
# Pipes and Filters
## grep

<pre>
  <code> more example.json | grep circle | sed 's/circle/square/' | grep red</code>
</pre>

![](./src/ressources/4.png)

---
# Pipes and Filters
## Architectual pattern

"Pipes and Filters" is an architectual software pattern used for specific cases 

  other pattern examples are 
* Layers
* Broker
* model-view-controller (MVC)

those are are not interchangeable 

Every pattern is used under certain circumstances

<img src="https://images-na.ssl-images-amazon.com/images/I/514V0-cfW2L._SX383_BO1,204,203,200_.jpg" alt="drawing" width="200"/>

---
# Pipes and Filters
## Motivation

Under what circumstances do we need pipes and filters?

**It can be used when**
* there is a big process
* that manipulates data
* that can be devided into multiple steps
* that steps can be run simultaneously

**A pipes and filters system consists of**
* a datasource
* pipes
* filters
* a datasink

---

# Processing Pipeline
---
# Processing Pipeline
## Datasource

![](./src/html/simplePipeline.html){#dataSource}

<script>
import PipelineBuilder from "./src/utils/pipelineBuilder.js"

var pipeline = lively.query(this, "#dataSource");

(async () => {
  await new Promise((resolve, reject) => {
    pipeline.addEventListener("content-loaded", () => {
      resolve()
    })
  })
  
  var pipeBuilder = new PipelineBuilder(pipeline.shadowRoot)
  pipeBuilder.onlyShowSpecificElements(["data-source", "data-source-barrel-top", "data-source-barrel-bottom" ])
  
})()
</script>


**Function:**<br>
* provides the datachunks for the processing pipeline and its subsequent components
* datachunks are the pieces of data that the logic of the filters is applied to
<br>


---
# Processing Pipeline
## Datasource
### log stream
<pre>
<code>2021-06-27 15:20:37.224881+0200 0x14d      Default     0x0                  0      0    kernel: (AirPortBrcmNIC) ARPT: 97029.211335: DequeueTime: 0xaaaaaaaa
2021-06-27 15:20:37.224885+0200 0x14d      Default     0x0                  0      0    kernel: (AirPortBrcmNIC) LastTxTime: 0x7a69c6b8
2021-06-27 15:20:37.224888+0200 0x14d      Default     0x0                  0      0    kernel: (AirPortBrcmNIC) PHYTxErr:   0x0000
2021-06-27 15:20:37.224892+0200 0x14d      Default     0x0                  0      0    kernel: (AirPortBrcmNIC) PHYTxErr:   0x0000</code>
</pre>


Every log entry is one datachunk for the processing pipeline

---
# Processing Pipeline
## Datasource
### textfile
<pre>
<code>Lorem ipsum dolor sit amet, consetetur sadipscing elitr, 
sed diam nonumy eirmod tempor
invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua.
At vero eos et accusam et justo duo dolores et ea rebum. Stet clita
kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.</code>
</pre>


Each word of the text is one datachunk for the processing pipeline.


---
# Processing Pipeline
## Datasource
### objects

Also objects can be used as an input
<pre>
<code>[
  {"form": "circle", "color": "red"},
  {"form": "circle", "color": "red"},
  {"form": "triangle", "color": "yellow"},
  {"form": "square", "color": "green"},
  {"form": "triangle", "color": "blue"},
  {"form": "circle", "color": "blue"},
  {"form": "triangle", "color": "yellow"},
  {"form": "square", "color": "red"}
]</code>
</pre>

Each list entry is a datachunk for the processing pipeline


![](./src/html/simplePipeline.html){#dataChunks}
<script>
import ActivePipePassiveFilter from "./src/scenarios/activePipePassiveFilter.js"
import PipelineBuilder from "./src/utils/pipelineBuilder.js"

var pipeline = lively.query(this, "#dataChunks");

(async () => {
  await new Promise((resolve, reject) => {
    pipeline.addEventListener("content-loaded", () => {
      resolve()
    })
  })
  
  var pipeBuilder = new PipelineBuilder(pipeline.shadowRoot)
  pipeBuilder.onlyShowSpecificElements(['data-source', "data-source-barrel-top", "data-source-barrel-bottom"])
  
  var activePipePassiveFilter = new ActivePipePassiveFilter(pipeline.shadowRoot)
  activePipePassiveFilter.animateDryRunForPipelineDemonstartion()
})()
</script>

Each geometric figure represents one datachunk in the processing pipeline

---
# Processing Pipeline
## Pipe

![](./src/html/simplePipeline.html){#pipe}

<script>
import ActivePipePassiveFilter from "./src/scenarios/activePipePassiveFilter.js"
import PipelineBuilder from "./src/utils/pipelineBuilder.js"

var pipeline = lively.query(this, "#pipe");

(async () => {
  await new Promise((resolve, reject) => {
    pipeline.addEventListener("content-loaded", () => {
      resolve()
    })
  })
  
  var pipeBuilder = new PipelineBuilder(pipeline.shadowRoot)
  pipeBuilder.onlyShowSpecificElements(["data-source",  "data-source-barrel-top", "data-source-barrel-bottom", "pipe1", "pipe1Connector"])
  
  var activePipePassiveFilter = new ActivePipePassiveFilter(pipeline.shadowRoot)
  activePipePassiveFilter.animateDryRunForPipelineDemonstartion()
})()
</script>

Pipes are the connector between
* datasource and filter
* filter and datasink
* filter and filter

The pipe 
* transmits datachunks
* buffers data (fifo buffer)
* synchronizes adjacent active filters

---
# Processing Pipeline
## Filter
  
![](./src/html/simplePipeline.html){#filter}

<script>
import ActivePipePassiveFilter from "./src/scenarios/activePipePassiveFilter.js"
import PipelineBuilder from "./src/utils/pipelineBuilder.js"

var pipeline = lively.query(this, "#filter");

(async () => {
  await new Promise((resolve, reject) => {
    pipeline.addEventListener("content-loaded", () => {
      resolve()
    })
  })
  
  var pipeBuilder = new PipelineBuilder(pipeline.shadowRoot)
  pipeBuilder.onlyShowSpecificElements(["data-source",  "data-source-barrel-top", "data-source-barrel-bottom", "pipe1", "pipe1Connector", "filter" ])
    
  var activePipePassiveFilter = new ActivePipePassiveFilter(pipeline.shadowRoot)
  activePipePassiveFilter.animateDryRunForPipelineDemonstartion()
})()
</script>

Filters are the processing units of a pipes and filters system  
The input data is either
* reduced
* enriched
* or transformed

the filter can be activated by 
* precedent pipe (passive filter)
* following pipe (passive filter)
* the filter itself (active filter)

---
# Processing Pipeline
## Datasink


![](./src/html/simplePipeline.html){#complete}

<script>
import ActivePipePassiveFilter from "./src/scenarios/activePipePassiveFilter.js"
import PipelineBuilder from "./src/utils/pipelineBuilder.js"

var pipeline = lively.query(this, "#complete");

(async () => {
  await new Promise((resolve, reject) => {
    pipeline.addEventListener("content-loaded", () => {
      resolve()
    })
  })
    
  var activePipePassiveFilter = new ActivePipePassiveFilter(pipeline.shadowRoot)
  activePipePassiveFilter.animateDryRunForPipelineDemonstartion()
})()
</script>
Is the output of the system <br>

from the last filter of the processing pipeline <br>
the datachunks are piped into the datasink

common datasinks are
* files
* terminal
* an animation

---

# Szenario
---
# Szenario
## active filter - passive pipe

![](src/html/simplePipeline.html){#pipeline1}

<script>
import PassivePipeActiveFilter from "./src/scenarios/passivePipeActiveFilter.js"
import PipelineLabels from "./src/components/pipelineLabels.js"

var pipeline = lively.query(this, "#pipeline1");

(async () => {
  await new Promise((resolve, reject) => {
    pipeline.addEventListener("content-loaded", () => {
      resolve()
    })
  })
  
  var passivePipeActiveFilter = new PassivePipeActiveFilter(
    pipeline.shadowRoot,
    new PipelineLabels("", "data source", "", ""),
    new PipelineLabels("", "pipe 1", "", ""),
    new PipelineLabels("", "filter", "", "paint blue"),
    new PipelineLabels("", "pipe 2", "", ""),
    new PipelineLabels("", "data sink", "", ""))
  return passivePipeActiveFilter.buildButtons()
})()
</script>


**The active filter pulls the data from the precedeing passive pipe.**



---
# Szenario
## active pipe - passive filter

![](src/html/simplePipeline.html){#pipeline2}

<script>
import ActivePipePassiveFilter from "./src/scenarios/activePipePassiveFilter.js"

var pipeline = lively.query(this, "#pipeline2");

(async () => {
  await new Promise((resolve, reject) => {
    pipeline.addEventListener("content-loaded", () => {
      resolve()
    })
  })
  
  var activePipePassiveFilter = new ActivePipePassiveFilter(pipeline.shadowRoot,
    new PipelineLabels("", "data source", "", ""),
    new PipelineLabels("", "pipe 1", "", ""),
    new PipelineLabels("", "filter", "", "only red"),
    new PipelineLabels("", "pipe 2", "", ""),
    new PipelineLabels("", "data sink", "", ""))
  return activePipePassiveFilter.buildButtons()
})()
</script>

**The active pipe pushes and calls the passive filter.**

---
# Szenario
## multiple active filters

![](src/html/twoFilterPipeline.html){#pipeline3}

<script>
import PassivePipeTwoActiveFilters from "./src/scenarios/passivePipeTwoActiveFilters.js"

var pipeline = lively.query(this, "#pipeline3");

(async () => {
  await new Promise((resolve, reject) => {
    pipeline.addEventListener("content-loaded", () => {
      resolve()
    })
  })
  
  var passivePipeTwoActiveFilters = new PassivePipeTwoActiveFilters(pipeline.shadowRoot,
    new PipelineLabels("", "data source", "", ""),
    new PipelineLabels("", "", "", ""),
    new PipelineLabels("", "", "only circle", ""),
    new PipelineLabels("", "", "", ""),
    new PipelineLabels("paint blue", "", "", ""),
    new PipelineLabels("", "", "", ""),
    new PipelineLabels("", "data sink", "", ""))
  return passivePipeTwoActiveFilters.buildButtons()
})()
</script>

**The passive pipes between the two active filters synchronising the filtering pipeline.**

* The workload is devided. Each filter manipulates one attribute of the given object.

---
# Szenario
## multiple active buffered filters

![](src/html/twoFilterBufferPipeline.html){#pipeline4}

<script>
import PassivePipeTwoActiveBufferFilters from "./src/scenarios/passivePipeTwoActiveBufferFilters.js"

var pipeline = lively.query(this, "#pipeline4");

(async () => {
  await new Promise((resolve, reject) => {
    pipeline.addEventListener("content-loaded", () => {
      resolve()
    })
  })
  
  var passivePipeTwoActiveBufferFilters = new PassivePipeTwoActiveBufferFilters(pipeline.shadowRoot,
    new PipelineLabels("", "data source", "", ""),
    new PipelineLabels("", "", "", "2"),
    new PipelineLabels("", "", "only circle", ""),
    new PipelineLabels("", "", "2", ""),
    new PipelineLabels("paint blue", "", "", ""),
    new PipelineLabels("", "", "", "2"),
    new PipelineLabels("", "data sink", "", ""))
  return passivePipeTwoActiveBufferFilters.buildButtons()
})()
</script>

**Buffered pipes can influence the pipeline flow by bottlenecking the whole pipeline with a small buffer size.**

* Buffers can slow down the pipeline, if needed.
* A small buffer size may create a bottleneck.

---
# Szenario
## modular components

![](src/html/twoModularFilterPipeline.html){#pipeline5}

<script>
import ModularActiveFilterPassivePipe from "./src/scenarios/modularActiveFilterPassivePipe.js"

var pipeline = lively.query(this, "#pipeline5");

(async () => {
  await new Promise((resolve, reject) => {
    pipeline.addEventListener("content-loaded", () => {
      resolve()
    })
  })
  
  var modularActiveFilterPassivePipe = new ModularActiveFilterPassivePipe(pipeline.shadowRoot,
    new PipelineLabels("", "data source", "", ""),
    new PipelineLabels("", "", "", ""),
    new PipelineLabels("", "form filter", "", ""),
    new PipelineLabels("", "", "", ""),
    new PipelineLabels("", "", "", "color filter"),
    new PipelineLabels("", "", "", ""),
    new PipelineLabels("", "data sink", "", ""))
  return modularActiveFilterPassivePipe.buildButtons()
})()
</script>

**The filters can be changed (modularity) inside the pipeline.**

---
# Szenario
## two active filters with error handling

![](src/html/twoFilterPipelineError.html){#pipeline8}

<script>
import PassivePipeTwoActiveFiltersError from "./src/scenarios/passivePipeTwoActiveFiltersError.js"

var pipeline = lively.query(this, "#pipeline8");

(async () => {
  await new Promise((resolve, reject) => {
    pipeline.addEventListener("content-loaded", () => {
      resolve()
    })
  })
  
  var passivePipeTwoActiveFiltersError = new PassivePipeTwoActiveFiltersError(pipeline.shadowRoot,
    new PipelineLabels("", "data source", "", ""),
    new PipelineLabels("", "", "", ""),
    new PipelineLabels("", "", "only circle", ""),
    new PipelineLabels("", "", "", ""),
    new PipelineLabels("paint blue", "", "", ""),
    new PipelineLabels("", "", "", ""),
    new PipelineLabels("", "data sink", "", ""))
  return passivePipeTwoActiveFiltersError.buildButtons()
})()
</script>

**What happens if objects are pushed through the system that are mutable from the outside?**


---
# Szenario
## t-filter

![](src/html/teePipeline.html){#pipeline6}

<script>
import TPipeActiveFilter from "./src/scenarios/tPipeActiveFilter.js"

var pipeline = lively.query(this, "#pipeline6");

(async () => {
  await new Promise((resolve, reject) => {
    pipeline.addEventListener("content-loaded", () => {
      resolve()
    })
  })
  
  var tPipeActiveFilter = new TPipeActiveFilter(pipeline.shadowRoot,
    new PipelineLabels("", "data source", "", ""),
    new PipelineLabels("", "", "", ""),
    new PipelineLabels("", "separate filter", "", ""),
    new PipelineLabels("", "red / yellow", "", ""),
    new PipelineLabels("", "data skin 1", "", ""),
    new PipelineLabels("blue / green", "", "", ""),
    new PipelineLabels("", "", "", "data sink 2"))
  return tPipeActiveFilter.buildButtons()
})()
</script>

**With a t-shaped pipline, the output of a filter can be piped into multiple destinations.**

---

# Szenario
## grep

![](src/html/grepExamplePipeline.html){#pipeline7}

<script>
import GrepPassivePipeTwoActiveFilter from "./src/scenarios/grepPassivePipeTwoActiveFilter.js"

var pipeline = lively.query(this, "#pipeline7");

(async () => {
  await new Promise((resolve, reject) => {
    pipeline.addEventListener("content-loaded", () => {
      resolve()
    })
  })
  
  var grepPassivePipeTwoActiveFilter = new GrepPassivePipeTwoActiveFilter(pipeline.shadowRoot,
    new PipelineLabels("", "more.json", "", ""),
    new PipelineLabels("", "|", "", ""),
    new PipelineLabels("", "grep circle", "", ""),
    new PipelineLabels("|", "", "", ""),
    new PipelineLabels("", "", "", "sed 's/circle/square/'"),
    new PipelineLabels("", "|", "", ""),
    new PipelineLabels("", "", "", "grep red"),
    new PipelineLabels("|", "", "", ""),
    new PipelineLabels("", "terminal", "", ""))
  return grepPassivePipeTwoActiveFilter.buildButtons()
})()
</script>



<pre>
  <code> more example.json | grep circle | sed 's/circle/square/' | grep red</code>
</pre>

![](./src/ressources/4.png)

---

# Conclusion

* Pipes and Filters are either active of passive.
* Splitting up of workload with multiple smaller filter.
* The pipeline is modular; every part is interchangeable.
  * This may lead to an easy maintainability.
* T-shaped pipelines can be used to filter in parallel.
<!-- spacer -->
<!-- spacer -->
## Challenges
* Each part can potentially bottleneck the whole pipeline.
* Data manipulation can lead to false results or system failure.
  * Filter may not be applicable to the object
  * proper error handling is needed 

