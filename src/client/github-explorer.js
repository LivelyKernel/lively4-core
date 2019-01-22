import * as monaco from 'node_modules/@timkendrick/monaco-editor/dist/standalone/index.js';

const props = [
  {
    label: 'MODEL',
    kind: monaco.languages.CompletionItemKind.Function,
    documentation: 'MODEL Clause',
    insertText: 'MODEL: ',
  },
  {
    label: 'SELECT',
    kind: monaco.languages.CompletionItemKind.Function,
    documentation: 'SELECT Clause',
    insertText: 'SELECT: ',
  },
  {
    label: 'GROUPBY',
    kind: monaco.languages.CompletionItemKind.Function,
    documentation: 'GROUPBY Clause',
    insertText: 'GROUPBY: ',
  },
  {
    label: 'ORDERBY',
    kind: monaco.languages.CompletionItemKind.Function,
    documentation: 'GROUPBY Clause',
    insertText: 'ORDERBY: ',
  },
  {
    label: 'WHERE',
    kind: monaco.languages.CompletionItemKind.Function,
    documentation: 'WHERE Clause',
    insertText: 'WHERE: ',
  }
];



export function fetchGithubData(endpoint) {
  return fetch("/lively4/_github" + endpoint)
    .then(response => response.text())
    .then(json => JSON.parse(json));

}

export function setupMonaco() {
  if (monaco.languages.getLanguages().find(language => language.id === 'ghExplorer') === undefined) {
    fetchGithubData('/meta')
      .then(data => {
        setupMonacoLanguage(data);
      })
      .catch(error => {
        lively.notify(error);
      })
  }
}

function setupMonacoLanguage(completions) {
  monaco.languages.register({ id: 'ghExplorer' });

  monaco.languages.setLanguageConfiguration('ghExplorer', {
    onEnterRules: [
      {
        beforeText: new RegExp(
          '^\\s*(?:MODEL|GROUPBY|SELECT|WHERE|ORDERBY).*?(:|,)\\s*$',
        ),
        action: { indentAction: monaco.languages.IndentAction.Indent },
      },
    ],
    autoClosingPairs: [{ open: '(', close: ')' }],
  });

  monaco.languages.setMonarchTokensProvider('ghExplorer', {
    keywords: ['MODEL', 'GROUPBY', 'SELECT', 'WHERE', 'ORDERBY'],
    aggs: ['SUM', 'COUNT', 'AVG', 'MAX', 'MIN'],
    operators: ['==', '<=', '>=', '<', '>', '!='],
    tokenizer: {
      root: [
        [
          /[a-zA-Z]\w*/,
          {
            cases: {
              '@keywords': 'query',
              '@aggs': 'agg',
              '@default': 'identifier',
            },
          },
        ],
      ],
    },
  });

  monaco.editor.defineTheme('ghExplorerTheme', {
    base: 'vs',
    inherit: false,
    rules: [
      { token: 'query', foreground: '1400ff', fontStyle: 'bold' },
      { token: 'agg', foreground: 'ff0b83', fontStyle: 'bold' },
      { token: 'custom-date', foreground: '1400ff', fontStyle: 'bold' },
    ],
  });

  function isNewModel(editorText) {
    const regex = new RegExp('(.*?)\\((\\s|\\s*\\w*\\.*\\w*,\\s*)*$');
    if (editorText.match(regex)) {
      return true;
    }
    return false;
  }

  function getModelCompletion(model) {
    const model_fields = completions.find(modelO => modelO.model === model);
    if (model_fields !== undefined) {
      let model_fields_completions = null;
      model_fields_completions = model_fields.fields.map(value => ({
        label: value.name,
        kind: monaco.languages.CompletionItemKind.Field,
        documentation: value.type,
        insertText: value.name,
      }));

      return model_fields_completions.concat(
        model_fields.relations.map(value => ({
          label: value.name,
          kind: monaco.languages.CompletionItemKind.Module,
          documentation: value.type,
          insertText: value.name,
        })),
      );
    }
    return false;
  }

  function findModel(modelName) {
    return completions.find(m => m.model === modelName);
  }

  function findRelation(model, relName) {
    return model.relations.find(relation => relation.name === relName);
  }

  function getRealModelFromRelationObjects(objects, position, lastModelRelation) {
    const currentObjName = objects[position];
    let model = undefined;
    if (position === 0) {
      const relationInfo = findRelation(findModel(currentObjName), objects[1]);
      model = findModel(relationInfo.rel_model);

      if (objects.length === 2) {
        return model;
      } else {
        return getRealModelFromRelationObjects(
          objects,
          position + 2,
          relationInfo,
        );
      }
    } else {
      if (objects.length - 1 === position) {
        const lastModel = findModel(lastModelRelation.rel_model);
        const relationInfo = findRelation(lastModel, currentObjName);
        return findModel(relationInfo.rel_model);
      } else {
        const lastModel = findModel(lastModelRelation.rel_model);
        model = findRelation(lastModel, currentObjName);
        return getRealModelFromRelationObjects(objects, position + 1, model);
      }
    }
  }

  function getRelationCompletion(text) {
    const objects = text.split('.').slice(0, -1);
    return getModelCompletion(
      getRealModelFromRelationObjects(objects, 0, undefined).model,
    );
  }

  function isNewField(editorText) {
    const regex = new RegExp('(\\w*).$');
    const match = editorText.match(regex);
    if (match) {
      const regexRelationField = new RegExp('(\\w*)[.](\\w*)[.]$');

      if (regexRelationField.test(editorText)) {
        return getRelationCompletion(editorText.match(new RegExp('[\\w.]*$'))[0]);
      } else {
        const model = match[1];
        return getModelCompletion(model);
      }
    }
    return false;
  }

  monaco.languages.registerCompletionItemProvider('ghExplorer', {
    provideCompletionItems: function(model, position) {
      const textUntilPosition = model.getValueInRange({
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      });

      if (isNewModel(textUntilPosition)) {
        return completions.map(value => ({
          label: value.model,
          kind: monaco.languages.CompletionItemKind.Field,
          documentation: 'Model',
          insertText: value.rel_model,
        }));
      }
      try {
        const fieldProps = isNewField(textUntilPosition);
        if (fieldProps) {
          return fieldProps;
        }
      } catch(err) {
        
      }
     

      if (textUntilPosition.match(new RegExp('((.*?)\n$|^$)'))) {
        console.log(props);
        return props;
      }
    },
  });
}
