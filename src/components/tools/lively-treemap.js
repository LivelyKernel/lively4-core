"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import Files from 'src/client/files.js';
import { debounce } from 'utils';
import { gloperate, Configuration, initialize as initializeCanvas, Renderer,
  Visualization } from 'https://lively-kernel.org/lively4/treemap-renderer/dist/treemap-renderer.js';

export default class LivelyTreemap extends Morph {

  async initialize() {
    
    this.addEventListener('extent-changed', ((evt) => { this.onExtentChanged(evt); })::debounce(500));

    // make TreemapRenderer
    this.fileTreemapRenderer = new FileTreemapRenderer(VisualizationType.VISUALIZATION_3D);
    this.fileTreemapRenderer.initialize(this.treemapCanvas = this.get("#treemap-canvas"));
    
    //TODO find out why data can only be set once
    //this.fileTreemapRenderer.setData();
    //this.fileTreemapRenderer.updateView();

    // scripting area
    
    const weightAttributeName = "size";
    const heightAttributeName = "size";
    const colorAttributeName = "size";
    
    await this.ensureData();
    this.fileTreemapRenderer.setData(this.data, weightAttributeName, heightAttributeName, colorAttributeName);   
    
    this.fileTreemapRenderer.setColorScheme("YlGnBu");
    this.fileTreemapRenderer.setColorSteps(7);
    
    this.fileTreemapRenderer.displayTopWeightLabels(10);
    this.fileTreemapRenderer.displayTopColorLabels(10);
    this.fileTreemapRenderer.displayTopHeightLabels(10);
    
  }

  async ensureData() {
    if (this.data) return;
    
    this.data = await Files.fileTree("src/");

  }

  onExtentChanged() {
    this.fileTreemapRenderer.resize();
    this.fileTreemapRenderer.config.altered.alter('any');
    this.fileTreemapRenderer.updateView();
  }

  //TODO lively migrate visualization._renderer._camera

}

const VisualizationType = {
  VISUALIZATION_2D: 0,
  VISUALIZATION_3D: 1
};

class FileTreemapRenderer extends gloperate.Initializable {
  
  constructor(visualizationType = VisualizationType.VISUALIZATION_2D) {
    super();
    this.visualizationType = visualizationType;
  }

  initialize(htmlCanvasElement) {
    this.canvas = initializeCanvas(htmlCanvasElement);
    this.visualization = new Visualization(this.visualizationType);
    this.renderer = this.visualization.renderer;
    this.canvas.renderer = this.renderer;
    this._initialized = true;

    return true;
  }

  
  //TODO: this should be called to get rid of old WebGL Contexts
  uninitialize() {
    this.canvas.dispose();
    this.renderer.uninitialize();
  }


  updateView() {
    this.visualization.update();
  }


  resize() {
    //TODO: Doesn't work yet
    this.visualization.renderer._altered.alter("frameSize");
  }

  
  setData(data = undefined, weightAttribute = undefined, heightAttribute = undefined, colorAttribute = undefined) {
    //TODO: add children and label parameters
    if(weightAttribute) this.weightAttribute = weightAttribute;
    if(heightAttribute) this.heightAttribute = heightAttribute;
    if(colorAttribute) this.colorAttribute = colorAttribute;

    if(!this.config) this.config = this.setupConfig();
    this.visualization.configuration = this.config;
    
    if (!data) {
      return;
    }
    
    const topologyData = [];
    const weightData = [];
    const heightData = [];
    const labelData = [];
    const colorData = [];
    let indexID = 0;
    
    //read JSON using BFS
    const queue = [{nodeData: data, parentID: undefined}]
    
    while (queue.length > 0) {
      const currentNode = queue.shift();
      if(currentNode == undefined) continue;
      const currentID = indexID.toString();
      indexID++;
      
      if(currentNode.parentID !== undefined) {
        topologyData.push(currentNode.parentID, currentID);
        labelData.push([currentID, currentNode.nodeData.name]); 
      }
      
      const nodeWeight = Number((currentNode.nodeData[this.weightAttribute] && currentNode.nodeData.type == "file") ? currentNode.nodeData[this.weightAttribute] : 0);
      const nodeHeight = Number((currentNode.nodeData[this.heightAttribute] && currentNode.nodeData.type == "file") ? currentNode.nodeData[this.heightAttribute] : 0);
      const nodeColor = Number((currentNode.nodeData[this.colorAttribute] && currentNode.nodeData.type == "file") ? currentNode.nodeData[this.colorAttribute] : 0);
            
        weightData.push([currentID, nodeWeight]);
        heightData.push([currentID, nodeHeight]);
        colorData.push([currentID, nodeColor]);
      
      if(!currentNode.nodeData.children) continue;
      for(const child of currentNode.nodeData.children) {
        queue.push({nodeData: child, parentID: currentID});
      }
    }

    this.config.topology.edges = topologyData;
    this.config.buffers[0].data = Object.fromEntries(weightData);
    this.config.buffers[1].data = Object.fromEntries(heightData);
    this.config.buffers[2].data = Object.fromEntries(colorData);
    this.config.labels.names = new Map(Object.entries(Object.fromEntries(labelData)));    
  }

  
  setupConfig() {
    let config = new Configuration();
    
    config.topology = {
      edges: [0,1, 0,2],
      format: "interleaved",
      semantics: "parent-id-id"
    }
    
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
        value: 0.1
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
    }
    
    config.buffers = [{
        identifier: "source-weights",
        type: "numbers",
        data: {
          "0": 0,
          "1": 1,
          "2": 1
        },
        linearization: "topology"
      },
      {
        identifier: "source-heights",
        type: "numbers",
        data: {
          "0": 0,
          "1": 1,
          "2": 1
        },
        linearization: "topology"
      },
      {
        identifier: "source-colors",
        type: "numbers",
        data: {
          "0": 0,
          "1": 1,
          "2": 0.5,
        },
        linearization: "topology"
      }
    ];

    config.bufferViews = [{
        identifier: "weights",
        source: "buffer:source-weights",
        transformations: [{
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
        transformations: [{
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
        transformations: [{
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
    
    config.colors = [{
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
      }
    ];
    
    config.geometry = {
      parentLayer: { showRoot: false },
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
    
    config.labels = {
      "innerNodeLayerRange": [
        1,
        3
      ],
      numTopInnerNodes: 50, //todo set this to inner label count
      numTopWeightNodes: 7,
      numTopHeightNodes: 0,
      numTopColorNodes: 0,
      names: {
          "1": "leaf 1",
          "2": "leaf 2"
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
  highlightNodes( /*TODO*/ ) {
    /*TODO*/
  }

  
  removeNodeHighlights( /*TODO*/ ) {
    /*TODO*/
  }

  
  //TODO change mappings
  setColorAttribute( /*TODO*/ ) {
    /*TODO*/
  }

  
  setWeightAttribute( /*TODO*/ ) {
    /*TODO*/
  }

  
  setHeightAttribute( /*TODO*/ ) {
    /*TODO*/
  }
  
  
  displayTopWeightLabels(n) {
    this.config.labels.numTopWeightNodes = n;
    this.config.altered.alter("labels");
    this.updateView();
  }
  
  displayTopHeightLabels(n) {
    this.config.labels.numTopHeightNodes = n;
    this.config.altered.alter("labels");
    this.updateView();
  }
  
  displayTopColorLabels(n) {
    this.config.labels.numTopColorNodes = n;
    this.config.altered.alter("labels");
    this.updateView();
  }

  
  setVisualizationType(visualizationType) {
    if (visualizationType !== this.visualizationType) {
      this.visualizationType = visualizationType;
      this.visualization = new Visualization(this.visualizationType);
      this.renderer.uninitialize();
      this.renderer = this.visualization.renderer;
      this.canvas.renderer = this.renderer;
    }
  }
}
