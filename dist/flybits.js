// @author Justin Lam
// @version master:0c36195
;(function(undefined) {

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

Flybits.VERSION = "master:0c36195";

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

/**
 * @classdesc A helper class for {@link external:Promise|ES6 Promises} which allows for deferred asynchronous task management.  Not all asynchronous operations can be wrapped in a promise callback.  Sometimes the resolution of a promise needs to be deferred for another entity to resolve or reject, hence the paradigm of the deferred `Object`.
 * @class
 * @memberof Flybits
 */
Flybits.Deferred = (function(){
  Promise.settle = function(promisesArr){
    var reflectedArr = promisesArr.map(function(promise){
      return promise.then(function(successResult){
        return {
          result: successResult,
          status: 'resolved'
        };
      },function(errorResult){
        return {
          result: errorResult,
          status: 'rejected'
        };
      });
    });
    return Promise.all(reflectedArr);
  };
  
  var Deferred = function(){
    var def = this;
    /**
     * @instance
     * @memberof Flybits.Deferred
     * @member {external:Promise} promise Instance of an ES6 Promise to be fulfilled.
     */
    this.promise = new Promise(function(resolve,reject){
      /**
       * @instance
       * @memberof Flybits.Deferred
       * @member {function} resolve Callback to be invoked when the asychronous task that initiated the promise is successfully completed.
       */
      def.resolve = resolve;
      /**
       * @instance
       * @memberof Flybits.Deferred
       * @member {function} reject Callback to be invoked when the asychronous task that initiated the promise has failed to complete successfully.
       */
      def.reject = reject;
    });

    this.then = this.promise.then.bind(this.promise);
    this.catch = this.promise.catch.bind(this.promise);
  };

  return Deferred;
})();

Flybits.util.Api = (function(){
  var api = {
    checkResult: function(resp){
      if(resp.status >= 200 && resp.status < 300){
        return resp;
      }
      throw resp;
    },
    getResultStr: function(resp){
      return resp && resp.text?resp.text():new Promise(function(resolve,reject){
        resolve("");
      });
    },
    getResultJSON: function(resp){
      return resp.json();
    },
    toURLParams: function(obj){
      var keys = Object.keys(obj);
      var keyLength = keys.length;
      var str = "";
      while(keyLength--){
        var key = keys[keyLength];
        if(str !== ""){
          str += "&";
        }
        str += key + "=" + encodeURIComponent(obj[key]);
      }

      return str;
    },
    htmlEncode:function(value){
      /*global encodeURIComponent*/
      return encodeURIComponent(value);
    },
    htmlDecode:function(str){
      return str.replace(/&#?(\w+);/g, function(match, dec) {
        if(isNaN(dec)) {
          chars = {quot: 34, amp: 38, lt: 60, gt: 62, nbsp: 160, copy: 169, reg: 174, deg: 176, frasl: 47, trade: 8482, euro: 8364, Agrave: 192, Aacute: 193, Acirc: 194, Atilde: 195, Auml: 196, Aring: 197, AElig: 198, Ccedil: 199, Egrave: 200, Eacute: 201, Ecirc: 202, Euml: 203, Igrave: 204, Iacute: 205, Icirc: 206, Iuml: 207, ETH: 208, Ntilde: 209, Ograve: 210, Oacute: 211, Ocirc: 212, Otilde: 213, Ouml: 214, times: 215, Oslash: 216, Ugrave: 217, Uacute: 218, Ucirc: 219, Uuml: 220, Yacute: 221, THORN: 222, szlig: 223, agrave: 224, aacute: 225, acirc: 226, atilde: 227, auml: 228, aring: 229, aelig: 230, ccedil: 231, egrave: 232, eacute: 233, ecirc: 234, euml: 235, igrave: 236, iacute: 237, icirc: 238, iuml: 239, eth: 240, ntilde: 241, ograve: 242, oacute: 243, ocirc: 244, otilde: 245, ouml: 246, divide: 247, oslash: 248, ugrave: 249, uacute: 250, ucirc: 251, uuml: 252, yacute: 253, thorn: 254, yuml: 255, lsquo: 8216, rsquo: 8217, sbquo: 8218, ldquo: 8220, rdquo: 8221, bdquo: 8222, dagger: 8224, Dagger: 8225, permil: 8240, lsaquo: 8249, rsaquo: 8250, spades: 9824, clubs: 9827, hearts: 9829, diams: 9830, oline: 8254, larr: 8592, uarr: 8593, rarr: 8594, darr: 8595, hellip: 133, ndash: 150, mdash: 151, iexcl: 161, cent: 162, pound: 163, curren: 164, yen: 165, brvbar: 166, brkbar: 166, sect: 167, uml: 168, die: 168, ordf: 170, laquo: 171, not: 172, shy: 173, macr: 175, hibar: 175, plusmn: 177, sup2: 178, sup3: 179, acute: 180, micro: 181, para: 182, middot: 183, cedil: 184, sup1: 185, ordm: 186, raquo: 187, frac14: 188, frac12: 189, frac34: 190, iquest: 191, Alpha: 913, alpha: 945, Beta: 914, beta: 946, Gamma: 915, gamma: 947, Delta: 916, delta: 948, Epsilon: 917, epsilon: 949, Zeta: 918, zeta: 950, Eta: 919, eta: 951, Theta: 920, theta: 952, Iota: 921, iota: 953, Kappa: 922, kappa: 954, Lambda: 923, lambda: 955, Mu: 924, mu: 956, Nu: 925, nu: 957, Xi: 926, xi: 958, Omicron: 927, omicron: 959, Pi: 928, pi: 960, Rho: 929, rho: 961, Sigma: 931, sigma: 963, Tau: 932, tau: 964, Upsilon: 933, upsilon: 965, Phi: 934, phi: 966, Chi: 935, chi: 967, Psi: 936, psi: 968, Omega: 937, omega: 969}
          if (chars[dec] !== undefined){
            dec = chars[dec];
          }
        }
        return String.fromCharCode(dec);
      });
    },
    base64Decode: function(str){
      return decodeURIComponent(Array.prototype.map.call(atob(str), function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
    },
    parseResponse: function(rawResponse){
      return JSON.parse(rawResponse,function(key,val){
        if(typeof val === "string"){
          return api.htmlDecode(val);
        }
        return val;
      });
    },
    parseErrorMsg: function(rawResponse){
      try{
        var resp = this.parseResponse(rawResponse);
      } catch(e){
        return "Malformed server response";
      }
      var msg = null;

      if(resp){
        return resp.messageJSON || resp.exceptionMessage || resp.message || "Unexpected error has occurred";
      }

      return msg;
    },
    parsePaging: function(jsonResp){
      return {
        offset: jsonResp.pagination.offset,
        limit: jsonResp.pagination.limit,
        total: jsonResp.pagination.totalRecords
      };
    },
    createNextPageCall: function(requestFunction,reqParams,paging){
      if(paging.offset + paging.limit >= paging.total){
        return null;
      }
      reqParams = reqParams?reqParams:{};

      return function(){
        reqParams.paging = {
          limit: paging.limit,
          offset: paging.offset + paging.limit
        };
        return requestFunction(reqParams);
      };
    }
  };

  return api;
})();

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

Flybits.util.Geo = (function(){
  var geo = {
    _toDeg : function(rad) {
      return rad * 180 / Math.PI;
    },
    _toRad : function(deg) {
      return deg * Math.PI / 180;
    },
    getBoundingBox: function(latLngArr){
      if(!latLngArr || latLngArr.length < 3){
        throw new Flybits.Validation().addError("Invalid Argument","Must provide an array of lat,lng coordinates greater than 2.",{
          code: Flybits.Validation.type.INVALIDARG
        });
      }
      var latMin = latLngArr[0].lat;
      var latMax = latLngArr[0].lat;
      var lngMin = latLngArr[0].lng;
      var lngMax = latLngArr[0].lng;

      for(var i = 1; i < latLngArr.length; i++){
        var pt = latLngArr[i];
        latMin = pt.lat < latMin? pt.lat:latMin;
        latMax = pt.lat > latMax? pt.lat:latMax;
        lngMin = pt.lng < lngMin? pt.lng:lngMin;
        lngMax = pt.lng > lngMax? pt.lng:lngMax;
      }

      return {
        min: {
          lat: latMin,
          lng: lngMin
        },
        max: {
          lat: latMax,
          lng: lngMax
        }
      };
    },
    getCenter: function(latLngArr){
      if(!latLngArr || latLngArr.length < 3){
        throw new Flybits.Validation().addError("Invalid Argument","Must provide an array of lat,lng coordinates greater than 2.",{
          code: Flybits.Validation.type.INVALIDARG
        });
      }
      var bounds = this.getBoundingBox(latLngArr);
      return {
        lat: (bounds.max.lat + bounds.min.lat) / 2,
        lng: (bounds.max.lng + bounds.min.lng) / 2
      };
    },
    getBearing: function(pt1,pt2){
      var dLng = (pt2.lng-pt1.lng);
      var y = Math.sin(dLng) * Math.cos(pt2.lat);
      var x = Math.cos(pt1.lat)*Math.sin(pt2.lat) - Math.sin(pt1.lat)*Math.cos(pt2.lat)*Math.cos(dLng);
      var brng = this._toDeg(Math.atan2(y, x));
      return 360 - ((brng + 360) % 360);
    }
  };

  return geo;
})();

Flybits.util.Obj = (function(){
  var s4 = function(){
    return Math.floor((1 + Math.random()) * 0x10000)
               .toString(16)
               .substring(1);
  };

  var obj = {
    extend: function(destination,source){
      if(typeof $ === 'function' && typeof $.extend === 'function'){
        return $.extend(true,destination,source);
      }
      if(typeof _ === 'function' && typeof _.extend === 'function'){
        return _.extend(destination,source);
      }

      for (var property in source) {
        if (source[property] && source[property].constructor &&
            source[property].constructor === Object) {
          destination[property] = destination[property] || {};
          arguments.callee(destination[property], source[property]);
        } else {
          destination[property] = source[property];
        }
      }
      return destination;
    },
    guid:function(tuples){
      var str = 'js';
      if(tuples && tuples > 0){
        for(var i = 0; i < tuples; i++){
          str += str !== 'js'?'-'+s4():s4();
        }
        return str;
      }
      return 'js' + s4() + s4() + '-' + s4() + '-' + s4() + '-' +
           s4() + '-' + s4() + s4() + s4();
    },
    removeObject:function(arr,obj,findCallback){
      var index = arr.indexOf(obj);

      if(findCallback){
        var objs = arr.filter(findCallback);
        if(objs.length > 0){
          index = arr.indexOf(objs[0]);
        }
      }

      if(index >= 0){
        return arr.splice(index,1);
      }
      return arr;
    },
  };

  return obj;
})();

/**
 * Interface for implementing context plugins.
 * @memberof Flybits.interface
 * @interface
 */
Flybits.interface.ContextPlugin = {
  /**
   * Checks for availability of this plugin on the current platform.
   * @function
   * @memberof Flybits.interface.ContextPlugin
   * @return {external:Promise<undefined,Flybits.Validation>} Promise that resolves without value if this context plugin is supported on the current platform.
   */
  isSupported: function(){},
  /**
   * Retrieves current value of this particular context plugin.
   * @function
   * @memberof Flybits.interface.ContextPlugin
   * @return {external:Promise<Object,Flybits.Validation>} Promise that resolves with context plugin specific data structure representing current value of context plugin.
   */
  getState: function(){},

  /**
   * Converts context value object into the server expected format.
   * @function
   * @memberof Flybits.interface.ContextPlugin
   * @param {Object} contextValue
   * @return {Object} Expected server format of context value.
   */
  _toServerFormat: function(contextValue){}
};

/**
 * Interface for models which have localized properties.
 * @memberof Flybits.interface
 * @interface
 */
Flybits.interface.Localizable = {
  /**
   * Parses server localized properties for a single locale object. For instance if a model has localized properties {'en':{},'fr':{}}, each object mapped to each locale key would pass through this function.
   * @function
   * @instance
   * @memberof Flybits.interface.Localizable
   * @param {Object} serverObj server locale object containing localized properties.
   * @return {Object} Server localized properties of a locale key parsed to SDK equivalent objects.
   */
  _fromLocaleJSON: function(serverObj){},
  /**
   * Maps SDK localized objects back to server equivalent objects.
   * @function
   * @instance
   * @memberof Flybits.interface.Localizable
   * @param {Object} appObj application locale object containing localized properties
   * @return {Object} SDK localized properties of a locale key parsed to server equivalent objects.
   */
  _toLocaleJSON: function(appObj){}
};

/**
 * Interface for SDK models that are abstracted from server models.
 * @memberof Flybits.interface
 * @interface
 */
Flybits.interface.Serializable = {
  /**
   * Parses raw server models into SDK model properties that implement this interface.
   * @function
   * @instance
   * @memberof Flybits.interface.Serializable
   * @param {Object} serverObj Raw server model.
   */
  fromJSON: function(serverObj){},
  /**
   * Maps SDK model properties to abstracted server models.
   * @function
   * @instance
   * @memberof Flybits.interface.Serializable
   * @returns {Object} Raw server model.
   */
  toJSON: function(){}
};

/**
 * Interface for models that can be tagged in the Flybits ecosystem.
 * @see Flybits.Tag
 * @memberof Flybits.interface
 * @interface
 */
Flybits.interface.Taggable = {
  /**
   * Convenience function to check if model is associated with a particular {@link Flybits.Tag}
   * @function
   * @instance
   * @memberof Flybits.interface.Taggable
   * @param {string} tagID ID of the {@link Flybits.Tag} model.
   * @returns {boolean} `true` if model is associated with specified `tagID`, `false` if otherwise.
   */
  hasTag: function(tagID){},
  /**
   * Function to retrieve actual {@link Flybits.Tag} models associated with model.
   * @function
   * @instance
   * @memberof Flybits.interface.Taggable
   * @returns {Flybits.Tag[]} Array of {@link Flybits.Tag} models that are associated with model.
   */
  getTags: function(){}
};

/**
 * @classdesc Base class from which all core Flybits models are extended.
 * @class
 * @param {Object} serverObj Raw Flybits core model `Object` directly from API.
 */
var BaseModel = (function(){
  var BaseModel = function(serverObj){
    /**
     * @instance
     * @memberof BaseModel
     * @member {string} id Parsed ID of the Flybits core model.
     */
    this.id = null;

    if(serverObj){
      this.id = serverObj.id;
    }
  };
  BaseModel.prototype = {
    reqKeys: {
      id: 'id'
    },
    implements: function(interfaceName){
      if(!this._interfaces){
        this._interfaces = [];
      }
      this._interfaces.push(interfaceName);
    }
  };

  return BaseModel;
})();

/**
 * @classdesc Flybits core Moment model.  A Moment is the registered specification of a Flybits enabled microservice.  It is the content type that can be instantiated and controlled within a Zone.
 * @class
 * @memberof Flybits
 * @extends BaseModel
 * @implements {Flybits.interface.Serializable}
 * @param {Object} serverObj Raw Flybits core model `Object` directly from API.
 */
Flybits.Moment = (function(){
  var Moment = function(serverObj){
    BaseModel.call(this,serverObj);
    if(serverObj){
      this.fromJSON(serverObj);
    }
  };
  Moment.prototype = Object.create(BaseModel.prototype);
  Moment.prototype.constructor = Moment;
  Moment.prototype.implements('Serializable');

  /**
   * @memberof Flybits.Moment
   * @constant {number} MASK_ANDROID Bit mask for the `supportedDevices` bit flag indicating Android support.
   */
  Moment.prototype.MASK_ANDROID = Moment.MASK_ANDROID = 2;
  /**
   * @memberof Flybits.Moment
   * @constant {number} MASK_IOS Bit mask for the `supportedDevices` bit flag indicating iOS support.
   */
  Moment.prototype.MASK_IOS = Moment.MASK_IOS = 1;
  /**
   * @memberof Flybits.Moment
   * @constant {string} RENDERTYPE_NATIVE Render type indicating Moment provides an end-user interface located at the `clientURL`
   */
  Moment.prototype.RENDERTYPE_NATIVE = Moment.RENDERTYPE_NATIVE = 'native';
  /**
   * @memberof Flybits.Moment
   * @constant {string} RENDERTYPE_HTML Render type indicating Moment has no end-user interface and consumers must implement their own interface and consume Moment content from their APIs directly.
   */
  Moment.prototype.RENDERTYPE_HTML = Moment.RENDERTYPE_HTML = 'html';
  /**
   * @memberof Flybits.Moment
   * @constant {string} RENDERTYPE_NONE Render type indicating that the Moment is made to be a background service and not meant for consumption by end-users directly.
   */
  Moment.prototype.RENDERTYPE_NONE = Moment.RENDERTYPE_NONE = 'none';

  Moment.prototype.fromJSON = function(serverObj){
    var obj = this;
    /**
     * @instance
     * @memberof Flybits.Moment
     * @member {string} name Registered name of the Moment (content type).
     */
    this.name = serverObj.name;
    /**
     * @instance
     * @memberof Flybits.Moment
     * @member {string} icon URL of the Moment's icon.
     */
    this.icon = serverObj.icon;
    /**
     * @instance
     * @memberof Flybits.Moment
     * @member {string} baseNotifyURL API endpoint to which the Flybits core will notify the Moment server of changes to the Moment and its instances within the Flybits ecosystem.
     */
    this.baseNotifyURL = serverObj.notifyUrl;
    /**
     * @instance
     * @memberof Flybits.Moment
     * @member {string} manageURL URL of the HTML based editing application that is used to configure instances of the Moment known as a MomentInstance.
     */
    this.manageURL = serverObj.editUrl;
    /**
     * @instance
     * @memberof Flybits.Moment
     * @member {string} clientURL If this is Moment has been registered as an HTML based Moment this is the URL of the HTML based end-client application to which end clients will consume the contents of the instances of this Moment.  If this Moment was registered as being a natively rendered Moment, this is the base path for API endpoints used to consume the contents of the instances of this Moment.
     */
    this.clientURL = serverObj.launchUrl;
    /**
     * @instance
     * @memberof Flybits.Moment
     * @member {string} androidPkg Registered key to indicate to Android end-clients the type of native Moment as to allow for the correct rendering of Moment type.
     */
    this.androidPkg = serverObj.androidPackageName;
    /**
     * @instance
     * @memberof Flybits.Moment
     * @member {string} iosPkg Registered key to indicate to iOS end-clients the type of native Moment as to allow for the correct rendering of Moment type.
     */
    this.iosPkg = serverObj.iosPackageName;
    /**
     * @instance
     * @memberof Flybits.Moment
     * @member {string} privateKey Shared private key between Flybits core and Moment server to be used for the verification of authorization claims.  This is generated by the Flybits core upon Moment registration and is only visible to the creator or the Moment.
     */
    this.privateKey = serverObj.sharedKey;
    /**
     * @instance
     * @memberof Flybits.Moment
     * @member {string} ownerID ID of the Flybits `User` model who created the Moment.
     */
    this.ownerID = serverObj.ownerId;
    /**
     * @instance
     * @memberof Flybits.Moment
     * @member {string} status Publish status of the Moment indicating what state of creation, submission, and approval.
     */
    this.status = serverObj.status;
    /**
     * @instance
     * @memberof Flybits.Moment
     * @member {string} type After creation, Moment type stays in `development` until the Moment is approved at which it will change into an in `production` state.  Moments still in development can only be seen and consumed by those who have created or have administrative access.
     */
    this.type = serverObj.type;
    /**
     * @instance
     * @memberof Flybits.Moment
     * @member {boolean} isProduction Boolean indicator of production state of Moment.
     */
    this.isProduction = serverObj.isProduction;
    /**
     * @instance
     * @memberof Flybits.Moment
     * @member {string} renderType String indicating what type of end-user client this Moment provides for end-user consumption.  Possible values include, {@link Flybits.Moment.RENDERTYPE_NATIVE}, {@link Flybits.Moment.RENDERTYPE_HTML}, and, {@link Flybits.Moment.RENDERTYPE_NONE}
     */
    this.renderType = serverObj.renditionType;
    /**
     * @instance
     * @memberof Flybits.Moment
     * @member {number} supportedDevices Bit flag indicating which platforms this moment supports.  The bit mask {@link Flybits.Moment.MASK_IOS} corresponds to the iOS platform.  The bit mask {@link Flybits.Moment.MASK_ANDROID} corresponds to the Android platform.  Masking constants can be found in this class.
     */
    this.supportedDevices = serverObj.supportedDeviceType;
  };

  Moment.prototype.toJSON = function(){
    var obj = this;
    var retObj = {
      name: this.name,
      icon: this.icon,
      notifyUrl: this.baseNotifyURL,
      editUrl: this.manageURL,
      launchUrl: this.clientURL,
      androidPackageName: this.androidPkg,
      iosPackageName: this.iosPkg,
      sharedKey: this.privateKey,
      ownerId: this.ownerID,
      status: this.status,
      type: this.type,
      isProduction: this.isProduction,
      renditionType: this.renderType,
      supportedDeviceType: this.supportedDevices
    };

    if(this.id){
      retObj.id = this.id;
    }

    return retObj;
  };

  return Moment;
})();

/**
 * @classdesc Flybits core MomentInstance model.  A model that represents an instance of {{@link Flybits.Moment}} in the Flybits ecosystem.
 * @class
 * @memberof Flybits
 * @extends BaseModel
 * @implements {Flybits.interface.Serializable}
 * @implements {Flybits.interface.Localizable}
 * @param {Object} serverObj Raw Flybits core model `Object` directly from API.
 */
Flybits.MomentInstance = (function(){
  /**
   * @typedef LocalizedObject
   * @memberof Flybits.MomentInstance
   * @type Object
   * @property {string} name Name of the instance. Initially this resource defaults to the value set in the registered Moment from which this model is instantiated from.
   * @property {string} desc Description of the instance.
   * @property {string} icon URL to icon resource of the instance.  Initially this resource defaults to the value set in the registered Moment from which this model is instantiated from.
   */

  var MomentInstance = function(serverObj){
    BaseModel.call(this,serverObj);
    if(serverObj){
      this.fromJSON(serverObj);
    }
  };
  MomentInstance.prototype = Object.create(BaseModel.prototype);
  MomentInstance.prototype.constructor = MomentInstance;
  MomentInstance.prototype.implements('Serializable');
  MomentInstance.prototype.implements('Localizable');

  MomentInstance.prototype._fromLocaleJSON = function(serverObj){
    var retObj = {
      name: serverObj.name,
      desc: serverObj.description,
      icon: serverObj.icon
    };

    return retObj;
  };

  MomentInstance.prototype._toLocaleJSON = function(appObj){
    var retObj = {
      name: appObj.name,
      description: appObj.desc,
      icon: appObj.icon
    };

    return retObj;
  };

  MomentInstance.prototype.fromJSON = function(serverObj){
    var obj = this;
    /**
     * @instance
     * @memberof Flybits.MomentInstance
     * @member {string} momentID ID of the {@link Flybits.Moment} from which this instance was created from.
     */
    this.momentID = serverObj.momentId;
    /**
     * @instance
     * @memberof Flybits.MomentInstance
     * @member {boolean} isConfirmed Flag set by the Moment server to indicate to the core when it deems the instance as having sufficient content.
     */
    this.isConfirmed = serverObj.isConfirmed;
    /**
     * @instance
     * @memberof Flybits.MomentInstance
     * @member {string} defaultLang Default locale of MomentInstance model. String is any possible key found in {@link https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes|ISO 639-1}.
     */
    this.defaultLang = serverObj.defaultLanguage;
    /**
     * @instance
     * @memberof Flybits.MomentInstance
     * @member {Object} metadata Object which holds custom properties specified by tenant administrators.  This object allows for Flybits core models to be extended to include additional properties not in the default specification.
     */
    this.metadata = serverObj.metadata;

    /**
     * @instance
     * @memberof Flybits.MomentInstance
     * @member {Object} locales Map of model's available locale keys to {@link Flybits.MomentInstance.LocalizedObject} objects.  Possible locale strings can be found in {@link https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes|ISO 639-1}
     */
    this.locales = {};
    var localeKeys = serverObj.localizations?Object.keys(serverObj.localizations):[];
    localeKeys.forEach(function(key){
      obj.locales[key] = obj._fromLocaleJSON(serverObj.localizations[key]);
    });

    if(localeKeys.length > 0 && this.defaultLang){
      this.defaultLocaleObj = this.locales[this.defaultLang];
    }
  };

  MomentInstance.prototype.toJSON = function(){
    var obj = this;
    var retObj = {
      momentId: this.momentID,
      isConfirmed: this.isConfirmed,
      defaultLanguage: this.defaultLang,
      metadata: this.metadata,
      localizations:{}
    };

    if(this.id){
      retObj.id = this.id;
    }

    if(this.locales && Object.keys(this.locales).length > 0){
      var localeKeys = Object.keys(this.locales);
      localeKeys.forEach(function(key){
        retObj.localizations[key] = obj._toLocaleJSON(obj.locales[key]);
      });
    }

    return retObj;
  };

  return MomentInstance;
})();

/**
 * @classdesc Flybits core model that is used for organizational purposes.  Almost all other models can be tagged including Zones and Moments.
 * @class
 * @memberof Flybits
 * @extends BaseModel
 * @implements {Flybits.interface.Serializable}
 * @implements {Flybits.interface.Localizable}
 * @param {Object} serverObj Raw Flybits core model `Object` directly from API.
 */
Flybits.Tag = (function(){
  /**
   * @typedef LocalizedObject
   * @memberof Flybits.Tag
   * @type Object
   * @property {string} label Text value of Tag.
   * @property {string} icon URL to icon resource.
   */

  var ObjUtil = Flybits.util.Obj;

  var Tag = function(serverObj){
    BaseModel.call(this,serverObj);
    if(serverObj){
      this.fromJSON(serverObj);
    }
  };
  Tag.prototype = Object.create(BaseModel.prototype);
  Tag.prototype.constructor = Tag;
  Tag.prototype.implements('Serializable');
  Tag.prototype.implements('Localizable');

  /**
   * @memberof Flybits.Tag
   * @inheritdoc
   * @constant {Object} reqKeys Map of model properties that can be used to order by and search for this model.  Currently comprising of, `id`, `label`, `icon`, and `isVisible`
   */
  Tag.prototype.reqKeys = Tag.reqKeys = ObjUtil.extend({
    label: 'value',
    icon: 'icon',
    isVisible: 'isVisible'
  },BaseModel.prototype.reqKeys);

  Tag.prototype._fromLocaleJSON = function(serverObj){
    var retObj = {
      label: serverObj.value,
      icon: serverObj.icon
    };

    return retObj;
  };

  Tag.prototype._toLocaleJSON = function(appObj){
    var retObj = {
      value: appObj.label,
      icon: appObj.icon
    };

    return retObj;
  };

  Tag.prototype.fromJSON = function(serverObj){
    var obj = this;
    /**
     * @instance
     * @memberof Flybits.Tag
     * @member {boolean} isVisible Indicates whether or not this tag is visible to end user clients.  Sometimes tags are used for internal system organization.
     */
    this.isVisible = serverObj.isVisible;
    /**
     * @instance
     * @memberof Flybits.Tag
     * @member {string} defaultLang Default locale of tag.
     */
    this.defaultLang = serverObj.defaultLanguage;
    /**
     * @instance
     * @memberof Flybits.Tag
     * @member {string[]} zoneIDs IDs of Zones that are associated with this Tag.
     */
    this.zoneIDs = serverObj.zoneIds?serverObj.zoneIds:[];
    /**
     * @instance
     * @memberof Flybits.Tag
     * @member {string[]} zmiIDs IDs of ZoneMomentInstances that are associated with this Tag.
     */
    this.zmiIDs = serverObj.zoneMomentInstanceIds?serverObj.zoneMomentInstanceIds:[];

    /**
     * @instance
     * @memberof Flybits.Tag
     * @member {Object} locales Map of model's available locale keys to {@link Flybits.Tag.LocalizedObject} objects.  Possible locale strings can be found in {@link https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes|ISO 639-1}
     */
    this.locales = {};
    var localeKeys = serverObj.localizations?Object.keys(serverObj.localizations):[];
    localeKeys.forEach(function(key){
      obj.locales[key] = obj._fromLocaleJSON(serverObj.localizations[key]);
    });

    if(localeKeys.length > 0 && this.defaultLang){
      this.defaultLocaleObj = this.locales[this.defaultLang];
    }
  };

  Tag.prototype.toJSON = function(){
    var obj = this;
    var retObj = {
      isVisible: this.isVisible,
      defaultLanguage: this.defaultLang,
      zoneIds: this.zoneIDs,
      zoneMomentInstanceIds: this.zmiIDs,
      localizations:{}
    };

    if(this.id){
      retObj.id = this.id;
    }

    if(Object.keys(this.locales).length > 0){
      var localeKeys = Object.keys(this.locales);
      localeKeys.forEach(function(key){
        retObj.localizations[key] = obj._toLocaleJSON(obj.locales[key]);
      });
    }

    return retObj;
  };

  return Tag;
})();

/**
 * @classdesc Flybits core user model
 * @class
 * @memberof Flybits
 * @extends BaseModel
 * @implements {Flybits.interface.Serializable}
 * @param {Object} serverObj Raw Flybits core model `Object` directly from API.
 */
Flybits.User = (function(){
  var ObjUtil = Flybits.util.Obj;

  var User = function(serverObj){
    BaseModel.call(this,serverObj);
    if(serverObj){
      this.fromJSON(serverObj);
    }
  };
  User.prototype = Object.create(BaseModel.prototype);
  User.prototype.constructor = User;
  User.prototype.implements('Serializable');

  /**
   * @memberof Flybits.User
   * @constant {Object} reqKeys Map of model properties that can be used to order by and search for this model.  Currently comprising of, `id`, `email`, `firstName`, `lastName`, and `profileImg`
   */
  User.prototype.reqKeys = User.reqKeys = ObjUtil.extend({
    email: 'email',
    firstName: 'firstName',
    lastName: 'lastName',
    profileImg: 'icon'
  },BaseModel.prototype.reqKeys);

  User.prototype.fromJSON = function(serverObj){
    /**
     * @instance
     * @memberof Flybits.User
     * @member {string} email Registered email of the user.
     */
    this.email = serverObj.email;
    /**
     * @instance
     * @memberof Flybits.User
     * @member {string} firstName First name of the user.
     */
    this.firstName = serverObj.firstName;
    /**
     * @instance
     * @memberof Flybits.User
     * @member {string} lastName Last name of the user.
     */
    this.lastName = serverObj.lastName;
    /**
     * @instance
     * @memberof Flybits.User
     * @member {string} profileImg URL of the user's profile image.
     */
    this.profileImg = serverObj.icon;

    if(serverObj.credentialsJwt){
      this._authToken = serverObj.credentialsJwt;
    }
  };

  User.prototype.toJSON = function(){
    var retObj = {
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      icon: this.profileImg
    };

    if(this.id){
      retObj.id = this.id;
    }

    return retObj;
  };

  return User;
})();

/**
 * @classdesc Standard class used across the SDK to indicate the state of an asynchronous validation event or error.  It is comprised of a `state` which indicates the result of an operation and also an `errors` array should the `state` be `false`.  This class is often used as the error object returned from API operations and also as the result of model based validation which can incur multiple errors at once.
 * @class
 * @memberof Flybits
 */
Flybits.Validation = (function(){
  /**
   * @typedef ValidationError
   * @memberof Flybits.Validation
   * @type Object
   * @property {string} header Generally a short and broad error message
   * @property {string} message A more in depth explanation of the error.
   * @property {string} context This is populated if an error occurs that relates to one of the input properties of an operation and will be the property's key.
   * @property {number} code An internal error code indicating error type. This property is only populated when errors that can be discerned by the SDK occur. Errors that occur server side and cannot be discerned by the SDK will populate an HTTP status code in the `serverCode` property.  For instance, if you forget to supply required property the `code` property would be populated with `Flybits.Validation.type.MISSINGARG`.  On the other hand if there's a server outage, the `serverCode` would be populated with a 404 or 500.
   * @property {number} serverCode This is populated with an HTTP status code when a server side error occurs that cannot be discerned by the SDK.
   */

  var Validation = function(){
    /**
     * @instance
     * @memberof Flybits.Validation
     * @member {boolean} state Indicates the resultant state of an asynchronous task.
     */
    this.state = true;
    /**
     * @instance
     * @memberof Flybits.Validation
     * @member {Flybits.Validation.ValidationError[]} errors An array of errors that have accumulated because of an asynchronous task.
     */
    this.errors = [];
  };

  /**
   * @memberof Flybits.Validation
   * @member {Object} type A mapping of SDK error codes.
   * @constant
   * @property {number} MALFORMED This error is usually thrown when an input property supplied to an library operation is incorrectly formatted, or sometimes a server response is not recognized by the library.
   * @property {number} INVALIDARG This error is thrown when an input property supplied to an library operation is semantically incorrect.
   * @property {number} MISSINGARG This error is thrown when a required property is not supplied to an library operation.
   * @property {number} NOTFOUND Usually thrown when model retrieval has yielded no results with provided input parameters.
   * @property {number} CONNECTIONERROR Error thrown when the library loses connection to particular resources.
   * @property {number} UNAUTHENTICATED Error is thrown when library operation requires authentication and current session is not found or expired.
   * @property {number} RETRIEVALERROR This error is thrown when any retrieval library operation fails to complete.
   * @property {number} NOTSUPPORTED Error is thrown when an operation or entity is not supported by the library.
   * @property {number} UNEXPECTED Error is thrown when an operation failed due to unexpected behavior.
   */
  Validation.prototype.type = Validation.type = {};
  Validation.prototype.type.MALFORMED = Validation.type.MALFORMED = 1000;
  Validation.prototype.type.INVALIDARG = Validation.type.INVALIDARG = 1001;
  Validation.prototype.type.MISSINGARG = Validation.type.MISSINGARG = 1002;
  Validation.prototype.type.NOTFOUND = Validation.type.NOTFOUND = 1003;
  Validation.prototype.type.CONNECTIONERROR = Validation.type.CONNECTIONERROR = 1004;
  Validation.prototype.type.UNAUTHENTICATED = Validation.type.UNAUTHENTICATED = 1005;
  Validation.prototype.type.RETRIEVALERROR = Validation.type.RETRIEVALERROR = 1006;
  Validation.prototype.type.NOTSUPPORTED = Validation.type.NOTSUPPORTED = 1007;
  Validation.prototype.type.UNEXPECTED = Validation.type.UNEXPECTED = 1008;

  Validation.prototype = {
    /**
     * Used to add error objects to the `Validation` instance.
     * @function
     * @instance
     * @memberof Flybits.Validation
     * @param {string} header Generally a short and broad error message
     * @param {string} message A more in depth explanation of the error.
     * @param {Object} detailsObj Optional extra details about the error.
     * @param {string} detailsObj.context This is populated if an error occurs that relates to one of the input properties of an operation and will be the property's key.
     * @param {number} detailsObj.code An internal error code indicating error type. This property is only populated when errors that can be discerned by the SDK occur. Errors that occur server side and cannot be discerned by the SDK will populate an HTTP status code in the `serverCode` property.  For instance, if you forget to supply required property the `code` property would be populated with `Flybits.Validation.type.MISSINGARG`.  On the other hand if there's a server outage, the `serverCode` would be populated with a 404 or 500.
     * @param {number} detailsObj.serverCode This is populated with an HTTP status code when a server side error occurs that cannot be discerned by the SDK.
     * @return {Flybits.Validation} The `Validation` instance the method has been invoked upon to allow for method chaining.
     */
    addError: function(header,message,detailsObj){
      this.state = false;
      var retObj = {
        header: header,
        message: message
      };
      if(detailsObj){
        retObj.context = detailsObj.context;
        retObj.code = detailsObj.code;
        retObj.serverCode = detailsObj.serverCode
      }
      this.errors.push(retObj);

      return this;
    },
    /**
     * Used to retrieve the first available error if available.
     * @function
     * @instance
     * @memberof Flybits.Validation
     * @return {Flybits.Validation.ValidationError} First available error if validation state is `false` and errors have been found.
     * @return {null} `null` if no errors are available.
     */
    firstError: function(){
      if(this.errors.length > 0){
        return this.errors[0];
      }
      return null;
    }
  };

  return Validation;
})();

/**
 * @classdesc Flybits core Zone model.  A model that represents the main core model that contains and contextually manages content in the Flybits ecosystem.
 * @class
 * @memberof Flybits
 * @extends BaseModel
 * @implements {Flybits.interface.Serializable}
 * @implements {Flybits.interface.Localizable}
 * @implements {Flybits.interface.Taggable}
 * @param {Object} serverObj Raw Flybits core model `Object` directly from API.
 */
Flybits.Zone = (function(){
  /**
   * @typedef LocalizedObject
   * @memberof Flybits.Zone
   * @type Object
   * @property {string} name Name of the Zone.
   * @property {string} desc Description of the Zone.
   * @property {string} coverImg URL to image resource that represents the model.
   */
   /**
    * @typedef GeoPoint
    * @memberof Flybits.Zone
    * @type Object
    * @property {number} lat Latitude of geospatial point.
    * @property {number} lng Longitude of geospatial point.
    */

  var ObjUtil = Flybits.util.Obj;

  var Zone = function(serverObj){
    BaseModel.call(this,serverObj);
    if(serverObj){
      this.fromJSON(serverObj);
    }
  };
  Zone.prototype = Object.create(BaseModel.prototype);
  Zone.prototype.constructor = Zone;
  Zone.prototype.implements('Serializable');
  Zone.prototype.implements('Localizable');
  Zone.prototype.implements('Taggable');

  /**
   * @memberof Flybits.Zone
   * @constant {Object} reqKeys Map of model properties that can be used to order by and search for this model.  Currently comprising of, `id`, `creatorID`, `isPublished`, `name`, `description`, and `icon`.
   */
  Zone.prototype.reqKeys = Zone.reqKeys = ObjUtil.extend({
    creatorID: 'creatorId',
    isPublished: 'isPublished',
    name: 'name',
    description: 'description',
    icon: 'coverImg'
  },BaseModel.prototype.reqKeys);

  Zone.prototype._fromLocaleJSON = function(serverObj){
    var retObj = {
      name: serverObj.name,
      description: serverObj.description,
      coverImg: serverObj.icon
    };

    return retObj;
  };

  Zone.prototype._toLocaleJSON = function(appObj){
    var retObj = {
      name: appObj.name,
      description: appObj.description,
      icon: appObj.coverImg
    };

    return retObj;
  };

  Zone.prototype.fromJSON = function(serverObj){
    var obj = this;
    /**
     * @instance
     * @memberof Flybits.Zone
     * @member {string} creatorID ID of the {@link Flybits.User} who created the Zone.
     */
    this.creatorID = serverObj.creatorId;
    /**
     * @instance
     * @memberof Flybits.Zone
     * @member {Flybits.Zone.GeoPoint[][]} geofence A multi-dimensional array of latitude and longitude points that comprise a multi-polygonal shape that represents the physical manifestation of the Zone.  Most Zones will only have a single polygon so the length of the outer array will usually be one.
     */
    this.geofence = serverObj.shapes;
    /**
     * @instance
     * @memberof Flybits.Zone
     * @member {boolean} isPublished Flag indicating whether or not the content within the {@link Flybits.Zone} is ready/available for consumption.
     */
    this.isPublished = serverObj.isPublished;
    /**
     * @instance
     * @memberof Flybits.Zone
     * @member {string} defaultLang Default locale of Zone model. String is any possible key found in {@link https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes|ISO 639-1}.
     */
    this.defaultLang = serverObj.defaultLanguage;
    /**
     * @instance
     * @memberof Flybits.Zone
     * @member {string} timeZone Explicit time zone for the Zone. Possible strings can be found at {@link https://en.wikipedia.org/wiki/List_of_tz_database_time_zones| List of tz database time zones}
     */
    this.timeZone = serverObj.timeZone;
    /**
     * @instance
     * @memberof Flybits.Zone
     * @member {Object} metadata Object which holds custom properties specified by tenant administrators.  This object allows for Flybits core models to be extended to include additional properties not in the default specification.
     */
    this.metadata = serverObj.metadata;
    if(serverObj.analytics){
      this.stats = {
        visits: serverObj.analytics.totalUserVisits,
        favourited: serverObj.analytics.favoriteCount,
        momentCount: serverObj.analytics.zoneMomentCount
      };
    }
    if(serverObj.activeUserRelationship){
      /**
       * @instance
       * @memberof Flybits.Zone
       * @member {Object} userContextStats Contextual statistics that pertain to the Zone with respect to the authenticated User who has retrieved the model.
       */
      this.userContextStats = {
        /**
         * Flag to indicate if the current authenticated user has marked the Zone as a "favourite".
         * @alias userContextStats.isFavourite
         * @memberof! Flybits.Zone#
         * @type {boolean}
         */
        isFavourite: serverObj.activeUserRelationship.isFavorite,
        /**
         * Distance between authenticated User and the center of the Zone's {@link Flybits.Zone#geofence|geofence}.  Note this property is only populated if the `location` retrieval parameter is used to obtain the Zone.
         * @alias userContextStats.zoneCenterDistance
         * @memberof! Flybits.Zone#
         * @type {number}
         */
        zoneCenterDistance: serverObj.activeUserRelationship.distanceToZoneCenter,
        /**
         * Distance between authenticated User and the edge of the Zone's {@link Flybits.Zone#geofence|geofence}.  Note this property is only populated if the `location` retrieval parameter is used to obtain the Zone.
         * @alias userContextStats.zoneEdgeDistance
         * @memberof! Flybits.Zone#
         * @type {number}
         */
        zoneEdgeDistance: serverObj.activeUserRelationship.distanceToZoneEdge,
        /**
         * Flag indicating whether or not the authenticated User is within the Zone's {@link Flybits.Zone#geofence|geofence}.  Note this property is only populated if the `location` retrieval parameter is used to obtain the Zone.
         * @alias userContextStats.isInZone
         * @memberof! Flybits.Zone#
         * @type {number}
         */
        isInZone: serverObj.activeUserRelationship.isInsideZone
      };
    }
    /**
     * @instance
     * @memberof Flybits.Zone
     * @member {string[]} tagIDs An array of IDs pertaining to organizational tags in the Flybits ecosystem that is associated to the Zone.
     * @see Flybits.Tag
     */
    if(serverObj.tagIds && serverObj.tagIds.items.length > 0){
      this.tagIDs = serverObj.tagIds.items;
    } else{
      this.tagIDs = [];
    }

    /**
     * @instance
     * @memberof Flybits.Zone
     * @member {Object} locales Map of model's available locale keys to {@link Flybits.Zone.LocalizedObject} objects.  Possible locale strings can be found in {@link https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes|ISO 639-1}
     */
    this.locales = {};
    var localeKeys = serverObj.localizations?Object.keys(serverObj.localizations):[];
    localeKeys.forEach(function(key){
      obj.locales[key] = obj._fromLocaleJSON(serverObj.localizations[key]);
    });

    if(localeKeys.length > 0 && this.defaultLang){
      this.defaultLocaleObj = this.locales[this.defaultLang];
    }
  };

  Zone.prototype.toJSON = function(){
    var obj = this;
    var retObj = {
      creatorId: this.creatorID,
      shapes: this.geofence,
      isPublished: this.isPublished,
      defaultLanguage: this.defaultLang,
      metadata: this.metadata,
      timeZone: this.timeZone,
      localizations:{}
    };

    if(this.stats){
      retObj.analytics = {
        totalUserVisits: this.stats.visits,
        favoriteCount: this.stats.favourited,
        zoneMomentCount: this.stats.momentCount
      };
    }

    if(this.userContextStats){
      retObj.activeUserRelationship = {
        isFavorite: this.userContextStats.isFavourite,
        distanceToZoneCenter: this.userContextStats.zoneCenterDistance,
        distanceToZoneEdge: this.userContextStats.zoneEdgeDistance,
        isInsideZone: this.userContextStats.isInZone
      };
    }

    if(this.tagIDs){
      retObj.tagIds = {
        items: this.tagIDs,
        numItems: this.tagIDs.length
      };
    }

    if(this.id){
      retObj.id = this.id;
    }

    if(Object.keys(this.locales).length > 0){
      var localeKeys = Object.keys(this.locales);
      localeKeys.forEach(function(key){
        retObj.localizations[key] = obj._toLocaleJSON(obj.locales[key]);
      });
    }

    return retObj;
  };

  /**
   * @function hasTag
   * @override
   * @instance
   * @memberof Flybits.Zone
   */
  Zone.prototype.hasTag = function(tagID){
    var model = this;
    var tagLength = this.tagIDs.length;
    var tagMatch = false;
    while(tagLength--){
      if(model.tagIDs[tagLength] === tagID){
        tagMatch = true;
        break;
      }
    }
    return tagMatch;
  };

  /**
   * @function getTags
   * @override
   * @instance
   * @memberof Flybits.Zone
   */
  Zone.prototype.getTags = function(){
    return Flybits.api.Tag.getTags({
      ids: this.tagIDs
    });
  };

  return Zone;
})();

/**
 * @classdesc Flybits core ZoneMomentInstance model.  A model that represents the state of a {@link Flybits.MomentInstance} that has been associated to a {@link Flybits.Zone}.  It is also the gateway to retrieving data from the before mentioned {@link Flybits.MomentInstance}.
 * @class
 * @memberof Flybits
 * @extends BaseModel
 * @implements {Flybits.interface.Serializable}
 * @implements {Flybits.interface.Taggable}
 * @param {Object} serverObj Raw Flybits core model `Object` directly from API.
 */
Flybits.ZoneMomentInstance = (function(){
  var MomentInstance = Flybits.MomentInstance;
  var Moment = Flybits.Moment;
  var ObjUtil = Flybits.util.Obj;
  var Validation = Flybits.Validation;
  var Deferred = Flybits.Deferred;
  var Cfg = Flybits.cfg;

  var ZoneMomentInstance = function(serverObj){
    BaseModel.call(this,serverObj);
    if(serverObj){
      this.fromJSON(serverObj);
    }
  };
  ZoneMomentInstance.prototype = Object.create(BaseModel.prototype);
  ZoneMomentInstance.prototype.constructor = ZoneMomentInstance;
  ZoneMomentInstance.prototype.implements('Serializable');
  ZoneMomentInstance.prototype.implements('Taggable');

  /**
   * @memberof Flybits.ZoneMomentInstance
   * @constant {Object} reqKeys Map of model properties that can be used to order by and search for this model.  Currently comprising of, `id`, `isAutoRun`, `isPublished`, `name`, `supportedDevices`, and `renderType`.
   */
  ZoneMomentInstance.prototype.reqKeys = ZoneMomentInstance.reqKeys =  ObjUtil.extend({
    isAutoRun: 'isAutoRun',
    isPublished: 'isPublished',
    name: 'name',
    supportedDevices: 'supportedDeviceType',
    renderType: 'renditionType'
  },BaseModel.prototype.reqKeys);

  ZoneMomentInstance.prototype.fromJSON = function(serverObj){
    var obj = this;
    /**
     * @instance
     * @memberof Flybits.ZoneMomentInstance
     * @member {string} zoneID {@link Flybits.Zone} model ID to which the {@link Flybits.MomentInstance} with the ID `momentInstanceID` is associated with.
     */
    this.zoneID = serverObj.zoneId;
    /**
     * @instance
     * @memberof Flybits.ZoneMomentInstance
     * @member {string} momentInstanceID {@link Flybits.MomentInstance} model ID to which the {@link Flybits.Zone} with the ID `zoneID` is associated with.
     */
    this.momentInstanceID = serverObj.momentInstanceId;
    /**
     * @instance
     * @memberof Flybits.ZoneMomentInstance
     * @member {boolean} isAutoRun Flag to indicate to end clients who consume multiple ZoneMomentInstances within a {@link Flybits.Zone} to auto display this instance content first if set to `true`.
     */
    this.isAutoRun = serverObj.isAutoRun;
    /**
     * @instance
     * @memberof Flybits.ZoneMomentInstance
     * @member {number} order Numerical ordering of the ZoneMomentInstance within the {@link Flybits.Zone} with the ID `zoneID`.
     */
    this.order = serverObj.order;
    /**
     * @instance
     * @memberof Flybits.ZoneMomentInstance
     * @member {boolean} isPublished Flag indicating whether or not the content within the {@link Flybits.MomentInstance} is ready/available for consumption.
     */
    this.isPublished = serverObj.isPublished;
    if(serverObj.auxiliaryAncestorProperties){
      /**
       * @instance
       * @memberof Flybits.ZoneMomentInstance
       * @member {Flybits.MomentInstance} momentInstance The {@link Flybits.MomentInstance} whose state within a {@link Flybits.Zone} which this model represents.
       */
      this.momentInstance = new MomentInstance(serverObj.auxiliaryAncestorProperties);
      this.momentInstance.id = this.momentInstanceID;
      /**
       * @instance
       * @memberof Flybits.ZoneMomentInstance
       * @member {Flybits.Moment} moment The {@link Flybits.Moment} model from which the {@link Flybits.MomentInstance} this model represents was created.
       */
      this.moment = new Moment(serverObj.auxiliaryAncestorProperties);
      this.moment.id = this.momentInstance.momentID;
    }
    /**
     * @instance
     * @memberof Flybits.ZoneMomentInstance
     * @member {string[]} tagIDs An array of IDs pertaining to organizational tags in the Flybits ecosystem that is associated to this instance.
     * @see Flybits.Tag
     */
    this.tagIDs = serverObj.tagIds?serverObj.tagIds:[];
  };

  ZoneMomentInstance.prototype.toJSON = function(){
    var obj = this;
    var auxObj = {};
    if(this.momentInstance){
      auxObj = ObjUtil.extend(auxObj,this.momentInstance.toJSON());
    }
    if(this.moment){
      auxObj = ObjUtil.extend(auxObj,this.moment.toJSON());
    }
    var retObj = {
      zoneId: this.zoneID,
      momentInstanceId: this.momentInstanceID,
      isAutoRun: this.isAutoRun,
      order: this.order,
      isPublished: this.isPublished,
      auxiliaryAncestorProperties: auxObj,
      tagIds: this.tagIDs
    };

    if(this.id){
      retObj.id = this.id;
    }

    return retObj;
  };

  /**
   * Convenience function used to retrieve an access token from the Flybits core to be used as an authorization claim to consume data from the {@link Flybits.MomentInstance} that is associated with this model.
   * @function getAccessToken
   * @instance
   * @memberof Flybits.ZoneMomentInstance
   * @returns {external:Promise<string|Flybits.Validation>} Promise that resolves with an access token string and rejects with a validation object.
   */
  ZoneMomentInstance.prototype.getAccessToken = function(){
    if(!this.id){
      throw new Validation().addError('Malformed Model','This ZoneMomentInstance is missing an ID.',{
        code: Validation.type.MALFORMED,
        context: 'id'
      });
    }
    return Flybits.api.ZoneMomentInstance.getAccessToken(this.id);
  };

  /**
   * Convenience function to retrieve {@link Flybits.Moment} property indicating registered render type.
   * @function getRenderType
   * @instance
   * @memberof Flybits.ZoneMomentInstance
   * @returns {string} Render type of registered Moment.  Possible render types found as constants in {@link Flybits.Moment}.
   */
  ZoneMomentInstance.prototype.getRenderType = function(){
    if(!this.moment){
      throw new Validation().addError('Malformed Model','This ZoneMomentInstance is missing a Moment object and its renderType.',{
        code: Validation.type.MALFORMED,
        context: 'moment'
      });
    }
    return this.moment.renderType;
  };

  ZoneMomentInstance.prototype.isCoreMoment = function(){
    if(this.moment){
      var pkg = this.moment.androidPkg || this.moment.iosPkg;
      return Cfg.coreMoments[pkg];
    }
    return false;
  };

  /**
   * Retrieves the URL to the end-client html application for the consumption of this Moment content, if it is supported.
   * @function getClientURL
   * @instance
   * @memberof Flybits.ZoneMomentInstance
   * @returns {external:Promise<string,Flybits.Validation>} Promise that resolves with URL to HTML resource if an HTML client is supported.  Otherwise, the promise is rejected with a {@link Flybits.Validation} model.  This convenience function automatically retrieves an access token and appends it a GET parameter to the URL.  That is to say simply invoking this function and placing its result into an `iframe` will allow access to the Moment contents.  Of course, this function can only work if user is already authenticated with the Flybits core.
   */
  ZoneMomentInstance.prototype.getClientURL = function(){
    var model = this;
    var def = new Deferred();
    var renderType = this.getRenderType();
    if(renderType !== Moment.RENDERTYPE_HTML && this.isCoreMoment()){
      this.getAccessToken().then(function(token){
        var url = model.moment.manageURL + "/m.html?payload="+token;
        def.resolve(url);
      }).catch(function(validationObj){
        def.reject(validationObj);
      });
    } else if(renderType !== Moment.RENDERTYPE_HTML){
      def.reject(new Validation().addError('Not Supported','HTML user interface does not exist.',{
        context: 'moment.renderType',
        code: Validation.type.NOTSUPPORTED
      }));
    } else{
      this.getAccessToken().then(function(token){
        var url = model.moment.clientURL + "?payload="+token;
        def.resolve(url);
      }).catch(function(validationObj){
        def.reject(validationObj);
      });
    }

    return def.promise;
  };

  /**
   * @function hasTag
   * @override
   * @instance
   * @memberof Flybits.ZoneMomentInstance
   */
  ZoneMomentInstance.prototype.hasTag = function(tagID){
    var model = this;
    var tagLength = this.tagIDs.length;
    var tagMatch = false;
    while(tagLength--){
      if(model.tagIDs[tagLength] === tagID){
        tagMatch = true;
        break;
      }
    }
    return tagMatch;
  };

  /**
   * @function getTags
   * @override
   * @instance
   * @memberof Flybits.ZoneMomentInstance
   */
  ZoneMomentInstance.prototype.getTags = function(){
    return Flybits.api.Tag.getTags({
      ids: this.tagIDs
    });
  };

  return ZoneMomentInstance;
})();

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

/**
 * This is a utility class, do not use constructor.
 * @class
 * @classdesc Utility function to manage store and manage {@link Flybits.User} session.
 * @memberof Flybits.store
 */
Flybits.store.Session = (function(){
  var BrowserUtil = Flybits.util.Browser;
  var ApiUtil = Flybits.util.Api;
  var Validation = Flybits.Validation;
  var Deferred = Flybits.Deferred;
  var Cfg = Flybits.cfg;

  var Session = {
    constants: {
      REMEMBERME: '_rememberMe'
    },
    /**
     * @instance
     * @memberof Flybits.store.Session
     * @member {Flybits.User} user {@link Flybits.User|User} currently authenticated to Flybits core.  Set to `null` if session is explicitly cleared such as after logout.
     */
    user: null,
    deviceID: null,
    userToken: null,
    _userTokenRetrievedAt: null,
    _userTokenExpiry: null,
    hasRememberMe: function(){
      return Flybits.store.Property.get(Cfg.store.REMEMBERME);
    },
    /**
     *
     * @memberof Flybits.store.Session
     * @function resolveSession
     * @param {boolean} [doNotCheckServer=false] Flag to specify whether or not session resolution should make an AJAX call to verify session or simply draw from cache. `true` to bypass server and resolve session from cache, `false` if otherwise.  Note: `false` to check the server is the most accurate and also the default.
     * @returns {external:Promise<Flybits.User,undefined>} Promise that resolves with the {@link Flybits.User} model of authenticated User if session exists.  Promise rejects with no value if session is not available.
     */
    resolveSession: function(doNotCheckServer){
      var session = this;
      var def = new Deferred();

      if(doNotCheckServer){
        if(this.user){
          def.resolve(this.user);
        } else{
          def.reject(new Validation().addError('Session not found.','',{
            code: Validation.type.UNAUTHENTICATED
          }));
        }
        return def.promise;
      }

      Flybits.api.User.getAccessToken()
        .then(function(token){
          def.resolve(session.user);
        }).catch(function(validation){
          var firstError = validation.firstError();
          if(firstError && firstError.serverCode && (firstError.serverCode === 403 || firstError.serverCode === 401)){
            session.clearSession();
            def.reject(new Validation().addError('Session not found.','',{
              code: Validation.type.UNAUTHENTICATED,
            }));
          } else{
            def.reject(validation);
          }
        });

      return def.promise;
    },
    setUserToken: function(token){
      this.userToken = token;

      if(token){
        var jwtData = ApiUtil.base64Decode(token.split('.')[1]);
        var jwt = JSON.parse(jwtData);
        this._userTokenExpiry = jwt.expiresAt?jwt.expiresAt*1000:0;
        this._userTokenRetrievedAt = new Date().getTime();
        Flybits.store.Property.set(Cfg.store.USERTOKEN,token);
        Flybits.store.Property.set(Cfg.store.USERTOKENEXP,this._userTokenExpiry);
      } else{
        Flybits.store.Property.set(Cfg.store.USERTOKEN,null);
        Flybits.store.Property.set(Cfg.store.USERTOKENEXP,null);
        this._userTokenExpiry = null;
        this._userTokenRetrievedAt = null;
      }
    },
    setSession: function(user){
      this.user = user;
      if(user._authToken){
        this.setUserToken(user._authToken);
      }
    },
    clearSession: function(){
      this.user = null;
      this.setUserToken(null);
    }
  };

  return Session;
})();

/**
 * @classdesc Abstract base class from which all context plugins are extended.
 * @memberof Flybits.context
 * @implements {Flybits.interface.ContextPlugin}
 * @abstract
 * @class ContextPlugin
 * @param {Object} opts Configuration object to override default configuration
 * @param {number} opts.refreshDelay {@link Flybits.context.ContextPlugin#refreshDelay}
 */
context.ContextPlugin = (function(){
  var Deferred = Flybits.Deferred;
  var Validation = Flybits.Validation;

  var ContextPlugin = function(opts){
    if(this.constructor.name === 'Object'){
      throw new Error('Abstract classes cannot be instantiated');
    }

    this._refreshTimeout = null;

    /**
     * @instance
     * @memberof Flybits.context.ContextPlugin
     * @member {number} [refreshDelay=60000] Delay in milliseconds before the next interval of context refreshing begins for this particular plugin.  Note that the timer starts after the previous interval's context refresh has completed.
     */
    this.refreshDelay = opts && opts.refreshDelay?opts.refreshDelay:this.refreshInterval.ONEMINUTE;

    /**
     * @instance
     * @memberof Flybits.context.ContextPlugin
     * @member {number} [maxStoreEntries=100] Maximum amount of entries this context type can store locally before old entries are flushed from the local store.
     */
    this.maxStoreSize = opts && opts.maxStoreSize?opts.maxStoreSize:80;

    /**
     * @instance
     * @memberof Flybits.context.ContextPlugin
     * @member {number} [maxStoreAge=86400000] Maximum age of an entry of this context type before it is flushed from the local store.  Default maximum age is 1 day old.
     */
    this.maxStoreAge = opts && opts.maxStoreAge?opts.maxStoreAge:86400000;

    /**
     * @instance
     * @memberof Flybits.context.ContextPlugin
     * @member {boolean} isServiceRunning flag indicating whether or not a context retrieval service is running for this context plugin.
     */
    this.isServiceRunning = false;

    /**
     * @instance
     * @memberof Flybits.context.ContextPlugin
     * @member {number} lastCollected Timestamp of the last context state retrieval and local storage;
     */
    this.lastCollected = -1;

    if(window.localforage){
      this._store = localforage.createInstance({
        name: this.TYPEID
      });
    } else {
      console.error('> WARNING ('+this.TYPEID+'): `localforage` dependency not found. Reverting to temporary in memory storage.')
      this._store = {
        contents: {},
        keys: function(){
          return Promise.resolve(Object.keys(this.contents));
        },
        removeItem: function(key){
          delete this.contents[key];
          return Promise.resolve();
        },
        setItem: function(key,item){
          this.contents[key] = item;
          return Promise.resolve(item);
        },
        getItem: function(key){
          var result = this.contents[key]?this.contents[key]:null;
          return Promise.resolve(result);
        },
        length: function(){
          return Promise.resolve(Object.keys(this.contents).length);
        }
      }
    }
  };
  ContextPlugin.prototype = {
    implements: function(interfaceName){
      if(!this._interfaces){
        this._interfaces = [];
      }
      this._interfaces.push(interfaceName);
    },
    /**
     * Starts a scheduled service that continuously retrieves context data for this plugin.
     * @instance
     * @memberof Flybits.context.ContextPlugin
     * @function startService
     * @return {Flybits.context.ContextPlugin} Reference to this context plugin to allow for method chaining.
     */
    startService: function(){
      this.stopService();

      var interval;
      interval = function(contextPlugin){
        contextPlugin.collectState().catch(function(e){}).then(function(){
          if(contextPlugin.isServiceRunning){
            contextPlugin._refreshTimeout = setTimeout(function(){
              interval(contextPlugin);
            },contextPlugin.refreshDelay);
          }
        });

        contextPlugin.isServiceRunning = true;
      };
      interval(this);

      return this;
    },
    /**
     * Stops the scheduled service that continuously retrieves context data for this plugin.
     * @instance
     * @memberof Flybits.context.ContextPlugin
     * @function stopService
     * @return {Flybits.context.ContextPlugin} Reference to this context plugin to allow for method chaining.
     */
    stopService: function(){
      this.isServiceRunning = false;
      window.clearTimeout(this._refreshTimeout);
      return this;
    },

    /**
     * @abstract
     * @memberof Flybits.context.ContextPlugin
     * @function getState
     * @see Flybits.interface.ContextPlugin.getState
     */
    /**
     * @abstract
     * @memberof Flybits.context.ContextPlugin
     * @function isSupported
     * @see Flybits.interface.ContextPlugin.isSupported
     */

    /**
     * Force the immediate retrieval of context state from this `ContextPlugin` once and place store it into the local storage for later reporting.
     * @instance
     * @memberof Flybits.context.ContextPlugin
     * @function collectState
     * @return {external:Promise<undefined,undefined>} Promise that resolves when this `ContextPlugin` has retrieved and stored its current state.
     */
    collectState: function(){
      var def = new Deferred();
      var plugin = this;
      var store = this._store;
      var storeLength = 0;

      store.length().then(function(length){
        storeLength = length;
        return plugin.getState();
      }).then(function(e){
        return plugin._saveState(e);
      }).then(function(){
        plugin.lastCollected = new Date().getTime();
        if(storeLength >= plugin.maxStoreSize){
          plugin._validateStoreState();
        }
        def.resolve();
      }).catch(function(e){
        console.error('>',plugin,e);
        def.reject();
      });

      return def.promise;
    },

    _validateStoreState: function(){
      var plugin = this;
      var def = new Deferred();
      var promises = [];
      var store = this._store;
      store.keys().then(function(result){
        var keys = result;
        var now = new Date().getTime();
        var accessCount = keys.length - plugin.maxStoreSize;

        keys.sort(function(a,b){
          return (+a)-(+b);
        });

        if(accessCount > 0){
          for(var i = 0; i < accessCount; i++){
            promises.push(store.removeItem(keys.shift()));
          }
        }

        while(keys.length > 0 && (now - keys[0]) >= plugin.refreshInterval.ONEDAY){
          promises.push(store.removeItem(keys.shift()));
        }

        Promise.settle(promises).then(function(){
          def.resolve();
        });
      }).catch(function(){
        def.reject();
      });

      return def.promise;
    },
    _fetchCollected: function(){
      var plugin = this;
      var def = new Deferred();
      var data = [];
      var keysToDelete = [];
      var store = this._store;
      store.keys().then(function(keys){
        var assembleData;
        assembleData = function(){
          if(keys.length <= 0){
            def.resolve({
              data: data,
              keys: keysToDelete
            });
            return;
          }
          var curKey = keys.pop();
          keysToDelete.push(curKey);

          store.getItem(curKey).then(function(item){
            data.push({
              timestamp: Math.round((+curKey)/1000),
              dataTypeID: plugin.TYPEID,
              value: plugin._toServerFormat(item)
            });
          }).catch(function(){}).then(function(){
            assembleData();
          });
        };
        assembleData();
      }).catch(function(e){
        def.reject(e);
      });

      return def.promise;
    },
    _deleteCollected: function(keys){
      var store = this._store;
      var def = new Deferred();
      var deleteData;
      deleteData = function(){
        if(keys.length <= 0){
          def.resolve();
          return;
        }
        var curKey = keys.pop();
        store.removeItem(curKey).catch(function(){}).then(function(){
          deleteData();
        });
      };
      deleteData();

      return def.promise;
    },
    _saveState: function(value){
      var time = new Date().getTime();
      return this._store.setItem(time,value);
    },
  };

  /**
   * @memberof Flybits.context.ContextPlugin
   * @member {Object} refreshInterval Common context refresh delays.
   * @constant
   * @property {number} ONETIME Indicates the value of the context should be fetched only a single time and should not be refreshed on a continuous interval.
   * @property {number} THIRTYSECONDS Common refresh delay of 30 seconds.
   * @property {number} ONEMINUTE Common refresh delay of 1 minute.
   * @property {number} ONEHOUR Common refresh delay of 1 hour.
   */
  ContextPlugin.prototype.refreshInterval = ContextPlugin.refreshInterval = {};
  ContextPlugin.prototype.refreshInterval.ONETIME = ContextPlugin.refreshInterval.ONETIME = -42;
  ContextPlugin.prototype.refreshInterval.THIRTYSECONDS = ContextPlugin.refreshInterval.THIRTYSECONDS = 1000*30;
  ContextPlugin.prototype.refreshInterval.ONEMINUTE = ContextPlugin.refreshInterval.ONEMINUTE = 1000*60*1;
  ContextPlugin.prototype.refreshInterval.ONEHOUR = ContextPlugin.refreshInterval.ONEHOUR = 1000*60*60;
  ContextPlugin.prototype.refreshInterval.ONEDAY = ContextPlugin.refreshInterval.ONEDAY = 1000*60*60*24;

  /**
   * @memberof Flybits.context.ContextPlugin
   * @member {string} TYPEID String descriptor to uniquely identify context data type on the Flybits context gateway.
   */
  ContextPlugin.prototype.TYPEID = ContextPlugin.TYPEID = 'ctx.sdk.generic';

  ContextPlugin.prototype.implements('ContextPlugin');

  return ContextPlugin;
})();

/**
 * @class Connectivity
 * @classdesc Utility class to retrieve state of browser connectivity.
 * @extends Flybits.context.ContextPlugin
 * @memberof Flybits.context
 * @param {Flybits.context.Connectivity.Options} opts Configuration object to override default configuration
 */
context.Connectivity = (function(){
  /**
   * @typedef ConnectionState
   * @memberof Flybits.context.Connectivity
   * @type Object
   * @property {number} state Numerical state of connectivity. 0 for disconnected and 1 for connected.
   */
   /**
    * @typedef Options
    * @memberof Flybits.context.Connectivity
    * @type Object
    * @property {boolean} hardCheck=false Flag to indicate whether or not a HTTP network request is to be used to determine network connectivity as opposed to using browser's `navigator.onLine` property. If the browser does not support `navigator.onLine` a network request based connectivity check will be performed regardless of the state of this flag.
    * @property {number} refreshDelay {@link Flybits.context.ContextPlugin#refreshDelay}
    */
  var Deferred = Flybits.Deferred;
  var ObjUtil = Flybits.util.Obj;

  var Connectivity = function(opts){
    context.ContextPlugin.call(this,opts);
    if(opts){
      this.opts = ObjUtil.extend({},this.opts);
      ObjUtil.extend(this.opts,opts);
    }
  };

  Connectivity.prototype = Object.create(context.ContextPlugin.prototype);
  Connectivity.prototype.constructor = Connectivity;

  /**
   * @memberof Flybits.context.Connectivity
   * @member {string} TYPEID String descriptor to uniquely identify context data type on the Flybits context gateway.
   */
  Connectivity.prototype.TYPEID = Connectivity.TYPEID = 'ctx.sdk.network';

  /**
   * Check to see if Connectivity retrieval is available on the current browser.
   * @memberof Flybits.context.Connectivity
   * @function isSupported
   * @override
   * @returns {external:Promise<undefined,Flybits.Validation>} Promise that resolves without value.  Promise rejects with a {@link Flybits.Validation} object with errors.
   */
  Connectivity.isSupported = Connectivity.prototype.isSupported = function(){
    var def = new Deferred();
    def.resolve();

    return def.promise;
  };

  /**
   * Retrieve browser's current connectivity status.
   * @memberof Flybits.context.Connectivity
   * @function getState
   * @override
   * @returns {external:Promise<Flybits.context.Connectivity.ConnectionState,Flybits.Validation>} Promise that resolves with {@link Flybits.context.Connectivity.ConnectionState|ConnectionState} object.  Promise rejects with a {@link Flybits.Validation} object with errors.
   */
  Connectivity.getState = Connectivity.prototype.getState = function(){
    var def = new Deferred();
    var plugin = this;
    if('onLine' in navigator && !this.opts.hardCheck){
      def.resolve({
        state: navigator.onLine?plugin.state.CONNECTED:plugin.state.DISCONNECTED
      });
    } else{
      fetch(Flybits.cfg.HOST+"/ping").then(function(resp){
        def.resolve({
          state: plugin.state.CONNECTED
        });
      }).catch(function(e){
        def.resolve({
          state: plugin.state.DISCONNECTED
        });
      });
    }

    return def.promise;
  };

  /**
   * Converts context value object into the server expected format.
   * @function
   * @memberof Flybits.context.Connectivity
   * @function _toServerFormat
   * @param {Object} contextValue
   * @return {Object} Expected server format of context value.
   */
  Connectivity._toServerFormat = Connectivity.prototype._toServerFormat = function(contextValue){
    return {
      connectionType: contextValue.state
    };
  };

  /**
   * @memberof Flybits.context.Connectivity
   * @member {Object} state Connection state constants.
   * @constant
   * @property {number} DISCONNECTED Indicates the state of being disconnected.
   * @property {number} CONNECTED Indicates the state of being connected.
   */
  Connectivity.state = Connectivity.prototype.state = {};
  Connectivity.state.DISCONNECTED = Connectivity.prototype.state.DISCONNECTED = -1;
  Connectivity.state.CONNECTED = Connectivity.prototype.state.CONNECTED = -99;

  /**
   * @memberof Flybits.context.Connectivity
   * @member opts
   * @type {Flybits.context.Connectivity.Options}
   */
  Connectivity.opts = Connectivity.prototype.opts = {
    hardCheck: false
  };

  return Connectivity;
})();

/**
 * @class Location
 * @classdesc Utility class to retrieve browser location.
 * @extends Flybits.context.ContextPlugin
 * @memberof Flybits.context
 * @param {Flybits.context.Location.Options} opts Configuration object to override default configuration
 */
context.Location = (function(){
  /**
   * @typedef Geoposition
   * @memberof Flybits.context.Location
   * @type Object
   * @property {Object} coords
   * @property {number} coords.latitude
   * @property {number} coords.longitude
   * @property {number} timestamp
   */
   /**
    * @typedef Options
    * @memberof Flybits.context.Location
    * @type Object
    * @property {number} maximumAge=1000*60*20
    * @property {number} refreshDelay {@link Flybits.context.ContextPlugin#refreshDelay}
    */
  var Deferred = Flybits.Deferred;
  var ObjUtil = Flybits.util.Obj;

  var Location = function(opts){
    context.ContextPlugin.call(this,opts);
    if(opts){
      this.opts = ObjUtil.extend({},this.opts);
      ObjUtil.extend(this.opts,opts);
    }
  };

  Location.prototype = Object.create(context.ContextPlugin.prototype);
  Location.prototype.constructor = Location;

  /**
   * @memberof Flybits.context.Location
   * @member {string} TYPEID String descriptor to uniquely identify context data type on the Flybits context gateway.
   */
  Location.prototype.TYPEID = Location.TYPEID = 'ctx.sdk.location';

  /**
   * Check to see if Location retrieval is available on the current browser.
   * @memberof Flybits.context.Location
   * @function isSupported
   * @override
   * @returns {external:Promise<undefined,Flybits.Validation>} Promise that resolves without value.  Promise rejects with a {@link Flybits.Validation} object with errors.  Possible errors can include the lack of support on webview/browser or the User explicitly denying Location retrieval.
   */
  Location.isSupported = Location.prototype.isSupported = function(){
    var def = new Deferred();

    if(navigator.geolocation){
      navigator.geolocation.getCurrentPosition(function(pos){
        def.resolve();
      },function(err){
        console.error('>',err);
        def.reject(new Flybits.Validation().addError('Location Sensing Not Supported',err.message?err.message:"User denied"));
      });
    } else{
      def.reject(new Flybits.Validation().addError('Location Sensing Not Supported',"Device GeoLocation API not found."));
    }

    return def.promise;
  };

  /**
   * Retrieve browser's current location.
   * @memberof Flybits.context.Location
   * @function getState
   * @override
   * @returns {external:Promise<Flybits.context.Location.Geoposition,Flybits.Validation>} Promise that resolves with browser's {@link Flybits.context.Location.Geoposition|Geoposition} object.  Promise rejects with a {@link Flybits.Validation} object with errors.  Possible errors can include the lack of support on webview/browser or the User explicitly denying Location retrieval.
   */
  Location.getState = Location.prototype.getState = function(){
    var def = new Deferred();

    navigator.geolocation.getCurrentPosition(function(pos){
      def.resolve({
        coords:{
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        },
        timestamp: pos.timestamp
      });
    },function(err){
      console.error('>',err);
      def.reject(new Flybits.Validation().addError('Location could not be resolved'));
    },this.opts);

    return def.promise;
  };

  /**
   * Converts context value object into the server expected format.
   * @function
   * @memberof Flybits.context.Location
   * @function _toServerFormat
   * @param {Object} contextValue
   * @return {Object} Expected server format of context value.
   */
  Location._toServerFormat = Location.prototype._toServerFormat = function(contextValue){
    return {
      lat: contextValue.coords.latitude,
      lng: contextValue.coords.longitude
    };
  };

  /**
   * @memberof Flybits.context.Location
   * @member opts
   * @type {Flybits.context.Location.Options}
   */
  Location.opts = Location.prototype.opts = {
    maximumAge: 1000 * 60 * 20
  };

  return Location;
})();

/**
 * This is a utility class, do not use constructor.
 * @class Manager
 * @classdesc Main manager to handle scheduled context retrieval from context sources and reporting to Flybits core.
 * @memberof Flybits.context
 */
context.Manager = (function(){
  var Deferred = Flybits.Deferred;
  var Validation = Flybits.Validation;
  var ObjUtil = Flybits.util.Obj;
  var ApiUtil = Flybits.util.Api;
  var Session = Flybits.store.Session;

  var contextManager = {
    /**
     * Array of registered context plugins.
     * @memberof Flybits.context.Manager
     * @member {Array<Flybits.context.ContextPlugin>} services
     */
    services: [],
    /**
     * @memberof Flybits.context.Manager
     * @member {number} reportDelay=60000 Delay in milliseconds before the next interval of context reporting begins.  Note that the timer starts after the previous interval's context reporting has completed.
     */
    reportDelay: 60000,
    _reportTimeout: null,
    /**
     * @memberof Flybits.context.Manager
     * @member {boolean} isReporting Flag indicating whether scheduled context reporting is enabled.
     */
    isReporting: false,

    /**
     * Used to register a context plugin with the manager to begin scheduled retrieval of context values.
     * @memberof Flybits.context.Manager
     * @function
     * @param {Flybits.context.ContextPlugin} contextPlugin Instance of a context plugin to be registered for scheduled retrieval and reporting.
     * @return {external:Promise<Flybits.context.ContextPlugin,Flybits.Validation>} Promise that resolves with the successfully registered context plugin if supported. Context plugin will now begin scheduled retrieval.
     */
    register: function(contextPlugin){
      var manager = this;
      var def = new Deferred();
      if(!(contextPlugin instanceof context.ContextPlugin)){
        def.reject(new Validation().addError('Invalid Context Plugin','Provided parameter was not a valid Flybits.context.ContextPlugin instance.',{
          code: Validation.type.NOTSUPPORTED,
          context: 'contextPlugin'
        }));
        return def.promise;
      }

      contextPlugin.isSupported().then(function(){
        if(contextPlugin.refreshDelay === contextPlugin.refreshInterval.ONETIME){
          contextPlugin.collectState().then(function(){
            manager.services.push(contextPlugin);
            def.resolve(contextPlugin);
          }).catch(function(e){
            def.reject(e);
          });
        } else{
          contextPlugin.startService();
          manager.services.push(contextPlugin);
          def.resolve(contextPlugin);
        }
      }).catch(function(e){
        def.reject(e);
      });

      return def.promise;
    },
    /**
     * Used to unregister a context plugin with the manager to and stop its scheduled retrieval of context values.
     * @memberof Flybits.context.Manager
     * @function
     * @param {Flybits.context.ContextPlugin} contextPlugin Instance of a context plugin to be unregistered and have its scheduled retrieval and reporting stopped.
     * @return {Flybits.context.ContextPlugin} Context plugin instance that was unregistered.
     */
    unregister: function(contextPlugin){
      if(contextPlugin instanceof context.ContextPlugin){
        ObjUtil.removeObject(this.services,contextPlugin);
        contextPlugin.stopService();
      }
      return contextPlugin;
    },
    /**
     * Unregisters all context plugins from the context manager.
     * @memberof Flybits.context.Manager
     * @function
     * @return {Flybits.context.Manager} Reference to the context manager to allow for method chaining.
     */
    unregisterAll: function(){
      this.stopAllServices();
      this.services = [];
      return this;
    },
    /**
     * Stops all scheduled retrieval services of registered context plugins.
     * @memberof Flybits.context.Manager
     * @function
     * @return {Flybits.context.Manager} Reference to the context manager to allow for method chaining.
     */
    stopAllServices: function(){
      var services = this.services;
      for (var i = 0; i < services.length; i++){
        services[i].stopService();
      }
      return this;
    },
    /**
     * Starts all scheduled retrieval services of registered context plugins.
     * @memberof Flybits.context.Manager
     * @function
     * @return {Flybits.context.Manager} Reference to the context manager to allow for method chaining.
     */
    startAllServices: function(){
      var services = this.services;
      for (var i = 0; i < services.length; i++){
        services[i].startService();
      }
      return this;
    },
    /**
     * Starts the scheduled service that continuously batch reports collected context data of registered context plugins.
     * @memberof Flybits.context.Manager
     * @function startReporting
     * @return {external:Promise<undefined,Flybits.Validation>} Promise that resolves without a return value and rejects with a common Flybits Validation model instance.
     */
    startReporting: function(){
      var def = new Deferred();
      var manager = this;
      manager.stopReporting();

      Session.resolveSession().then(function(user){
        var interval;
        interval = function(){
          manager.report().catch(function(e){}).then(function(){
            if(manager.isReporting){
              manager._reportTimeout = setTimeout(function(){
                interval();
              },manager.reportDelay);
            }
          });

          manager.isReporting = true;
        };
        interval();
        def.resolve();
      }).catch(function(e){
        def.reject(e);
      });

      return def.promise;
    },
    /**
     * Stops the scheduled service that continuously batch reports collected context data of registered context plugins.
     * @memberof Flybits.context.Manager
     * @function stopReporting
     * @return {Flybits.context.Manager} Reference to this context manager to allow for method chaining.
     */
    stopReporting: function(){
      this.isReporting = false;
      window.clearTimeout(this._reportTimeout);
      return this;
    },
    _gatherAllData: function(){
      var def = new Deferred();
      var services = this.services;
      var data = [];
      var serviceDeletions = [];
      var promises = [];

      for(var i = 0; i < services.length; i++){
        (function(service){
          var retrievalPromise = service._fetchCollected();
          promises.push(retrievalPromise);
          retrievalPromise.then(function(values){
            Array.prototype.push.apply(data,values.data);
            serviceDeletions.push({
              serviceRef: service,
              keys: values.keys
            });
          });
        })(services[i]);
      }

      Promise.settle(promises).then(function(){
        def.resolve({
          data: data,
          keys: serviceDeletions
        });
      });

      return def.promise;
    },
    _sendReport: function(accessToken,data){
      var def = new Deferred();
      var url = Flybits.cfg.CTXHOST;

      fetch(url,{
        method: 'POST',
        credentials: 'include',
        headers: {
          'X-Authorization': accessToken
        },
        body: JSON.stringify(data),
      }).then(ApiUtil.checkResult).then(ApiUtil.getResultStr).then(function(resultStr){
        def.resolve();
      }).catch(function(resp){
        ApiUtil.getResultStr(resp).then(function(resultStr){
          var parsedResp = ApiUtil.parseErrorMsg(resultStr);
          def.reject(new Validation().addError('Context report failed.',parsedResp,{
            serverCode: resp.status
          }));
        });
      });

      return def.promise;
    },
    _cleanupServices: function(serviceKeyArr){
      var def = new Deferred();
      var promises = [];

      for(var i = 0; i < serviceKeyArr.length; i++){
        (function(serviceKeyMap){
          promises.push(serviceKeyMap.serviceRef._deleteCollected(serviceKeyMap.keys));
        })(serviceKeyArr[i]);
      }

      Promise.settle(promises).then(function(){
        def.resolve();
      });

      return def.promise;
    },
    /**
     * Batch reports collected context data of registered context plugins.
     * @memberof Flybits.context.Manager
     * @function report
     * @return {external:Promise<undefined,Flybits.Validation>} Promise that resolves without a return value and rejects with a common Flybits Validation model instance.
     */
    report: function(){
      var manager = this;
      var def = new Deferred();
      var jwt = Session.userToken;
      var serviceCleanup = [];

      if(!jwt){
        def.reject();
        return def.promise;
      }

      this._gatherAllData().then(function(result){
        serviceCleanup = result.keys;
        return manager._sendReport(jwt,result.data);
      }).then(function(){
        return manager._cleanupServices(serviceCleanup);
      }).then(function(){
        def.resolve();
      }).catch(function(e){
        if(e instanceof Validation){
          def.reject(e);
        } else{
          def.reject(new Validation().addError('Context report failed.',e,{
            code: Validation.UNEXPECTED
          }));
        }
      });

      return def.promise;
    },
  };

  contextManager.reportDelay = Flybits.cfg.CTXREPORTDELAY;

  return contextManager;
})();

/**
 * This is a utility class, do not use constructor.
 * @class Tag
 * @classdesc API wrapper class for the retrieval of {@link Flybits.Tag} models from Flybits core.
 * @memberof Flybits.api
 */
Flybits.api.Tag = (function(){
  /**
   * Available request parameters to filter {@link Flybits.Tag} in the Flybits core.
   * @typedef RequestParams
   * @memberof Flybits.api.Tag
   * @type Object
   * @property {string} [id] ID of a {@link Flybits.Tag}.
   * @property {string[]} [ids] List of {@link Flybits.Tag} IDs.
   * @property {string} [zid] {@link Flybits.Zone} ID to which {@link Flybits.Tag|Tags} are associated with.
   * @property {string[]} [zids] List of {@link Flybits.Zone} IDs to which {@link Flybits.Tag|Tags} are associated with.
   * @property {string} [zmiID] {@link Flybits.ZoneMomentInstance} ID to which {@link Flybits.Tag|Tags} are associated with.
   * @property {string[]} [zmiIDs] List of {@link Flybits.ZoneMomentInstance} IDs to which {@link Flybits.Tag|Tags} are associated with.
   * @property {Flybits.api.Paging} [paging] Details to dictate which page, or subset, of results should be returned from the total records that match the query parameters.
   * @property {Object} [orderBy] Specification of server ordering of models requested.  Possible model properties are found in model map, {@link Flybits.Tag.reqKeys}
   * @property {string} orderBy.key String pertaining to a model property name by which to order server model response by.
   * @property {string} [orderBy.direction="ascending"] Direction of ordering based on specified `key`.  Possible values are `descending` or `ascending`
   * @property {Object} [search] Map of search parameters.  Structured as a map of  `{key:value,...}` pairs corresponding to model property name as a `key`, and possible property value as the `value`.  Possible properties to search over can be found in {@link Flybits.Tag.reqKeys}.
   */

  var ApiUtil = Flybits.util.Api;
  var Validation = Flybits.Validation;
  var Deferred = Flybits.Deferred;
  var Tag = Flybits.Tag;
  var Session = Flybits.store.Session;

  var lastPaging = null;

  var parseParams = function(reqParams){
    var req = {};
    if(!reqParams){
      return req;
    }

    if(reqParams.id || reqParams.ids){
      var idArr = reqParams.ids?reqParams.ids:[];
      if(reqParams.id){
        idArr.push(reqParams.id);
      }
      req.ids = idArr.join(';');
    }

    if(reqParams.zid || reqParams.zids){
      var zidArr = reqParams.zids?reqParams.zids:[];
      if(reqParams.zid){
        zidArr.push(reqParams.zid);
      }
      req.zoneids = zidArr.join(';');
    }

    if(reqParams.zmiID || reqParams.zmiIDs){
      var zmiIDArr = reqParams.zmiIDs?reqParams.zmiIDs:[];
      if(reqParams.zmiID){
        zmiIDArr.push(reqParams.zmiID);
      }
      req.zonemomentinstanceids = zmiIDArr.join(';');
    }

    if(reqParams.paging){
      if(!reqParams.paging.limit && !reqParams.paging.offset){
        throw new Validation().addError('Missing Argument','paging request parameter object must contain at least a limit or offset property.',{
          code: Validation.type.MISSINGARG
        });
      }
      if(reqParams.paging.limit){
        req.limit = reqParams.paging.limit;
      }
      if(reqParams.paging.offset){
        req.offset = reqParams.paging.offset;
      }
    }

    if(reqParams.orderBy){
      var key = reqParams.orderBy.key;

      if(!key){
        throw new Validation().addError('Missing Argument','orderBy requires a Tag model property key to order by.',{
          code: Validation.type.MISSINGARG,
          context: 'orderBy.key'
        });
      } else if(!Tag.reqKeys[key]){
        throw new Validation().addError('Invalid Argument','Tag does not contain or cannot be ordered by this property:'+key,{
          code: Validation.type.INVALIDARG,
          context: 'orderBy.key'
        });
      }
      key = Tag.reqKeys[key];
      var directionStr = reqParams.orderBy.direction?reqParams.orderBy.direction:'ascending';
      req.orderby = key + ":" + directionStr;
    }

    if(reqParams.search){
      var keys = Object.keys(reqParams.search);
      var keyLength = keys.length;
      var paramCache = {};
      var searchArr = [];
      var validation = new Validation();

      while(keyLength--){
        var curKey = keys[keyLength];
        var value = reqParams.search[curKey];
        if(!Tag.reqKeys[curKey]){
          validation.addError('Invalid Argument','Tag does not contain or cannot be searched by this property:'+curKey,{
            code: Validation.type.INVALIDARG,
            context: 'search'
          });
        }

        curKey = Tag.reqKeys[curKey];

        if(!paramCache[value]){
          paramCache[value] = curKey;
        } else{
          paramCache[value] += ";"+curKey;
        }
      }

      if(!validation.state){
        throw validation;
      }

      var values = Object.keys(paramCache);
      var valuesLength = values.length;
      while(valuesLength--){
        var curVal = values[valuesLength];
        var keyStr = paramCache[curVal];
        searchArr.push(curVal+':'+keyStr);
      }

      req.search = "search="+searchArr.join("&search=");
    }

    return req;
  };

  var tag = {
    /**
     * Helper to retrieve cached paging property.  After every API request for {@link Flybits.Tag} models, the static paging cache is replaced by the paging properties of the latest request.
     * @memberof Flybits.api.Tag
     * @function getPaging
     * @returns {Flybits.api.Paging} The last pagination object received from retrieving {@link Flybits.Tag|Tags}.
     */
    getPaging: function(){
      return lastPaging;
    },
    /**
     * Convenience function to search for available {@link Flybits.Tag} models in the Flybits ecosystem by `label` string.
     * @memberof Flybits.api.Tag
     * @function findTags
     * @param {string} str Search string to be used for search through {@link Flybits.Tag} labels.
     * @returns {external:Promise<Flybits.api.Result,Flybits.Validation>} Promise that resolves with a {@link Flybits.api.Result} object with a list of {@link Flybits.Tag} models that contain the specified search keyword within its `label` property.  Promise rejects with a {@link Flybits.Validation} object containing {@link Flybits.Validation.ValidationError|error} objects if the request has failed to complete.
     */
    findTags: function(str){
      return this.getTags({
        search: {
          label: str
        }
      });
    },
    /**
     * Retrieves {@link Flybits.Tag} with specified ID.
     * @memberof Flybits.api.Tag
     * @function getTag
     * @param {string} id ID of the {@link Flybits.Tag} model.
     * @returns {external:Promise<Flybits.Tag,Flybits.Validation>} Promise that resolves with {@link Flybits.Tag} with specified ID.  Promise rejects with a {@link Flybits.Validation} object containing {@link Flybits.Validation.ValidationError|error} objects if request has failed or if a {@link Flybits.Tag} was not found with supplied ID.
     */
    getTag: function(id){
      var api = this;
      var def = new Deferred();

      if(!id || id === ""){
        throw new Validation().addError('Missing Argument','No Tag ID was provided.',{
          code: Validation.type.MISSINGARG,
          context: 'id'
        });
      }

      this.getTags({id:id}).then(function(resultObj){
        var tags = resultObj.result;
        if(tags.length <= 0 && api.getPaging().total === 0){
          def.reject(new Validation().addError('Model Not Found','A Tag was not found with the supplied ID',{
            code: Validation.type.NOTFOUND,
            context: 'id'
          }));
        } else if(tags.length > 0){
          def.resolve(tags[0]);
        }
      }).catch(function(validation){
        def.reject(validation);
      });

      return def.promise;
    },
    /**
     * Retrieves {@link Flybits.Tag} models by specified request parameters.
     * @memberof Flybits.api.Tag
     * @function getTags
     * @param {Flybits.api.Tag.RequestParams} requestParams Request parameter object to filter {@link Flybits.Tag} models in the core.
     * @returns {external:Promise<Flybits.api.Result,Flybits.Validation>} Promise that resolves with a {@link Flybits.api.Result} object with a list of {@link Flybits.Tag} models that meet the request parameters.  Promise rejects with a {@link Flybits.Validation} object containing {@link Flybits.Validation.ValidationError|error} objects if request has failed.
     */
    getTags: function(requestParams){
      var def = new Deferred();
      var url = Flybits.cfg.HOST + Flybits.cfg.res.TAGS;
      var data = parseParams(requestParams);
      var deviceID = Session.deviceID;

      if(data.search){
        url += "?"+data.search;
        delete data.search;
      }

      data = ApiUtil.toURLParams(data);
      if(data !== ""){
        if(url.indexOf('?') < 0){
          url += "?";
        } else{
          url += "&";
        }
        url += data.toString();
      }

      fetch(url,{
        method: 'GET',
        credentials: 'include',
        headers: {
          ApiKey: Flybits.cfg.APIKEY,
          physicalDeviceId: deviceID,
          'flybits-sdk-version': Flybits.VERSION
        },
      }).then(ApiUtil.checkResult).then(ApiUtil.getResultStr).then(function(respStr){
        try{
          var resp = ApiUtil.parseResponse(respStr);
          var paging = ApiUtil.parsePaging(resp);
          lastPaging = paging;
        } catch(e){
          def.reject(new Validation().addError("Request Failed","Unexpected server response.",{
            code: Validation.type.MALFORMED
          }));
        }

        if(resp && resp.data && resp.data.length >= 0){
          var tags = resp.data.map(function(obj){
            try{
              return new Tag(obj);
            } catch(e){
              def.reject(new Validation().addError("Request Failed","Failed to parse server model.",{
                code: Validation.type.MALFORMED,
                context: resp.data[0]
              }));
            }
          });

          def.resolve({
            result: tags,
            nextPageFn: ApiUtil.createNextPageCall(Flybits.api.Tag.getTags,requestParams,paging)
          });
        } else{
          def.reject(new Validation().addError('Tags retrieval failed','Unexpected server response',{
            code: Validation.type.MALFORMED
          }));
        }
      }).catch(function(resp){
        ApiUtil.getResultStr(resp).then(function(resultStr){
          var parsedResp = ApiUtil.parseErrorMsg(resultStr);
          def.reject(new Validation().addError('Tags retrieval failed',parsedResp,{
            serverCode: resp.status
          }));
        });
      });

      return def.promise;
    }
  };

  return tag;
})();

/**
 * This is a utility class, do not use constructor.
 * @class User
 * @classdesc API wrapper class for the retrieval of {@link Flybits.User} models from Flybits core.
 * @memberof Flybits.api
 */
Flybits.api.User = (function(){
  /**
   * Available request parameters to filter {@link Flybits.User} in the Flybits core.
   * @typedef RequestParams
   * @memberof Flybits.api.User
   * @type Object
   * @property {string} [id] ID of a {@link Flybits.User}.
   * @property {string[]} [ids] List of {@link Flybits.User} IDs.
   * @property {Flybits.api.Paging} [paging] Details to dictate which page, or subset, of results should be returned from the total records that match the query parameters.
   * @property {Object} [orderBy] Specification of server ordering of models requested.  Possible model properties are found in model map, {@link Flybits.User.reqKeys}
   * @property {string} orderBy.key String pertaining to a model property name by which to order server model response by.
   * @property {string} [orderBy.direction="ascending"] Direction of ordering based on specified `key`.  Possible values are `descending` or `ascending`
   * @property {Object} [search] Map of search parameters.  Structured as a map of  `{key:value,...}` pairs corresponding to model property name as a `key`, and possible property value as the `value`.  Possible properties to search over can be found in {@link Flybits.User.reqKeys}.
   */

  var ApiUtil = Flybits.util.Api;
  var gutil = Flybits.util.Obj;
  var Validation = Flybits.Validation;
  var Deferred = Flybits.Deferred;
  var User = Flybits.User;
  var Session = Flybits.store.Session;

  var lastPaging = null;

  var parseParams = function(reqParams){
    var req = {
      includeAllUsers: true
    };
    if(!reqParams){
      return req;
    }

    if(reqParams.id || reqParams.ids){
      var idArr = reqParams.ids?reqParams.ids:[];
      if(reqParams.id){
        idArr.push(reqParams.id);
      }
      req.ids = idArr.join(';');
    }

    if(reqParams.paging){
      if(!reqParams.paging.limit && !reqParams.paging.offset){
        throw new Validation().addError('Missing Argument','paging request parameter object must contain at least a limit or offset property.',{
          code: Validation.type.MISSINGARG
        });
      }
      if(reqParams.paging.limit){
        req.limit = reqParams.paging.limit;
      }
      if(reqParams.paging.offset){
        req.offset = reqParams.paging.offset;
      }
    }

    if(reqParams.orderBy){
      var key = reqParams.orderBy.key;

      if(!key){
        throw new Validation().addError('Missing Argument','orderBy requires a User model property key to order by.',{
          code: Validation.type.MISSINGARG,
          context: 'orderBy.key'
        });
      } else if(!User.reqKeys[key]){
        throw new Validation().addError('Invalid Argument','User does not contain or cannot be ordered by this property:'+key,{
          code: Validation.type.INVALIDARG,
          context: 'orderBy.key'
        });
      }
      key = User.reqKeys[key];
      var directionStr = reqParams.orderBy.direction?reqParams.orderBy.direction:'ascending';
      req.orderby = key + ":" + directionStr;
    }

    if(reqParams.search){
      var keys = Object.keys(reqParams.search);
      var keyLength = keys.length;
      var paramCache = {};
      var searchArr = [];
      var validation = new Validation();

      while(keyLength--){
        var curKey = keys[keyLength];
        var value = reqParams.search[curKey];
        if(!User.reqKeys[curKey]){
          validation.addError('Invalid Argument','User does not contain or cannot be searched by this property:'+curKey,{
            code: Validation.type.INVALIDARG,
            context: 'search'
          });
        }

        curKey = User.reqKeys[curKey];

        if(!paramCache[value]){
          paramCache[value] = curKey;
        } else{
          paramCache[value] += ";"+curKey;
        }
      }

      if(!validation.state){
        throw validation;
      }

      var values = Object.keys(paramCache);
      var valuesLength = values.length;
      while(valuesLength--){
        var curVal = values[valuesLength];
        var keyStr = paramCache[curVal];
        searchArr.push(curVal+':'+keyStr);
      }

      req.search = "search="+searchArr.join("&search=");
    }

    return req;
  };

  var setRememberMe = function(){
    var def = new Deferred();
    var url = Flybits.cfg.HOST + Flybits.cfg.res.SETREMEMBERME;
    var deviceID = Session.deviceID;

    fetch(url,{
      method: 'GET',
      credentials: 'include',
      headers: {
        ApiKey: Flybits.cfg.APIKEY,
        physicalDeviceId: deviceID,
        'Content-Type': 'application/json'
      }
    }).then(ApiUtil.checkResult).then(ApiUtil.getResultStr).then(function(resultStr){
      def.resolve();
    }).catch(function(resp){
      def.reject();
    });

    return def.promise;
  };

  var user = {
    /**
     * User registration API helper.
     * @memberof Flybits.api.User
     * @function register
     * @param {string} email Email account of user.
     * @param {string} password Password of user.
     * @param {Object} [profileOpts] Additional user profile properties.
     * @param {string} [profileOpts.firstName] First name of the user.
     * @param {string} [profileOpts.lastName] Last name of the user.
     * @param {boolean} [profileOpts.includeAccessToken=true] Flag to request an authorization token with the logged in {@link Flybits.User|User} model.  Authorization tokens are stored in {@link Flybits.Session} and are used for various components in the system such as context reporting.
     * @returns {external:Promise<Flybits.User,Flybits.Validation>} Promise that resolves after successfully registering user and with the authenticated {@link Flybits.User} model.  Note: After registration a valid session is issued to the new user.
     */
    register: function(email,password,profileOpts){
      var def = new Deferred();
      var url = Flybits.cfg.HOST + Flybits.cfg.res.REGISTER;
      var deviceID = Session.deviceID;
      var data = {
        email: email,
        password: password,
        includeCredentialsJwt: true
      };

      if(profileOpts){
        if(profileOpts.firstName){
          data.firstName = profileOpts.firstName;
        }
        if(profileOpts.lastName){
          data.lastName = profileOpts.lastName;
        }
        if(profileOpts.hasOwnProperty('includeAccessToken')){
          data.includeCredentialsJwt = profileOpts.includeAccessToken;
        }
      }

      var validation = new Validation();
      if(!email){
        validation.addError('Missing Argument','Email is a required field for registration',{
          context: 'email',
          code: Validation.type.MISSINGARG
        });
      }
      if(!password){
        validation.addError('Missing Argument','Password is a required field for registration',{
          context: 'password',
          code: Validation.type.MISSINGARG
        });
      }
      if(!validation.state){
        throw validation;
      }

      fetch(url,{
        method: 'POST',
        credentials: 'include',
        headers: {
          ApiKey: Flybits.cfg.APIKEY,
          physicalDeviceId: deviceID,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
      }).then(ApiUtil.checkResult).then(ApiUtil.getResultStr).then(function(resultStr){
        try{
          var resp = ApiUtil.parseResponse(resultStr);
        } catch(e){
          def.reject(new Validation().addError("Registration Failed","Unexpected server response.",{
            code: Validation.type.MALFORMED
          }));
        }

        try{
          var loggedInUser = new User(resp);
          Session.setSession(loggedInUser);
          def.resolve(loggedInUser);
        } catch(e){
          def.reject(new Validation().addError("User resolution failed.","Failed to parse server model.",{
            code: Validation.type.MALFORMED,
            context: resp
          }));
        }
      }).catch(function(resp){
        ApiUtil.getResultStr(resp).then(function(resultStr){
          var parsedResp = ApiUtil.parseErrorMsg(resultStr);
          def.reject(new Validation().addError('Registration Failed',parsedResp,{
            serverCode: resp.status
          }));
        });
      });

      return def.promise;
    },
    /**
     * Anonymous login will generate an anonymous user and authenticate them with the Flybits core. Note: the anonymous user will be able to consume {@link Flybits.MomentInstance|Moment} content but Flybits will be unable to track their specific historical interaction patterns.
     * @memberof Flybits.api.User
     * @function anonymousLogin
     * @returns {external:Promise<Flybits.User,Flybits.Validation>} Successfully registered and authenticated {@link Flybits.User} model.  Note: After registration a valid session is issued to the new user.
     */
    anonymousLogin: function(){
      var def = new Deferred();
      var email = gutil.guid() + "@flybits.eu";
      var pass = gutil.guid(2);
      var signedInUser = null;

      Flybits.api.User.register(email,pass,{
        firstName: 'anonymous',
        lastName: gutil.guid(1)
      }).then(function(usr){
        signedInUser = usr;
        return setRememberMe();
      }).then(function(){
        Session.setSession(signedInUser);
        def.resolve(signedInUser);
      }).catch(function(error){
        def.reject(error);
      });

      return def.promise;
    },
    /**
     * Helper to retrieve cached paging property.  After every API request for {@link Flybits.User} models, the static paging cache is replaced by the paging properties of the latest request.
     * @memberof Flybits.api.User
     * @function getPaging
     * @returns {Flybits.api.Paging} The last pagination object received from retrieving {@link Flybits.User|Users}.
     */
    getPaging: function(){
      return lastPaging;
    },
    /**
     * API helper to login to the Flybits core with a registered unique `email` and `password`.
     * @memberof Flybits.api.User
     * @function login
     * @param {string} email Email account of user.
     * @param {string} password Password of user.
     * @param {Object} [opts] Additional login options.
     * @param {boolean} [opts.rememberMe] Flag to request a remember me token from the Flybits core.  With a `rememberMe` token, a new session can be issued when the current session expires.
     * @param {boolean} [opts.includeAccessToken=true] Flag to request an authorization token with the logged in {@link Flybits.User|User} model.  Authorization tokens are stored in {@link Flybits.Session} and are used for various components in the system such as context reporting.
     * @returns {external:Promise<Flybits.User,Flybits.Validation>} Promise that resolves with the {@link Flybits.User} model of the successfully authenticated user. Promise rejects with a {@link Flybits.Validation} model if request is invalid or fails to complete successfully.
     */
    login: function(email,password,opts){
      var def = new Deferred();
      var url = Flybits.cfg.HOST + Flybits.cfg.res.LOGIN;
      var deviceID = Session.deviceID;
      var data = {
        email: email,
        password: password,
        includeCredentialsJwt: true
      };

      if(opts){
        if(opts.hasOwnProperty('rememberMe')){
          data.rememberMe = opts.rememberMe;
        }
        if(opts.hasOwnProperty('includeAccessToken')){
          data.includeCredentialsJwt = opts.includeAccessToken
        }
      }

      var validation = new Validation();
      if(!email){
        validation.addError('Missing Argument','Email is required to login',{
          context: 'email',
          code: Validation.type.MISSINGARG
        });
      }
      if(!password){
        validation.addError('Missing Argument','Password is required to login',{
          context: 'password',
          code: Validation.type.MISSINGARG
        });
      }
      if(!deviceID){
        validation.addError('Missing Argument','A unique device ID is required to login',{
          context: 'deviceID',
          code: Validation.type.MISSINGARG
        });
      }
      if(!validation.state){
        throw validation;
      }

      fetch(url,{
        method: 'POST',
        credentials: 'include',
        headers: {
          ApiKey: Flybits.cfg.APIKEY,
          physicalDeviceId: deviceID,
          'Content-Type': 'application/json',
          'flybits-sdk-version': Flybits.VERSION
        },
        body: JSON.stringify(data),
      }).then(ApiUtil.checkResult).then(ApiUtil.getResultStr).then(function(resultStr){
        try{
          var resp = ApiUtil.parseResponse(resultStr);
        } catch(e){
          def.reject(new Validation().addError("Login Failed","Unexpected server response.",{
            code: Validation.type.MALFORMED
          }));
        }

        try{
          var loggedInUser = new User(resp);
          Session.setSession(loggedInUser);
          def.resolve(loggedInUser);
        } catch(e){
          def.reject(new Validation().addError("User resolution failed.","Failed to parse server model.",{
            code: Validation.type.MALFORMED,
            context: resp
          }));
        }
      }).catch(function(resp){
        ApiUtil.getResultStr(resp).then(function(resultStr){
          var parsedResp = ApiUtil.parseErrorMsg(resultStr);
          def.reject(new Validation().addError('Login Failed',parsedResp,{
            serverCode: resp.status
          }));
        });
      });

      return def.promise;
    },
    /**
     * API helper to logout of the Flybits core.
     * @memberof Flybits.api.User
     * @function logout
     * @returns {external:Promise<undefined,Flybits.Validation>} Promise that resolves without a return value if user is successfully logged out. Promise rejects with a {@link Flybits.Validation} model if logout fails to complete successfully.
     */
    logout: function(){
      var def = new Deferred();
      var url = Flybits.cfg.HOST + Flybits.cfg.res.LOGOUT;
      var deviceID = Session.deviceID;

      fetch(url,{
        method: 'POST',
        credentials: 'include',
        headers: {
          ApiKey: Flybits.cfg.APIKEY,
          physicalDeviceId: deviceID,
          'flybits-sdk-version': Flybits.VERSION
        }
      }).then(function(){
        def.resolve();
      }).catch(function(resp){
        ApiUtil.getResultStr(resp).then(function(resultStr){
          var parsedResp = ApiUtil.parseErrorMsg(resultStr);
          def.reject(new Validation().addError('Logout Failed',parsedResp,{
            serverCode: resp.status
          }));
        });
      }).then(function(){
        Session.clearSession();
      })

      return def.promise;
    },
    /**
     * Used to retrieve an access token from the Flybits core to be used as an authorization claim to access resources from Flybits core modules such as context plugins and push notification management.  User must be logged into Flybits to successfully retrieve an authorization claim.
     * @function getAccessToken
     * @memberof Flybits.api.User
     * @returns {external:Promise<string|Flybits.Validation>} Promise that resolves with an access token string and rejects with a validation object if request cannot be completed successfully.
     */
    getAccessToken: function(){
      var def = new Deferred();
      var url = Flybits.cfg.HOST + Flybits.cfg.res.USERS + "/jwt";
      var deviceID = Session.deviceID;

      fetch(url,{
        method: 'GET',
        credentials: 'include',
        headers: {
          ApiKey: Flybits.cfg.APIKEY,
          physicalDeviceId: deviceID,
          'Content-Type': 'application/json',
          'flybits-sdk-version': Flybits.VERSION
        }
      }).then(ApiUtil.checkResult).then(ApiUtil.getResultStr).then(function(resultStr){
        try{
          var resp = ApiUtil.parseResponse(resultStr);
        } catch(e){
          def.reject(new Validation().addError("Request Failed","Unexpected server response.",{
            code: Validation.type.MALFORMED,
          }));
        }

        if(resp && resp.jwt){
          Session.setUserToken(resp.jwt);
          def.resolve(resp.jwt);
        } else{
          def.reject(new Validation().addError('User access token retrieval failed','Unexpected server response',{
            code: Validation.type.MALFORMED
          }));
        }
      }).catch(function(resp){
        ApiUtil.getResultStr(resp).then(function(resultStr){
          var parsedResp = ApiUtil.parseErrorMsg(resultStr);
          def.reject(new Validation().addError('User access token retrieval failed',parsedResp,{
            serverCode: resp.status
          }));
        });
      });

      return def.promise;
    },
    /**
     * API helper to change an authenticated user's current password.
     * @memberof Flybits.api.User
     * @function changePassword
     * @param {string} oldPassword Current password of the authenticated user.
     * @param {string} newPasword New desired password of the authenticated user.
     * @returns {external:Promise<undefined,Flybits.Validation>} Promise that resolves with a successful password change. Promise rejects with a {@link Flybits.Validation} model if request is invalid or fails to complete successfully.
     */
    changePassword: function(oldPassword, newPassword){
      var def = new Deferred();
      var url = Flybits.cfg.HOST + Flybits.cfg.res.CHANGEPASS;
      var deviceID = Session.deviceID;

      fetch(url,{
        method: 'POST',
        credentials: 'include',
        headers: {
          ApiKey: Flybits.cfg.APIKEY,
          physicalDeviceId: deviceID,
          'Content-Type': 'application/json',
          'flybits-sdk-version': Flybits.VERSION
        },
        body: JSON.stringify({
          currentPassword: oldPassword,
          newPassword: newPassword
        }),
      }).then(ApiUtil.checkResult).then(ApiUtil.getResultStr).then(function(resultStr){
        def.resolve();
      }).catch(function(resp){
        ApiUtil.getResultStr(resp).then(function(resultStr){
          var parsedResp = ApiUtil.parseErrorMsg(resultStr);
          def.reject(new Validation().addError('Password change failed',parsedResp,{
            serverCode: resp.status
          }));
        });
      });

      return def.promise;
    },
    /**
     * Fetches from the Flybits core the currently authenticated {@link Flybits.User}.
     * @memberof Flybits.api.User
     * @function getSignedInUser
     * @returns {external:Promise<Flybits.User,Flybits.Validation>} Promise that resolves with the {@link Flybits.User} model of the currently authenticated user. Promise rejects with a {@link Flybits.Validation} model if request fails to complete successfully.  This may occur if the user session has expired.
     */
    getSignedInUser: function(){
      var def = new Deferred();
      var url = Flybits.cfg.HOST + Flybits.cfg.res.USERS;
      var deviceID = Session.deviceID;

      fetch(url,{
        method: 'GET',
        credentials: 'include',
        headers: {
          ApiKey: Flybits.cfg.APIKEY,
          physicalDeviceId: deviceID,
          'Content-Type': 'application/json',
          'flybits-sdk-version': Flybits.VERSION
        }
      }).then(ApiUtil.checkResult).then(ApiUtil.getResultStr).then(function(resultStr){
        try{
          var resp = ApiUtil.parseResponse(resultStr);
        } catch(e){
          def.reject(new Validation().addError("Request Failed","Unexpected server response.",{
            code: Validation.type.MALFORMED,
          }));
        }

        if(resp && resp.data && resp.data.length > 0){
          try{
            def.resolve(new User(resp.data[0]));
          } catch(e){
            def.reject(new Validation().addError("Request Failed","Failed to parse server model.",{
              code: Validation.type.MALFORMED,
              context: resp.data[0]
            }));
          }
        } else{
          def.reject(new Validation().addError('User retrieval failed','Unexpected server response',{
            code: Validation.type.MALFORMED
          }));
        }
      }).catch(function(resp){
        ApiUtil.getResultStr(resp).then(function(resultStr){
          var parsedResp = ApiUtil.parseErrorMsg(resultStr);
          def.reject(new Validation().addError('User retrieval failed',parsedResp,{
            serverCode: resp.status
          }));
        });
      });

      return def.promise;
    },
    /**
     * Fetches {@link Flybits.User} with specified ID.
     * @memberof Flybits.api.User
     * @function getUser
     * @param {string} id ID of the {@link Flybits.User}.
     * @returns {external:Promise<Flybits.User,Flybits.Validation>} Promise that resolves with the {@link Flybits.User} model with the specified `id`. Promise rejects with a {@link Flybits.Validation} model if request fails to complete successfully or if the requested model with `id` is not found.
     */
    getUser: function(id){
      var api = this;
      var def = new Deferred();

      if(!id || id === ""){
        throw new Validation().addError('Missing Argument','No User ID specified',{
          code: Validation.type.MISSINGARG,
          context: 'id'
        });
      }

      this.getUsers({id:id}).then(function(respObj){
        var users = respObj.result;
        if(users.length <= 0 && api.getPaging().total === 0){
          def.reject(new Validation().addError('Model Not Found','A User was not found with the supplied ID',{
            code: Validation.type.NOTFOUND,
            context: 'id'
          }));
        } else if(users.length > 0){
          def.resolve(users[0]);
        }
      }).catch(function(validation){
        def.reject(validation);
      });

      return def.promise;
    },
    /**
     * Retrieves {@link Flybits.User} models by specified request parameters.
     * @memberof Flybits.api.User
     * @function getUsers
     * @param {Flybits.api.User.RequestParams} requestParams Request parameter object to filter {@link Flybits.User} models in the core.
     * @returns {external:Promise<Flybits.api.Result,Flybits.Validation>} Promise that resolves with a {@link Flybits.api.Result} object with a list of {@link Flybits.User} models that meet the request parameters.  Promise rejects with a {@link Flybits.Validation} object containing {@link Flybits.Validation.ValidationError|error} objects if request has failed.
     */
    getUsers: function(requestParams){
      var def = new Deferred();
      var url = Flybits.cfg.HOST + Flybits.cfg.res.USERS;
      var data = parseParams(requestParams);
      var deviceID = Session.deviceID;

      if(data.search){
        url += "?"+data.search;
        delete data.search;
      }

      data = ApiUtil.toURLParams(data);
      if(data !== ""){
        if(url.indexOf('?') < 0){
          url += "?";
        } else{
          url += "&";
        }
        url += data.toString();
      }

      fetch(url,{
        method: 'GET',
        credentials: 'include',
        headers: {
          ApiKey: Flybits.cfg.APIKEY,
          physicalDeviceId: deviceID,
          'flybits-sdk-version': Flybits.VERSION
        },
      }).then(ApiUtil.checkResult).then(ApiUtil.getResultStr).then(function(respStr){
        try{
          var resp = ApiUtil.parseResponse(respStr);
          var paging = ApiUtil.parsePaging(resp);
          lastPaging = paging;
        } catch(e){
          def.reject(new Validation().addError("Request Failed","Unexpected server response.",{
            code: Validation.type.MALFORMED,
          }));
        }

        if(resp && resp.data && resp.data.length >= 0){
          var users = resp.data.map(function(obj){
            try{
              return new User(obj);
            } catch(e){
              def.reject(new Validation().addError("Request Failed","Failed to parse server model.",{
                code: Validation.type.MALFORMED,
                context: obj
              }));
            }
          });

          def.resolve({
            result: users,
            nextPageFn: ApiUtil.createNextPageCall(Flybits.api.User.getUsers,requestParams,paging)
          });
        } else{
          def.reject(new Validation().addError('Users retrieval failed','Unexpected server response',{
            code: Validation.type.MALFORMED
          }));
        }
      }).catch(function(resp){
        ApiUtil.getResultStr(resp).then(function(resultStr){
          var parsedResp = ApiUtil.parseErrorMsg(resultStr);
          def.reject(new Validation().addError('Users retrieval failed',parsedResp,{
            serverCode: resp.status
          }));
        });
      });

      return def.promise;
    },
  };

  return user;
})();

/**
 * This is a utility class, do not use constructor.
 * @class Zone
 * @classdesc API wrapper class for the retrieval of {@link Flybits.Zone} models from Flybits core.
 * @memberof Flybits.api
 */
Flybits.api.Zone = (function(){
  /**
   * Available request parameters to filter {@link Flybits.Zone} in the Flybits core.
   * @typedef RequestParams
   * @memberof Flybits.api.Zone
   * @type Object
   * @property {string} [id] ID of a {@link Flybits.Zone}.
   * @property {string[]} [ids] List of {@link Flybits.Zone} IDs.
   * @property {Flybits.Tag} [tag] {@link Flybits.Tag} model with which to filter Zones that have association.
   * @property {Flybits.Tag[]} [tags] List of {@link Flybits.Tag} models with which to filter Zones that have association.
   * @property {string} [tagID] {@link Flybits.Tag} model ID with which to filter Zones that have association.
   * @property {string[]} [tagIDs] List of {@link Flybits.Tag} model IDs with which to filter Zones that have association.
   * @property {Flybits.Zone.GeoPoint} [location] Location to filter Zones around.
   * @property {number} [location.range] Additional location property to specify a radius from the center {@link Flybits.Zone.GeoPoint}. Unit of measure is the metric metre.
   * @property {Flybits.api.Paging} [paging] Details to dictate which page, or subset, of results should be returned from the total records that match the query parameters.
   * @property {Object} [orderBy] Specification of server ordering of models requested.  Possible model properties are found in model map, {@link Flybits.Zone.reqKeys}
   * @property {string} orderBy.key String pertaining to a model property name by which to order server model response by.
   * @property {string} [orderBy.direction="ascending"] Direction of ordering based on specified `key`.  Possible values are `descending` or `ascending`
   * @property {Object} [search] Map of search parameters.  Structured as a map of  `{key:value,...}` pairs corresponding to model property name as a `key`, and possible property value as the `value`.  Possible properties to search over can be found in {@link Flybits.Zone.reqKeys}.
   */

  var ApiUtil = Flybits.util.Api;
  var Validation = Flybits.Validation;
  var Deferred = Flybits.Deferred;
  var Session = Flybits.store.Session;
  var Tag = Flybits.Tag;
  var Zone = Flybits.Zone;

  var lastPaging = null;

  var parseParams = function(reqParams){
    var req = {};
    if(!reqParams){
      return req;
    }

    if(reqParams.id || reqParams.ids){
      var idArr = reqParams.ids?reqParams.ids:[];
      if(reqParams.id){
        idArr.push(reqParams.id);
      }
      req.ids = idArr.join(';');
    }

    if(reqParams.tag || reqParams.tags){
      var tagIDArr = reqParams.tags?reqParams.tags.map(function(tagObj){
        if(tagObj instanceof Tag){
          return tagObj.id;
        }
        throw new Validation().addError('Invalid Argument','Not a valid Tag model instance.',{
          code: Validation.type.INVALIDARG,
          context: 'tags'
        });
      }):[];
      if(reqParams.tag){
        if(!(reqParams.tag instanceof Tag)){
          throw new Validation().addError('Invalid Argument','Not a valid Tag model instance.',{
            code: Validation.type.INVALIDARG,
            context: 'tag'
          });
        }
        tagIDArr.push(reqParams.tag.id);
      }
      req.tagIds = tagIDArr.join(';');
    }

    if(reqParams.tagID || reqParams.tagIDs){
      var tagIDArr = reqParams.tagIDs?reqParams.tagIDs:[];
      if(reqParams.tagID){
        tagIDArr.push(reqParams.tagID);
      }
      req.tagIds = req.tagIds?Array.prototype.push.apply(req.tagIds,tagIDArr.join(';')):tagIDArr.join(';');
    }

    if(reqParams.location){
      if(!reqParams.location.lat || !reqParams.location.lng){
        throw new Validation().addError('Missing Argument','location request parameter object must contain a lat and lng property.',{
          code: Validation.type.MISSINGARG,
          context: 'location.lat,location.lng'
        });
      }
      req.Location = reqParams.location.lat+","+reqParams.location.lng;
      if(reqParams.location.range){
        req.Location += ","+reqParams.location.range;
      }
    }

    if(reqParams.paging){
      if(!reqParams.paging.limit && !reqParams.paging.offset){
        throw new Validation().addError('Missing Argument','paging request parameter object must contain at least a limit or offset property.',{
          code: Validation.type.MISSINGARG,
          context: 'paging.limit,paging.offset'
        });
      }
      if(reqParams.paging.limit){
        req.limit = reqParams.paging.limit;
      }
      if(reqParams.paging.offset){
        req.offset = reqParams.paging.offset;
      }
    }

    if(reqParams.orderBy){
      var key = reqParams.orderBy.key;

      if(!key){
        throw new Validation().addError('Missing Argument','orderBy requires a zone model property key to order by.',{
          code: Validation.type.MISSINGARG,
          context: 'orderBy.key'
        });
      } else if(!Flybits.Zone.reqKeys[key]){
        throw new Validation().addError('Invalid Argument','Zone does not contain or cannot be ordered by this property:'+key,{
          code: Validation.type.INVALIDARG,
          context: 'orderBy.key'
        });
      }
      key = Flybits.Zone.reqKeys[key];
      var directionStr = reqParams.orderBy.direction?reqParams.orderBy.direction:'ascending';
      req.orderby = key + ":" + directionStr;
    }

    if(reqParams.search){
      var keys = Object.keys(reqParams.search);
      var keyLength = keys.length;
      var paramCache = {};
      var searchArr = [];
      var validation = new Validation();

      while(keyLength--){
        var curKey = keys[keyLength];
        var value = reqParams.search[curKey];
        if(!Flybits.Zone.reqKeys[curKey]){
          validation.addError('Invalid Argument','Zone does not contain or cannot be searched by this property:'+curKey,{
            code: Validation.type.INVALIDARG,
            context: 'search'
          });
        }

        curKey = Flybits.Zone.reqKeys[curKey];

        if(!paramCache[value]){
          paramCache[value] = curKey;
        } else{
          paramCache[value] += ";"+curKey;
        }
      }

      if(!validation.state){
        throw validation;
      }

      var values = Object.keys(paramCache);
      var valuesLength = values.length;
      while(valuesLength--){
        var curVal = values[valuesLength];
        var keyStr = paramCache[curVal];
        searchArr.push(curVal+':'+keyStr);
      }

      req.search = "search="+searchArr.join("&search=");
    }

    return req;
  };

  var zone = {
    /**
     * Helper to retrieve cached paging property.  After every API request for {@link Flybits.Zone} models, the static paging cache is replaced by the paging properties of the latest request.
     * @memberof Flybits.api.Zone
     * @function getPaging
     * @returns {Flybits.api.Paging} The last pagination object received from retrieving {@link Flybits.Zone|Zones}.
     */
    getPaging: function(){
      return lastPaging;
    },
    /**
     * Depending on how your application utilizes a {@link Flybits.Zone|Zone}, whenever end-users begin interaction with the {@link Flybits.Zone|Zone}, it may be pertinent to collect analytics.  This function will log the start of an interaction with a {@link Flybits.Zone|Zone}.
     * @memberof Flybits.api.Zone
     * @function logConnect
     * @param {string} zid ID of the {@link Flybits.Zone} model with which interaction has begun.
     * @returns {external:Promise<undefined,Flybits.Validation>} Promise with resolves without return value.  Promise rejects with a {@link Flybits.Validation} object if request was invalid or failed to complete.
     */
    logConnect: function(zid){
      var def = new Deferred();
      var url = Flybits.cfg.HOST + Flybits.cfg.res.ZONECONNECT.replace('{zid}',zid);
      var deviceID = Session.deviceID;
      var validation = new Validation();

      if(!zid){
        validation.addError('Missing Argument','No Zone ID was provided.',{
          code: Validation.type.MISSINGARG,
          context: 'zid'
        });
      }
      if(!deviceID){
        validation.addError('Missing Argument','No device ID was present in the current session. Be sure to initialize the SDK before using this function.',{
          code: Validation.type.MISSINGARG,
          context: 'Flybits.store.Session.deviceID'
        });
      }

      if(!validation.state){
        throw validation;
      }

      fetch(url,{
        method: 'POST',
        credentials: 'include',
        headers: {
          ApiKey: Flybits.cfg.APIKEY,
          physicalDeviceId: deviceID,
          'flybits-sdk-version': Flybits.VERSION,
          'user-agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2793.0 Safari/537.36'
        }
      }).then(ApiUtil.checkResult).then(function(){
        def.resolve();
      }).catch(function(resp){
        ApiUtil.getResultStr(resp).then(function(resultStr){
          var parsedResp = ApiUtil.parseErrorMsg(resultStr);
          def.reject(new Validation().addError('Connection log failed.',parsedResp,{
            serverCode: resp.status
          }));
        });
      });

      return def.promise;
    },
    /**
     * Depending on how your application utilizes a {@link Flybits.Zone|Zone}, whenever end-users end interaction with the {@link Flybits.Zone|Zone}, it may be pertinent to collect analytics.  This function will log the end of an interaction with a {@link Flybits.Zone|Zone}.
     * @memberof Flybits.api.Zone
     * @function logDisconnect
     * @param {string} zid ID of the {@link Flybits.Zone} model with which interaction has ended.
     * @returns {external:Promise<undefined,Flybits.Validation>} Promise with resolves without return value.  Promise rejects with a {@link Flybits.Validation} object if request was invalid or failed to complete.
     */
    logDisconnect: function(zid){
      var def = new Deferred();
      var url = Flybits.cfg.HOST + Flybits.cfg.res.ZONEDISCONNECT.replace('{zid}',zid);
      var deviceID = Session.deviceID;
      var validation = new Validation();

      if(!zid){
        validation.addError('Missing Argument','No Zone ID was provided.',{
          code: Validation.type.MISSINGARG,
          context: 'zid'
        });
      }
      if(!deviceID){
        validation.addError('Missing Argument','No device ID was present in the current session. Be sure to initialize the SDK before using this function.',{
          code: Validation.type.MISSINGARG,
          context: 'Flybits.store.Session.deviceID'
        });
      }

      if(!validation.state){
        throw validation;
      }

      fetch(url,{
        method: 'POST',
        credentials: 'include',
        headers: {
          ApiKey: Flybits.cfg.APIKEY,
          physicalDeviceId: deviceID,
          'flybits-sdk-version': Flybits.VERSION,
          'user-agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2793.0 Safari/537.36'
        }
      }).then(ApiUtil.checkResult).then(function(){
        def.resolve();
      }).catch(function(resp){
        ApiUtil.getResultStr(resp).then(function(resultStr){
          var parsedResp = ApiUtil.parseErrorMsg(resultStr);
          def.reject(new Validation().addError('Disconnection log failed.',parsedResp,{
            serverCode: resp.status
          }));
        });
      });

      return def.promise;
    },
    /**
     * Retrieves {@link Flybits.Zone} model with specified ID.
     * @memberof Flybits.api.Zone
     * @function getZone
     * @param {string} id ID of the {@link Flybits.Zone} model.
     * @returns {external:Promise<Flybits.Zone,Flybits.Validation>} Promise that resolves with {@link Flybits.Zone} with specified ID.  Promise rejects with a {@link Flybits.Validation} object containing {@link Flybits.Validation.ValidationError|error} objects if request has failed or if a {@link Flybits.Zone} was not found with supplied ID.
     */
    getZone: function(id){
      var api = this;
      var def = new Deferred();

      if(!id || id === ""){
        throw new Validation().addError('Missing Argument','No Zone ID specified',{
          code: Validation.type.MISSINGARG,
          context: 'id'
        });
      }

      this.getZones({id:id}).then(function(respObj){
        var zones = respObj.result;
        if(zones.length <= 0 && api.getPaging().total === 0){
          def.reject(new Validation().addError('Model Not Found','A Zone was not found with the supplied ID',{
            code: Validation.type.NOTFOUND,
            context: 'id'
          }));
        } else if(zones.length > 0){
          def.resolve(zones[0]);
        }
      }).catch(function(validation){
        def.reject(validation);
      });

      return def.promise;
    },
    /**
     * Retrieves {@link Flybits.Zone} models by specified request parameters.
     * @memberof Flybits.api.Zone
     * @function getZones
     * @param {Flybits.api.Zone.RequestParams} requestParams Request parameter object to filter {@link Flybits.Zone} models in the core.
     * @returns {external:Promise<Flybits.api.Result,Flybits.Validation>} Promise that resolves with a {@link Flybits.api.Result} object with a list of {@link Flybits.Zone} models that meet the request parameters.  Promise rejects with a {@link Flybits.Validation} object containing {@link Flybits.Validation.ValidationError|error} objects if request has failed.
     */
    getZones: function(requestParams){
      var def = new Deferred();
      var url = Flybits.cfg.HOST + Flybits.cfg.res.ZONES;
      var data = parseParams(requestParams);
      var deviceID = Session.deviceID;

      if(data.search){
        url += "?"+data.search;
        delete data.search;
      }

      data = ApiUtil.toURLParams(data);
      if(data !== ""){
        if(url.indexOf('?') < 0){
          url += "?";
        } else{
          url += "&";
        }
        url += data.toString();
      }

      fetch(url,{
        method: 'GET',
        credentials: 'include',
        headers: {
          ApiKey: Flybits.cfg.APIKEY,
          physicalDeviceId: deviceID,
          'flybits-sdk-version': Flybits.VERSION
        },
      }).then(ApiUtil.checkResult).then(ApiUtil.getResultStr).then(function(respStr){
        try{
          var resp = ApiUtil.parseResponse(respStr);
          var paging = ApiUtil.parsePaging(resp);
          lastPaging = paging;
        } catch(e){
          def.reject(new Validation().addError("Request Failed","Unexpected server response.",{
            code: Validation.type.MALFORMED,
          }));
        }

        if(resp && resp.data && resp.data.length >= 0){
          var zones = resp.data.map(function(obj){
            try{
              return new Zone(obj);
            } catch(e){
              def.reject(new Validation().addError("Request Failed","Failed to parse server model.",{
                code: Validation.type.MALFORMED,
                context: obj
              }));
            }
          });

          def.resolve({
            result: zones,
            nextPageFn: ApiUtil.createNextPageCall(Flybits.api.Zone.getZones,requestParams,paging)
          });
        } else{
          def.reject(new Validation().addError('Zones retrieval failed','Unexpected server response',{
            code: Validation.type.MALFORMED
          }));
        }
      }).catch(function(resp){
        ApiUtil.getResultStr(resp).then(function(resultStr){
          var parsedResp = ApiUtil.parseErrorMsg(resultStr);
          def.reject(new Validation().addError('Zones retrieval failed',parsedResp,{
            serverCode: resp.status
          }));
        });
      });

      return def.promise;
    },
  };

  return zone;
})();

/**
 * This is a utility class, do not use constructor.
 * @class ZoneMomentInstance
 * @classdesc API wrapper class for the retrieval of {@link Flybits.ZoneMomentInstance} models from Flybits core.
 * @memberof Flybits.api
 */
Flybits.api.ZoneMomentInstance = (function(){
  /**
   * Available request parameters to filter {@link Flybits.ZoneMomentInstance} in the Flybits core.
   * @typedef RequestParams
   * @memberof Flybits.api.ZoneMomentInstance
   * @type Object
   * @property {string} [id] ID of a {@link Flybits.ZoneMomentInstance}.
   * @property {string[]} [ids] List of {@link Flybits.ZoneMomentInstance} IDs.
   * @property {string} [zid] {@link Flybits.Zone} ID to which {@link Flybits.ZoneMomentInstance|ZoneMomentInstances} are associated with.
   * @property {string[]} [zids] List of {@link Flybits.Zone} IDs to which {@link Flybits.ZoneMomentInstance|ZoneMomentInstances} are associated with.
   * @property {Flybits.Tag} [tag] {@link Flybits.Tag} model with which to filter ZoneMomentInstances that have association.
   * @property {Flybits.Tag[]} [tags] List of {@link Flybits.Tag} models with which to filter ZoneMomentInstances that have association.
   * @property {string} [tagID] {@link Flybits.Tag} model ID with which to filter ZoneMomentInstances that have association.
   * @property {string[]} [tagIDs] List of {@link Flybits.Tag} model IDs with which to filter ZoneMomentInstances that have association.
   * @property {Flybits.api.Paging} [paging] Details to dictate which page, or subset, of results should be returned from the total records that match the query parameters.
   * @property {Object} [orderBy] Specification of server ordering of models requested.  Possible model properties are found in model map, {@link Flybits.ZoneMomentInstance.reqKeys}
   * @property {string} orderBy.key String pertaining to a model property name by which to order server model response by.
   * @property {string} [orderBy.direction="ascending"] Direction of ordering based on specified `key`.  Possible values are `descending` or `ascending`
   * @property {Object} [search] Map of search parameters.  Structured as a map of  `{key:value,...}` pairs corresponding to model property name as a `key`, and possible property value as the `value`.  Possible properties to search over can be found in {@link Flybits.ZoneMomentInstance.reqKeys}.
   */

  var ApiUtil = Flybits.util.Api;
  var Validation = Flybits.Validation;
  var Deferred = Flybits.Deferred;
  var Session = Flybits.store.Session;
  var Tag = Flybits.Tag;
  var ZoneMomentInstance = Flybits.ZoneMomentInstance;

  var lastPaging = null;

  var parseParams = function(reqParams){
    var req = {};
    if(!reqParams){
      return req;
    }

    if(reqParams.id || reqParams.ids){
      var idArr = reqParams.ids?reqParams.ids:[];
      if(reqParams.id){
        idArr.push(reqParams.id);
      }
      req.ids = idArr.join(';');
    }

    if(reqParams.zid || reqParams.zids){
      var zidArr = reqParams.zids?reqParams.zids:[];
      if(reqParams.zid){
        zidArr.push(reqParams.zid);
      }
      req.zoneids = zidArr.join(';');
    }

    if(reqParams.tag || reqParams.tags){
      var tagIDArr = reqParams.tags?reqParams.tags.map(function(tagObj){
        if(tagObj instanceof Tag){
          return tagObj.id;
        }
        throw new Validation().addError('Invalid Argument','Not a valid Tag model instance.',{
          code: Validation.type.INVALIDARG,
          context: 'tags'
        });
      }):[];
      if(reqParams.tag){
        if(!(reqParams.tag instanceof Tag)){
          throw new Validation().addError('Invalid Argument','Not a valid Tag model instance.',{
            code: Validation.type.INVALIDARG,
            context: 'tag'
          });
        }
        tagIDArr.push(reqParams.tag.id);
      }
      req.tagIds = tagIDArr.join(';');
    }

    if(reqParams.tagID || reqParams.tagIDs){
      var tagIDArr = reqParams.tagIDs?reqParams.tagIDs:[];
      if(reqParams.tagID){
        tagIDArr.push(reqParams.tagID);
      }
      req.tagIds = req.tagIds?Array.prototype.push.apply(req.tagIds,tagIDArr.join(';')):tagIDArr.join(';');
    }

    if(reqParams.paging){
      if(!reqParams.paging.limit && !reqParams.paging.offset){
        throw new Validation().addError('Missing Argument','paging request parameter object must contain at least a limit or offset property.',{
          code: Validation.type.MISSINGARG
        });
      }
      if(reqParams.paging.limit){
        req.limit = reqParams.paging.limit;
      }
      if(reqParams.paging.offset){
        req.offset = reqParams.paging.offset;
      }
    }

    if(reqParams.orderBy){
      var key = reqParams.orderBy.key;

      if(!key){
        throw new Validation().addError('Missing Argument','orderBy requires a ZoneMomentInstance model property key to order by.',{
          code: Validation.type.MISSINGARG,
          context: 'orderBy.key'
        });
      } else if(!ZoneMomentInstance.reqKeys[key]){
        throw new Validation().addError('Invalid Argument','ZoneMomentInstance does not contain or cannot be ordered by this property:'+key,{
          code: Validation.type.INVALIDARG,
          context: 'orderBy.key'
        });
      }
      key = ZoneMomentInstance.reqKeys[key];
      var directionStr = reqParams.orderBy.direction?reqParams.orderBy.direction:'ascending';
      req.orderby = key + ":" + directionStr;
    }

    if(reqParams.search){
      var keys = Object.keys(reqParams.search);
      var keyLength = keys.length;
      var paramCache = {};
      var searchArr = [];
      var validation = new Validation();

      while(keyLength--){
        var curKey = keys[keyLength];
        var value = reqParams.search[curKey];
        if(!ZoneMomentInstance.reqKeys[curKey]){
          validation.addError('Invalid Argument','ZoneMomentInstance does not contain or cannot be searched by this property:'+curKey,{
            code: Validation.type.INVALIDARG,
            context: 'search'
          });
        }

        curKey = ZoneMomentInstance.reqKeys[curKey];

        if(!paramCache[value]){
          paramCache[value] = curKey;
        } else{
          paramCache[value] += ";"+curKey;
        }
      }

      if(!validation.state){
        throw validation;
      }

      var values = Object.keys(paramCache);
      var valuesLength = values.length;
      while(valuesLength--){
        var curVal = values[valuesLength];
        var keyStr = paramCache[curVal];
        searchArr.push(curVal+':'+keyStr);
      }

      req.search = "search="+searchArr.join("&search=");
    }

    return req;
  };

  var zoneMomentInstance = {
    /**
     * Helper to retrieve cached paging property.  After every API request for {@link Flybits.ZoneMomentInstance} models, the static paging cache is replaced by the paging properties of the latest request.
     * @memberof Flybits.api.ZoneMomentInstance
     * @function getPaging
     * @returns {Flybits.api.Paging} The last pagination object received from retrieving {@link Flybits.ZoneMomentInstance|ZoneMomentInstances}.
     */
    getPaging: function(){
      return lastPaging;
    },
    /**
     * Whenever end-users begin consumption of a the {@link Flybits.ZoneMomentInstance|ZoneMomentInstance}, it may be pertinent to collect analytics.  This function will log the start of an interaction with a {@link Flybits.ZoneMomentInstance|ZoneMomentInstance}.
     * @memberof Flybits.api.ZoneMomentInstance
     * @function logConnect
     * @param {string} zmiID ID of the {@link Flybits.ZoneMomentInstance} model with which interaction has begun.
     * @returns {external:Promise<undefined,Flybits.Validation>} Promise with resolves without return value.  Promise rejects with a {@link Flybits.Validation} object if request was invalid or failed to complete.
     */
    logConnect: function(zmiID){
      var def = new Deferred();
      var url = Flybits.cfg.HOST + Flybits.cfg.res.ZMICONNECT.replace('{zmiID}',zmiID);
      var deviceID = Session.deviceID;
      var validation = new Validation();

      if(!zmiID){
        validation.addError('Missing Argument','No ZoneMomentInstance ID was provided.',{
          code: Validation.type.MISSINGARG,
          context: 'zmiID'
        });
      }
      if(!deviceID){
        validation.addError('Missing Argument','No device ID was present in the current session. Be sure to initialize the SDK before using this function.',{
          code: Validation.type.MISSINGARG,
          context: 'Flybits.store.Session.deviceID'
        });
      }

      if(!validation.state){
        throw validation;
      }

      fetch(url,{
        method: 'POST',
        credentials: 'include',
        headers: {
          ApiKey: Flybits.cfg.APIKEY,
          physicalDeviceId: deviceID,
          'flybits-sdk-version': Flybits.VERSION,
          'user-agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2793.0 Safari/537.36'
        }
      }).then(ApiUtil.checkResult).then(function(){
        def.resolve();
      }).catch(function(resp){
        ApiUtil.getResultStr(resp).then(function(resultStr){
          var parsedResp = ApiUtil.parseErrorMsg(resultStr);
          def.reject(new Validation().addError('Connection log failed.',parsedResp,{
            serverCode: resp.status
          }));
        });
      });

      return def.promise;
    },
    /**
     * Whenever end-users end consumption of a the {@link Flybits.ZoneMomentInstance|ZoneMomentInstance}, it may be pertinent to collect analytics.  This function will log the end of an interaction with a {@link Flybits.ZoneMomentInstance|ZoneMomentInstance}.
     * @memberof Flybits.api.ZoneMomentInstance
     * @function logDisconnect
     * @param {string} zmiID ID of the {@link Flybits.ZoneMomentInstance} model with which interaction has ended.
     * @returns {external:Promise<undefined,Flybits.Validation>} Promise with resolves without return value.  Promise rejects with a {@link Flybits.Validation} object if request was invalid or failed to complete.
     */
    logDisconnect: function(zmiID){
      var def = new Deferred();
      var url = Flybits.cfg.HOST + Flybits.cfg.res.ZMIDISCONNECT.replace('{zmiID}',zmiID);
      var deviceID = Session.deviceID;
      var validation = new Validation();

      if(!zmiID){
        validation.addError('Missing Argument','No ZoneMomentInstance ID was provided.',{
          code: Validation.type.MISSINGARG,
          context: 'zmiID'
        });
      }
      if(!deviceID){
        validation.addError('Missing Argument','No device ID was present in the current session. Be sure to initialize the SDK before using this function.',{
          code: Validation.type.MISSINGARG,
          context: 'Flybits.store.Session.deviceID'
        });
      }

      if(!validation.state){
        throw validation;
      }

      fetch(url,{
        method: 'POST',
        credentials: 'include',
        headers: {
          ApiKey: Flybits.cfg.APIKEY,
          physicalDeviceId: deviceID,
          'flybits-sdk-version': Flybits.VERSION,
          'user-agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2793.0 Safari/537.36'
        }
      }).then(ApiUtil.checkResult).then(function(){
        def.resolve();
      }).catch(function(resp){
        ApiUtil.getResultStr(resp).then(function(resultStr){
          var parsedResp = ApiUtil.parseErrorMsg(resultStr);
          def.reject(new Validation().addError('Disconnection log failed.',parsedResp,{
            serverCode: resp.status
          }));
        });
      });

      return def.promise;
    },
    /**
     * Retrieves {@link Flybits.ZoneMomentInstance} model with specified ID.
     * @memberof Flybits.api.ZoneMomentInstance
     * @function getZMI
     * @param {string} id ID of the {@link Flybits.ZoneMomentInstance} model.
     * @returns {external:Promise<Flybits.ZoneMomentInstance,Flybits.Validation>} Promise that resolves with {@link Flybits.ZoneMomentInstance} with specified ID.  Promise rejects with a {@link Flybits.Validation} object containing {@link Flybits.Validation.ValidationError|error} objects if request has failed or if a {@link Flybits.ZoneMomentInstance} was not found with supplied ID.
     */
    getZMI: function(id){
      var api = this;
      var def = new Deferred();

      if(!id || id === ""){
        throw new Validation().addError('Missing Argument','No ZoneMomentInstance ID was provided.',{
          code: Validation.type.MISSINGARG,
          context: 'id'
        });
      }

      this.getZMIs({id:id}).then(function(respObj){
        var zmis = respObj.result;
        if(zmis.length <= 0 && api.getPaging().total === 0){
          def.reject(new Validation().addError('Model Not Found','A ZoneMomentInstance was not found with the supplied ID',{
            code: Validation.type.NOTFOUND,
            context: 'id'
          }));
        } else if(zmis.length > 0){
          def.resolve(zmis[0]);
        }
      }).catch(function(validation){
        def.reject(validation);
      });

      return def.promise;
    },
    /**
     * Retrieves {@link Flybits.ZoneMomentInstance} models by specified request parameters.
     * @memberof Flybits.api.ZoneMomentInstance
     * @function getZMIs
     * @param {Flybits.api.ZoneMomentInstance.RequestParams} requestParams Request parameter object to filter {@link Flybits.ZoneMomentInstance} models in the core.
     * @returns {external:Promise<Flybits.api.Result,Flybits.Validation>} Promise that resolves with a {@link Flybits.api.Result} object with a list of {@link Flybits.ZoneMomentInstance} models that meet the request parameters.  Promise rejects with a {@link Flybits.Validation} object containing {@link Flybits.Validation.ValidationError|error} objects if request has failed.
     */
    getZMIs: function(requestParams){
      var def = new Deferred();
      var url = Flybits.cfg.HOST + Flybits.cfg.res.ZMIS;
      var data = parseParams(requestParams);
      var deviceID = Session.deviceID;

      if(data.search){
        url += "?"+data.search;
        delete data.search;
      }

      data = ApiUtil.toURLParams(data);
      if(data !== ""){
        if(url.indexOf('?') < 0){
          url += "?";
        } else{
          url += "&";
        }
        url += data.toString();
      }

      fetch(url,{
        method: 'GET',
        credentials: 'include',
        headers: {
          ApiKey: Flybits.cfg.APIKEY,
          physicalDeviceId: deviceID,
          'flybits-sdk-version': Flybits.VERSION
        },
      }).then(ApiUtil.checkResult).then(ApiUtil.getResultStr).then(function(respStr){
        try{
          var resp = ApiUtil.parseResponse(respStr);
          var paging = ApiUtil.parsePaging(resp);
          lastPaging = paging;
        } catch(e){
          def.reject(new Validation().addError("Request Failed","Unexpected server response.",{
            code: Validation.type.MALFORMED,
          }));
        }

        if(resp && resp.data && resp.data.length >= 0){
          var zmis = resp.data.map(function(obj){
            try{
              return new ZoneMomentInstance(obj);
            } catch(e){
              def.reject(new Validation().addError("Request Failed","Failed to parse server model.",{
                code: Validation.type.MALFORMED,
                context: obj
              }));
            }
          });

          def.resolve({
            result: zmis,
            nextPageFn: ApiUtil.createNextPageCall(Flybits.api.ZoneMomentInstance.getZMIs,requestParams,paging)
          });
        } else{
          def.reject(new Validation().addError('ZoneMomentInstances retrieval failed','Unexpected server response',{
            code: Validation.type.MALFORMED
          }));
        }
      }).catch(function(resp){
        ApiUtil.getResultStr(resp).then(function(resultStr){
          var parsedResp = ApiUtil.parseErrorMsg(resultStr);
          def.reject(new Validation().addError('ZoneMomentInstances retrieval failed',parsedResp,{
            serverCode: resp.status
          }));
        });
      });

      return def.promise;
    },
    /**
     * Used to retrieve an access token from the Flybits core to be used as an authorization claim to consume data from the {@link Flybits.MomentInstance} that is associated with the {@link Flybits.ZoneMomentInstance|ZoneMomentInstance} associated with the supplied `zmiID`.
     * @function getAccessToken
     * @memberof Flybits.api.ZoneMomentInstance
     * @param {string} zmiID ID of the {@link Flybits.ZoneMomentInstance|ZoneMomentInstance} to which authorization claim is being requested.
     * @returns {external:Promise<string|Flybits.Validation>} Promise that resolves with an access token string and rejects with a validation object if request cannot be completed successfully.  It is possible a {@link Flybits.ZoneMomentInstance|ZoneMomentInstance} with the supplied ID does not exist.
     */
    getAccessToken: function(zmiID){
      var def = new Deferred();
      var url = Flybits.cfg.HOST + Flybits.cfg.res.ZMIJWT.replace('{zmiID}',zmiID);
      var deviceID = Session.deviceID;

      if(!zmiID){
        throw new Validation().addError('Missing Argument','No ZoneMomentInstance ID was provided.',{
          code: Validation.type.MISSINGARG,
          context: 'zmiID'
        });
      }

      fetch(url,{
        method: 'GET',
        credentials: 'include',
        headers: {
          ApiKey: Flybits.cfg.APIKEY,
          physicalDeviceId: deviceID,
          'flybits-sdk-version': Flybits.VERSION
        }
      }).then(ApiUtil.checkResult).then(ApiUtil.getResultStr).then(function(respStr){
        try{
          var resp = ApiUtil.parseResponse(respStr);
        } catch(e){
          def.reject(new Validation().addError("Failed to retrieve ZoneMomentInstance access token.","Unexpected server response.",{
            code: Validation.type.MALFORMED
          }));
        }

        if(resp && resp.payload){
          def.resolve(resp.payload);
        } else{
          def.reject(new Validation().addError('Failed to retrieve ZoneMomentInstance access token.','Unexpected server response',{
            code: Validation.type.MALFORMED
          }));
        }
      }).catch(function(resp){
        ApiUtil.getResultStr(resp).then(function(resultStr){
          var parsedErrMsg = ApiUtil.parseErrorMsg(resultStr);

          if(parsedErrMsg && parsedErrMsg.exceptionType === 'ZoneMomentInstanceNotFoundException'){
            def.reject(new Validation().addError('Failed to retrieve ZoneMomentInstance access token.','ZoneMomentInstance with provided ID was not found.',{
              code: Validation.type.NOTFOUND,
              context: 'zmiID'
            }));
            return;
          }

          def.reject(new Validation().addError('Failed to retrieve ZoneMomentInstance access token.',parsedErrMsg,{
            serverCode: resp.status
          }));
        });
      })

      return def.promise;
    }
  };

  return zoneMomentInstance;
})();

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

})();
