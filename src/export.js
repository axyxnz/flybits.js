/***** Export ******/

if(typeof window === 'object'){
  window.Flybits = Flybits;
  Flybits.init = Flybits.init.browser;
  Flybits.store.Property = Flybits.store.Property.browser;
  Flybits.context = context;
} else if(typeof exports === 'object' && typeof module !== 'undefined'){
  var fs = require('fs');
  var Persistence = require('node-persist');
  Flybits.init = Flybits.init.server;
  Flybits.store.Property = Flybits.store.Property.server;
  module.exports = Flybits;
} else if(typeof define === 'function' && define.amd){
  define(function(){
    Flybits.init = Flybits.init.server;
    Flybits.store.Property = Flybits.store.Property.server;
    return Flybits;
  });
} else{
  Flybits.init = Flybits.init.server;
  Flybits.store.Property = Flybits.store.Property.server;
  global.Flybits = Flybits;
}

if(typeof __dirname === 'string'){
  Flybits.cfg.store.RESOURCEPATH = __dirname+"/../res/";
}
Flybits.store.Property.init();
var deferredReady = new Flybits.Deferred();
Flybits.ready = deferredReady.promise;
