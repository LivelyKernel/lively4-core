import ContextMenu from 'src/client/contextmenu.js';

export default async function openMenu(astCapabilities, codeMirror, livelyCodeMirror) {

  function fa(name, ...modifiers) {
    return `<i class="fa fa-${name} ${modifiers.map(m => 'fa-' + m).join(' ')}"></i>`;
  }

  /*MD ### Generate Submenus MD*/

  async function generateGenerationSubmenu() {

    // for now, classes can be generated everywhere
    // if this isn't wanted anymore, scope checks can be done as can be seen below
    let submenu = [
      ['Class', () => {
        menu.remove();
        astCapabilities.generateClass();
      }, '→', fa('suitcase')]
    ];

    const selectedPath = astCapabilities.getInnermostPathContainingSelection(astCapabilities.programPath,
      astCapabilities.firstSelection);

    //add testcase if in describe
    if (astCapabilities.isInDescribe(selectedPath)) {
      submenu.unshift(['Testcase', () => {
        menu.remove();
        astCapabilities.generateTestCase();
      }, '→', fa('suitcase')]);
    }

    //add getter / setter if directly in ClassBody or ObjectExpression
    if (astCapabilities.isDirectlyIn(["ClassBody", "ObjectExpression"], selectedPath)) {
      submenu.push(['Getter', () => {
        menu.remove();
        astCapabilities.generateGetter();
      }, '→', fa('suitcase')], ['Setter', () => {
        menu.remove();
        astCapabilities.generateSetter();
      }, '→', fa('suitcase')]);
    }

    return submenu;
  }

  async function generateImportSubmenu() {
    let { identName, functions, classes } = await astCapabilities.findImports();
    let submenu = [];
    if (!identName || functions.length == 0 && classes.length == 0) {
      submenu.push(['none', () => {
        menu.remove();
      }, '', '']);
    } else {
      functions.forEach(url => submenu.push([url.replace(lively4url, ''), () => {
        menu.remove();
        astCapabilities.addImport(url, identName, true);
      }, '-', fa('share-square-o')]));
      classes.forEach(cl => submenu.push([cl.name + ", " + cl.url.replace(lively4url, ''), () => {
        menu.remove();
        astCapabilities.addImport(cl.url, cl.name, false);
      }, '-', fa('share-square-o')]));
    }
    return submenu;
  }

  /*MD ### Generate Factoring Menu MD*/

  const menuItems = [
    ['selection to local variable', () => {
      menu.remove();
      astCapabilities.extractExpressionIntoLocalVariable();
    }, '→', fa('share-square-o', 'flip-horizontal')],
    ['inline variable', () => {
      menu.remove();
      astCapabilities.inlineLocalVariable();
    }, '→', fa('external-link', 'flip-vertical')],
    ['wrap into active expression', () => {
      menu.remove();
      astCapabilities.wrapExpressionIntoActiveExpression();
    }, '→', fa('suitcase')],
    ['Rename', () => {
      menu.remove();
      astCapabilities.rename();
    }, '→', fa('suitcase')],
    ['Swap then and else of conditional', () => {
      menu.remove();
      astCapabilities.swapConditional();
    }, 'swap', fa('suitcase')],
    ['Extract Method', () => {
      menu.remove();
      astCapabilities.extractMethod()
    }, 'Alt+M', fa('suitcase'), {
      onSelect: () => {
        debugger
        const selection = astCapabilities.selectMethodExtraction(astCapabilities.programPath, true);
        if (selection) {
          openMenu.changedSelectionInMenu = true;
          astCapabilities.selectPaths(selection.selectedPaths);
        } else {
          openMenu.changedSelectionInMenu = false;
        }
      },
      onDeselect: () => {
        debugger
        if (openMenu.changedSelectionInMenu) {
          codeMirror.undoSelection();
        }
      }
    }],
    ['Generate HTML Accessors', () => {
      menu.remove();
      astCapabilities.generateHTMLAccessors();
    }, 'Alt+H', fa('suitcase')],
    ['Print References', () => {
      astCapabilities.printAllBindings();
      menu.remove();
    }, 'Alt+I', fa('suitcase')],
    [
      'lively', [
        ['lively.notify', () => {
          menu.remove();
          astCapabilities.livelyNotify();
        }, '+', fa('plus')],
        ['lively4url', () => {
          menu.remove();
          astCapabilities.lively4url();
        }, '+', fa('plus')],
      ]
    ],
    ['Generate', generateGenerationSubmenu()],
    ['Import', generateImportSubmenu()]
  ];
  var menuPosition = codeMirror.cursorCoords(false, "window");

  const menu = await ContextMenu.openIn(document.body, { clientX: menuPosition.left, clientY: menuPosition.bottom },
    undefined, document.body, menuItems);
  menu.addEventListener("DOMNodeRemoved", () => {
    livelyCodeMirror.focus();
  });
}
