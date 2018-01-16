// FIXME: storing this in a variable like this is not a nice solution
// but I don't have any idea how to do that else...
var hwr_this;
var _lively_this;


var Handwriting = function Handwriting(canvas_id, clear_button, lively_environment, lively_this) {
  hwr_this = this;
  _lively_this = lively_this;

  this.lively_paper = lively_this.parentElement.querySelector('#drawingCanvas');
  
  // init
  createButtonsFor(getDefaultButtons());
  createClearButton();
  
  function createClearButton() {
    var control = _lively_this.parentElement.querySelector("#control");
    var clearButton = document.createElement("BUTTON");
    clearButton.id = "#clearButton";
    clearButton.textContent = "Clear Text";
    clearButton.style.display = "unset";
    clearButton.onclick = function() {clearText()};
    control.appendChild(clearButton);
  }
  
  function clearText() {
    var result_text = _lively_this.parentElement.querySelector("#result");
    result_text.innerHTML = "";
  }
  
  function acceptSuggestion(value) {
    var result_text = _lively_this.parentElement.querySelector("#result");
    result_text.innerHTML = result_text.innerHTML + " " + value;
    hwr_this.lively_paper.clear();
    _lively_this.parentElement.querySelector("#dynbuttons").innerHTML = "";
    createButtonsFor(getDefaultButtons());
  }
  
  function getDefaultButtons() {
    return [".", ",", "!", "?", "-"];
  }
  
  function getSuggestions(data) {
    if (data && data.hasOwnProperty("suggestions")) {
      return data["suggestions"];
    } else {
      return getDefaultButtons();
    }
  }
  
  function createButtonsFor(suggestions) {
    var dynbuttons = _lively_this.parentElement.querySelector("#dynbuttons");
    for (var k = 0; k < suggestions.length; k++) {
      var dynButton = document.createElement("BUTTON");
      dynButton.id = "#suggestion" + k;
      dynButton.textContent = suggestions[k];
      dynButton.style.display = "unset";
      dynButton.onclick = function() {acceptSuggestion(this.textContent)};
      dynbuttons.appendChild(dynButton);
    }
  }
  
  function handleServerResponse(response) {
    console.log(response);
      response.json().then(data => {
        console.log("Got data: " + JSON.stringify(data));
              
        var dynbuttons = _lively_this.parentElement.querySelector("#dynbuttons");
        dynbuttons.innerHTML = "";

        var suggestions = getSuggestions(data);
        createButtonsFor(suggestions);
      });
  }

  this.lively_paper.save = async () => {
    // console.log(this.lively_paper.canv_points)

    fetch("https://lively-kernel.org/lively4handwriting", {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      method: "POST",
      body: JSON.stringify({points: hwr_this.lively_paper.canv_points, language: "en"})
    })
    .then(handleServerResponse)
    .catch(function(res){ console.log(res) });
  }  
};

