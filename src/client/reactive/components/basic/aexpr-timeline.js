"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';

import eventDrops from 'src/external/event-drops.js';
import jQuery from 'src/external/jquery.js';
import jstree from 'src/external/jstree/jstree.js';
import d3 from 'src/external/d3.v5.js';

import { AExprRegistry } from 'src/client/reactive/active-expression/active-expression.js';

export default class EventDrops extends Morph {
  async initialize() {
    this.windowTitle = "Active Expression Event Timeline";
    this.config = {
      d3,
      bound: { format: () => undefined },
      range: { start: new Date(performance.timeOrigin), end: new Date() },
      line: {
        color: (_, index) => d3.schemeCategory10[index % 10]
      },
      zoom: {
        onZoom: () => {
          this.zoomedTo = this.chart.scale().domain();
          this.updateMetaInformation();
        }
      },
      label: {
        width: 250,
        text: d => `${d.name.substring(d.name.lastIndexOf("/") + 1)} (${d.data.length})`
      },
      restrictPan: true,
      drop: {
        date: event => event.timestamp,
        color: event => {
          switch (event.type) {
            case 'created':
              return 'green';
            case 'disposed':
              return 'red';
            case 'changed value':
              return 'blue';
            case 'dependencies changed':
              return 'purple';
            default:
              return 'black';
          }
        },
        onClick: data => {
          switch (data.type) {
            case 'changed value':
              {
                const location = data.value.trigger;
                const start = { line: location.line - 1, ch: location.column };
                lively.openBrowser(location.source, true, start, false, undefined, true);
                break;
              }
            case 'created':
            case 'disposed':
              {
                const ae = data.value;
                const location = ae.meta().get("location");
                const start = { line: location.start.line - 1, ch: location.start.column };
                const end = { line: location.end.line - 1, ch: location.end.column };
                lively.openBrowser(location.file, true, { start, end }, false, undefined, true);
                break;
              }
            case 'dependencies changed':
            default:
              {
                lively.openInspector(data);
                break;
              }
          }
        },
        onMouseOver: event => {
          this.tooltip.transition().duration(200).style('opacity', 1).style('pointer-events', 'auto');
          this.tooltip.html('');
          this.tooltip.append(() => <div class="event">
                      <div class="content">
                        <h3 style="font-size: 1em">{event.type}</h3>
                        <span style="font-size: 1em">{this.humanizeEventData(event)}</span>
                        <p style="font-size: 1em">at {this.humanizeDate(event.timestamp)}</p>
                      </div>
                    </div>);
          lively.setGlobalPosition(this.tooltip.node(), lively.pt(d3.event.clientX + 3, d3.event.clientY + 3));
        },
        onMouseOut: () => {
          this.tooltip.transition().duration(500).style('opacity', 0).style('pointer-events', 'none');
        }
      }
    };
    this.chart = eventDrops(this.config);

    this.groupByLine.addEventListener('change', () => {
      if (this.groupByLine.checked) {
        this.groupingFunction = undefined;
      } else {
        this.groupingFunction = each => each.meta().get('id');
      }
    });

    this.numberEventsContainer = this.numberEvents;
    document.body.querySelectorAll('#event-drops-tooltip').forEach(each => each.remove());
    this.d3 = d3;
    debugger;
    const tree = jQuery.jstree.create(this.aeOverview, {
      "plugins" : [ "wholerow", "checkbox" ],
      'core': {
        "themes" : { "stripes" : true },
        'data': [
          {
            'text': 'root',
            "icon" : "/static/3.3.11/assets/images/tree_icon.png",
            'children': [
              'child1',
              'child2'
            ]
          }
        ]
      }
    });
    this.update();
  }

  humanizeEventData(event) {
    switch (event.type) {
      case 'changed value':
        return this.humanizePosition(event.value.trigger.source, event.value.trigger.line);
      case 'created':
      case 'disposed':
        {
          const ae = event.value;
          const location = ae.meta().get("location");
          return this.humanizePosition(location.file, location.start.line);
        }
      case 'dependencies changed':
      default:
        return (event.value || "").toString();
    }
  }

  get tooltip() {
    let existing = document.body.querySelectorAll('#event-drops-tooltip')[0];

    return existing ? d3.select(existing) : d3.select('body').append('div').attr('id', 'event-drops-tooltip').classed('tooltip', true).style('opacity', 0).style('width', '200px').style('box-sizing', 'border-box').style('border', '10px solid transparent').style('background-color', '#EEEEEE').style('z-index', 500).style('pointer-events', 'auto');
  }

  getDataFromSource() {
    let dataFromSource = this.dataFromSource || (() => AExprRegistry.allAsArray());
    if (_.isFunction(dataFromSource)) return dataFromSource();else return dataFromSource;
  }

  getGroupingFunction() {
    let deIndex = string => string.substring(0, string.lastIndexOf("#"));
    return this.groupingFunction || (each => deIndex(each.meta().get('id')));
  }

  update() {
    if (this.detached) return;
    this.setAexprs(this.getDataFromSource());
    setTimeout(() => {
      this.update();
    }, 1000);
  }

  setAexprs(aexprs) {
    let scrollBefore = this.diagram.scrollTop;
    if (aexprs.length == 0) return;
    let groups = aexprs.groupBy(this.getGroupingFunction());
    groups = Object.keys(groups).map(each => ({ name: each, data: groups[each].flatMap(ae => ae.meta().get('events')) }));
    this.setData(groups);
    let newDomain = this.zoomedTo;
    if (!newDomain) {
      let difference = 0;
      let allEvents = groups.flatMap(each => each.data);
      if (allEvents.length > 0) {
        let min = _.minBy(allEvents, each => each.timestamp).timestamp;
        let max = _.maxBy(allEvents, each => each.timestamp).timestamp;
        difference = max.getTime() - min.getTime();
        if (difference == 0) difference = 100;
        min = new Date(min.getTime() - difference * 0.1);
        max = new Date(max.getTime() + difference * 0.1);
        newDomain = [min, max];
      } else {
        let now = new Date();
        let min = new Date(now.getTime() - 10);
        let max = new Date(now.getTime() + 10);
        newDomain = [min, max];
      }
    }
    this.chart.scale().domain(newDomain);
    this.chart.zoomToDomain(newDomain);
    this.diagram.scrollTop = scrollBefore;
  }

  setData(data) {
    d3.select(this.diagram).data([data]).call(this.chart);
  }

  updateMetaInformation() {
    const numEvents = _.sumBy(this.chart.filteredData(), each => each.data.length);
    this.numberEventsContainer.textContent = numEvents;
    this.zoomStart.textContent = this.humanizeDate(this.zoomedTo[0]);
    this.zoomEnd.textContent = this.humanizeDate(this.zoomedTo[1]);
  }

  humanizeDate(date) {
    return `        ${date.getHours()}:${('0' + date.getMinutes()).slice(-2)}:${('0' + date.getSeconds()).slice(-2)}.${('000' + date.getMilliseconds()).slice(-4)}
    `;
  }
  humanizePosition(file, line) {
    return "in " + file.substring(file.lastIndexOf('/') + 1) + " line " + line;
  }

  livelyMigrate(other) {
    this.zoomedTo = other.zoomedTo;
    this.groupingFunction = other.groupingFunction;
    this.dataFromSource = other.dataFromSource;
  }

  detachedCallback() {
    this.detached = true;
  }

  get diagram() {
    return this.get("#diagram");
  }

  get numberEvents() {
    return this.get("#numberEvents");
  }

  get zoomStart() {
    return this.get("#zoomStart");
  }

  get zoomEnd() {
    return this.get("#zoomEnd");
  }

  get groupByLine() {
    return this.get("#groupByLine");
  }

  get aeOverview() {
    return this.get("#aeOverview");
  }
}