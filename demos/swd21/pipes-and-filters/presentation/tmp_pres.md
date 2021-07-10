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

Wann braucht man "pipes and filter" ? 

  * großer Prozess
  * in einzelne Schritte unterteilbar
  * schritte können gleichzeitig ausgeführt werden

  Die outputdaten von schritt X sind die inputDaten von Schritt y
  
  Ein Schritt ist ein Filter welcher die Daten inkrementell verarbeitet.

## Einordnung als Architekturpattern/-muster
* als Alternative zu Layer, Broker, MVC

"Pipes and Filters" ist ein Architekturpattern 
alternativ zu z.B Layer, Broker und MVC 


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
  //pipeBuilder.onlyShowSpecificElements([])
  return pipeBuilder.animatePipelineBuild(["data-source", "pipe1", "pipe1Connector", "filter" ], 5000)
})()
</script>

* Pipeline wird schritt für schritt aufgebaut mit allen Bestandteilen

---
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

Eine Datasource stellt die zu verarbeitenden Datachunks zur Verfügung  
+ Datachunks sind die Verarbeitungseinheiten im System

typische Beispiele für eine Datasource sind:

### log stream
<pre>
<code>2021-06-27 15:20:37.224881+0200 0x14d      Default     0x0                  0      0    kernel: (AirPortBrcmNIC) ARPT: 97029.211335: DequeueTime: 0xaaaaaaaa
2021-06-27 15:20:37.224885+0200 0x14d      Default     0x0                  0      0    kernel: (AirPortBrcmNIC) LastTxTime: 0x7a69c6b8
2021-06-27 15:20:37.224888+0200 0x14d      Default     0x0                  0      0    kernel: (AirPortBrcmNIC) PHYTxErr:   0x0000
2021-06-27 15:20:37.224892+0200 0x14d      Default     0x0                  0      0    kernel: (AirPortBrcmNIC) PHYTxErr:   0x0000</code>
</pre>

> Datachunks sind die logeinträge

### textfile
<pre>
<code>Lorem ipsum dolor sit amet, consetetur sadipscing elitr, 
sed diam nonumy eirmod tempor
invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua.
At vero eos et accusam et justo duo dolores et ea rebum. Stet clita
kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.</code>
</pre>

> Datachunks sind die einzelnen Wörter


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

>Datachunks sind die Listeneinträge


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

>Eine geometrische Figur symbolisiert einen data chunk

---
## Pipe

Pipes sind die Verbindungsstücke zwischen
+ Datasource und Filter 
+ Filter und Datasink
+ Filter und Filter

Verbindet eine Pipe zwei aktive Filter synchronisiert er diese  
Mittels eines First in First out (FiFo) Buffers


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

---
## Filter

Filter sind die Verarbeitungseinheiten des Systems. 

In einem Filter werden die Daten
+ reduziert
+ bereichert
+ transformiert

Filter können aktiviert werden durch 
+ die vorhergehende Pipe (passive Filter)
+ die nachfolgende Pipe (passive Filter)
+ den Filter selbst (active Filter)

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

---
## Datasink

In den Datasink werden die daten aus der letzten Filterkomponente im System gepipet

Datasinks sind beispielsweise
+ Dateien
+ Terminal
+ Animation

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
  activePipePassiveFilter.fillDataSourceWithNRandomForms(10)
})()
</script>

---
# Bekannte Anwendung

## Compiler

>Pipes and Filter Architektur wird im Compiler Aufbau genutzt

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

<iframe src="https://drive.google.com/file/d/1mkLRhMEvISiGujtr1rT4bpro-JOL8_7u/preview" width="100%" height="100%" allow="autoplay"></iframe>

>Datachunks sind die Logeinträge die gestreamt  
>werden und nicht beispielsweise einzelne Wörter

---
# Szenarien

---
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

---
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

---

## 2 Filter

![](src/html/twoFilterPipeline.html){#pipeline4}

<script>
import PassivePipeTwoActiveFilters from "./src/scenarios/passivePipeTwoActiveFilters.js"

var pipeline = lively.query(this, "#pipeline4");

(async () => {
  await new Promise((resolve, reject) => {
    pipeline.addEventListener("content-loaded", () => {
      resolve()
    })
  })
  
  var passivePipeTwoActiveFilters = new PassivePipeTwoActiveFilters(pipeline.shadowRoot)
  return passivePipeTwoActiveFilters.buildButtons()
})()
</script>

---

## Filter austauschbar

![](src/html/twoFilterPipeline.html){#pipeline3}

<script>
import ModularActiveFilterPassivePipe from "./src/scenarios/modularActiveFilterPassivePipe.js"

var pipeline = lively.query(this, "#pipeline3");

(async () => {
  await new Promise((resolve, reject) => {
    pipeline.addEventListener("content-loaded", () => {
      resolve()
    })
  })
  
  var modularActiveFilterPassivePipe = new ModularActiveFilterPassivePipe(pipeline.shadowRoot)
  return modularActiveFilterPassivePipe.buildButtons()
})()
</script>

* Filter wird im System durch anderen ersetzt --> System funktioniert noch


---
## T-Filter

![](src/html/teePipeline.html){#pipeline5}

<script>
import TPipeActiveFilter from "./src/scenarios/tPipeActiveFilter.js"

var pipeline = lively.query(this, "#pipeline5");

(async () => {
  await new Promise((resolve, reject) => {
    pipeline.addEventListener("content-loaded", () => {
      resolve()
    })
  })
  
  var tPipeActiveFilter = new TPipeActiveFilter(pipeline.shadowRoot)
  return tPipeActiveFilter.buildButtons()
})()
</script>

---

## Vorteile

+ Austauschbarkeit der Komponenten
+ einfache Wartbarkeit
+ parallel ausführbarkeit der Filter
* Gibt es Nachteile im Vergleich zu ?


## Nachteile
- Performance jede Komponent ist mögliches Bottleneck
- Filter können nicht "zusammenarbeiten"

---

# Varianten/Abgrenzung

* was ist es nicht z.B Tee-and-join-Pipeline-System

* Objekte sind nicht ganz so cool bei Pipes-And-Filters. Was passiert, wenn ich Attribute änder, das Objekt aber gleich bleibt (nur ein Beispiel). Wo gibt es sowas in der Praxis ?-> PowerShell schiebt da irgendwelche "Windows-Objekte" durch. Ganz strange das ganze.

---

# Diskussion


