"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import {SocketSingleton} from 'src/components/mle/socket.js';

export default class LivelyMleIde extends Morph {
  async initialize() {
    this.windowTitle = "MLE IDE";
    this.registerButtons();
    this.socket = await SocketSingleton.get();
  }
  
  /* Lively-specific API */

  // store something that would be lost
  livelyPrepareSave() {
  }
  
  livelyPreMigrate() {
    // is called on the old object before the migration
  }
  
  livelyMigrate(other) {
    // whenever a component is replaced with a newer version during development
    // this method is called on the new object during migration, but before initialization
  }
  
  livelyInspect(contentNode, inspector) {
    // do nothing
  }
  
  async livelyExample() {
  }
  
  
}