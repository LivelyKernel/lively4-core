'use strict'

import Morph from './Morph.js';

export default class TabView extends Morph {
  /*
   * HTMLElement callbacks
   */
  attachedCallback() {
    this.tabBar = this.shadowRoot.querySelector('#tab-bar');

    this.tabList = [];
    this.initObserver();

    this.renderTabBar();
    this.hideAllContents();
    this.showDefaultContent();
  }

  detachedCallback() {
    if (this.contentObserver) {
      this.contentObserver.disconnect();
    }
  }

  attributeChangedCallback(attrName, oldValue, newValue) {

  }

  initObserver() {
    this.contentObserver = new MutationObserver((record) => this.observerCallback(record));

    //observe for added/removed tab elements
    this.contentObserver.observe(this, {
      childList: true
    });

    //observe each tab element for title changes
    for(let i = 0; i < this.children.length; i++) {
      let child = this.children[i];

      this.contentObserver.observe(child, {
        attributes: true,
        attributeFilter: ['title']
      });
    }
  }

  reInitObserver() {
    this.contentObserver.disconnect();
    this.initObserver();
  }

  observerCallback(mutationRecord) {
    this.renderTabBar();
    this.hideAllContents();
    this.showDefaultContent();

    this.reInitObserver();
  }

  renderTabBar() {
    let contentViews = this.children;
    this.tabList = [];

    if(this.tabBar.hasChildNodes()) {
      let bars = this.tabBar.querySelectorAll('*');

      for(let i = 0; i < bars.length; i++) {
        let bar = bars[i];
        bar.remove();
      }
    }

    for(let i = 0; i < contentViews.length; i++) {
      this.renderContentViewIntoTab(contentViews[i], i);
    }
  }

  renderContentViewIntoTab(view, id) {
    let title = "";

    if(view.hasAttribute('title')) {
      title = view.getAttribute('title');
    } else {
      title = "TAB[" + id + "]";
    }

    this.tabList[id] = {
      title: title,
      view: view,
      id: view.id
    };

    let barTitle = document.createElement('span');
    let tab = document.createElement('li');
    barTitle.innerHTML = title;
    barTitle.addEventListener('click', (e) => {
      this.showContent(id);

      let changeEvent = new CustomEvent("tabChange", {
        detail: {
          title: title,
          id: view.id
        }
      });
      this.dispatchEvent(changeEvent);
    });
    tab.appendChild(barTitle);
    this.tabBar.appendChild(tab);
  }

  showContentFromTabList(i) {
    let tab = this.tabList[i];
    if(typeof tab === 'undefined') {
      return false;
    }

    for (let n = 0; n < this.tabBar.children.length; n++) {
      if (n === i) {
        this.tabBar.children[n].classList.add('active');
      } else {
        this.tabBar.children[n].classList.remove('active');
      }
    }

    this.hideAllContents();
    this.showElement(tab.view);
  }

  showContent(identifier) {
    this.showContentFromTabList(identifier);

    //in case this identifier is a node id
    //we need to run through our tab list 
    for(let tabKey in this.tabList) {
      let tab = this.tabList[tabKey];

      if(tab.id && tab.id == identifier) {
        this.showContentFromTabList(parseInt(tabKey));
      }
    }
  }

  hideAllContents() {
    for(let tab of this.tabList) {
      this.hideElement(tab.view);
    }
  }

  showDefaultContent() {
    if(this.tabList.length > 0) {
      this.showContent(0);
    }
  }

  hideElement(element) {
    element.classList.add("tab-view-inactive");
  }

  showElement(element) {
    element.classList.remove("tab-view-inactive");
  }
}
