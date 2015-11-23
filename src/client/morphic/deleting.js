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
    var deleteTarget = e.target;
    if (isAllowedToBeDeleted(deleteTarget) && confirmDelete(deleteTarget)) {
      $(deleteTarget).remove()
    }
  }
}

function isAllowedToBeDeleted(element) {
  var deleteBlacklist = ["body", "html"];
  return deleteBlacklist.indexOf($(element).prop("tagName").toLowerCase()) < 0;
}

function confirmDelete(element) {
  return window.confirm("Do you really want to delete " + element + "?");
}
