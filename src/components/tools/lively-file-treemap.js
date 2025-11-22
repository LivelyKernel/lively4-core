"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import Files from 'src/client/files.js';
import { debounce } from 'utils';
import { gloperate, Configuration, initialize as initializeCanvas, Renderer,
  Visualization } from 'https://lively-kernel.org/lively4/treemap-renderer/dist/treemap-renderer.js';

export default class LivelyFileTreemap extends Morph {

  async initialize() {
    this.fileTreemapRenderer = new FileTreemapRenderer();
    this.fileTreemapRenderer.initialize(this.treemapCanvas = this.get("#treemap-canvas"));
    await this.ensureData();
    this.fileTreemapRenderer.setData(this.data);
    this.fileTreemapRenderer.updateView();
    this.addEventListener('extent-changed', ((evt) => { this.onExtentChanged(evt); })::debounce(500));
  }

  async ensureData() {
    if (this.data) return;
    
    /*this.data = {
       children: [
          {
            name: "parts",
            size: "1",
            type: "file",
            url: "src/parts",
          },
          {
            name: "test",
            size: "1",
            type: "file",
            url: "src/test" 
          }
      ],
      name: "src"
    };*/
    this.data = await Files.fileTree("src");

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

  initialize(htmlCanvasElement) {
    this.canvas = initializeCanvas(htmlCanvasElement);
    this.visualization = new Visualization(this.visualizationType ? this.visualizationType : VisualizationType
      .VISUALIZATION_3D);
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
    //TODO: for generic use
    if(weightAttribute) this.weightAttribute = weightAttribute;
    if(heightAttribute) this.heightAttribute = heightAttribute;
    if(colorAttribute) this.colorAttribute = colorAttribute;

    if(!this.config) this.config = this.setupConfig();
    
    if (!data) {
      this.visualization.configuration = this.config;
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
      
      weightData.push([currentID, Number((currentNode.nodeData.size && currentNode.nodeData.type == "file") ? currentNode.nodeData.size : 0)]);
        heightData.push([currentID, 1]);
        colorData.push([currentID, 0.5]);
      
      if(!currentNode.nodeData.children) continue;
      for(const child of currentNode.nodeData.children) {
        queue.push({nodeData: child, parentID: currentID});
      }
    }

    console.log("labels before", this.config.labels.names);
    console.log("weights before", this.config.buffers[0].data);
    console.log("height before", this.config.buffers[1].data);
    console.log("colors before", this.config.buffers[2].data);
    console.log("topology before", this.config.topology.edges);
    
    this.config.topology.edges = topologyData;
    this.config.buffers[0].data = Object.fromEntries(weightData);
    this.config.buffers[1].data = Object.fromEntries(heightData);
    this.config.buffers[2].data = Object.fromEntries(colorData);
    this.config.labels.names = new Map(Object.entries(Object.fromEntries(labelData)));
    
    console.log("labels after", this.config.labels.names);
    console.log("weights after", this.config.buffers[0].data);
    console.log("height after", this.config.buffers[1].data);
    console.log("colors after", this.config.buffers[2].data);
    console.log("topology after", this.config.topology.edges);
    
    this.visualization.configuration = this.config;
    
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
        2
      ],
      numTopInnerNodes: 50,
      numTopWeightNodes: 50,
      numTopHeightNodes: 50,
      numTopColorNodes: 50,
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
