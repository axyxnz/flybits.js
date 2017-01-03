/**
 * @classdesc Flybits core user model
 * @class
 * @memberof Flybits
 * @extends BaseModel
 * @implements {Flybits.interface.Serializable}
 * @param {Object} serverObj Raw Flybits core model `Object` directly from API.
 */
Flybits.User = (function(){
  var ObjUtil = Flybits.util.Obj;

  var User = function(serverObj){
    BaseModel.call(this,serverObj);
    if(serverObj){
      this.fromJSON(serverObj);
    }
  };
  User.prototype = Object.create(BaseModel.prototype);
  User.prototype.constructor = User;
  User.prototype.implements('Serializable');

  /**
   * @memberof Flybits.User
   * @constant {Object} reqKeys Map of model properties that can be used to order by and search for this model.  Currently comprising of, `id`, `email`, `firstName`, `lastName`, and `profileImg`
   */
  User.prototype.reqKeys = User.reqKeys = ObjUtil.extend({
    email: 'email',
    firstName: 'firstName',
    lastName: 'lastName',
    profileImg: 'icon'
  },BaseModel.prototype.reqKeys);

  User.prototype.fromJSON = function(serverObj){
    /**
     * @instance
     * @memberof Flybits.User
     * @member {string} email Registered email of the user.
     */
    this.email = serverObj.email;
    /**
     * @instance
     * @memberof Flybits.User
     * @member {string} firstName First name of the user.
     */
    this.firstName = serverObj.firstName;
    /**
     * @instance
     * @memberof Flybits.User
     * @member {string} lastName Last name of the user.
     */
    this.lastName = serverObj.lastName;
    /**
     * @instance
     * @memberof Flybits.User
     * @member {string} profileImg URL of the user's profile image.
     */
    this.profileImg = serverObj.icon;

    if(serverObj.credentialsJwt){
      this._authToken = serverObj.credentialsJwt;
    }
  };

  User.prototype.toJSON = function(){
    var retObj = {
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      icon: this.profileImg
    };

    if(this.id){
      retObj.id = this.id;
    }

    return retObj;
  };

  return User;
})();
