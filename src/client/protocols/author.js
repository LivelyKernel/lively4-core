import PolymorphicIdentifier  from "src/client/poid.js"
import BibliographyScheme from "./bibliography-scheme.js";

export class AuthorScheme extends BibliographyScheme {
  
  get scheme() {
    return "author"
  }
  
  searchEntries(entries, query) {
    var author = query
    let result = entries.filter(entry => entry.authors && entry.authors.find(ea => ea.match(author)))
    
    
    result = _.sortBy(result, ea => ea.key)
    result = _.uniqBy(result, ea => ea.key)
    
    
    
    return result
  }  
}

PolymorphicIdentifier.register(AuthorScheme)