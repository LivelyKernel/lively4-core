<!-- markdown-config presentation=true -->

<link rel="stylesheet" type="text/css" href="https://lively-kernel.org/lively4/lively4-core/demos/lively-simulation/presentation/style.css"  />
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
    <image class='logo' src='https://lively-kernel.org/lively4/lively4-core/demos/lively-simulation/presentation/hpi_logo.png' />
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
    <image class='logo' src='https://lively-kernel.org/lively4/lively4-core/demos/lively-simulation/presentation/hpi_logo.png' />
  </div>
  <div class="content">
    <h1>Outline</h1>
    <ol class='outline'>
      <li>Simulations</li>
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
    <image class='logo' src='https://lively-kernel.org/lively4/lively4-core/demos/lively-simulation/presentation/hpi_logo.png' />
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
    <image class='logo' src='https://lively-kernel.org/lively4/lively4-core/demos/lively-simulation/presentation/hpi_logo.png' />
  </div>
  <div class="content">
    <h1>Simulations</h1>
    <p align="center">Real system &#x1f30e; &rarr; Too complex &#10068; &#x1f630; &rarr; Model &#x1f4dd; &rarr; Simulation &#x2699;</p>
    <div id='energySim'>
      <div id='leftEnergySim' style='width: 73%;'>
        <ul>
          <li>Experimenting in simulation &rarr; finding hypothesis</li>
          <li>Understanding the behavior of systems</li>
          <li><b>Dynamic simulations:</b> time dependent &#x1f551; </li>
          <ul style="list-style-type:none;">
            <li> &rarr; observe processes and flows</li>
          </ul>
        </ul>
      </div>
      <div id='bounceBall'>
        <div class='flexCol'>
          <img style='width: 94%;' src="https://lively-kernel.org/lively4/lively4-core/demos/lively-simulation/screenshots/2020-07-07%20onlybounce.png"/>
          <p class='caption'>Bouncing Ball Example</p>
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
    <image class='logo' src='https://lively-kernel.org/lively4/lively4-core/demos/lively-simulation/presentation/hpi_logo.png' />
  </div>
  <div class="content">
    <h1>Demo Bouncing Ball</h1>
    <video width="823" height="375" controls>
      <source src="https://lively-kernel.org/lively4/lively4-core/demos/lively-simulation/presentation/screencast_bounce.mp4" type="video/mp4">
      Your browser does not support the video tag.
    </video>
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
    <image class='logo' src='https://lively-kernel.org/lively4/lively4-core/demos/lively-simulation/presentation/hpi_logo.png' />
  </div>
  <div class="content">
    <h1>Motivation</h1>
    <div id='flexCol'>
      <img class='full' style='height: 275px; margin-left: auto; margin-right: auto;' src='https://lively-kernel.org/lively4/lively4-core/demos/lively-simulation/presentation/pres-visual.png' />
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
    <image class='logo' src='https://lively-kernel.org/lively4/lively4-core/demos/lively-simulation/presentation/hpi_logo.png' />
  </div>
  <div class="content">
    <h1>Project Goal</h1>
    <div id='greenBoxWrapper'>
      <div class="greenBox">
        We want to enable end-users to create simulations in a visually structured way
      </div>
    </div>
    <div class='twoPane'>
      <div id='left' style='width: 57%;'>
        <span>
          <b>Idea</b> Build a semi-graphical simulation framework
        </span>
        <ul class='no-bullets'>
          <li><img class='inline-img' src='https://lively-kernel.org/lively4/lively4-core/demos/lively-simulation/presentation/webwerkstatt.png'/> <i>Starting point:</i> PoC* in Lively Webwerkstatt (legacy)</li>
          <li><img class='inline-img' src='https://lively-kernel.org/lively4/lively4-core/demos/lively-simulation/presentation/manual.svg'/> Allow documentation to be part of simulation</li>
          <li><img class='inline-img' src='https://lively-kernel.org/lively4/lively4-core/demos/lively-simulation/presentation/investigation.svg'/> Provide a way that allows simulation result investigation </li>
          <li><img class='inline-img' src='https://lively-kernel.org/lively4/lively4-core/demos/lively-simulation/presentation/integration.svg'/> Proper Lively integration</li>
          <li><img class='inline-img' src='https://lively-kernel.org/lively4/lively4-core/demos/lively-simulation/presentation/port.svg'/> Port existing <i>energy simulation</i> from legacy</li>
        </ul>
      </div>
      <div id='right' style='width: 40%;'>
        <div class='flexCol'>
          <img id='simulationImage' style='height: 204px;' src='https://lively-kernel.org/lively4/lively4-core/demos/lively-simulation/presentation/simulation.png' />
          <p class='caption'>Simulation Framework</p>
        </div>
      </div>
    </div>
  </div>
  <div class="footer">
    <i>*PoC...Proof of concept</i>
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
    <image class='logo' src='https://lively-kernel.org/lively4/lively4-core/demos/lively-simulation/presentation/hpi_logo.png' />
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
          <img src="https://lively-kernel.org/lively4/lively4-core/demos/lively-simulation/presentation/energy-sim.png" />
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
    <image class='logo' src='https://lively-kernel.org/lively4/lively4-core/demos/lively-simulation/presentation/hpi_logo.png' />
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
    <image class='logo' src='https://lively-kernel.org/lively4/lively4-core/demos/lively-simulation/presentation/hpi_logo.png' />
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
          <img id='livelyEnergySimImage' src='https://lively-kernel.org/lively4/lively4-core/demos/lively-simulation/presentation/lively-energy-sim.png' />
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
    <image class='logo' src='https://lively-kernel.org/lively4/lively4-core/demos/lively-simulation/presentation/hpi_logo.png' />
  </div>
  <div class="content">
    <h1>Demo</h1>
    <video width="823" height="375" controls>
      <source src="https://lively-kernel.org/lively4/lively4-core/demos/lively-simulation/presentation/demo.mp4" type="video/mp4">
      Your browser does not support the video tag.
    </video>
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
    <image class='logo' src='https://lively-kernel.org/lively4/lively4-core/demos/lively-simulation/presentation/hpi_logo.png' />
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
          <img id='livelyEnergySimImage' src='https://lively-kernel.org/lively4/lively4-core/demos/lively-simulation/presentation/lively-energy-sim.png' />
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
    <image class='logo' src='https://lively-kernel.org/lively4/lively4-core/demos/lively-simulation/presentation/hpi_logo.png' />
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
    <image class='logo' src='https://lively-kernel.org/lively4/lively4-core/demos/lively-simulation/presentation/hpi_logo.png' />
  </div>
  <div class="content">
    <h1>Managing State and Behavior</h1>
    <img class='full' style='height: 378px; margin-left: 24px;' src='https://lively-kernel.org/lively4/lively4-core/demos/lively-simulation/presentation/state-behavior.png' />
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
    <image class='logo' src='https://lively-kernel.org/lively4/lively4-core/demos/lively-simulation/presentation/hpi_logo.png' />
  </div>
  <div class="content">
    <h1>Managing State and Behavior</h1>
    <img class='full' style='height: 375px;' src='https://lively-kernel.org/lively4/lively4-core/demos/lively-simulation/presentation/self-ui.png' />
  </div>
  <div class="footer">
    Image based on: Smith, R. B., Maloney, J., &amp; Ungar, D. (1995, October). The Self-4.0 user interface: manifesting a system-wide vision of concreteness, uniformity, and flexibility. In Proceedings of the tenth annual conference on Object-oriented programming systems (pp. 47-60).
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
    <img class='logo' src='https://lively-kernel.org/lively4/lively4-core/demos/lively-simulation/presentation/hpi_logo.png' />
  </div>
  <div class="content">
    <h1>Cell Views</h1>
    <div class='twoPane'>
      <div id='left'>
        <ul>
          <li>Legacy had <u>one</u> centralized log/ chart</li>
          <li>Each cell represents one simulation unit</li>
        </ul>
        <blockquote>
          <p>
            An environment that works the way nonprogrammers expect is more inviting and helps users become more confident and productive. [2]
          </p>
        </blockquote>
        <p>
          &rarr; each unit should have it's own<br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;state/ behavior, log, chart
        </p>
      </div>
      <div id='right'>
        <div class='flexCol'>
          <img class='full' id='flipCard' src='https://lively-kernel.org/lively4/lively4-core/demos/lively-simulation/presentation/card-flip.png' />
          <p class='caption'>each entity has different views [2]</p>
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
    <img class='logo' src='https://lively-kernel.org/lively4/lively4-core/demos/lively-simulation/presentation/hpi_logo.png' />
  </div>
  <div class="content">
    <h1>Cell Views</h1>
    <div class='twoPane'>
      <div id='left'>
        <ul>
          <li>Legacy had <u>one</u> centralized log/ chart</li>
          <li>Each cell represents one simulation unit</li>
        </ul>
        <blockquote>
          <p>
            An environment that works the way nonprogrammers expect is more inviting and helps users become more confident and productive. [2]
          </p>
        </blockquote>
        <p>
          &rarr; each unit should have it's own<br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;state/ behavior, log, chart, <b>...custom view?!</b>
        </p>
      </div>
      <div id='right'>
        <div class='flexCol'>
          <div style="height:300px;position:relative">
            <lively-import src="https://lively-kernel.org/lively4/lively4-core/demos/lively-simulation/presentation/cell-views-example.html"></lively-import>
          </div>
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
    <image class='logo' src='https://lively-kernel.org/lively4/lively4-core/demos/lively-simulation/presentation/hpi_logo.png' />
  </div>
  <div class="content">
    <h1>Unit Support for DSL</h1>
    <div class='twoPane' style='height: fit-content'>
      <div id='left' style="width: 75%;">
        <span class='mb2' style='display: block;'>
          <b>Goal</b> Allow usage of units in DSL and support automatic conversion
        </span>
        <span class='mb2' style='display: block;'>
          <b>Legacy</b> Add units as comment to state only
        </span>
        <span class='success mb2' style='display: block;'>
          <b>Solution</b> Use mathjs [3] to parse the code and work with units
        </span>
      </div>
      <div id='right' style="width: 25%;">
        <div id='mathjsIcon'>
          <img width='165' height='50' src='https://lively-kernel.org/lively4/lively4-core/demos/lively-simulation/presentation/mathjs.png' />
        </div>
      </div>
    </div>
    <blockquote>
      <p>
        [Mathjs] features a flexible expression parser [...] and offers an integrated solution to work with [...] units, and matrices. Powerful and easy to use. [3]
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
    <image class='logo' src='https://lively-kernel.org/lively4/lively4-core/demos/lively-simulation/presentation/hpi_logo.png' />
  </div>
  <div class="content">
    <h1>Outlook: Unit Support for DSL</h1>
    <div class='twoPane' style='height: fit-content'>
      <div id='left' style="width: 75%;">
        <span class='mb2' style='display: block;'>
          <b>Goal</b> Allow usage of units in DSL and support automatic conversion
        </span>
        <span class='mb2' style='display: block;'>
          <b>Legacy</b> Add units as comment to state only
        </span>
        <span class='error mb2' style='display: block; text-decoration: line-through;'>
          <b>Solution</b> Use mathjs [3] to parse the code and work with units
        </span>
      </div>
      <div id='right' style="width: 25%;">
        <div id='mathjsIcon'>
          <img width='165' height='50' src='https://lively-kernel.org/lively4/lively4-core/demos/lively-simulation/presentation/mathjs.png' />
        </div>
      </div>
    </div>
    <blockquote>
      <p>
        [Mathjs] features a flexible expression parser [...] and offers an integrated solution to work with [...] units, and matrices. Powerful and easy to use. [3]
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
    <image class='logo' src='https://lively-kernel.org/lively4/lively4-core/demos/lively-simulation/presentation/hpi_logo.png' />
  </div>
  <div class="content">
    <h1>What's Next?</h1>
    <b>Learnings &#x1f4da;</b>
      <ul>
        <li>Lively integration is easier than expected</li>
        <li>Plenty tools &amp; features &rarr; keeping overview is hard for newbies</li>
        <li>Stable internet connection required</li>
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
    <image class='logo' src='https://lively-kernel.org/lively4/lively4-core/demos/lively-simulation/presentation/hpi_logo.png' />
  </div>
  <div class="content">
    <h1>What's Next?</h1>
    <div class='twoPane'>
      <div id='left'>
        <b>Future Work ➡️</b>
        <br/>
        <br/>
         &rarr; <i>Gas tank simulation</i> shows functionality for further development
          <ul>
            <li><b>Variable number</b> of entities of a cell</li>
            <li>Creating a <b>visualization</b> component</li>
          </ul>
      </div>
      <div id='right'>
        <lively-bouncing-ball id='gastank'></lively-bouncing-ball>
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
    <image class='logo' src='https://lively-kernel.org/lively4/lively4-core/demos/lively-simulation/presentation/hpi_logo.png' />
  </div>
  <div class="content">
    <h1>Project Goal</h1>
    <div id='greenBoxWrapper'>
      <div class="greenBox">
        We want to enable end-users to create simulations in a visually structured way
      </div>
    </div>
    <div class='twoPane'>
      <div id='left' style='width: 57%;'>
        <span>
          <b>Idea</b> Build a semi-graphical simulation framework
        </span>
        <ul class='no-bullets'>
          <li><img class='inline-img' src='https://lively-kernel.org/lively4/lively4-core/demos/lively-simulation/presentation/webwerkstatt.png'/> <i>Starting point:</i> PoC* in Lively Webwerkstatt (legacy)</li>
          <li><img class='inline-img' src='https://lively-kernel.org/lively4/lively4-core/demos/lively-simulation/presentation/manual.svg'/> Allow documentation to be part of simulation</li>
          <li><img class='inline-img' src='https://lively-kernel.org/lively4/lively4-core/demos/lively-simulation/presentation/investigation.svg'/> Provide a way that allows simulation result investigation </li>
          <li><img class='inline-img' src='https://lively-kernel.org/lively4/lively4-core/demos/lively-simulation/presentation/integration.svg'/> Proper Lively integration</li>
          <li><img class='inline-img' src='https://lively-kernel.org/lively4/lively4-core/demos/lively-simulation/presentation/port.svg'/> Port existing <i>energy simulation</i> from legacy</li>
        </ul>
      </div>
      <div id='right' style='width: 40%;'>
        <div class='flexCol'>
          <img id='simulationImage' style='height: 230px;' src='https://lively-kernel.org/lively4/lively4-core/demos/lively-simulation/presentation/simulation-connect.png' />
          <p class='caption'>Simulation Framework</p>
        </div>
      </div>
    </div>
  </div>
  <div class="footer"></div>
</div>

<!-- 

---

<div class="layout">
  <div class="header">
    <div class="slots">
      <div class='slot'>14.07.2020</div>
      <div class='slot'>End User Development SS 20</div>
      <div class='slot'>Lively Simulation</div>
      <div class='slot'>Leonardo Hübscher, Juliane Kleinknecht</div>
    </div>
    <image class='logo' src='https://lively-kernel.org/lively4/lively4-core/demos/lively-simulation/presentation/hpi_logo.png' />
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

-->