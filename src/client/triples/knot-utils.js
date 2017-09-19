import KnotView from "./../../../templates/knot-view.js";
import ContextMenu from './../contextmenu.js';

function collectContextMenuItems() {
  return [
      ["Knot View", (evt) => {
        ContextMenu.hide();
        KnotView.openURL(this.url);
      }, "", '<i class="fa fa-window-maximize" aria-hidden="true"></i>'],
      ["Danger Zone", [
        ["Delete", async evt => {
          ContextMenu.hide();
          const graph = await Graph.getInstance();

          const label = this.label();
          if(await graph.deleteKnot(this)) {
            // #TODO: use reactivity to update views and search results
            lively.notify(`${label} deleted!`, null, 4, null, "red");
          } else {
            lively.notify('did not delete knot ' + label, this.url);
          }
        }, "Delete for good", '<i class="fa fa-trash" aria-hidden="true"></i>']
      ]]
    ];
}

export function toListItem() {
  const listItem = <li tabindex="1">{this.label()}</li>;

  listItem.addEventListener('keydown', event => {
    if (event.keyCode == 13) { // ENTER
      KnotView.openURL(this.url);
      event.stopPropagation();
      event.preventDefault();
    }
  });
  listItem.addEventListener("dblclick", event => {
    KnotView.openURL(this.url);
    event.stopPropagation();
    event.preventDefault();
  });
  listItem.addEventListener("contextmenu", event => {
    ContextMenu.openIn(document.body, event, this, undefined, this::collectContextMenuItems());
    event.stopPropagation();
    event.preventDefault();
  });
  
  return listItem;
}
