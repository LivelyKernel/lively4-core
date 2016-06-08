'use strict';

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

    this.serviceList = this.getSubmorph('.items');
    $(this.serviceList).on('click', 'lively-services-item', (evt) => {
      this.unselectAll();
      evt.target.getSubmorph('.item').classList.add('selected');
      this.pid = evt.target.getAttribute('data-id');
      this.showService();
    });

    this.serviceTop = this.getSubmorph('#service-top');
    this.entryPoint = this.getSubmorph('#entryPoint');

    this.addButton = this.getSubmorph('#addButton');
    this.addButton.addEventListener('click', (evt) => {
      this.serviceTop.removeAttribute('data-id');
      this.entryPoint.value = '';
      this.entryPoint.focus();
      this.logEditor.setValue('');
      this.unselectAll();
    });

    this.removeButton = this.getSubmorph('#removeButton');
    this.removeButton.addEventListener('click', (evt) => {
      this.removeService();
    });

    this.editButton = this.getSubmorph('#editButton');
    this.editButton.addEventListener('click', (evt) => {
      lively.openBrowser(servicesURL + 'lively/');
    });

    this.settingsButton = this.getSubmorph('#settingsButton');
    this.settingsButton.addEventListener('click', (evt) => {
      var userInput;
      userInput = window.prompt('Please enter service endpoint', servicesURL);
      if (userInput !== null) {
        servicesURL = userInput;
      }
      userInput = window.prompt('Please enter debugger endpoint', debuggerURL);
      if (userInput !== null) {
        debuggerURL = userInput;
      }
    });
    this.startButton = this.getSubmorph('#startButton');
    this.startButton.addEventListener('click', (evt) => {
      this.startService();
    });
    this.stopButton = this.getSubmorph('#stopButton');
    this.stopButton.addEventListener('click', (evt) => {
      this.stopService();
    });
    this.debugButton = this.getSubmorph('#debugButton');
    this.debugButton.addEventListener('click', (evt) => {
      lively.openComponentInWindow('lively-iframe').then(component => {
        var debuggerPort = this.services[this.pid].debugPort;
        component.setURL(debuggerURL + '?port=' + debuggerPort);
      });
    });

    this.stdoutButton = this.getSubmorph('#stdoutButton');
    this.stderrButton = this.getSubmorph('#stderrButton');
    this.stdoutButton.addEventListener('click', (evt) => {
      this.stdoutButton.classList.add('active');
      this.stderrButton.classList.remove('active');
      this.logType = 'stdout';
      this.refreshLog();
    });
    this.stderrButton.addEventListener('click', (evt) => {
      this.stderrButton.classList.add('active');
      this.stdoutButton.classList.remove('active');
      this.logType = 'stderr';
      this.refreshLog();
    });

    this.logEditor = this.getSubmorph('#log').editor;
    this.logEditor.setReadOnly(true);

    this.refreshServiceList();
    this.refreshInterval = setInterval(() => {
      this.refreshServiceList();
    }, 5000);
    this.logInterval = null;

    this.detachedCallback = () => {
      clearInterval(this.refreshInterval);
      clearInterval(this.logInterval);
    };
  }

  unselectAll() {
    var children = this.serviceList.children;
    for (var i = 0; i < children.length - 1; i++) {
      children[i].getSubmorph('.item').classList.remove('selected');
    }
  }

  post(endpoint, data, success, error) {
    $.ajax({
      url: servicesURL + endpoint,
      type: 'POST',
      data: JSON.stringify(data),
      contentType: 'application/json',
      success: success,
      error: error || function(jqXHR, textStatus, errorThrown) {
        console.log(errorThrown);
      }
    });
  }

  showService() {
    this.entryPoint.value = this.services[this.pid].entryPoint;
    this.refreshLog();
    if (this.logInterval === null) {
      this.logInterval = setInterval(function() {
        this.refreshLog();
      }.bind(this), 2000);
    }
  }

  startService() {
    var data;
    if (this.pid !== null) {
      data = { id: this.pid };
    } else {
      data = { entryPoint: this.entryPoint.value };
    }
    this.post('start', data, function(res) {
      console.log(res);
      this.refreshServiceList();
    }.bind(this));
  }

  stopService() {
    this.post('stop', { id: this.pid }, function(res) {
      console.log(res);
      this.refreshServiceList();
      clearInterval(this.logInterval);
      this.logInterval = null;
    }.bind(this));
  }

  removeService() {
    this.post('remove', { id: this.pid }, function(res) {
      console.log(res);
      this.refreshServiceList();
    }.bind(this));
  }

  refreshServiceList() {
    $.ajax({
      url: servicesURL + 'list',
      success: function(services) {
        this.services = services;
        var item;
        var selectedPID = null;
        // Clear all items
        while (this.serviceList.firstChild) {
          item = this.serviceList.firstChild;
          if (selectedPID === null && !item.classList.contains('empty') &&
              item.getSubmorph('.item').classList.contains('selected')) {
            selectedPID = item.getAttribute('data-id');
          }
          this.serviceList.removeChild(this.serviceList.firstChild);
        }
        // Check if any service running
        if (Object.keys(services).length === 0) {
          item = document.createElement('div');
          item.classList.add('empty');
          item.innerHTML = "No services available yet.";
          this.serviceList.appendChild(item);
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
            var since = (now - service.kill)/1000;
            statusText = 'not running since ' + since + 's';
          } else if (service.status === 1) {
            status = 'running';
            var uptime = (now - service.start)/1000;
            statusText = 'running (' + uptime + 's)';
          }

          item.getSubmorph('.status').classList.add(status);
          item.getSubmorph('small').innerHTML = statusText;
          this.serviceList.appendChild(item);
        }
      }.bind(this),
      error: function(jqXHR, textStatus, errorThrown) {
        console.log(errorThrown);
      }
    });
  }

  refreshLog() {
    this.post('get', { id: this.pid }, function(res) {
      this.logEditor.setValue(res.log);
      this.logEditor.gotoPageDown();
    }.bind(this));
  }
}
