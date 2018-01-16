// FIXME: storing this in a variable like this is not a nice solution
// but I don't have any idea how to do that else...
var hwr_this;
var _lively_this;


var Handwriting = function Handwriting(canvas_id, clear_button, lively_environment, lively_this) {
    hwr_this = this;
    _lively_this = lively_this;
  
      this.lively_paper = lively_this.parentElement.querySelector('#drawingCanvas');
  
      function acceptSuggestion(value, context) {
        var result_text = _lively_this.parentElement.querySelector("#result")
        result_text.innerHTML = result_text.innerHTML + " " + value;
        context.lively_paper.clear();
        _lively_this.parentElement.querySelector("#dynbuttons").innerHTML = "";
      }


      this.lively_paper.save = async () => {
        // console.log(this.lively_paper.canv_points)
        var self = this;

        fetch("https://lively-kernel.org/lively4handwriting", {
            headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          method: "POST",
          body: JSON.stringify({points: hwr_this.lively_paper.canv_points, language: "en"})
        })
        .then(function (response) {
            console.log(response);
            response.json().then(data => {
              console.log("Got data: " + JSON.stringify(data));
              
              var dynbuttons = _lively_this.parentElement.querySelector("#dynbuttons");
              dynbuttons.innerHTML = "";

              var suggestions;
              if (data && data.hasOwnProperty("suggestions")) {
                suggestions = data["suggestions"];
                console.log(data["suggestions"])
              } else {
                suggestions = [" ", ".", ",", "!", "?"];
              }

              for (var k = 0; k < suggestions.length; k++) {
                var dynButton = document.createElement("BUTTON");
                dynButton.id = "#suggestion" + k;
                dynButton.textContent = suggestions[k];
                dynButton.style.display = "unset";
                dynButton.onclick = function() {acceptSuggestion(this.textContent, self)};
                dynbuttons.appendChild(dynButton);
              }
          });
        })
        .catch(function(res){ console.log(res) });
      }
    
  };

