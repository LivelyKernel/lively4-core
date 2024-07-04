import Morph from 'src/components/widgets/lively-morph.js';

import * as d3 from "https://d3js.org/d3.v4.min.js"
import * as Plotly from "https://cdn.plot.ly/plotly-2.32.0.min.js"

const traceConfig = {
  
}

export default class AstroPlot extends Morph {
  showFeature(feature) {
    const container = this.get('#embedding_plot');
    const existingTraceIndex = this.plot && this.plot.data.findIndex(trace => trace.name === 'live_embedding');
    if (existingTraceIndex > -1) {
        Plotly.deleteTraces(container, existingTraceIndex);
    }
    
    const { umap_embedding, plot_content, cluster } = feature;

    // Add the new yellow point
    const newTrace = {
      x: [umap_embedding[0]],
      y: [umap_embedding[1]],
      z: [umap_embedding[2]],
      mode: 'markers',
      marker: {
        size: 8,
        color: cluster,
        colorscale: 'Viridis',
        line: {
          color: 'rgba(20, 20, 20, 0.8)',
          width: 2
        },
        opacity: 0.8,
      },
      hoverlabel: {
        align: 'left'
      },
      customdata: [{
        cluster: 'Cluster ' + cluster, 
        contentAbbr: `${this.displayContent(plot_content)}...`
      }],
      hovertemplate: `
        <b>%{customdata.cluster}</b><br>
        
        <br>

        <b>Code:</b><br>
        %{customdata.contentAbbr}
        <extra></extra>
      `,
      name: 'live_embedding',
      type: 'scatter3d'
    };
    
    Plotly.addTraces(container, newTrace)
  }
  
  displayContent(str) {
    if (typeof(str) !== 'string') {
      console.warn('empty string');
      return '<empty>';
    }
    return str.slice(0, 100).replace('\n', '<br>');
  }
  
  async displayData(features, clusters) {
    if (!clusters) clusters = Array(features.length).fill(0);
    
    const dataframe = {
      _push(el) {
        Object.entries(el).forEach(([key, value]) => {
          if (!(key in this)) this[key] = [];
          this[key].push(value);
        });
      }
    };
    
    features.forEach(({ 
      umap_embedding,
      plot_title,
      plot_content,
      file,
      id
    }, i) => dataframe._push({
      x: umap_embedding[0],
      y: umap_embedding[1],
      z: umap_embedding[2],
      color: clusters[i],
      customdata: { 
        cluster: 'Cluster ' + clusters[i], 
        content: plot_content,
        title: plot_title,
        file,
        contentAbbr: `${this.displayContent(plot_content)}...`
      },
      // text: ' ' + plot_title, // ' '+ neccessary!!
      ids: id || i
    }));
    
    const data = [
      {
        ...dataframe,
        mode: 'markers+text',
        marker: {
          size: 8,
          line: {
            color: 'rgba(217, 217, 217, 0.14)',
            width: 0.5
          },
          opacity: 0.8,
          color: clusters,
          colorscale: 'Viridis',
        },
        selected: {
          marker: {
            size: 15,         
            line: {
              width: 4
            }
          }
        },
        unselected: {
          marker: {
            size: 8,
          }
        },
        hoverlabel: {
          align: 'left'
        },
        hovertemplate: `
<b>%{customdata.cluster}</b><br>
<b>Path</b>
<br>
%{customdata.file}
<br>
<br>
<b>Code:</b>
<br>
%{customdata.contentAbbr}
<extra></extra>`,
        type: 'scatter3d',
        selectedpoints: [0, 1]
      }
    ]
   
    var layout = {
      margin: {
        l: 0,
        r: 0,
        b: 0,
        t: 0,
      },
      clickmode: 'event+select'
    };
    
    let container = this.get('#embedding_plot')
    container.innerHTML = "";
    
    this.plot = await Plotly.newPlot(container, data, layout, {
      responsive: true,
      displayModeBar: false
    });
    
    
    container.on('plotly_click', (data) => {
      let item = data.points[0];
      
      // Update the plot with new selected points
      // Plotly.restyle(container, 'selectedpoints', [item.pointNumber], [item.curveNumber]);
      
      this.dispatchEvent(new CustomEvent('item_click', { detail: item }));
    });
    
  }
  
  async initialize() {
    this.windowTitle = "AstroPlot";

    lively.html.registerKeys(this); // automatically installs handler for some methods
    
    
    const getRealData = async () => await fetch("http://127.0.0.1:5000/dataset/d3-force-main/umap")
      .then(response => response.json());
    const getClusters = async () => await fetch("http://127.0.0.1:5000/dataset/d3-force-main/clusters")
      .then(response => response.json());
    
    //const getRealData = async () => await fetch("http://127.0.0.1:5000/dataset/d3-force-main/umap")
    
    // const response = await getRealData();
    const features = await getRealData(); //await response.json()
    const clusters = await getClusters();
    
    await this.displayData(features, clusters);
 }

/*
  livelyInspect(contentNode, inspector) {
    // overrides how the inspector displays this component
  }
*/
  
  async livelyExample() {
    // this customizes a default instance to a pretty example
    // this is used by the 
    // this.style.backgroundColor = "lightgray"
    // this.someJavaScriptProperty = 42
    // this.appendChild(<div>This is my content</div>)
  }
}