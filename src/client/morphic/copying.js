export function handle(el) {
  var copyTarget = el;
  if (isAllowedToBeCopied(copyTarget)) {
    var copy = $(copyTarget).clone();
    $(copyTarget).after(copy);
  }
}

function isAllowedToBeCopied(element) {
  var copyBlacklist = ["body", "html"];
  return copyBlacklist.indexOf($(element).prop("tagName").toLowerCase()) < 0;
}
