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

    if ('SpeechRecognition' in window) {
      // speech recognition API supported
      if (!this.recognition) {
        lively.success('new DRagon ');
        this._initRecognition();
      } else {
        lively.success('DRagon was there');
        this._rebindEvents();

        // this.recognition.onresult = event => foundResult(event);
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
  }

  _rebindEvents() {
    const events = "audioend,audiostart,end,error,nomatch,result,soundend,soundstart,speechend,speechstart,start";

    lively.removeEventListener('smaug');

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

  onresult(event) {
    const last = event.results.length - 1;
    const speechToText = event.results[last][0].transcript;

    lively.notify(event.interpretation + ' ' + event.results.forEach + '' + event.results[last].isFinal + ' ' + event.results.length + ' ' + event.results[0].length, speechToText);
  }
  // this method is automatically registered as handler through ``registerButtons``
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
    lively.warn('livelyPrepareSave')
    this.setAttribute("data-mydata", this.get("#textField").value);
  }

  livelyPreMigrate() {
    // is called on the old object before the migration
  }

  livelyMigrate(other) {
    this.recognition = other.recognition;
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