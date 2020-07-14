<!-- markdown-config presentation=true -->

<link rel="stylesheet" type="text/css" href="./style.css"  />
<link href='https://fonts.googleapis.com/css?family=Lato:400' rel='stylesheet' type='text/css' />
<link href='https://fonts.googleapis.com/css?family=Raleway:500,600' rel='stylesheet' type='text/css' />

[//]: # (Presentation Setup)
<script>
import Presentation from "src/components/widgets/lively-presentation.js"
Presentation.config(this, { pageNumbers: true });
</script>

<div class="layout layout-title">
  <div class="header">
    <div class='slots'></div>
    <image class='logo' src='./hpi_logo.png' />
  </div>
  <div class="content">
    <span class="title">
      Lively Simulation
    </span>
    <span class="description">
      <p>Leonardo Hübscher, Juliane Kleinknecht</p>
      <p>End User Development Seminar SS 20<br />Software Architectures</p>
      <p>14.07.2020</p>
    </span>
  </div>
  <div class="footer"></div>
</div>

---

<div class="layout">
  <div class="header">
    <div class="slots">
      <div class='slot'>14.07.2020</div>
      <div class='slot'>End User Development SS 20</div>
      <div class='slot'>Lively Simulation</div>
      <div class='slot'>Leonardo Hübscher, Juliane Kleinknecht</div>
    </div>
    <image class='logo' src='./hpi_logo.png' />
  </div>
  <div class="content">
    <h1>Outline</h1>
    <ol class='outline'>
      <li>Dynamic Simulations</li>
      <li>Motivation</li>
      <li>Project Goal</li>
      <li>Energy Simulation</li>
      <li>Demo</li>
      <li>Improve End User Experience</li>
      <li>What's Next?</li>
    </ol>
  </div>
  <div class="footer"></div>
</div>

<!-- ---

<div class="layout">
  <div class="header">
    <div class="slots">
      <div class='slot'>14.07.2020</div>
      <div class='slot'>End User Development SS 20</div>
      <div class='slot'>Lively Simulation</div>
      <div class='slot'>Leonardo Hübscher, Juliane Kleinknecht</div>
    </div>
    <image class='logo' src='./hpi_logo.png' />
  </div>
  <div class="content">
    <h1>Dynamic Simulations</h1>
    <ul>
      <li>A simulation is there to make experiments on a model to get findings on the real system</li>
      <li>Simulation - used when behavior is theoretically formally to complex (so iteratively not analytically)</li>
      <li>dynamic - time dependent  &rarr; observe processes and flows</li>
        <ul>
          <li>Continuous - uses differential equation to simulate like physics</li>
          <li>Discrete - event-driven like petri-nets</li>  
          <li>Hybrid - parts of both - not enough knowledge to be continuous (example: medicine/biology)</li>
        </ul>
      <li>Normally: "More configuration than programming"</li>
    </ul>
   <!--<ul>
      <li>What is a simulation?</li>
      <li>When does somebody chooses to use a simulation?</li>
      <li>Why are simulations helpful?</li>
      <li>What is a dynamic and hybrid simulation?</li>
    </ul>
  </div>
  <div class="footer"></div>
</div>-->

---

<div class="layout">
  <div class="header">
    <div class="slots">
      <div class='slot'>14.07.2020</div>
      <div class='slot'>End User Development SS 20</div>
      <div class='slot'>Lively Simulation</div>
      <div class='slot'>Leonardo Hübscher, Juliane Kleinknecht</div>
    </div>
    <image class='logo' src='./hpi_logo.png' />
  </div>
  <div class="content">
    <h1>Simulations</h1>
    <p align="center">Real system &#x1f30e; &rarr; too complex &#10068; &#x1f630; &rarr; model &#x1f4dd; &rarr; simulation &#x2699;</p>
    <ul>
      <li>Make experiments in simulation &rarr; find hypothesis &rarr; test in real world</li>
      <li><b>Dynamic simulations:</b> time dependent &#x1f551; &rarr; observe processes and flows</li>
      <!-- <li>Normally: "More configuration than programming"</li> -->
    </ul>
  </div>
  <div class="footer"></div>
</div>

---


<div class="layout">
  <div class="header">
    <div class="slots">
      <div class='slot'>14.07.2020</div>
      <div class='slot'>End User Development SS 20</div>
      <div class='slot'>Lively Simulation</div>
      <div class='slot'>Leonardo Hübscher, Juliane Kleinknecht</div>
    </div>
    <image class='logo' src='./hpi_logo.png' />
  </div>
  <div class="content">
    <h1>Motivation</h1>
    <div id='energySim'>
      <div id='leftMotivation'>
        <ul>
        <li>Understanding the domain though reverse engineering</li></ul>
            <!--<li>We don't know the formulas  &rarr; so we tune the parameters so they fit</li>
            <li>Extrapolate data points / estimate the errors</li>
              <ul>
                <li>what happens inbetween the timesteps?</li>
              </ul>-->
        <ul>
          <li>"From whiteboard to code" - approach </li>
            <ul>
              <li>Related to: ipython notebooks &rarr; code and documentation snippets</li>
            </ul>
        </ul>
        </div>
        <div id='bounceBall'>
            <div class='flexCol'>
              <img src="../screenshots/2020-07-07%20onlybounce.png"/>
              <p class='caption'>Bouncing Ball Example</p>
            </div>
        </div>
      </div>
      <div id='greenBoxWrapper'>
          <div class="greenBox">
            We want to enable end-users to create simulations in a visually structured way
          </div>
        </div>
    </div>
  </div>
  <div class="footer"></div>
</div>

---

<div class="layout">
  <div class="header">
    <div class="slots">
      <div class='slot'>14.07.2020</div>
      <div class='slot'>End User Development SS 20</div>
      <div class='slot'>Lively Simulation</div>
      <div class='slot'>Leonardo Hübscher, Juliane Kleinknecht</div>
    </div>
    <image class='logo' src='./hpi_logo.png' />
  </div>
  <div class="content">
    <h1>Project Goal</h1>
    <div id='greenBoxWrapper'>
      <div class="greenBox">
        We want to enable end-users to create simulations in a visually structured way
      </div>
    </div>
    <span>
      <b>Idea</b> Build a semi-graphical simulation framework
    </span>
    <ul>
      <li><i>Starting point:</i> PoC in Lively Webwerkstatt <img class='inline-img' src='./webwerkstatt.png'/></li>
      <li>Allow documentation <img class='inline-img' src='./manual.svg'/> to be part of simulation</li>
      <li>Provide a way that allows simulation result investigation <img class='inline-img' src='./investigation.svg'/></li>
      <li>Proper Lively integration <img class='inline-img' src='./integration.svg'/></li>
      <li>Port <img class='inline-img' src='./port.svg'/> existing <i>energy simulation</i> from PoC</li>
    </ul>
  </div>
  <div class="footer"></div>
</div>

---

<div class="layout">
  <div class="header">
    <div class="slots">
      <div class='slot'>14.07.2020</div>
      <div class='slot'>End User Development SS 20</div>
      <div class='slot'>Lively Simulation</div>
      <div class='slot'>Leonardo Hübscher, Juliane Kleinknecht</div>
    </div>
    <image class='logo' src='./hpi_logo.png' />
  </div>
  <div class="content">
    <h1>Energy Simulation</h1>
    <div id='energySim'>
      <div id='leftEnergySim'>
        <ul>
          <li>Simulate energy flow</li>
          <li>Fuel &rarr; transformer &rarr; consumer</li>
          <li>Possible hypothesis:
            <ul>
              <li>Is heat storage big enough?</li>
              <li>Is a backup system required?</li>
            </ul>
          </li>
        </ul>
      </div>
      <div id='rightEnergySim'>
        <div class='flexCol'>
          <img src="./energy-sim.png" />
          <p class='caption'>Energy simulation in Lively Webwerkstatt [1]</p>
        </div>
      </div>
    </div>
  </div>
  <div class="footer">
    [1] https://lively-kernel.org/repository/webwerkstatt/demos/EnergySimulationScripted.xhtml
  </div>
</div>

---

<div class="layout layout-section-heading">
  <div class="header">
    <div class='slots'></div>
    <image class='logo' src='./hpi_logo.png' />
  </div>
  <div class="content">
    <span class="sectionHeading">
      <h1>Demo</h1>
      <p>
        Energy Simulation Port
      </p>
    </span>
  </div>
  <div class="footer"></div>
</div>


---

<div class="layout">
  <div class="header">
    <div class="slots">
      <div class='slot'>14.07.2020</div>
      <div class='slot'>End User Development SS 20</div>
      <div class='slot'>Lively Simulation</div>
      <div class='slot'>Leonardo Hübscher, Juliane Kleinknecht</div>
    </div>
    <image class='logo' src='./hpi_logo.png' />
  </div>
  <div class="content">
    <h1>Demo</h1>
    <p class='gutterBottom'>Let's use our framework for the energy simulation!</p>
    <div class='twoPane'>
      <div id='left'>
        <b>What we want to show:</b>
        <ol>
          <li>Ported simulation is working</li>
          <li>How the simulation is being edited</li>
          <li>Cell locality</li>
          <li>Cell state visualization</li>
        </ol>
      </div>
      <div id='right'>
        <div class='flexCol'>
          <img id='livelyEnergySimImage' src='./lively-energy-sim.png' />
          <p class='caption'>Energy simulation in Lively4</p>
        </div>
      </div>
    </div>
  </div>
  <div class="footer"></div>
</div>

---

<div class="layout">
  <div class="header">
    <div class="slots">
      <div class='slot'>14.07.2020</div>
      <div class='slot'>End User Development SS 20</div>
      <div class='slot'>Lively Simulation</div>
      <div class='slot'>Leonardo Hübscher, Juliane Kleinknecht</div>
    </div>
    <image class='logo' src='./hpi_logo.png' />
  </div>
  <div class="content">
    <h1>Demo</h1>
    TODO insert screencast as backup
    <ul>
      <li>show ported energy sim without log component, run</li>
      <li>reset</li>
      <li>create log cell (or maybe drag it from the world into sim? - fancy)</li>
      <li>show connectors for battery or fuel</li>
      <li>look at the pictures and notes!</li>
    </ul>
  </div>
  <div class="footer"></div>
</div>

---

<div class="layout">
  <div class="header">
    <div class="slots">
      <div class='slot'>14.07.2020</div>
      <div class='slot'>End User Development SS 20</div>
      <div class='slot'>Lively Simulation</div>
      <div class='slot'>Leonardo Hübscher, Juliane Kleinknecht</div>
    </div>
    <image class='logo' src='./hpi_logo.png' />
  </div>
  <div class="content">
    <h1>Demo</h1>
    <p class='gutterBottom'>Let's use our framework for the energy simulation!</p>
    <div class='twoPane'>
      <div id='left'>
        <b>What we have seen:</b>
        <ol>
          <li>Ported simulation works ✅</li>
          <li>Loading a simulation and adding a cell ✅</li>
          <li>Independent cells/ global state access ✅</li>
          <li>Log tables and charts ✅</li>
        </ol>
      </div>
      <div id='right'>
        <div class='flexCol'>
          <img id='livelyEnergySimImage' src='./lively-energy-sim.png' />
          <p class='caption'>Energy simulation in Lively4</p>
        </div>
      </div>
    </div>
  </div>
  <div class="footer"></div>
</div>

---

<div class="layout layout-section-heading">
  <div class="header">
    <div class='slots'></div>
    <image class='logo' src='./hpi_logo.png' />
  </div>
  <div class="content">
    <span class="sectionHeading">
      <h1>Design Improvements</h1>
      <p>
        Improve end user experience
      </p>
    </span>
    <div id='simulationCellWrapper'>
      <lively-simulation-cell></lively-simulation-cell>
    </div>
  </div>
  <div class="footer"></div>
</div>

---

<div class="layout">
  <div class="header">
    <div class="slots">
      <div class='slot'>14.07.2020</div>
      <div class='slot'>End User Development SS 20</div>
      <div class='slot'>Lively Simulation</div>
      <div class='slot'>Leonardo Hübscher, Juliane Kleinknecht</div>
    </div>
    <image class='logo' src='./hpi_logo.png' />
  </div>
  <div class="content">
    <h1>Managing State and Behavior</h1>
    <img class='full' style='height: 375px;' src='./state-behavior.png' />
  </div>
  <div class="footer"></div>
</div>

---

<div class="layout">
  <div class="header">
    <div class="slots">
      <div class='slot'>14.07.2020</div>
      <div class='slot'>End User Development SS 20</div>
      <div class='slot'>Lively Simulation</div>
      <div class='slot'>Leonardo Hübscher, Juliane Kleinknecht</div>
    </div>
    <img class='logo' src='./hpi_logo.png' />
  </div>
  <div class="content">
    <h1>Cell views</h1>
    <div class='twoPane'>
      <div id='left'>
        <ul>
          <li>PoC had <u>one</u> centralized log/ chart</li>
          <li>Each cell represents one simulation unit</li>
        </ul>
        <blockquote>
          <p>
            An environment that works the way nonprogrammers expect is more inviting and helps users become more confident and productive. [1]
          </p>
        </blockquote>
        <p>
          &rarr; each unit should have it's own<br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;state/ behavior, log, chart
        </p>
      </div>
      <div id='right'>
        <div class='flexCol'>
          <img class='full' id='flipCard' src='./card-flip.png' />
          <p class='caption'>each entity has different views [1]</p>
        </div>
      </div>
    </div>
  </div>
  <div class="footer">
    [2] Myers, B. A., Pane, J. F., &amp; Ko, A. (2004). Natural programming languages and environments. Communications of the ACM, 47(9), 47-52.
  </div>
</div>

---

<div class="layout">
  <div class="header">
    <div class="slots">
      <div class='slot'>14.07.2020</div>
      <div class='slot'>End User Development SS 20</div>
      <div class='slot'>Lively Simulation</div>
      <div class='slot'>Leonardo Hübscher, Juliane Kleinknecht</div>
    </div>
    <img class='logo' src='./hpi_logo.png' />
  </div>
  <div class="content">
    <h1>Cell views</h1>
    <div class='twoPane'>
      <div id='left'>
        <ul>
          <li>PoC had <u>one</u> centralized log/ chart</li>
          <li>Each cell represents one simulation unit</li>
        </ul>
        <blockquote>
          <p>
            An environment that works the way nonprogrammers expect is more inviting and helps users become more confident and productive. [1]
          </p>
        </blockquote>
        <p>
          &rarr; each unit should have it's own<br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;state/ behavior, log, chart
        </p>
      </div>
      <div id='right'>
        <div class='flexCol'>
          <div style="height:300px;position:relative">
            <lively-import src="https://lively-kernel.org/lively4/lively4-livelyenergy/demos/engery-sim/presentation/cell-views-example.html"></lively-import>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="footer">
    [1] Myers, B. A., Pane, J. F., &amp; Ko, A. (2004). Natural programming languages and environments. Communications of the ACM, 47(9), 47-52.
  </div>
</div>

---

<div class="layout">
  <div class="header">
    <div class="slots">
      <div class='slot'>14.07.2020</div>
      <div class='slot'>End User Development SS 20</div>
      <div class='slot'>Lively Simulation</div>
      <div class='slot'>Leonardo Hübscher, Juliane Kleinknecht</div>
    </div>
    <image class='logo' src='./hpi_logo.png' />
  </div>
  <div class="content">
    <h1>Unit support for DSL</h1>
    <div class='twoPane' style='height: fit-content'>
      <div id='left' style="width: 75%;">
        <span class='mb2' style='display: block;'>
          <b>Goal</b> Allow usage of units in DSL and support automatic conversion
        </span>
        <span class='mb2' style='display: block;'>
          <b>PoC</b> Add units as comment to state only
        </span>
        <span class='success mb2' style='display: block;'>
          <b>Solution</b> Use mathjs [3] to parse the code and work with units
        </span>
      </div>
      <div id='right' style="width: 25%;">
        <div id='mathjsIcon'>
          <img width='165' height='50' src='./mathjs.png' />
        </div>
      </div>
    </div>
    <blockquote>
      <p>
        [Mathjs] features a flexible expression parser [...] and offers an integrated solution to work with [...] units, and matrices. Powerful and easy to use.
      </p>
    </blockquote>
    <pre style='margin: 0;'>math.evaluate('5.08 cm + 2 inch')     // 10.16 cm</pre>  
  </div>
  <div class="footer">
    [3] https://mathjs.org/
  </div>
</div>

---

<div class="layout">
  <div class="header">
    <div class="slots">
      <div class='slot'>14.07.2020</div>
      <div class='slot'>End User Development SS 20</div>
      <div class='slot'>Lively Simulation</div>
      <div class='slot'>Leonardo Hübscher, Juliane Kleinknecht</div>
    </div>
    <image class='logo' src='./hpi_logo.png' />
  </div>
  <div class="content">
    <h1>Unit support for DSL</h1>
    <div class='twoPane' style='height: fit-content'>
      <div id='left' style="width: 75%;">
        <span class='mb2' style='display: block;'>
          <b>Goal</b> Allow usage of units in DSL and support automatic conversion
        </span>
        <span class='mb2' style='display: block;'>
          <b>PoC</b> Add units as comment to state only
        </span>
        <span class='error mb2' style='display: block; text-decoration: line-through;'>
          <b>Solution</b> Use mathjs [3] to parse the code and work with units
        </span>
      </div>
      <div id='right' style="width: 25%;">
        <div id='mathjsIcon'>
          <img width='165' height='50' src='./mathjs.png' />
        </div>
      </div>
    </div>
    <blockquote>
      <p>
        [Mathjs] features a flexible expression parser [...] and offers an integrated solution to work with [...] units, and matrices. Powerful and easy to use.
      </p>
    </blockquote>
    <pre style='margin: 0;'>math.evaluate('5.08 cm + 2 inch')     // 10.16 cm</pre>    
    <div id='greenBoxWrapper'>
      <div class='greenBox text-center error-contained'>
        Mathjs does not fully support Javascript (f.e. loops, if/else)<br />
        User would have to learn mathjs to use it
      </div>
    </div>
  </div>
  <div class="footer">
    [3] https://mathjs.org/
  </div>
</div>

---

<div class="layout">
  <div class="header">
    <div class="slots">
      <div class='slot'>14.07.2020</div>
      <div class='slot'>End User Development SS 20</div>
      <div class='slot'>Lively Simulation</div>
      <div class='slot'>Leonardo Hübscher, Juliane Kleinknecht</div>
    </div>
    <image class='logo' src='./hpi_logo.png' />
  </div>
  <div class="content">
    <h1>Performance</h1>
    <ul style="margin-block-start: 0;">
      <li>Secondary requirement, yet important for UX</li>
      <li>Main bottle neck: compilation (boundEval of CodeMirror)</li>
      <blockquote style="margin: 0.5em 10px;">
        <p>
          Calling the [function] constructor directly can create functions dynamically but suffers from security and similar (but far less significant) performance issues to eval [...] [4]
        </p>
    </blockquote>
      <li><b>Solution</b> pre-compile javascript code of each cell</li>
      <li>technical background:
        <ul>
          <li>Create a function and pass javascript code</li>
          <li>When executing pass simulation state to pre-compiled functions as <i>this</i></li>
        </ul>
      </li>
    </ul>
  </div>
  <div class="footer">
    [4] https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function
  </div>
</div>

---

<div class="layout">
  <div class="header">
    <div class="slots">
      <div class='slot'>14.07.2020</div>
      <div class='slot'>End User Development SS 20</div>
      <div class='slot'>Lively Simulation</div>
      <div class='slot'>Leonardo Hübscher, Juliane Kleinknecht</div>
    </div>
    <image class='logo' src='./hpi_logo.png' />
  </div>
  <div class="content">
    <h1>Project Goal ✅</h1>
    <div id='greenBoxWrapper'>
      <div class="greenBox">
        We want to enable end-users to create simulations in a visually structured way
      </div>
    </div>
    <span>
      <b>Idea</b> Build a semi-graphical simulation framework
    </span>
    <ul>
      <li><i>Starting point:</i> PoC in Lively Webwerkstatt <img class='inline-img' src='./webwerkstatt.png'/></li>
      <li>Allow documentation <img class='inline-img' src='./manual.svg'/> to be part of simulation</li>
      <li>Provide a way that allows simulation result investigation <img class='inline-img' src='./investigation.svg'/></li>
      <li>Proper Lively integration <img class='inline-img' src='./integration.svg'/></li>
      <li>Port <img class='inline-img' src='./port.svg'/> existing <i>energy simulation</i> from PoC</li>
    </ul>
  </div>
  <div class="footer"></div>
</div>

---

<div class="layout">
  <div class="header">
    <div class="slots">
      <div class='slot'>14.07.2020</div>
      <div class='slot'>End User Development SS 20</div>
      <div class='slot'>Lively Simulation</div>
      <div class='slot'>Leonardo Hübscher, Juliane Kleinknecht</div>
    </div>
    <image class='logo' src='./hpi_logo.png' />
  </div>
  <div class="content">
    <h1>What's Next?</h1>
    <b>Learnings &#x1f4da;</b>
      <ul>
        <li>Lively integration is easier than expected <img class='inline-img' src='./integration.svg'/></li>
        <li>Plenty tools &amp; features &rarr; keeping overview is hard for newbies</li>
        <li>Stable internet connection required &#x1f310;</li>
        <li>Dataflow for nested components is not specified</li>
      </ul>
    <b>Next Steps &#x1f3c3;</b>
      <ul>
        <li>Mirroring of cells</li>
      </ul>
  </div>
  <div class="footer"></div>
</div>

---

<div class="layout">
  <div class="header">
    <div class="slots">
      <div class='slot'>14.07.2020</div>
      <div class='slot'>End User Development SS 20</div>
      <div class='slot'>Lively Simulation</div>
      <div class='slot'>Leonardo Hübscher, Juliane Kleinknecht</div>
    </div>
    <image class='logo' src='./hpi_logo.png' />
  </div>
  <div class="content">
    <h1>What's Next?</h1>
    <div class='twoPane'>
      <div id='left'>
        <b>Future Work ➡️</b>
        <ul>
          <li>Gas tank example is a direction where it could go</li>
          <ul>
            <li>Variable number of entities of a cell/ array of a cells</li>
            <li>Creating a visualization/ painting component</li>
          </ul>
        </ul>
      </div>
      <div id='right'>
        <lively-bouncing-ball></lively-bouncing-ball>
      </div>
    </div>
  </div>
  <div class="footer"></div>
</div>