# Table of Contents
1. [Introduction](#intro)
    * [Repository Structure](#Repository)
    * [Getting Started](#gettingStarted)
    * [Creative Tag](#creative)
2. [Requirements](#requirements)
3. [Partner Module Overview](#overview)
    * [Configuration](#configuration)
    * [Event Model](#eventModel)
    * [Creating a Partner Module](#creatingPartnerModule)
4. [Utility Libraries](#helpers)
    * [Utils](#utils)
    * [Network](#network)
    * [BidRoundingTransformer](#bidRounding)
5. [Testing](#testing)
    * [Basic Tests](#basictests)
    * [Writing Additional Tests](#additional)

# <a name='intro'></a>Introduction

<b>Welcome to the Index Exchange Partner Certification Process! </b>

Below you will find everything you need to complete the certification process and be a part of the Header Tag Wrapper!

## <a name='Repository'></a>Repository Structure
* `README.md`             -This is the main documentation file which should contain everything you need to complete the certification process. If anything is unclear, please refer to this document first.
* `share-through-htb.js` - This is your partner module file, by default it contains a template divided into multiple sections which need to be completed.
* `share-through-htb-validator.js` - This is the validator file for the configuration object that will be passed into your module.
* `share-through-htb-exports.js` - A file that contains all of the modules exports (i.e. any functions that need to be exposed to the outside world).
* `spec` - Contains the unit tests for the module.
    * `mockPartnerConfig.json` - this is a mock partner config for your module that will be used for unit testing.

##  <a name='gettingStarted'></a>Getting Started
1. <b>Complete the share-through-htb.js file </b>
    * share-through-htb.js is where all of your adapter code will live.
    * In order to complete the partner module correctly, please refer to the [Partner Module Overview](#overview) and the [Utility Libraries](#helpers) sections.
    * <b>Please refer to the [Partner Requirements and Guidelines](#requirements) when creating your module. Ensure requirements are met to streamline the review process.</b>
2. <b>Complete the share-through-htb-validator.js file</b>
    * This file is where your partner-specific configurations will need to be validated.
    * Things like type and null checks will be done here.
3. <b>Complete the share-through-htb-exports.js file</b>
    * This file will contain any functions that need to be exported or exposed to the outside world. Things like render functions, custom callbacks, etc. Any legacy render functions will also need to be exposed here. Anything added to the `shellInterface.ShareThroughHtb` will be accessible through `window.headertag.ShareThroughHtb`
4. <b> Run & Create Unit tests for your module</b>
    * Inside the spec folder you will find a set of basic unit tests for your module.
    * You must pass these basic unit tests before submitting your module.
    * In addition, you should create more specific unit tests with actual values based on mock ad responses to confirm that your module is working as expected.
    * Please refer to the [Testing](#testing) section below for more information.
5. <b>Submitting for Review</b>
    * Once the module has been verified submit a pull request from the `development-v2`branch to the `master-v2` branch for the Index Exchange team to review. If everything is approved, your adapter will be officially certified!

##  <a name='creative'></a> Standard HTW Creative Tag
Our standard creative tag in dfp looks as follows:
```html
<script type="text/javascript">
var w = window;
for (var i = 0; i < 10; i++) {
    w = w.parent;
    if (w.headertag) {
        try {
            w.headertag.ShareThroughHtb.render(document, %%PATTERN:TARGETINGMAP%%, '%%WIDTH%%', '%%HEIGHT%%');
            break;
        } catch (e) {
            continue;
        }
    }
}
</script>
```

<br>

# <a name='requirements'></a> Partner Requirements & Guildelines
In order for your module to be successfully certified, please refer to the following list of requirements and guidelines.
Items under required <b><u>must</b></u> be satisfied in order to pass the certification process. Items under guidelines are recommended for an optimal setup and should be followed if possible.

### General

#### Required
* The only targeting keys that can be set are predetermined by Index. The partner module should not be setting targeting on other keys.
* Must support the following browsers: IE 9+, Edge, Chrome, Safari, and Firefox

#### Recommended
* Please use our helper libraries when possible. Refer to our [Utility Libraries](#helpers) documentation below. All of the utility functions in this library are designed to be backwards compatible with supported browsers to ease cross-browser compatibility.

### Bid Request Endpoint

#### Required
* Must provide cache busting parameter. Cache busting is required to prevent network caches.
* Partner endpoint domain must be consistent. Load balancing should be performed by the endpoint.
* Your endpoint should support HTTPS request. When wrapper loads in secure pages, all requests need to be HTTPS. If you're unable to provide a secure endpoint, we will not be able to make requests to your ad servers.

#### Recommended
* Your module should support a single request architecture (SRA) which has a capability to send multiple bid requests in a single HTTP request.
* Partner should use AJAX method to make bid requests. Please use our [Network](#network) utility library for making network requests, particularly the `Network.ajax` method. This ensures the requests will work with all browsers.

### Bid Response

#### Required
* Returned bid must be a <b>net</b> bid.
* Pass on bid must be explicit in the response.
* All returned bids shall be in the currency trafficked by the publisher.
* Size must be returned in the response. The sizes must also match the requested size. This size parameter will be validated.
* Encrypted prices must be flagged in the response.

### Pixels & Tracking Beacons

#### Required
* Pixels/beacons must only be dropped only when the partner wins the auction and their ad renders.
* Dropping pixels during auction slows down the execution of auctions and is not allowed by Index Exchange.

### DFP Setup

#### Required
* DFP line items, creatives, and render functions will be set up by the Index Exchange team.
<br><br>

# <a name='overview'></a> Partner Module Overview

## <a name='configuration'></a>Prelude: Configuration & Parcels

The Header Tag Wrapper passes each partner a configuration object that has been configured based on a publisher's website. This object contains all the configuration information required for the wrapper, including partner-specific slot mappings, timeouts, and any other partner-specific configuration.
The partner-specific slot mappings dictate how ad slots on the page will map to partner-specific configuration.
There are 2 concepts to be familiar with when understanding how slots on the page are mapped back to partner-specific configuration. Header Tag Slots, which refers to htSlots and partner-specific configuration, which refers to xSlots in the codebase.
* htSlots - This is an abstraction of the googletag.slot object.
  * These will need to be mapped to xSlots.
* xSlots - These are also an abstraction for partner-specific configuration that will be mapped to htSlots.
  * These represent a single partner-specific configuration.
  * An xSlot is how a partner can map their ad server specific identifiers (placementIDs, siteIDs, zoneIDs, etc) to the `htSlot` object.
  * It can represent a single or multiple sizes.
  * Multiple xSlots can be mapped to the same htSlot.

Example Partner Configuration Mapping
```javascript
{
    "partners": {
        "ShareThroughHtb": {
            "enabled": true,
            "configs": {
                "xSlots": {
                    "xSlot1": {
                        "placementID": "123",
                        "sizes": [ [300, 250], [300, 600] ]
                    },
                    "xSlot2": {
                        "placementID": "345",
                        "sizes": [ [300, 250] ]
                    }
                },
                "mapping": {
                    "htSlotID-1": [ "xSlot1" ],
                    "htSlotID-2": [ "xSlot2" ]
                }
            }
        }
    }
}
```

Based on the mapping defined in the partner config, <i>Parcels</i> will be generated for every xSlot/htSlot pair. Parcels are objects that carry different kinds of information throughout the wrapper. In the context of the adapter, parcels are the input into your adapter. Parcels carry information regarding which slots on the publisher's page need demand. More specifically parcels contain information like xSlot reference, htSlot references, demand (after its been applied by the adapter in parseResponse), etc. Each parcel represents a single combination of an htSlot and an xSlot.

Each parcel is an object in the following form:

```javascript
{
    "partnerId": "SHTH",
    "htSlot": {
      "__type__": "HeaderTagSlot"
    },
    "ref": "googletag.Slot",      // reference to the slot on the page, in this example it is a googletag slot
    "xSlotRef": {   // contains the reference to the xSlot object from the partner configuration.
      "placementID": "123",
      "sizes": [ [300, 250], [300, 600] ]
    },
    "xSlotName": "1",
    "requestId": "_fwyvecpA" // generated by the wrapper is used to map the creative back to a piece of demand.
                            // This will show up as targeting under the id key, and is used by the render function.
}
```

These parcels will be fed into both of the functions that your adapter needs to implement:

1. First `generateRequestObj` will need to craft a bid request for the `parcels` that need demand.

2. Second `parseResponse` will take the same parcels and apply the demand (set specific properties in the parcel objects) that is returned from the bid requests to the same parcels and send them back to the wrapper.

## <a name='eventModel'></a> High Level Event Model

1. The Header Tag Wrapper script tag is loaded on the page.
2. Wrapper specific configuration validation is performed.
3. All the partner modules are instantiated.
    * Partner-specific configuration validation is performed - checking that all the required fields are provided and that they are in the correct format.
4. An external request for demand is made to the wrapper. This can be via a googletag display or refresh call, or by other methods depending on the wrapper product in use.
The wrapper requests demand from the partner modules for the required slots (provided in the form of parcels).
    * The wrapper calls `generateRequestObj(returnParcels)` for every partner module.
    * The adapter then crafts and returns a request object based on the parcels (containing slot information) specified.
    * The wrapper then sends out a bid request using the request object.
    * Depending on how the adapter is set up and whether jsonp is supported, a response callback (`adResponseCallback`) is called.
    * The adapter parses the response (`parseResponse`) and attaches the demand to the same returnParcels. It also registers the ad creative with the wrapper's render service.
    * The returnParcels are then sent back to the wrapper.
5. The wrapper applies targeting using the demand from the returnParcels.
6. If the partner wins the auction in the ad server, their creative code will be returned and executed.
    * The creative code contains a call to the wrapper's render function.
7. The partner ad is rendered.

## <a name='creatingPartnerModule'></a> Creating a Partner Module

In this section you will be filling out the share-through-htb.js, share-through-htb-exports.js, and the share-through-htb-validator.js files to create your module.

### Step 0: Config Validation (`share-through-htb-validator.js`)
Before you get started on writing the actual code for your module, you need to figure out what your partner configuration (refer to [Configuration](#configuration)) object will look like. This is crucial because it will determine the input (parcels) to your module's core functions.

Once you have a basic idea of what this will look like, and how you will uniquely identify each slot on your server (via xSlot placementId or other inventory codes) you will need to validate this configuration. This validation will be performed by the wrapper using the `share-through-htb-validator.js` file.

The `share-through-htb-validator.js` file contains a single export, a `partnerValidator` function, that takes in the configuration object that will be fed to your module's constructor (refer to [Configuration](#configuration) for an example layout) and validates it via type checks. The type checks are performed using an external library called `schema-inspector`, for which the documentation can be found here https://github.com/Atinux/schema-inspector.

We have provided a very basic validation schema in `share-through-htb-validator.js` that is based off of the example `mockPartnerConfig.js` object found in the `spec/support` directory for testing (refer to the [Testing](#testing) section for the testing structure).

Once you have filled this file out, you can continue actually writing your module!

### Step 1: Partner Configuration (`share-through-htb.js`)
This section involves setting up the general partner configuration such as name, default pricing strategy as well as the general format of incoming/outgoing bids for the adapter. Please read the following descriptions and update the `__profile` variable if necessary.

* <u>partnerId</u> - This is simply the name of our module, generally if your module is a bidder the name will end with Htb. The format of the name should be PartnerName{Type}.
* <u>namespace</u> - Should be the same as partnerId, it is the namespace that is used internally to store all of variables/functions related to your module, i.e. adResponseCallbacks.
* <u>statsId</u> - A unique identifier used for analytics that will be provided for you.
* <u>version</u> - If this is the first iteration of your module, please leave this field at 2.0.0.
* <u>targetingType</u> - The targeting type of your bidder, the default is slot for slot level targeting but could also be page.
* <u>enabledAnalytics</u> - The analytics that the wrapper will track for the module. requestTime is the only currently supported analytic, which records different times around when bid requests occur.
* <u>features</u> - Extra features that a partner can support
    * <u>demandExpiry</u> - Setting an expiry time on the demand that partner returns.
    * <u>rateLimiting</u> - Used for limiting the amount of requests to a given partner for a given slot on pages that support rate limiting in dfp.
* <u>targetingKeys</u> - Different targeting keys that will be used to record demand for a given parcel.
    * <u>id</u> - This key will be used to trace back the creative that has won in dfp for rendering.
    * <u>om</u> - This key signals the open market bid in cpm.
    * <u>pm</u> - This key signals the private market bid in cpm.
    * <u>pmid</u> - This key signals the private market deal id.

The last three properties are critical for the wrapper to understand how to interact with the endpoint:
* callbackType:
    * <u>Partner.CallbackTypes.ID</u> -
        Use this option if your endpoint accepts an arbitrary identifier in requests which will be returned in the matching response. You will need to set this callbackId in the `generateRequestObj` function and retrieve it in the adResponseCallback function. This is the preferred method for matching requests and responses. Pass the following reference into your request object when generating the request object in `generateRequestObj`.
        `SpaceCamp.NAMESPACE + '.' + __profile.namespace + '.adResponseCallback'`. You will need to fill out the `adResponseCallback` function to store the ad response in the `__baseClass._adResponseStore[callbackId]` object, where `callbackId` is the same callbackId that was passed back to the wrapper as part of the object that is returned in `generateRequestObj`. The wrapper will use the `callbackId` to reference to pull your stored ad response from that `adResponseStore` and feed it back to `parseResponse`. You will also need to expose this function inside your exports file, see below exports section for more information.
    * <u>Partner.CallbackTypes.CALLBACK_NAME</u> -
        Use this option if your endpoint has no parameter which can be used as a callback ID. The wrapper will generate a new callback function for each request, and use the function name to tie requests to responses. Similarly to the above ID method, you can reference the generated ad response callback as such: `'window.' + SpaceCamp.NAMESPACE + '.' + __profile.namespace + '.adResponseCallbacks.' + callbackId`, where `callbackId` is the same unique callbackId that is passed back to the wrapper as part of the object that is returned in `generateRequestObj`. Unlike the ID method above, you do not need to fill out the `adResponseCallback` function. The response will simply be passed into the `parseResponse` function.
    * <u>Partner.CallbackTypes.NONE</u> -
        Use this option if your endpoint supports AJAX only and will return a pure JSON response rather than JSONP with a callback function. In this mode your endpoint will not receive any demand requests if the user is using a browser which does not fully support AJAX, such as Internet Explorer 9 or earlier. In this mode,
        you also do NOT need to provide a callback function in `generateRequestObj`.
* architecture:
    * <u>Partner.Architectures.MRA</u> -
        Use this option (Multi-Request Architecture) if your endpoint requires a separate network request for each ad slot. In this mode your endpoint will receive one network request for every xSlot mapping active in the current wrapper demand request.
    * <u>Partner.Architectures.FSRA</u> -
        Use this option (Fully Single-Request Architecture) if your endpoint can handle any number of slots in a single request in any combination, including multiple requests for the same slot. In this mode your endpoint will receive a single network request per wrapper demand request.
    * <u>Partner.Architectures.SRA</u> -
        Use this option (Single-Request Architecture) if your endpoint can handle any number of slots in a single request, but cannot repeat the same xSlot more than once in a given request. e.g., you use a placementId and can receive a request for multiple placementIds at once, but not for the same placementId twice. The wrapper will arrange the mapped xSlots into the minimum possible number of network requests to your endpoint.
* requestType:
    * <u>Partner.RequestTypes.ANY</u> -
        Use any request type when making requests. The wrapper will attempt to make an AJAX request for your bid requests, if XHR is not supported, the wrapper will attempt to make a JSONP request if possible.
    * <u>Partner.RequestTypes.AJAX</u> -
        Use only AJAX for bid requests. Note, if the browser does not support ajax the bid requests will not go out.
    * <u>Partner.RequestTypes.JSONP</u> -
        Use only JSONP for bid requests.

Please also fill out the `bidTransformerConfigs` according to your module's bid response cpm format.
Refer to the below [BidRoundingTransformer](#bidRounding) section for details on how the bidTransformer works. It is <b>crucial</b> that you fill this out correctly and output your bid in <b><u>CENTS</u></b>, otherwise all of your cpm values will be incorrectly formated (i.e. passing dollars instead of cents).

### Step 2: Generate Request URL (`share-through-htb.js`)
This step is for crafting a bid request url given a specific set of parcels.

For this step, you must fill out the `generateRequestObj(returnParcels)` function. This function takes in an array of returnParcels.
These are the parcel objects that contain the different slots for which demand needs to be requested.

The wrapper will ensure that the array contains an appropriate set of parcels to pass into a single network
request for your endpoint based on the value set in __profile.architecture. Note, in the particular case your
architecture is MRA, this array will have length 1.

Using this array of parcels, the adapter must craft a request object that will be used to send out the bid request for these slots. This object must contain the request URL, an object containing query parameters, and a callbackId.

The final returned object should looks something like this:
```javascript
{
    url: 'http://bidserver.com/api/bids' // base request url for a GET/POST request
    data: { // query string object that will be attached to the base url
        slots: [
            {
                placementId: 54321,
                sizes: [[300, 250]]
            },{
                placementId: 12345,
                sizes: [[300, 600]]
            },{
                placementId: 654321,
                sizes: [[728, 90]]
            }
        ],
        site: 'http://google.com'
    },
    callbackId: '_23sd2ij4i1' //unique id used for pairing requests and responses
}
```

More information can be found in the comment section of the function itself.

### Step 3: Response Callback (`share-through-htb.js`)
Once the request from Step 2 finishes the `adResponseCallback` will be called to store the returned response in a `adResponseStore` object.

If `__profile.callbackType` is set to `CALLBACK_NAME` or `NONE`, the wrapper will handle the callback for you and you can remove this function. If it is set to ID, you must retrieve the callback ID from the network response and store that response in the `_adResponseStore` object keyed by the callback ID.

See the function in the template for details.

### Step 4: Parsing and Storing Demand (`share-through-htb.js`)
In this step the adapter must parse the returned demand from the bid response and attach it the returnParcels objects.
The returnParcels array will be one of the same arrays that was passed to `generateRequestObj` earlier.

This step involves first matching the returned bids to the internal returnParcels objects. This can be done via some
identifier that was setup for an xSlot (for example, a placementId) in the partner configuration and the same id being present in the bid response object.

This function first iterates over all of the returned bids, parsing them and attaching the demand to the returnParcel objects (which will be implicitly passed back to the wrapper). This step also involves registering the creative (if returned) with the render service, which is responsible for storing and rendering that creative if the corresponding demand wins the DFP auction.

In order to complete this step correctly, please fill out the section which includes the matching criteria. This step is necessary to map returnParcel objects to the returned bids correctly. In order to do this, we need to use some common criteria that is present both in the xSlot configuration and in the returned bids (usually placementIds or inventory codes).

Also please fill out each of the variables for each bid, these will be attached to the parcel objects to store the demand:

* bidPrice - The bid price for the given slot
* bidWidth - The width of the given slot
* bidHeight - The height of the given slot
* bidCreative - The creative/adm for the given slot that will be rendered if is the winner.
* bidDealId - The dealId if applicable for this slot.
* bidIsPass - True/false value for if the module returned a pass for this slot.

After filling out these objects, the resulting returnParcel objects should look something like this:

```javascript
{
    "partnerId": "SHTH",
    "htSlot": {
      "__type__": "HeaderTagSlot"
    },
    "ref": "googletag.Slot",      // reference to the slot on the page, in this example it is a googletag slot
    "xSlotRef": {   // contains the reference to the xSlot object from the partner configuration.
      "placementID": "123",
      "sizes": [ [300, 250], [300, 600] ]
    },
    "xSlotName": "1",
    "requestId": "_fwyvecpA",

    // notice these new fields with demand
    "targetingType": "slot"
    "targeting" : {
        "ix_shth_id": ["_230l09jd2"],
        "ix_shth_cpm": ["300x250_2.50"]
    },
    "price": 2.50,
    "size": [300,250],
    "adm": "<script> test creative </script>"
}
```

### Step 5: Rendering (`share-through-htb.js`)
This step is for rendering the winning creative. If the partner module's line item wins, the creative code will be returned and inserted into the iframe for that googletag slot. The standard creative code will contain a call to the partner module's specific `render` function.

The adm passed into this function will be the same bidCreative that was earlier attached to a given parcel object.
They are matched via the id targeting key.

The included `render` function should work as is for most partners, as it simply involves a call to document.write to write the creative to the iframe in which it was passed into by dfp.

### Step 6: Exports (`share-through-htb-exports.js`)
In this step, you will be required to fill out the exports file for your module. This file will contain all of the functions that will need to be exposed to outside page if they need to be accessed outside of the wrapper. In the usual case, all you will need to change in this file is your partner module's name in the included snippet:

```javascript
shellInterface.ShareThroughHtb = { //shell interface is the window variable that is accessable through the window object, currently this will always be window.headertag
    render: SpaceCamp.services.RenderService.renderDfpAd.bind(null, 'ShareThroughHtb')
};
```

This snippet, exposes your module's render function to the outside world via the `window.headertag` namespace.

If your module requires using a custom adResponse callback via Partner.CallbackTypes.ID callback type, that callback will need to be exposed here. Which would look something like this:

```javascript
if (__directInterface.Layers.PartnersLayer.Partners.ShareThroughHtb) {
    shellInterface.ShareThroughHtb = shellInterface.ShareThroughHtb || {};
    shellInterface.ShareThroughHtb.adResponseCallback = __directInterface.Layers.PartnersLayer.Partners.ShareThroughHtb.adResponseCallback;
}
```

If your module requires using a custom adResponse callback via Partner.CallbackTypes.NAME callback type, that callback swill need to be exposed here. Which would look something like this:

```javascript
if (__directInterface.Layers.PartnersLayer.Partners.ShareThroughHtb) {
    shellInterface.ShareThroughHtb = shellInterface.ShareThroughHtb || {};
    shellInterface.ShareThroughHtb.adResponseCallbacks = __directInterface.Layers.PartnersLayer.Partners.ShareThroughHtb.adResponseCallbacks;
}
```

# <a name='helpers'></a> Utility Libraries
There are a lot of helper objects available to you in you partner module.

### Utilities
* `isObject(entity)` - Return true if entity is an object.
* `isArray(obj)` - Return true if obj is an array.
* `isNumber(entity)` - Return true if entity is a number.
* `isString(entity)` - Return true if entity is a string.
* `isBoolean(entity)` - Return true if entity is a boolean.
* `isFunction(entity)` - Return true if entity is a function.
* `isRegex(entity)` - Return true if entity is regex.
* `isEmpty(entity)`
    * if entity is a string, return true if string is empty.
    * if entity is an object, return true if the object has no properties.
    * if entity is an array, return true if the array is empty.
* `arrayDelete(arr, value)` - Delete given value from an object or array.
* `randomSplice(arr)` - Returns a randomly spliced item from an array.
* `deepCopy(entity)` - Return a deep copy of the entity.
* `mergeObjects(entity1, entity2, ...)` - Takes the first entity and overwrites it with the next entity, returning the final object.
* `mergeArrays(arr1, arr2, ...)` - Merge all of the specified arrays into one and return it.
* `tryCatchWrapper(fn, args, errorMessage, context)` - Wrap the given arguments into a try catch block. Returning a function.
* `isArraySubset(arr1, arr2, matcher)` - Return true if `arr1` is a subset of `arr2`.

### System
* `now()` - Return the number of milliseconds since 1970/01/01.
* `generateUniqueId(len, charSet)` - Creates a unique identifier of the given length using the optionally specified charset:
    * `ALPHANUM`: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
    * `ALPHA`: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
    * `ALPHA_UPPER`: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    * `ALPHA_LOWER`: 'abcdefghijklmnopqrstuvwxyz',
    * `NUM`: '0123456789'
* `getTimezoneOffset()` - Returns the timezone offset.
* `documentWrite(doc, data)` - doc.write the data using the specified document `doc`.

### Size
* `arrayToString(arr)` - Returns the string representation of an array in the form of '300x250'.
* `stringToArray(str)` - Return the array rep representation of a string in the form of [300, 250].

### Browser
* `getProtocol(httpValue, httpsValue)` - Return `document.location.protocol` or `httpValue` if `document.location.protocol` is http and `httpsValue` if `document.location.protocol` is https.
* `isLocalStorageSupported()` - Checks if local storage is supported.
* `getViewportWidth()` - Return viewport width.
* `getViewportHeight()` - Return viewport height.
* `isTopFrame()` - Checks to see if the code is being run in the top frame or iframe.
* `getScreenWidth()` - Returns screen.width.
* `getScreenHeight()` - Returns screen.height.
* `getReferrer()` - Return document.referrer.
* `getPageUrl()` - Return the page's url.
* `getHostname()` - Return the page's hostname.
* `getNearestEntity(entityName)` - Returns the entity with `entityName` in the nearest `window` scope.
* `createHiddenIFrame(srcUrl, scope)` - Generate a hidden iframe and then append it to the body. Use the `srcUrl` and `scope` if provided.

### <a name='deviceTypeChecker'></a> DeviceTypeChecker
* `getDeviceType()` - Returns the device type.

### <a name='bidRounding'></a> BidRoundingTransformer
* `transformBid(rawBid)` - Transform rawBid into the configured format. This includes, rounding/flooring according to the bidTransformConfig that was used to instantiate the library. The bidTransformConfig is an object of the format:
    * `floor` - Minimum acceptable bid price.
    * `inputCentsMultiplier` - Multiply input bids by this to get cents.
    * `outputCentsDivisor` -  Divide output bids in cents by this.
    * `outputPrecision` - Decimal places in output.
    * `roundingType` - Should always be 1.
    * `buckets` - Buckets specifying rounding steps.

Example of `bidTransformConfig`:

```javascript
var bidTransformConfig = {          // Default rounding configuration
    'floor': 0,
    'inputCentsMultiplier': 100,    // Input is in dollars
    'outputCentsDivisor': 100,      // Output as dollars
    'outputPrecision': 2,           // With 2 decimal places
    'roundingType': 1,              // Floor instead of round
    'buckets': [{
        'max': 2000,                // Up to 20 dollar (above 5 cents)
        'step': 5                   // use 5 cent increments
    }, {
        'max': 5000,                // Up to 50 dollars (above 20 dollars)
        'step': 100                 // use 1 dollar increments
    }]
};
```

# <a name='testing'></a> Testing

### General Test Structure
For our unit testing suite we are using a combination of jasmine as a test runner, chai for assertion and schema-inspector for type validation.

The spec folder is where all of the testing files are contained and is structured as follows:
* spec - The main folder for all of unit testing
    * support - Contains various stubs and mock data
        * `mockPartnerConfig.json` - Contains your module mock partner config that is used throughout the suite
        * `mockResponseData.json` - Contains your module's mock response data that is used in the `parseResponse.spec.js` test cases.
        * `libraryStubData.js` - Stubs for various libraries
        * `partnerStub.js` - Stub for the partner library
        * `jasmine.json` - Jasmine test runner config
    * `generateRequestObj.spec.js` - The spec for testing `generateRequestObj` function
    * `parseResponse.spec.js` - The spec for testing `parseResponse` function
    * `profile.spec.js` - The spec for testing the partner's `profile` configuration

As you can see, we have divided the spec files based on the different functions/areas that you need to fill out for your module.

### <a name='basictests'></a> Running Basic Tests
In order to submit your module for review, you must first pass all of the basic test cases included in the
repository. In order to run these tests you must first install all the necessary npm packages by running `npm install`
and then simply run the command `npm test` from the root of the repository to execute the tests. NPM version `3.
8.6` and node version `v6.1.0` were used when developing these tests.

Before running the `npm test` command you must first fill out both the `mockPartnerConfig.json` to contain a correct sample configuration for your partner. Based on this configuration, parcels will be generated. For SRA partners, all of the slots outlined in your mockPartnerConfig will have corresponding parcels generated. For MRA, each of the generated slots will be fed into your functions <b> one at a time </b>.

You will also need to fill out the `mockResponseData.json` file to match the `mockPartnerConfig.json`.  This file will contain a json object with the following three properties that need to be filled out accordingly.
* `bid` - this is the response data array for in the case of real bids, this is used for the `should correctly parse bids` test cases. If your partner is MRA, keep this an array and put response objects inside it, one for every generated return parcel. If your partner is SRA, make this property a single object that contains the response.
* `pass` - same as bid but used to mock bid passes.
* `deals` - same as bid but used to mock deals. Should include some sort of `dealid` field.

Note: These ad response should match your `mockPartnerConfig.json` in the sense that there should be the correct number of objects/demand in this object for each one of the returnParcels that are generated from your partnerConfig.

For example, `mockPartnerConfig.json` contains a sample partner config. Here are the different `returnParcels` arrays that will be generated.

<b><u>NOTE</b></u>: This is an array of parcels, for SRA architectures the <u>entire</u> array is fed into your functions but for MRA architectures <u> one parcel at a time </u> is fed into your functions. This is because MRA partners have one request per slot.

```javascript
var returnParcels = [{
    partnerId: 'ShareThroughHtb',
    htSlot: { getId: function () {
        return "htSlot1"
    } },
    ref: '',
    xSlotRef: { placementId: '54321', sizes: [ [300,250] ] },
    requestId: '_1496788873668',
  },{
    partnerId: 'ShareThroughHtb',
    htSlot: { getId: function () {
        return "htSlot1"
    } },
    ref: '',
    xSlotRef: { placementId: '12345', sizes: [ [300,600] ] },
    requestId: '_1496788873668',
  },{
    partnerId: 'ShareThroughHtb',
    htSlot: { getId: function () {
        return "htSlot2"
    } },
    ref: '',
    xSlotRef: { placementId: '654321', sizes: [ [728,90] ] },
    requestId: '_1496788873668',
  }]
```

An example `mockResponseData.json` will be structured, according to the above returnParcel example, as follows depending on the architecture of your partner.

For SRA:
```javascript
{
    bid: {  // Notice how this is an object containing the demand for ALL the parcels.
        54321: {
            price: 23,
            adm: '<script> test </script>'>,
            width: 300,
            height: 250
        },
        12345: {
            price: 10,
            adm: '<script> test2 </script>'>,
            width: 300,
            height: 600
        },
        654321: {
            price: 15,
            adm: '<script> test3 </script>'>,
            width: 728,
            height: 90
        }
    },
    pass: { // Contains only passes
        54321: {
            pass: true
        },
        12345: {
            pass: true
        },
        654321: {
            pass: true
        }
    },
    deals: { // Contains dealids
        54321: {
            price: 23,
            adm: '<script> test </script>'>,
            width: 300,
            height: 250,
            dealid: 'DEAL1'
        },
        12345: {
            price: 10,
            adm: '<script> test2 </script>'>,
            width: 300,
            height: 600,
            dealid: 'DEAL2'
        },
        654321: {
            price: 15,
            adm: '<script> test3 </script>'>,
            width: 728,
            height: 90,
            dealid: 'DEAL3'
        }
    }
}

```

For MRA:
```javascript
{
    bids: [ // notice this now an array. again this is because in MRA there is one request per slot
            // and each object represents a single response
        {
            price: 23,
            adm: '<script> test </script>'>,
            width: 300,
            height: 250,
        },
        {
            price: 10,
            adm: '<script> test2 </script>'>,
            width: 300,
            height: 600
        },
        {
            price: 15,
            adm: '<script> test3 </script>'>,
            width: 728,
            height: 90
        }
    ],
    pass: [ // Contains only passes
        {
            pass: true
        },
        {
            pass: true
        },
        {
            pass: true
        }
    ],
    deals: [
        {
            price: 23,
            adm: '<script> test </script>'>,
            width: 300,
            height: 250,
            dealid: 'DEAL1'
        },
        {
            price: 10,
            adm: '<script> test2 </script>'>,
            width: 300,
            height: 600,
            dealid: 'DEAL2'
        },
        {
            price: 15,
            adm: '<script> test3 </script>'>,
            width: 728,
            height: 90,
            dealid: 'DEAL3'
        }
    ]
}

```

These tests perform basic type checks and make sure that all of the required fields have been filled out correctly. For example, if the mockData returned a bid, each of the parcels above for an SRA architecture bidder should contain new additional fields for price, size, creative, and targeting.

However these tests are very basic and we encourage you to write your own test cases to further confirm the functionality of your module. Please refer to the next section on how to write additional test cases.

### <a name='additional'></a> Creating Additional Tests

In order to create additional test cases and further verify your module, please fill out the `ADD MORE TEST CASES TO TEST AGAINST REAL VALUES` section in both `generateRequestObj.spec.js` and `parseResponse.spec.js` for your corresponding module architecture type.


