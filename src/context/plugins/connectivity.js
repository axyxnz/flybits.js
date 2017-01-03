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
