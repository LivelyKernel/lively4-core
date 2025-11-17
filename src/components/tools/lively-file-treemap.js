"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import Files from 'src/client/files.js';
import { debounce } from 'utils';
import {gloperate, Configuration, initialize as initializeCanvas, Renderer, Visualization} from 'https://lively-kernel.org/lively4/treemap-renderer/dist/treemap-renderer.js';

export default class LivelyFileTreemap extends Morph  {

  async initialize() {
    this.fileTreemapRenderer = new FileTreemapRenderer();
    this.fileTreemapRenderer.initialize(this.treemapCanvas = this.get("#treemap-canvas"));
    await this.ensureData();
    this.fileTreemapRenderer.setData(/*this.data*/);
    this.fileTreemapRenderer.updateView();
    this.addEventListener('extent-changed', ((evt) => { this.onExtentChanged(evt); })::debounce(500));
    this.fileTreemapRenderer.setColorScheme("Reds");
  }
  
  async ensureData() {
    if (this.data) return;
    this.data = await Files.fileTree("src");
  
  }
  
  onExtentChanged() {
    this.fileTreemapRenderer.resize();
    this.fileTreemapRenderer.config.altered.alter('any');
    this.fileTreemapRenderer.updateView();
  }
  
}

const VisualizationType = {
    VISUALIZATION_2D: 0,
    VISUALIZATION_3D: 1
  };

class FileTreemapRenderer extends gloperate.Initializable {
  
  initialize(htmlCanvasElement) {
    this.canvas = initializeCanvas(htmlCanvasElement);
    this.visualization = new Visualization(this.visualizationType ? this.visualizationType : VisualizationType.VISUALIZATION_3D);
    const renderer = this.visualization.renderer;
    this.canvas.renderer = renderer;
    this._initialized = true;

    return true;
  }

  //TODO: this should be called to get rid of old WebGL Contexts
  uninitialize() {
    this.canvas.dispose();
    this.renderer.uninitialize();
  }
  
  
  updateView() {
    this.visualization.update()
  }
  
  
  resize() {
    //TODO: Doesn't work yet
    this.visualization.renderer._altered.alter("frameSize");
  }
  
  setData(data = undefined) { 
    this.config = this.makeExampleConfig();
    
    if(!data) {
      this.visualization.configuration = this.config;
      return;
    }
    
    const topologyData = [];
    const weightData = [];
    const labelData = [];
    const colorData = [];
    
    //TODO: optimize structure
    function readChildren(parentURL, dataContext) {
      if(parentURL) {
        const identifier = dataContext.url
        
        topologyData.push(parentURL, identifier);
        colorData.push([identifier, (dataContext.type == "file" ? 0.9 : 0.2)]);
        labelData.push([identifier, dataContext.name]);
        
        if(!dataContext.children) {
          // this is a leaf node
          weightData.push([identifier, dataContext.size]);
          return dataContext.size;
        }
        
        let accumulatedWeight = 0;
        dataContext.children.forEach((child) => accumulatedWeight += Number(readChildren(dataContext.url, child)));
        weightData.push([identifier, accumulatedWeight]);
        return accumulatedWeight;

      }
      // this is the root
      
      labelData.push([dataContext.name, dataContext.name])
      if(!dataContext.children) return 0;
      let accumulatedWeight = 0
      dataContext.children.forEach((child) => accumulatedWeight += Number(readChildren(dataContext.name, child)));
      console.log(dataContext.name);
      console.log(accumulatedWeight);
      weightData.push([dataContext.name, accumulatedWeight]);
      return accumulatedWeight;
    }

    readChildren(undefined, data);
    
    //TODO: EvalError: Accumulated leaf weights as root weight expected.
    // check Example parser
    
    this.config.topology.edges = topologyData;
    this.config.buffers[0].data = Object.fromEntries(weightData);
    this.config.buffers[2].data = Object.fromEntries(colorData);
    this.config.labels.names = Object.fromEntries(labelData);      
    
    this.visualization.configuration = this.config;    
  }
  
  makeExampleConfig() {
    const config = new Configuration();
    config.topology = {
        edges: [0,1,0,2,0,3,0,4,1,5,1,6,2,7,2,8,3,9,3,10,4,11,4,12],
        format: "interleaved",
        semantics: "parent-id-id"
      };
    
    config.layout = {
      algorithm: "strip",
      weight: "bufferView:weights",
      sort: {
      key: "bufferView:weights",
      algorithm: "keep"
      },
      parentPadding: {
        type: "relative",
        value: 0.05
      },
      siblingMargin: {
        type: "relative",
        value: 0.05
      },
      accessoryPadding: {
        type: "absolute",
        direction: "bottom",
          value: [
            0,
            0.02,
            0.01,
            0
          ],
          relativeAreaThreshold: 0.4,
          targetAspectRatio: 8
        }
      };

      config.buffers = [
        {
          identifier: "source-weights",
          type: "numbers",
          data: {
            "0": 0,
            "1": -1,
            "2": -1,
            "3": -1,
            "4": -1,
            "5": 0.125,
            "6": 0.25,
            "7": 0.125,
            "8": 0.125,
            "9": 0.5,
            "10": 0.125,
            "11": 0.5,
            "12": 0.5
          },
          linearization: "topology"
        },
        {
          identifier: "source-heights",
          type: "numbers",
          data: {
            "0": 0,
            "1": -1,
            "2": -1,
            "3": -1,
            "4": -1,
            "5": 0.1,
            "6": 0.1,
            "7": 0.3,
            "8": 0.2,
            "9": 0.1,
            "10": 0.1,
            "11": 0.1,
            "12": 0.2
          },
          linearization: "topology"
        },
        {
          identifier: "source-colors",
          type: "numbers",
          data: {
            "0": 0,
            "1": -1,
            "2": -1,
            "3": -1,
            "4": -1,
            "5": 0,
            "6": 0.1,
            "7": 0.1,
            "8": 0.6,
            "9": 0.7,
            "10": 1,
            "11": 0,
            "12": 0
          },
          linearization: "topology"
        }
      ];

      config.bufferViews = [
      {
        identifier: "weights",
        source: "buffer:source-weights",
        transformations: [
          {
            type: "fill-invalid",
            value: 0,
            invalidValue: -1
          },
          {
            type: "propagate-up",
            operation: "sum"
          }
        ]
      },
      {
        identifier: "heights-normalized",
        source: "buffer:source-heights",
        transformations: [
          {
            type: "fill-invalid",
            value: 0,
            invalidValue: -1
          },
          {
            type: "normalize",
            operation: "zero-to-max"
          }
        ]
      },
      {
        identifier: "colors-normalized",
        source: "buffer:source-colors",
        transformations: [
          {
            type: "fill-invalid",
            value: 0,
            invalidValue: -1
          },
          {
            type: "normalize",
            operation: "zero-to-max"
          }
        ]
      }
    ];

      config.colors = [
      {
        identifier: "emphasis",
        colorspace: "hex",
        value: "#00b0ff"
      },
      {
        identifier: "auxiliary",
        colorspace: "hex",
        values: [
          "#00aa5e",
          "#71237c"
        ]
      },
      {
        identifier: "inner",
        colorspace: "hex",
        values: [
          "#e8eaee",
          "#eef0f4"
        ]
      },
      {
        identifier: "leaf",
        preset: "Blues",
        steps: 7
      }];
      config.geometry = {
        parentLayer: {showRoot: false},
        leafLayer: {
          colorMap: "color:leaf",
          height: "bufferView:heights-normalized",
          colors: "bufferView:colors-normalized"
        },
        emphasis: {
          outline: [],
          highlight: []
        },
        heightScale: 0.5
      };
      config.labels = {"innerNodeLayerRange": [
        1,
        2
      ],
      numTopInnerNodes: 50,
      numTopWeightNodes: 50,
      numTopHeightNodes: 50,
      numTopColorNodes: 50,
      names: {
        "1": "a",
        "2": "b",
        "3": "c",
        "4": "d",
        "5": "e",
        "6": "f",
        "7": "g",
        "8": "h",
        "9": "i",
        "10": "j",
        "11": "k",
        "12": "l"
      }
    };
    return config;
  }
  
  setColorScheme(preset) {
    this.config.colors[3].preset = preset;
    this.config.altered.alter("colors");
    this.updateView();
  }
  
  setColorSteps(steps) {
    this.config.colors[3].steps = steps;
    this.config.altered.alter("colors");
    this.updateView();

  }
  
  //TODO figure out highlighting mechanism
  highlightNodes(/*TODO*/) {
    /*TODO*/
  }
  
  removeNodeHighlights(/*TODO*/) {
    /*TODO*/
  }
  
  //TODO change mappings
  setColorAttribute(/*TODO*/) {
    /*TODO*/
  }
  
  setWeightAttribute(/*TODO*/) {
    /*TODO*/
  }
  
  setHeightAttribute(/*TODO*/) {
    /*TODO*/
  }
  
  setVisualizationType(visualizationType) {
    if(visualizationType !== this.visualizationType) {
      this.visualizationType = visualizationType;
      this.uninitialize()
      this.initialize()
    }
  }

  /*livelyMigrate(other) {
    
    this.foo = other.foo
  }*/
}