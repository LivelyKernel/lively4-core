## 2019-07-08

## Script of the day

remove empty files.... while converting old lively demos to mp4.


```bash
find . -size 0 | invoke rm
```


Just for reverences, my `invoke` script... similar to xargs, but not quite so...

```
while read i; do
        $@ "$i"
done
```

## Useful Ad-Hoc Video List with Player

(since... putting them all in video tags will crash chrome)

```markdown
- [151209_PaintElephant_Problem](151209_PaintElephant_Problem.mp4) {.video} 


<script>
var base = lively.query(this, "lively-container").getURL().toString().replace(/[^\/]*$/,"");
var videoPlayer;

(async () => {
  for(let ea of this.parentElement.querySelectorAll(".video")) {
    let link = ea.querySelector("a")
    if (!link) continue;
    let file = link.getAttribute("href");
    lively.removeEventListener("lively", link)
    lively.addEventListener("lively", link, "click", evt => {
      evt.preventDefault()
      evt.stopPropagation()
      
      videoPlayer.remove()
      videoPlayer = <div id="videoplayer"><video width="320" height="240" controls><source src={base + file} type="video/mp4"></source></video></div>
      videoPlayer.querySelector("video").play()
      ea.appendChild(videoPlayer)
      
      return true
    })
    // ea.appendChild(<ul><li></ul>)
  }
})()
</script>
```