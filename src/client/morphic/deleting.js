export function activate() {
  console.log("using Delete");
  $("body").on("click", handleDelete);
}

export function deactivate() {
  console.log("deactivate Delete");
  $("body").off("click", handleDelete);
}

function handleDelete(e) {
  if (e.ctrlKey || e.metaKey) {
    var target = e.target;
    if (window.confirm("Do you really want to delete " + target + "?")) {
      $(target).remove()
    }
  }
}
