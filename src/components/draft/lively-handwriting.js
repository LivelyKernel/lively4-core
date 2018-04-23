import Morph from 'src/components/widgets/lively-morph.js';

export default class LivelyHandwriting extends Morph {  
  initialize() {
    var context = this;
    this.windowTitle = "Lively Handwriting";
    this.registerButtons();
    
    this.lively_paper = this.get('#drawingCanvas');
    this.createButtonsFor(this.getDefaultButtons());
    
    this.addEventListener("execHandwritingRecognition", function(){this.save(this)})
  }
  
  clearText() {
    var result_text = this.get("#result");
    result_text.innerHTML = "";
  }
  
  onClearText() {
    this.clearText();
  }
  
  acceptSuggestion(value) {
    var result_text = this.get("#result");
    result_text.innerHTML = result_text.innerHTML + " " + value;
    this.lively_paper.clear();
    this.get("#dynbuttons").innerHTML = "";
    this.createButtonsFor(this.getDefaultButtons());
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
    var context = this;
    var dynbuttons = this.get("#dynbuttons");
    for (var k = 0; k < suggestions.length; k++) {
      var dynButton = document.createElement("BUTTON");
      dynButton.id = "#suggestion" + k;
      dynButton.textContent = suggestions[k];
      dynButton.style.display = "unset";
      dynButton.onclick = function() {context.acceptSuggestion(this.textContent)};
      dynbuttons.appendChild(dynButton);
    }
  }
  
  getLanguageToUse() {
    var languageDropdown = this.get("#language");
    var languageToUse = languageDropdown.options[languageDropdown.selectedIndex].value;
    return languageToUse;
  }
  
  handleServerResponse(response, context) {
    response.json().then(data => {
      console.log("Got data: " + JSON.stringify(data));
      console.log(new Date() - context.start);
              
      var dynbuttons = context.get("#dynbuttons");
      dynbuttons.innerHTML = "";

      var suggestions = context.getSuggestions(data);
      context.createButtonsFor(suggestions);
    });
  }
  
  async save(context) {
    context.start = +new Date()
    fetch("https://lively-kernel.org/lively4handwriting", {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      method: "POST",
      body: JSON.stringify({points: [].concat.apply([], context.lively_paper.canv_points), language: context.getLanguageToUse()})
    })
    .then(function(response){context.handleServerResponse(response, context)})
    .catch(function(res){ console.log(res) });
  }
  
  livelyPrepareSave() {
    this.save(this);
  }

}