"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';

window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
window.SpeechGrammarList = window.SpeechGrammarList || window.webkitSpeechGrammarList;
window.SpeechRecognitionEvent = window.SpeechRecognitionEvent || window.webkitSpeechRecognitionEvent;

export default class LivelySmaug extends Morph {
  async initialize() {
    this.windowTitle = "Smaug";
    this.registerButtons();

    this.get("#textField").value = this.getAttribute("data-mydata") || 0;

    // speech recognition API supported
    if ('SpeechRecognition' in window) {
      if (!this.recognition) {
        lively.success('new DRagon ');
        this._initRecognition();
      } else {
        this._rebindEvents();
      }
    } else {
      // speech recognition API not supported
      lively.error('speech recognition API not supported by your browser');
    }
  }

  _initRecognition() {
    this.recognition = new window.SpeechRecognition();
    this.recognition.interimResults = true;
    this.recognition.continuous = true;
    this.recognition.maxAlternatives = 1;

    this._rebindEvents();

    this.recognition.start();
  }

  _rebindEvents() {
    const events = "audioend,audiostart,end,error,nomatch,result,soundend,soundstart,speechend,speechstart,start";
    events.split(',').forEach(eventType => {
      this.recognition['on' + eventType] = evt => {
        this.logEvent(evt);
        const methodName = 'on' + eventType;
        this[methodName] && this[methodName](evt);
      };
    });
  }

  logEvent(evt) {
    const notification = <div><span>{evt.type}</span></div>;
    setTimeout(() => notification.remove(), 2000);
    this.get('#eventList').appendChild(notification);
  }

  onstart(evt) {
    this.markAsRunning(true);
  }

  onend(evt) {
    this.markAsRunning(false);
  }

  get runIndicator() {
    return this.get('#runIndicator');
  }
  markAsRunning(isRunning) {
    this.isRunning = isRunning;
    const runIndicator = this.runIndicator;
    runIndicator.innerHTML = '';
    if (isRunning) {
      runIndicator.appendChild(<span style="color: green;"><i class="fa fa-play"></i> listening</span>);
    } else {
      runIndicator.appendChild(<span style="color: red;"><i class="fa fa-stop"></i> not listening</span>);
    }
  }

  // model continuous mode after: https://www.google.com/intl/en/chrome/demos/speech.html
  onresult(event) {
    this.previewResult(event);

    const last = event.results.length - 1;
    const lastResult = event.results[last];

    const line = <div>
              {event.results.length + ' ' + lastResult.length}
            <span id="transcripts"></span>
            <span style="font-size: xx-small; color: gray;">{event.results[last].isFinal ? 'final' : 'interim'}</span>
            <span style="font-size: xx-small;">({event.interpretation ? 'interpretation found: ' + event.interpretation : 'no interpretation'})</span>
          </div>;

    const transcripts = line.querySelector('#transcripts');
    for (let alternative of lastResult) {
      const line = <span>{alternative.confidence}{alternative.transcript}, </span>;
      // line.style.color = `red`;
      // line.style.opacity = alternative.confidence;
      transcripts.appendChild(line);
    }

    setTimeout(() => line.remove(), 5000);
    this.get('#results').appendChild(line);
  }

  // this method is automatically registered as handler through ``registerButtons``

  previewResult(event) {
    var previous_transcript = '';
    let final_transcript = '';
    var interim_transcript = '';

    if (typeof event.results == 'undefined') {
      // recognition.onend = null;
      // recognition.stop();
      // upgrade();
      return;
    }

    for (var i = 0; i < event.results.length; ++i) {
      const transcript = event.results[i][0].transcript;
      if (i < event.resultIndex) {
        previous_transcript += transcript;
      } else if (event.results[i].isFinal) {
        final_transcript += transcript;
      } else {
        interim_transcript += transcript;
      }
    }

    function linebreak(i) {
      return i;
    }
    this.get('#previousResult').innerHTML = linebreak(previous_transcript);
    this.get('#finalResult').innerHTML = linebreak(final_transcript);
    this.get('#interimResult').innerHTML = linebreak(interim_transcript);

    if (final_transcript || interim_transcript) {
      // showButtons('inline-block');
    }
  }

  _logResults(event) {
    for (let x of event.results) {
      const line = <div>
              <span style="font-size: xx-small; color: blue;">{x[0].transcript}</span>
            </div>;
      setTimeout(() => line.remove(), 5000);
      this.get('#results').appendChild(line);
    }
  }

  onStartButton() {
    this.recognition.start();
  }

  onStopButton() {
    this.recognition.stop();
  }

  onPlusButton() {
    this.get("#textField").value = parseFloat(this.get("#textField").value) + 1;
  }

  onMinusButton() {
    this.get("#textField").value = parseFloat(this.get("#textField").value) - 1;
  }

  /* Lively-specific API */

  // store something that would be lost
  livelyPrepareSave() {
    lively.warn('livelyPrepareSave');
    this.setAttribute("data-mydata", this.get("#textField").value);
  }

  livelyPreMigrate() {
    // is called on the old object before the migration
  }

  livelyMigrate(other) {
    this.recognition = other.recognition;
    if (other.isRunning !== undefined) {
      this.markAsRunning(other.isRunning);
      if (this.recognition && !other.isRunning) {
        this.recognition.start();
      }
    }
  }

  livelyInspect(contentNode, inspector) {
    // do nothing
  }

  async livelyExample() {
    // this customizes a default instance to a pretty example
    // this is used by the 
    this.style.backgroundColor = "lightgray";
    this.someJavaScriptProperty = 42;
    this.appendChild(<div>This is my content</div>);
  }

}