import _ from 'src/external/lodash/lodash.js';
import FixedSizeBufferQueue from './FixedSizeBufferQueue.js';

const POLLING_INTERVAL_IN_SECONDS = 10;
const MILLISECONDS_PER_SECOND = 1000;
const HISTORY_LENGTH = 6;
      
class History {
  
  constructor(getInnerHTML = () => '') {
    this.getInnerHTML = getInnerHTML;
    this.history = FixedSizeBufferQueue(HISTORY_LENGTH, undefined);
    this.poll = this.poll.bind(this);
    this.get = this.get.bind(this);
    this.historyPolling = setInterval(this.poll, POLLING_INTERVAL_IN_SECONDS * MILLISECONDS_PER_SECOND);
    this.poll();
  }
  
  poll() {
    const { getInnerHTML, history } = this;
    const { snapshot: latest } = this.getMostRecent();
    const snapshot = getInnerHTML();
    if (latest === snapshot) return;
    history.push({
      timestamp: new Date().getTime(),
      snapshot
    });
  }
  
  getMostRecent() {
    const { history } = this;
    return _.last(history) || {};
  }
  
  shutdown() {
    clearInterval(this.historyPolling);
  }
  
  get() {
    const { history } = this;
    return _.clone(history);
  }
}

export default History;