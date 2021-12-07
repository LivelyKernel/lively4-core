export function indentFromTo(from, to) {
  from.to(to + 1).forEach(line => {
    this.indentLine(line, "smart", true);
  });
}

export function indentSelections() {
  const selections = this.listSelections();
  selections.forEach(({ anchor, head }) => {
    const anchorLine = anchor.line;
    const headLine = head.line;
    const anchorFirst = anchorLine < headLine;
    const fromLine = anchorFirst ? anchorLine : headLine;
    const toLine = anchorFirst ? headLine : anchorLine;
    this::indentFromTo(fromLine, toLine);
  });
}
