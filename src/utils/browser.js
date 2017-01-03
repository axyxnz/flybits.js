Flybits.util.Browser = (function(){
  var Deferred = Flybits.Deferred;

  var browser = {
    getCookie: function(key) {
      var value = "; " + document.cookie;
      var parts = value.split("; " + key + "=");
      if (parts.length == 2) {
        return parts.pop().split(";").shift();
      } else{
        return null;
      }
    },
    setCookie: function(key,value,expiryDateObj){
      var expires;
      if (expiryDateObj) {
        expires = "; expires=" + expiryDateObj.toGMTString();
      }
      else {
        expires = "";
      }
      document.cookie = key + "=" + value + expires + "; path=/";
    },
    getFingerprint: function(){
      var def = new Deferred();
      var finger = new Fingerprint2().get(function(result, components){
        if(!result || components.length <= 0){
          def.reject();
        }
        def.resolve(result);
      });

      return def.promise;
    }
  };

  return browser;
})();
