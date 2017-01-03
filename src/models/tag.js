/**
 * @classdesc Flybits core model that is used for organizational purposes.  Almost all other models can be tagged including Zones and Moments.
 * @class
 * @memberof Flybits
 * @extends BaseModel
 * @implements {Flybits.interface.Serializable}
 * @implements {Flybits.interface.Localizable}
 * @param {Object} serverObj Raw Flybits core model `Object` directly from API.
 */
Flybits.Tag = (function(){
  /**
   * @typedef LocalizedObject
   * @memberof Flybits.Tag
   * @type Object
   * @property {string} label Text value of Tag.
   * @property {string} icon URL to icon resource.
   */

  var ObjUtil = Flybits.util.Obj;

  var Tag = function(serverObj){
    BaseModel.call(this,serverObj);
    if(serverObj){
      this.fromJSON(serverObj);
    }
  };
  Tag.prototype = Object.create(BaseModel.prototype);
  Tag.prototype.constructor = Tag;
  Tag.prototype.implements('Serializable');
  Tag.prototype.implements('Localizable');

  /**
   * @memberof Flybits.Tag
   * @inheritdoc
   * @constant {Object} reqKeys Map of model properties that can be used to order by and search for this model.  Currently comprising of, `id`, `label`, `icon`, and `isVisible`
   */
  Tag.prototype.reqKeys = Tag.reqKeys = ObjUtil.extend({
    label: 'value',
    icon: 'icon',
    isVisible: 'isVisible'
  },BaseModel.prototype.reqKeys);

  Tag.prototype._fromLocaleJSON = function(serverObj){
    var retObj = {
      label: serverObj.value,
      icon: serverObj.icon
    };

    return retObj;
  };

  Tag.prototype._toLocaleJSON = function(appObj){
    var retObj = {
      value: appObj.label,
      icon: appObj.icon
    };

    return retObj;
  };

  Tag.prototype.fromJSON = function(serverObj){
    var obj = this;
    /**
     * @instance
     * @memberof Flybits.Tag
     * @member {boolean} isVisible Indicates whether or not this tag is visible to end user clients.  Sometimes tags are used for internal system organization.
     */
    this.isVisible = serverObj.isVisible;
    /**
     * @instance
     * @memberof Flybits.Tag
     * @member {string} defaultLang Default locale of tag.
     */
    this.defaultLang = serverObj.defaultLanguage;
    /**
     * @instance
     * @memberof Flybits.Tag
     * @member {string[]} zoneIDs IDs of Zones that are associated with this Tag.
     */
    this.zoneIDs = serverObj.zoneIds?serverObj.zoneIds:[];
    /**
     * @instance
     * @memberof Flybits.Tag
     * @member {string[]} zmiIDs IDs of ZoneMomentInstances that are associated with this Tag.
     */
    this.zmiIDs = serverObj.zoneMomentInstanceIds?serverObj.zoneMomentInstanceIds:[];

    /**
     * @instance
     * @memberof Flybits.Tag
     * @member {Object} locales Map of model's available locale keys to {@link Flybits.Tag.LocalizedObject} objects.  Possible locale strings can be found in {@link https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes|ISO 639-1}
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

  Tag.prototype.toJSON = function(){
    var obj = this;
    var retObj = {
      isVisible: this.isVisible,
      defaultLanguage: this.defaultLang,
      zoneIds: this.zoneIDs,
      zoneMomentInstanceIds: this.zmiIDs,
      localizations:{}
    };

    if(this.id){
      retObj.id = this.id;
    }

    if(Object.keys(this.locales).length > 0){
      var localeKeys = Object.keys(this.locales);
      localeKeys.forEach(function(key){
        retObj.localizations[key] = obj._toLocaleJSON(obj.locales[key]);
      });
    }

    return retObj;
  };

  return Tag;
})();
