# #EUD20 - Lively Energy Simulation

[eud20](https://lively-kernel.org/lively4/lively4-seminars/EUD2020/project_4/index.md)

- port <https://lively-kernel.org/repository/webwerkstatt/demos/EnergySimulationScripted.xhtml>

<script>
  import ComponentCreator from "src/client/morphic/component-creator.js"
  var container  = lively.query(this, "lively-container")
  if(!container) throw new Error("Not inside lively container?");
  ComponentCreator.createUI(container)
</script>