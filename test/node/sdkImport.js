var should = require('should');
var mockery = require('mockery');

describe('Node: SDK',function(){
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

  it('should exist after require',function(){
    Flybits.should.be.an.Object().and.not.empty();
  });
  it('should not have a context namespace',function(){
    should.not.exist(Flybits.context);
  });
  it('should have a store namespace',function(){
    Flybits.store.should.be.an.Object().and.not.empty();
  });
  it('should have an api namespace',function(){
    Flybits.api.should.be.an.Object().and.not.empty();
  });
  it('should have an asynchronous init by resource function',function(){
    Flybits.init.should.be.a.Function();
    Flybits.init().should.be.a.Promise();
  });
  it('should have a util namespace',function(){
    Flybits.util.should.be.an.Object().and.not.empty();
  });
  it('should have an interface namespace',function(){
    Flybits.interface.should.be.an.Object().and.not.empty();
  });
});
