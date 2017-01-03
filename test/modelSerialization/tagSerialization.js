var should = require('should');
var mockery = require('mockery');
var sinon = require('sinon');
require('should-sinon');
var serverTagModel = require('../_assets/server_tag.js');

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

describe('Tag model constructor',function(){
  var Flybits;
  var spy;
  before(function(){
    mockery.enable({
      useCleanCache: true,
      warnOnReplace: false,
      warnOnUnregistered: false
    });
    Flybits = require('../../index.js');

    spy = sinon.spy(Flybits.Tag.prototype,'fromJSON');
  });
  after(function(){
    Flybits.Tag.prototype.fromJSON.restore();
    mockery.disable();
  });

  it('calls parser',function(){
    var tag = new Flybits.Tag(serverTagModel);
    spy.should.be.calledOnce();
  });
});

describe('Tag model serialization/deserialization',function(){
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

  it('Tag parse from server to sdk model',function(){
    var tag = new Flybits.Tag(serverTagModel);
    tag.id.should.be.a.String().and.not.empty();
    tag.isVisible.should.be.a.Boolean();
    tag.defaultLang.should.be.a.String().and.not.empty();
    tag.zoneIDs.should.be.an.Array();
    if(tag.zoneIDs.length > 0){
      tag.zoneIDs[0].should.be.a.String();
    }
    tag.zmiIDs.should.be.an.Array();
    if(tag.zmiIDs.length > 0){
      tag.zmiIDs[0].should.be.a.String();
    }
    tag.locales.should.be.an.Object().and.not.empty();
    checkAppModelLocales(tag.locales);
  });
  it('Tag parse from sdk to server model',function(){
    var tag = new Flybits.Tag(serverTagModel);
    var retObj = tag.toJSON();
    retObj.id.should.be.a.String().and.not.empty();
    retObj.isVisible.should.be.a.Boolean();
    retObj.defaultLanguage.should.be.a.String().and.not.empty();
    retObj.zoneIds.should.be.an.Array();
    if(retObj.zoneIds.length > 0){
      retObj.zoneIds[0].should.be.a.String();
    }
    retObj.zoneMomentInstanceIds.should.be.an.Array();
    if(retObj.zoneMomentInstanceIds.length > 0){
      retObj.zoneMomentInstanceIds[0].should.be.a.String();
    }
    retObj.localizations.should.be.an.Object().and.not.empty();
    checkServerModelLocales(retObj.localizations);
  });
});
