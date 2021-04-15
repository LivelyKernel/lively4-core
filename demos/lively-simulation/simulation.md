# Lively Minimal Simulation Engine

### Simulation Cells

The core of the simulation engine are the simulation cells, they have a unique name, a filed for variables which should be in json format and a field to type in code. You can access the variables in the code and also other cells variables though the combination of cell name (in camelCase) and the variable name like you see in the Example Cell.

- cell controls
  - through the context menu 
    - you can execute only this cell - that means execute the code in the CodeMirror of that cell
    - skip it - that means if the whole simulation is running this cell won't be executed 
    - and clone it
  - delete
  - dragging
- catching & showing errors

<div style="height:230px;"><lively-simulation data-hide-controller="" tabindex="0"><lively-simulation-cell style="z-index: 87; width: 376.912px; height: 220.594px; position: absolute;" data-name="Example Cell" data-state="{&quot;variable&quot;:36000}" data-snippet="variable += 1;" data-state-style="margin-top: 5px; margin-bottom: 5px; height: 53px;"></lively-simulation-cell></lively-simulation></div>

### Simulation Controller

With the simulation controller you can start and stop the simulation, which basically starts a stepping-loop to step which means to execute all simulation cells that are enabled.
- stepping Loop - bringing the simulation alive - tells the cells to step
- start/stop/velocity
- history
- add cells

<div style="height:270px;"><lively-simulation><lively-simulation-cell style="z-index: 87; width: 376.912px; height: 120.594px; position: absolute;" data-name="Example Cell" data-state="{&quot;variable&quot;:36000}" data-snippet="variable += 1;" data-state-style="margin-top: 5px; margin-bottom: 5px; height: 53px;"></lively-simulation-cell></lively-simulation></div>

### Views of a cell 
thought the buttons on the upper right corner you can switch between different views of a cell, there is:
* the code view, where you see the variables and the code of the cell 
* the logging view which is logging the state 


![log_mode_07_01](https://lively-kernel.org/lively4/lively4-livelyenergy/demos/engery-sim/screenshots//2020-07-01_log_cell.png)


* and the visualization view
![visual_mode_07_01](https://lively-kernel.org/lively4/lively4-livelyenergy/demos/engery-sim/screenshots//2020-07-01_visual_cell.png)





### The Energy Simulation

Basis for the development was this Simulation <https://lively-kernel.org/repository/webwerkstatt/demos/EnergySimulationScripted.xhtml> which simulates an Energy System.

The actual version of this Energy Simulation with our new simulation engine looks like this:

You can see here the Reset-Cell which is a cell like all others, but is not enabled so it will not be executed when the simulation is running. You could run it manually, if you want to reset all variables, because it contains code that will reset all variables of all cells to the defined values.

<div style="height:1500px;position:relative">
<lively-import src="https://lively-kernel.org/lively4/lively4-livelyenergy/demos/engery-sim/energy-simulation.html"></lively-import>
</div>

### Important files
<a href="https://lively-kernel.org/lively4/lively4-livelyenergy/src/components/demo/lively-simulation-cell.html">simulation-cell.html</a>

<https://lively-kernel.org/lively4/lively4-livelyenergy/src/components/demo/lively-simulation-cell.js>

<https://lively-kernel.org/lively4/lively4-livelyenergy/src/components/demo/lively-simulation-code-view.html>

<https://lively-kernel.org/lively4/lively4-livelyenergy/src/components/demo/lively-simulation-code-view.js>

<https://lively-kernel.org/lively4/lively4-livelyenergy/src/components/demo/lively-simulation-code.html>
### Development of Cells

![Cells_05_20](https://lively-kernel.org/lively4/lively4-livelyenergy/demos/engery-sim/screenshots/2020-05-20%20(8).png)

![Cells_05_27](https://lively-kernel.org/lively4/lively4-livelyenergy/demos/engery-sim/screenshots/2020-05-27-dark-grey.png)

![Cells_06_03](https://lively-kernel.org/lively4/lively4-livelyenergy/demos/engery-sim/screenshots/2020-06-03-log-view.png)

![Cells_06_09](https://lively-kernel.org/lively4/lively4-livelyenergy/demos/engery-sim/screenshots/2020-06-09-simlation-m-controller.png)

