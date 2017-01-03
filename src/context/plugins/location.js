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
