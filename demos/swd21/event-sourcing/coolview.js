export default class CoolView {

  static async render(url) {
    var source = await fetch(url).then(r => r.text())
    return <ul>{
      ...source
        .split("\n")
        .map(ea => <li click={() => lively.notify("do it: " + ea)}>{ea}</li>)
      }</ul>
  }
}
