/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _XlinkLoader = require('../XlinkLoader');

var _XlinkLoader2 = _interopRequireDefault(_XlinkLoader);

var _coreEventBus = require('../../core/EventBus');

var _coreEventBus2 = _interopRequireDefault(_coreEventBus);

var _coreEventsEvents = require('../../core/events/Events');

var _coreEventsEvents2 = _interopRequireDefault(_coreEventsEvents);

var _coreFactoryMaker = require('../../core/FactoryMaker');

var _coreFactoryMaker2 = _interopRequireDefault(_coreFactoryMaker);

var _externalsXml2json = require('../../../externals/xml2json');

var _externalsXml2json2 = _interopRequireDefault(_externalsXml2json);

var _utilsURLUtils = require('../utils/URLUtils');

var _utilsURLUtils2 = _interopRequireDefault(_utilsURLUtils);

var RESOLVE_TYPE_ONLOAD = 'onLoad';
var RESOLVE_TYPE_ONACTUATE = 'onActuate';
var ELEMENT_TYPE_PERIOD = 'Period';
var ELEMENT_TYPE_ADAPTATIONSET = 'AdaptationSet';
var ELEMENT_TYPE_EVENTSTREAM = 'EventStream';
var RESOLVE_TO_ZERO = 'urn:mpeg:dash:resolve-to-zero:2013';

function XlinkController(config) {

    var context = this.context;
    var eventBus = (0, _coreEventBus2['default'])(context).getInstance();
    var urlUtils = (0, _utilsURLUtils2['default'])(context).getInstance();

    var instance = undefined,
        matchers = undefined,
        iron = undefined,
        manifest = undefined,
        converter = undefined,
        xlinkLoader = undefined;

    function setup() {
        eventBus.on(_coreEventsEvents2['default'].XLINK_ELEMENT_LOADED, onXlinkElementLoaded, instance);

        xlinkLoader = (0, _XlinkLoader2['default'])(context).create({
            errHandler: config.errHandler,
            metricsModel: config.metricsModel,
            mediaPlayerModel: config.mediaPlayerModel,
            requestModifier: config.requestModifier
        });
    }

    function setMatchers(value) {
        matchers = value;
    }

    function setIron(value) {
        iron = value;
    }

    /**
     * <p>Triggers the resolution of the xlink.onLoad attributes in the manifest file </p>
     * @param {Object} mpd - the manifest
     */
    function resolveManifestOnLoad(mpd) {
        var elements = undefined;
        // First resolve all periods, so unnecessary requests inside onLoad Periods with Default content are avoided
        converter = new _externalsXml2json2['default']({
            escapeMode: false,
            attributePrefix: '',
            arrayAccessForm: 'property',
            emptyNodeForm: 'object',
            stripWhitespaces: false,
            enableToStringFunc: false,
            ignoreRoot: true,
            matchers: matchers
        });

        manifest = mpd;
        elements = getElementsToResolve(manifest.Period_asArray, manifest, ELEMENT_TYPE_PERIOD, RESOLVE_TYPE_ONLOAD);
        resolve(elements, ELEMENT_TYPE_PERIOD, RESOLVE_TYPE_ONLOAD);
    }

    function reset() {
        eventBus.off(_coreEventsEvents2['default'].XLINK_ELEMENT_LOADED, onXlinkElementLoaded, instance);

        if (xlinkLoader) {
            xlinkLoader.reset();
            xlinkLoader = null;
        }
    }

    function resolve(elements, type, resolveType) {
        var resolveObject = {};
        var element = undefined,
            url = undefined;

        resolveObject.elements = elements;
        resolveObject.type = type;
        resolveObject.resolveType = resolveType;
        // If nothing to resolve, directly call allElementsLoaded
        if (resolveObject.elements.length === 0) {
            onXlinkAllElementsLoaded(resolveObject);
        }
        for (var i = 0; i < resolveObject.elements.length; i++) {
            element = resolveObject.elements[i];
            if (urlUtils.isHTTPURL(element.url)) {
                url = element.url;
            } else {
                url = element.originalContent.BaseURL + element.url;
            }
            xlinkLoader.load(url, element, resolveObject);
        }
    }

    function onXlinkElementLoaded(event) {
        var element = undefined,
            resolveObject = undefined;

        var openingTag = '<response>';
        var closingTag = '</response>';
        var mergedContent = '';

        element = event.element;
        resolveObject = event.resolveObject;
        // if the element resolved into content parse the content
        if (element.resolvedContent) {
            var index = 0;
            // we add a parent elements so the converter is able to parse multiple elements of the same type which are not wrapped inside a container
            if (element.resolvedContent.indexOf('<?xml') === 0) {
                index = element.resolvedContent.indexOf('?>') + 2; //find the closing position of the xml declaration, if it exists.
            }
            mergedContent = element.resolvedContent.substr(0, index) + openingTag + element.resolvedContent.substr(index) + closingTag;
            element.resolvedContent = converter.xml_str2json(mergedContent);
        }
        if (isResolvingFinished(resolveObject)) {
            onXlinkAllElementsLoaded(resolveObject);
        }
    }

    // We got to wait till all elements of the current queue are resolved before merging back
    function onXlinkAllElementsLoaded(resolveObject) {
        var elements = [];
        var i = undefined,
            obj = undefined;

        mergeElementsBack(resolveObject);
        if (resolveObject.resolveType === RESOLVE_TYPE_ONACTUATE) {
            eventBus.trigger(_coreEventsEvents2['default'].XLINK_READY, { manifest: manifest });
        }
        if (resolveObject.resolveType === RESOLVE_TYPE_ONLOAD) {
            switch (resolveObject.type) {
                // Start resolving the other elements. We can do Adaptation Set and EventStream in parallel
                case ELEMENT_TYPE_PERIOD:
                    for (i = 0; i < manifest[ELEMENT_TYPE_PERIOD + '_asArray'].length; i++) {
                        obj = manifest[ELEMENT_TYPE_PERIOD + '_asArray'][i];
                        if (obj.hasOwnProperty(ELEMENT_TYPE_ADAPTATIONSET + '_asArray')) {
                            elements = elements.concat(getElementsToResolve(obj[ELEMENT_TYPE_ADAPTATIONSET + '_asArray'], obj, ELEMENT_TYPE_ADAPTATIONSET, RESOLVE_TYPE_ONLOAD));
                        }
                        if (obj.hasOwnProperty(ELEMENT_TYPE_EVENTSTREAM + '_asArray')) {
                            elements = elements.concat(getElementsToResolve(obj[ELEMENT_TYPE_EVENTSTREAM + '_asArray'], obj, ELEMENT_TYPE_EVENTSTREAM, RESOLVE_TYPE_ONLOAD));
                        }
                    }
                    resolve(elements, ELEMENT_TYPE_ADAPTATIONSET, RESOLVE_TYPE_ONLOAD);
                    break;
                case ELEMENT_TYPE_ADAPTATIONSET:
                    // TODO: Resolve SegmentList here
                    eventBus.trigger(_coreEventsEvents2['default'].XLINK_READY, { manifest: manifest });
                    break;
            }
        }
    }

    // Returns the elements with the specific resolve Type
    function getElementsToResolve(elements, parentElement, type, resolveType) {
        var toResolve = [];
        var element = undefined,
            i = undefined,
            xlinkObject = undefined;
        // first remove all the resolve-to-zero elements
        for (i = elements.length - 1; i >= 0; i--) {
            element = elements[i];
            if (element.hasOwnProperty('xlink:href') && element['xlink:href'] === RESOLVE_TO_ZERO) {
                elements.splice(i, 1);
            }
        }
        // now get the elements with the right resolve type
        for (i = 0; i < elements.length; i++) {
            element = elements[i];
            if (element.hasOwnProperty('xlink:href') && element.hasOwnProperty('xlink:actuate') && element['xlink:actuate'] === resolveType) {
                xlinkObject = createXlinkObject(element['xlink:href'], parentElement, type, i, resolveType, element);
                toResolve.push(xlinkObject);
            }
        }
        return toResolve;
    }

    function mergeElementsBack(resolveObject) {
        var resolvedElements = [];
        var element = undefined,
            type = undefined,
            obj = undefined,
            i = undefined,
            j = undefined,
            k = undefined;
        // Start merging back from the end because of index shifting. Note that the elements with the same parent have to be ordered by index ascending
        for (i = resolveObject.elements.length - 1; i >= 0; i--) {
            element = resolveObject.elements[i];
            type = element.type + '_asArray';

            // Element couldn't be resolved or is TODO Inappropriate target: Remove all Xlink attributes
            if (!element.resolvedContent || isInappropriateTarget()) {
                delete element.originalContent['xlink:actuate'];
                delete element.originalContent['xlink:href'];
                resolvedElements.push(element.originalContent);
            }
            // Element was successfully resolved
            else if (element.resolvedContent) {
                    for (j = 0; j < element.resolvedContent[type].length; j++) {
                        //TODO Contains another Xlink attribute with xlink:actuate set to onload. Remove all xLink attributes
                        obj = element.resolvedContent[type][j];
                        resolvedElements.push(obj);
                    }
                }
            // Replace the old elements in the parent with the resolved ones
            element.parentElement[type].splice(element.index, 1);
            for (k = 0; k < resolvedElements.length; k++) {
                element.parentElement[type].splice(element.index + k, 0, resolvedElements[k]);
            }
            resolvedElements = [];
        }
        if (resolveObject.elements.length > 0) {
            iron.run(manifest);
        }
    }

    function createXlinkObject(url, parentElement, type, index, resolveType, originalContent) {
        return {
            url: url,
            parentElement: parentElement,
            type: type,
            index: index,
            resolveType: resolveType,
            originalContent: originalContent,
            resolvedContent: null,
            resolved: false
        };
    }

    // Check if all pending requests are finished
    function isResolvingFinished(elementsToResolve) {
        var i = undefined,
            obj = undefined;
        for (i = 0; i < elementsToResolve.elements.length; i++) {
            obj = elementsToResolve.elements[i];
            if (obj.resolved === false) {
                return false;
            }
        }
        return true;
    }

    // TODO : Do some syntax check here if the target is valid or not
    function isInappropriateTarget() {
        return false;
    }

    instance = {
        resolveManifestOnLoad: resolveManifestOnLoad,
        setMatchers: setMatchers,
        setIron: setIron,
        reset: reset
    };

    setup();
    return instance;
}

XlinkController.__dashjs_factory_name = 'XlinkController';
exports['default'] = _coreFactoryMaker2['default'].getClassFactory(XlinkController);
module.exports = exports['default'];
//# sourceMappingURL=XlinkController.js.map
