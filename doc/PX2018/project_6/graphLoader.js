export default function() {
  var graphLoader = {};
    
    graphLoader.loadSmallData = async function() {
      let a = {id: "a", group: 1, x: 0, y: 0, r: 5},
          b = {id: "b", group: 2, x: 0, y: 0, r: 5},
          c = {id: "c", group: 3, x: 0, y: 0, r: 5},
          d = {id: "d", group: 4, x: 0, y: 0, r: 5},
          nodes = [a, b, c, d],
          links = [{source: a, target: b},{source: b, target: c},
                   {source: c, target: a}, {source: a, target: d},
                   {source: b, target: d}, {source: c, target: d} ];
      return {nodes: nodes, links: links};
    }
    
    graphLoader.loadThankYouData = async function() {
      let nodes = [
        {"id": "0", "group": 1, "x": 0, "y": 0, "r": 5},
        {"id": "1", "group": 1, "x": 0, "y": 0, "r": 5},
        {"id": "2", "group": 1, "x": 0, "y": 0, "r": 5},
        {"id": "3", "group": 1, "x": 0, "y": 0, "r": 5},
        {"id": "4", "group": 1, "x": 0, "y": 0, "r": 5},
        {"id": "5", "group": 2, "x": 0, "y": 0, "r": 5},
        {"id": "6", "group": 2, "x": 0, "y": 0, "r": 5},
        {"id": "7", "group": 2, "x": 0, "y": 0, "r": 5},
        {"id": "8", "group": 2, "x": 0, "y": 0, "r": 5},
        {"id": "9", "group": 2, "x": 0, "y": 0, "r": 5},
        {"id": "10", "group": 2, "x": 0, "y": 0, "r": 5},
        {"id": "11", "group": 3, "x": 0, "y": 0, "r": 5},
        {"id": "12", "group": 3, "x": 0, "y": 0, "r": 5},
        {"id": "13", "group": 3, "x": 0, "y": 0, "r": 5},
        {"id": "14", "group": 3, "x": 0, "y": 0, "r": 5},
        {"id": "15", "group": 3, "x": 0, "y": 0, "r": 5},
        {"id": "16", "group": 4, "x": 0, "y": 0, "r": 5},
        {"id": "17", "group": 4, "x": 0, "y": 0, "r": 5},
        {"id": "18", "group": 4, "x": 0, "y": 0, "r": 5},
        {"id": "19", "group": 4, "x": 0, "y": 0, "r": 5},
        {"id": "20", "group": 5, "x": 0, "y": 0, "r": 5},
        {"id": "21", "group": 5, "x": 0, "y": 0, "r": 5},
        {"id": "22", "group": 5, "x": 0, "y": 0, "r": 5},
        {"id": "23", "group": 5, "x": 0, "y": 0, "r": 5},
        {"id": "24", "group": 5, "x": 0, "y": 0, "r": 5},
        {"id": "25", "group": 6, "x": 0, "y": 0, "r": 5},
        {"id": "26", "group": 6, "x": 0, "y": 0, "r": 5},
        {"id": "27", "group": 6, "x": 0, "y": 0, "r": 5},
        {"id": "28", "group": 6, "x": 0, "y": 0, "r": 5},
        {"id": "29", "group": 7, "x": 0, "y": 0, "r": 5},
        {"id": "30", "group": 7, "x": 0, "y": 0, "r": 5},
        {"id": "31", "group": 7, "x": 0, "y": 0, "r": 5},
        {"id": "32", "group": 7, "x": 0, "y": 0, "r": 5},
        {"id": "33", "group": 8, "x": 0, "y": 0, "r": 5},
        {"id": "34", "group": 8, "x": 0, "y": 0, "r": 5},
        {"id": "35", "group": 8, "x": 0, "y": 0, "r": 5},
        {"id": "36", "group": 8, "x": 0, "y": 0, "r": 5},
        {"id": "37", "group": 8, "x": 0, "y": 0, "r": 5}
        ];
    let links = [
        {"source": nodes[0], "target": nodes[1], "value": 1},
        {"source": nodes[1], "target": nodes[2], "value": 1},
        {"source": nodes[1], "target": nodes[3], "value": 1},
        {"source": nodes[3], "target": nodes[4], "value": 1},
        {"source": nodes[5], "target": nodes[6], "value": 1},
        {"source": nodes[6], "target": nodes[7], "value": 1},
        {"source": nodes[6], "target": nodes[9], "value": 1},
        {"source": nodes[8], "target": nodes[9], "value": 1},
        {"source": nodes[9], "target": nodes[10], "value": 1},
        {"source": nodes[11], "target": nodes[12], "value": 1},
        {"source": nodes[12], "target": nodes[13], "value": 1},
        {"source": nodes[12], "target": nodes[14], "value": 1},
        {"source": nodes[13], "target": nodes[14], "value": 1},
        {"source": nodes[14], "target": nodes[15], "value": 1},
        {"source": nodes[16], "target": nodes[17], "value": 1},
        {"source": nodes[17], "target": nodes[18], "value": 1},
        {"source": nodes[18], "target": nodes[19], "value": 1},
        {"source": nodes[20], "target": nodes[21], "value": 1},
        {"source": nodes[21], "target": nodes[22], "value": 1},
        {"source": nodes[21], "target": nodes[23], "value": 1},
        {"source": nodes[21], "target": nodes[24], "value": 1},
        {"source": nodes[25], "target": nodes[26], "value": 1},
        {"source": nodes[27], "target": nodes[26], "value": 1},
        {"source": nodes[26], "target": nodes[28], "value": 1},
        {"source": nodes[30], "target": nodes[29], "value": 1},
        {"source": nodes[29], "target": nodes[32], "value": 1},
        {"source": nodes[31], "target": nodes[30], "value": 1},
        {"source": nodes[32], "target": nodes[31], "value": 1},
        {"source": nodes[33], "target": nodes[34], "value": 1},
        {"source": nodes[34], "target": nodes[35], "value": 1},
        {"source": nodes[35], "target": nodes[36], "value": 1},
        {"source": nodes[36], "target": nodes[37], "value": 1}
        ];
      return {nodes: nodes, links: links};
    }
    
    graphLoader.loadMediumData = async function() {
      let nodes = [
        {"id": "Myriel", "group": 1, "x": 0, "y": 0, "r": 5},
        {"id": "Napoleon", "group": 1, "x": 0, "y": 0, "r": 5},
        {"id": "Mlle.Baptistine", "group": 1, "x": 0, "y": 0, "r": 5},
        {"id": "Mme.Magloire", "group": 1, "x": 0, "y": 0, "r": 5},
        {"id": "CountessdeLo", "group": 1, "x": 0, "y": 0, "r": 5},
        {"id": "Geborand", "group": 1, "x": 0, "y": 0, "r": 5},
        {"id": "Champtercier", "group": 1, "x": 0, "y": 0, "r": 5},
        {"id": "Cravatte", "group": 1, "x": 0, "y": 0, "r": 5},
        {"id": "Count", "group": 1, "x": 0, "y": 0, "r": 5},
        {"id": "OldMan", "group": 1, "x": 0, "y": 0, "r": 5},
        {"id": "Labarre", "group": 2, "x": 0, "y": 0, "r": 5},
        {"id": "Valjean", "group": 2, "x": 0, "y": 0, "r": 5},
        {"id": "Marguerite", "group": 3, "x": 0, "y": 0, "r": 5},
        {"id": "Mme.deR", "group": 2, "x": 0, "y": 0, "r": 5},
        {"id": "Isabeau", "group": 2, "x": 0, "y": 0, "r": 5},
        {"id": "Gervais", "group": 2, "x": 0, "y": 0, "r": 5},
        {"id": "Fauchelevent", "group": 0, "x": 0, "y": 0, "r": 5},
        {"id": "Bamatabois", "group": 2, "x": 0, "y": 0, "r": 5},
        {"id": "Simplice", "group": 2, "x": 0, "y": 0, "r": 5},
        {"id": "Scaufflaire", "group": 2, "x": 0, "y": 0, "r": 5},
        {"id": "Woman1", "group": 2, "x": 0, "y": 0, "r": 5},
        {"id": "Judge", "group": 2, "x": 0, "y": 0, "r": 5},
        {"id": "Champmathieu", "group": 2, "x": 0, "y": 0, "r": 5},
        {"id": "Brevet", "group": 2, "x": 0, "y": 0, "r": 5},
        {"id": "Chenildieu", "group": 2, "x": 0, "y": 0, "r": 5},
        {"id": "Cochepaille", "group": 2, "x": 0, "y": 0, "r": 5}
        ];
      let links = [
        {"source": nodes.find(n => n.id==="Napoleon"), "target": nodes.find(n => n.id==="Myriel"), "value": 1},
        {"source": nodes.find(n => n.id==="Mlle.Baptistine"), "target": nodes.find(n => n.id==="Myriel"), "value": 8},
        {"source": nodes.find(n => n.id==="Mme.Magloire"), "target": nodes.find(n => n.id==="Myriel"), "value": 10},
        {"source": nodes.find(n => n.id==="Mme.Magloire"), "target": nodes.find(n => n.id==="Mlle.Baptistine"), "value": 6},
        {"source": nodes.find(n => n.id==="CountessdeLo"), "target": nodes.find(n => n.id==="Myriel"), "value": 1},
        {"source": nodes.find(n => n.id==="Geborand"), "target": nodes.find(n => n.id==="Myriel"), "value": 1},
        {"source": nodes.find(n => n.id==="Champtercier"), "target": nodes.find(n => n.id==="Myriel"), "value": 1},
        {"source": nodes.find(n => n.id==="Cravatte"), "target": nodes.find(n => n.id==="Myriel"), "value": 1},
        {"source": nodes.find(n => n.id==="Count"), "target": nodes.find(n => n.id==="Myriel"), "value": 2},
        {"source": nodes.find(n => n.id==="OldMan"), "target": nodes.find(n => n.id==="Myriel"), "value": 1},
        {"source": nodes.find(n => n.id==="Valjean"), "target": nodes.find(n => n.id==="Labarre"), "value": 1},
        {"source": nodes.find(n => n.id==="Valjean"), "target": nodes.find(n => n.id==="Mme.Magloire"), "value": 3},
        {"source": nodes.find(n => n.id==="Valjean"), "target": nodes.find(n => n.id==="Mlle.Baptistine"), "value": 3},
        {"source": nodes.find(n => n.id==="Valjean"), "target": nodes.find(n => n.id==="Myriel"), "value": 5},
        {"source": nodes.find(n => n.id==="Marguerite"), "target": nodes.find(n => n.id==="Valjean"), "value": 1},
        {"source": nodes.find(n => n.id==="Mme.deR"), "target": nodes.find(n => n.id==="Valjean"), "value": 1},
        {"source": nodes.find(n => n.id==="Isabeau"), "target": nodes.find(n => n.id==="Valjean"), "value": 1},
        {"source": nodes.find(n => n.id==="Gervais"), "target": nodes.find(n => n.id==="Valjean"), "value": 1},
        {"source": nodes.find(n => n.id==="Fauchelevent"), "target": nodes.find(n => n.id==="Valjean"), "value": 8},
        {"source": nodes.find(n => n.id==="Bamatabois"), "target": nodes.find(n => n.id==="Valjean"), "value": 2},
        {"source": nodes.find(n => n.id==="Simplice"), "target": nodes.find(n => n.id==="Valjean"), "value": 3},
        {"source": nodes.find(n => n.id==="Scaufflaire"), "target": nodes.find(n => n.id==="Valjean"), "value": 1},
        {"source": nodes.find(n => n.id==="Woman1"), "target": nodes.find(n => n.id==="Valjean"), "value": 2},
        {"source": nodes.find(n => n.id==="Judge"), "target": nodes.find(n => n.id==="Valjean"), "value": 3},
        {"source": nodes.find(n => n.id==="Judge"), "target": nodes.find(n => n.id==="Bamatabois"), "value": 2},
        {"source": nodes.find(n => n.id==="Champmathieu"), "target": nodes.find(n => n.id==="Valjean"), "value": 3},
        {"source": nodes.find(n => n.id==="Champmathieu"), "target": nodes.find(n => n.id==="Judge"), "value": 3},
        {"source": nodes.find(n => n.id==="Champmathieu"), "target": nodes.find(n => n.id==="Bamatabois"), "value": 2},
        {"source": nodes.find(n => n.id==="Brevet"), "target": nodes.find(n => n.id==="Judge"), "value": 2},
        {"source": nodes.find(n => n.id==="Brevet"), "target": nodes.find(n => n.id==="Champmathieu"), "value": 2},
        {"source": nodes.find(n => n.id==="Brevet"), "target": nodes.find(n => n.id==="Valjean"), "value": 2},
        {"source": nodes.find(n => n.id==="Brevet"), "target": nodes.find(n => n.id==="Bamatabois"), "value": 1},
        {"source": nodes.find(n => n.id==="Chenildieu"), "target": nodes.find(n => n.id==="Judge"), "value": 2},
        {"source": nodes.find(n => n.id==="Chenildieu"), "target": nodes.find(n => n.id==="Champmathieu"), "value": 2},
        {"source": nodes.find(n => n.id==="Chenildieu"), "target": nodes.find(n => n.id==="Brevet"), "value": 2},
        {"source": nodes.find(n => n.id==="Chenildieu"), "target": nodes.find(n => n.id==="Valjean"), "value": 2},
        {"source": nodes.find(n => n.id==="Chenildieu"), "target": nodes.find(n => n.id==="Bamatabois"), "value": 1},
        {"source": nodes.find(n => n.id==="Cochepaille"), "target": nodes.find(n => n.id==="Judge"), "value": 2},
        {"source": nodes.find(n => n.id==="Cochepaille"), "target": nodes.find(n => n.id==="Champmathieu"), "value": 2},
        {"source": nodes.find(n => n.id==="Cochepaille"), "target": nodes.find(n => n.id==="Brevet"), "value": 2},
        {"source": nodes.find(n => n.id==="Cochepaille"), "target": nodes.find(n => n.id==="Chenildieu"), "value": 2},
        {"source": nodes.find(n => n.id==="Cochepaille"), "target": nodes.find(n => n.id==="Valjean"), "value": 2},
        {"source": nodes.find(n => n.id==="Cochepaille"), "target": nodes.find(n => n.id==="Bamatabois"), "value": 1}
      ];
      return {nodes: nodes, links: links};
    }
    
    graphLoader.loadModuleData = async function() {
      let graph = {nodes: [], links: []},
          graphModules = [];
          
      Object.values(System.loads).map( ea => ea.key).map(function (moduleName) {
        if (moduleName.match(/\.js\?[0-9]+/)) return;
        if (moduleName.match(/lively.js/)) return;
        if (moduleName.match(/graphics.js/)) return;
        if (moduleName.match(/Morph.js/)) return;
        
        
        graphModules.push(moduleName);
        graph.nodes.push({name: moduleName, id: graphModules.length - 1,
                          x: 0, y: 0, r: 5});
        return moduleName;
      }).forEach(function (moduleName) {
          if (!moduleName) return;
          var mod = System.loads[moduleName]
          mod.dependencies.forEach(function (dependency) {
            var depKey = System.normalizeSync(dependency, mod.key)
            var targetIdx = graphModules.indexOf(depKey);
            if (targetIdx < 0) return;
            graph.links.push({
              source: graph.nodes.find(n => n.name === depKey),
              target: graph.nodes.find(n => n.name === moduleName), value: 1
            });
          });
      })
      return graph;
    }
    
  return graphLoader;
}