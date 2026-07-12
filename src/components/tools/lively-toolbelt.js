"enable aexpr"
import ContextMenu from 'src/client/contextmenu.js'
import Strings from "src/client/strings.js"

import Morph from 'src/components/widgets/lively-morph.js'

/*
document.body.append(await <lively-toolbelt></lively-toolbelt>)
*/
export default class LivelyToolbelt extends Morph {
  async initialize() {
    this.windowTitle = "LivelyToolbelt"

    this.classList.add('lively-content')
    this.registerButtons()

    // Measure the content (#inner), NOT #container: when hovered/pinned #container's
    // height is calc(var(--h) + var(--padding)), and scrollHeight is always >= that, so
    // measuring #container feeds --h back into itself and grows the toolbelt by --padding
    // on every re-measure (e.g. each server change while pinned). #inner sizes to its
    // content and is independent of the container's animated height.
    const inner = this.get('#inner')
    const ro = new ResizeObserver(() => {
      const w = inner.scrollWidth
      const h = inner.scrollHeight
      this.style.setProperty('--w', `${Math.ceil(w)}px`)
      this.style.setProperty('--h', `${Math.ceil(h)}px`)
    })
    ro.observe(inner)

    // Enter the initial mode on startup / page reload so the matching callback fires.
    if (this.mode === 'creation') this.enterInteractiveCreationMode()
    else this.enterNormalMode()
  }

  /*MD ## Menu Entries MD*/
  onDataLoader(evt) {
    lively.openComponentInWindow('pdp-data-loader', undefined, lively.pt(1100, 926))
  }
  onViewer(evt) {
    lively.openComponentInWindow('ivu2-webgpu-viewer', undefined, lively.pt(1100, 800))
  }
  async onMoreViewers(e) {
    function groupAbcNumberedFiles(files) {
      // ABC + (digits) + (rest of filename, must exist)
      const re = /^ivu(\d+)(.+)$/

      const groups = new Map(); // digits -> [full filenames]

      for (const name of files) {
        const m = re.exec(name)
        if (!m) continue

        const digits = m[1];      // capture group: the digits after ABC
        // m[2] is the rest, but we keep the FULL filename as requested

        const list = groups.get(digits)
        if (list) list.push(name)
        else groups.set(digits, [name])
      }

      // Convert to array of [digits, filenames]
      return Array.from(groups, ([digits, names]) => [digits, names])
    }

    function faIconForFileName(name) {
      return ([
        ['HTML', 'fa fa-html5'],
        ['Canvas2D', 'fa fa-th'],
        ['WebGPU', 'fa fa-image'],
      ].find(([key]) => name.toLowerCase().includes(key.toLowerCase())) || ['HTML', 'fa fa-code'])[1]
    }
    const files = await this.getSortedComponentFiles()
    const jsFiles = files.filter(file => file.endsWith('.js'))
    const menu = new ContextMenu(this, [
      ...groupAbcNumberedFiles(jsFiles).flatMap(([version, names]) => {
        return [`--- version ${version} ---`, ...names.map(name => {
          const displayName = name
          .replace(/\.js$/, "")
          .split('-').slice(1).map(part => Strings.toUpperCaseFirst(part
                                                                    .replace('html', 'HTML')
                                                                    .replace('webgpu', 'WebGPU')
                                                                    .replace('canvas2d', 'Canvas2D')
                                                                   )).join(' ')

          return [displayName, async () => {
            menuElement?.remove?.()
            await lively.openComponentInWindow(name.replace(/\.js$/, ""), undefined, lively.pt(1400, 800))
          }, 'v' + version, <i class={faIconForFileName(displayName)}></i>]})]
      })
    ])
    var menuElement = await menu.openIn(document.body, e, this)
  }

  // #Perf------------
  async onPerformancePanel(evt) {
    if (!document.body.querySelector('ivu-performance-panel')) {
      lively.notify('add panel')
      document.body.append(await lively.create('ivu-performance-panel'))
    } else {
      lively.notify('remove panel')
      document.body.querySelector('ivu-performance-panel').remove()
    }
  }
  onPerformanceLoadTester(evt) {
    lively.openComponentInWindow('pdp-notification-receiver', undefined, lively.pt(720, 380))
  }
  async onMorePerformance(e) {
    const menu = new ContextMenu(this, [
      ["Notification Events Receiver (core.events, XML)", async () => {
        menuElement?.remove?.()
        await lively.openComponentInWindow('pdp-notification-receiver', undefined, lively.pt(640, 600))
      }, '', <i class='fa fa-list'></i>],
      ["Notification Events Receiver (WebSocket, JSON)", async () => {
        menuElement?.remove?.()
        await lively.openComponentInWindow('ws-json-pdp-notification-receiver', undefined, lively.pt(640, 600))
      }, '', <i class='fa fa-list'></i>],
      ["Batch Data Fetcher", async () => {
        menuElement?.remove?.()
        await lively.openComponentInWindow('sram-data-fetcher', undefined, lively.pt(640, 360))
      }, '', <i class='fa fa-list-alt'></i>],
      ["Client-side Load Tester for PDP Notifications", async () => {
        menuElement?.remove?.()
        await lively.openComponentInWindow('pdp-event-performance-load-tester', undefined, lively.pt(720, 380))
      }, '[DEPRECATED]', <i class='fa fa-tasks'></i>],
      ["Performance Load Test for PDP Notifications", async () => {
        menuElement?.remove?.()
        await lively.openComponentInWindow('pdp-event-performance-load-tester-2', undefined, lively.pt(720, 380))
      }, '', <i class='fa fa-tasks'></i>],
    ])
    var menuElement = await menu.openIn(document.body, e, this)
  }

  onOwnCode(evt) {
    this.openOrFocusPath(this.ownFolder + 'lively-toolbelt.js', true, true)
  }

  onPin(evt) {
    this.classList.toggle('pinned')
  }

  /*MD ## Modes MD*/
  // 'normal' (document icon) is the default; 'creation' (pencil icon) is active
  // while the host carries the .interactive-creation class, which this component toggles.
  get mode() {
    return this.classList.contains('interactive-creation') ? 'creation' : 'normal'
  }

  onNormalMode(evt) {
    this.toggleMode('normal')
  }

  onCreationMode(evt) {
    this.toggleMode('creation')
  }

  // Clicking the already-active mode switches back to normal mode.
  toggleMode(mode) {
    this.enterMode(this.mode === mode ? 'normal' : mode)
  }

  enterMode(mode) {
    if (mode === this.mode) return

    if (this.mode === 'normal') this.exitNormalMode()
    else this.exitInteractiveCreationMode()

    this.classList.toggle('interactive-creation', mode === 'creation')

    if (mode === 'normal') this.enterNormalMode()
    else this.enterInteractiveCreationMode()
  }

  enterNormalMode() {
    lively.notify('Entered normal mode')
  }

  exitNormalMode() {
    lively.notify('Exited normal mode')
  }

  enterInteractiveCreationMode() {
    lively.notify('Entered interactive creation mode')
  }

  exitInteractiveCreationMode() {
    lively.notify('Exited interactive creation mode')
  }

  async onMoreCode(e) {
    function removeWhere(arr, predicate) {
      const removed = []

      for (let i = arr.length - 1; i >= 0; i--) {
        if (predicate(arr[i], i, arr)) {
          removed.push(arr[i])
          arr.splice(i, 1)
        }
      }

      return removed.reverse(); // optional: preserve original order
    }

    function extract(category, ...conditions) {
      return [`--- ${category} ---`, ...conditions.flatMap(condition => removeWhere(files, condition))]
    }
    function anyOf(...names) {
      return name => names.some(n => n === name)
    }
    function startsWith(prefix) {
      return name => name.startsWith(prefix)
    }

    const files = await this.getSortedComponentFiles()
    const fileList = [
      ...extract('loading', anyOf('load-data.js', 'sql.js'), startsWith('pdp-data-loader')),
      ...extract('renderer', name => /^ivu\d+/.test(name)),
      ...extract('offscreen', anyOf('worker-offscreen-canvas2d.js')),
      ...extract('events', anyOf('event-receiver.js'), startsWith('pdp-notification-receiver')),
      ...extract('web sockets', anyOf('event-receiver.js'), startsWith('ws-json-')),
      ...extract('load testing', startsWith('pdp-event-performance-load-tester-2'), startsWith('sram-data-fetcher')),
      ...extract('debug', startsWith('ivu-performance-panel'), anyOf('debug.js', 'menu.js', 'option.js', 'panel.js', 'performance.js')),
      ...extract('misc', startsWith('ivu-inline-stats'), anyOf('index-style.css', 'utils.js')),
    ]

    const toEntry = fileName => {
      if (fileName.startsWith('---')) {
        return fileName
      }

      return [fileName, async () => {
        menuElement?.remove?.()
        this.openOrFocusPath(this.fullComponentPath(fileName), true, true)
      }, '', <i class={'fa ' + (fileName.endsWith('.html') ? 'fa-html5' : fileName.endsWith('.css') ? 'fa-css3' : fileName.endsWith('.js') ? 'fa-file-code-o' : 'fa-question')}></i>]
    }
    const descriptionList = fileList.map(toEntry)
    const menu = new ContextMenu(this, [...descriptionList, ['others', files.map(toEntry)]])
    var menuElement = await menu.openIn(document.body, e, this)
  }

  async allCode() {
    const folderPath = this.componentFolder
    lively.files.statFile(folderPath)
    _.sort(await lively.files.walkDir(folderPath))
  }

  /*MD ## Helpers MD*/
  async getSortedComponentFiles() {
    const files = (await lively.files.stats(this.componentFolder)).contents.map(stat => stat.name)
    files.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
    return files
  }

  // the project whose components this toolbelt browses
  get componentFolder() {
    return lively4url + '/../tim/components/'
  }

  get ownFolder() {
    return lively4url + '/src/components/tools/'
  }

  fullComponentPath(fileName) {
    return this.componentFolder + fileName
  }

  async openOrFocusPath(path, edit, skipNavbar) {
    path = SystemJS.normalizeSync(path)
    const existingContainer = Array.from(document.body.querySelectorAll('lively-container'))
    .find(container => container.getPath().match(path))
    if(existingContainer) {
      lively.gotoWindow(existingContainer.parentElement, true)
      existingContainer.focus()
    } else {
      lively.openBrowser(path, edit).then(browser => {
        browser.focus()
        if (!skipNavbar) {
          browser.toggleNavbar()
        }
      })
    }
  }

  /*MD ## Lively-specific API MD*/

  // store something that would be lost
  livelyPrepareSave() {
  }

  livelyPreMigrate() {
    // is called on the old object before the migration
  }

  livelyMigrate(other) {
  }

  /*
  livelyInspect(contentNode, inspector) {
  // overrides how the inspector displays this component
  }
  */

  async livelyExample() {
  }


}
