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
