<!-- markdown-config presentation=true -->

<link rel="stylesheet" type="text/css" href="../../../doc/presentation/style.css"  />
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
David Rauch, Patrick Rein, Stefan Ramson, <u>Jens Lincke</u>, and Robert Hirschfeld
</div>


<div class="credentials">
  <br>
  <a class="plain" href="https://www.hpi.uni-potsdam.de/hirschfeld/">Software Architecture Group<br>
Hasso Plattner Institute, University of Potsdam, Germany</a>
  <br>
  <br>
  <a class="plain" href="https://2019.programming-conference.org/"><b>‹Programming› 2019<br> Mon 1 - Thu 4 April 2019 Genoa, Italy</b></a>
</div>

<!---



---

## Motivation -  Classic (Application) Programming Workflow

![](the_long_loop.png){.centered}


---

## Motivation -  Classic (Application) Programming Workflow

![](the_long_loop_green.png){.centered}


---

## Motivation - Live (Application) Programming Workflow

![](the_long_loop_live-programming.png){.centered}
-->


---
# Motivation 
## Classic (Application) Programming Workflow {.sub}

<!--

![](motivation_classic_programming_workflow.png){.centered}
-->

<lively-drawio src="./motivation.xml"></lively-drawio:{.centered}>

<!-- Gap between code and behavior -->

---
# Motivation
## Live (Application) Programming Workﬂow {.sub}

<!--

![](motivation_live_programming_workflow.png){.centered}
-->

<lively-drawio src="./motivation_live.xml"></lively-drawio:{.centered}>


---
# Motivation
## Example-based (Application) Programming Workflow {.sub}

<!--
![](motivation_example-based_programming_workflow.png)
-->

<lively-drawio src="./motivation_example.xml"></lively-drawio:{.centered}>


<!--
# Motivation
## Concrete Examples vs Abstract Code {.sub}



---
-->

---
# Motivation
## Existing Example-based Systems {.sub}

![](example_based_systems.png){.centered}

---
# Approach

![](steps.png){.centered}


---
# Survey

- Survey of 8 existing solutions 
  - Only 4 with “explicit” examples
- Many focus on specific domain 
- Most only for small programs
- Identify: 
  - Common patterns 
  - Limitations and features

![](survey.png){.right}

---
# Survey
## Feature Space for Example-based Systems {.sub}

Example: Set of input values for a function/method (example invocation) 

- Feedback on runtime state
  - Feedback granularity
  - State over time
  - State over modules
  - Arbitrary objects
  - Domain-specific feedback
- Associating examples with code
  - Multiple examples for one part of the application
  - Reusing parts of examples	

{style="width:45%; float: left"}

- Specifying context
- Determining relevant sections of code
  - Control flow
  - Runtime state
  - Program output
- Keeping track of assumptions {style="margin-top:10px"}
- Navigating the trace{style="margin-top:10px"}

{style="width:45%; float: left"}

---
## Survey - Results

![](requirements_table.png)


--- 
## Survey -  Identified Features

<!--

![](features.png){.centered}

-->

<lively-drawio src="./survey-features.xml"></lively-drawio>{.centered}


---
# Approach
## Babylonian-style Programming Editor {.sub}

<!--
![](babylonian-style_programming_editor.png){.centered}

Live results for a concrete implementation (left) and an abstract implementation with live examples (right)
-->

![](babylonian_figure1.png){.centered}

---
# Design

- Single panel 
  - Behavioral information inline
- Editor integration 
  - Annotations are UI widgets
- Multiple editors 
  - Follow examples across modules

![](final_editor.png){.right}

---
# Design
## Multiple Examples {.sub}

- Multiple examples per function 
- May be activated or deactivated 
- Named examples 
- Assigned colors

![](design_multiple_examples.png){.right}

---
# Design
## Probes  {.sub}

- Probe source code for values 
- Attach to syntax elements 
- See values for examples 
- See changes during statement 
- Chronological order 
- Object inspector supported

![](design_probes.png){.right}

--- 
# Design
## State over Time  {.sub}

- Sliders 
- Attach to flow control structures 
- Scroll through iterations 
- Probes filter values 
- Easier correlation of values

![](design_state_over_time.png){.right}


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
# Demo
## Babylonian-style Programming Editor {.sub}

<!--
<script>
(async () => {
  var demo = await lively.create("lively-markdown")
  demo.setContent(await fetch(lively4url + "/src/babylonian-programming-editor/demos/index.md").then(r => r.text()))
  return demo
})()
</script>
-->


![](babylonian_demo.png){style="width: 600px; position: absolute; top: 180px; right: 20px"}

- [demos](browse://src/babylonian-programming-editor/demos/)
- [binary search](edit://src/babylonian-programming-editor/demos/binary-search.js)
- [tree-scene](edit://src/babylonian-programming-editor/demos/tree-scene.js)
  - [tree-base](edit://src/babylonian-programming-editor/demos/tree-base.js)
- [utils/ast](edit://src/babylonian-programming-editor/utils/ast.js)
  - [location-converter.js](edit://src/babylonian-programming-editor/utils/location-converter.js)

<!--

this.drawBranches(ctx, random, i+2, angle + random(0.3, 0.6), tipX + 1, tipY, width)

-->

---
# Implementation

- Implemented and integrated in Lively4 web-based development environment
- Embedded Widgets in  CodeMirror
- Example Evaluation, when user stops typing:

<!--
![](implementation.png)
-->
<lively-drawio src="./implementation.xml"></lively-drawio:{.centered}>
---
# Future Work

- **Projectional Editing:** Persistent AST 
- **Example Execution Paths:** How did an example reach a certain point?
- Non-terminating Examples: How to support? 
- Non-“deep” systems: How to realize complex features? 
- Unit Tests: How to integrate examples and unit tests?

---
# Conclusion

- Integrated live examples into source code of complex applications
- Surveyed existing systems 
- **Designed and implemented a new editor**
- **Evaluation: Editor enables new use-cases**
- Focus on complex applications opens new research questions


---
# Babylonian-style Programming Editor

- Feedback on runtime state
  - Feedback granularity
  - State over time
  - State over modules
  - Arbitrary objects
  - Domain-specific feedback
- Associating examples with code
  - Multiple examples for one part of the application
  - Reusing parts of examples	
- Specifying context
- Determining relevant sections of code
  - Control flow
  - Runtime state
  - Program output
- Keeping track of assumptions {style="margin-top:10px"}
- Navigating the trace{style="margin-top:10px"}


{style="transform: scale(0.8); transform-origin: top left; width:45%; float: left"}


![](babylonian_demo.png){style="width: 550px; position: absolute; top: 200px; right: 20px"}

---

<div class="title">Backup Slides</div>

--- 
# Implementation
## AST Transformation{.sub}

![](implementation_ast_transformation.png)

---

# Evaluation

- Editor features 
  - Binary Search 
  - Canvas
- Editor performance 
  - Responsiveness in different scenarios

---
# Evaluation
## Performance {.sub}

- Baseline: empty 
- Simple: 
  - Binary search implementation 
  - 3 examples, 4 probes, 1 slider
- Complex: 
  - 700 LoC 
  - 8 examples, 11 probes, 1 slider

{#EvaluationPerformance}

![](evaluation_performance_1.png){.right}

---
# Evaluation
## Performance {.sub}

<!-- #TODO extract copy element as behavior into a component -->
<div class="cloneContainer"></div>
<script>
  // clone content
  var id = "#EvaluationPerformance"
  var element = lively.query(this, id)
  this.previousElementSibling.innerHTML = element ? element.outerHTML  : "element not found: " + id;
  ""
</script>

![](evaluation_performance_2.png){.right}

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
  return ""
})()
</script>