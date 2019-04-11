## 2019-04-10 VivideJS hello 12


<div style="height:400px">
<lively-import src="https://lively-kernel.org/lively4/lively4-jens/doc/journal/2019-04-10.md/VivideDataFlow.html"></lively-import>
</div>



## Solving Crimes with Lively4

This evening, we played our third round of [**Detective Ein Krimi-Brettspiel**](https://www.pegasus.de/detailansicht/57505g-detective-portal-games-deutsche-ausgabe/). The game includes an interesting breaking-the-fourth-wall feature: this time, we learned more about ancient greek Ariadne and the topology of Richmond, Virginia.

---

<script>
function execPrevElement(refElement) {
  var tags = []
  while (refElement = refElement.previousElementSibling) {
    if(refElement.localName !== 'pre') { continue; }
    
    var child0 = refElement.childNodes[0];
    if (!child0 || child0.localName !== 'code') { continue; }

    if (child0.classList.contains('language-javascript')) {
      break;
    }
  }
  
  if (!refElement) {
    return <div style="background-color: red">Found no Element to execute.</div>;
  }
  
  return refElement.textContent.boundEval()
}
</script>

We used lively this time to do some processing required from the game to narrow down possible vitimms of an upcoming crime.

#### After endless data cleansing, I managed to scrape the data from the possible victims in scenario III:

```javascript
var all = [{
  Name: 'Emily Evans',

  Alter: 34, 
  Haarfarbe: 'blond', 
  Hautfarbe: 'weiß', 
  Polizeidaten: 'nicht aktenkundig',
},{
  Name: 'Madison Turner',

  Alter: 27, 
  Haarfarbe: 'blond', 
  Hautfarbe: 'weiß', 
  Polizeidaten: 'nicht aktenkundig',
},{
  Name: 'Emma Perez',


  Alter: 18, 
  Haarfarbe: 'rot', 
  Hautfarbe: 'Latina', 
  Polizeidaten: 'nicht aktenkundig',
},{

  Name: 'Hannah Nelson',

  Alter: 41, 
  Haarfarbe: 'blond', 
  Hautfarbe: 'weiß', 
  Polizeidaten: 'Ruhestörung',

  SD: 'KUL894-DRH2BN',
},{

  Name: 'Olivia Gonzales',

  Alter: 22, 
  Haarfarbe: 'brünett', 
  Hautfarbe: 'Latina', 
  Polizeidaten: 'nicht aktenkundig',
},{

  Name: 'Isabella Adams',

  Alter: 15, 
  Haarfarbe: 'blond', 
  Hautfarbe: 'weiß', 
  Polizeidaten: 'nicht aktenkundig',
},{

  Name: 'Ashley Green',

  Alter: 48, 
  Haarfarbe: 'rot', 
  Hautfarbe: 'Afroamerikanerin', 
  Polizeidaten: 'nicht aktenkundig',
},{

  Name:'Samantha Scott',

  Alter: 23, 
  Haarfarbe: 'blond', 
  Hautfarbe: 'weiß', 
  Polizeidaten: 'nicht aktenkundig',
},{

  Name: 'Elizabeth Hill',

  Alter: 27, 
  Haarfarbe: 'brünett', 
  Hautfarbe: 'Asiatin', 
  Polizeidaten: 'nicht aktenkundig',
},{

  Name: 'Alexis Lopez',

  Alter: 31, 
  Haarfarbe: 'brünett', 
  Hautfarbe: 'Latina', 
  Polizeidaten: 'Teilnahme an einer illegalen Versammlung',

  SD: 'AWK6JD-RTK3WD',
},{

  Name: 'Sarah Wright',

  Alter: 22, 
  Haarfarbe: 'blond', 
  Hautfarbe: 'weiß', 
  Polizeidaten: 'nicht aktenkundig',
},{

  Name: 'Alyssa King',

  Alter: 49, 
  Haarfarbe: 'brünett', 
  Hautfarbe: 'Afroamerikanerin', 
  Polizeidaten: 'nicht aktenkundig',
},{

  Name: 'Grace Hernandez',

  Alter: 16, 
  Haarfarbe: 'brünett', 
  Hautfarbe: 'Latina', 
  Polizeidaten: 'nicht aktenkundig',
},{

  Name: 'Taylor Allen',

  Alter: 29, 
  Haarfarbe: 'brünett', 
  Hautfarbe: 'weiß', 
  Polizeidaten: 'Trunkenheit am Steuer',
  SD: 'HTRF45-CYT3JK',
},{


  Name: 'Rose Ruden',

  Alter: 17, 
  Haarfarbe: 'blond', 
  Hautfarbe: 'weiß', 
  Polizeidaten: 'nicht aktenkundig',
},{

  Name: 'Brianna Hall',

  Alter: 41, 
  Haarfarbe: 'blond', 
  Hautfarbe: 'weiß', 
  Polizeidaten: 'nicht aktenkundig',
},{

  Name: 'Lauren Walker',

  Alter: 22, 
  Haarfarbe: 'blond', 
  Hautfarbe: 'weiß', 
  Polizeidaten: 'Drogenbesitz',

  SD: 'FJ8KDR-VPL453',
},{

  Name: 'Ava Lee',

  Alter: 25, 
  Haarfarbe: 'brünett', 
  Hautfarbe: 'Afroamerikanerin', 
  Polizeidaten: 'Ruhestörung',

  SD: '3NUK82-DRYTU2',
},{

  Name: 'Kayla Lewis',

  Alter: 18, 
  Haarfarbe: 'blond', 
  Hautfarbe: 'weiß', 
  Polizeidaten: 'nicht aktenkundig',
},{

  Name: 'Jessica Rodriguez',

  Alter: 17, 
  Haarfarbe: 'brünett', 
  Hautfarbe: 'Latina', 
  Polizeidaten: 'nicht aktenkundig',
},{

  Name: 'Natalie Clark',

  Alter: 22, 
  Haarfarbe: 'rot', 
  Hautfarbe: 'weiß', 
  Polizeidaten: 'nicht aktenkundig',
},{

  Name: 'Chloe Richardson',

  Alter: 49, 
  Haarfarbe: 'blond', 
  Hautfarbe: 'weiß', 
  Polizeidaten: 'nicht aktenkundig',
},{

  Name: 'Esperanza Garcia',

  Alter: 31, 
  Haarfarbe: 'brünett', 
  Hautfarbe: 'Latina', 
  Polizeidaten: 'nicht aktenkundig',
},{

  Name: 'Victoria Martin',

  Alter: 27, 
  Haarfarbe: 'blond', 
  Hautfarbe: 'weiß', 
  Polizeidaten: 'Bagatelldiebstahl in einem Schuhgeschäft',

  SD: 'AP457K-K2KRMA',
},{

  Name: 'Hailey Harris',

  Alter: 31, 
  Haarfarbe: 'blond', 
  Hautfarbe: 'weiß', 
  Polizeidaten: 'nicht aktenkundig',
},{

  Name: 'Mia Anderson',

  Alter: 19, 
  Haarfarbe: 'brünett', 
  Hautfarbe: 'weiß', 
  Polizeidaten: 'nicht aktenkundig',
},{

  Name: 'Sydney Taylor',

  Alter: 21, 
  Haarfarbe: 'rot', 
  Hautfarbe: 'weiß', 
  Polizeidaten: 'Ruhestörung',

  SD: 'BL754G-GTSQ96',
},{

  Name: 'Jasmine Moore',

  Alter: 24, 
  Haarfarbe: 'blond', 
  Hautfarbe: 'weiß', 
  Polizeidaten: 'nicht aktenkundig',
},{

  Name: 'Morgan Miller',

  Alter: 35, 
  Haarfarbe: 'brünett', 
  Hautfarbe: 'Asiatin', 
  Polizeidaten: 'nicht aktenkundig',
},{

  Name: 'Julia Davis',

  Alter: 18, 
  Haarfarbe: 'blond', 
  Hautfarbe: 'weiß', 
  Polizeidaten: 'nicht aktenkundig',
},{

  Name: 'Destiny Blake',

  Alter: 22, 
  Haarfarbe: 'brünett', 
  Hautfarbe: 'weiß', 
  Polizeidaten: 'Schlägerei auf einem Campus',

  SD: 'FGK4H5-DT3PKE',
},{

  Name: 'Rachel Jones',

  Alter: 36, 
  Haarfarbe: 'rot', 
  Hautfarbe: 'Afroamerikanerin', 
  Polizeidaten: 'nicht aktenkundig',
},{

  Name: 'Megan Williams',

  Alter: 59, 
  Haarfarbe: 'brünett', 
  Hautfarbe: 'weiß', 
  Polizeidaten: 'nicht aktenkundig',
},{

  Name: 'Abigail Baker',

  Alter: 33, 
  Haarfarbe: 'blond', 
  Hautfarbe: 'weiß',
  Polizeidaten: 'nicht aktenkundig',
}];

all.map(p => p.Name)
```
<script>execPrevElement(this);</script>

#### Using all three hints we got so far ...

```javascript
var narrowed = all
  .filter(p => p.Alter >= 17 && p.Alter <= 25)
  .filter(p => p.Hautfarbe === 'weiß')
  .filter(p => p.Haarfarbe === 'blond');
narrowed.map(p => p.Name)
```
<script>execPrevElement(this);</script>

#### ... as well as DNA hints:

```javascript
var further = narrowed.filter(p => !p.SD)
further.map(p => p.Name)
```
<script>execPrevElement(this);</script>

#### time is short, we narrow down our group using recent missing persons

```javascript
var Vermisste = [
  'Isabella Adams',
  'Ashley Green',
  'Sarah Wright',
  'Rose Ruden',
  'Lauren Walker',
  'Julia Davis',
  'and more'
];
```
<script>execPrevElement(this);</script>

Using some OCR, getting this list from cards would be easier :( #TODO: Integrate camera and OCR support.

```javascript
var final = further.filter(p => Vermisste.includes(p.Name))
final.map(p => p.Name)
```
<script>execPrevElement(this);</script>

#### Only two hours left yet three people to go... >_<
