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
