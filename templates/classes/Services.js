'use strict';

import Morph from './Morph.js';

const isLocalHost = document.location.hostname.indexOf('localhost') > -1;
const localBaseUrl = 'http://localhost:9007/';
const remoteBaseUrl = 'https://lively-kernel.org/lively4services/';
var servicesURL = isLocalHost ? localBaseUrl : remoteBaseUrl;
var debuggerURL = 'https://lively-kernel.org/lively4servicesDebug/';

var services = {};

export default class Services extends Morph {

  initialize() {
    this.windowTitle = 'Services'
    this.serviceList = this.getSubmorph('.items');
    var that = this;
    $(this.serviceList).on('click', 'lively-services-item', (evt) => {
      that.unselectAll();
      evt.target.getSubmorph('.item').classList.add('selected');
      this.showService(evt.target.getAttribute('data-id'));
    });

    this.serviceTop = this.getSubmorph('.service-top');
    this.entryPoint = this.getSubmorph('#entryPoint');

    this.addButton = this.getSubmorph('#addButton');
    this.addButton.addEventListener('click', (evt) => {
      this.serviceTop.removeAttribute('data-id');
      this.entryPoint.value = 'Enter path...';
      this.logEditor.editor.setValue('');
      this.unselectAll();
    });

    this.removeButton = this.getSubmorph('#removeButton');
    this.removeButton.addEventListener('click', (evt) => {
      this.removeService(this.serviceTop.getAttribute('data-id'));
    });

    this.refreshButton = this.getSubmorph('#refreshButton');
    this.refreshButton.addEventListener('click', (evt) => {
      this.refreshServiceList();
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
      this.startService(this.serviceTop.getAttribute('data-id'));
    });
    this.stopButton = this.getSubmorph('#stopButton');
    this.stopButton.addEventListener('click', (evt) => {
      this.stopService(this.serviceTop.getAttribute('data-id'));
    });
    this.debugButton = this.getSubmorph('#debugButton');
    this.debugButton.addEventListener('click', (evt) => {
      lively.openComponentInWindow('lively-iframe').then(component => {
        component.setURL(debuggerURL + '?port=5858');
      });
    });

    this.logEditor = this.getSubmorph('#log');

    this.refreshServiceList();
    this.refreshInterval = setInterval(function() {
      that.refreshServiceList()
    }, 5000);
    this.logInterval = null;
    
    this.detachedCallback = function() {
      clearInterval(that.refreshInterval);
      clearInterval(that.logInterval);
    };
  }

  unselectAll() {
    var children = this.serviceList.children;
    for (var i = 0; i < children.length; i++) {
      children[i].getSubmorph('.item').classList.remove('selected');
    }
  }

  showService(id) {
    var that = this;
    this.serviceTop.setAttribute('data-id', id);
    this.entryPoint.value = services[id].entryPoint;
    that.refreshLog();
    if (this.logInterval === null) {
      this.logInterval = setInterval(function() {
        that.refreshLog();
      }, 2000);
    }
  }

  startService(id) {
    var that = this;
    var data;
    if (id !== undefined) {
      data = { id: id };
    } else {
      data = { entryPoint: this.entryPoint.value };
    }

    console.log(id)

    // if (pid === null) {
      $.ajax({
        url: servicesURL + 'start',
        type: 'POST',
        data: JSON.stringify(data),
        contentType: 'application/json',
        success: function(res) {
          console.log(res);
          that.refreshServiceList();
        }
      });
    // }else {
    //   //implement resume process
    // }
  }

  stopService(id) {
    var that = this;
    $.ajax({
      url: servicesURL + 'stop',
      type: 'POST',
      data: JSON.stringify({ id: id }),
      contentType: 'application/json',
      success: function(res) {
        console.log(res);
        that.refreshServiceList();
        clearInterval(that.logInterval);
        that.logInterval = null;
      }
    });
  }

  removeService(id) {
    var that = this;
    $.ajax({
      url: servicesURL + 'remove',
      type: 'POST',
      data: JSON.stringify({ id: id }),
      contentType: 'application/json',
      success: function(res) {
        console.log(res);
        that.refreshServiceList();
      }
    });
  }

  refreshServiceList() {
    var that = this;
    $.ajax({
      url: servicesURL + 'list',
      success: function(_services) {
        services = _services;
        // Clear all items
        while (that.serviceList.firstChild) {
          that.serviceList.removeChild(that.serviceList.firstChild);
        }
        // Check if any service running
        if (Object.keys(services).length === 0) {
          console.log('No services running yet!');
          return;
        }
        // List all services
        var now = new Date().getTime();
        for (var id in services) {
          var service = services[id];
          var item = document.createElement('lively-services-item');
          item.setAttribute('data-id', id);
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
          that.serviceList.appendChild(item);
        }
      },
      error: function(jqXHR, textStatus, errorThrown) {
        console.log(errorThrown)
      }
    });
  }
  
  refreshLog() {
    var that = this;
    $.ajax({
      url: servicesURL + 'get',
      type: 'POST',
      data: JSON.stringify({ id: that.serviceTop.getAttribute('data-id') }),
      contentType: 'application/json',
      success: function(res) {
        var editor = that.logEditor.editor;
        editor.setValue(res.log);
        editor.gotoPageDown();
      }
    });
  }
}
