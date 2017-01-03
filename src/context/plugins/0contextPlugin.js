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
