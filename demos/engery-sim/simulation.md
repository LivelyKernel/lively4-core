# Lively Minimal Simulation Engine

### Simulation Cells

The core of the simulation engine are the simulation cells, they have a unique name, a filed for variables which should be in json format and a field to type in code. You can access the variables in the code and also other cells variables though the cell name (in camelCase) and the variable name like you see in the Example Cell.

- cell controls
  - through the context menu 
    - you can execute only this cell - that means execute the code in the CodeMirror of that cell
    - skip it - that means if the whole simulation is running this cell won't be executed 
    - and clone it
  - delete
  - dragging
- catching & showing errors

<div style="height:230px;"><lively-simulation data-hide-controller="" tabindex="0"><lively-simulation-cell style="z-index: 87; width: 376.912px; height: 220.594px; position: absolute;" data-name="Example Cell" data-state="{&quot;variable&quot;:36000}" data-snippet="this.exampleCell['variable'] += 1;" data-state-style="margin-top: 5px; margin-bottom: 5px; height: 53px;"></lively-simulation-cell></lively-simulation></div>

### Simulation Controller

With the simulation controller you can start and stop the simulation, which basically starts a stepping-loop to step which means to execute all simulation cells that are enabled.
- stepping Loop - bringing the simulation alive - tells the cells to step
- start/stop/velocity
- history
- add cells

<div style="height:270px;"><lively-simulation><lively-simulation-cell style="z-index: 87; width: 376.912px; height: 220.594px; position: absolute;" data-name="Example Cell" data-state="{&quot;variable&quot;:36000}" data-snippet="this.exampleCell['variable'] += 1;" data-state-style="margin-top: 5px; margin-bottom: 5px; height: 53px;"></lively-simulation-cell></lively-simulation></div>

### Logging

### The Energy Simulation

Basis for the development was this Simulation <https://lively-kernel.org/repository/webwerkstatt/demos/EnergySimulationScripted.xhtml> which simulates an Energy System.

The actual version of this Energy Simulation with our new simulation engine looks like this:

TODO: why is this not working?
<div style="height:1500px;position:relative">
<lively-import src="https://lively-kernel.org/lively4/lively4-livelyenergy/demos/engery-sim/energy-simulation.html"></lively-import>
</div>

<!--
<lively-simulation tabindex="0" data-velocity="&quot;60&quot;" data-stop-on-error="false"><lively-simulation-cell style="top: 284.758px; left: 25px; width: 339.433px; height: 187.824px; z-index: 80;" data-name="Fuel" data-state="{&quot;gas&quot;:36000}" data-snippet="if (this.fuel['gas'] <= 0)
  throw Error('Gas is empty!')" data-state-style="margin-top: 5px; margin-bottom: 5px; height: 45px;"></lively-simulation-cell><lively-simulation-cell style="top: 491.754px; left: 29px; z-index: 89; width: 474.816px; height: 286.351px;" data-name="Heating System" data-state="{&quot;heat&quot;:0,&quot;factor&quot;:20,&quot;maxHeat&quot;:5}" data-snippet="const shouldApplyMax = () => {
  const { factor, heat, maxHeat } = $;
  const { gas } = fuel;
  const { capacity, energy } = heatStorage;
  const full = maxHeat * factor;
  const LOWER_ENERGY_THRESHOLD_PERCENTAGE = 0.3;
  return _.every([
    heat < full,
    gas > maxHeat,
    energy < LOWER_ENERGY_THRESHOLD_PERCENTAGE * capacity
  ]);
};

const shouldTransferHeatToStorage = () => {
  const { heat, maxHeat } = $;
  const { capacity, energy } = heatStorage;
  return heat > 2 * maxHeat &amp;&amp; energy < capacity;
};

if (shouldApplyMax()) {
  const { maxHeat } = $;
  const gasConsumption = maxHeat;
  fuel['gas'] -= gasConsumption;
  $['heat'] += maxHeat;
}

const { factor, heat } = $;
const delta = heat / factor;
const HEAT_LOSS_PERCENTAGE = 0.2;
if (shouldTransferHeatToStorage()) {
  $['heat'] -= delta;
  heatStorage['energy'] += (1.0 - HEAT_LOSS_PERCENTAGE) * delta;
} else 
  $['heat'] -= HEAT_LOSS_PERCENTAGE;" data-state-style="margin-top: 5px; margin-bottom: 5px; height: 278px;"></lively-simulation-cell><lively-simulation-cell style="top: 285px; left: 393.762px; z-index: 87; width: 345.719px; height: 187.008px;" data-name="Heat Storage" data-state="{&quot;energy&quot;:0,&quot;capacity&quot;:360}" data-snippet="// Enter simulation code here" data-state-style="margin-top: 5px; margin-bottom: 5px; height: 53px;"></lively-simulation-cell><lively-simulation-cell style="top: 285px; left: 748.23px; z-index: 90; width: 400px; height: 186.062px;" data-name="Battery" data-state="{&quot;energy&quot;:0,&quot;capacity&quot;:360}" data-snippet="// Enter simulation code here" data-state-style="margin-top: 5px; margin-bottom: 5px; height: 55px;"></lively-simulation-cell><lively-simulation-cell style="top: 479.234px; left: 551px; z-index: 86; width: 468.441px; height: 286.414px;" data-name="Thermal Power Station" data-state="{&quot;heat&quot;:0,&quot;factor&quot;:10,&quot;maxHeat&quot;:7.5}" data-snippet="const shouldApplyMax = () => {
  const { factor, heat, maxHeat } = $;
  const { gas } = fuel;
  const { capacity, energy } = heatStorage;
  const full = maxHeat * factor;
  const LOWER_ENERGY_THRESHOLD_PERCENTAGE = 0.9;
  return _.every([
    heat < full,
    gas > maxHeat,
    energy < LOWER_ENERGY_THRESHOLD_PERCENTAGE * capacity
  ]);
};

if (shouldApplyMax()) {
  const { maxHeat } = $;
  const gasConsumption = maxHeat;
  fuel['gas'] -= gasConsumption;
  $['heat'] += maxHeat;
}

const { factor, heat } = $;
const delta = heat / factor * 1.0;
const HEAT_THRESHOLD = 2;
if (heat > HEAT_THRESHOLD) {
  $['heat'] -= delta;
  if (heatStorage['energy'] < heatStorage['capacity'])
    heatStorage['energy'] += 0.5 * delta;
  if (battery['energy'] < battery['capacity'])
    battery['energy'] += 0.4 * delta;
}" data-state-style="margin-top: 5px; margin-bottom: 5px; height: 281px;"></lively-simulation-cell><lively-simulation-cell style="left: 33.2344px; top: 790px; z-index: 53; width: 469.219px; height: 312.453px; position: absolute;" data-name="Heat Consumer" data-state="{&quot;consumed&quot;:0,&quot;demand&quot;:3,&quot;extra&quot;:0}" data-snippet="const { demand } = $;
const { energy } = heatStorage;
if (energy > demand) {
    heatStorage['energy'] -= demand;
    $['consumed'] += demand;
    // TODO consume Extra
} else {
    $['extra'] += demand;
    throw Error('Room too cold!');
}" data-state-style="margin-top: 5px; margin-bottom: 5px; height: 87px;"></lively-simulation-cell><lively-simulation-cell style="left: 551.738px; top: 771px; z-index: 94; width: 469.781px; height: 337.594px; position: absolute;" data-name="Electric Consumer" data-state="{&quot;consumed&quot;:0,&quot;demand&quot;:1.5,&quot;extra&quot;:0}" data-snippet="$['demand'] += (Math.random() - 0.5) * 0.01;
const { demand } = $;
const { energy } = battery;
if (energy > demand) {
    battery['energy'] -= demand;
    $['consumed'] += demand;
} else {
    $['extra'] += demand;
    throw Error('Energy Too Low!')
}
" data-state-style="margin-top: 5px; margin-bottom: 5px; height: 87px;"></lively-simulation-cell><lively-simulation-cell style="top: 37px; left: 33.7539px; z-index: 98; width: 884.969px; height: 241.965px;" data-name="Reset" data-state="{}" data-snippet="fuel['gas'] = 5 * 2 * 3600 // two hours gas
heatStorage['energy'] = 0
battery['energy'] = 0 
electricConsumer['consumed'] = 0
electricConsumer['demand'] = 1.5
electricConsumer['extra'] = 0
heatConsumer['consumed'] = 0
heatConsumer['demand'] = 3
heatConsumer['extra'] = 0
thermalPowerStation['heat'] = 0
heatingSystem['heat'] = 0
battery['capacity'] = 0.1 * 3600 // 1h 2kw
heatStorage['capacity'] = 0.1 * 3600 // 1h 3kw" data-state-style="margin-top: 5px; margin-bottom: 5px; height: 7px;" data-should-skip="true"></lively-simulation-cell><lively-simulation-cell style="top: 1151.75px; left: 41px; z-index: 97; position: absolute; width: 981.51px; height: 268.352px;" data-name="Logging" data-state="{}" data-snippet="log({
  gas: fuel.gas,
  heat: heatStorage.energy,
  battery: battery.energy,
  consumedPower: electricConsumer.consumed,
  consumedHeat: heatConsumer.consumed,
  twp: thermalPowerStation.heat,
  hs: heatingSystem.heat
});" data-state-style="" data-show-log="true"></lively-simulation-cell></lively-simulation>-->