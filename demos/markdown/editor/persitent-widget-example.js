


/*MD # Peristent Widget Example 


## Idea: Persistent Widgets

- modifications to HTML elemenents are automatically reflected in the source code in  code mirror.
- user case: insert a drawing/note that can be changed at runtime
- user case: rich text editing of such that I am writing....
- use case: a table/matrix in a code
- user case: level editor

MD*/

/*PW                          
Here we go!
<div contenteditable="true">Was geht ab<br><div>&nbsp;oh funktioniert <b>das kann ich jetzt</b> hier so schnell <b>schreiben</b> wie ich möchte?</div><div><br></div><div><br></div></div>
                               PW*/

  
  
  
/*PW                
  
<div class="lively-content" style="width: 512px; height: 245px; border: 1px solid black; position: relative; background-color: rgba(40, 40, 80, 0.5); left: 0px; top: 0px;"><div class="lively-content" style="width: 125.95px; height: 68.164px; border: 1px solid black; position: absolute; background-color: rgb(157, 0, 0); left: 34px; top: 24px;"></div><div class="lively-content" style="width: 51px; height: 178px; border: 1px solid black; position: absolute; background-color: rgb(157, 0, 0); left: 210px; top: 25px;"></div><div class="lively-content" style="width: 36px; height: 182px; border: 1px solid black; position: absolute; background-color: rgb(157, 0, 0); left: 307px; top: 21px;"></div><div class="lively-content" style="width: 43px; height: 90px; border: 1px solid black; position: absolute; background-color: rgb(157, 0, 0); left: 396px; top: 26px;"></div></div>
  
  
               PW*/


/*MD ## Draft Implementation 

It somehow works, but it does not feel right... fighting over focus with onBlur feels definitively wrong especially since the code might get triggered in other sitiuations.


MD*/



/*MD ## Alternative Implementation

- we could do it a little bit like Babylonian programming and only update the source code when we are saving or disabling the widget. But I guess this will also introduce lots of places to trip over

MD*/

/*MD # Evaluation

And for what did we do it? Because of the little yellow sticky notes! Yes! Because of them! Bäm!

MD*/
  
/*PW   
<lively-drawboard width="400px" height="400px" color="black" pen-size="null" tabindex="0" style="background-color: rgb(255, 250, 205); z-index: 200;"><svg xmlns=" http:=" "="" www.w3.org="" 2000="" svg"="" id="svg" data-is-meta="true" style="position: absolute; left: 0px; top: 0px; width: 402px; height: 402px;"><svg xmlns="http://www.w3.org/2000/svg" id="svg" data-is-meta="true" style="position: absolute; top: 0px; left: 0px; width: 402px; height: 402px; border: none; opacity: 1; touch-action: none;"></svg><path stroke="black" stroke-width="null" fill="none" d="M41.625,47.32031c0,5.20672 -1.50286,10.51429 -2.5,15.5c-2.21856,11.09282 1,24.77989 1,36c0,19.001 -2.5946,37.36477 -1,56.5c0.77123,9.25481 -1.23655,18.8386 -2,28c-0.18205,2.18459 -1,6.5 -1,6.5c0,0 13.82325,-1.36977 19,-1c8.90299,0.63593 47.31973,-1.59014 55.5,2.5c0.40639,0.20319 -1,5.31644 -1,6c0,4.75044 -0.5,9.63742 -0.5,14.5c0,16.52709 1.32013,33.75909 -1,50c-0.77755,5.44285 -3.22333,10.56334 -4,16c-0.98716,6.91011 -2.09615,13.83653 -4,20.5c-0.63474,2.2216 -3.75283,12.00565 -2.5,9.5c3.26735,-6.5347 22.15759,2.5394 26,3.5c21.47062,5.36765 46.38319,4.5 68.5,4.5c7.0639,0 21.37708,5.8854 19.5,-3.5"></path><path stroke="black" stroke-width="null" fill="none" d="M39.125,46.82031c0,1.39592 11.90327,-0.40861 13,-0.5c8.95148,-0.74596 10.57194,-0.42806 16,5c0.4714,0.4714 0.13074,1.34628 0,2c-1.44746,7.2373 -3,12.24273 -3,20c0,22.71196 3.24393,47.03645 -0.5,69.5c-1.04511,6.27067 1.9907,13.02791 0,19c-0.12178,0.36535 -0.78899,1.71101 -0.5,2c1.34071,1.34071 9.83237,-0.22235 11.5,0c13.62728,1.81697 26.71276,3.96808 40.5,5.5c1.85867,0.20652 11.5855,-0.4145 13,1c0.19482,0.19482 0,1.69488 0,2c0,6.64338 -5,13.93526 -5,21.5c0,23.70138 -0.13741,51.95035 5.5,74.5c1.45775,5.83098 -2,11.81157 -2,17c0,0.30512 -0.19482,1.80518 0,2c3.07159,3.07159 17.2515,3.37059 21.5,4c17.89327,2.65086 35.66075,3.27009 53.5,5.5c2.6426,0.33033 16.25434,-1.24566 18,0.5c0.4714,0.4714 0,1.33333 0,2c0,0.45547 -8.28247,15.39124 -8.5,15.5c-0.21487,0.10744 -4.46889,-3.5 -5.5,-3.5"></path><path stroke="black" stroke-width="null" fill="none" d="M106.625,90.82031c0,-1.52557 -8.40473,-8.04763 -10.5,-7c-11.45091,5.72546 -19.69847,26.20102 -6.5,35c13.82489,9.21659 23.47756,-20.02244 17.5,-26c-0.56389,-0.56389 -1.12421,0.5 -1.5,0.5"></path><path stroke="black" stroke-width="null" fill="none" d="M117.625,102.82031c0,-4.32771 18.45736,-1.68088 20.5,-1c0.5,0.16667 1.2643,0.0286 1.5,0.5c4.69109,9.38219 14.59678,16.27421 16,27.5c2.20822,17.66577 0.65692,36.52924 -5,53.5c-1.80101,5.40303 -3.3763,11.38152 -4.5,17c-0.33033,1.65163 -1.5,10.72164 -1.5,7.5"></path><path stroke="black" stroke-width="null" fill="none" d="M134.625,202.82031c0,0.56823 6.89951,12.5 8.5,12.5c0.33333,0 0,-0.66667 0,-1c0,-2.67726 1.00847,-6.50635 3,-8c1.44609,-1.08457 9,-1.20043 9,-3"></path><path stroke="black" stroke-width="null" fill="none" d="M205.125,76.82031c0,9.88691 -1.569,19.345 -3.5,29c-0.30291,1.51455 -6,16.91523 -6,12.5"></path><path stroke="black" stroke-width="null" fill="none" d="M215.625,81.82031c-0.59755,0 -1.26635,1.37693 -1.5,2c-3.00863,8.023 -4.3375,16.71041 -6.5,25c-1.06141,4.06874 -1.63919,4.39195 -2,8c-0.04751,0.47513 1,4.77219 1,3"></path><path stroke="black" stroke-width="null" fill="none" d="M186.625,95.32031c7.60294,0 23.81345,11.5 34.5,11.5"></path><path stroke="black" stroke-width="null" fill="none" d="M233.125,110.32031c-1.60215,0 -3.91194,-2.55871 -5.5,-1.5c-2.02154,1.3477 -3.20905,10.08189 -2,12.5c0.56765,1.13529 2.68742,-0.5249 3.5,-1.5c2.84438,-3.41325 1.5,-6.08542 1.5,-10c0,-0.5 0,-1 0,-1.5c0,-1.01379 0.35663,1.9964 0.5,3c0.21131,1.47919 0.61261,8.5 2,8.5"></path><path stroke="black" stroke-width="null" fill="none" d="M252.125,79.82031c-0.9157,0 -0.3999,0.69917 -0.5,1.5c-0.97089,7.76709 -0.70642,15.73854 -2,23.5c-0.44181,2.65085 -1,5.31258 -1,8c0,0.68718 -0.01409,2.48591 -0.5,2c-0.34663,-0.34663 0.88056,-0.99005 1,-1c5.60047,-0.46671 11.89156,-0.3739 17.5,0c3.49352,0.2329 1.5,2 1.5,2c0,0 -0.5,-1.66667 -0.5,-2c0,-6.4649 0.2175,-12.97125 3,-19c1.99691,-4.32664 12,-12.55928 12,-17c0,-1.06719 -1.68973,1.30548 -2.5,2c-2.11533,1.81314 -4.15975,2.43696 -7,2c-3.45814,-0.53202 -19.37992,-8.12008 -20.5,-7c-1.14796,1.14796 0.20042,11.5 -2.5,11.5"></path><path stroke="black" stroke-width="null" fill="none" d="M244.125,124.32031c-1.92621,0 -1.16508,4.66032 -1.5,6c-0.4114,1.64561 -5.04583,8.45417 -2.5,11c1.65326,1.65326 8.89074,3.48274 10.5,4c4.23388,1.36089 9.02228,4.98886 13,3c0.49429,-0.24714 0.60946,-10.40649 1,-11.5c0.21388,-0.59887 4,-8 4,-8c0,0 -2.3552,-0.0181 -2.5,0c-5.98857,0.74857 -10.5712,-0.36447 -16.5,-2c-1.2736,-0.35134 -18.82452,-6.5 -15,-6.5"></path></svg></lively-drawboard>   
  PW*/
  
  
/*MD ## Future Work
- pull widgets out of comments and replace actual code so table/matrix/level-editor are not just documentation but part of defining the behavior....
- Editing a model in the document can affect the code? Editing the code may have an effect of on the model in the embedded documentation?
  - this is not easy... !
  - this is sometimes not wanted.... maybe there is an interesting middleground where everything does not always have to be in sync, but can be synced or at least generated from each other?
MD*/