var canvasWidth = 490;
var canvasHeight = 220;

// FIXME: storing this in a variable like this is not a nice solution
// but I don't have any idea how to do that else...
var hwr_this;
var _lively_this;

var Handwriting = function Handwriting(canvas_id, clear_button, lively_environment, lively_this) {
    hwr_this = this;
    _lively_this = lively_this;

    this.lively_paper = lively_this.parentElement.querySelector('#canvasSimple');
    
    // function acceptSuggestion(value) {
      // console.log(value);
      // _lively_this.parentElement.querySelector("#result").innerHTML = value;
    // }
  
    this.lively_paper.save = async () => {
      console.log(this.lively_paper.canv_points)
  
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
            console.log("Got data: ");
            console.log(data);
            console.log("Set to: ");
            console.log(_lively_this.parentElement.querySelector("#result"));
            console.log(_lively_this.parentElement.querySelector("#result").innerHTML);
            // console.log(_lively_this.parentElement.querySelector("#suggestions"))
            // suggestions_element = _lively_this.parentElement.querySelector("#suggestions");
            // suggestions = ['abc', 'def']
           //  for (i = suggestions.length; i-- > 0;) {
           //    button_name = "#suggestion" + i;
           //    button = suggestions_element.querySelector(button_name);
           //    button.textContent = suggestions[i];
           //    button.style.display = "none";
           //    button.onclick = acceptSuggestion(button.textContent);
           //    suggestions_element.appendChild(button);
           // }

        
            _lively_this.parentElement.querySelector("#result").innerHTML = data;
        });
          // _lively_this.parentElement.querySelector("#result").innerHTML = response.json();
      })
      .catch(function(res){ console.log(res) });
    }
    
  };

