'enable rp19-jsx';

import _ from 'src/external/lodash/lodash.js';
import ReactiveMorph from 'src/client/reactive/components/rewritten/conduit/rpComponents/reactiveMorph.js';
import editorStore from 'src/client/reactive/components/rewritten/conduit/src/stores/articleEditorStore.js';
import { router } from 'src/client/reactive/components/rewritten/conduit/rpComponents/router-rp19.js';
import ListErrors from 'src/client/reactive/components/rewritten/conduit/src/components/generic/list-errors-rp19.js'

export default class Editor extends ReactiveMorph {
  
  connectedCallback() {
    super.connectedCallback().then(() => {
      if (this.isDummy()) return;
      this.tagInput = '';
      const slug = this.getSlugFromRoutingProps();
      editorStore.setArticleSlug(slug);
      editorStore.loadInitialData();
    });
  }
  
  getSlugFromRoutingProps() {
    const routingProps = router() && router().current;
    return routingProps && routingProps.slug;
  }
  
  handleTagInputKeyDown(ev) {
    switch (ev.keyCode) {
      case 13: // Enter
      case 9: // Tab
      case 188: // ,
        if (ev.keyCode !== 9) ev.preventDefault();
        this.handleAddTag();
        break;
      default:
        break;
    }
  }
  
  handleAddTag() {
    if (this.tagInput) {
      editorStore.addTag(this.tagInput.trim());
      this.tagInput = '';
    }
  }
  
  onArticleForm(event) {
    editorStore.submit()
      .then(article => {
        editorStore.reset();
        router().navigateTo({ 
          target: 'article',  
          slug: article.slug
        });
      });
    event.preventDefault();
  }
  
  render() {
    return (
      <div class='editor-page'>
        <div class='container page'>
          <div class='row'>
            <div class='col-md-10 offset-md-1 col-xs-12'>

              { ListErrors({ errors: editorStore.errors }) }

              <form id='articleForm'>
                <fieldset>

                  <fieldset class='form-group'>
                    <input
                      id='titleInput'
                      class='form-control form-control-lg'
                      type='text'
                      placeholder='Article Title'
                      value={editorStore.title}
                      disabled={editorStore.inProgress}
                    />
                  </fieldset>

                  <fieldset class='form-group'>
                    <input
                      id='descriptionInput'
                      class='form-control'
                      type='text'
                      placeholder="What's this article about?"
                      value={editorStore.description}
                      disabled={editorStore.inProgress}
                    />
                  </fieldset>

                  <fieldset class='form-group'>
                    <textarea
                      id='bodyTextArea'
                      class='form-control'
                      rows='8'
                      placeholder='Write your article (in markdown)'
                      value={editorStore.body}
                      disabled={editorStore.inProgress}
                    >{editorStore.body}</textarea>
                  </fieldset>

                  <fieldset class='form-group'>
                    <input
                      id='tagInput'
                      class='form-control'
                      type='text'
                      placeholder='Enter tags'
                      value={this.tagInput}
                      blur={() => this.handleAddTag()}
                      keydown={evt => this.handleTagInputKeyDown(evt)}
                      disabled={editorStore.inProgress}
                    />
                    
                    <div class='tag-list'>
                      {
                        ..._.map(editorStore.tagList, tag => (
                            <span class='tag-default tag-pill'>
                              <i
                                class='ion-close-round'
                                click={() => !editorStore.inProgress && editorStore.removeTag(tag)}
                              />
                              { tag }
                            </span>
                          ))
                      }
                    </div>
                  </fieldset>

                  <button
                    id='publishButton'
                    class='btn btn-lg pull-xs-right btn-primary'
                    type='submit'
                    disabled={editorStore.inProgress}
                  >
                    Publish Article
                  </button>

                </fieldset>
              </form>

            </div>
          </div>
        </div>
      </div>
    );
  }
}