import Morph from 'src/components/widgets/lively-morph.js';

export default class PenEditor extends Morph {
  get livelyPaper() { return this.get('#drawingCanvas'); }
  get resultText() { return this.get("#result"); }
  get dynButtons() { return this.get("#dynbuttons"); }
  get ast() { return this.get('#ast'); }
  
  initialize() {
    this.windowTitle = "Pen-based Editor";
    this.registerButtons();
    
    this.createButtonsFor(this.getDefaultButtons());
    
    // #TODO: was this specifically created for the writepad demo?
    this.addEventListener("execHandwritingRecognition", () => this.save());
    
    this.buildMockAST();
  }
  
  async buildMockAST() {
    var astNode = await (<generic-ast-node></generic-ast-node>)
    await astNode.livelyExample()
    this.ast.appendChild(astNode);
  }
  
  onClearText() { this.resultText.innerHTML = ""; }
  
  acceptSuggestion(value) {
    this.resultText.innerHTML += " " + value;
    this.livelyPaper.clear();
    this.hideSuggestions();
    this.createButtonsFor(this.getDefaultButtons());
  }
  
  hideSuggestions() {
    this.dynButtons.innerHTML = "";
  }
  
  getDefaultButtons() {
    return [".", ",", "!", "?", "-"];
  }
  
  getSuggestions(data) {
    if (data && data.hasOwnProperty("suggestions")) {
      return data["suggestions"];
    } else {
      return this.getDefaultButtons();
    }
  }
  
  createButtonsFor(suggestions) {
    suggestions.forEach((suggestion, k) => {
      const dynButton = <button
        id={"#suggestion" + k}
        style="display: unset"
        click={() => this.acceptSuggestion(suggestion)}>
              {suggestion}
      </button>;
      this.dynButtons.appendChild(dynButton);
    })
  }
  
  selectedLanguage() {
    var languageDropdown = this.get("#language");
    return languageDropdown.options[languageDropdown.selectedIndex].value;
  }
  
  handleServerResponse(response) {
    response.json().then(data => {
      console.log("Got data: " + JSON.stringify(data));
      console.log('Time: ' + (new Date() - this.start));
              
      this.hideSuggestions();

      var suggestions = this.getSuggestions(data);
      this.createButtonsFor(suggestions);
    });
  }
  
  async save() {
    this.start = +new Date();
    
    fetch("https://lively-kernel.org/lively4handwriting", {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      method: "POST",
      body: JSON.stringify({
        // #Refactor: this flattens the (potentially nested) array
        points: [].concat.apply([], this.livelyPaper.canv_points),
        language: this.selectedLanguage()
      })
    })
    .then(response => this.handleServerResponse(response))
    .catch(res => console.log(res));
  }
  
  livelyPrepareSave() {}

}