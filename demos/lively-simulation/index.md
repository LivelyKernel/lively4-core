# Lively Simulation

This project was part of the End-User Development seminar SS2020. [Project Overview](https://lively-kernel.org/lively4/lively4-seminars/EUD2020/project_4/index.md) [All Projects](https://lively-kernel.org/lively4/lively4-seminars/EUD2020/index.md)

## Project Goal

The goal of this seminar was to develop a framework that enables end-users to create simulations in a visually structured way. Since the typical workflow of a simulation expert involves collecting ideas on a whiteboard, we want to make the transition from the whiteboard to our simulation framework as smooth as possible. The framework should offer features to visually interact with the simulation units, making it more abstract from the actual code that runs it. As simulations are mostly created to gather some learnings from it, the framework comes with the possibility to analyze the generated data. Lastly, we will port an existing simulation from the Lively Webwerkstatt environment to prove the power of the developed framework.

In the first section, we provide some contextual information about simulations in general and narrow the topic down to *dynamic simulations*. The section "Semi-Graphical Simulation Framework" gives an overview of the main features, including information about the used architecture. "Run a Simulation" and "Quick-Start Guide to Create Your Own Simulation" will provide the end-user with information on how to get started quickly. The conclusion will reflect on the Framework according to the project goal and give a short overview of future work.

## Simulations

In the real world there are many problems or systems that are too complex to be explained and described formally or theoretically. 
To overcome this complexity we use simulations to help us.
The first step to create a simulation is creating a model, which abstracts from the real system.
Based on the model the simulation can be developed and we are now enabled to conduct experiments to get a better understanding off the real system or to test hypotheses about it.

There are different kinds of simulations, our focus is on computer driven simulations furthermore only on dynamic simulations. Dynamic means the simulation is time dependent and process and flows are observed with them.

## Semi-Graphical Simulation Framework

The framework should follow the principle "from whiteboard to code" that guided us when designing and choosing features. We based our framework mainly on the proof-of-concept simulation (in the following called *Legacy*) that was already made available to us within the Lively Webwerkstatt. This helped us getting started quite quickly, allowing us to adopt several design decisions.

The proof-of-concept features a simulation that consists of several units ("simulation cells") that can be placed freely within the environment. Users can interact with the simulation using several control buttons, allowing them to start/ stop a simulation loop or stepping through it. Within the Legacy there exist three special cells: one is for the log data pre-processing, and the other two are for visualization purposes (table/ chart).

Our framework also uses cells that represent a simulation unit, which can be dragged across the desktop as you do with windows. In contrast to the Legacy's proof-of-concept, we separated the specific simulation code from the implementation details of the framework, allowing the framework to be used for arbitrary simulations. To make the framework fit into the new Lively4 environment, we gave them the look and feel of Lively Containers which should ease the introductory phase for users that are already familiar with the Lively4 platform. By using web components and the built-in Lively4 features, users can add their documentation to the simulation as they would do on whiteboards. It is also possible to store and load created simulations to keep working on the same simulations at different points in time.

The cell state editing is now refined, making it possible to manipulate each state entry separately and abstracts from the underlying JSON storage format. The cell behavior can be described using a domain-specific language that is based on Javascript, allowing to access the state of other cells. However, since simulations might also become quite complex, there is also an option to show foreign relationships in a visual manner. Additionally, we improved the data locality of cells by adding a logging and visualization component to each of them, instead of having only one global logging/ chart component. Lastly, the framework offers several features to edit the simulation, like cloning and mirroring of cells or having the option to skip or execute single cells.

### Architecture

The framework consists of multiple web-components that interact with each other. The main starting point is the simulation component which contains a controller and the simulation cells, each being separate web-components themselves. The controller allows the user to interact with the *engine*, which represents the separated simulation logic, and the *history*, that allows you to go back in time and revert modifications you made within the last ten minutes.

The cells consist of the title bar, where you can edit the cell name, open the cell menu, or switch through the different views. There are three different views: code-view, log-view, and chart view. As the name already indicates the chart-view contains a chart that visualizes the log data. The implemented is based on ChartJS [1], a popular framework for displaying animated charts. The log-view contains a table that uses the same log data underneath. The code-view can be further divided into the code- and state-component, whereas the code component is a wrapper around a code-mirror instance, and the state component allows the user to view and edit each state entry of a cell. The following figure shows the complete hierarchy:

![](https://lively-kernel.org/lively4/lively4-livelyenergy/demos/lively-simulation/./documentation/architecture.png)

If you want to modify the simulation framework you probably want to start with the lively-simulation.js file and use it as your starting point. Files of interest, along with the development history of the simulation, can be found in the appendix.

## Run a Simulation

This section will get you started and show you how to build your first own simulation.

### Example: Energy Simulation

To get a better understanding of how the simulation framework can be used, you might want to check out the exemplary energy simulation. As the name already indicates this example simulates the energy flow between multiple components. Transformer components such as a combined heat and power unit or a heating system use fuel to create heat and energy, which is then used by consumers. Possible use-cases for this simulation could be to find out whether the heat storage will be sufficient or whether additional backup-systems might be required. You can try out the simulation by executing [energy-simulation-original](browse://demos/lively-simulation/energy-simulation-original.html) and familiarize yourself with the simulation framework.

### Quick-Start Guide to Create Your Simulation

[quick-start-example](https://lively-kernel.org/lively4/lively4-livelyenergy/demos/lively-simulation/quick-start.html)

When you click on the link to the quick-start-example you see a simulation with the simulation controller at the top and two simulation cells, one in visualization view and the other in the code view.

Through the *step button* you can execute one simulation step, that means all cells of the simulation will be executed. With the *Start/Stop button* you can start/stop the stepping Loop and with the *slider* you can change the velocity of it. Furthermore through the *history* you can revert the simulation to different points in time.

#### Control elements of the simulation cell:
- all simulation cells can be **dragged/dropped** freely by grabbing the title-bar of it
- through the context menu you can:
  - **execute** the cell - that means only the code in the CodeMirror of that cell will be executed
  - **skip** it - that means when the whole simulation is running this cell won't be executed
  - **clone** it - this will create a new cell with the same variables and code
  - and **mirror** it - this will enable you to see different views of one cell
- switch between the **three modes**: code, logging and visualization with the symbols in the upper right corner
- there is the option to **delete** cells also in the upper right corner
- the **pin icon**, shows where the cell is referenced in other cells, the arrows point to the referenced cell you can also enable this by clicking on a reference in the code with a # symbol (you can try that in the quick-start-example where the "Second Cell" references the "Example Cell")

To create your own simulation, you can simply create a new html-document and add the `<lively-simulation></lively-simulation>` - component, from there you can freely add cells (through the add cell button) and start writing code. Through the three point menu you can also save the status of your simulation.

#### Keyboard shortcuts:
  - **a** &rarr; add cell
  - **s** &rarr; step
  - **r** &rarr; reset
  - **space** &rarr; start/stop simulation
  - **+/-** &rarr; increase/decrease velocity

## Conclusion

In our project, we developed a framework that enables end-users to create a simulation in a visually structured way. By porting the existing energy simulation we were able to prove how powerful the framework is compared to the Legacy system. While developing the framework we have been able to introduce further improvements that should facilitate the simulation creation process and allow a deeper analysis and understanding of the simulated system underneath.

## Sources

[1] [ChartJS](https://www.chartjs.org/)

## Appendix

### File List

#### Code

- https://lively-kernel.org/lively4/lively4-core/src/components/demo/lively-simulation-controller.js
- https://lively-kernel.org/lively4/lively4-core/demos/lively-simulation/engine.js
- https://lively-kernel.org/lively4/lively4-core/demos/lively-simulation/history.js
- https://lively-kernel.org/lively4/lively4-core/src/components/demo/lively-simulation.js
- https://lively-kernel.org/lively4/lively4-core/src/components/widgets/lively-code-mirror.js
- https://lively-kernel.org/lively4/lively4-core/demos/lively-simulation/energy-simulation.html
- https://lively-kernel.org/lively4/lively4-core/src/components/demo/lively-simulation-cell.js
- https://lively-kernel.org/lively4/lively4-core/src/components/demo/lively-simulation-titlebar.js
- https://lively-kernel.org/lively4/lively4-core/src/components/demo/lively-simulation-code-view.js
- https://lively-kernel.org/lively4/lively4-core/src/components/demo/lively-simulation-log-view.js
- https://lively-kernel.org/lively4/lively4-core/src/components/demo/lively-simulation-state.js
- https://lively-kernel.org/lively4/lively4-core/src/components/demo/lively-simulation-code.js
- https://lively-kernel.org/lively4/lively4-core/src/components/widgets/lively-connector.js
- https://lively-kernel.org/lively4/lively4-core/src/components/demo/lively-simulation-chart-view.js

#### Example Simulations/ Demo Code

- https://lively-kernel.org/lively4/lively4-core/demos/lively-simulation/bounce.html
- https://lively-kernel.org/lively4/lively4-core/demos/lively-simulation/energy-simulation-original.html
- https://lively-kernel.org/lively4/lively4-core/demos/lively-simulation/energy-sim-log.html
- https://lively-kernel.org/lively4/lively4-core/demos/lively-simulation/bouncing-ball.html

#### Presentation

- https://lively-kernel.org/lively4/lively4-core/demos/lively-simulation/presentation/index.md
- https://lively-kernel.org/lively4/lively4-core/demos/lively-simulation/presentation/style.css

#### Documentation

- https://lively-kernel.org/lively4/lively4-core/demos/lively-simulation/index.md
- https://lively-kernel.org/lively4/lively4-seminars/EUD2020/project_4/index.md

### Cell Development History

20.05.

![Cells_05_20](https://lively-kernel.org/lively4/lively4-livelyenergy/demos/lively-simulation/screenshots/2020-05-20%20(8).png)

27.05.

![Cells_05_27](https://lively-kernel.org/lively4/lively4-livelyenergy/demos/lively-simulation/screenshots/2020-05-27-dark-grey.png)

03.06.

![Cells_06_03](https://lively-kernel.org/lively4/lively4-livelyenergy/demos/lively-simulation/screenshots/2020-06-03-log-view.png)

09.06

![Cells_06_09](https://lively-kernel.org/lively4/lively4-livelyenergy/demos/lively-simulation/screenshots/2020-06-09-simlation-m-controller.png)