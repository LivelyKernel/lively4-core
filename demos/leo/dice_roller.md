# Dice Roller

<script>
  async function dr3() { 
    return await (<dice-roller-3></dice-roller-3>) 
  }
  dr3()
</script>

<br>

<script>
  import DiceRoller from "./dice_roller.js";
  var d = new DiceRoller();
  d.create();
</script>

