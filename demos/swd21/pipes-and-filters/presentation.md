<!-- markdown-config presentation=false -->

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
---

# Pipeline
* Pipeline wird schritt für schritt aufgebaut mit allen Bestandteilen

## Datasource
* Was ist ein Datenchunk innerhalb des systems

## Pipe


## Filter

* Austauschbar

## Datasink

---


# Bekannte Anwendung

## Compiler

### Pipes and Filter Architektur im Compiler Aufbau  
<font size=2>
Datasource: source programm z.B. test.java  
Pipes: Streams  
Filter: z.B Scanner, Parser, Target Code Generator  
Datasink: ByteCode z.B. test.class  
</font>
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

* powershell vs bash werden die daten unterschiedlich gestreamt

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

# Abgrenzung

* was ist es nicht z.B Tee-and-join-Pipeline-System

---

# Diskussion

---
# Example Button

<script>

var example2 = lively.query(this, "#example2");
(async () => { 
  var buttons = <div> <button click={
    () => { var connector = example2.shadowRoot.querySelector("lively-connector")                 lively.showElement(connector) }}>hello</button> <button click={() => { var connector = example2.shadowRoot.querySelector("lively-connector") lively.showElement(connector) }}>world</button> </div> return buttons })()

</script>
