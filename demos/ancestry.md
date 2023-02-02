show ancestry of `that`
<script>
import TopologicalSort from 'demos/offset/topological-sort.js';

function flatTreeParent(element) {
  if (element.assignedSlot) {
    return element.assignedSlot;
  }
  if (element.parentNode instanceof ShadowRoot) {
    return element.parentNode.host;
  }
  return element.parentNode;
}

function iterateParents(element, accessor) {
  let parent = element;
  const parents = []
  do {
    parents.push(parent)
  } while (parent = accessor(parent));

  return parents;
}

var container = <div><span>nothing yet</span></div>;
{
  const ae = aexpr(() => that)
  ae.dataflow(element => {
    if (this.getRootNode({composed:true}) !== document) {
      ae.dispose()
      return
    }

    const knob = that || this

    const parentLists = [
      {
        name: <b>offsetParent chain</b>,
        list: iterateParents(knob, e => e.offsetParent)
      },
      {
        name: <b>Firefox-style offsetParent chain</b>,
        list: iterateParents(knob, e => window.offsetPolyfill.parentOriginal.apply(e))
      },
      {
        name: 'flatTree chain',
        list: iterateParents(knob, flatTreeParent)
      },
      {
        name: 'custom events (lively.ancestry)',
        list: lively.ancestry(knob)
      },
      {
        name: 'lively.allParents',
        list: lively.allParents(knob)
      },
      {
        name: 'lively.allParents(..., deep)',
        list: lively.allParents(knob, undefined, true)
      }
    ];
    const allElements = parentLists.flatMap(p => p.list).uniq();

    const sortOp = new TopologicalSort(new Map());
    allElements.forEach(e => sortOp.addNode(e, e));
    parentLists.forEach(pl => pl.list.reduce((e1, e2) => (sortOp.addEdge(e1, e2), e2)));
    const sortedElements = [...sortOp.sort().keys()];

    const maybeError = fn => {
      try {
        return fn();
      } catch (e) {
        return e
      }
    }

    const perElement = [
      {
        name: 'position',
        do: e => window.getComputedStyle(e).position
      },
      {
        name: <b>offsetParent (polyfill)</b>,
        do: e => printer(window.offsetPolyfill.parentPolyfill.apply(e))
      },
      {
        name: "offsetLeft (polyfill)",
        do: e => window.offsetPolyfill.leftPolyfill.apply(e)
      },
      {
        name: "offsetTop (polyfill)",
        do: e => window.offsetPolyfill.topPolyfill.apply(e)
      },
      {
        name: <b>offsetParent (original)</b>,
        do: e => printer(window.offsetPolyfill.parentOriginal.apply(e))
      },
      {
        name: "offsetLeft (original)",
        do: e => window.offsetPolyfill.leftOriginal.apply(e)
      },
      {
        name: "offsetTop (original)",
        do: e => window.offsetPolyfill.topOriginal.apply(e)
      }
    ];
    const printer = lively.elementPrinter.pos.tagName.id.classes
    

    let highlight;
    let onMousemove =evt => {
      evt.preventDefault()
      evt.stopPropagation()

      if (highlight) {
        highlight.remove()
      }
      lively.showElement(e)
    }
    const table = <table>
      <thead>
        <td></td>
        {...parentLists.map(pl => <td style='writing-mode: vertical-lr;'>{pl.name}</td>)}
        {...perElement.map(pe => <td style='writing-mode: vertical-lr;'>{pe.name}</td>)}
      </thead>
      {...sortedElements.map(e => {
        return <tr mousemove={evt => {
      evt.preventDefault()
      evt.stopPropagation()

      if (highlight) {
        highlight.remove()
      }
      highlight=lively.showElement(e)
    }}>
          <td>{printer(e)}</td>
          {...parentLists.map(pl => {
            const isIncluded = pl.list.includes(e);
            const color = 'color: ' + (isIncluded ? 'green' : 'red')
            const text = isIncluded ? 'yes' : 'no'
            return <td><span style={color}>{text}</span></td>
          })}
          {...perElement.map(pe => <td>{maybeError(() => pe.do(e))}</td>)}
        </tr>
      })}
    </table>
    container.replaceChild(table, container.firstChild)
  });
}
container
</script>
