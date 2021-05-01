export default class TodoFilter {
  
  static async render(url) {
    var source = await fetch(url).then(r => r.text())
    
    return <div>Open: {
        ...source
        .split("\n")
        .filter(line => line.match(/^- \[[ x]\] /))
        .filter(item => item.match(/^- \[[ ]\] /))
        .length
      } | TODO: {
        ...source
        .split("\n")
        .filter(line => line.match(/^- \[[ x]\] /))
        .filter(item => item.match(/^- \[[x]\] /))
        .length
      }
    </div>
    
  }
}