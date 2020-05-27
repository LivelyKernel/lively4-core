import _ from 'src/external/lodash/lodash.js';
import FixedSizeBufferQueue from './FixedSizeBufferQueue.js';

const POLLING_INTERVAL_IN_SECONDS = 1;
const MILLISECONDS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const HISTORY_LENGTH = 10 * SECONDS_PER_MINUTE;
const CHECKPOINTS_IN_SECONDS = [ 5, 10, 30, SECONDS_PER_MINUTE, 5 * SECONDS_PER_MINUTE, 10 * SECONDS_PER_MINUTE ];

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
    const snapshot = getInnerHTML();
    history.push({
      timestamp: new Date().getTime(),
      snapshot
    });
  }
  
  shutdown() {
    clearInterval(this.historyPolling);
  }
  
  get() {
    const { history } = this;
    const clone = _.clone(history);
    return _.map(CHECKPOINTS_IN_SECONDS, i => {
      const checkpoint = _.clone(clone[HISTORY_LENGTH - i]);
      if (checkpoint) checkpoint['timestamp'] = this.readableTimeDifference(i);
      return checkpoint;
    });
  }
  
  readableTimeDifference(timeDifferenceInSeconds) {
    const minutes = Math.floor(timeDifferenceInSeconds / SECONDS_PER_MINUTE);
    const seconds = Math.round(timeDifferenceInSeconds - minutes * SECONDS_PER_MINUTE);
    return `${minutes ? `${minutes}min ` : ''}${seconds ? `${seconds}s ` :''}ago`;
  }
}

export default History;