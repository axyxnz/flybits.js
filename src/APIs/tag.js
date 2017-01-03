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
