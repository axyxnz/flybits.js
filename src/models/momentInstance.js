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
