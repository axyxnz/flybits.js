/**
 * @classdesc Base class from which all core Flybits models are extended.
 * @class
 * @param {Object} serverObj Raw Flybits core model `Object` directly from API.
 */
var BaseModel = (function(){
  var BaseModel = function(serverObj){
    /**
     * @instance
     * @memberof BaseModel
     * @member {string} id Parsed ID of the Flybits core model.
     */
    this.id = null;

    if(serverObj){
      this.id = serverObj.id;
    }
  };
  BaseModel.prototype = {
    reqKeys: {
      id: 'id'
    },
    implements: function(interfaceName){
      if(!this._interfaces){
        this._interfaces = [];
      }
      this._interfaces.push(interfaceName);
    }
  };

  return BaseModel;
})();
