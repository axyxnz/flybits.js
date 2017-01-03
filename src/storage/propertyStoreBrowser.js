Flybits.store.Property.browser = (function(){
  var Deferred = Flybits.Deferred;
  var storage = null;

  var Property = {
    init: function(){
      if(window.localforage && window.localforage._driver){
        storage = window.localforage.createInstance({
          name: Flybits.cfg.store.SDKPROPS
        });
      } else if(window.localStorage){
        storage = window.localStorage;
      }
    },
    localDump: {},
    isLocalStoreSupported: function(){
      var storageUsable = (window.localforage && window.localforage._driver) || window.localStorage;
      if(storageUsable){
        try{
          localStorage.setItem('support',true);
          localStorage.removeItem('support');
          return true;
        } catch(e){
          return false;
        }
      } else{
        return false;
      }
    },
    remove: function(key){
      var def = new Deferred();
      var store = this;

      if(!this.isLocalStoreSupported()){
        console.error('> WARNING: `localStorage` not supported on this platform. Reverting to temporary in memory storage.');
        delete this.localDump[key];
        def.resolve(store);
      } else{
        try{
          var removePromise = storage.removeItem(key);
          if(!removePromise){
            def.resolve(store);
          } else{
            storage.then(function(){
              def.resolve(store);
            }).catch(function(e){
              def.reject(e);
            });
          }
        } catch(e){
          console.error(e);
          def.reject(e);
        }
      }

      return def.promise;
    },
    set: function(key,value){
      var def = new Deferred();
      var store = this;

      if(!value){
        return store.remove(key);
      }

      if(!this.isLocalStoreSupported()){
        console.error('> WARNING: `localStorage` not supported on this platform. Reverting to temporary in memory storage.');
        this.localDump[key] = value;
        def.resolve(store);
      } else{
        try{
          var setPromise = storage.setItem(key,value);
          if(!setPromise){
            def.resolve(store);
          } else{
            setPromise.then(function(){
              def.resolve(store);
            }).catch(function(e){
              def.reject(e);
            });
          }
        } catch(e){
          console.error(e);
          def.reject(e);
        }
      }
      return def.promise;
    },
    get: function(key){
      var def = new Deferred();
      if(!this.isLocalStoreSupported()){
        console.error('> WARNING: `localStorage` not supported on this platform. Reverting to temporary in memory storage.');
        var val = this.localDump[key];
        def.resolve(val);
      } else{
        var getPromise = storage.getItem(key);
        if(!getPromise || !(getPromise instanceof Promise)){
          def.resolve(getPromise);
        } else{
          getPromise.then(function(val){
            def.resolve(val);
          }).catch(function(e){
            def.reject(e);
          });
        }
      }
      return def.promise;
    }
  };

  return Property;
})();
