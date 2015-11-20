export function activate() {
  console.log("using Copy");
  $("body").on("click", handleCopy);
}

export function deactivate() {
  console.log("deactivate Copy");
  $("body").off("click", handleCopy);
}

function handleCopy(e) {
  if (e.ctrlKey || e.metaKey) {
    var copyTarget = e.target;
    if (isAllowedToBeCopied(copyTarget)) {
      var copy = $(copyTarget).clone();
      $(copyTarget).after(copy);
    }
  }
}

function isAllowedToBeCopied(element) {
  var copyBlacklist = ["body", "html"];
  return copyBlacklist.indexOf($(element).prop("tagName").toLowerCase()) < 0;
}
