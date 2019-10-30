# Lively4-core Issues

<lively-import src="_navigation.html"></lively-import>

<script>
import github from "src/client/github.js";
import Crayon from "src/client/crayoncolors.js"

(async (resolve) => {

  // if (!window.lively4githubIssues) {
    window.lively4githubIssues = await github.current().issues(true)  
  // }
  let issues = window.lively4githubIssues

  function sort(sortColumn=1, numerical) {
    Array.from(list.querySelectorAll("tr.issue")).forEach(ea => ea.remove())
    
    
    items.sortBy(item => { 
      var column = item.querySelectorAll("td")[sortColumn]
      return column && (numerical ? parseFloat(column.textContent.replace(/[^0-9.]/g,"")) : column.textContent)
    }).forEach(ea => list.appendChild(ea))
  }
  
  let list = <table>
    <tr>
      <th click={() => sort(0, true)}>#</th>
      <th click={() => sort(1)}>issue</th>
      <th click={() => sort(2)}>type</th>
      <th click={() => sort(3)}>component</th>
      <th click={() => sort(4)}>efford</th>
      <th></th>
    </tr>
  </table>
  let style = document.createElement("style")
  style.textContent = `
    .number { font-size: 10pt; color: gray }
    .label { 
      background-color: lightgray;
      font-size: 10pt;
      padding: 1px 6px 1px 6px;
      border-radius: 6px;
      color: white;
      white-space: nowrap;
    }
    
    th:hover {
      background-color: lightgray;
    }
    
    table {
     border-collapse: collapse;
    } 

    table, th, td {
      border: 1px solid #f2f2f2;
    }
    
    tr:nth-child(even) {background-color: #f2f2f2;}
    
    .debug { 
      background-color: gray;
      font-size: 8pt;
      padding: 1px 6px 1px 6px;
      color: white;
      white-space: nowrap;
    }
    
    span.bug {
      background-color: darkred;
    }
    
    span.feature {
      background-color: darkblue;
    }


    span.basesystem, span.livelybasesystem {
      background-color: ${Crayon.tangerine};
    }
    
    span.vivide {
      background-color: teal;
    }
    
    span.texteditor, span.codemirror {
      background-color: ${Crayon.sky};
    }


    span.container {
      background-color: ${Crayon.grape};
    }
    
    span.serviceworker {
      background-color: ${Crayon.banana};
      color:  ${Crayon.iron};
    }

    span.ux, span.ui {
      background-color: ${Crayon.blueberry};
      color:  ${Crayon.snow};
    }

    span.chore {
      background-color: ${Crayon.salmon};
      color:  ${Crayon.lead};
    }
    
    span.performance {
      background-color: ${Crayon.strawberry};
      color:  ${Crayon.lead};
    }
    
    span.documentation {
      background-color: ${Crayon.asparagus};
      color:  ${Crayon.snow};
    }
    
    span.refactoring {
      background-color: ${Crayon.lime};
      color:  ${Crayon.lead};
    }
    
    span.RFCdiscussionquestion {
      background-color: ${Crayon.honeydew};
      color:  ${Crayon.lead};
    }

    span.easy {
      background-color: ${Crayon.mercury};
      color:  ${Crayon.lead};
    }
    
    span.medium {
      background-color: ${Crayon.nickel};
      color:  ${Crayon.mercury};
    }


    span.hard {
      background-color: ${Crayon.lead};
      color:  ${Crayon.mercury};
    }
    
    span.activeexpressions {
      background-color: ${Crayon.moss};
      color:  ${Crayon.mercury};
    }
    
    span.jsx {
      background-color: ${Crayon.cantaloupe};
      color:  ${Crayon.mercury};
    }

    
  `
  list.appendChild(style)
  
  function formatLabel(label) {
    return label.replace(/.*: /,"").replace(/ \(.*/,"")
  }
  function labelsSpan(labels) {
    return labels.map(ea => <span class={"label" + " " + formatLabel(ea.name).replace(/[^a-zA-z09]/g,"") }>{formatLabel(ea.name)} </span> )
  }
  
  let items = [];
  for(let ea of issues.filter(ea => ea.state == "open")) {
    // <a class='title' href={ea.html_ul}>{ea.title}</a> </span>)
    let labels =  ea.labels.map(ea => <span class='label'>{formatLabel(ea.name)} </span>)
    let issue = <tr class="issue">
      <td><span class='number'>#{ea.number}</span></td>
      <td>
        <a class='title' href={ea.html_url } click={evt => {
          evt.stopPropagation()
          evt.preventDefault()
          window.open(ea.html_url)
        }}>{ea.title}</a>
      </td>
      <td>{...labelsSpan(ea.labels.filter(ea => ea.name.match(/^type:/)))}</td>
      <td>{...labelsSpan(ea.labels.filter(ea => ea.name.match(/^comp:/)))}</td>
      <td>{...labelsSpan(ea.labels.filter(ea => ea.name.match(/^effort.?:/)))}</td>
      <td><span class='debug' click={() => lively.openInspector(ea)}>[debug]</span></td>
    </tr>
    items.push(issue)
  }
  
 
  sort(0, true)
  
  return list
})()
</script>