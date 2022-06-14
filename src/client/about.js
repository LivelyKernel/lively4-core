/*
 * Some statistics...
 */
export default class AboutLively {

  
  
  static findLargeElements() {
    return _.sortBy(
      Array.from(lively.allElements()).map(ea =>
        new Object({
          id: ea.id,
          element: ea,
          target: ea.target,
          children: lively.allElements(true, ea).size
        })),
      ea => ea.children).reverse()
  }
  /*PW        <div style="width: 581px; height: 219px; border: 1px solid black; position: relative; background-color: rgba(40, 40, 80, 0.5); left: 0px; top: 0px;" class="lively-content" data-lively-id="d8a99545-eb26-48dd-ac76-667149eb1582"><lively-drawboard width="400px" height="400px" color="black" pen-size="null" tabindex="0" style="position: absolute; background-color: rgb(255, 250, 205); left: 28px; top: 77px; width: 161.172px; height: 112.398px; z-index: 200;" class="lively-content" data-lively-id="3156be79-684c-4690-8c24-22b3bbc35d59"><svg xmlns="http://www.w3.org/2000/svg" id="svg" data-is-meta="true" style="position: absolute; top: 0px; left: 0px; width: 163.172px; height: 114.391px; border: none; opacity: 1; touch-action: none;"><path stroke="black" stroke-width="null" fill="none" d="M38.82813,77.10156c0,-8.84012 23.23015,-12.86508 29.5,-16c2.91988,-1.45994 5.83812,-1.70953 9,-2.5c0.87073,-0.21768 3.39753,-1 2.5,-1"></path><path stroke="black" stroke-width="null" fill="none" d="M67.32813,50.60156c-1.28364,0 13.80615,1.80615 14.5,2.5c0.49567,0.49567 -5.56684,17.5 -2.5,17.5"></path></svg></lively-drawboard><lively-drawboard width="400px" height="400px" color="black" pen-size="null" tabindex="0" style="position: absolute; background-color: rgb(255, 250, 205); width: 161.172px; height: 112.398px; left: 255px; top: 62px; z-index: 200;" class="lively-content" data-lively-id="00754ec3-f10a-49dc-8d66-e6b4aaa2833c"><svg xmlns="http://www.w3.org/2000/svg" id="svg" data-is-meta="true" style="position: absolute; top: 0px; left: 0px; width: 163.172px; height: 114.391px; border: none; opacity: 1; touch-action: none;"><path stroke="black" stroke-width="null" fill="none" d="M10.32813,71.10156c0,2.20589 6.548,5.2192 8.5,6c11.32202,4.52881 25.52493,3.47507 34.5,-5.5c3.70701,-3.70701 8,-4.26095 8,-9.5c0,-1.53842 0.71043,-3 -1,-3"></path><path stroke="black" stroke-width="null" fill="none" d="M47.32813,59.60156c3.91964,0 7.76655,1.60478 12,1c2.11292,-0.30185 3.49077,-5.50923 5,-4c1.18133,1.18133 -0.79613,7.5 3,7.5"></path><path stroke="black" stroke-width="null" fill="none" d="M51.82813,48.10156c3.50973,0 13.95,3.55 16.5,1c0.64849,-0.64849 -0.25433,-4.23701 0,-5c0.39097,-1.1729 1.67342,-3.15317 1,-4.5c-1.07684,-2.15367 -4.61642,-2.37214 -6.5,-3c-11.41886,-3.80629 -14.71244,11.5 -7,11.5"></path></svg></lively-drawboard></div>     PW*/
  static groupAndCountElemments(deep) {
    var set = lively.allElements(deep)
    return _.map(_.groupBy(Array.from(set), ea => ea.tagName), (value, key) => {
      return [key, value.length]
    })
  }
}
