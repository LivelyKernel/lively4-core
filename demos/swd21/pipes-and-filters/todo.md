# TODO

## FRAGEN AN JENS

- [x] Wo legen wir unser Projekt an, im Demo-Ordner?
- [x] Wie bauen wir effektiv Animationen?
- [x] Was sollten eigene Components werden?
- [x] Soll eine Filter-Stage als Component vorliegen, wie generisch muss das sein?
- [x] Wo/Wie sollen in Zukunft die Pipes und Filter verwendet werden?

## TODOs

- [x] Pipes and Filters Kapitel lesen
- [x] Programm, dass in todo.md todo-Items heraussucht und parsed -> x offen y geschlossen
- [ ] Break Pipes & Filters
- [ ] Welche Konzepte wollen wir darstellen
    - Wer hat Kontrolle [pulling vs pushing])
    - Abstraktionslevel kenntlich machen (was nehme ich entgegen, was schiebe ich raus, aber wie ich das mache ist egal...)
    - Was wird durch ne Pipe geschoben? 
      - Reine Daten?
      - Oder auch Metadaten?
      - Was muss weitergereicht werden?
      
## NICE TO KNOW
- PowerShell schiebt Objekte durch die Pipe. Evt.
- JSONL     

## Related Work
- [ ] Map-Reduce
- [ ] Broker
- [ ] Micro Services als Architekturpattern ("Was in den Boxen passiert ist dem Außen egal")
- [ ] Dataflow (Enduser) Programming Languages
    - [ ] Yahoo Pipes
    - [ ] Apple Automater
    
## Research Questions / Fragen für die Präsentation
- Wie funktionieren Schleifen in der Pipe?
- Welche Arbeit nimmt das Architekturpattern dem Programmierer ab, welche Vorteile bietet es?
- streaming vs seperate steps bso grep vs sort
- t-form pipe
- draw io 
<script>
var result = <div></div>

var filter = new TodoFilter();
filter.render(url);


var target = this.parentElement;

var mutationObserver = new MutationObserver(async (mutations, observer) => {
  var newContent = await filter.render(url)
  result.innerHTML = "";
  result.appendChild(newContent);
    //this.onMutation(mutations, observer)
});
mutationObserver.observe(target, {
  childList: true, 
  subtree: true, 
  characterData: true, 
  attributes: true});



result;
</script>