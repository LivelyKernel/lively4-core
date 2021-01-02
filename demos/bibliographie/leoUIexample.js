import AcademicQuery from 'src/components/widgets/academic-query.js';

export default class LeoUIExample{
  static async create () {
    var queryWidget = await (<academic-query></academic-query>);
    queryWidget.setQuery("And(Or(Y='1985', Y='2008'), Ti='disordered electronic systems')");
    //queryWidget.setQuery("Y='1985'");
    var input = <input value={queryWidget.getQuery()} style="width: 300px"></input>;
    var updateButton = <button click={() => input.value = queryWidget.getQuery()}>update</button>;
    
    return <div>
      {input} {updateButton}
      {queryWidget}
    </div>;
  }
}