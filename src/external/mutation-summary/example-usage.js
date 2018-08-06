// https://github.com/rafaelw/mutation-summary/blob/master/APIReference.md#the-all-query
import 'src/external/mutation-summary/tree-mirror.js'
import 'src/external/mutation-summary/mutation-summary.js'

function updateWidgets(summaries) {
  var widgetSummary = summaries[0];
  console.log('SUM', widgetSummary);
  
  if(widgetSummary.added.length > 0) {
    lively.success('ADDED', widgetSummary.added.length);
  }
  if(widgetSummary.removed.length > 0) {
    lively.warn('summary', widgetSummary.removed.length);
  }
  
  // update widgets and also hook up event handlers...
}

var observer = new MutationSummary({
  callback: updateWidgets,
  rootNode: document.body,
  queries: [{
    element: 'lively-window'
  }]
});

// later
setTimeout(() => observer.disconnect(), 20000)
