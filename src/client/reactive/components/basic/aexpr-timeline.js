"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';

// import eventDrops from 'src/external/event-drops.js'
import eventDrops from 'src/external/event-drops/index.js';
import d3 from 'src/external/d3.v5.js';
import { debounce } from "utils";
import ContextMenu from 'src/client/contextmenu.js';
import { openLocationInBrowser, navigateToGraph } from './aexpr-debugging-utils.js';
import AExprOverview from './aexpr-overview.js';

import { AExprRegistry } from 'src/client/reactive/active-expression/ae-registry.js';

import "src/external/jquery.js"
import "src/external/jstree/jstree.js"


export default class EventDrops extends Morph {
  async initialize() {
    this.windowTitle = "Active Expression Event Timeline";
    this.setWindowSize(1200, 800);
    this.config = {
      d3,
      bound: { format: () => undefined },
      drops: (row) => row.drops,
      intervals: (row) => row.intervals,
      range: { start: new Date(performance.timeOrigin), end: new Date() },
      line: {
        height: 25,
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
      interval: {
        id: interval => interval.id,
        startDate: interval => interval.start,
        endDate: interval => interval.end,
        color: "blue",
        width: 5,
        onClick: (data, index, group) => {
          this.eventClicked(data.startEvent, group[index]);
        },
        onMouseOver: (interval, index, group) => {
          group[index].setAttribute("stroke-width", 10);
          this.eventHover(interval.startEvent, group[index]);
        },
        onMouseOut: (data, index, group) => {
          group[index].setAttribute("stroke-width", 5);
          this.tooltip.transition().duration(500).style('opacity', 0).style('pointer-events', 'none');
        }
      },
      drop: {
        id: event => event.id,
        date: event => event.timestamp,
        color: event => event.getColor(),
        onClick: (data, index, group) => {
          this.eventClicked(data, group[index]);
        },
        onMouseOver: (event, index, group) => {
          this.eventHover(event, group[index]);
        },
        onMouseOut: (data, index, group) => {
          group[index].setAttribute("r", 5);
          this.tooltip.transition().duration(500).style('opacity', 0).style('pointer-events', 'none');
        }
      }
    };
    this.chart = eventDrops(this.config);

    this.numberEventsContainer = this.numberEvents;
    document.body.querySelectorAll('#event-drops-tooltip').forEach(each => each.remove());
    this.d3 = d3;

    this.aexprOverview = new AExprOverview(this.aeOverview);
    this.setAexprs(this.getDataFromSource());

    this.aeChangedDebounced = (() => this.setAexprs(this.getDataFromSource())).debounce(10, 300);
    this.eventsChangedDebounced = (() => this.updateTimeline()).debounce(100, 1000);

    //Register to AE changes
    AExprRegistry.addEventListener(this, (ae, event) => {
      if (event.type === "created" || event.type === "disposed") {
        this.activeExpressionsChanged();
      } else {
        this.eventsChanged();
      }
    });
    //Register to overview selection changes
    this.aexprOverview.onChange(() => {
      this.eventsChanged();
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
    this.filterFunction = e => e;
    this.filterButton.addEventListener('click', () => {
      const inputValue = this.filterInput.value;
      if (!inputValue) {
        this.filterFunction = e => e;
      } else {
        this.filterFunction = event => {
          return eval(inputValue);
        };
      }
      this.eventsChanged();
    });
  }

  livelyPreMigrate() {
    AExprRegistry.removeEventListener(this);
  }
  eventHover(event, circleObject) {
    circleObject.setAttribute("r", 10);
    this.tooltip.transition().duration(200).style('opacity', 1).style('pointer-events', 'auto');
    this.tooltip.html('');
    const eventDiv = <div class="event"></div>;
    const contentDiv = <div class="content">
                  <h3 style="font-size: 1em">{event.typeName()}</h3>
                </div>;

    const appendData = data => {
      //contentDiv.append(<div></div>);
      const lol = <span style="font-size: 1em">{data}</span>;
      contentDiv.append(lol);
    };

    event.humanizedData(event).then(eventData => {
      if (eventData.length) {
        for (const data of eventData) {
          appendData(data);
        }
      } else {
        appendData(eventData);
      }
      contentDiv.append(<p style="font-size: 1em">at {this.humanizeDate(event.timestamp)}</p>);
      eventDiv.append(contentDiv);
      this.tooltip.append(() => eventDiv);
    });
    lively.setGlobalPosition(this.tooltip.node(), lively.pt(d3.event.clientX + 3, d3.event.clientY + 3));
  }
  

  humanizeDate(date) {
    return `        ${date.getHours()}:${('0' + date.getMinutes()).slice(-2)}:${('0' + date.getSeconds()).slice(-2)}.${('000' + date.getMilliseconds()).slice(-4)}
    `;
  }

  async eventClicked(data, circleObject) {
    circleObject.setAttribute("r", 10);
    const menuItems = [];
    menuItems.push(["inspect", () => {
      lively.openInspector(data);
    }, "", "l"]);
    menuItems.push(["show ae in graph", () => {
      navigateToGraph([data.ae], data);
    }, "", "2"]);

    const event = d3.event;
    switch (data.type) {
      case 'evaluation failed':
        menuItems.push(["show error", () => lively.showErrorWindow(data.value.error), "", "-"]);
        if (!data.value.triggers) {
          break;
        }
      //Fall through!
      case 'changed value':
        {
          data.value.triggers.forEach(({ location }, index) => {
            menuItems.push(["open location" + (index > 0 ? index + 1 : ""), () => {
              openLocationInBrowser(location);
            }, "", "o"]);
          });
          break;
        }
      case 'created':
        {
          const ae = data.ae;
          const aeLocation = ae.meta().get("location");
          const stack = data.value.stack;
          const locations = await Promise.all(stack.frames.map(frame => frame.getSourceLocBabelStyle()));
          locations.forEach((location, index) => {
            if (!location) {
              menuItems.push(["anonymous", () => {}, "", index + 1]);
            } else {
              const isAELoaction = aeLocation.file === location.file && aeLocation.start.line === location.start.line;
              menuItems.push([this.fileNameString(location.file) + ":" + location.start.line, () => {
                openLocationInBrowser(isAELoaction ? aeLocation : location);
              }, isAELoaction ? "aexpr call" : "", index + 1]);
            }
          });
          break;
        }
      case 'disposed':
        {
          const ae = data.ae;
          const location = ae.meta().get("location");
          menuItems.push(["open location", () => {
            openLocationInBrowser(location);
          }, "", "o"]);
          break;
        }
      case 'callbacks changed':
      default:
        {
          break;
        }
    }
    const layeredFunctions = data.extractLayererdFunctions();
    if(layeredFunctions) {
      const subMenuItems = [];
      for(const [obj, functionMap] of layeredFunctions) {
        const subsubMenuItems = [];
        
        for(const [fnName, {fn, debugInfo}] of functionMap) {
          subsubMenuItems.push([fnName, () => openLocationInBrowser(debugInfo.location), "", "o"]);
        }
        subMenuItems.push([obj.toString(), subsubMenuItems, "", "o"]);
      }
      menuItems.push(["Layered Functions", subMenuItems, "", "o"]);
    }
    //group[index].getBoundingClientRect()
    const menu = await ContextMenu.openIn(document.body, event, undefined, document.body, menuItems);
    menu.addEventListener("DOMNodeRemoved", () => {
      this.focus();
    });
  }

  

  get tooltip() {
    let existing = document.body.querySelectorAll('#event-drops-tooltip')[0];

    return existing ? d3.select(existing) : d3.select('body').append('div').attr('id', 'event-drops-tooltip').classed('tooltip', true).style('opacity', 0).style('width', '350px').style('box-sizing', 'border-box').style('border', '10px solid transparent').style('background-color', '#EEEEEE').style('z-index', 500).style('pointer-events', 'auto');
  }

  getDataFromSource() {
    let dataFromSource = this.dataFromSource || (() => AExprRegistry.allAsArray());
    if (_.isFunction(dataFromSource)) return dataFromSource();else return dataFromSource;
  }

  locationGrouping() {
    return each => each.getLocationText();
  }

  instanceGrouping() {
    return each => each.getName();
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

  setAexprs(aexprs) {
    this.aexprOverview.setAexprs(aexprs);
    this.updateTimeline();
  }

  filterToAEs(aes) {
    this.aexprOverview.filterToAEs(aes);
  }

  updateTimeline() {
    const selectedAEs = this.aexprOverview.getSelectedAEs();
    let scrollBefore = this.diagram.scrollTop;
    let groups = selectedAEs.groupBy(this.getGroupingFunction());
    groups = Object.keys(groups).map(each => {
      const intervals = groups[each].filter(ae => ae.isILA()).flatMap(ae => {
        const events = ae.meta().get('events').filter(e => e.value.value !== undefined);
        let result = [];
        let startDate;
        let startEvent;
        for(const event of events) {
          if(event.value.value) {
            startEvent = event;
            startDate = event.timestamp;
          } else {
            if(startDate) {              
              result.push({start: startDate, startEvent, end: event.timestamp});
              startDate = undefined;
            }
          }
        }
        if(startDate) {
          result.push({start: startDate, startEvent, end: new Date(8640000000000000)}); //max date          
        }
        return result;
      });
      return {
        name: each,
        drops: groups[each].flatMap(ae => {
          return ae.meta().get('events');
        }).filter(this.filterFunction),
        intervals,
      };
    });
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
    this.updateValuesOverTime(selectedAEs);
  }

  updateValuesOverTime(aexprs) {
    this.valuesOverTime.innerHTML = "";
    for (const ae of aexprs) {
      const events = ae.meta().get('events').filter(this.filterFunction);
      const valueChangingEvents = events.filter(event => event.type === "changed value" || event.type === "created");
      if (valueChangingEvents.length === 0) continue;
      const aeID = ae.meta().get('id');
      let th = <th title={ae.getSourceCode(-1, false)}>{ae.getTypeShort() + " " + ae.getName()}</th>;
      let row = <tr></tr>;
      row.append(th);

      th.addEventListener('click', () => {
        this.showEvents(events);
      });

      for (const event of valueChangingEvents) {
        const cell = <td class="tableCell">{event.valueString()}</td>;

        row.append(cell);

        cell.addEventListener('click', () => {
          this.showEvents([event]);
        });
      }
      this.valuesOverTime.append(row);
    }
  }

  async showEvents(events) {
    const timestamps = events.map(e => e.timestamp.getTime());
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);
    const padding = Math.max((maxTime - minTime) / 10, 10);
    const min = new Date(minTime - padding);
    const max = new Date(maxTime + padding);
    const lines = this.shadowRoot.querySelectorAll(".line-label");

    this.chart.scale().domain([min, max]);
    this.chart.zoomToDomain([min, max], 300, 0, d3.easeQuadInOut).on("end", async () => {
      for (const event of events) {
        const ae = event.ae;
        const selected = await this.aexprOverview.ensureSelected(ae);
        if (!selected) return;

        const lineElement = lines.find(element => {
          const dropLineName = element.innerHTML;
          const dropLineAEName = dropLineName.substring(0, dropLineName.lastIndexOf(" "));
          let aeID = ae.getName();
          if (this.groupByLine.checked) {
            aeID = ae.getLocationText();
          }
          return (aeID + " ").includes(dropLineAEName + " ");
        });
        lineElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        this.highlightEvent(event);
      }
    });
  }

  highlightEvent(event) {
    const selectedDrop = this.shadowRoot.querySelector(".drop[id=\"" + event.id + "\"]");
    selectedDrop.setAttribute("r", 10);
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
  
  fileNameString(file) {
    return file.substring(file.lastIndexOf('/') + 1);
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