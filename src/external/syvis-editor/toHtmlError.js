// :: Error -> HtmlString
export default function toHtmlError (error) {
  return `<p class=error>${error.message}</p>`
}
