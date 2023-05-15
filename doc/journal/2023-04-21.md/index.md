## 2023-04-21*Author: @onsetsu*

<div id="hello" style="border: 1px dashed black; background: lightgray; opacity: 0.5; width: 300px; height: 150px;">
  hover me!
</div>

<div id="world" style="border: 1px dashed black; background: lightgray; opacity: 0.5; width: 300px; height: 150px;">
  I'm repositioned!
</div>

<script>
const hello = lively.query(this, '#hello');
const world = lively.query(this, '#world');

const pageP = lively.getPagePosition(hello);
lively.setPagePosition(world, pageP.addXY(150, 0));
  
lively.removeEventListener('test', hello);
lively.addEventListener('test', hello, 'mousemove', evt => {
  const pageP = lively.getPagePosition(evt);
  lively.showPoint(lively.pagePosToClient(pageP));
  
  const pageQ = lively.getPagePosition(hello);
  lively.showPoint(lively.pagePosToClient(pageQ));

  const newPos = lively.pagePosToClient(pageP.addXY(50, 0))
  lively.showPoint(newPos);
  // lively.setClientPosition(world, newPos);
  lively.setPagePosition(world, pageP.addXY(50, 0));
});
</script>