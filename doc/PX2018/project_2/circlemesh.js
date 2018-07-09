export default class CircleMesh {
  static random(numPoints, maxRadius) {
    let points = [];

    for (let k = 1; k <= numPoints; ++k) {
        let angle = (Math.random() * 2 - 1) * Math.PI
        let radius = Math.sqrt(Math.random()) * maxRadius;
        this.points.push([radius * Math.cos(angle), radius * Math.sin(angle)]);
    }
    
    return points;
  }
  
  static distributed(radius) {
    let points = [];
    for (let i = 1; i < 361; ++i) { // For each degrees
       let x = Math.cos(i) *radius; // I calc the position
       let y = Math.sin(i) * radius;
       points.push([x, y]);
       //uv[i] = new Vector3(x, y);
       //tri[(i-1)*3] = 0; // I don't know if triangles should work like this,
       //tri[(i-1)*3+1] = i; // here I think that triangle is the index of a vertice
       /*if ((i+1 > 360)) {
           tri[(i-1)*3 + 2] = 1;
       } else {
           tri[(i-1)*3 + 2] = i+1;
       }*/
     }
    return points;
  }
  
  static async gmsh(radius, x, y) {
    let response = await fetch("doc/PX2018/project_2/gmsh-circle-mesh.json");
    let points = (await response.json()).points;
    
    for (let point of points) {
      point[0] = (point[0] * radius / 100) + x;
      point[1] = (point[1] * radius / 100) + y;
    }
    
    return points;
  }
}