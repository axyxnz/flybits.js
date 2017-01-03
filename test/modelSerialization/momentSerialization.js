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

describe('Moment model constructor',function(){
  var Flybits;
  var spy;
  before(function(){
    mockery.enable({
      useCleanCache: true,
      warnOnReplace: false,
      warnOnUnregistered: false
    });
    Flybits = require('../../index.js');

    spy = sinon.spy(Flybits.Moment.prototype,'fromJSON');
  });
  after(function(){
    Flybits.Moment.prototype.fromJSON.restore();
    mockery.disable();
  });

  it('calls parser',function(){
    var moment = new Flybits.Moment(serverZMIModel.auxiliaryAncestorProperties);
    spy.should.be.calledOnce();
  });
});

describe('Moment model serialization/deserialization',function(){
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

  it('Moment parse from server ZMI to sdk model',function(){
    var moment = new Flybits.Moment(serverZMIModel.auxiliaryAncestorProperties);
    moment.id = serverZMIModel.auxiliaryAncestorProperties.momentId;

    moment.id.should.be.a.String().and.not.empty();
    moment.clientURL.should.be.a.String().and.not.empty();
    moment.manageURL.should.be.a.String().and.not.empty();
    moment.supportedDevices.should.be.a.Number().and.greaterThan(-1);
    moment.renderType.should.be.a.String().and.not.empty();
    if(moment.renderType === 'native'){
      moment.iosPkg.should.be.a.String().and.not.empty();
      moment.androidPkg.should.be.a.String().and.not.empty();
    }
  });
  it('Moment parse from sdk to server ZMI model',function(){
    var moment = new Flybits.Moment(serverZMIModel.auxiliaryAncestorProperties);
    moment.id = serverZMIModel.auxiliaryAncestorProperties.momentId;
    var retObj = moment.toJSON();

    retObj.id.should.be.a.String().and.not.empty();
    retObj.editUrl.should.be.a.String().and.not.empty();
    retObj.launchUrl.should.be.a.String().and.not.empty();
    retObj.launchUrl.should.be.a.String().and.not.empty();
    retObj.renditionType.should.be.a.String().and.not.empty();
    retObj.supportedDeviceType.should.be.a.Number().and.greaterThan(-1);
    if(retObj.renditionType === 'native'){
      retObj.androidPackageName.should.be.a.String().and.not.empty();
      retObj.iosPackageName.should.be.a.String().and.not.empty();
    }
  });
});
