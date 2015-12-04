export function handle(el) {
  var deleteTarget = el;
  if (isAllowedToBeDeleted(deleteTarget)) {
    $(deleteTarget).remove();
    window.that = undefined;
  }
}

function isAllowedToBeDeleted(element) {
  var deleteBlacklist = ["body", "html"];
  return deleteBlacklist.indexOf($(element).prop("tagName").toLowerCase()) < 0;
}
