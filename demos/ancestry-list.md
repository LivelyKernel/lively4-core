# Ancestry List of `that`

using `lively.ancestry` (similar to `lively.allParents`) and `lively.elementPrinter`, this is a quick way to display the parent structure of an element.

To use, simply Alt-LeftClick an element to define it as the global `that`.

To stop tracking, simply remove this script, e.g by navigating elsewhere.

<script>
 var tracker = <div style='background: lightgray'>{4}</div>;

self.cancelAnimationFrame(self.__ancestryTrackNumber__);

const fn = () => {
  tracker.innerHTML = '';
  tracker.append(<div>target: {lively.elementPrinter.tagName.offset(that)}</div>);
  tracker.append(<div>offsetParent: {lively.elementPrinter.tagName(that.offsetParent)}</div>);

  function printList(elements) {
    tracker.append(<div>{elements.length} parent elements:</div>);
    const items = elements.map(ele => <div>{lively.elementPrinter.tagName.id.classes.pos.offset(ele)}:{lively.elementPrinter.tagName(ele.offsetParent)}</div>);
    tracker.append(...items);
  }

  const parents = lively.ancestry(that)
  printList(parents);

  if(this.isConnected) {
  // lively.showElement(this)
  self.__ancestryTrackNumber__ = self.requestAnimationFrame(fn);
  } else {
  lively.notify('remove tracker')

  }
};

self.__ancestryTrackNumber__ = self.requestAnimationFrame(fn);

 tracker
</script>

