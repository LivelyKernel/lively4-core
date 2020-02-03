let always_one = false;
let always_zero = false;

function mod_two(x){
   if (x===0|always_zero){
      return 0;
   }else{
      return mod_two_r_one(x)
   }
}
function mod_two_r_one(x){
   if(x===1|always_one){
      return 1;
   } else {
      return mod_two(x-2);
     
   }
}
let a=aexpr(()=>mod_two_r_one(2));
always_one = true; 