import PolymorphicIdentifier  from "src/client/poid.js"
import BibliographyScheme from "./bibliography-scheme.js";

export class AuthorScheme extends BibliographyScheme {
  
  get scheme() {
    return "author"
  }
  
  searchEntries(entries, query) {
    var author = query
    return entries.filter(entry => entry.authors && entry.authors.find(ea => ea.match(author)))
  }  
}

PolymorphicIdentifier.register(AuthorScheme)