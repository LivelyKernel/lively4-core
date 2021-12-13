import PipelineObject from "../components/pipelineObject.js";
import DataSource from "../components/pipelineDataSource.js";
import ActiveFilter from "../components/pipelineActiveFilter.js";
import PassivePipe from "../components/pipelinePassivePipe.js";
import DataSink from "../components/pipelineDataSink.js";
import PipesAndFiltersUtils from "../utils/pipesAndFiltersUtils.js";
import * as constants from "../utils/pipelineConstants.js";

export default class PassivePipeTwoActiveFiltersError {

  constructor(context, dataSourceLabels = null, pipe1Labels = null, filter1Labels = null, pipe2Labels = null, filter2Labels = null, pipe3Labels = null, dataSinkLabels = null) {
    this.context = context;
    this.utils = new PipesAndFiltersUtils();
    this.dataSource = {
      buffer: [],
      view: this.context.querySelector("#data-source"),
      label: this.context.querySelector("#data-source-label")
    };

    this.dataSink = {
      buffer: [],
      view: this.context.querySelector("#data-sink"),
      label: this.context.querySelector("#data-sink-label")
    };

    this.filter1 = {
      buffer: [],
      view: this.context.querySelector("#filter1"),
      label: this.context.querySelector("#filter1-label"),
      progress: this.context.querySelector("#filter1-progress")
    };

    this.filter2 = {
      buffer: [],
      view: this.context.querySelector("#filter2"),
      label: this.context.querySelector("#filter2-label"),
      progress: this.context.querySelector("#filter2-progress")
    };

    this.pipe1 = {
      buffer: [],
      view: this.context.querySelector("#pipe1"),
      label: this.context.querySelector("#pipe1-label")
    };

    this.pipe2 = {
      buffer: [],
      view: this.context.querySelector("#pipe2"),
      label: this.context.querySelector("#pipe2-label")
    };

    this.pipe3 = {
      buffer: [],
      view: this.context.querySelector("#pipe3"),
      label: this.context.querySelector("#pipe3-label")
    };

    if (dataSourceLabels != null) {
      this.utils.setLabels(this.dataSource.label, dataSourceLabels);
    }
    if (pipe1Labels != null) {
      this.utils.setPipeLabels(this.pipe1.label, pipe1Labels);
    }
    if (filter1Labels != null) {
      this.utils.setLabels(this.filter1.label, filter1Labels);
    }
    if (pipe2Labels != null) {
      this.utils.setPipeVerticalLabels(this.pipe2.label, pipe2Labels);
    }
    if (filter2Labels != null) {
      this.utils.setLabels(this.filter2.label, filter2Labels);
    }
    if (pipe3Labels != null) {
      this.utils.setPipeLabels(this.pipe3.label, pipe3Labels);
    }
    if (dataSinkLabels != null) {
      this.utils.setLabels(this.dataSink.label, dataSinkLabels);
    }
    this.card = this.context.querySelector("#object-card");
    this.cardRow1 = this.card.querySelector("#object-card-row1")
    this.cardRow2 = this.card.querySelector("#object-card-row2")
    this.cardRow3 = this.card.querySelector("#object-card-row3")
    this.cardClose = this.context.querySelector("#object-card-close")
    this.cardClose.addEventListener("click", () => {
      this.card.style.visibility = "hidden";
      this.cardClose.style.visibility = "hidden";
    });
    
    this.currentObject = new PipelineObject();
    
    this.cardRow2.addEventListener("click", () => {
      switch (this.currentObject.type) {
        case constants.Type.CIRCLE:
          this.currentObject.type = constants.Type.SQUARE;
          break;
        case constants.Type.SQUARE:
          this.currentObject.type = constants.Type.TRIANGLE;
          break;
        case constants.Type.TRIANGLE:
          this.currentObject.type = constants.Type.CIRCLE;
          break;
      }
      this.updateCardView(this.currentObject);
      this.updateView()
    });
    
    this.cardRow3.addEventListener("click", () => {
      switch (this.currentObject.color) {
        case constants.Color.RED:
          this.currentObject.color = constants.Color.RED_T;
          break;
        case constants.Color.RED_T:
          this.currentObject.color = constants.Color.GREEN;
          break;
        case constants.Color.GREEN:
          this.currentObject.color = constants.Color.GREEN_T;
          break;
        case constants.Color.GREEN_T:
          this.currentObject.color = constants.Color.BLUE;
          break;
        case constants.Color.BLUE:
          this.currentObject.color = constants.Color.BLUE_T;
          break;
        case constants.Color.BLUE_T:
          this.currentObject.color = constants.Color.YELLOW;
          break;
        case constants.Color.YELLOW:
          this.currentObject.color = constants.Color.YELLOW_T;
          break;
        case constants.Color.YELLOW_T:
          this.currentObject.color = constants.Color.RED;
          break;
      }
      this.updateCardView(this.currentObject);
      this.updateView()
    });

    this.passivePipe1 = new PassivePipe(this.pipe1, -1);
    this.passivePipe2 = new PassivePipe(this.pipe2, -1);
    this.passivePipe3 = new PassivePipe(this.pipe3, -1);
    this.activeFilter1 = new ActiveFilter(this.passivePipe1, this.passivePipe2, this.filter1);
    this.activeFilter2 = new ActiveFilter(this.passivePipe2, this.passivePipe3, this.filter2);
  }

  async updateView() {
    this.utils.drawObjects(this.dataSource);
    this.utils.drawObjects(this.pipe1);
    this.utils.drawFilterObject(this.filter1);
    this.utils.drawVerticalObjects(this.pipe2);
    this.utils.drawFilterObject(this.filter2);
    this.utils.drawObjects(this.pipe3);
    this.utils.drawObjects(this.dataSink);
  }
  
  addToCardRow(row, html) {
    row.querySelectorAll('*').forEach(n => n.remove());
    row.append(html);
  }
  
  updateCardView(object) {
    this.currentObject = object
    this.addToCardRow(this.cardRow1, object.drawDiv())
    this.addToCardRow(this.cardRow2, <span><b>type: </b><br></br>{object.type} </span>)
    this.addToCardRow(this.cardRow3, <span><b>color: </b><br></br>{object.color} </span>)
  }

  async buildButtons() {
    var buttons = <div>
      <button click={event => {
        this.dataSource.buffer.push(new PipelineObject((object) => {
          this.updateCardView(object)
          this.card.style.visibility = "visible";
          this.cardClose.style.visibility = "visible";
          this.updateView();
        }));
        this.updateView();
      }}>push</button>
      <button click={event => {

        let dataSourceObject = this.dataSource.buffer.shift();
        let pipe3Object = this.pipe3.buffer.shift();

        if (typeof pipe3Object !== "undefined") {
          this.dataSink.buffer.push(pipe3Object);
        }

        if (typeof dataSourceObject !== "undefined") {
          this.pipe1.buffer.push(dataSourceObject);
        }

        this.updateView();
      }}>next</button>
      <button click={event => {
        var dataSource = new DataSource(this.dataSource, this.passivePipe1);
        dataSource.pushToPipe(() => {
          this.updateView();
        });

        var dataSink = new DataSink(this.dataSink, this.pipe3);
        dataSink.getFromPipe(() => {
          this.updateView();
        });

        this.activeFilter1.filter(async object => {
          await this.utils.animateFilter(this.filter1, 1000, () => {
            if (object.type !== constants.Type.CIRCLE) {
              object = undefined;
            }
          });
          return object;
        }, () => {
          console.log("view: ", this.pipe2);
          this.updateView();
        }, this.context);

        this.activeFilter2.filter(async object => {
          await this.utils.animateFilter(this.filter2, 2500, () => {
            
            if(object.type != constants.Type.CIRCLE) {
              object = "error"
            } else {
             object.setType(object.type);
             object.setColor(constants.Color.BLUE, object.type);
            }
            
          });
          return object;
        }, () => {
          console.log("view: ", this.pipe3);
          this.updateView();
        }, this.context);
      }}>startActiveFilter</button>
          
      <button click={event => {
        this.activeFilter1.stop();
        this.activeFilter2.stop();
      }}>stopActivePipe</button>
          
     <button click={event => {
        this.filter2.buffer = []
        this.filter1.buffer = []
      }}>clear filter</button>
    </div>;
    return buttons;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

}