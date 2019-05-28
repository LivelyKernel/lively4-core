"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import { shake } from 'utils';

// Map<name:String, buffer:AudioBuffer>
const soundBuffers = new Map();
soundBuffers.set('cube-up', bufferFor('https://lively4/gamedev/cube-up.mp3'));
soundBuffers.set('cube-down', bufferFor('https://lively4/gamedev/cube-down.mp3'));

const context = new AudioContext();

function bufferFor(file) {
  return fetch(file)
    .then(response => response.arrayBuffer())
    .then(arrayBuffer => context.decodeAudioData(arrayBuffer));
}

function play(audioBuffer) {
  const source = context.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(context.destination);
  source.start();
}

export default class SimpleButtonAnim extends Morph {
  get button() { return this.get('#target'); }
  
  async initialize() {
    this.windowTitle = "SimpleButtonAnim";
    this.registerButtons()
    
    this.button.addEventListener('dragstart', (...args) => this.dragStart(...args))
    this.button.addEventListener('dragend', (...args) => this.dragEnd(...args))
  }
  
  // this method is automatically registered as handler through ``registerButtons``
  async onTarget() {
    shake(this)
  }
  async dragStart(event) {
    play(await soundBuffers.get('cube-up'))
  }

  async dragEnd(event) {
    play(await soundBuffers.get('cube-down'))
  }
  /* Lively-specific API */

  livelyPreMigrate() {
    // is called on the old object before the migration
  }
  
  livelyMigrate(other) {
    // whenever a component is replaced with a newer version during development
    // this method is called on the new object during migration, but before initialization
    this.someJavaScriptProperty = other.someJavaScriptProperty
  }
  
  livelyInspect(contentNode, inspector) {
    // do nothing
  }
  
  livelyPrepareSave() {
    
  }
  
  
  async livelyExample() {
  }
  
  
}