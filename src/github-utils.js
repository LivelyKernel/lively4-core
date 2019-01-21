const props = [
  {
    label: 'MODEL',
    kind: monaco.languages.CompletionItemKind.Function,
    documentation: 'MODEL Clause',
    insertText: 'MODEL: '
  },
  {
    label: 'JOINON',
    kind: monaco.languages.CompletionItemKind.Function,
    documentation: 'JOIN ON Clause',
    insertText: 'JOINON: '
  },
  {
    label: 'SELECT',
    kind: monaco.languages.CompletionItemKind.Function,
    documentation: 'SELECT Clause',
    insertText: 'SELECT: '
  },
  {
    label: 'GROUPBY',
    kind: monaco.languages.CompletionItemKind.Function,
    documentation: 'GROUPBY Clause',
    insertText: 'GROUPBY: '
  },
  {
    label: 'ORDERBY',
    kind: monaco.languages.CompletionItemKind.Function,
    documentation: 'GROUPBY Clause',
    insertText: 'ORDERBY: '
  },
  {
    label: 'WHERE',
    kind: monaco.languages.CompletionItemKind.Function,
    documentation: 'WHERE Clause',
    insertText: 'WHERE: '
  }
];


const test = {
  commit: [
    'id',
    'commitMessage',
    'projects'
  ],
  user: [
    'name',
    'id'
  ],
  project: [
    'name',
    'id'
  ]
}

export {test, props};
