/**
 * Example class to test hashtag-based method styling in class diagrams
 */
export default class HashtagTestClass {
  
  // #important #public-api
  async initialize() {
    console.log('Initializing...');
  }
  
  // #deprecated Use newMethod() instead
  // #TODO Remove in v2.0
  oldMethod() {
    console.log('This is deprecated');
  }
  
  // #private Internal use only
  _internalHelper() {
    return 42;
  }
  
  // #experimental May change in future versions
  // #TODO Finalize API
  experimentalFeature(data) {
    return data * 2;
  }
  
  // #important Core functionality
  // #api Public API method
  processData(input) {
    return input.toUpperCase();
  }
  
  // Regular method without hashtags
  regularMethod() {
    console.log('No special styling');
  }
  
  // #TODO Implement this
  notYetImplemented() {
    throw new Error('Not implemented');
  }
}
