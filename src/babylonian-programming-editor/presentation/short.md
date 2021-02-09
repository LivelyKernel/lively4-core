<!-- markdown-config presentation=true -->

<link rel="stylesheet" type="text/css" href="../../../src/client/presentation.css"  />
<link rel="stylesheet" type="text/css" href="../../../src/client/lively.css"  />
<link rel="stylesheet" type="text/css" href="../../../templates/livelystyle.css"  />

<style>

  .centered {
    display: block; 
    margin-left: auto; 
    margin-right: auto;
  }

  .left {
    position: absolute;
    width: 40%;
    left: 20px;
    top: 150px;
  }

  .right {
    position: absolute;
    width: 50%;
    right: 10px;
    top: 100px;
  }


  .bottomLeft {
    width: 50%;
    position: absolute;
    bottom: 40px; 
    left: 20px;
  }
  
  .bottomRight {
    width: 50%;
    position: absolute;
    bottom: 40px; 
    right: 20px;
  }

  h2 {
    text-align: left;
  }
  
  a:visited.plain, a:link.plain {
    color: inherit;
    text-decoration: none;
  }
  
  h2.sub {
    margin-top: -20px;
  }







</style>


![](knuth_1972_page1.png){style="position:absolute; top:40px; left:40px; width:400px; border: 1px solid lightgray"}

---

![](knuth_1972_page1.png){style="position:absolute; top:40px; left:40px; width:400px; border: 1px solid lightgray"}

![](knuth_1972_cistern.png){style="position:absolute; top:50px; left:450px; width:500px; border: 1px solid lightgray"}



---

![](knuth_1972_page1.png){style="position:absolute; top:40px; left:40px; width:400px; border: 1px solid lightgray"}

![](knuth_1972_cistern.png){style="position:absolute; top:50px; left:450px; width:500px; border: 1px solid lightgray"}

![](babylonian_smalltalk_motivation.png){style="position:absolute; top:290px; left:130px; width:800px; border: 1px solid lightgray"}


---

![](babylonian_lion.png){style="width: 200px; position: absolute; right: 20px;  bottom: 20px;"}

<div class="title">
<a class="plain" href="https://arxiv.org/pdf/1902.00549">
Babylonian-style Programming 
</a>
</div>
<div class="subtitle">
Design and Implementation of a General-purpose Editor<br>Supporting the Integration of Live Examples into Source Code
</div>

<div class="authors">
David Rauch, Patrick Rein, Stefan Ramson, Jens Lincke, and Robert Hirschfeld
</div>


<div class="credentials">
  <br>
  <a class="plain" href="https://www.hpi.uni-potsdam.de/hirschfeld/">Software Architecture Group<br>
Hasso Plattner Institute, University of Potsdam, Germany</a>
  <br>
  <br>
  <a class="plain" href="https://2019.programming-conference.org/"><b>‹Programming› 2019<br> Mon 1 - Thu 4 April 2019 Genoa, Italy</b></a>
</div>



---
## Existing Example-based Systems

![](example_based_systems.png){.centered}

---
# Design
## Probes  {.sub}

- Probe source code for values 
- Attach to syntax elements 
- See values for examples 
- See changes during statement 
- Chronological order 
- Object inspector supported

![](design_probes.png){.right style="width:58%"}

--- 
# Design
## State over Time  {.sub}

- Sliders 
- Attach to flow control structures 
- Scroll through iterations 
- Probes filter values 
- Easier correlation of values

![](design_state_over_time.png){.right style="width:40%"}


--- 
# Design
## Objects and Data Structures  {.sub}

- Supported by probes 
- Usable in examples 
- (Custom) instance templates 
- Links

![](design_objects_and_data_structures_1.png){.bottomLeft}
![](design_objects_and_data_structures_2.png){.right}

<!-- #TODO source: @rhi, Fibonacci -> similar.... -->

---
# Design
## Behavioral Highlighting  {.sub}

- Examples indicate intent 
- Fade out code that was not reached 
- Quickly find relevant code 
- Examine conditions without probes


![](design_behavioural_highlighting.png){.right}

<!-- Behavioral highlighting for a conditional -->

---
# Design
## Persistent Examples  {.sub}

- Serialized to JSON 
- Saved as comments 
- Before and after syntax elements
- On load: parse and hide

![](design_persistent_examples.png){.right}

---
# Design
## Additional Features  {.sub}

- Replacements 
  - Replace source code 
  - Only for example evaluation
- Pre- and postscript 
  - Run before and after example 
  - Similar to setup and teardown

![](design_additional_features.png){.right}


---
<!-- #TODO pull this up into presentation? -->
<script>



// poor men's slide master #Hack #TODO How to pull this better into lively-presentation?
var ctx = this;
(async () => {
  await lively.sleep(500)
  var presentation = lively.query(ctx, "lively-presentation")
  if (presentation && presentation.slides) {
    presentation.slides().forEach(ea => {
      var img = document.createElement("img")
      img.classList.add("logo")
      img.src="https://lively-kernel.org/lively4/lively4-seminars/PX2018/media/hpi_logo.png" 
      img.setAttribute("width", "50px")
      ea.appendChild(img)
      var div = document.createElement("div")
      div.classList.add("page-number")
      ea.appendChild(div)
    });
  } 

// hot fix
  await lively.sleep(500)
  Array.from(lively.allElements(true))
  .filter(ea => ea.textContent && ea.textContent.match(/^Like douc/)).forEach(ea => ea.textContent = "Like documentation")


  
  return ""
})()
</script>