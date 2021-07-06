<!-- markdown-config presentation=true -->

<link rel='stylesheet' href='https://lively-kernel.org/lively4/swd21-pipes-and-filters/demos/swd21/pipes-and-filters/presentation/src/html/styles.css'>

<style data-src="../../../../src/client/presentation.css"></style>

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

## Motivation

* Für welche Problemklasse? für welchen fall ist das geeignet beispiel?

* ganz konkretes beispielX konstruieren

* Beispielbild Pipes and filter system daten von links nach recht 


## Einordnung als Architekturpattern/-muster
* als Alternative zu Layer, Broker, MVC

* warum sind die nicht so gut für beispielX (wenn nicht zu viel aufwand)

---

# Pipeline

![](./src/html/simplePipeline.html){#emptyPipeline}

<script>
import PipelineBuilder from "./src/utils/pipelineBuilder.js"

var pipeline = lively.query(this, "#emptyPipeline");

(async () => {
  await new Promise((resolve, reject) => {
    pipeline.addEventListener("content-loaded", () => {
      resolve()
    })
  })
  
  var pipeBuilder = new PipelineBuilder(pipeline.shadowRoot)
  pipeBuilder.onlyShowSpecificElements([])
})()
</script>

* Pipeline wird schritt für schritt aufgebaut mit allen Bestandteilen

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
  pipeBuilder.onlyShowSpecificElements(['data-source'])
})()
</script>

 hier noch ein paar figuren in der datasource
* Was ist eine Datasource?
* Was ist ein Datenchunk innerhalb der Source?

### log stream
<pre>
<code>2021-06-27 15:20:37.224881+0200 0x14d      Default     0x0                  0      0    kernel: (AirPortBrcmNIC) ARPT: 97029.211335: DequeueTime: 0xaaaaaaaa
2021-06-27 15:20:37.224885+0200 0x14d      Default     0x0                  0      0    kernel: (AirPortBrcmNIC) LastTxTime: 0x7a69c6b8
2021-06-27 15:20:37.224888+0200 0x14d      Default     0x0                  0      0    kernel: (AirPortBrcmNIC) PHYTxErr:   0x0000
2021-06-27 15:20:37.224892+0200 0x14d      Default     0x0                  0      0    kernel: (AirPortBrcmNIC) PHYTxErr:   0x0000</code>
</pre>

> datachunks sind die logeinträge

### textfile
<pre>
<code>Lorem ipsum dolor sit amet, consetetur sadipscing elitr, 
sed diam nonumy eirmod tempor
invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua.
At vero eos et accusam et justo duo dolores et ea rebum. Stet clita
kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.</code>
</pre>

> datachunks sind die einzelnen Wörter


### Objekte/Datensätze/Whatever/Chunk (Beispiel; JSON)
<pre>
<code>[
{"name": "Apfel", "amount": 2, "category": "fruit"},
{"name": "Mehl", "amount": 2, "category": "mehl"},
{"name": "Hefe", "amount": 1, "category": "hefe"},
{"name": "Birne", "amount": 5, "category": "fruit"},
{"name": "Zucker", "amount": 300, "category": "somehtingElse"},
{"name": "Milch", "amount": 1, "category": "notFruit"},
{"name": "Bier", "amount": 11, "category": "neitherFruit"},
{"name": "Bananen", "amount": 4, "category": "fruit"}
]</code>
</pre>

>Datachunks (Verarbeiotungseinheit) sind die Listeneinträge


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
  pipeBuilder.onlyShowSpecificElements(['data-source'])
  
  var activePipePassiveFilter = new ActivePipePassiveFilter(pipeline.shadowRoot)
  activePipePassiveFilter.fillDataSourceWithNRandomForms(10)
})()
</script>

*eine geometrische Figur symbolisiert einen data chunk

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
  pipeBuilder.onlyShowSpecificElements(["data-source", "pipe1", "pipe1Connector" ])
  
  var activePipePassiveFilter = new ActivePipePassiveFilter(pipeline.shadowRoot)
  activePipePassiveFilter.fillDataSourceWithNRandomForms(10)
})()
</script>


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
  pipeBuilder.onlyShowSpecificElements(["data-source", "pipe1", "pipe1Connector", "filter" ])
    
  var activePipePassiveFilter = new ActivePipePassiveFilter(pipeline.shadowRoot)
  activePipePassiveFilter.fillDataSourceWithNRandomForms(10)
})()
</script>

* Austauschbar

## Datasink


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
    
  var activePipePassiveFilter = new ActivePipePassiveFilter(pipeline.shadowRoot)
  activePipePassiveFilter.fillDataSourceWithNRandomForms(10)
})()
</script>

---

# Bekannte Anwendung

## Compiler

Pipes and Filter Architektur im Compiler Aufbau  

Datasource: source programm z.B. test.java  
Pipes: Streams  
Filter: z.B Scanner, Parser, Target Code Generator    
Datasink: ByteCode z.B. test.class





![](https://cs.lmu.edu/~ray/images/compilerphases.png)
<!---
https://cs.lmu.edu/~ray/notes/compilerarchitecture/
-->
___
## grep
<pre>
<code>textfile.txt | grep "someText" | wc</code>
</pre>

textfile: dataSource  
|: stdout piped into  
grep: filter Wörter == "someText"  
wc: wordcount filter zählt Wörte  
stdout terminal: datasink = Anzahl aller "someText" in textfile.txt  

* powershell vs bash 
---

## screenshot/gif beispiele 

<pre>
  <code> log stream | grep "bluetooth" | sed 's/bluetoothd/AUSGETAUSCHT/' | awk '{print NF}'</code>
</pre>

<iframe src="https://drive.google.com/file/d/1mkLRhMEvISiGujtr1rT4bpro-JOL8_7u/preview" width="320" height="240" allow="autoplay"></iframe>

>Datachunks sind die Logeinträge die gestreamt  
>werden und nicht beispielsweise einzelne Wörter

---
# Szenarien

* Datasink/Source -- graphisch darstellen
* Unicode Emojis // geo figuren


## Active Filter - passive pipe

![](src/html/simplePipeline.html){#pipeline1}

<script>
import PassivePipeActiveFilter from "./src/scenarios/passivePipeActiveFilter.js"

var pipeline = lively.query(this, "#pipeline1");

(async () => {
  await new Promise((resolve, reject) => {
    pipeline.addEventListener("content-loaded", () => {
      resolve()
    })
  })
  
  var passivePipeActiveFilter = new PassivePipeActiveFilter(pipeline.shadowRoot)
  return passivePipeActiveFilter.buildButtons()
})()
</script>


* Filter pullt die Daten aus der Pipe

## Active Pipe - passive filter

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
  
  var activePipePassiveFilter = new ActivePipePassiveFilter(pipeline.shadowRoot)
  return activePipePassiveFilter.buildButtons()
})()
</script>

## Filter austauschbar

## 2 Filter

## T-Filter

## Modularität

* Pipe pusht daten in den Filter

## Weitere Aktive Parts -> Paper

## Modularität/Austauschbarkeit

* Filter wird im System durch anderen ersetzt --> System funktioniert noch
* Filter hinzufügen 

---
# Vorteile

* Beispiel durchlauf bei dem ein Filter ausgetauscht wird
* Austauschbarkeit
* Multithreading
* Gibt es Nachteile im Vergleich zu ?

---

# Varianten/Abgrenzung

* was ist es nicht z.B Tee-and-join-Pipeline-System

* Objekte sind nicht ganz so cool bei Pipes-And-Filters. Was passiert, wenn ich Attribute änder, das Objekt aber gleich bleibt (nur ein Beispiel). Wo gibt es sowas in der Praxis ?-> PowerShell schiebt da irgendwelche "Windows-Objekte" durch. Ganz strange das ganze.

---

# Diskussion

![](simplePipeline.html){#pipeline}

<script>
import PassivePipeActiveFilter from "./passivePipeActiveFilter.js"

var pipeline = lively.query(this, "#pipeline");

(async () => {
  await new Promise((resolve, reject) => {
    pipeline.addEventListener("content-loaded", () => {
      resolve()
    })
  })
  
  var passivePipeActiveFilter = new PassivePipeActiveFilter(pipeline.shadowRoot)
  return passivePipeActiveFilter.buildButtons()
})()
</script>

---
# Example Button

![](pipes1.html){#pipes1}


<script>
var pipes1 = lively.query(this, "#pipes1");
(async () => { 
  var buttons = <div> 
    <button click={evt => { 
      var connector = pipes1.shadowRoot.querySelector("lively-connector")
      lively.showElement(connector)
     }}>hello
    </button> 
  </div>
return buttons })()
</script>

<script>

import Example1 from "./example1.js"

var pipes1 = lively.query(this, "#pipes1");


(async () => {
  await new Promise((resolve, reject) => {
    pipes1.addEventListener("content-loaded", () => {
      resolve()
    })
  })
  return Example1.createView(pipes1.shadowRoot)
})()

</script>