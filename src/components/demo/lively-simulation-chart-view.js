"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import _ from 'src/external/lodash/lodash.js';
import Chart from 'src/external/chart.js';
import 'src/external/chartjs-plugin-colorschemes.js';

export default class LivelySimulationChartView extends Morph {
  
  // life cycle
  initialize() {
    const ctx = this.get('#chart').getContext('2d');
    this.chart = new Chart(ctx, {
      type: 'scatter',
      options: {
        animation: {
            duration: 0 // general animation time
        },
        elements: {
            line: {
                tension: 0 // disables bezier curves
            }
        },
        hover: {
            animationDuration: 0 // duration of animations when hovering an item
        },
        maintainAspectRatio: false,
        plugins: {
          colorschemes: {
            scheme: 'office.Office6'
          }
        },
        responsive: true,
        responsiveAnimationDuration: 0, // animation duration after a resize
        scales: {
          xAxes: [{
            scaleLabel: {
              display: true,
              labelString: 'Time in ms'
            },
            type: 'linear',
          }],
          yAxes: [{
            scaleLabel: {
              display: true,
              labelString: 'Value'
            }
          }]
        },
        showLines: false
      }
    });
  }
  
  attachedCallback() {
    this.registerVisibilityUpdater();
  }
  
  detachedCallback() {
    this.visibilityUpdater.dispose();
  }
  
  registerVisibilityUpdater() {
    this.visibilityUpdater = aexpr(() => this.classList.contains('active')).onChange((isActive) => isActive && this.chart.update());
  }
  
  // other
  append(timestamp, entry) {
    const { chart } = this;
    const keyedDatasets = _.keyBy(chart.data.datasets, 'label');
    const newDatasets = _.difference(_.keys(entry), _.keys(keyedDatasets));
    _.forEach(_.toPairs(keyedDatasets), ([label, dataset]) => dataset.data.push({
      x: timestamp,
      y: entry[label]
    }));
    _.forEach(newDatasets, label => 
      chart.data.datasets.push({
        label,
        data: [{ x: timestamp, y: entry[label] }]
      }));
    if (this.classList.contains('active')) chart.update(0);
  }
  
  reset() {
    const { chart } = this;
    chart.data.datasets = [];
    chart.data.labels = [];
    chart.update();
  }
  
  get(selector) {
    const { shadowRoot } = this;
    return shadowRoot.querySelector(selector);
  }
}