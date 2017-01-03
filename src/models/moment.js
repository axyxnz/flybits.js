/**
 * @classdesc Flybits core Moment model.  A Moment is the registered specification of a Flybits enabled microservice.  It is the content type that can be instantiated and controlled within a Zone.
 * @class
 * @memberof Flybits
 * @extends BaseModel
 * @implements {Flybits.interface.Serializable}
 * @param {Object} serverObj Raw Flybits core model `Object` directly from API.
 */
Flybits.Moment = (function(){
  var Moment = function(serverObj){
    BaseModel.call(this,serverObj);
    if(serverObj){
      this.fromJSON(serverObj);
    }
  };
  Moment.prototype = Object.create(BaseModel.prototype);
  Moment.prototype.constructor = Moment;
  Moment.prototype.implements('Serializable');

  /**
   * @memberof Flybits.Moment
   * @constant {number} MASK_ANDROID Bit mask for the `supportedDevices` bit flag indicating Android support.
   */
  Moment.prototype.MASK_ANDROID = Moment.MASK_ANDROID = 2;
  /**
   * @memberof Flybits.Moment
   * @constant {number} MASK_IOS Bit mask for the `supportedDevices` bit flag indicating iOS support.
   */
  Moment.prototype.MASK_IOS = Moment.MASK_IOS = 1;
  /**
   * @memberof Flybits.Moment
   * @constant {string} RENDERTYPE_NATIVE Render type indicating Moment provides an end-user interface located at the `clientURL`
   */
  Moment.prototype.RENDERTYPE_NATIVE = Moment.RENDERTYPE_NATIVE = 'native';
  /**
   * @memberof Flybits.Moment
   * @constant {string} RENDERTYPE_HTML Render type indicating Moment has no end-user interface and consumers must implement their own interface and consume Moment content from their APIs directly.
   */
  Moment.prototype.RENDERTYPE_HTML = Moment.RENDERTYPE_HTML = 'html';
  /**
   * @memberof Flybits.Moment
   * @constant {string} RENDERTYPE_NONE Render type indicating that the Moment is made to be a background service and not meant for consumption by end-users directly.
   */
  Moment.prototype.RENDERTYPE_NONE = Moment.RENDERTYPE_NONE = 'none';

  Moment.prototype.fromJSON = function(serverObj){
    var obj = this;
    /**
     * @instance
     * @memberof Flybits.Moment
     * @member {string} name Registered name of the Moment (content type).
     */
    this.name = serverObj.name;
    /**
     * @instance
     * @memberof Flybits.Moment
     * @member {string} icon URL of the Moment's icon.
     */
    this.icon = serverObj.icon;
    /**
     * @instance
     * @memberof Flybits.Moment
     * @member {string} baseNotifyURL API endpoint to which the Flybits core will notify the Moment server of changes to the Moment and its instances within the Flybits ecosystem.
     */
    this.baseNotifyURL = serverObj.notifyUrl;
    /**
     * @instance
     * @memberof Flybits.Moment
     * @member {string} manageURL URL of the HTML based editing application that is used to configure instances of the Moment known as a MomentInstance.
     */
    this.manageURL = serverObj.editUrl;
    /**
     * @instance
     * @memberof Flybits.Moment
     * @member {string} clientURL If this is Moment has been registered as an HTML based Moment this is the URL of the HTML based end-client application to which end clients will consume the contents of the instances of this Moment.  If this Moment was registered as being a natively rendered Moment, this is the base path for API endpoints used to consume the contents of the instances of this Moment.
     */
    this.clientURL = serverObj.launchUrl;
    /**
     * @instance
     * @memberof Flybits.Moment
     * @member {string} androidPkg Registered key to indicate to Android end-clients the type of native Moment as to allow for the correct rendering of Moment type.
     */
    this.androidPkg = serverObj.androidPackageName;
    /**
     * @instance
     * @memberof Flybits.Moment
     * @member {string} iosPkg Registered key to indicate to iOS end-clients the type of native Moment as to allow for the correct rendering of Moment type.
     */
    this.iosPkg = serverObj.iosPackageName;
    /**
     * @instance
     * @memberof Flybits.Moment
     * @member {string} privateKey Shared private key between Flybits core and Moment server to be used for the verification of authorization claims.  This is generated by the Flybits core upon Moment registration and is only visible to the creator or the Moment.
     */
    this.privateKey = serverObj.sharedKey;
    /**
     * @instance
     * @memberof Flybits.Moment
     * @member {string} ownerID ID of the Flybits `User` model who created the Moment.
     */
    this.ownerID = serverObj.ownerId;
    /**
     * @instance
     * @memberof Flybits.Moment
     * @member {string} status Publish status of the Moment indicating what state of creation, submission, and approval.
     */
    this.status = serverObj.status;
    /**
     * @instance
     * @memberof Flybits.Moment
     * @member {string} type After creation, Moment type stays in `development` until the Moment is approved at which it will change into an in `production` state.  Moments still in development can only be seen and consumed by those who have created or have administrative access.
     */
    this.type = serverObj.type;
    /**
     * @instance
     * @memberof Flybits.Moment
     * @member {boolean} isProduction Boolean indicator of production state of Moment.
     */
    this.isProduction = serverObj.isProduction;
    /**
     * @instance
     * @memberof Flybits.Moment
     * @member {string} renderType String indicating what type of end-user client this Moment provides for end-user consumption.  Possible values include, {@link Flybits.Moment.RENDERTYPE_NATIVE}, {@link Flybits.Moment.RENDERTYPE_HTML}, and, {@link Flybits.Moment.RENDERTYPE_NONE}
     */
    this.renderType = serverObj.renditionType;
    /**
     * @instance
     * @memberof Flybits.Moment
     * @member {number} supportedDevices Bit flag indicating which platforms this moment supports.  The bit mask {@link Flybits.Moment.MASK_IOS} corresponds to the iOS platform.  The bit mask {@link Flybits.Moment.MASK_ANDROID} corresponds to the Android platform.  Masking constants can be found in this class.
     */
    this.supportedDevices = serverObj.supportedDeviceType;
  };

  Moment.prototype.toJSON = function(){
    var obj = this;
    var retObj = {
      name: this.name,
      icon: this.icon,
      notifyUrl: this.baseNotifyURL,
      editUrl: this.manageURL,
      launchUrl: this.clientURL,
      androidPackageName: this.androidPkg,
      iosPackageName: this.iosPkg,
      sharedKey: this.privateKey,
      ownerId: this.ownerID,
      status: this.status,
      type: this.type,
      isProduction: this.isProduction,
      renditionType: this.renderType,
      supportedDeviceType: this.supportedDevices
    };

    if(this.id){
      retObj.id = this.id;
    }

    return retObj;
  };

  return Moment;
})();
