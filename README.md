![alt tag](http://flybits.com/images/logo_flybitscorporate_RGB.png)
# Flybits.js
Flybits.js is an isomorphic JavaScript SDK that can be used to build [Flybits](http://flybits.com) enabled applications on both the client and server side.  That is to say, Flybits.js has been designed for creating mobile web applications, specifically [Progressive Web Apps](https://developers.google.com/web/progressive-web-apps/), and also Flybits enabled microservices known as Moments.

## Table of Contents
1. [Compatibility](#compatibility)
2. [Getting Started](#getting-started)
3. [Fundamentals](#fundamentals)
    1. [Promises](#promises)
    2. [Standardized Errors](#standardized-errors)
4. [Basic Data Consumption](#basic-data-consumption)
    1. [Retrieving Zones](#retrieving-zones)
    2. [Retrieving Moments of a Zone](#retrieving-moments-of-a-zone)
    3. [Consuming HTML Moments](#consuming-html-moments)
    4. [Consuming Moments Through Moment APIs](#consuming-moments-through-moment-apis)
5. [Context Management](#context-management)
    1. [Registering Available Plugins](#registering-available-plugins)
    2. [Creating a Custom Client-Side Context Plugin](#creating-a-custom-client-side-context-plugin)

## Compatibility

To achieve client/server agnosticism, this SDK utilizes the new [ES6 Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) [(spec)](http://www.ecma-international.org/ecma-262/6.0/#sec-promise-objects) object and the upcoming standard [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) [(spec)](https://fetch.spec.whatwg.org/).  Both have polyfill support readily available for platforms who have yet to implement them.

To maintain compatibility until all modern browsers and node environments catch up, it is recommended to include the polyfills below by default.

Browser:
* Promise Polyfill: [stefanpenner/es6-promise](https://github.com/stefanpenner/es6-promise)
* Fetch Polyfill: [github/fetch](https://github.com/github/fetch)

Node:
* Promise Polyfill: [stefanpenner/es6-promise](https://github.com/stefanpenner/es6-promise)
* Fetch Polyfill: [matthew-andrews/isomorphic-fetch](https://github.com/matthew-andrews/isomorphic-fetch)
* Fetch Cookie Support Polyfill: [juicetan/fetch-cookie](https://github.com/Juicetan/fetch-cookie) (npm package: [fetch-cookie-es5](https://www.npmjs.com/package/fetch-cookie-es5))

    Note: The Flybits SDK relies on the native AJAX request mechanism to handle cookies for session management.  This polyfill decorates the `fetch` API with automatic cookie handling functionality.  Below is an example of how to use it assuming you already have `fetch` support or have first required the isomorphic-fetch polyfill.
    ```javascript
    if(global.fetch){
      global.fetch = require('fetch-cookie-es5')(global.fetch);
    }
    ```

## Getting Started

**Fetch, Include, Initialize**

1. Fetch the SDK

    The SDK is available using the [Node Package Manager(npm)](https://www.npmjs.com/package/flybits)
    ```shell
    $ npm install flybits --save
    ```

2. Include the SDK

    Browser:
    ```html
    <!-- Offline storage abstraction library needed only for context management -->
    <script src="node_modules/localforage/dist/localforage.js"></script>

    <script src="node_modules/flybits/dist/flybits.js"></script>
    ```
    Node:
    ```javascript
    var Flybits = require('flybits');
    ```

3. Initialize the SDK

    Initialization is required to configure environment properties such as API keys, and host URLs among other things.  There are two ways of initializing the Flybits SDK.  One is by providing a JavaScript `Object` that will override the SDK default configuration:
    ```javascript
    Flybits.initObj({
      HOST: '//tenant.flybits.com/v2',
      APIKEY: '5F59E9C8-5WE9-4614-77B9-R71C2D4757A5'
    });
    ```
    Note: the above is a synchronous function.

    Another method of initialization is by providing a URI to a JSON file with which the SDK will read from to retrieve an `Object` to override SDK default configuration.

    In a browser environment, initialization with this function is asynchronous and will return a `Promise`:
    ```javascript
    Flybits.init('//resource.source.com/config.json').then(function(cfg){
      /** cfg is the initialized state of the SDK configuration.
          It is not required to be used, it is only returned for your convenience.*/

      // start working with SDK
    }).catch(function(validationObj){
      // handle error
    });
    ```

    In a Node environment, initialization is synchronous and only accepts URIs to JSON files on the same file system as the Node application:
    ```javascript
    Flybits.init('./res/config.json');
    ```

    Currently, the only configuration properties developers have to set are found below and provided when developers sign up for their own tenant in the Flybits ecosystem :

| Key | Type | Description |
| :-- | :--: | :---------- |
| HOST | String |This is the base URL through which the SDK will communicate with the Flybits core and is specific to the registered tenant. |
| APIKEY | String | This key is distributed per tenant and per platform and is required to use Flybits core APIs. |

## Fundamentals
The SDK is comprised of two key models, `Zones` and `ZoneMomentInstances` (ZMIs). Think of `Zones` as containers for an entire experience and `ZoneMomentIntances` (ZMIs) as content that compose an experience which lie within a `Zone`.

#### Promises

A `Promise` represents an operation that has yet to be completed but will in the future.

All asynchronous operations in the SDK return a `Promise` which give developers full power and flexibility to manage chained operations, parallel model retrieval and deferred actions.

Below is an example of the power of using `Promises` in managing asynchronous operations in the Flybits SDK. Take for example, you wish to retrieve a Zone *then* retrieve the content within the Zone *and while* that is occurring, retrieve the organizational Tags available in the current system:

```javascript
var zmiRetrievalPromise = Flybits.api.Zone.getZone('zid-123').then(function(zone){
  //fetch content(ZMIs) from the returned zone
  return Flybits.api.ZoneMomentInstances.getZMIs({zid:zone.id});
});

//fetch organization tags
var tagRetrievalPromise = Flybits.api.Tag.getTags();

zmiRetrievalPromise.then(function(zoneMomentInstances){
  // do something with the content(ZMIs) from a zone
});
tagRetrievalPromise.then(function(tags){
  // do something with organizational tags
});

Promise.all([zmiRetrievalPromise,tagRetrievalPromise]).then(function(zoneMomentInstances,tags){
  // do something with returned zone content(ZMIs) and organizational tags.
  /* Note: this callback is invoked when both asynchronous operations have completed */
});
```

#### Standardized Errors

All handled errors in the Flybits SDK can be caught by appending a `.catch()` callback onto any promise and will invoke the callback with an instance of the `Flybits.Validation` class.
```javascript
Flybits.api.Zone.getZone('zid-123').catch(function(validation){
  //handle error
});
```
The `Flybits.Validation` class comprises of a `state` property an `errors` array containing any and all errors that has been incurred by an SDK operation, and a `type` static property holding error code constants. The `state` property indicates the result of an operation. In the case of a `.catch()` callback it will always be false.

Each error object found in the `errors` array will have the properties below:

| Key | Type | Description |
| :-- | :--: | :---------- |
| header | String | Generally a short and broad error message |
| message | String | A more in depth explanation of the error. |
| code | Number | An internal error code indicating error type. This property is only populated when errors that can be discerned by the SDK occur. Errors that occur server side and cannot be discerned by the SDK will populate an HTTP status code in the `serverCode` property.  For instance, if you forget to supply required property the `code` property would be populated with `Flybits.Validation.type.MISSINGARG`.  On the other hand if there's a server outage, the `serverCode` would be populated with a 404 or 500. |
| serverCode | Number | This is populated with an HTTP status code when a server side error occurs that cannot be discerned by the SDK. |
| context | String | This is populated if an error occurs that relates to one of the input properties of an operation and will be the property's key. |

Below are the internal error code constants found in the static object of `Flybits.Validation.type`:

| Key | Value | Description |
| :-- | :---: | :----------- |
| MALFORMED | 1000 | This error is usually thrown when an input property supplied to an SDK operation is incorrectly formatted, or sometimes a server response is not recognized by the SDK. |
| INVALIDARG | 1001 | This error is thrown when an input property supplied to an SDK operation is semantically incorrect. |
| MISSINGARG | 1002 | This error is thrown when a required property is not supplied to an SDK operation. |
| NOTFOUND | 1003 | Usually thrown when model retrieval has yielded no results with provided input parameters. |
| CONNECTIONERROR | 1004 | Error thrown when the SDK loses connection to particular resources. |
| UNAUTHENTICATED | 1005 | Error is thrown when SDK operation requires authentication and current session is not found or expired. |
| RETRIEVALERROR | 1006 | This error is thrown when any retrieval SDK operation fails to complete. |
| NOTSUPPORTED | 1007 | Error is thrown when an operation or entity is not supported by the SDK. |

## Basic Data Consumption
Here are some examples of common workflows when consuming data from the Flybits core assuming User has already been authenticated.

### Retrieving Zones
Depending on how you structure your application, you may search for Zones relevant to the User or you may connect directly to a specific Zone.

Below is an example of retrieving Zones based on browser location:

```javascript
//retrieve location
Flybits.context.Location.getState().then(function(geoLocation){
  var location = {
    lat: geoLocation.coords.latitude,
    lng: geoLocation.coords.longitude
  };

  //retrieve zones around the browser's location
  return Flybits.api.Zone.getZones({
    location:location
  });
}).then(function(resultObj){
  //do things with the Zones returned
  var zones = resultObj.result;

  //retrieve the next page of Zones based on initial request parameters if there exists a next page;
  return resultObj.nextPageFn?resultObj.nextPageFn():false;
}).then(function(resultObj){
  //do things with the next page of zones if there were any;
  if(resultObj){
    var zones = resultObj.result;
    var nextPageFn = resultObj.nextPageFn;
  }
}).catch(function(validation){
  //handle errors
});
```

### Retrieving Moments of a Zone
This is essentially retrieving content that has been associated with a Zone which is meant to encapsulate an entire experience.

```javascript
var zoneID = '10292369-18CF-45DE-B746-065F108AE6CB';

//retrieve Moments of a Zone based on ZoneID
Flybits.api.ZoneMomentInstance.getZMIs({
  zid: zoneID
}).then(function(resultObj){
  var zmis = resultObj.result;
  //do things with the ZoneMomentInstances returned
}).catch(function(validation){
  //handle errors
});
```

### Consuming HTML Moments
If a Moment's render type is equal to the constant `Flybits.Moment.RENDERTYPE_HTML`, you can retrieve the Moment's client URL and simply set the source of an `iframe`.  All access token retrieval is handled for you as long as you are an authenticated User.  Select Flybits core Moments may not have a render type equal to the constant `Flybits.Moment.RENDERTYPE_HTML` but also support end client HTML consumption.

```javascript
var zmi //previously retrieved ZoneMomentInstance.

var hasHTML = zmi.getRenderType() === Flybits.Moment.RENDERTYPE_HTML || zmi.isCoreMoment();

if(hasHTML){
  zmi.getClientURL().then(function(url){
    //set iframe with url
  }).catch(function(validation){
    //handle errors
    //possible errors are that an HTML end client is not available this particular Moment
  });
}
```

### Consuming Moments Through Moment APIs
In order to consume Moment data and render it natively in your custom UI, you must first procure an authorization claim from the Flybits core to prove to the Moment that you are indeed authenticated with Flybits.

Moments are in fact third party applications and have their own sets of APIs.  However, Flybits core Moments have a helper library that assist in content consumption.  This is called flybits-momentdata.js

Below is an example of consuming a Moment's content from a ZoneMomentInstance model without flybits-momentdata.js:

```javascript
var zmi //previously retrieved ZoneMomentInstance.

//request authorization claim from Flybits core
zmi.getAccessToken().then(function(tokenStr){
  var momentHostURL = zmi.moment.clientURL;

  //establish session with Moment server
  //the validate endpoint is an established convention that all Moments have to implement to receive a Flybits authorization claim.
  //use your favourite AJAX helper library; in this case we're following the new Fetch API spec.
  return fetch(momentHostURL+"/validate?signature="+tokenStr);
}).then(function(){
  //now that your session has been established with the Moment server, you may begin calling Moment API endpoints to consume the Moment's data
  //to determine the type of Moment in order to map to known API endpoints, access the following properties:
  var momentType = zmi.moment.iosPkg || zmi.moment.androidPkg;
}).catch(function(validation){
  //handle errors
});

```

Below is an example of consuming a Moment's content from a ZoneMomentInstance model with flybits-momentdata.js.  This is a vastly easier method for consuming Flybits core Moments because you do not need to know individual Moment API endpoints:

```javascript
//include flybits-momentdata.js
//Fmd is now available in the namespace.
var zmi //previously retrieved ZoneMomentInstance.

//retrieve appropriate controller for ZoneMomentInstance.
var controller = Fmd.use(zmi);
if(controller){
  controller.getData().then(function(data){
    //consume moment data
    //to determine the type of Moment data in order to render custom UI, access the following properties:
    var momentType = controller.type;
    //this can also be done
    momentType = zmi.moment.iosPkg || zmi.moment.androidPkg;
  });
} else{
  //zmi is not a Moment type that is supported by flybits-momentdata.js
}
```

## Context Management
The nature of the web platform up to now has been quite sandboxed.  That is to say a web application is unaware of its surroundings and has no access to device sensors available to native mobile applications.  Sensors such as the gyroscope, bluetooth beacons, and network adapter details are among some of the examples that a typical web application cannot access.  However, the platform is growing and the need for native device access is being acknowledged by major browser vendors.  This SDK has been designed in anticipation for that growth and thus context collection and reporting is highly extensible with the Flybits JS SDK.

An important note to take into consideration is that the definition of *context* isn't simply the state of a user's gyroscope.  The true meaning of *context* is the complete state being of a user.  Who is that user?  What have they previously done?  The answer to these questions is much larger in scope and cannot simply be answered by sensors on a mobile device.  That is why it is important to realize that just because your application is on the Web, doesn't mean it can't be contextualized.

The Flybits platform allows for server side Context Plugins to be built as microservices that connect proprietary data sources and report them as context parameters to the Flybits core.  Similiarily on the client side, the client mobile SDKs (iOS, Android, JavaScript) allow for developers to extend a `ContextPlugin` abstract class to report custom context parameters to the Core.  Any proprietary data that existing applications are privy to can be reported to the Core through the mobile SDK.  From that point, Context Rules can be defined on the graphical Experience Studio to augment mobile experiences without further development.

### Registering Available Plugins
This SDK includes some basic context plugins.  This list will grow as native device access grows across browser vendors:
* Location
* Connectivity

Below is an example as to how one can register existing or custom plugins and begin reporting to the Flybits Core.  The basic workflow is that context is collected from the individual context plugin instances.  Then they are batched together and reported to the Flybits Core.

```javascript
// Instantiate context plugins
var x = new Flybits.context.Location({
  maxStoreSize: 50,
  refreshDelay: 5000
});
var y = new Flybits.context.Connectivity({
  maxStoreSize: 50,
  refreshDelay: 5000
});
/**
 * Remember that every custom context plugin must extend the ContextPlugin
 * abstract class.
 */
var z = new CustomContextPlugin({
  maxStoreSize: 50,
  refreshDelay: 5000
});

/**
 * Register plugin instances.  Once registered they will begin collecting
 * context data into a local persistent storage database.  Note the Manager
 * will not yet report these context values to the Flybits Core.
 */
var xStart = Flybits.context.Manager.register(x);
var yStart = Flybits.context.Manager.register(y);
var zStart = Flybits.context.Manager.register(z);


Promise.settle([xStart,yStart,zStart]).then(function(){
  /**
   * After registration of the ContextPlugin instances it is only after
   * explicitly starting context reporting that the context manager will
   * begin sending values to the Core.
   */
  Flybits.context.Manager.startReporting();
});
```

### Creating a Custom Client-Side Context Plugin
If your application is privy to proprietary information you would like to report to Flybits as a context parameter, you must extend the `ContextPlugin` abstract class.  Proprietary information can include user information or flags that can be used to segment your user base.

Below is an example of how to extend the `ContextPlugin` abstract class.  You may wish to encapsulate the class definition below in a closure to allow for private static entities.

```javascript
var CustomContextPlugin = function(opts){
  // call parent abstract class constructor
  Flybits.context.ContextPlugin.call(this,opts);
  // custom initialization code here
};

// copy parent abstract class prototype
CustomContextPlugin.prototype = Object.create(Flybits.context.ContextPlugin.prototype);
CustomContextPlugin.prototype.constructor = CustomContextPlugin;

/**
 * You must override the support check method to account for cases where your
 * custom plugin can potentially not be compatible with all user browser platforms.
 */
CustomContextPlugin.isSupported = CustomContextPlugin.prototype.isSupported = function(){
  var def = new Flybits.Deferred();
  // custom check to see if the custom context plugin is supported on users' platform
  def.resolve();
  return def.promise;
};

/**
 * Main function that is called whenever the context manager collects context.
 */
CustomContextPlugin.getState = CustomContextPlugin.prototype.getState = function(){
  var def = new Flybits.Deferred();
  // custom code to retrieve and return proprietary data
  def.resolve();
  return def.promise;
};
```

The above is all the code to implement a custom context plugin.  All collection and reporting logic is automatically handled by the Flybits JS SDK.
