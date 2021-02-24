
## AST worker
Der AST worker nimmt source code und ein Array von Plugin Urls entgegen und generiert aus diesen einen Trace der Ausführung. Dieser Prozess wurde in eine WebWorker ausgelagert, um eine frische JavaScript Umgebung zu erhalten. Normalerweise hat lively ein vorkonfiguriertes SystemJS, welches sich um imports von Files kümmert. Im WebWorker kann SystemJS so konfiguriert werden, dass nur das Trace Plugin auf allen importierten Code angewandt wird (wodurch auch imports von Plugins mit dem nötigen Trace code versehen werden).

## Trace
Trace ist die zentrale Klasse, für welche während der gesamten Aufzeichnung der Plugins sichergestellt ist, dass sie global über ```window[Trace.traceIdentifierName]``` verfügbar ist.

Ihre Aufgabe ist es zum einen den Tracelog zu generieren und zu speichern. Dazu stellt die Klasse Methode bereit, die die nötigen Instanzen von ```Event```, ```ErrorEvent``` oder ```ASTChangeEvent``` mit den nötigen Daten erstellen.

Auch erstellt der Trace die IDs für AST Knoten, die aus der Nummer der aktuell ausgeführten Pluginmethode (leider nur der aus den Babelplugins und nicht den in ```NodePath.traverse``` aufgerufenden Methoden) und einer für den gesamten AST globalen Nummer.

Trace registriert weiterhin die Positionen von AST Knoten im Quelltext und speichert diese mit einigen Optimierungen. Die dadurch vergebenen Positions-IDs kann Trace auh wieder auflösen.

## Events

## TraceLogParser
Der ```TraceLogParser``` ist ein recursive Descent Parser, der dafür verantwortlich ist den generierten Log zu säubern und zusammengehörige Events zusammenzufassen. Es erzeugt aus den ```Event```s eine Composite aus ```TraceSection``` und ```Event```s.


## Debug Trace-Plugin
Es ist möglich das tracer-plugin mit sich selbst zu debuggen. Dazu wird einfach eine Kopie des Plugins (aktuell in demos/tom/plugin-backup.js) an den WebWorker übergeben als Plugin übergeben. Die Kopie ist nötig, da SystemJS das tracer-plugin ganz am Anfang laden muss und dies nun gecached vorhält. Würde man versuchen das originale tracer-plugin noch einmal zu laden würde einfach auf diese Version zugegriffen werden, anstatt das Plugin zu transformieren. Dies wird mit diesem Workaround eines zweiten Files umgangen.

**Sollte die Kopie zur Weiterentwicklung verwendet werden, nicht vergessen die gewünschten Änderungen am Ende in das originale Plugin zu kopieren.**


## Future ideas
* Proxy für alle AST Knoten (dadurch bekommt man neben den Änderungen an den bereits existierenden Properties auch das erstellen und setzen neuer Properties mit)
* Highlight den Knoten/den Quelltextteil auf dem eine Änderung vorgenommen wird
* Diff was ist dazu gekommen; was wurde entfernt während des changes
* AST-compare sollte direkt die Änderung aufgeklappt haben (cool: farblich markieren)
* Im Plugin code markieren und anzeigen welche konkreten Traces darüber gelaufen sind

## Known problems
* Wenn zu viele Daten generiert werden (weil entweder das plugin oder der gegebene Code zu viel sind) ist der Worker nicht mehr in der Lage dazu die Daten zu senden, was darin endet, dass das TraceVisualization Tool nicht mehr funktioniert. Dies liegt anscheinend daran, dass während eines Aufrufs von JSON.stringify der Fehler: _rangeerror invalid string length_ geworfen wird