import Morph from 'src/components/widgets/lively-morph.js';


export default class Treeview extends Morph {
  
  
  onItemClick(target) {
    if (!target) return
    var active = target.classList.contains('active');
    this.querySelectorAll(".active").forEach(ea => ea.classList.remove("active"))

    if (active) {
      target.classList.remove("active")
    } else {
      target.classList.add("active")
    }

    this.activeLeaf = !active ? target : null;
    this.dispatchEvent(new CustomEvent('change'));
  }
  
  connectedCallback() {
    this.activeLeaf = null;
  
    // activate/deactivate leaves
    this.addEventListener("click", (evt) => {      
      
      var target = evt.composedPath().find(ea => ea && ea.classList && ea.classList.contains("leaf"))
      if (!target) return;
      this.onItemClick(target)
    });
  }
  
  selectLeaf(target) {
    
    this.querySelectorAll(".active").forEach(ea => ea.classList.remove("active"))
    this.onItemClick(target)
  }
  
  removeLeaf(target) {
    target.parentElement.remove();
  }
  
  livelyExample() {
    this.innerHTML = `
<ul>
  <li class="leaf">hello</li>
  <li class="leaf">world</li>
  <li>
    <ul>
      <li class="leaf">sub1</li>
      <li class="leaf">sub2</li>
    </ul>
  </li>
</ul>`
  }
  
  livelyMigrate(other) {
    // this.innerHTML = other.innerHTML
  }
}