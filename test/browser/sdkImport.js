require('isomorphic-fetch');
var should = require('should');
var mockery = require('mockery');
var sinon = require('sinon');

describe('Browser: SDK',function(){
  var Flybits;
  before(function(){
    global.window = {};
    mockery.enable({
      useCleanCache: true,
      warnOnReplace: false,
      warnOnUnregistered: false
    });
    require('../../index.js');
    Flybits = window.Flybits;
  });
  after(function(){
    delete global.window;
    mockery.disable();
  });

  it('should be in the global namespace after inclusion',function(){
    Flybits.should.be.an.Object().and.not.empty();
  });
  it('should have a context namespace',function(){
    Flybits.context.should.be.an.Object().and.not.empty();
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
