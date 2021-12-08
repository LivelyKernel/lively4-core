
<script>
EventTarget.prototype._getEventListeners = function(a){
  if (! this.eventListenerList)
    this.eventListenerList = {};
  if (a==undefined)
  {
    return this.eventListenerList;
  }
  return this.eventListenerList[a];
};

function myapp()
{
  var ui = <div click={evt => lively.notify("hello")}>hi</div>
  
  ui.addEventListener('click', () =>
  {
    for(let evt of Object.keys(ui._getEventListeners()))
    {
      evt();
    }
  });
  
  return ui
}

myapp()
</script>



