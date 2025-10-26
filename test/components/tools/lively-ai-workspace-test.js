import {expect} from 'src/external/chai.js';
import { testWorld, loadComponent } from 'test/templates/templates-fixture.js';
import LivelyAiWorkspace from 'src/components/tools/lively-ai-workspace.js';

describe('LivelyAiWorkspace', () => {
  let workspace;

  before(async () => {
    workspace = await loadComponent("lively-ai-workspace")
  });

  after(() => {
    testWorld().innerHTML = "";
  });


});
