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
