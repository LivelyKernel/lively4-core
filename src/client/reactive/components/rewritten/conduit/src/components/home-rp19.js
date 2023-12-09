'enable rp19-jsx';

import ReactiveMorph from 'src/client/reactive/components/rewritten/conduit/rpComponents/reactiveMorph.js';
import commonStore from 'src/client/reactive/components/rewritten/conduit/src/stores/commonStore.js';
import Banner from 'src/client/reactive/components/rewritten/conduit/src/components/home/banner-rp19.js';
import Tags from 'src/client/reactive/components/rewritten/conduit/src/components/home/tags-rp19.js';

export default class Home extends ReactiveMorph {
  
  connectedCallback() {
    super.connectedCallback().then(() => {
      if (this.isDummy()) return;
      commonStore.loadTags();
    });
  }

  async render() {
    const banner = { appName: commonStore.appName };
    const tags = { tags: commonStore.tags };
    return (
      <div class='home-page'>

        {!commonStore.token && 
          await Banner(banner)}

        <div class='container page'>
          <div class='row'>
            <main-view-rp19 class='col-md-9' />

            <div class='col-md-3'>
              <div class='sidebar'>

                <p>Popular Tags</p>
                { await Tags(tags) }
              </div>
            </div>
          </div>
        </div>

      </div>
    );
  }
}