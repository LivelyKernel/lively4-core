<template id="lively-math">
    <style>

  .container {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
    }
    #workspace {
        width: 100%;
        height: 100%;
        overflow: auto;
        flex: 1;
        margin: 0px;
        padding: 0px;
    }

    </style>
      <!-- <pre id="console"></pre> -->
<lively-code-mirror id="workspace" mode="text" wrapmode="true"># http://mathjs.org/docs/datatypes/units.html 

0 degC in degF == 31.999999999999943 degF
100 degF in degC == 37.77777777777783 degC

f(x) = x^2;
f(2)

[[1],[2],[3]] * [[1,2,3]] ==  [[1, 2, 3], [2, 4, 6], [3, 6, 9]]
 
    </lively-code-mirror>
   
</template>