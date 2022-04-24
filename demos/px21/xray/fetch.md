# Fetch Handler


<script>

  self.lively4fetchHandlers = self.lively4fetchHandlers.filter(ea => !ea.isLively4xray);
  self.lively4fetchHandlers.push({
    isLively4xray: true,
    handle(request, options) {
      lively.notify("XRay fetch", request)
    }
  })
</script>