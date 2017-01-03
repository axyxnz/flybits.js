var should = require('should');
var mockery = require('mockery');
var sinon = require('sinon');
require('should-sinon');
var serverZMIModel = require('../_assets/server_zmi.js');

var checkAppModelLocales = function(localeMap){
  var localeKeys = Object.keys(localeMap);
  for(var i = 0; i < localeKeys.length; i++){
    var localeObj = localeMap[localeKeys[i]];
    localeObj.label.should.be.a.String().and.not.empty();
    if(localeObj.icon){
      localeObj.icon.should.be.a.String().and.not.empty();
    }
  }
};

var checkServerModelLocales = function(localeMap){
  var localeKeys = Object.keys(localeMap);
  for(var i = 0; i < localeKeys.length; i++){
    var localeObj = localeMap[localeKeys[i]];
    localeObj.value.should.be.a.String().and.not.empty();
    if(localeObj.icon){
      localeObj.icon.should.be.a.String().and.not.empty();
    }
  }
};

describe('ZMI model constructor',function(){
  var Flybits;
  var spy;
  before(function(){
    mockery.enable({
      useCleanCache: true,
      warnOnReplace: false,
      warnOnUnregistered: false
    });
    Flybits = require('../../index.js');

    spy = sinon.spy(Flybits.ZoneMomentInstance.prototype,'fromJSON');
  });
  after(function(){
    Flybits.ZoneMomentInstance.prototype.fromJSON.restore();
    mockery.disable();
  });

  it('calls parser',function(){
    var tag = new Flybits.ZoneMomentInstance(serverZMIModel);
    spy.should.be.calledOnce();
  });
});

describe('ZMI model serialization/deserialization',function(){
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

  it('ZMI parse from server to sdk model',function(){
    var zmi = new Flybits.ZoneMomentInstance(serverZMIModel);
    zmi.id.should.be.a.String().and.not.empty();
    zmi.zoneID.should.be.a.String().and.not.empty();
    zmi.momentInstanceID.should.be.a.String().and.not.empty();
    zmi.isAutoRun.should.be.a.Boolean();
    zmi.order.should.be.a.Number();
    zmi.isPublished.should.be.a.Boolean();
    zmi.tagIDs.should.be.an.Array();
    if(zmi.tagIDs.length > 0){
      zmi.tagIDs[0].should.be.a.String().and.not.empty();
    }
    if(serverZMIModel.auxiliaryAncestorProperties){
      zmi.momentInstance.should.be.instanceof(Flybits.MomentInstance);
      zmi.moment.should.be.instanceof(Flybits.Moment);
    }
  });
  it('ZMI parse from sdk to server model',function(){
    var zmi = new Flybits.ZoneMomentInstance(serverZMIModel);
    var retObj = zmi.toJSON();
    retObj.id.should.be.a.String().and.not.empty();
    retObj.zoneId.should.be.a.String().and.not.empty();
    retObj.momentInstanceId.should.be.a.String().and.not.empty();
    retObj.isAutoRun.should.be.a.Boolean();
    retObj.order.should.be.a.Number();
    retObj.isPublished.should.be.a.Boolean();
    retObj.tagIds.should.be.an.Array();
    if(serverZMIModel.auxiliaryAncestorProperties){
      var aux = retObj.auxiliaryAncestorProperties;
      aux.should.be.an.Object().and.not.empty();
    }
  });
});
