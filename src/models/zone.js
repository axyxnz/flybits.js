/**
 * @classdesc Flybits core Zone model.  A model that represents the main core model that contains and contextually manages content in the Flybits ecosystem.
 * @class
 * @memberof Flybits
 * @extends BaseModel
 * @implements {Flybits.interface.Serializable}
 * @implements {Flybits.interface.Localizable}
 * @implements {Flybits.interface.Taggable}
 * @param {Object} serverObj Raw Flybits core model `Object` directly from API.
 */
Flybits.Zone = (function(){
  /**
   * @typedef LocalizedObject
   * @memberof Flybits.Zone
   * @type Object
   * @property {string} name Name of the Zone.
   * @property {string} desc Description of the Zone.
   * @property {string} coverImg URL to image resource that represents the model.
   */
   /**
    * @typedef GeoPoint
    * @memberof Flybits.Zone
    * @type Object
    * @property {number} lat Latitude of geospatial point.
    * @property {number} lng Longitude of geospatial point.
    */

  var ObjUtil = Flybits.util.Obj;

  var Zone = function(serverObj){
    BaseModel.call(this,serverObj);
    if(serverObj){
      this.fromJSON(serverObj);
    }
  };
  Zone.prototype = Object.create(BaseModel.prototype);
  Zone.prototype.constructor = Zone;
  Zone.prototype.implements('Serializable');
  Zone.prototype.implements('Localizable');
  Zone.prototype.implements('Taggable');

  /**
   * @memberof Flybits.Zone
   * @constant {Object} reqKeys Map of model properties that can be used to order by and search for this model.  Currently comprising of, `id`, `creatorID`, `isPublished`, `name`, `description`, and `icon`.
   */
  Zone.prototype.reqKeys = Zone.reqKeys = ObjUtil.extend({
    creatorID: 'creatorId',
    isPublished: 'isPublished',
    name: 'name',
    description: 'description',
    icon: 'coverImg'
  },BaseModel.prototype.reqKeys);

  Zone.prototype._fromLocaleJSON = function(serverObj){
    var retObj = {
      name: serverObj.name,
      description: serverObj.description,
      coverImg: serverObj.icon
    };

    return retObj;
  };

  Zone.prototype._toLocaleJSON = function(appObj){
    var retObj = {
      name: appObj.name,
      description: appObj.description,
      icon: appObj.coverImg
    };

    return retObj;
  };

  Zone.prototype.fromJSON = function(serverObj){
    var obj = this;
    /**
     * @instance
     * @memberof Flybits.Zone
     * @member {string} creatorID ID of the {@link Flybits.User} who created the Zone.
     */
    this.creatorID = serverObj.creatorId;
    /**
     * @instance
     * @memberof Flybits.Zone
     * @member {Flybits.Zone.GeoPoint[][]} geofence A multi-dimensional array of latitude and longitude points that comprise a multi-polygonal shape that represents the physical manifestation of the Zone.  Most Zones will only have a single polygon so the length of the outer array will usually be one.
     */
    this.geofence = serverObj.shapes;
    /**
     * @instance
     * @memberof Flybits.Zone
     * @member {boolean} isPublished Flag indicating whether or not the content within the {@link Flybits.Zone} is ready/available for consumption.
     */
    this.isPublished = serverObj.isPublished;
    /**
     * @instance
     * @memberof Flybits.Zone
     * @member {string} defaultLang Default locale of Zone model. String is any possible key found in {@link https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes|ISO 639-1}.
     */
    this.defaultLang = serverObj.defaultLanguage;
    /**
     * @instance
     * @memberof Flybits.Zone
     * @member {string} timeZone Explicit time zone for the Zone. Possible strings can be found at {@link https://en.wikipedia.org/wiki/List_of_tz_database_time_zones| List of tz database time zones}
     */
    this.timeZone = serverObj.timeZone;
    /**
     * @instance
     * @memberof Flybits.Zone
     * @member {Object} metadata Object which holds custom properties specified by tenant administrators.  This object allows for Flybits core models to be extended to include additional properties not in the default specification.
     */
    this.metadata = serverObj.metadata;
    if(serverObj.analytics){
      this.stats = {
        visits: serverObj.analytics.totalUserVisits,
        favourited: serverObj.analytics.favoriteCount,
        momentCount: serverObj.analytics.zoneMomentCount
      };
    }
    if(serverObj.activeUserRelationship){
      /**
       * @instance
       * @memberof Flybits.Zone
       * @member {Object} userContextStats Contextual statistics that pertain to the Zone with respect to the authenticated User who has retrieved the model.
       */
      this.userContextStats = {
        /**
         * Flag to indicate if the current authenticated user has marked the Zone as a "favourite".
         * @alias userContextStats.isFavourite
         * @memberof! Flybits.Zone#
         * @type {boolean}
         */
        isFavourite: serverObj.activeUserRelationship.isFavorite,
        /**
         * Distance between authenticated User and the center of the Zone's {@link Flybits.Zone#geofence|geofence}.  Note this property is only populated if the `location` retrieval parameter is used to obtain the Zone.
         * @alias userContextStats.zoneCenterDistance
         * @memberof! Flybits.Zone#
         * @type {number}
         */
        zoneCenterDistance: serverObj.activeUserRelationship.distanceToZoneCenter,
        /**
         * Distance between authenticated User and the edge of the Zone's {@link Flybits.Zone#geofence|geofence}.  Note this property is only populated if the `location` retrieval parameter is used to obtain the Zone.
         * @alias userContextStats.zoneEdgeDistance
         * @memberof! Flybits.Zone#
         * @type {number}
         */
        zoneEdgeDistance: serverObj.activeUserRelationship.distanceToZoneEdge,
        /**
         * Flag indicating whether or not the authenticated User is within the Zone's {@link Flybits.Zone#geofence|geofence}.  Note this property is only populated if the `location` retrieval parameter is used to obtain the Zone.
         * @alias userContextStats.isInZone
         * @memberof! Flybits.Zone#
         * @type {number}
         */
        isInZone: serverObj.activeUserRelationship.isInsideZone
      };
    }
    /**
     * @instance
     * @memberof Flybits.Zone
     * @member {string[]} tagIDs An array of IDs pertaining to organizational tags in the Flybits ecosystem that is associated to the Zone.
     * @see Flybits.Tag
     */
    if(serverObj.tagIds && serverObj.tagIds.items.length > 0){
      this.tagIDs = serverObj.tagIds.items;
    } else{
      this.tagIDs = [];
    }

    /**
     * @instance
     * @memberof Flybits.Zone
     * @member {Object} locales Map of model's available locale keys to {@link Flybits.Zone.LocalizedObject} objects.  Possible locale strings can be found in {@link https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes|ISO 639-1}
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

  Zone.prototype.toJSON = function(){
    var obj = this;
    var retObj = {
      creatorId: this.creatorID,
      shapes: this.geofence,
      isPublished: this.isPublished,
      defaultLanguage: this.defaultLang,
      metadata: this.metadata,
      timeZone: this.timeZone,
      localizations:{}
    };

    if(this.stats){
      retObj.analytics = {
        totalUserVisits: this.stats.visits,
        favoriteCount: this.stats.favourited,
        zoneMomentCount: this.stats.momentCount
      };
    }

    if(this.userContextStats){
      retObj.activeUserRelationship = {
        isFavorite: this.userContextStats.isFavourite,
        distanceToZoneCenter: this.userContextStats.zoneCenterDistance,
        distanceToZoneEdge: this.userContextStats.zoneEdgeDistance,
        isInsideZone: this.userContextStats.isInZone
      };
    }

    if(this.tagIDs){
      retObj.tagIds = {
        items: this.tagIDs,
        numItems: this.tagIDs.length
      };
    }

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

  /**
   * @function hasTag
   * @override
   * @instance
   * @memberof Flybits.Zone
   */
  Zone.prototype.hasTag = function(tagID){
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
   * @memberof Flybits.Zone
   */
  Zone.prototype.getTags = function(){
    return Flybits.api.Tag.getTags({
      ids: this.tagIDs
    });
  };

  return Zone;
})();
