"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';

import eventDrops from 'src/external/event-drops.js';
//import eventDrops from 'https://unpkg.com/event-drops@1.3.0/dist/index.js';
import d3 from 'src/external/d3.v5.js';
import repositoriesData from 'src/components/draft/event-drops-data.js'

import {AExprRegistry} from 'src/client/reactive/active-expression/active-expression.js'

export default class EventDrops extends Morph {
  async initialize() {
    this.windowTitle = "Active Expression Event Timeline";
    this.config = {
      d3,
      range : this.chart ? this.chart.range : void 0,
      zoom: {
          onZoom: () => {this.zoomedTo = this.chart.scale().domain()},
          onZoomEnd: () => this.updateMetaInformation(),
      },
      drop: {
          date: event => event.timestamp,
          color: event => {
            switch(event.message) {
              case 'created': return 'green';
              case 'disposed': return 'red';
              case 'changed value': return 'blue';
              default : return 'black';
            }
          }, //'#'+('00000'+(Math.random()*(1<<24)|0).toString(16)).slice(-6),
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
            //lively.showEvent(d3.event);
            //lively.openInspector(d3.event)
            this.tooltip.html('')// = '';
            this.tooltip.append(() =>
                    <div class="event">
                      <div class="content">
                        <h3 style="font-size: 1em">{event.message}</h3>
                        <span style="font-size: 1em">{(event.value || "").toString()}</span>
                        <p style="font-size: 1em">at {this.humanizeDate(event.timestamp)}</p>
                      </div>
                    </div>);
                // .style('left', `${d3.event.clientX - 30}px`)
                // .style('top', `${d3.event.clientY + 20}px`)
            //debugger;
            lively.setGlobalPosition(this.tooltip.node(), lively.pt(d3.event.clientX +3, d3.event.clientY+3));
            //this.tooltip.style.display = 'inline';
            //this.hideTooltip.cancel();
        },
        onMouseOut: () => {
          //lively.notify('out')
            //this.hideTooltip();
            //this.tooltip.style.display = 'none';
            //this.hideTooltip();
            this.tooltip
                .transition()
                .duration(500)
                .style('opacity', 0)
                .style('pointer-events', 'none');
        }
      },
    };
    this.chart = eventDrops(this.config);


    //let repositoriesData = require('event-drops-data.json');
    
    repositoriesData = repositoriesData.map(repository => ({name: repository.name, data: repository.commits}));
    
    this.numberEventsContainer = this.get('#numberEvents');
    this.zoomStart = this.get('#zoomStart');
    this.zoomEnd = this.get('#zoomEnd');
    document.body.querySelectorAll('#event-drops-tooltip').forEach(each => each.remove());
      
      // d3
      // .select(this)
      // .append('div')
      // .classed('tooltip', true)
      // .style('opacity', 0)
      // .style('border', 'red 3px solid')
      // .style('width', '100px')
      // .style('height', '100px')
      // .style('background-color', 'blue')
      // .style('pointer-events', 'auto');

    this.d3 = d3;

    // this.chart.setDomain = (domain) => {
    //   this.chart.scale().domain(domain);
    //   let svg = d3.select(this.get('.event-drop-chart'));
    //   svg.call(this.chart.draw(_.merge(defaultConfig, this.config), this.chart.scale()));
    // }
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
     // || document.body.appendChild(<div id='event-drops-tooltip' class='tooltip' style='background-color:gray; display:none; width:200px; z-index: 500; position:relative'></div>);
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
    this.setAexprs(this.getDataFromSource());
    if(this.isStillInWorld())setTimeout(() => {this.update()}, 1000);
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
    this.updateMetaInformation();
    this.get('#diagram').scrollTop = scrollBefore;
  }
  
  setData(data) {
    d3
      .select(this.get('#diagram'))
      .data([data])
      .call(this.chart);;
  }
  
  updateMetaInformation() {
    const numEvents = _.sumBy(this.chart.filteredData(), each => each.data.length);
    this.numberEventsContainer.textContent = numEvents;
    this.zoomStart.textContent = this.humanizeDate(this.chart.scale().domain()[0]);
    this.zoomEnd.textContent = this.humanizeDate(this.chart.scale().domain()[1]);
  }
  
  humanizeDate(date) {
    const monthNames = [
        'Jan.',
        'Feb.',
        'March',
        'Apr.',
        'May',
        'June',
        'Jul.',
        'Aug.',
        'Sept.',
        'Oct.',
        'Nov.',
        'Dec.',
    ];

    return `
        ${monthNames[date.getMonth()]} ${date.getDate()} ${date.getFullYear()}
        ${date.getHours()}:${('0'+date.getMinutes()).slice(-2)}
    `;
  }

  isStillInWorld() {
    return this.parentElement && this.parentElement.parentElement != undefined;
  }

  livelyMigrate(other) {
    this.zoomedTo = other.zoomedTo;
    this.groupingFunction = other.groupingFunction;
    this.dataFromSource = other.dataFromSource;
  }
  
}