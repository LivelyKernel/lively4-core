/*
 * Morph is a HtmlElement replacement with some API enhanncements
 */
 
export default class Morph extends HTMLDivElement {
  
  /* 
   * Access subelments by name
   * shortcut for querySelector and shadowRoot.querySelector t
   * #FeatureIdea -- In Livel3, it could it also be used to look for owners and siblings  
   */ 
  get(selector) {
    return this.getSubmorph(selector);
  }

  // #Depricated, please use either "get" or "querySelector" directly
  getSubmorph(selector) {
    var morph = this.querySelector(selector);
    if (!morph && this.shadowRoot) {
      morph = this.shadowRoot.querySelector(selector);
    }
    return morph;
  }

  set windowTitle(string){
    this._windowTitle = string;
    // #TOTO replace with connections
    if (this.parentElement && this.parentElement.titleSpan) { // check for window?
      this.parentElement.setAttribute("title", string);
    }
  }
  
  get windowTitle(){
    return this._windowTitle;
  }

  set windowIcon(string){
    this._windowIcon = string;
    // #TOTO replace with connections
    if (this.parentElement && this.parentElement.titleSpan) { // check for window?
      this.parentElement.setAttribute("icon", string);
    }
  }
  
  get windowIcon(){
    return this._windowIcon;
  }

  getAllSubmorphs(selector) {
    var morphs = this.querySelectorAll(selector);
    if (this.shadowRoot) {
      morphs = morphs.concat(this.shadowRoot.querySelectorAll(selector));
    }

    // morphs can contain null, if either none was found in this or this.shadowRoot
    return morphs.filter(m => {
      return m;
    });
  }
}
