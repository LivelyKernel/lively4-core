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
    fetchGithubData('/example_meta')
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
    const regex2 = new RegExp('(.*?)MODEL:\\s*$');
    if (editorText.match(regex2)) {
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
        documentation: 'Type: ' + value.type + '\nExample:\n' + JSON.stringify(value.example, null, 4),
        insertText: value.name,
      }));

      return model_fields_completions.concat(
        model_fields.relations.map(value => ({
          label: value.name,
          kind: monaco.languages.CompletionItemKind.Module,
          documentation: 'Type: ' + value.type + '\nExample:\n' + JSON.stringify(value.example, null, 4),      
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
    if (objects.length === 1) {
      return findModel(objects[0]);
    }
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

  function getRelationCompletion(text, model) {
    const objects = text.split('.').slice(0, -1);
    objects.unshift(model);
    return getModelCompletion(
      getRealModelFromRelationObjects(objects, 0, undefined).model,
    );
  }

  function isNewFieldOfField(editorText) {
    const regex = new RegExp('[\\w*.]*$');
    const match = editorText.match(regex);

    if (match) {
      const currentModel = editorText.match(new RegExp('MODEL:\\s*(\\w*)'))[1];
      return getRelationCompletion(match[0], currentModel);
    }

    return false;
  }

  function isNewFieldInModel(editorText) {
    const isInCorrectScope = new RegExp(
      '(SELECT:\\s|WHERE:\\s|GROUPBY:\\s|ORDERBY:\\s)\\(.*\\n*\\s*$',
    );
    const match = editorText.match(isInCorrectScope);
    if (match) {
      const isNewField = new RegExp('(\\s*\\w*|\\,\\s*\\.*)$');
      if (editorText.match(isNewField)) {
        const currentModel = editorText.match(new RegExp('MODEL:\\s*(\\w*)'))[1];
        return getModelCompletion(findModel(currentModel).model);
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  monaco.languages.registerCompletionItemProvider('ghExplorer', {
    provideCompletionItems: function(model, position) {
      const textUntilPosition = model.getValueInRange({
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      });
      try {
        if (textUntilPosition.match(new RegExp('((.*?)\n$|^$)'))) {
          return props;
        }
        // if it is in MODEL: scope
        if (isNewModel(textUntilPosition)) {
          return completions.map(value => ({
            label: value.model,
            kind: monaco.languages.CompletionItemKind.Field,
            documentation: 'Model',
            insertText: value.rel_model,
          }));
        } else {
          const newField = isNewFieldInModel(textUntilPosition);
          if (newField) {
            return newField;
          }
          const newFieldOfField = isNewFieldOfField(textUntilPosition);
          if (newFieldOfField) {
            return newFieldOfField;
          }
        }
      } catch(e) {
        return [];
      };
      
    },
  });
}
