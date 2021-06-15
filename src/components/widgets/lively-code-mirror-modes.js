
self.__handleCodeMirrorModeAwareKeyEvent__ = function handleKeyEvent(lcm, cm, evt) {
  function cancelDefaultEvent() {
    evt.preventDefault();
    evt.codemirrorIgnore = true;
  }

  if (lcm.classList.contains('psych-mode') && !evt.repeat) {
    const exitPsychMode = () => {
      lcm.classList.remove('psych-mode')
      lcm.removeAttribute('psych-mode-command')
      lcm.removeAttribute('psych-mode-inclusive')
    }

    if (evt.key === 'Escape') {
      cancelDefaultEvent()
      exitPsychMode()
      return
    }

    if (evt.key.length === 1) {
      const which = lcm.getAttribute('psych-mode-command');
      const inclusive = lcm.getJSONAttribute('psych-mode-inclusive');

      cancelDefaultEvent()
      exitPsychMode()

      lcm.astCapabilities(cm).then(ac => ac[which](evt.key, inclusive));
      return
    }
  }

  if (lcm.classList.contains('ast-mode') && !evt.repeat) {
    const unifiedKeyDescription = (e) => {
      const alt = e.altKey ? 'Alt-' : '';
      const ctrl = e.ctrlKey ? 'Ctrl-' : '';
      const shift = e.shiftKey ? 'Shift-' : '';
      return ctrl + shift + alt + e.key;
    }

    const operations = {
      Escape: () => {
        lcm.classList.remove('ast-mode');
      },
      i: () => {
        lcm.astCapabilities(cm).then(ac => ac.inlineLocalVariable());
      }
    };

    const operation = operations[unifiedKeyDescription(evt)];
    if (operation) {
      evt.preventDefault();
      evt.codemirrorIgnore = true;

      operation();
    } else {
      lively.notify(unifiedKeyDescription(evt), [lcm, cm, evt]);
    }
  }
}
