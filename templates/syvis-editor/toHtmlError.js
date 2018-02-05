// :: Error -> HtmlString
module.exports = function toHtmlError (error) {
  return `<p class=error>${error.message}</p>`
}
