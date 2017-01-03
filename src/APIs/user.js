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
