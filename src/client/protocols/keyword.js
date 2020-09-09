import PolymorphicIdentifier  from "src/client/poid.js"
import BibliographyScheme from "./bibliography-scheme.js";

export class KeywordScheme extends BibliographyScheme {
  
  get scheme() {
    return "keyword"
  }
  
  searchEntries(entries, query) {
    var keyword = query
    return entries.filter(entry => entry.keywords && entry.keywords.find(ea => ea.match(keyword)))
  }  
}

PolymorphicIdentifier.register(KeywordScheme)