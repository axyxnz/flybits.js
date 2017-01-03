var should = require('should');
var mockery = require('mockery');
var sinon = require('sinon');
require('should-sinon');
var serverUserModel = require('../_assets/server_user.js');

describe('User model constructor',function(){
  var Flybits;
  var spy;
  before(function(){
    mockery.enable({
      useCleanCache: true,
      warnOnReplace: false,
      warnOnUnregistered: false
    });
    Flybits = require('../../index.js');

    spy = sinon.spy(Flybits.User.prototype,'fromJSON');
  });
  after(function(){
    Flybits.User.prototype.fromJSON.restore();
    mockery.disable();
  });

  it('calls parser',function(){
    var user = new Flybits.User(serverUserModel);
    spy.should.be.calledOnce();
  });
});

describe('User model serialization/deserialization',function(){
  var Flybits;
  before(function(){
    mockery.enable({
      useCleanCache: true,
      warnOnReplace: false,
      warnOnUnregistered: false
    });
    Flybits = require('../../index.js');
  });
  after(function(){
    mockery.disable();
  });

  it('User parse from server to sdk model',function(){
    var user = new Flybits.User(serverUserModel);
    user.id.should.be.a.String().and.not.empty();
    user.email.should.be.a.String().and.not.empty();
    user.firstName.should.be.a.String().and.not.empty();
    user.lastName.should.be.a.String().and.not.empty();
    user.profileImg.should.be.a.String().and.not.empty();
  });
  it('User parse from sdk to server model',function(){
    var user = new Flybits.User(serverUserModel);
    var retObj = user.toJSON();
    retObj.email.should.be.a.String().and.not.empty();
    retObj.firstName.should.be.a.String().and.not.empty();
    retObj.lastName.should.be.a.String().and.not.empty();
    retObj.icon.should.be.a.String().and.not.empty();
    retObj.id.should.be.a.String().and.not.empty();
  });
});
