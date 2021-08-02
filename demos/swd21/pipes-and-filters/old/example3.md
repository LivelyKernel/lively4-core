<script>
  class Pipeline {
    createView() {
      // build the main view as simple area
      var view = <div style="width: 100%; height: 100%; border: 1px lightgray solid; padding: 2px;"></div>
      
      //build a view for the data source
      var dataSource = <div style="width: 50%; height: 50%; border: 1px lightgray solid"></div>
      
      // fill the data source with an equal amount of three different objects
      var objectFabric = new ObjectFabric()
      for (var i = 0; i < 9; i++) {
        switch((i + 1) % 3) {
          case 0:
            dataSource.append(objectFabric.buildCircle())
            break;
          case 1:
            dataSource.append(objectFabric.buildSquare())
            break;
          case 2:
            dataSource.append(objectFabric.buildTriangle())
            break;
        }
      }
      
      // build the view for the first filter
      var filter1 = <div style="width: 50%; height: 50%; border: 1px lightgray solid"></div>
      // fill the filter buffer with circle objects
      for (var i = 0; i < 10; i++) {
        filter1.append(objectFabric.buildCircle())
      }
      
      
      // append views to the main view
      view.append(dataSource)
      view.append(filter1)
      return view
    }  
  }
  
  class ObjectFabric {
    buildCircle() {
      return <div style="width: 20px; height: 20px; border-radius: 50%; background-color: blue; margin: 5px;"></div>
    }
    
    buildSquare() {
      return <div style="width: 20px; height: 20px; background-color: green; margin: 5px;"></div>
    }
    
    buildTriangle() {
      return <div style="height: 0; width: 0; border-left: 15px solid transparent; border-right: 15px solid transparent; border-bottom: 20px solid #FA8258; margin: 5px;"></div>
    }
  }
  
  
  
  var pipeline = new Pipeline()
  pipeline.createView()
</script>