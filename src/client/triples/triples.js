

class Knot {
  
  
  
  static localFromResponse(response) {
    
  }
}

class Triple extends Knot {
  
}

class Graph {
 
}

// Have to be transparent
class LateBoundReference {
  constructor(url) {
    
  }
  
  get() {
    
  }
}

export default async function loadDropbox(directory) {
  let directoryURL = new URL(directory);
  let text = await lively.files.statFile(directory);
  lively.notify(text);
  let json = JSON.parse(text);
  let fileDescriptors = json.contents;
  fileDescriptors = fileDescriptors.filter(desc => desc.type === "file");
  let fileNames = fileDescriptors.map(desc => desc.name);
  let knots = await Promise.all(fileNames.map(fileName => {
    let path = new URL(fileName, directoryURL);
    return fetch(path)
      .then(response => response.text())
      .then(text => ({ text, fileName }));
  }));
  return knots;
}
