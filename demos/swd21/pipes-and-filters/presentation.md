<!-- markdown-config presentation=true -->

<link rel='stylesheet' href='https://lively-kernel.org/lively4/swd21-pipes-and-filters/demos/swd21/pipes-and-filters/styles.css'>

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
* Beispielbild Pipes and filter system daten von links nach recht 

## Einordnung als Architekturpattern/-muster
* als Alternative zu Layer, Broker, MVC
---

# Pipeline
* Pipeline wird schritt für schritt aufgebaut mit allen Bestandteilen

## Datasource

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

## Pipe


## Filter

* Austauschbar

## Datasink

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

<div style="height: 500px;"><lively-import id="example2" style="position:relative; height: 500px; width:500px; background-color:gray" src="https://lively-kernel.org/lively4/swd21-pipes-and-filters/src/parts/PipesAndFilterExample2.html"></lively-import></div>

* Filter pullt die Daten aus der Pipe

## Active Pipe - passive filter
<div style="height: 500px;"><lively-import style="position:relative" src="https://lively-kernel.org/lively4/swd21-pipes-and-filters/src/parts/PipesAndFilterExample.html"></lively-import></div>

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

---
# Example Button

![](pipes1.html){#pipes1, style="position: relative; height: 1600px"}

<script>
var example2 = lively.query(this, "#example2");
(async () => { 
  var buttons = <div> 
    <button click={evt => { 
      var connector = example2.shadowRoot.querySelector("lively-connector")
      lively.showElement(connector)
     }}>hello
    </button> 
  </div>
return buttons })()
</script>
