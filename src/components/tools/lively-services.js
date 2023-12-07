import Morph from 'src/components/widgets/lively-morph.js';
import { pt } from 'src/client/graphics.js';

const mountURL = 'https://lively4/sys/fs/mount';
const mountEndpoint = '/services';
const isLocalHost = document.location.hostname.indexOf('localhost') > -1;
const localBaseURL = 'http://localhost:9007/';
const remoteBaseURL = 'https://lively-kernel.org/lively4services';
const servicesRootURL = remoteBaseURL + "/mount/"

// 'https://lively-kernel.org/lively4/lively4-services/services';

var servicesURL = isLocalHost ? localBaseURL : (remoteBaseURL + "/");


export default class Services extends Morph {

  initialize() {
    this.windowTitle = 'Services';
    this.pid = null;
    this.logType = 'stdout';
    this.services = {};

    this.serviceTop = this.getSubmorph('#service-top');
    this.entryPoint = this.getSubmorph('#entryPoint');

    this.serviceList = this.getSubmorph('.items');
    this.serviceList.addEventListener('click', evt => {
      // 'lively-services-item',  
      this.itemClick(evt)
    });
    
    this.addButton = this.getSubmorph('#addButton');
    this.addButton.addEventListener('click', this.addButtonClick.bind(this));
    this.removeButton = this.getSubmorph('#removeButton');
    this.removeButton.addEventListener('click', this.removeButtonClick.bind(this));
    this.editButton = this.getSubmorph('#editButton');
    this.editButton.addEventListener('click', this.editButtonClick.bind(this));
    this.cloneButton = this.getSubmorph('#cloneButton');
    this.cloneButton.addEventListener('click', this.cloneButtonClick.bind(this));
    this.settingsButton = this.getSubmorph('#settingsButton');
    this.settingsButton.addEventListener('click', this.settingsButtonClick.bind(this));
    this.startButton = this.getSubmorph('#startButton');
    this.startButton.addEventListener('click', this.startButtonClick.bind(this));
    this.stopButton = this.getSubmorph('#stopButton');
    this.stopButton.addEventListener('click', this.stopButtonClick.bind(this));
    this.debugButton = this.getSubmorph('#debugButton');
    this.debugButton.addEventListener('click', this.debugButtonClick.bind(this));
    this.stdoutButton = this.getSubmorph('#stdoutButton');
    this.stderrButton = this.getSubmorph('#stderrButton');
    this.stdoutButton.addEventListener('click', this.stdoutButtonClick.bind(this));
    this.stderrButton.addEventListener('click', this.stderrButtonClick.bind(this));

    this.logEditor = this.getSubmorph('#log');
    if (this.logEditor) { // editor is not initialized during testing
      // this.logEditor.setReadOnly(true);
    }

    this.refreshServiceList();
    this.refreshInterval = window.setInterval(() => {
      this.refreshServiceList();
    }, 5000);
    this.logInterval = null;

    this.disconnectedCallback = this.unload;
    // if (!this.isInTesting) this.ensureRemoteServicesMounted(); // will block with confirmation
  }

  unload() {
    window.clearInterval(this.refreshInterval);
    window.clearInterval(this.logInterval);
  }

  /*
   * Event handlers
   */
  itemClick(evt) {
    this.unselectAll();
    var item = evt.composedPath().find(ea => ea.localName == 'lively-services-item')
    item.getSubmorph('.item').classList.add('selected');
    this.pid = evt.target.getAttribute('data-id');
    this.showService();
  }

  addButtonClick(evt) {
    lively.openComponentInWindow('lively-file-browser').then(browser => {
      browser.path = servicesURL + 'mount/';
      lively.setClientPosition(browser.parentElement, lively.getClientPosition(this.parentElement).addPt(pt(30,
        30)))
      browser.setMainAction((url) => {
        const relativePath = url.toString().replace(servicesURL + 'mount' + '/', '');

        this.serviceTop.removeAttribute('data-id');
        this.entryPoint.value = relativePath;
        this.entryPoint.focus();
        this.logEditor.value = '';
        this.unselectAll();

        this.startButtonClick(relativePath);
        browser.parentElement.onCloseButtonClicked();
      });
    });
  }

  removeButtonClick() {
    if (this.pid === null) {
      console.log('Nothing to remove');
      return;
    }
    this.post('remove', { id: this.pid }, (res) => {
      this.pid = null;
      console.log(res);
      this.refreshServiceList();
    });
  }

  editButtonClick() {
    lively.openBrowser(servicesURL + 'mount/');
  }

  cloneButtonClick() {
    lively.openComponentInWindow("lively-sync").then(comp => {
      comp.serverURL = servicesURL + 'mount/'
    });
    // var gitURL = window.prompt('Please enter a GitHub link to clone:');
    // if (gitURL === null) return;
    // this.post('clone', { url: gitURL });
  }

  settingsButtonClick() {
    var userInput;
    userInput = window.prompt('Please enter a URL to a lively4-services instance:', servicesURL);
    if (userInput === null) return;
    servicesURL = userInput;
    this.mountRemoteServices();
  }

  startButtonClick(entryPoint) {
    var data;
    if (this.pid !== null) {
      data = { id: this.pid };
    } else {
      data = { entryPoint: entryPoint || this.entryPoint.value };
    }
    this.post('start', data, (res) => {
      console.log(res);
      this.pid = res.pid;
      this.refreshServiceList().then(() => this.showService());
    });
  }

  stopButtonClick(evt) {
    this.post('stop', { id: this.pid }, (res) => {
      console.log(res);
      this.refreshServiceList();
      window.clearInterval(this.logInterval);
      this.logInterval = null;
    });
  }

  debugButtonClick(evt) {
    lively.openComponentInWindow('lively-iframe').then(component => {
      if (!(this.pid in this.services)) {
        console.log('Nothing to debug');
        return;
      }
      var debuggerPort = this.services[this.pid].debugPort;
      component.setURL(servicesURL + 'debug/?port=' + debuggerPort);
    });
  }

  stdoutButtonClick(evt) {
    this.stdoutButton.classList.add('active');
    this.stderrButton.classList.remove('active');
    this.logType = 'stdout';
    this.refreshLog();
  }

  stderrButtonClick(evt) {
    this.stderrButton.classList.add('active');
    this.stdoutButton.classList.remove('active');
    this.logType = 'stderr';
    this.refreshLog();
  }

  /*
   * Helper functions
   */
  post(endpoint, data, success) {
    fetch(servicesURL + endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        "content-type": "application/json"
      }
    }).then(async (resp) => {
      if (resp.status == 200) {
        var respData = await resp.json()
        console.log("services data " + respData);
        if (success) {
          success(respData);
        }
      } else {
        this.handleAjaxError(resp)
      }
    })
  }

  handleAjaxError(jqXHR, textStatus, errorThrown) {
    console.log(errorThrown);
    this.removeAllItems();
    this.showMessageInServiceList('Cannot connect to server.');
  }

  unselectAll() {
    var children = this.serviceList.children;
    for (var i = 0; i < children.length - 1; i++) {
      children[i].getSubmorph('.item').classList.remove('selected');
    }
    this.pid = null;
  }

  removeAllItems() {
    var selectedPID = null;
    while (this.serviceList.firstChild) {
      var item = this.serviceList.firstChild;
      if (selectedPID === null && !item.classList.contains('empty') &&
        item.getSubmorph('.item').classList.contains('selected')) {
        selectedPID = item.getAttribute('data-id');
      }
      this.serviceList.removeChild(this.serviceList.firstChild);
    }
    return selectedPID;
  }

  showService() {
    this.entryPoint.value = this.services[this.pid].entryPoint;
    this.refreshLog();
    if (this.logInterval === null) {
      this.logInterval = window.setInterval(() => {
        this.refreshLog();
      }, 2000);
    }
  }

  async listServices(services) {
    this.services = services;
    var item;
    var selectedPID = this.removeAllItems();
    // Check if any service running
    if (Object.keys(services).length === 0) {
      this.showMessageInServiceList('No services available yet.');
      return;
    }
    // List all services
    var now = new Date().getTime();
    for (var id in services) {
      var service = services[id];
      item = await lively.create('lively-services-item');
      item.setAttribute('data-id', id);
      if (id == selectedPID) {
        item.getSubmorph('.item').classList.add('selected');
      }
      var title = service.entryPoint + ' (#' + id + ')';
      item.getSubmorph('h1').innerHTML = title;

      var status = 'unkown';
      var statusText = 'unkown';
      if (service.status === 0) {
        status = 'not-running';
        var since = (now - service.kill);
        statusText = 'not running (' + this.msToString(since) + ')';
      } else if (service.status === 1) {
        status = 'running';
        var uptime = (now - service.start);
        statusText = 'running (' + this.msToString(uptime) + ')';
      }

      item.getSubmorph('.status').classList.add(status);
      item.getSubmorph('small').innerHTML = statusText;
      this.serviceList.appendChild(item);
    }
  }

  showMessageInServiceList(msg) {
    var item = document.createElement('div');
    item.classList.add('empty');
    item.innerHTML = msg;
    this.serviceList.appendChild(item);
  }

  msToString(milliseconds) {
    var ending = (number) => { return (number > 1) ? 's' : ''; };
    var seconds = Math.floor(milliseconds / 1000);
    var years = Math.floor(seconds / 31536000);
    if (years) { return years + ' year' + ending(years); }
    var days = Math.floor((seconds %= 31536000) / 86400);
    if (days) { return days + ' day' + ending(days); }
    var hours = Math.floor((seconds %= 86400) / 3600);
    if (hours) { return hours + ' hour' + ending(hours); }
    var minutes = Math.floor((seconds %= 3600) / 60);
    if (minutes) { return minutes + ' minute' + ending(minutes); }
    seconds = seconds % 60;
    if (seconds) { return seconds + ' second' + ending(seconds); }
    return 'just now';
  }

  ensureRemoteServicesMounted() {
    fetch("https://lively4/sys/mounts").then(r => r.json()).then((mounts) => {
      var mounted = false;
      mounts.forEach(ea => {
        if (ea.path === mountEndpoint) {
          mounted = true;
        }
      });
      if (!mounted) {
        this.settingsButtonClick();
      }
    });
  }

  mountRemoteServices() {
    var mount = {
      'path': mountEndpoint,
      'name': 'http',
      'options': {
        'base': servicesURL + 'mount/'
      }
    };

    fetch(mountURL, {
      method: 'PUT',
      body: JSON.stringify(mount)
    }).then(resp => {
      if (resp.status == 200) {
        console.log('Mounted ' + mountEndpoint);
      } else {
        console.log('Could not mount ' + mountEndpoint + ' ' + resp);
      }
    })
  }

  /*
   * Refresh functions
   */
  refreshServiceList() {
    return fetch(servicesURL + 'list').then(async resp => {
      if (resp.status == 200) {
        this.listServices(await resp.json())
      } else {
        this.handleAjaxError(resp)
      }
    });
  }

  refreshLog() {
    if (this.pid === null) {
      this.logEditor.value = '';
      this.entryPoint.value = '';
      return;
    }
    this.post('get', { id: this.pid }, (res) => {
      this.logEditor.value = res[this.logType];
      // this.logEditor.gotoPageDown();
    });
  }
}
