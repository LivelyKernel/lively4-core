export function handle(el) {
  var deleteTarget = el;
  if (isAllowedToBeDeleted(deleteTarget) && confirmDelete(deleteTarget)) {
    $(deleteTarget).remove();
    window.that = undefined;
  }
}

function isAllowedToBeDeleted(element) {
  var deleteBlacklist = ["body", "html"];
  return deleteBlacklist.indexOf($(element).prop("tagName").toLowerCase()) < 0;
}

function confirmDelete(element) {
  return window.confirm("Do you really want to delete " + element + "?");
}
