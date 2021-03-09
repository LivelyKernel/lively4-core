"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';

import eventDrops from 'src/external/event-drops.js';
import jQuery from 'src/external/jquery.js';
import jstree from 'src/external/jstree/jstree.js';
import d3 from 'src/external/d3.v5.js';
import { debounce } from "utils";

import { AExprRegistry } from 'src/client/reactive/active-expression/active-expression.js';

export default class EventDrops extends Morph {
  async initialize() {
    this.windowTitle = "Active Expression Event Timeline";
    this.setWindowSize(1200, 800);
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
        width: 300,
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
                this.openLocationInBrowser(location);
                
                break;
              }
            case 'created':
            case 'disposed':
              {
                const ae = data.value;
                const location = ae.meta().get("location");
                this.openLocationInBrowser(location);
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

    this.numberEventsContainer = this.numberEvents;
    document.body.querySelectorAll('#event-drops-tooltip').forEach(each => each.remove());
    this.d3 = d3;
    jQuery(this.aeOverview).jstree({
      "plugins": ["wholerow", "checkbox"],
      "checkbox": {
        "keep_selected_style": false
      },
      'core': {
        "themes": { "icons": false }
      }
    });

    this.aeChangedDebounced = (() => this.setAexprs(this.getDataFromSource())).debounce(10, 300);
    this.eventsChangedDebounced = (() => this.updateTimeline(this.getDataFromSource())).debounce(100, 1000);
    this.activeExpressionsChanged();
    //Register to AE changes
    AExprRegistry.addEventListener(this, (ae, event) => {
      if (event.type === "created" || event.type === "disposed") {
        this.activeExpressionsChanged();
      } else {
        this.eventsChanged();
      }
    });
    //Register to overview selection changes
    jQuery(this.aeOverview).on("changed.jstree", (e, data) => {
      this.eventsChanged();
    });
    this.ready = false;
    jQuery(this.aeOverview).one("ready.jstree", (e, data) => {
      this.ready = true;
    });
    //Register to grouping change
    this.groupByLine.addEventListener('change', () => {
      if (this.groupByLine.checked) {
        this.groupingFunction = this.locationGrouping();
      } else {
        this.groupingFunction = this.instanceGrouping();
      }
      this.eventsChanged();
    });
    //Register to filter changes
    this.filterFunction = () => true;
    this.filterButton.addEventListener('click', () => {
      const inputValue = this.filterInput.value;
      if (!inputValue) {
        this.filterFunction = () => true;
      } else {
        this.filterFunction = event => {
          return eval(inputValue);
        };
      }
      this.eventsChanged();
    });
  }

  openLocationInBrowser(location) {
    const start = { line: location.start.line - 1, ch: location.start.column };
    const end = { line: location.end.line - 1, ch: location.end.column };
    lively.files.exists(location.file).then(exists => {
      if(exists) {
        lively.openBrowser(location.file, true, { start, end }, false, undefined, true);
      } else {
        lively.notify("Unable to find file:" + location.file);
      }
    });
  }

  humanizeEventData(event) {
    switch (event.type) {
      case 'changed value':
        return <div>{this.humanizePosition(event.value.trigger.file, event.value.trigger.start.line)} <br /> <span style="color:#00AAAA">{event.value.lastValue}</span> → <span style="color:#00AAAA">{event.value.value}</span></div>;
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

  fileGrouping() {
    let fileName = string => string.substring(0, string.lastIndexOf("@"));
    return each => fileName(each.meta().get('id'));
  }

  locationGrouping() {
    let locationID = string => string.substring(0, string.lastIndexOf("#"));
    return each => locationID(each.meta().get('id'));
  }

  instanceGrouping() {
    return each => each.meta().get('id');
  }

  getGroupingFunction() {
    return this.groupingFunction || this.locationGrouping();
  }

  activeExpressionsChanged() {
    this.aeChangedDebounced();
  }

  eventsChanged() {
    this.eventsChangedDebounced();
  }

  update() {
    if (this.detached) return;
    this.setAexprs(this.getDataFromSource());
    setTimeout(() => {
      this.update();
    }, 3000);
  }

  setAexprs(aexprs) {
    for (let i = 0; i < aexprs.length; i++) {
      aexprs[i].timelineID = i;
    }
    this.updateOverview(aexprs);
    this.updateTimeline(aexprs);
  }

  updateTimeline(aexprs) {
    const checkedIndices = jQuery(this.aeOverview).jstree(true).get_bottom_selected();
    const selectedAEs = checkedIndices.map(i => aexprs[i - 1]).filter(ae => ae);
    this.updateValuesOverTime(selectedAEs);
    let scrollBefore = this.diagram.scrollTop;
    let groups = selectedAEs.groupBy(this.getGroupingFunction());
    groups = Object.keys(groups).map(each => ({
      name: each,
      data: groups[each].flatMap(ae => ae.meta().get('events')).filter(this.filterFunction)
    }));
    this.setData(groups);
    if (selectedAEs.length == 0) return;

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

  updateValuesOverTime(aexprs) {
    const aeWithRelevantEvents = aexprs.map(ae => {
      return { ae, events: ae.meta().get('events').filter(event => event.type === "changed value").filter(this.filterFunction) };
    });
    this.valuesOverTime.innerHTML = "";

    for (const { ae, events } of aeWithRelevantEvents) {
      if (events.length === 0) continue;
      let row = <tr><th>{ae.meta().get('id')}</th></tr>;
      row.append(<td>{events[0].value.lastValue}</td>);
      for (const event of events) {
        row.append(<td>{event.value.value}</td>);
      }
      this.valuesOverTime.append(row);
    }
  }

  updateOverview(aexprs) {
    jQuery(this.aeOverview).jstree(true).settings.core.data = this.generateOverviewJSON(aexprs);
    jQuery(this.aeOverview).jstree(true).refresh(true);
  }

  generateOverviewJSON(aexprs) {
    let json = [];
    let files = aexprs.groupBy(this.fileGrouping());
    for (const file of Object.keys(files)) {
      let locations = files[file].groupBy(this.locationGrouping());
      const children = Object.keys(locations).map(location => {
        return {
          "text": "line " + location.substring(location.lastIndexOf("@") + 1),
          "children": locations[location].map(ae => {
            const id = ae.meta().get('id');
            return {
              "id": ae.timelineID + 1,
              "text": id.substring(id.lastIndexOf("#") + 1)
            };
          })
        };
      });
      json.push({
        "text": file,
        "children": children
      });
    }
    return json;
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
    return <div>in <span style="color:#0000FF">{file.substring(file.lastIndexOf('/') + 1)}</span> line <span style="color:#0000FF">{line}</span></div>;
  }

  livelyMigrate(other) {
    this.zoomedTo = other.zoomedTo;
    this.groupingFunction = other.groupingFunction;
    this.dataFromSource = other.dataFromSource;
  }

  detachedCallback() {
    this.detached = true;
  }

  filterToAEs(aes) {
    const tree = jQuery(this.aeOverview).jstree(true);
    tree.deselect_all();
    if (this.ready) {
      for (const ae of aes) {
        tree.select_node(ae.timelineID + 1);
      }
    } else {
      //This is not the best workaround, but the event callbacks do not work reliably
      setTimeout(() => {
        for (const ae of aes) {
          tree.select_node(ae.timelineID + 1);
        }
      }, 100);
    }
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

  get filterInput() {
    return this.get("#filterInput");
  }

  get filterButton() {
    return this.get("#filterButton");
  }

  get valuesOverTime() {
    return this.get("#valuesOverTime");
  }

}