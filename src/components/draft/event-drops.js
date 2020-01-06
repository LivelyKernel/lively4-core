"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';

import eventDrops from 'https://unpkg.com/event-drops';
import d3 from 'src/external/d3.v5.js';
import repositoriesData from 'src/components/draft/event-drops-data.js'


import {AExprRegistry} from 'src/client/reactive/active-expression/active-expression.js'

export default class EventDrops extends Morph {
  async initialize() {
    this.windowTitle = "EventDrops";
    
    
    this.chart = eventDrops({
      d3,
      zoom: {
          onZoomEnd: () => this.updateCommitsInformation(this.chart),
      },
      drop: {
          date: event => event.timestamp,
          color: event => event.value == 13 ? "red" : "green", //'#'+('00000'+(Math.random()*(1<<24)|0).toString(16)).slice(-6),
          onMouseOver: event => {
            // this.tooltip
            //     //.transition()
            //     //.duration(200)
            //     .style('opacity', 1)
            //     .style('pointer-events', 'auto');
            lively.showEvent(d3.event);
            
            // this.tooltip
            //     .html(
            //         <div class="commit">
            //           <img class="avatar" src="https://www.tierchenwelt.de/images/stories/fotos/saeugetiere/beuteltiere/quokka/quokka_happy_l.jpg" alt="${commit.author.name}" title="${commit.author.name}" />
            //           <div class="content">
            //               <h3 class="message">{event.message}</h3>
            //               <p>
            //                   <a href="https://www.github.com/${commit.author.name}" class="author">{event.author/*.name*/}</a>
            //                   on <span class="date">{this.humanizeDate(new Date(event.date))}</span> -
            //                   <a class="sha" href="${commit.sha}">{event/*.sha.substr(0, 10)*/}</a>
            //               </p>
            //           </div>
            //         </div>)
                // .style('left', `${d3.event.clientX - 30}px`)
                // .style('top', `${d3.event.clientY + 20}px`)
            //debugger;
            lively.setGlobalPosition(this.tooltip, lively.pt(d3.event.clientX, d3.event.clientY));
        },
        onMouseOut: () => {
            // this.tooltip
            //     //.transition()
            //     //.duration(500)
            //     //.style('opacity', 0)
            //     .style('pointer-events', 'none');
        }
      },
    });

    //let repositoriesData = require('event-drops-data.json');
    
    repositoriesData = repositoriesData.map(repository => ({name: repository.name, data: repository.commits}));
    
    this.numberCommitsContainer = this.get('#numberCommits');
    this.zoomStart = this.get('#zoomStart');
    this.zoomEnd = this.get('#zoomEnd');
    this.tooltip = undefined;
    document.body.querySelectorAll('.tooltip-d3').forEach(each => each.remove());
    if(!this.tooltip){
      this.tooltip = <div class='tooltip-d3' style='background-color=blue; width=100px; height=100px; position=absolute;'></div>
      document.body.appendChild(this.tooltip);
    }
      
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

    this.update();
   
  }
  
  update() {
    this.setAexprs(AExprRegistry.allAsArray());
    //setTimeout(() => {this.update()}, 1000);
  }
  
  setAexprs(aexprs) {
    let deIndex = string => string.substring(0, string.lastIndexOf("#"));
    let groups = aexprs.groupBy(each => {
      lively.notify(each.meta().get('id')+" "+deIndex(each.meta().get('id')));
      return deIndex(each.meta().get('id')
     )});
    groups = Object.keys(groups).map(each => ({name : each, data: groups[each].flatMap(ae => ae.meta().get('events'))}));
    this.setData(groups);
  }
  
  setData(data) {
    d3
      .select(this.get('#eventdrops-demo'))
      .data([data])
      .call(this.chart);
  }
  
  
  updateCommitsInformation(chart) {
    const filteredData = chart
        .filteredData()
        .reduce((total, repo) => total.concat(repo.data), []);

    this.numberCommitsContainer.textContent = filteredData.length;
    this.zoomStart.textContent = this.humanizeDate(chart.scale().domain()[0]);
    this.zoomEnd.textContent = this.humanizeDate(chart.scale().domain()[1]);
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
        ${date.getHours()}:${date.getMinutes()}
    `;
  }
  
}