# Leo's UI Example


<!--div>
  <div class='row'>
    <div class='column'>
      Title: <input value="indexing by latent semantic analysis"></input>
    </div>
    <div class='column'>
      <div class='row'>
        Author:
      </div>
      <div class='row'>
        <div class='column'>
          <div class='row'>
             Name:
          </div>
          <div class='row'>
             Institution:
          </div>
        </div>
        <div class='column'>  
          <div class='row'>
             <input value="susan t dumais"></input>
          </div>
          <div class='row'>
             <input value="indiana university"></input>
          </div>
        </div>
      </div>
    </div>
    <div class='column'>
      Year: <input value="1990"></input> - <input value="2010"></input>
    </div>
  </div>
</div-->

<style>
      .column {
        float: left;
        width: min;
        margin: 5px;
      }

      /* Clear floats after the columns */
      .row:after {
        content: "";
        display: table;
        clear: both;
      }
    </style>

<script>
  import Leo from './leoUIexample.js'

  Leo.create();
  
  

</script>
