"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import { Graph, DEFAULT_FOLDER_URL, TAG_URL } from 'src/client/triples/triples.js';

export default class AddSeminarTopic extends Morph {
  async initialize() {
    this.windowTitle = "AddSeminarTopic";
    this.registerButtons();
  }
  
  // this method is autmatically registered through the ``registerKeys`` method
  onKeyDown(evt) {
    lively.notify("Key Down!" + evt.charCode)
  }
  
  // this method is automatically registered as handler through ``registerButtons``
  async onCreate() {
    const graph = await Graph.getInstance();
    
    const name = this.get('#topic-name').value;
    if(name === '') { return; }

    const topicKnot = await graph.createKnot('https://lively4/notes/', name, 'md');
    const topicURL = topicKnot.url;
    
    const seminarURL = "https://lively4/notes/RP18.md"; // #TODO should be configurable
    
    await topicKnot.save(topicKnot.content + this.get('#content').value);
    await graph.createTriple(
      topicKnot.url,
      "https://lively4/notes/is_Topic_of.md",
      seminarURL,
      DEFAULT_FOLDER_URL
    );
    
    const isPotentialTopic = this.get('#is-potential-topic');
    if(isPotentialTopic && isPotentialTopic.checked) {
      await graph.createTriple(
        topicKnot.url,
        "https://lively4/notes/potential_topic_for.md",
        seminarURL,
        DEFAULT_FOLDER_URL
      );
    }
    
    await graph.createTriple(
      topicKnot.url,
      TAG_URL,
      "https://lively4/notes/TODO.md",
      DEFAULT_FOLDER_URL
    );

    const selectedRadioButton = this.get('input[name="category"]:checked');
    if(selectedRadioButton) {
      await graph.createTriple(
        selectedRadioButton.value,
        "https://lively4/notes/contains.md",
        topicKnot.url,
        DEFAULT_FOLDER_URL
      );
      lively.warn(selectedRadioButton.value)
    }
    lively.success("creation finished");
    let knotView = await lively.openComponentInWindow("knot-view");
    knotView.loadKnotForURL(topicKnot.url);
  }
}