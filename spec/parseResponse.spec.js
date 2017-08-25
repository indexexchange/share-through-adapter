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
            for (var i = 0; i < xSlotsArray.length; i++) {
                var xSlotName = xSlotsArray[i];
                returnParcels.push({
                    partnerId: profile.partnerId,
                    htSlot: {
                        getId: function () {
                            return htSlotName
                        }
                    },
                    ref: "",
                    xSlotRef: partnerConfig.xSlots[xSlotName],
                    requestId: '_' + Date.now()
                });
            }
        }
    }

    return returnParcels;
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
    var responseData = require('./support/mockResponseData.json');
    var expect = require('chai').expect;
    /* -------------------------------------------------------------------- */

    /* Instantiate your partner module */
    var partnerModule = partnerModule(partnerConfig);
    var partnerProfile = partnerModule.profile;

    /* Generate dummy return parcels based on MRA partner profile */
    var returnParcels;
    var result, expectedValue, mockData, returnParcels;

    describe('should correctly parse bids:', function () {
        /* Simple type checking on the returned objects, should always pass */
        it('each parcel should have the required fields set', function () {
            returnParcels = generateReturnParcels(partnerModule.profile, partnerConfig);

            /* Get mock response data from our responseData file */
            mockData = responseData.bid;

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

        /* ---------- ADD MORE TEST CASES TO TEST AGAINST REAL VALUES ------------*/
        it('each parcel should have the correct values set', function () {
            returnParcels = generateReturnParcels(partnerModule.profile, partnerConfig);

            /* Get mock response data from our responseData file */
            mockData = responseData.bid;

            /* IF SRA, parse all parcels at once */
            if (partnerProfile.architecture) partnerModule.parseResponse(1, mockData, returnParcels);

            for (var i = 0; i < returnParcels.length; i++) {

                /* IF MRA, parse one parcel at a time */
                if (!partnerProfile.architecture) partnerModule.parseResponse(1, mockData[i], [returnParcels[i]]);

                /* Add test cases to test against each of the parcel's set fields
                 * to make sure the response was parsed correctly.
                 *
                 * The parcels have already been parsed and should contain all the
                 * necessary demand.
                 */

                expect(returnParcels[i]).to.exist;
            }
        });
        /* -----------------------------------------------------------------------*/
    });

    describe('should correctly parse passes: ', function () {


        it('each parcel should have the required fields set', function () {
            returnParcels = generateReturnParcels(partnerModule.profile, partnerConfig);

            /* Get mock response data from our responseData file */
            mockData = responseData.pass;

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

        /* ---------- ADD MORE TEST CASES TO TEST AGAINST REAL VALUES ------------*/
        it('each parcel should have the correct values set', function () {
            returnParcels = generateReturnParcels(partnerModule.profile, partnerConfig);

            /* Get mock response data from our responseData file */
            mockData = responseData.pass;

            /* IF SRA, parse all parcels at once */
            if (partnerProfile.architecture) partnerModule.parseResponse(1, mockData, returnParcels);

            for (var i = 0; i < returnParcels.length; i++) {

                /* IF MRA, parse one parcel at a time */
                if (!partnerProfile.architecture) partnerModule.parseResponse(1, mockData[i], [returnParcels[i]]);

                /* Add test cases to test against each of the parcel's set fields
                 * to make sure the response was parsed correctly.
                 *
                 * The parcels have already been parsed and should contain all the
                 * necessary demand.
                 */

                expect(returnParcels[i]).to.exist;
            }
        });
        /* -----------------------------------------------------------------------*/
    });

    describe('should correctly parse deals: ', function () {

        /* Simple type checking on the returned objects, should always pass */
        it('each parcel should have the required fields set', function () {
            returnParcels = generateReturnParcels(partnerModule.profile, partnerConfig);

            /* Get mock response data from our responseData file */
            mockData = responseData.deals;

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
                                [partnerModule.profile.targetingKeys.pm]: {
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
                        },
                    }
                }, returnParcels[i]);

                expect(result.valid, result.format()).to.be.true;
            }
        });

        /* ---------- ADD MORE TEST CASES TO TEST AGAINST REAL VALUES ------------*/
        it('each parcel should have the correct values set', function () {
            returnParcels = generateReturnParcels(partnerModule.profile, partnerConfig);

            /* Get mock response data from our responseData file */
            mockData = responseData.deals;

            /* IF SRA, parse all parcels at once */
            if (partnerProfile.architecture) partnerModule.parseResponse(1, mockData, returnParcels);

            for (var i = 0; i < returnParcels.length; i++) {

                /* IF MRA, parse one parcel at a time */
                if (!partnerProfile.architecture) partnerModule.parseResponse(1, mockData[i], [returnParcels[i]]);

                /* Add test cases to test against each of the parcel's set fields
                 * to make sure the response was parsed correctly.
                 *
                 * The parcels have already been parsed and should contain all the
                 * necessary demand.
                 */

                expect(returnParcels[i]).to.exist;
            }
        });
        /* -----------------------------------------------------------------------*/
    });
});