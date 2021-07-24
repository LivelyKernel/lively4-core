# Croquet

<script>
  <a click={() => window.open("https://lively-kernel.org/lively4/swd21-croquet/start.html")}>dev repository</a>
</script>

Croquet is a bit-idendical synchronization system and helps the developer to write distributed systems with only client-side code and no server-side code to implementing collaborative multi-user applications. In Lively 4 different application scenarios were implemented to discuss the possibilities of Croquet. To do so and because we are using an external package it can only be alive inside an iFrame. <br>
<br>
The simplest Croquet implementation is a counter. While starting the scenario every 1000 ms a counter ticks high. Therefore it is initialized a CounterModel which extend from Croquet and is used to count for all related Clients inside the same session. A CounterView also extended from Croquet handle the user interaction which is a counter reset by clicking inside the iFrame-Display. 

## Notes / Idea

- use iFrames for clean environment



## References

- <https://croquet.io/sdk/docs/>