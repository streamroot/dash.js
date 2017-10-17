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

var _streamingConstantsConstants = require('../streaming/constants/Constants');

var _streamingConstantsConstants2 = _interopRequireDefault(_streamingConstantsConstants);

var _constantsDashConstants = require('./constants/DashConstants');

var _constantsDashConstants2 = _interopRequireDefault(_constantsDashConstants);

var _streamingVoFragmentRequest = require('../streaming/vo/FragmentRequest');

var _streamingVoFragmentRequest2 = _interopRequireDefault(_streamingVoFragmentRequest);

var _streamingVoDashJSError = require('../streaming/vo/DashJSError');

var _streamingVoDashJSError2 = _interopRequireDefault(_streamingVoDashJSError);

var _streamingVoMetricsHTTPRequest = require('../streaming/vo/metrics/HTTPRequest');

var _coreEventsEvents = require('../core/events/Events');

var _coreEventsEvents2 = _interopRequireDefault(_coreEventsEvents);

var _coreEventBus = require('../core/EventBus');

var _coreEventBus2 = _interopRequireDefault(_coreEventBus);

var _coreFactoryMaker = require('../core/FactoryMaker');

var _coreFactoryMaker2 = _interopRequireDefault(_coreFactoryMaker);

var _coreDebug = require('../core/Debug');

var _coreDebug2 = _interopRequireDefault(_coreDebug);

var _streamingUtilsURLUtils = require('../streaming/utils/URLUtils');

var _streamingUtilsURLUtils2 = _interopRequireDefault(_streamingUtilsURLUtils);

var _voRepresentation = require('./vo/Representation');

var _voRepresentation2 = _interopRequireDefault(_voRepresentation);

var _utilsSegmentsUtils = require('./utils/SegmentsUtils');

var _utilsSegmentsGetter = require('./utils/SegmentsGetter');

var _utilsSegmentsGetter2 = _interopRequireDefault(_utilsSegmentsGetter);

var _SegmentBaseLoader = require('./SegmentBaseLoader');

var _SegmentBaseLoader2 = _interopRequireDefault(_SegmentBaseLoader);

var _WebmSegmentBaseLoader = require('./WebmSegmentBaseLoader');

var _WebmSegmentBaseLoader2 = _interopRequireDefault(_WebmSegmentBaseLoader);

var SEGMENTS_UNAVAILABLE_ERROR_CODE = 1;

function DashHandler(config) {

    var context = this.context;
    var eventBus = (0, _coreEventBus2['default'])(context).getInstance();
    var urlUtils = (0, _streamingUtilsURLUtils2['default'])(context).getInstance();

    var segmentBaseLoader = undefined;
    var timelineConverter = config.timelineConverter;
    var dashMetrics = config.dashMetrics;
    var metricsModel = config.metricsModel;
    var mediaPlayerModel = config.mediaPlayerModel;
    var errHandler = config.errHandler;
    var baseURLController = config.baseURLController;

    var instance = undefined,
        log = undefined,
        index = undefined,
        requestedTime = undefined,
        currentTime = undefined,
        earliestTime = undefined,
        streamProcessor = undefined,
        segmentsGetter = undefined;

    function setup() {
        log = (0, _coreDebug2['default'])(context).getInstance().log.bind(instance);

        resetInitialSettings();

        segmentBaseLoader = isWebM(config.mimeType) ? (0, _WebmSegmentBaseLoader2['default'])(context).getInstance() : (0, _SegmentBaseLoader2['default'])(context).getInstance();
        segmentBaseLoader.setConfig({
            baseURLController: baseURLController,
            metricsModel: metricsModel,
            mediaPlayerModel: mediaPlayerModel,
            errHandler: errHandler
        });

        eventBus.on(_coreEventsEvents2['default'].INITIALIZATION_LOADED, onInitializationLoaded, instance);
        eventBus.on(_coreEventsEvents2['default'].SEGMENTS_LOADED, onSegmentsLoaded, instance);
    }

    function isWebM(mimeType) {
        var type = mimeType.split('/')[1];

        return 'webm' === type.toLowerCase();
    }

    function initialize(StreamProcessor) {
        streamProcessor = StreamProcessor;

        var isDynamic = streamProcessor ? streamProcessor.getStreamInfo().manifestInfo.isDynamic : null;

        segmentBaseLoader.initialize();

        segmentsGetter = (0, _utilsSegmentsGetter2['default'])(context).create(config, isDynamic);
    }

    function getStreamProcessor() {
        return streamProcessor;
    }

    function setCurrentTime(value) {
        currentTime = value;
    }

    function getCurrentTime() {
        return currentTime;
    }

    function getEarliestTime() {
        return earliestTime;
    }

    function resetInitialSettings() {
        index = -1;
        currentTime = 0;
        earliestTime = NaN;
        requestedTime = null;
        streamProcessor = null;
        segmentsGetter = null;
    }

    function reset() {
        resetInitialSettings();

        eventBus.off(_coreEventsEvents2['default'].INITIALIZATION_LOADED, onInitializationLoaded, instance);
        eventBus.off(_coreEventsEvents2['default'].SEGMENTS_LOADED, onSegmentsLoaded, instance);
    }

    function unescapeDollarsInTemplate(url) {
        return url ? url.split('$$').join('$') : url;
    }

    function replaceIDForTemplate(url, value) {
        if (value === null || url === null || url.indexOf('$RepresentationID$') === -1) {
            return url;
        }
        var v = value.toString();
        return url.split('$RepresentationID$').join(v);
    }

    function setRequestUrl(request, destination, representation) {
        var baseURL = baseURLController.resolve(representation.path);
        var url = undefined,
            serviceLocation = undefined;

        if (!baseURL || destination === baseURL.url || !urlUtils.isRelative(destination)) {
            url = destination;
        } else {
            url = baseURL.url;
            serviceLocation = baseURL.serviceLocation;

            if (destination) {
                url = urlUtils.resolve(destination, url);
            }
        }

        if (urlUtils.isRelative(url)) {
            return false;
        }

        request.url = url;
        request.serviceLocation = serviceLocation;

        return true;
    }

    function generateInitRequest(representation, mediaType) {

        var request = new _streamingVoFragmentRequest2['default']();
        var period = representation.adaptation.period;
        var presentationStartTime = period.start;
        var isDynamic = streamProcessor ? streamProcessor.getStreamInfo().manifestInfo.isDynamic : null;

        request.mediaType = mediaType;
        request.type = _streamingVoMetricsHTTPRequest.HTTPRequest.INIT_SEGMENT_TYPE;
        request.range = representation.range;
        request.availabilityStartTime = timelineConverter.calcAvailabilityStartTimeFromPresentationTime(presentationStartTime, period.mpd, isDynamic);
        request.availabilityEndTime = timelineConverter.calcAvailabilityEndTimeFromPresentationTime(presentationStartTime + period.duration, period.mpd, isDynamic);
        request.quality = representation.index;
        request.mediaInfo = streamProcessor ? streamProcessor.getMediaInfo() : null;
        request.representationId = representation.id;

        if (setRequestUrl(request, representation.initialization, representation)) {
            return request;
        }
    }

    function getInitRequest(representation) {
        var type = streamProcessor ? streamProcessor.getType() : null;
        if (!representation) return null;
        var request = generateInitRequest(representation, type);
        return request;
    }

    function isMediaFinished(representation) {

        var isFinished = false;
        var isDynamic = streamProcessor ? streamProcessor.getStreamInfo().manifestInfo.isDynamic : null;

        if (!isDynamic && index === representation.availableSegmentsNumber) {
            isFinished = true;
        } else {
            var seg = (0, _utilsSegmentsUtils.getSegmentByIndex)(index, representation);
            if (seg) {
                var time = seg.presentationStartTime - representation.adaptation.period.start;
                var duration = representation.adaptation.period.duration;
                log(representation.segmentInfoType + ': ' + time + ' / ' + duration);
                isFinished = representation.segmentInfoType === _constantsDashConstants2['default'].SEGMENT_TIMELINE && isDynamic ? false : time >= duration;
            } else {
                log('isMediaFinished - no segment found');
            }
        }

        return isFinished;
    }

    function updateSegments(voRepresentation) {
        segmentsGetter.getSegments(voRepresentation, requestedTime, index, onSegmentListUpdated);
    }

    function onSegmentListUpdated(voRepresentation, segments) {
        var isDynamic = streamProcessor ? streamProcessor.getStreamInfo().manifestInfo.isDynamic : null;
        voRepresentation.segments = segments;
        if (segments && segments.length > 0) {
            earliestTime = isNaN(earliestTime) ? segments[0].presentationStartTime : Math.min(segments[0].presentationStartTime, earliestTime);
            if (isDynamic && isNaN(timelineConverter.getExpectedLiveEdge())) {
                var lastSegment = segments[segments.length - 1];
                var liveEdge = lastSegment.presentationStartTime;
                var metrics = metricsModel.getMetricsFor(_streamingConstantsConstants2['default'].STREAM);
                // the last segment is the Expected, not calculated, live edge.
                timelineConverter.setExpectedLiveEdge(liveEdge);
                metricsModel.updateManifestUpdateInfo(dashMetrics.getCurrentManifestUpdate(metrics), { presentationStartTime: liveEdge });
            }
        }
    }

    function updateSegmentList(voRepresentation) {

        if (!voRepresentation) {
            throw new Error('no representation');
        }

        voRepresentation.segments = null;

        updateSegments(voRepresentation);
    }

    function updateRepresentation(voRepresentation, keepIdx) {
        var hasInitialization = _voRepresentation2['default'].hasInitialization(voRepresentation);
        var hasSegments = _voRepresentation2['default'].hasSegments(voRepresentation);
        var type = streamProcessor ? streamProcessor.getType() : null;
        var isDynamic = streamProcessor ? streamProcessor.getStreamInfo().manifestInfo.isDynamic : null;
        var error = undefined;

        if (!voRepresentation.segmentDuration && !voRepresentation.segments) {
            updateSegmentList(voRepresentation);
        }

        voRepresentation.segmentAvailabilityRange = null;
        voRepresentation.segmentAvailabilityRange = timelineConverter.calcSegmentAvailabilityRange(voRepresentation, isDynamic);

        if (voRepresentation.segmentAvailabilityRange.end < voRepresentation.segmentAvailabilityRange.start && !voRepresentation.useCalculatedLiveEdgeTime) {
            error = new _streamingVoDashJSError2['default'](SEGMENTS_UNAVAILABLE_ERROR_CODE, 'no segments are available yet', { availabilityDelay: voRepresentation.segmentAvailabilityRange.start - voRepresentation.segmentAvailabilityRange.end });
            eventBus.trigger(_coreEventsEvents2['default'].REPRESENTATION_UPDATED, { sender: this, representation: voRepresentation, error: error });
            return;
        }

        if (!keepIdx) index = -1;

        if (voRepresentation.segmentDuration) {
            updateSegmentList(voRepresentation);
        }

        if (!hasInitialization) {
            segmentBaseLoader.loadInitialization(voRepresentation);
        }

        if (!hasSegments) {
            segmentBaseLoader.loadSegments(voRepresentation, type, voRepresentation.indexRange);
        }

        if (hasInitialization && hasSegments) {
            eventBus.trigger(_coreEventsEvents2['default'].REPRESENTATION_UPDATED, { sender: this, representation: voRepresentation });
        }
    }

    function getIndexForSegments(time, representation, timeThreshold) {
        var segments = representation.segments;
        var ln = segments ? segments.length : null;

        var idx = -1;
        var epsilon = undefined,
            frag = undefined,
            ft = undefined,
            fd = undefined,
            i = undefined;

        if (segments && ln > 0) {
            for (i = 0; i < ln; i++) {
                frag = segments[i];
                ft = frag.presentationStartTime;
                fd = frag.duration;
                epsilon = timeThreshold === undefined || timeThreshold === null ? fd / 2 : timeThreshold;
                if (time + epsilon >= ft && time - epsilon < ft + fd) {
                    idx = frag.availabilityIdx;
                    break;
                }
            }
        }

        return idx;
    }

    function getRequestForSegment(segment) {
        if (segment === null || segment === undefined) {
            return null;
        }

        var request = new _streamingVoFragmentRequest2['default']();
        var representation = segment.representation;
        var bandwidth = representation.adaptation.period.mpd.manifest.Period_asArray[representation.adaptation.period.index].AdaptationSet_asArray[representation.adaptation.index].Representation_asArray[representation.index].bandwidth;
        var url = segment.media;
        var type = streamProcessor ? streamProcessor.getType() : null;

        url = (0, _utilsSegmentsUtils.replaceTokenForTemplate)(url, 'Number', segment.replacementNumber);
        url = (0, _utilsSegmentsUtils.replaceTokenForTemplate)(url, 'Time', segment.replacementTime);
        url = (0, _utilsSegmentsUtils.replaceTokenForTemplate)(url, 'Bandwidth', bandwidth);
        url = replaceIDForTemplate(url, representation.id);
        url = unescapeDollarsInTemplate(url);

        request.mediaType = type;
        request.type = _streamingVoMetricsHTTPRequest.HTTPRequest.MEDIA_SEGMENT_TYPE;
        request.range = segment.mediaRange;
        request.startTime = segment.presentationStartTime;
        request.duration = segment.duration;
        request.timescale = representation.timescale;
        request.availabilityStartTime = segment.availabilityStartTime;
        request.availabilityEndTime = segment.availabilityEndTime;
        request.wallStartTime = segment.wallStartTime;
        request.quality = representation.index;
        request.index = segment.availabilityIdx;
        request.mediaInfo = streamProcessor.getMediaInfo();
        request.adaptationIndex = representation.adaptation.index;

        if (setRequestUrl(request, url, representation)) {
            return request;
        }
    }

    function getSegmentRequestForTime(representation, time, options) {
        var request = undefined,
            segment = undefined,
            finished = undefined;

        var type = streamProcessor ? streamProcessor.getType() : null;
        var isDynamic = streamProcessor ? streamProcessor.getStreamInfo().manifestInfo.isDynamic : null;
        var idx = index;
        var keepIdx = options ? options.keepIdx : false;
        var timeThreshold = options ? options.timeThreshold : null;
        var ignoreIsFinished = options && options.ignoreIsFinished ? true : false;

        if (!representation) {
            return null;
        }

        if (requestedTime !== time) {
            // When playing at live edge with 0 delay we may loop back with same time and index until it is available. Reduces verboseness of logs.
            requestedTime = time;
            log('Getting the request for ' + type + ' time : ' + time);
        }

        updateSegments(representation);
        index = getIndexForSegments(time, representation, timeThreshold);
        //Index may be -1 if getSegments needs to update again.  So after getSegments is called and updated then try to get index again.
        if (index < 0) {
            updateSegments(representation);
            index = getIndexForSegments(time, representation, timeThreshold);
        }

        if (index > 0) {
            log('Index for ' + type + ' time ' + time + ' is ' + index);
        }

        finished = !ignoreIsFinished ? isMediaFinished(representation) : false;
        if (finished) {
            request = new _streamingVoFragmentRequest2['default']();
            request.action = _streamingVoFragmentRequest2['default'].ACTION_COMPLETE;
            request.index = index;
            request.mediaType = type;
            request.mediaInfo = streamProcessor.getMediaInfo();
            log('Signal complete.', request);
        } else {
            segment = (0, _utilsSegmentsUtils.getSegmentByIndex)(index, representation);
            request = getRequestForSegment(segment);
            // log('[getSegmentRequestForTime]request is ' + JSON.stringify(request));
        }

        if (keepIdx && idx >= 0) {
            index = representation.segmentInfoType === _constantsDashConstants2['default'].SEGMENT_TIMELINE && isDynamic ? index : idx;
        }

        return request;
    }

    function generateSegmentRequestForTime(representation, time) {
        var step = (representation.segmentAvailabilityRange.end - representation.segmentAvailabilityRange.start) / 2;

        representation.segments = null;
        representation.segmentAvailabilityRange = { start: time - step, end: time + step };
        return getSegmentRequestForTime(representation, time, { keepIdx: false, ignoreIsFinished: true });
    }

    function getNextSegmentRequest(representation) {
        var request = undefined,
            segment = undefined,
            finished = undefined;

        var type = streamProcessor ? streamProcessor.getType() : null;
        var isDynamic = streamProcessor ? streamProcessor.getStreamInfo().manifestInfo.isDynamic : null;

        if (!representation || index === -1) {
            return null;
        }

        requestedTime = null;
        index++;

        log('Getting the next request at index: ' + index);

        // check that there is a segment in this index. If none, update segments and wait for next time loop is called
        var seg = (0, _utilsSegmentsUtils.getSegmentByIndex)(index, representation);
        if (!seg && isDynamic) {
            log('No segment found at index: ' + index + '. Wait for next loop');
            updateSegments(representation);
            index--;
            return null;
        }

        finished = isMediaFinished(representation);
        if (finished) {
            request = new _streamingVoFragmentRequest2['default']();
            request.action = _streamingVoFragmentRequest2['default'].ACTION_COMPLETE;
            request.index = index;
            request.mediaType = type;
            request.mediaInfo = streamProcessor.getMediaInfo();
            log('Signal complete.');
        } else {
            updateSegments(representation);
            segment = (0, _utilsSegmentsUtils.getSegmentByIndex)(index, representation);
            request = getRequestForSegment(segment);
            // log('[getSegmentRequestForTime]request is ' + JSON.stringify(request));
            if (!segment && isDynamic) {
                /*
                 Sometimes when playing dynamic streams with 0 fragment delay at live edge we ask for
                 an index before it is available so we decrement index back and send null request
                 which triggers the validate loop to rerun and the next time the segment should be
                 available.
                 */
                index--;
            }
        }

        return request;
    }

    function onInitializationLoaded(e) {
        var representation = e.representation;
        //log("Got an initialization.");
        if (!representation.segments) return;

        eventBus.trigger(_coreEventsEvents2['default'].REPRESENTATION_UPDATED, { sender: this, representation: representation });
    }

    function onSegmentsLoaded(e) {
        var type = streamProcessor ? streamProcessor.getType() : null;
        var isDynamic = streamProcessor ? streamProcessor.getStreamInfo().manifestInfo.isDynamic : null;
        if (e.error || type !== e.mediaType) return;

        var fragments = e.segments;
        var representation = e.representation;
        var segments = [];
        var count = 0;

        var i = undefined,
            len = undefined,
            s = undefined,
            seg = undefined;

        for (i = 0, len = fragments.length; i < len; i++) {
            s = fragments[i];

            seg = (0, _utilsSegmentsUtils.getTimeBasedSegment)(timelineConverter, isDynamic, representation, s.startTime, s.duration, s.timescale, s.media, s.mediaRange, count);

            segments.push(seg);
            seg = null;
            count++;
        }

        representation.segmentAvailabilityRange = { start: segments[0].presentationStartTime, end: segments[len - 1].presentationStartTime };
        representation.availableSegmentsNumber = len;

        onSegmentListUpdated(representation, segments);

        if (!_voRepresentation2['default'].hasInitialization(representation)) return;

        eventBus.trigger(_coreEventsEvents2['default'].REPRESENTATION_UPDATED, { sender: this, representation: representation });
    }

    instance = {
        initialize: initialize,
        getStreamProcessor: getStreamProcessor,
        getInitRequest: getInitRequest,
        getSegmentRequestForTime: getSegmentRequestForTime,
        getNextSegmentRequest: getNextSegmentRequest,
        generateSegmentRequestForTime: generateSegmentRequestForTime,
        updateRepresentation: updateRepresentation,
        updateSegmentList: updateSegmentList,
        setCurrentTime: setCurrentTime,
        getCurrentTime: getCurrentTime,
        getEarliestTime: getEarliestTime,
        reset: reset
    };

    setup();

    return instance;
}

DashHandler.__dashjs_factory_name = 'DashHandler';
var factory = _coreFactoryMaker2['default'].getClassFactory(DashHandler);
factory.SEGMENTS_UNAVAILABLE_ERROR_CODE = SEGMENTS_UNAVAILABLE_ERROR_CODE;
_coreFactoryMaker2['default'].updateClassFactory(DashHandler.__dashjs_factory_name, factory);
exports['default'] = factory;
module.exports = exports['default'];
//# sourceMappingURL=DashHandler.js.map