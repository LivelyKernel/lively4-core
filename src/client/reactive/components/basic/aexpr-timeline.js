"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';

import eventDrops from 'src/external/event-drops.js';
import d3 from 'src/external/d3.v5.js';

import {AExprRegistry} from 'src/client/reactive/active-expression/active-expression.js'

export default class EventDrops extends Morph {
  async initialize() {
    this.windowTitle = "Active Expression Event Timeline";
    this.config = {
      d3,
      bound : {format: () => undefined},
      range : {start: new Date(performance.timeOrigin), end: new Date()},
      line : {
        color: (_, index) => d3.schemeCategory10[index%10]
      },
      zoom: {
          onZoom: () => {
            this.zoomedTo = this.chart.scale().domain();
            this.updateMetaInformation();
          },
      },
      restrictPan : true,
      drop: {
          date: event => event.timestamp,
          color: event => {
            switch(event.type) {
              case 'created': return 'green';
              case 'disposed': return 'red';
              case 'changed value': return 'blue';
              case 'dependencies changed': return 'purple';
              default : return 'black';
            }
          },
          onClick : data => {
            lively.notify(JSON.stringify(data));
            lively.openInspector(data);
          },
          onMouseOver: event => {
            this.tooltip
                .transition()
                .duration(200)
                .style('opacity', 1)
                .style('pointer-events', 'auto');
            this.tooltip.html('');
            this.tooltip.append(() =>
                    <div class="event">
                      <div class="content">
                        <h3 style="font-size: 1em">{event.type}</h3>
                        <span style="font-size: 1em">{(event.value || "").toString()}</span>
                        <p style="font-size: 1em">at {this.humanizeDate(event.timestamp)}</p>
                      </div>
                    </div>);
            lively.setGlobalPosition(this.tooltip.node(), lively.pt(d3.event.clientX +3, d3.event.clientY+3));
        },
        onMouseOut: () => {
            this.tooltip
                .transition()
                .duration(500)
                .style('opacity', 0)
                .style('pointer-events', 'none');
        }
      },
    };
    this.chart = eventDrops(this.config);
    
    this.numberEventsContainer = this.get('#numberEvents');
    this.zoomStart = this.get('#zoomStart');
    this.zoomEnd = this.get('#zoomEnd');
    document.body.querySelectorAll('#event-drops-tooltip').forEach(each => each.remove());
    this.d3 = d3;
    this.update();
   
  }
  
  get tooltip() {
    let existing = document.body.querySelectorAll('#event-drops-tooltip')[0];
    
    return existing ? d3.select(existing) : d3
      .select('body')
      .append('div')
      .attr('id', 'event-drops-tooltip')
      .classed('tooltip', true)
      .style('opacity', 0)
      .style('width', '200px')
      .style('box-sizing', 'border-box')
      .style('border', '10px solid transparent')
      .style('background-color', '#EEEEEE')
      .style('z-index', 500)
      .style('pointer-events', 'auto');
  }
  

  getDataFromSource() {
    let dataFromSource = this.dataFromSource || (() => AExprRegistry.allAsArray());
    if(_.isFunction(dataFromSource))return dataFromSource();
    else return dataFromSource;
  }

  getGroupingFunction() {
    let deIndex = string => string.substring(0, string.lastIndexOf("#"));
    return this.groupingFunction || (each => deIndex(each.meta().get('id')))
  }
  
  update() {
    if(this.detached)return;
    this.setAexprs(this.getDataFromSource());
    setTimeout(() => {this.update()}, 1000);
  }
  
  setAexprs(aexprs) {
    let scrollBefore = this.get('#diagram').scrollTop;
    if(aexprs.length == 0)return;
    let groups = aexprs.groupBy(this.getGroupingFunction());
    groups = Object.keys(groups).map(each => ({name : each, data: groups[each].flatMap(ae => ae.meta().get('events'))}));
    this.setData(groups);
    let newDomain = this.zoomedTo;
    if(!newDomain) {
      let allEvents = groups.flatMap(each => each.data);
      let min = _.minBy(allEvents, each => each.timestamp).timestamp;
      let max = _.maxBy(allEvents, each => each.timestamp).timestamp;
      let difference = max.getTime() - min.getTime();
      if(difference == 0)difference = 100;
      min = new Date(min.getTime() - difference*0.1);
      max = new Date(max.getTime() + difference*0.1);
      newDomain = [min, max];
    }
    this.chart.scale().domain(newDomain);
    this.chart.zoomToDomain(newDomain); 
    this.get('#diagram').scrollTop = scrollBefore;
  }
  
  setData(data) {
    d3
      .select(this.get('#diagram'))
      .data([data])
      .call(this.chart);
  }
  
  updateMetaInformation() {
    const numEvents = _.sumBy(this.chart.filteredData(), each => each.data.length);
    this.numberEventsContainer.textContent = numEvents;
    this.zoomStart.textContent = this.humanizeDate(this.zoomedTo[0]);
    this.zoomEnd.textContent = this.humanizeDate(this.zoomedTo[1]);
  }
  
  humanizeDate(date) {
    return `        ${date.getHours()}:${('0'+date.getMinutes()).slice(-2)}:${('0'+date.getSeconds()).slice(-2)}.${('000'+date.getMilliseconds()).slice(-4)}
    `;
  }

  livelyMigrate(other) {
    this.zoomedTo = other.zoomedTo;
    this.groupingFunction = other.groupingFunction;
    this.dataFromSource = other.dataFromSource;
  }

  detachedCallback() {
    this.detached = true;
  }
  
}