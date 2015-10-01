 function getAppInfo() {
          var clientId = "1774dvkirby4490";
          var redirectUri = new URL(thisModule.uri()).getDirectory().withFilename("callbacks/dropbox.html");
          var appInfo = {
            "clientId": clientId,
            "redirectUri": redirectUri
          };
          return appInfo;
        }

        function challengeForAuth() {
          var appInfo = getAppInfo();
          var url =
            "https://www.dropbox.com/1/oauth2/authorize" +
            "?client_id=" + appInfo.clientId +
            "&response_type=token" +
            "&state=" + uuid +
            "&redirect_uri=" + encodeURIComponent(appInfo.redirectUri);
          popup(url);
        }
        
        function popup(url) {
          var width = 525,
              height = 525,
              screenX = window.screenX,
              screenY = window.screenY,
              outerWidth = window.outerWidth,
              outerHeight = window.outerHeight;
        
          var left = screenX + Math.max(outerWidth - width, 0) / 2;
          var top = screenY + Math.max(outerHeight - height, 0) / 2;
        
          var features = [
                      "width=" + width,
                      "height=" + height,
                      "top=" + top,
                      "left=" + left,
                      "status=no",
                      "resizable=yes",
                      "toolbar=no",
                      "menubar=no",
                      "scrollbars=yes"];
          var popup = window.open(url, "oauth", features.join(","));
          if (!popup) {
            alert("failed to pop up auth window");
          }
          popup.uuid = lively.net.CloudStorage.addPendingRequest(req);
          popup.focus();
        }
</html>