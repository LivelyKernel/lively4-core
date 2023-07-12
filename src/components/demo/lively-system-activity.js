

/* globals globalThis*/
import Morph from 'src/components/widgets/lively-morph.js';
import d3 from 'src/external/d3.v5.js'
const colorScale = d3.scaleLog().clamp(true)
    .domain([1, 1000])
.range(["green", "red"])

const PIXEL_SIZE = {
  x: 5,
  y: 1
};
export default class SystemActivity extends Morph {
  async initialize() {
    this.windowTitle = "System Activity";
    this.startLoop();
    // this.registerButtons();
    this.canvas.addEventListener('pointermove', evt => this.onMouseMove(evt));
    this.canvas.addEventListener('click', evt => this.onClick(evt));
  }
  startLoop() {
    const callUpdate = () => {
      // lively.notify('loop')
      if (!document.contains(this)) {
        // #TODO: remove highlight
        return;
      }
      this.update();
      requestAnimationFrame(callUpdate);
    };
    requestAnimationFrame(callUpdate);
  }
  onMouseMove(evt) {
    const filename = this.get('#filename');
    const nameIndex = (evt.offsetX / PIXEL_SIZE.x).floor();
    const newFilename = Object.keys(globalThis.systemActivity)[nameIndex];
    if (filename.innerHTML !== newFilename) {
      filename.innerHTML = newFilename
    }
  }

   onClick(evt) {
    const nameIndex = (evt.offsetX / PIXEL_SIZE.x).floor();
    const newFilename = Object.keys(globalThis.systemActivity)[nameIndex];
    lively.openBrowser(newFilename, true)
  }
  /*MD ## Accessors MD*/
  get canvas() {
    return this._canvas = this._canvas || this.get('#trail');
  }
  get ctx() {
    return this._ctx = this.canvas.getContext('2d');
  }

  /*MD ## Update MD*/
  update() {
    // lively.notify('update')
    const {
      canvas,
      ctx
    } = this;
    const activityEntries = Object.entries(globalThis.systemActivity);
    const widthNeeded = activityEntries.length * PIXEL_SIZE.x;
    if (canvas.width === widthNeeded) {
      // ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.drawImage(this.canvas, 0, PIXEL_SIZE.y);
    } else {
      canvas.width = widthNeeded;
      canvas.style.width = widthNeeded + 'px';
    }
    activityEntries.forEach(([filename, count], index) => {
      globalThis.systemActivity[filename] = 0;
      ctx.fillStyle = count > 0 ? colorScale(count) : `rgba(0, 0, 0, 1)`;
      ctx.fillRect(index * PIXEL_SIZE.x, 0, PIXEL_SIZE.x, PIXEL_SIZE.y);
    });
  }

  /*MD ## Lively-specific API MD*/
  livelyMigrate(other) {
    const oldCanvas = other.canvas;
    const canvas = this.canvas;
    canvas.width = oldCanvas.width;
    canvas.height = oldCanvas.height;
    canvas.style.width = oldCanvas.style.width;
    canvas.style.height = oldCanvas.style.height;
    this.ctx.drawImage(oldCanvas, 0, 0);
  }
  livelyInspect(contentNode, inspector) {}
  livelyExample() {}
}