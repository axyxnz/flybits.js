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
