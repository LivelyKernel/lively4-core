import Morph from 'src/components/widgets/lively-morph.js';

export default class LivelyAstComparison extends Morph {
  async initialize() {
    this.windowTitle = "LivelyAstComparison";
    this.registerButtons()

    lively.html.registerKeys(this); // automatically installs handler for some methods

  }
    
    get leftAST() {
        return this.get('#leftAst');
    }
    
    get rigthAST() {
        return this.get('#rigthAst');
    }
    
    updateView(oldAST, newAST) {
        this.leftAST.inspect(oldAST);
        this.rigthAST.inspect(newAST);
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
    this.someJavaScriptProperty = other.someJavaScriptProperty
  }
  
  livelyInspect(contentNode, inspector) {
    // do nothing
  }
  
  async livelyExample() {

  }
  
  
}