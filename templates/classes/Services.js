import Morph from './Morph.js';

const isLocalHost = document.location.hostname.indexOf('localhost') > -1;
const localBaseURL = 'http://localhost:9007/';
const remoteBaseURL = 'https://lively-kernel.org/lively4services/';
var servicesURL = isLocalHost ? localBaseURL : remoteBaseURL;
const localDebugURL = 'http://localhost:9008/';
const remoteDebugURL = 'https://lively-kernel.org/lively4servicesDebug/';
var debuggerURL = isLocalHost ? localDebugURL : remoteDebugURL;

export default class Services extends Morph {

  initialize() {
    this.windowTitle = 'Services';
    this.pid = null;
    this.logType = 'stdout';
    this.services = {};

    this.serviceTop = this.getSubmorph('#service-top');
    this.entryPoint = this.getSubmorph('#entryPoint');

    this.serviceList = this.getSubmorph('.items');
    $(this.serviceList).on('click', 'lively-services-item', this.itemClick.bind(this));

    this.addButton = this.getSubmorph('#addButton');
    this.addButton.addEventListener('click', this.addButtonClick.bind(this));
    this.removeButton = this.getSubmorph('#removeButton');
    this.removeButton.addEventListener('click', this.removeButtonClick.bind(this));
    this.editButton = this.getSubmorph('#editButton');
    this.editButton.addEventListener('click', this.editButtonClick.bind(this));
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

    this.logEditor = this.getSubmorph('#log').editor;
    this.logEditor.setReadOnly(true);

    this.refreshServiceList();
    this.refreshInterval = window.setInterval(() => {
      this.refreshServiceList();
    }, 5000);
    this.logInterval = null;

    this.detachedCallback = () => {
      window.clearInterval(this.refreshInterval);
      window.clearInterval(this.logInterval);
    };
  }

  /*
  * Event handlers
  */
  itemClick(evt) {
    this.unselectAll();
    evt.target.getSubmorph('.item').classList.add('selected');
    this.pid = evt.target.getAttribute('data-id');
    this.showService();
  }

  addButtonClick(evt) {
    this.serviceTop.removeAttribute('data-id');
    this.entryPoint.value = '';
    this.entryPoint.focus();
    this.logEditor.setValue('');
    this.unselectAll();
  }

  removeButtonClick() {
    if (this.pid === null) {
      console.log('Nothing to remove');
      return;
    }
    this.post('remove', { id: this.pid }, function(res) {
      console.log(res);
      this.refreshServiceList();
    }.bind(this));
  }

  editButtonClick() {
    lively.openBrowser(servicesURL + 'lively/');
  }

  settingsButtonClick() {
    var userInput;
    userInput = window.prompt('Please enter service endpoint', servicesURL);
    if (userInput !== null) {
      servicesURL = userInput;
    }
    userInput = window.prompt('Please enter debugger endpoint', debuggerURL);
    if (userInput !== null) {
      debuggerURL = userInput;
    }
  }

  startButtonClick() {
    var data;
    if (this.pid !== null) {
      data = { id: this.pid };
    } else {
      data = { entryPoint: this.entryPoint.value };
    }
    this.post('start', data, function(res) {
      console.log(res);
      this.refreshServiceList();
      this.showService();
    }.bind(this));
  }

  stopButtonClick(evt) {
    this.post('stop', { id: this.pid }, function(res) {
      console.log(res);
      this.refreshServiceList();
      window.clearInterval(this.logInterval);
      this.logInterval = null;
    }.bind(this));
  }

  debugButtonClick(evt) {
    lively.openComponentInWindow('lively-iframe').then(component => {
      if (!(this.pid in this.services)) {
        console.log('Nothing to debug');
        return;
      }
      var debuggerPort = this.services[this.pid].debugPort;
      component.setURL(debuggerURL + '?port=' + debuggerPort);
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
  post(endpoint, data, success, error) {
    $.ajax({
      url: servicesURL + endpoint,
      type: 'POST',
      data: JSON.stringify(data),
      contentType: 'application/json',
      success: success,
      error: this.handleAjaxError.bind(this)
    });
  }

  handleAjaxError(jqXHR, textStatus, errorThrown) {
    console.log(errorThrown);
    this.removeAllItems();
    this.showMessageInServiceList("Cannot connect to server.");
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
      item = this.serviceList.firstChild;
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
      this.logInterval = window.setInterval(function() {
        this.refreshLog();
      }.bind(this), 2000);
    }
  }

  showMessageInServiceList(msg) {
    var item = document.createElement('div');
    item.classList.add('empty');
    item.innerHTML = msg;
    this.serviceList.appendChild(item);
  }

  msToString(milliseconds) {
    function ending(number) { return (number > 1) ? 's' : ''; }
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

  /*
  * Refresh functions
  */
  refreshServiceList() {
    $.ajax({
      url: servicesURL + 'list',
      success: function(services) {
        this.services = services;
        var item;
        var selectedPID = this.removeAllItems();
        // Check if any service running
        if (Object.keys(services).length === 0) {
          this.showMessageInServiceList("No services available yet.");
          return;
        }
        // List all services
        var now = new Date().getTime();
        for (var id in services) {
          var service = services[id];
          item = document.createElement('lively-services-item');
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
      }.bind(this),
      error: this.handleAjaxError.bind(this)
    });
  }

  refreshLog() {
    this.post('get', { id: this.pid }, function(res) {
      this.logEditor.setValue(res[this.logType]);
      this.logEditor.gotoPageDown();
    }.bind(this));
  }
}
