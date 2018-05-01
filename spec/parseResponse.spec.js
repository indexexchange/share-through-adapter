/**
 * @author:    Index Exchange
 * @license:   UNLICENSED
 *
 * @copyright: Copyright (C) 2017 by Index Exchange. All rights reserved.
 *
 * The information contained within this document is confidential, copyrighted
 *  and or a trade secret. No part of this document may be reproduced or
 * distributed in any form or by any means, in whole or in part, without the
 * prior written permission of Index Exchange.
 */
// jshint ignore: start

'use strict';

/* =====================================
 * Utilities
 * ---------------------------------- */

/**
 * Returns an array of parcels based on all of the xSlot/htSlot combinations defined
 * in the partnerConfig (simulates a session in which all of them were requested).
 *
 * @param {object} profile
 * @param {object} partnerConfig
 * @returns []
 */
function generateReturnParcels(profile, partnerConfig) {
    var returnParcels = [];

    for (var htSlotName in partnerConfig.mapping) {
        if (partnerConfig.mapping.hasOwnProperty(htSlotName)) {
            var xSlotsArray = partnerConfig.mapping[htSlotName];
            var htSlot = {
                id: htSlotName,
                getId: function () {
                    return this.id;
                }
            }
            for (var i = 0; i < xSlotsArray.length; i++) {
                var xSlotName = xSlotsArray[i];
                returnParcels.push({
                    partnerId: profile.partnerId,
                    htSlot: htSlot,
                    ref: "",
                    xSlotRef: partnerConfig.xSlots[xSlotName],
                    requestId: '_' + Date.now()
                });
            }
        }
    }

    return returnParcels;
}

/**
 * Returns an array of adEntries based on mock response data
 *
 * @param {object[]} mockData - mock response data
 */
function getExpectedAdEntry(mockData) {
    var expectedAdEntry = [];

    for(var i = 0; i < mockData.length; i++) {
        expectedAdEntry[i] = {};

        expectedAdEntry[i].price = mockData[i].price;
        expectedAdEntry[i].dealId = mockData[i].dealid;
    }

    return expectedAdEntry;
}

/* =====================================
 * Testing
 * ---------------------------------- */

describe('parseResponse', function () {

    /* Setup and Library Stub
     * ------------------------------------------------------------- */
    var inspector = require('schema-inspector');
    var proxyquire = require('proxyquire').noCallThru();
    var libraryStubData = require('./support/libraryStubData.js');
    var partnerModule = proxyquire('../share-through-htb.js', libraryStubData);
    var partnerConfig = require('./support/mockPartnerConfig.json');
    var fs = require('fs');
    var parseJson = require('parse-json');
    var path = require('path');
    var chai = require('chai');
    var sinon = require('sinon');
    var sinonChai = require("sinon-chai");
    var expect = chai.expect;
    chai.use(sinonChai);
    /* -------------------------------------------------------------------- */

    /* Instantiate your partner module */
    var partnerModule = partnerModule(partnerConfig);
    var partnerProfile = partnerModule.profile;

    /* Generate dummy return parcels based on MRA partner profile */
    var returnParcels;
    var result, expectedValue, mockData, returnParcels, responseData;
    var registerAd;

    describe('should correctly parse bids:', function () {

        beforeEach(function () {
            /* spy on RenderService.registerAd function, so that we can test it is called */
            registerAd = sinon.spy(libraryStubData["space-camp.js"].services.RenderService, 'registerAd');

            returnParcels = generateReturnParcels(partnerModule.profile, partnerConfig);

            /* Get mock response data from our responseData file */
            responseData = JSON.parse(fs.readFileSync(path.join(__dirname, './support/mockResponseData.json')));
            mockData = responseData.bid;
        });

        afterEach(function () {
            registerAd.restore();
        });

        /* Simple type checking on the returned objects, should always pass */
        it('each parcel should have the required fields set', function () {
            /* IF SRA, parse all parcels at once */
            if (partnerProfile.architecture) partnerModule.parseResponse(1, mockData, returnParcels);

            for (var i = 0; i < returnParcels.length; i++) {

                /* IF MRA, parse one parcel at a time */
                if (!partnerProfile.architecture) partnerModule.parseResponse(1, mockData[i], [returnParcels[i]]);

                var result = inspector.validate({
                    type: 'object',
                    properties: {
                        targetingType: {
                            type: 'string',
                            eq: 'slot'
                        },
                        targeting: {
                            type: 'object',
                            properties: {
                                [partnerModule.profile.targetingKeys.id]: {
                                    type: 'array',
                                    exactLength: 1,
                                    items: {
                                        type: 'string',
                                        minLength: 1
                                    }
                                },
                                [partnerModule.profile.targetingKeys.om]: {
                                    type: 'array',
                                    exactLength: 1,
                                    items: {
                                        type: 'string',
                                        minLength: 1
                                    }
                                },
                                pubKitAdId: {
                                    type: 'string',
                                    minLength: 1
                                }
                            }
                        },
                        price: {
                            type: 'number'
                        },
                        size: {
                            type: 'array',
                        },
                        adm: {
                            type: 'string',
                            minLength: 1
                        }
                    }
                }, returnParcels[i]);

                expect(result.valid, result.format()).to.be.true;
            }
        });

        it('each parcel should have the correct values set', function () {

            /* IF SRA, parse all parcels at once */
            if (partnerProfile.architecture) partnerModule.parseResponse(1, mockData, returnParcels);

            for (var i = 0; i < returnParcels.length; i++) {

                /* IF MRA, parse one parcel at a time */
                if (!partnerProfile.architecture) partnerModule.parseResponse(1, mockData[i], [returnParcels[i]]);

                expect(returnParcels[i]).to.exist;
                expect(returnParcels[i].pass).to.not.be.true;
                expect(returnParcels[i].price).to.equal(5.29);
                expect(returnParcels[i].size).to.deep.equal([1,1]);
                expect(returnParcels[i].targetingType).to.equal('slot');
                expect(returnParcels[i].adm).to.exist
            }
        });

        it('registerAd should be called with correct adEntry', function () {
            var i, expectedAdEntry = [];

            /* IF SRA, parse all parcels at once */
            if (partnerProfile.architecture === 1 || partnerProfile.architecture === 2) {
                expectedAdEntry = getExpectedAdEntry(mockData);

                partnerModule.parseResponse(1, mockData, returnParcels);

                for (var i = 0; i < expectedAdEntry.length; i++){
                    expect(registerAd).to.have.been.calledWith(sinon.match(expectedAdEntry[i]));
                }
            } else if (partnerProfile.architecture === 0) {
                /* IF MRA, parse one parcel at a time */
                for (var i = 0; i < mockData.length; i++) {
                    expectedAdEntry[i] = getExpectedAdEntry(mockData[i]);

                    partnerModule.parseResponse(1, mockData[i], [returnParcels[i]]);

                    for (var j = 0; j < expectedAdEntry[i].length; j++) {
                        expect(registerAd).to.have.been.calledWith(sinon.match(expectedAdEntry[i][j]));
                    }
                }
            }
        });
        /* -----------------------------------------------------------------------*/
    });

    describe('should correctly parse passes: ', function () {

        beforeEach(function () {
            /* spy on RenderService.registerAd function, so that we can test it is called */
            registerAd = sinon.spy(libraryStubData["space-camp.js"].services.RenderService, 'registerAd');
            returnParcels = generateReturnParcels(partnerModule.profile, partnerConfig);

            /* Get mock response data from our responseData file */
            responseData = JSON.parse(fs.readFileSync(path.join(__dirname, './support/mockResponseData.json')));
            mockData = responseData.pass;
        });

        afterEach(function () {
            registerAd.restore();
        });

        it('each parcel should have the required fields set', function () {

            /* IF SRA, parse all parcels at once */
            if (partnerProfile.architecture) partnerModule.parseResponse(1, mockData, returnParcels);

            for (var i = 0; i < returnParcels.length; i++) {

                /* IF MRA, parse one parcel at a time */
                if (!partnerProfile.architecture) partnerModule.parseResponse(1, mockData[i], [returnParcels[i]]);

                var result = inspector.validate({
                    type: 'object',
                    properties: {
                        pass: {
                            type: 'boolean',
                            eq: true,

                        }
                    }
                }, returnParcels[i]);

                expect(result.valid, result.format()).to.be.true;
            }
        });

        it('each parcel should have the correct values set', function () {

            /* IF SRA, parse all parcels at once */
            if (partnerProfile.architecture) partnerModule.parseResponse(1, mockData, returnParcels);

            for (var i = 0; i < returnParcels.length; i++) {

                /* IF MRA, parse one parcel at a time */
                if (!partnerProfile.architecture) partnerModule.parseResponse(1, mockData[i], [returnParcels[i]]);

                expect(returnParcels[i]).to.exist;
                // no fields set on a pass
            }
        });

        it('registerAd should not be called', function () {
            var i, expectedAdEntry = {};

            /* IF SRA, parse all parcels at once */
            if (partnerProfile.architecture === 1 || partnerProfile.architecture === 2) {
                partnerModule.parseResponse(1, mockData, returnParcels);

                expect(registerAd).to.not.have.been.called;
            } else if (partnerProfile.architecture === 0) {
                /* IF MRA, parse one parcel at a time */
                for (i = 0; i < returnParcels.length; i++) {
                    partnerModule.parseResponse(1, mockData[i], [returnParcels[i]]);

                    expect(registerAd).to.not.have.been.called;
                }
            }
        });
        /* -----------------------------------------------------------------------*/
    });
});
