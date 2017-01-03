Flybits.store.Property.server = (function(){
  var Deferred = Flybits.Deferred;
  var storage;

  var Property = {
    init: function(){
      storage = Persistence.create({
        dir: Flybits.cfg.store.RESOURCEPATH
      });
      storage.initSync();
    },
    remove: function(key){
      var def = new Deferred();
      var store = this;

      storage.removeItem(key).then(function(){
        def.resolve(store);
      }).catch(function(e){
        def.reject(e);
      });

      return def.promise;
    },
    set: function(key,value){
      var def = new Deferred();
      var store = this;
      if(!value){
        return this.remove(key);
      } else{
        storage.setItem(key,value).then(function(){
          def.resolve(store);
        }).catch(function(e){
          def.reject(e)
        });
      }
      return def.promise;
    },
    get: function(key){
      var def = new Deferred();

      storage.getItem(key).then(function(val){
        def.resolve(val);
      }).catch(function(e){
        def.reject(e)
      });

      return def.promise;
    }
  };

  return Property;
})();
