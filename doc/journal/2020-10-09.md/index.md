## 2020-10-09 #Tracing #ContextJS
*Author: @JensLincke*

## Quick and Dirty ContextJS Method Tracer


```javascript

import {Paper} from "src/client/protocols/academic.js"

 

import * as cop  from "src/client/ContextJS/src/contextjs.js";
function traceClass(aClass) {
  let partialLayer = {}
  for(let name of lively.methods(aClass.prototype)) {
    partialLayer[name] = function (...args) {
        let start = performance.now()
        let result = cop.proceed(...args)
        console.log("[trace] " + name + " " + (performance.now() - start) + "ms")
        return result
    }  
  }
  cop.layer(window, "TraceLayer").refineClass(aClass, partialLayer)
}

traceClass(Paper)

               
TraceLayer.beGlobal()
```


And with #Async support:


```javascript

import {Paper} from "src/client/protocols/academic.js"

 

import * as cop  from "src/client/ContextJS/src/contextjs.js";
function traceClass(aClass) {
  let partialLayer = {}
  for(let name of lively.methods(aClass.prototype)) {
    partialLayer[name] = function (...args) {
        let start = performance.now()
        let result = cop.proceed(...args)
        
        if (result.then) {
          result.then(() => console.log("[async trace] " + name + " " + (performance.now() - start) + "ms"))
        } else {
          console.log("[trace] " + name + " " + (performance.now() - start) + "ms")
        }
        return result
    }  
  }
  cop.layer(window, "TraceLayer").refineClass(aClass, partialLayer)
}

traceClass(Paper)

               
TraceLayer.beGlobal()
```

## And look what we found...


```
[trace] Paper>> findReferencedBy 1056.2749999808148ms
academic.md_b35baaeb-94cc-4add-8cc1-e3bc9e1e6698:34 add paper 2167670020
tracing.js:34 [trace] Literature.getPaperEntry 10.015000007115304ms
tracing.js:34 [trace] Literature.getPaperEntry 9.99500002944842ms
tracing.js:34 [trace] Literature.getPaperEntry 10.670000046957284ms
tracing.js:34 [trace] Literature.getPaperEntry 10.524999990593642ms
tracing.js:34 [trace] Literature.getPaperEntry 9.855000011157244ms
tracing.js:34 [trace] Literature.getPaperEntry 9.810000017751008ms
tracing.js:34 [trace] Literature.getPaperEntry 10.149999987334013ms
tracing.js:34 [trace] Literature.getPaperEntry 10.41999994777143ms
tracing.js:34 [trace] Literature.getPaperEntry 10.575000022072345ms
tracing.js:34 [trace] Literature.getPaperEntry 10.405000008177012ms
tracing.js:34 [trace] Literature.getPaperEntry 10.455000039655715ms
tracing.js:34 [trace] Literature.getPaperEntry 10.190000000875443ms
tracing.js:34 [trace] Literature.getPaperEntry 9.840000013355166ms
tracing.js:34 [trace] Literature.getPaperEntry 9.824999957345426ms
tracing.js:34 [trace] Literature.getPaperEntry 10.260000010021031ms
tracing.js:34 [trace] Literature.getPaperEntry 9.99500002944842ms
tracing.js:34 [trace] Literature.getPaperEntry 9.854999952949584ms
tracing.js:34 [trace] Literature.getPaperEntry 10.974999982863665ms
tracing.js:34 [trace] Literature.getPaperEntry 10.19499998074025ms
tracing.js:34 [trace] Literature.getPaperEntry 9.90000000456348ms
tracing.js:34 [trace] Literature.getPaperEntry 10.130000009667128ms
tracing.js:34 [trace] Literature.getPaperEntry 10.120000049937516ms
tracing.js:34 [trace] Literature.getPaperEntry 13.680000032763928ms
tracing.js:34 [trace] Literature.getPaperEntry 6.929999974090606ms
tracing.js:34 [trace] Literature.getPaperEntry 9.775000042282045ms
tracing.js:34 [trace] Literature.getPaperEntry 9.950000036042184ms
tracing.js:34 [trace] Literature.getPaperEntry 10.160000005271286ms
tracing.js:34 [trace] Literature.getPaperEntry 10.574999963864684ms
tracing.js:34 [trace] Literature.getPaperEntry 10.245000012218952ms
tracing.js:34 [trace] Literature.getPaperEntry 9.869999950751662ms
tracing.js:34 [trace] Literature.getPaperEntry 9.874999988824129ms
tracing.js:34 [trace] Literature.getPaperEntry 10.270000027958304ms
tracing.js:34 [trace] Literature.getPaperEntry 10.665000008884817ms
tracing.js:34 [trace] Literature.getPaperEntry 10.720000020228326ms
tracing.js:34 [trace] Literature.getPaperEntry 10.089999996125698ms
tracing.js:34 [trace] Literature.getPaperEntry 9.99500002944842ms
tracing.js:34 [trace] Literature.getPaperEntry 9.984999953303486ms
tracing.js:34 [trace] Literature.getPaperEntry 9.919999982230365ms
tracing.js:34 [trace] Literature.getPaperEntry 10.03499998478219ms
tracing.js:34 [trace] Literature.getPaperEntry 11.43499999307096ms
tracing.js:34 [trace] Literature.getPaperEntry 10.230000014416873ms
tracing.js:34 [trace] Literature.getPaperEntry 9.759999986272305ms
tracing.js:34 [trace] Literature.getPaperEntry 9.930000000167638ms
tracing.js:34 [trace] Literature.getPaperEntry 9.885000006761402ms
tracing.js:34 [trace] Literature.getPaperEntry 9.684999997261912ms
tracing.js:34 [trace] Literature.getPaperEntry 10.17999998293817ms
tracing.js:34 [trace] Literature.getPaperEntry 10.825000004842877ms
tracing.js:34 [trace] Literature.getPaperEntry 10.369999974500388ms
tracing.js:34 [trace] Literature.getPaperEntry 10.010000027250499ms
tracing.js:34 [trace] Literature.getPaperEntry 10.03499998478219ms
tracing.js:34 [trace] Literature.getPaperEntry 9.974999993573874ms
tracing.js:34 [trace] Literature.getPaperEntry 9.935000038240105ms
tracing.js:34 [trace] Literature.getPaperEntry 9.97999997343868ms
tracing.js:34 [trace] Literature.getPaperEntry 10.864999960176647ms
tracing.js:34 [trace] Literature.getPaperEntry 9.990000049583614ms
tracing.js:34 [trace] Literature.getPaperEntry 9.805000037886202ms
tracing.js:34 [trace] Literature.getPaperEntry 9.650000021792948ms
tracing.js:34 [trace] Literature.getPaperEntry 10.055000020656735ms
tracing.js:34 [trace] Literature.getPaperEntry 9.865000029094517ms
tracing.js:34 [trace] Literature.getPaperEntry 9.959999995771796ms
tracing.js:34 [trace] Literature.getPaperEntry 10.249999992083758ms
tracing.js:34 [trace] Literature.getPaperEntry 10.284999967552722ms
tracing.js:34 [trace] Literature.getPaperEntry 10.254999971948564ms
tracing.js:34 [trace] Literature.getPaperEntry 10.119999991729856ms
tracing.js:34 [trace] Literature.getPaperEntry 10.204999998677522ms
tracing.js:34 [trace] Literature.getPaperEntry 9.844999993219972ms
tracing.js:34 [trace] Literature.getPaperEntry 11.924999998882413ms
tracing.js:34 [trace] Literature.getPaperEntry 11.87500002561137ms
tracing.js:34 [trace] Literature.getPaperEntry 11.044999992009252ms
tracing.js:34 [trace] Literature.getPaperEntry 10.334999999031425ms
tracing.js:34 [trace] Literature.getPaperEntry 10.03499998478219ms
tracing.js:34 [trace] Literature.getPaperEntry 9.904999984428287ms
tracing.js:34 [trace] Literature.getPaperEntry 9.959999995771796ms
tracing.js:34 [trace] Literature.getPaperEntry 10.110000032000244ms
tracing.js:34 [trace] Literature.getPaperEntry 10.215000016614795ms
tracing.js:34 [trace] Literature.getPaperEntry 10.344999958761036ms
tracing.js:34 [trace] Literature.getPaperEntry 10.545000026468188ms
tracing.js:34 [trace] Literature.getPaperEntry 10.104999993927777ms
tracing.js:34 [trace] Literature.getPaperEntry 9.980000031646341ms
tracing.js:34 [trace] Literature.getPaperEntry 11.104999983217567ms
tracing.js:34 [trace] Literature.getPaperEntry 9.974999993573874ms
tracing.js:34 [trace] Literature.getPaperEntry 10.145000007469207ms
tracing.js:34 [trace] Literature.getPaperEntry 9.90000000456348ms
tracing.js:34 [trace] Literature.getPaperEntry 9.89999994635582ms
tracing.js:34 [trace] Literature.getPaperEntry 9.804999979678541ms
tracing.js:34 [trace] Literature.getPaperEntry 10.330000019166619ms
tracing.js:34 [trace] Literature.getPaperEntry 10.53999998839572ms
tracing.js:34 [trace] Literature.getPaperEntry 9.950000036042184ms
tracing.js:34 [trace] Literature.getPaperEntry 9.879999968688935ms
tracing.js:34 [trace] Literature.getPaperEntry 9.814999997615814ms
tracing.js:34 [trace] Literature.getPaperEntry 10.024999966844916ms
tracing.js:34 [trace] Literature.getPaperEntry 10.025000025052577ms
tracing.js:34 [trace] Literature.getPaperEntry 10.574999963864684ms
tracing.js:34 [trace] Literature.getPaperEntry 10.774999973364174ms
tracing.js:34 [trace] Literature.getPaperEntry 14.850000035949051ms
tracing.js:34 [trace] Literature.getPaperEntry 7.295000017620623ms
tracing.js:34 [trace] Literature.getPaperEntry 10.23499999428168ms
tracing.js:34 [trace] Literature.getPaperEntry 9.989999991375953ms
tracing.js:34 [trace] Literature.getPaperEntry 10.160000005271286ms
tracing.js:34 [trace] Literature.getPaperEntry 10.629999975208193ms
tracing.js:34 [trace] Literature.getPaperEntry 10.045000002719462ms
tracing.js:13 [trace] Paper>> resolveMicrosoftIdsToPapers 1035.6599999940954ms
tracing.js:13 [trace] Paper>> findReferencedBy 1045.8550000330433ms
academic.md_b35baaeb-94cc-4add-8cc1-e3bc9e1e6698:34 add paper 2172147300
tracing.js:34 [trace] Literature.getPaperEntry 9.684999997261912ms
tracing.js:34 [trace] Literature.getPaperEntry 10.124999971594661ms
tracing.js:34 [trace] Literature.getPaperEntry 10.065000038594007ms
tracing.js:34 [trace] Literature.getPaperEntry 10.185000021010637ms
tracing.js:34 [trace] Literature.getPaperEntry 10.439999983645976ms
tracing.js:34 [trace] Literature.getPaperEntry 10.164999985136092ms
tracing.js:34 [trace] Literature.getPaperEntry 10.01999998698011ms
tracing.js:34 [trace] Literature.getPaperEntry 9.750000026542693ms
tracing.js:34 [trace] Literature.getPaperEntry 9.999999951105565ms
tracing.js:34 [trace] Literature.getPaperEntry 9.90000000456348ms
tracing.js:34 [trace] Literature.getPaperEntry 10.695000004488975ms
tracing.js:34 [trace] Literature.getPaperEntry 10.204999998677522ms
tracing.js:34 [trace] Literature.getPaperEntry 10.11500001186505ms
tracing.js:34 [trace] Literature.getPaperEntry 9.870000008959323ms
tracing.js:34 [trace] Literature.getPaperEntry 10.650000011082739ms
tracing.js:34 [trace] Literature.getPaperEntry 10.59499999973923ms
tracing.js:34 [trace] Literature.getPaperEntry 10.164999985136092ms
tracing.js:34 [trace] Literature.getPaperEntry 10.405000008177012ms
tracing.js:34 [trace] Literature.getPaperEntry 10.75499999569729ms
tracing.js:34 [trace] Literature.getPaperEntry 10.440000041853637ms
tracing.js:34 [trace] Literature.getPaperEntry 10.570000042207539ms
tracing.js:34 [trace] Literature.getPaperEntry 10.11500001186505ms
tracing.js:34 [trace] Literature.getPaperEntry 10.134999989531934ms
tracing.js:34 [trace] Literature.getPaperEntry 10.524999990593642ms
tracing.js:34 [trace] Literature.getPaperEntry 10.67499996861443ms
tracing.js:34 [trace] Literature.getPaperEntry 10.439999983645976ms
tracing.js:34 [trace] Literature.getPaperEntry 9.889999986626208ms
tracing.js:34 [trace] Literature.getPaperEntry 10.239999974146485ms
tracing.js:34 [trace] Literature.getPaperEntry 10.215000016614795ms
tracing.js:34 [trace] Literature.getPaperEntry 10.070000018458813ms
tracing.js:34 [trace] Literature.getPaperEntry 10.725000000093132ms
tracing.js:34 [trace] Literature.getPaperEntry 10.39499999023974ms
tracing.js:34 [trace] Literature.getPaperEntry 10.094999975990504ms
tracing.js:34 [trace] Literature.getPaperEntry 10.010000027250499ms
tracing.js:34 [trace] Literature.getPaperEntry 10.10000001406297ms
tracing.js:34 [trace] Literature.getPaperEntry 10.479999997187406ms
tracing.js:34 [trace] Literature.getPaperEntry 11.174999992363155ms
tracing.js:34 [trace] Literature.getPaperEntry 10.654999990947545ms
tracing.js:34 [trace] Literature.getPaperEntry 10.024999966844916ms
tracing.js:34 [trace] Literature.getPaperEntry 10.009999969042838ms
tracing.js:34 [trace] Literature.getPaperEntry 10.000000009313226ms
tracing.js:34 [trace] Literature.getPaperEntry 10.33999997889623ms
tracing.js:34 [trace] Literature.getPaperEntry 10.249999992083758ms
tracing.js:34 [trace] Literature.getPaperEntry 10.809999948833138ms
tracing.js:34 [trace] Literature.getPaperEntry 10.589999961666763ms
tracing.js:34 [trace] Literature.getPaperEntry 10.704999964218587ms
tracing.js:34 [trace] Literature.getPaperEntry 10.300000023562461ms
tracing.js:34 [trace] Literature.getPaperEntry 10.040000022854656ms
tracing.js:34 [trace] Literature.getPaperEntry 10.320000001229346ms
tracing.js:34 [trace] Literature.getPaperEntry 10.780000011436641ms
tracing.js:34 [trace] Literature.getPaperEntry 10.054999962449074ms
tracing.js:34 [trace] Literature.getPaperEntry 9.829999995417893ms
tracing.js:34 [trace] Literature.getPaperEntry 10.124999971594661ms
tracing.js:34 [trace] Literature.getPaperEntry 9.785000002011657ms
tracing.js:34 [trace] Literature.getPaperEntry 9.985000011511147ms
tracing.js:34 [trace] Literature.getPaperEntry 10.109999973792583ms
tracing.js:34 [trace] Literature.getPaperEntry 10.279999987687916ms
tracing.js:34 [trace] Literature.getPaperEntry 10.350000055041164ms
tracing.js:34 [trace] Literature.getPaperEntry 9.844999993219972ms
tracing.js:34 [trace] Literature.getPaperEntry 10.130000009667128ms
tracing.js:34 [trace] Literature.getPaperEntry 10.889999975915998ms
tracing.js:34 [trace] Literature.getPaperEntry 10.520000010728836ms
tracing.js:34 [trace] Literature.getPaperEntry 10.030000004917383ms
tracing.js:34 [trace] Literature.getPaperEntry 9.719999972730875ms
tracing.js:34 [trace] Literature.getPaperEntry 10.110000032000244ms
tracing.js:34 [trace] Literature.getPaperEntry 9.730000048875809ms
tracing.js:34 [trace] Literature.getPaperEntry 10.359999956563115ms
tracing.js:34 [trace] Literature.getPaperEntry 10.609999997541308ms
tracing.js:34 [trace] Literature.getPaperEntry 10.340000037103891ms
tracing.js:34 [trace] Literature.getPaperEntry 9.870000008959323ms
tracing.js:34 [trace] Literature.getPaperEntry 9.854999952949584ms
tracing.js:34 [trace] Literature.getPaperEntry 9.920000040438026ms
tracing.js:34 [trace] Literature.getPaperEntry 10.015000007115304ms
tracing.js:34 [trace] Literature.getPaperEntry 10.149999987334013ms
tracing.js:34 [trace] Literature.getPaperEntry 10.860000038519502ms
tracing.js:34 [trace] Literature.getPaperEntry 10.550000006332994ms
tracing.js:34 [trace] Literature.getPaperEntry 10.000000009313226ms
tracing.js:34 [trace] Literature.getPaperEntry 9.959999995771796ms
tracing.js:34 [trace] Literature.getPaperEntry 9.989999991375953ms
tracing.js:34 [trace] Literature.getPaperEntry 10.025000025052577ms
tracing.js:34 [trace] Literature.getPaperEntry 10.06000000052154ms
tracing.js:34 [trace] Literature.getPaperEntry 11.484999966342002ms
tracing.js:34 [trace] Literature.getPaperEntry 10.064999980386347ms
tracing.js:34 [trace] Literature.getPaperEntry 9.85999999102205ms
tracing.js:34 [trace] Literature.getPaperEntry 9.834999975282699ms
tracing.js:34 [trace] Literature.getPaperEntry 9.794999961741269ms
tracing.js:34 [trace] Literature.getPaperEntry 10.104999993927777ms
tracing.js:34 [trace] Literature.getPaperEntry 10.744999977760017ms
tracing.js:34 [trace] Literature.getPaperEntry 10.53999998839572ms
tracing.js:34 [trace] Literature.getPaperEntry 10.119999991729856ms
tracing.js:34 [trace] Literature.getPaperEntry 9.985000011511147ms
tracing.js:34 [trace] Literature.getPaperEntry 10.015000007115304ms
tracing.js:34 [trace] Literature.getPaperEntry 9.970000013709068ms
tracing.js:34 [trace] Literature.getPaperEntry 10.53999998839572ms
tracing.js:34 [trace] Literature.getPaperEntry 10.789999971166253ms
tracing.js:34 [trace] Literature.getPaperEntry 10.294999985489994ms
tracing.js:34 [trace] Literature.getPaperEntry 10.245000012218952ms
tracing.js:34 [trace] Literature.getPaperEntry 10.345000016968697ms
tracing.js:34 [trace] Literature.getPaperEntry 10.550000006332994ms
tracing.js:34 [trace] Literature.getPaperEntry 10.364999994635582ms
tracing.js:34 [trace] Literature.getPaperEntry 10.639999993145466ms
tracing.js:13 [trace] Paper>> resolveMicrosoftIdsToPapers 1038.2400000235066ms
tracing.js:13 [trace] Paper>> findReferencedBy 1048.1499999877997ms
academic.md_b35baaeb-94cc-4add-8cc1-e3bc9e1e6698:34 add paper 2010793828
tracing.js:34 [trace] Literature.getPaperEntry 10.375000012572855ms
tracing.js:34 [trace] Literature.getPaperEntry 10.609999997541308ms
tracing.js:34 [trace] Literature.getPaperEntry 10.104999993927777ms
tracing.js:34 [trace] Literature.getPaperEntry 10.329999960958958ms
tracing.js:34 [trace] Literature.getPaperEntry 10.479999997187406ms
tracing.js:34 [trace] Literature.getPaperEntry 10.51499997265637ms
tracing.js:34 [trace] Literature.getPaperEntry 10.439999983645976ms
tracing.js:34 [trace] Literature.getPaperEntry 9.994999971240759ms
tracing.js:34 [trace] Literature.getPaperEntry 10.03500004298985ms
tracing.js:34 [trace] Literature.getPaperEntry 10.454999981448054ms
tracing.js:34 [trace] Literature.getPaperEntry 10.10000001406297ms
tracing.js:34 [trace] Literature.getPaperEntry 10.490000015124679ms
tracing.js:34 [trace] Literature.getPaperEntry 10.844999982509762ms
tracing.js:34 [trace] Literature.getPaperEntry 10.149999987334013ms
tracing.js:34 [trace] Literature.getPaperEntry 9.944999997969717ms
tracing.js:34 [trace] Literature.getPaperEntry 9.854999952949584ms
tracing.js:34 [trace] Literature.getPaperEntry 10.119999991729856ms
tracing.js:34 [trace] Literature.getPaperEntry 10.840000002644956ms
tracing.js:34 [trace] Literature.getPaperEntry 10.580000001937151ms
tracing.js:34 [trace] Literature.getPaperEntry 9.944999997969717ms
tracing.js:34 [trace] Literature.getPaperEntry 10.130000009667128ms
tracing.js:34 [trace] Literature.getPaperEntry 9.849999973084778ms
tracing.js:34 [trace] Literature.getPaperEntry 10.06000000052154ms
tracing.js:34 [trace] Literature.getPaperEntry 10.460000019520521ms
tracing.js:34 [trace] Literature.getPaperEntry 10.959999985061586ms
tracing.js:34 [trace] Literature.getPaperEntry 10.789999971166253ms
tracing.js:34 [trace] Literature.getPaperEntry 11.159999994561076ms
tracing.js:34 [trace] Literature.getPaperEntry 10.2199999964796ms
tracing.js:34 [trace] Literature.getPaperEntry 10.23499999428168ms
tracing.js:34 [trace] Literature.getPaperEntry 10.530000028666109ms
tracing.js:34 [trace] Literature.getPaperEntry 10.719999962020665ms
tracing.js:34 [trace] Literature.getPaperEntry 10.19499998074025ms
tracing.js:34 [trace] Literature.getPaperEntry 9.814999997615814ms
tracing.js:34 [trace] Literature.getPaperEntry 10.229999956209213ms
tracing.js:34 [trace] Literature.getPaperEntry 10.5549999861978ms
tracing.js:34 [trace] Literature.getPaperEntry 10.03499998478219ms
tracing.js:34 [trace] Literature.getPaperEntry 10.739999997895211ms
tracing.js:34 [trace] Literature.getPaperEntry 10.570000042207539ms
tracing.js:34 [trace] Literature.getPaperEntry 10.040000022854656ms
tracing.js:34 [trace] Literature.getPaperEntry 14.510000008158386ms
tracing.js:34 [trace] Literature.getPaperEntry 10.109999973792583ms
tracing.js:34 [trace] Literature.getPaperEntry 10.330000019166619ms
tracing.js:34 [trace] Literature.getPaperEntry 11.425000033341348ms
tracing.js:34 [trace] Literature.getPaperEntry 10.400000028312206ms
tracing.js:34 [trace] Literature.getPaperEntry 10.25999995181337ms
tracing.js:34 [trace] Literature.getPaperEntry 10.245000012218952ms
tracing.js:34 [trace] Literature.getPaperEntry 10.089999996125698ms
tracing.js:34 [trace] Literature.getPaperEntry 10.620000015478581ms
tracing.js:34 [trace] Literature.getPaperEntry 10.825000004842877ms
tracing.js:34 [trace] Literature.getPaperEntry 10.345000016968697ms
tracing.js:34 [trace] Literature.getPaperEntry 10.11500001186505ms
tracing.js:34 [trace] Literature.getPaperEntry 10.204999998677522ms
tracing.js:34 [trace] Literature.getPaperEntry 9.865000029094517ms
tracing.js:34 [trace] Literature.getPaperEntry 11.039999953936785ms
tracing.js:34 [trace] Literature.getPaperEntry 10.794999951031059ms
tracing.js:34 [trace] Literature.getPaperEntry 10.089999996125698ms
tracing.js:34 [trace] Literature.getPaperEntry 10.765000013634562ms
tracing.js:34 [trace] Literature.getPaperEntry 10.614999977406114ms
tracing.js:34 [trace] Literature.getPaperEntry 10.750000015832484ms
tracing.js:34 [trace] Literature.getPaperEntry 10.2199999964796ms
tracing.js:34 [trace] Literature.getPaperEntry 10.865000018384308ms
tracing.js:34 [trace] Literature.getPaperEntry 10.429999965708703ms
tracing.js:34 [trace] Literature.getPaperEntry 10.249999992083758ms
tracing.js:34 [trace] Literature.getPaperEntry 10.025000025052577ms
tracing.js:34 [trace] Literature.getPaperEntry 10.33999997889623ms
tracing.js:34 [trace] Literature.getPaperEntry 10.485000035259873ms
tracing.js:34 [trace] Literature.getPaperEntry 10.694999946281314ms
tracing.js:34 [trace] Literature.getPaperEntry 10.390000010374933ms
tracing.js:34 [trace] Literature.getPaperEntry 10.07499999832362ms
tracing.js:34 [trace] Literature.getPaperEntry 10.079999978188425ms
tracing.js:34 [trace] Literature.getPaperEntry 10.35499997669831ms
tracing.js:34 [trace] Literature.getPaperEntry 15.189999947324395ms
tracing.js:34 [trace] Literature.getPaperEntry 7.314999995287508ms
tracing.js:34 [trace] Literature.getPaperEntry 10.67500002682209ms
tracing.js:34 [trace] Literature.getPaperEntry 10.689999966416508ms
tracing.js:34 [trace] Literature.getPaperEntry 10.505000012926757ms
tracing.js:34 [trace] Literature.getPaperEntry 10.760000033769757ms
tracing.js:34 [trace] Literature.getPaperEntry 10.639999993145466ms
tracing.js:34 [trace] Literature.getPaperEntry 11.119999981019646ms
tracing.js:34 [trace] Literature.getPaperEntry 10.69999998435378ms
tracing.js:34 [trace] Literature.getPaperEntry 10.405000008177012ms
tracing.js:34 [trace] Literature.getPaperEntry 10.985000000800937ms
tracing.js:34 [trace] Literature.getPaperEntry 10.264999989885837ms
tracing.js:34 [trace] Literature.getPaperEntry 10.300000023562461ms
tracing.js:34 [trace] Literature.getPaperEntry 10.959999985061586ms
tracing.js:34 [trace] Literature.getPaperEntry 10.65999997081235ms
tracing.js:34 [trace] Literature.getPaperEntry 10.500000033061951ms
tracing.js:34 [trace] Literature.getPaperEntry 10.814999986905605ms
tracing.js:34 [trace] Literature.getPaperEntry 10.739999997895211ms
tracing.js:34 [trace] Literature.getPaperEntry 10.869999998249114ms
src/client/tracing.js!transpiled:54 [trace] Literature.getPaperEntry 12.03500002156943ms
src/client/tracing.js!transpiled:54 [trace] Literature.getPaperEntry 11.055000009946525ms
src/client/tracing.js!transpiled:54 [trace] Literature.getPaperEntry 10.494999994989485ms
src/client/tracing.js!transpiled:54 [trace] Literature.getPaperEntry 10.750000015832484ms
src/client/tracing.js!transpiled:54 [trace] Literature.getPaperEntry 10.525000048801303ms
src/client/tracing.js!transpiled:54 [trace] Literature.getPaperEntry 10.695000004488975ms
src/client/tracing.js!transpiled:54 [trace] Literature.getPaperEntry 10.805000027175993ms
src/client/tracing.js!transpiled:54 [trace] Literature.getPaperEntry 10.67499996861443ms
src/client/tracing.js!transpiled:54 [trace] Literature.getPaperEntry 10.575000022072345ms
src/client/tracing.js!transpiled:54 [trace] Literature.getPaperEntry 10.615000035613775ms
src/client/tracing.js!transpiled:54 [trace] Literature.getPaperEntry 10.479999997187406ms
src/client/tracing.js!transpiled:34 [trace] Paper>> resolveMicrosoftIdsToPapers 1067.139999999199ms
```

