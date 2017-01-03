/**
 * ES6 Promise object.
 * @external Promise
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise|Promise API}
 * @see {@link http://www.ecma-international.org/ecma-262/6.0/#sec-promise-objects|Promise spec}
 */

/**
 * This is the root namespace for the Flybits SDK.  If included in a browser environment it will be accessible from the `window` object.
 * @namespace
 */
var Flybits = {
  ready: null,
  /**
   * SDK state related utilities.
   * @namespace
   */
  store: {
    Property: {}
  },
  /**
   * Flybits API wrappers for core models
   * @namespace
   */
  api: {
    /**
     * Object that represents the paging status of a API query.
     * @typedef Paging
     * @memberof Flybits.api
     * @type Object
     * @property {number} offset Offset from first element of first page.
     * @property {number} limit Number of results per page.
     * @property {number} total Total number of objects that is available to page over.
     */
     /**
      * Result Object that is returned from a successful API query if the query is for multiple models.
      * @typedef Result
      * @memberof Flybits.api
      * @type Object
      * @property {BaseModel[]} result Resultant list of models from API request.
      * @property {function} [nextPageFn] If the resultant list of models is only a subset of total records, that is to say the paged result has additional pages, this function can be invoked to request the next page of results based on the initial query parameters.  If this is `undefined` there are no more pages to view.
      */
  },
  init: {},
  /**
   * Utilities for various aspects of the SDK
   * @namespace
   */
  util: {},
  /**
   * Interfaces to ensure SDK model integrity.
   * @namespace
   */
  interface: {}
};

/**
 * Utility classes and reporting manager for retrieving and reporting context about a user.  Only available in the browser environment.
 * @namespace
 * @memberof Flybits
 */
var context = {};

//defaults
Flybits.cfg = {
  HOST: 'http://tenant.flybits.com/v2',
  CTXHOST: 'https://gateway.flybits.com/ctxdata',
  APIKEY: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  CTXREPORTDELAY: 60000,
  store: {
    SDKPROPS: 'flb.sdk.properties',
    RESOURCEPATH: "./res/",
    DEVICEID: 'flb_device',
    USERTOKEN: 'flb_usertoken',
    USERTOKENEXP: 'flb_usertoken_expiry'
  },
  res: {
    TAGS: '/Tags',
    USERS: '/Users',
    ZONES: '/Zones',
    ZONECONNECT: '/Zones/{zid}/Connect',
    ZONEDISCONNECT: '/Zones/{zid}/Disconnect',
    ZMIS: '/ZoneMomentInstances',
    ZMIJWT: '/ZoneMomentInstances/{zmiID}/jwt',
    ZMICONNECT: '/ZoneMomentInstances/{zmiID}/Connect',
    ZMIDISCONNECT: '/ZoneMomentInstances/{zmiID}/Disconnect',
    LOGIN: '/Users/Login',
    LOGOUT: '/Users/Logout',
    REGISTER: '/Users/Register',
    CHANGEPASS: '/Users/ChangePassword',
    SETREMEMBERME: '/Users/rememberMe'
  },
  coreMoments: {
    'com.flybits.moments.website': 'native',
    'com.flybits.moments.text': 'native'
  }
};

Flybits.VERSION = "--flbversion";

var initBrowserFileConfig = function(url){
  var def = new Flybits.Deferred();

  fetch(url).then(function(resp){
    if(resp.status !== 200){
      throw new Flybits.Validation().addError("Configuration file not found","Reverting to default configuration. No configuration found at:"+url,{
        code: Flybits.Validation.type.INVALIDARG,
        context: 'url'
      });
    }
    return resp.json();
  }).then(function(json){
    Flybits.util.Obj.extend(Flybits.cfg,json);
    def.resolve(Flybits.cfg);
  }).catch(function(ex){
    if(ex instanceof Flybits.Validation){
      def.reject(ex);
    } else{
      def.reject(new Flybits.Validation().addError("Failed to read configuration file.","Reverting to default configuration. Configuration format incorrect at:"+url,{
        code: Flybits.Validation.type.MALFORMED,
        context: 'url'
      }));
    }
  });

  return def.promise;
};

var initServerFileConfig = function(filePath){
  if(!filePath){
    console.log('> config file path not provided: using defaults');
    return false;
  }

  try{
    var data = fs.readFileSync(filePath);
  } catch(e){
    throw new Error("Config file read failed: "+filePath);
  }
  try{
    Flybits.util.Obj.extend(Flybits.cfg,JSON.parse(data));
  } catch(e){
    throw new Error("Malformed Config file: "+filePath);
  }
};

var setDeviceID = function(){
  var def = new Flybits.Deferred();
  var storage = Flybits.store.Property;
  storage.get(Flybits.cfg.store.DEVICEID).then(function(val){
    if(val){
      Flybits.store.Session.deviceID = val;
      return val;
    } else{
      var guid = Flybits.util.Obj.guid();
      Flybits.store.Session.deviceID = guid;
      return storage.set(Flybits.cfg.store.DEVICEID,guid);
    }
  }).then(function(val){
    def.resolve();
  }).catch(function(e){
    def.reject(e);
  });

  return def.promise;
};

var setStaticDefaults = function(){
  if(Flybits.context){
    Flybits.context.Manager.reportDelay = Flybits.cfg.CTXREPORTDELAY;
  }
};

Flybits.init.server = function(configFileURL){
  initServerFileConfig(configFileURL);
  setDeviceID().then(function(){
    setStaticDefaults();
    deferredReady.resolve(Flybits.cfg);
  }).catch(function(e){
    deferredReady.reject(e);
  });

  return Flybits.ready;
};

Flybits.init.browser = function(configFileURL){
  initBrowserFileConfig(configFileURL).then(function(){
    return setDeviceID();
  }).then(function(){
    setStaticDefaults();
    deferredReady.resolve(Flybits.cfg);
  }).catch(function(e){
    deferredReady.reject(e);
  });

  return Flybits.ready;
};

Flybits.initObj = function(configObj){
  Flybits.util.Obj.extend(Flybits.cfg,configObj);
  setDeviceID().then(function(){
    setStaticDefaults();
    deferredReady.resolve(Flybits.cfg);
  }).catch(function(e){
    deferredReady.reject(e);
  });

  return Flybits.ready;
};
