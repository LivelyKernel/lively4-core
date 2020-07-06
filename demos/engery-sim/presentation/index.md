<!-- markdown-config presentation=true -->

<link rel="stylesheet" type="text/css" href="./style.css"  />
<link href='http://fonts.googleapis.com/css?family=Lato:400' rel='stylesheet' type='text/css' />
<link href='http://fonts.googleapis.com/css?family=Raleway:500,600' rel='stylesheet' type='text/css' />

[//]: # (Presentation Setup)
<script>
import Presentation from "src/components/widgets/lively-presentation.js"
Presentation.config(this, { pageNumbers: true });
</script>

[//]: # (Title)

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
      <li>Demo - Energy Simulation</li>
      <li>Graphical Simulation Framework</li>
      <li>What's Next?</li>
    </ol>
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
    <h1>Dynamic Simulations</h1>
    <ul>
      <li>What is a simulation?</li>
      <li>When does somebody chooses to use a simulation?</li>
      <li>Why are simulations helpful?</li>
      <li>What is a dynamic and hybrid simulation?</li>
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
    <ul>
      <li>complexity Mathematical approach >> simulation</li>
      <li>from whiteboard to code</li>
      <li>what we want: build simulations (state machines) easily</li>
      <li>Ball example (demo?)</li>
        <ul>
        <li>show controls</li>
        </ul>
      <li>how to enable the end-user to easily create a simulation in a visually structured way</li>
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
    <h1>Project Goal</h1>
    <ul>
      <li>semi-graphical simulation framework</li>
      <li>sim+doc together & enable user to investigate results</li>
      <li>lively integration</li>
      <li>performance (more of a secondary feature?)</li>
      <li>tool: functionality of existing simulation in Lively1</li>
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
    <h1>Demo - Energy Simulation</h1>
    <ul>
      <li>Explain roughly the functionality of existing Energy Sim</li>
      (Screenshot)
      <li>
        what do we want them to pay attention to?
        <ul>
          <li>Visual component when creating simulation</li>
          <li>live logging cell creation - change all modes</li>
          <li>show connectors, references</li>
          <li>reset</li>
          <li>add notes/pictures</li>
        </ul>
      </li>
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
    <h1>Graphical Simulation Framework</h1>
    <ul>
      <li>Let's explain this concept in greater detail</li>
      <li>different views (card paper?)</li>
        <ul>
          <li>comparison to original simulation according to logging and chart visualization</li>
          <li>we have all combined</li>
          <li>dsl even easier and more readable</li>
          <li>compare concepts</li>
        </ul>
      <li>How to manage state/ behavior (slot vs our approach, vs old json approach), how to use space efficiently?</li>
      <li>how to enable documentation, images</li>
      <li>Show which cells have reference</li>
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
    <b>Learnings</b>
      <ul>
        <li>easy to integrate into lively</li>
        <li>nested components dataflow not clear?</li>
        <li>getting to know lively</li>
        <li>you need a stable internet connection</li>
      </ul>
    <b>Next Steps</b>
      <ul>
        <li>Mirroring of cells</li>
        <li>Documentation obviously - we don't have to name that?</li>
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
    <b>Limits</b>
    <ul>
      <li>Timesteps-What happens in between?</li>
      <li>We solved this in offering the user the possibility to define the time steps, so they can decide what’s appropriate for their needs of the simulation
</li>
    <li>no custom visualization</li>
    </ul>
    <b>Future Work</b>
    <ul>
      <li>gas tank example to show a direction where it could go</li>
      <li>Add a painting/visualisation component</li>
    </ul>
  </div>
  <div class="footer"></div>
</div>