Todo: write


## Debug Trace-Plugin


## Future ideas
* Proxy für alle AST Knoten (dadurch bekommt man neben den Änderungen an den bereits existierenden Properties auch das erstellen und setzen neuer Properties mit)
* Highlight den Knoten/den Quelltextteil auf dem eine Änderung vorgenommen wird
* Diff was ist dazu gekommen; was wurde entfernt während des changes
* AST-compare sollte direkt die Änderung aufgeklappt haben (cool: farblich markieren)
* Im Plugin code markieren und anzeigen welche konkreten Traces darüber gelaufen sind

## Known problems
* Wenn zu viele Daten generiert werden (weil entweder das plugin oder der gegebene Code zu viel sind) ist der Worker nicht mehr in der Lage dazu die Daten zu senden, was darin endet, dass das TraceVisualization Tool nicht mehr funktioniert. Dies liegt anscheinend daran, dass während eines Aufrufs von JSON.stringify der Fehler: _rangeerror invalid string length_ geworfen wird