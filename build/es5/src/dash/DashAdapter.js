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

var _streamingVoTrackInfo = require('../streaming/vo/TrackInfo');

var _streamingVoTrackInfo2 = _interopRequireDefault(_streamingVoTrackInfo);

var _streamingVoMediaInfo = require('../streaming/vo/MediaInfo');

var _streamingVoMediaInfo2 = _interopRequireDefault(_streamingVoMediaInfo);

var _streamingVoStreamInfo = require('../streaming/vo/StreamInfo');

var _streamingVoStreamInfo2 = _interopRequireDefault(_streamingVoStreamInfo);

var _streamingVoManifestInfo = require('../streaming/vo/ManifestInfo');

var _streamingVoManifestInfo2 = _interopRequireDefault(_streamingVoManifestInfo);

var _voEvent = require('./vo/Event');

var _voEvent2 = _interopRequireDefault(_voEvent);

var _coreFactoryMaker = require('../core/FactoryMaker');

var _coreFactoryMaker2 = _interopRequireDefault(_coreFactoryMaker);

var _externalsCea608Parser = require('../../externals/cea608-parser');

var _externalsCea608Parser2 = _interopRequireDefault(_externalsCea608Parser);

function DashAdapter() {

    //let context = this.context;

    var instance = undefined,
        dashManifestModel = undefined,
        voPeriods = undefined,
        voAdaptations = undefined;

    function setup() {
        reset();
    }

    function setConfig(config) {
        if (!config) return;

        if (config.dashManifestModel) {
            dashManifestModel = config.dashManifestModel;
        }
    }

    function getRepresentationForTrackInfo(trackInfo, representationController) {
        return representationController && trackInfo ? representationController.getRepresentationForQuality(trackInfo.quality) : null;
    }

    function getAdaptationForMediaInfo(mediaInfo) {

        if (!mediaInfo || !mediaInfo.streamInfo || !mediaInfo.streamInfo.id || !voAdaptations[mediaInfo.streamInfo.id]) return null;
        return voAdaptations[mediaInfo.streamInfo.id][mediaInfo.index];
    }

    function getPeriodForStreamInfo(streamInfo, voPeriodsArray) {
        var ln = voPeriodsArray.length;

        for (var i = 0; i < ln; i++) {
            var voPeriod = voPeriodsArray[i];

            if (streamInfo.id === voPeriod.id) return voPeriod;
        }

        return null;
    }

    function convertRepresentationToTrackInfo(voRepresentation) {
        var trackInfo = new _streamingVoTrackInfo2['default']();
        var realAdaptation = voRepresentation.adaptation.period.mpd.manifest.Period_asArray[voRepresentation.adaptation.period.index].AdaptationSet_asArray[voRepresentation.adaptation.index];
        var realRepresentation = dashManifestModel.getRepresentationFor(voRepresentation.index, realAdaptation);

        trackInfo.id = voRepresentation.id;
        trackInfo.quality = voRepresentation.index;
        trackInfo.bandwidth = dashManifestModel.getBandwidth(realRepresentation);
        trackInfo.DVRWindow = voRepresentation.segmentAvailabilityRange;
        trackInfo.fragmentDuration = voRepresentation.segmentDuration || (voRepresentation.segments && voRepresentation.segments.length > 0 ? voRepresentation.segments[0].duration : NaN);
        trackInfo.MSETimeOffset = voRepresentation.MSETimeOffset;
        trackInfo.useCalculatedLiveEdgeTime = voRepresentation.useCalculatedLiveEdgeTime;
        trackInfo.mediaInfo = convertAdaptationToMediaInfo(voRepresentation.adaptation);

        return trackInfo;
    }

    function convertAdaptationToMediaInfo(adaptation) {
        var mediaInfo = new _streamingVoMediaInfo2['default']();
        var realAdaptation = adaptation.period.mpd.manifest.Period_asArray[adaptation.period.index].AdaptationSet_asArray[adaptation.index];
        var viewpoint = undefined;

        mediaInfo.id = adaptation.id;
        mediaInfo.index = adaptation.index;
        mediaInfo.type = adaptation.type;
        mediaInfo.streamInfo = convertPeriodToStreamInfo(adaptation.period);
        mediaInfo.representationCount = dashManifestModel.getRepresentationCount(realAdaptation);
        mediaInfo.lang = dashManifestModel.getLanguageForAdaptation(realAdaptation);
        viewpoint = dashManifestModel.getViewpointForAdaptation(realAdaptation);
        mediaInfo.viewpoint = viewpoint ? viewpoint.value : undefined;
        mediaInfo.accessibility = dashManifestModel.getAccessibilityForAdaptation(realAdaptation).map(function (accessibility) {
            var accessibilityValue = accessibility.value;
            var accessibilityData = accessibilityValue;
            if (accessibility.schemeIdUri && accessibility.schemeIdUri.search('cea-608') >= 0 && typeof _externalsCea608Parser2['default'] !== 'undefined') {
                if (accessibilityValue) {
                    accessibilityData = 'cea-608:' + accessibilityValue;
                } else {
                    accessibilityData = 'cea-608';
                }
                mediaInfo.embeddedCaptions = true;
            }
            return accessibilityData;
        });

        mediaInfo.audioChannelConfiguration = dashManifestModel.getAudioChannelConfigurationForAdaptation(realAdaptation).map(function (audioChannelConfiguration) {
            return audioChannelConfiguration.value;
        });
        mediaInfo.roles = dashManifestModel.getRolesForAdaptation(realAdaptation).map(function (role) {
            return role.value;
        });
        mediaInfo.codec = dashManifestModel.getCodec(realAdaptation);
        mediaInfo.mimeType = dashManifestModel.getMimeType(realAdaptation);
        mediaInfo.contentProtection = dashManifestModel.getContentProtectionData(realAdaptation);
        mediaInfo.bitrateList = dashManifestModel.getBitrateListForAdaptation(realAdaptation);

        if (mediaInfo.contentProtection) {
            mediaInfo.contentProtection.forEach(function (item) {
                item.KID = dashManifestModel.getKID(item);
            });
        }

        mediaInfo.isText = dashManifestModel.getIsTextTrack(mediaInfo.mimeType);

        return mediaInfo;
    }

    function convertVideoInfoToEmbeddedTextInfo(mediaInfo, channel, lang) {
        mediaInfo.id = channel; // CC1, CC2, CC3, or CC4
        mediaInfo.index = 100 + parseInt(channel.substring(2, 3));
        mediaInfo.type = _streamingConstantsConstants2['default'].EMBEDDED_TEXT;
        mediaInfo.codec = 'cea-608-in-SEI';
        mediaInfo.isText = true;
        mediaInfo.isEmbedded = true;
        mediaInfo.lang = channel + ' ' + lang;
        mediaInfo.roles = ['caption'];
    }

    function convertPeriodToStreamInfo(period) {
        var streamInfo = new _streamingVoStreamInfo2['default']();
        var THRESHOLD = 1;

        streamInfo.id = period.id;
        streamInfo.index = period.index;
        streamInfo.start = period.start;
        streamInfo.duration = period.duration;
        streamInfo.manifestInfo = convertMpdToManifestInfo(period.mpd);
        streamInfo.isLast = period.mpd.manifest.Period_asArray.length === 1 || Math.abs(streamInfo.start + streamInfo.duration - streamInfo.manifestInfo.duration) < THRESHOLD;

        return streamInfo;
    }

    function convertMpdToManifestInfo(mpd) {
        var manifestInfo = new _streamingVoManifestInfo2['default']();

        manifestInfo.DVRWindowSize = mpd.timeShiftBufferDepth;
        manifestInfo.loadedTime = mpd.manifest.loadedTime;
        manifestInfo.availableFrom = mpd.availabilityStartTime;
        manifestInfo.minBufferTime = mpd.manifest.minBufferTime;
        manifestInfo.maxFragmentDuration = mpd.maxSegmentDuration;
        manifestInfo.duration = dashManifestModel.getDuration(mpd.manifest);
        manifestInfo.isDynamic = dashManifestModel.getIsDynamic(mpd.manifest);

        return manifestInfo;
    }

    function getMediaInfoForType(streamInfo, type) {

        if (voPeriods.length === 0) {
            return null;
        }

        var manifest = voPeriods[0].mpd.manifest;
        var realAdaptation = dashManifestModel.getAdaptationForType(manifest, streamInfo.index, type, streamInfo);
        if (!realAdaptation) return null;

        var selectedVoPeriod = getPeriodForStreamInfo(streamInfo, voPeriods);
        var periodId = selectedVoPeriod.id;
        var idx = dashManifestModel.getIndexForAdaptation(realAdaptation, manifest, streamInfo.index);

        voAdaptations[periodId] = voAdaptations[periodId] || dashManifestModel.getAdaptationsForPeriod(selectedVoPeriod);

        return convertAdaptationToMediaInfo(voAdaptations[periodId][idx]);
    }

    function getAllMediaInfoForType(streamInfo, type, externalManifest) {
        var voLocalPeriods = voPeriods;
        var manifest = externalManifest;
        var mediaArr = [];
        var data = undefined,
            media = undefined,
            idx = undefined,
            i = undefined,
            j = undefined,
            ln = undefined;

        if (manifest) {
            checkSetConfigCall();
            var mpd = dashManifestModel.getMpd(manifest);

            voLocalPeriods = dashManifestModel.getRegularPeriods(mpd);
        } else {
            if (voPeriods.length > 0) {
                manifest = voPeriods[0].mpd.manifest;
            } else {
                return mediaArr;
            }
        }

        var selectedVoPeriod = getPeriodForStreamInfo(streamInfo, voLocalPeriods);
        var periodId = selectedVoPeriod.id;
        var adaptationsForType = dashManifestModel.getAdaptationsForType(manifest, streamInfo.index, type !== _streamingConstantsConstants2['default'].EMBEDDED_TEXT ? type : _streamingConstantsConstants2['default'].VIDEO);

        if (!adaptationsForType) return mediaArr;

        voAdaptations[periodId] = voAdaptations[periodId] || dashManifestModel.getAdaptationsForPeriod(selectedVoPeriod);

        for (i = 0, ln = adaptationsForType.length; i < ln; i++) {
            data = adaptationsForType[i];
            idx = dashManifestModel.getIndexForAdaptation(data, manifest, streamInfo.index);
            media = convertAdaptationToMediaInfo(voAdaptations[periodId][idx]);

            if (type === _streamingConstantsConstants2['default'].EMBEDDED_TEXT) {
                var accessibilityLength = media.accessibility.length;
                for (j = 0; j < accessibilityLength; j++) {
                    if (!media) {
                        continue;
                    }
                    var accessibility = media.accessibility[j];
                    if (accessibility.indexOf('cea-608:') === 0) {
                        var value = accessibility.substring(8);
                        var parts = value.split(';');
                        if (parts[0].substring(0, 2) === 'CC') {
                            for (j = 0; j < parts.length; j++) {
                                if (!media) {
                                    media = convertAdaptationToMediaInfo.call(this, voAdaptations[periodId][idx]);
                                }
                                convertVideoInfoToEmbeddedTextInfo(media, parts[j].substring(0, 3), parts[j].substring(4));
                                mediaArr.push(media);
                                media = null;
                            }
                        } else {
                            for (j = 0; j < parts.length; j++) {
                                // Only languages for CC1, CC2, ...
                                if (!media) {
                                    media = convertAdaptationToMediaInfo.call(this, voAdaptations[periodId][idx]);
                                }
                                convertVideoInfoToEmbeddedTextInfo(media, 'CC' + (j + 1), parts[j]);
                                mediaArr.push(media);
                                media = null;
                            }
                        }
                    } else if (accessibility.indexOf('cea-608') === 0) {
                        // Nothing known. We interpret it as CC1=eng
                        convertVideoInfoToEmbeddedTextInfo(media, _streamingConstantsConstants2['default'].CC1, 'eng');
                        mediaArr.push(media);
                        media = null;
                    }
                }
            }
            if (media && type !== _streamingConstantsConstants2['default'].EMBEDDED_TEXT) {
                mediaArr.push(media);
            }
        }

        return mediaArr;
    }

    function checkSetConfigCall() {
        if (!dashManifestModel || !dashManifestModel.hasOwnProperty('getMpd') || !dashManifestModel.hasOwnProperty('getRegularPeriods')) {
            throw new Error('setConfig function has to be called previously');
        }
    }

    function updatePeriods(newManifest) {
        if (!newManifest) return null;

        checkSetConfigCall();

        var mpd = dashManifestModel.getMpd(newManifest);

        voPeriods = dashManifestModel.getRegularPeriods(mpd);
        voAdaptations = {};
    }

    function getStreamsInfo(externalManifest) {
        var streams = [];
        var voLocalPeriods = voPeriods;

        //if manifest is defined, getStreamsInfo is for an outside manifest, not the current one
        if (externalManifest) {
            checkSetConfigCall();
            var mpd = dashManifestModel.getMpd(externalManifest);

            voLocalPeriods = dashManifestModel.getRegularPeriods(mpd);
        }

        for (var i = 0; i < voLocalPeriods.length; i++) {
            streams.push(convertPeriodToStreamInfo(voLocalPeriods[i]));
        }

        return streams;
    }

    function checkStreamProcessor(streamProcessor) {
        if (!streamProcessor || !streamProcessor.hasOwnProperty('getRepresentationController') || !streamProcessor.hasOwnProperty('getIndexHandler') || !streamProcessor.hasOwnProperty('getMediaInfo') || !streamProcessor.hasOwnProperty('getType') || !streamProcessor.hasOwnProperty('getStreamInfo')) {
            throw new Error('streamProcessor parameter is missing or malformed!');
        }
    }

    function checkRepresentationController(representationController) {
        if (!representationController || !representationController.hasOwnProperty('getRepresentationForQuality') || !representationController.hasOwnProperty('getCurrentRepresentation')) {
            throw new Error('representationController parameter is missing or malformed!');
        }
    }

    function checkQuality(quality) {
        var isInt = quality !== null && !isNaN(quality) && quality % 1 === 0;

        if (!isInt) {
            throw new Error('quality argument is not an integer');
        }
    }

    function getInitRequest(streamProcessor, quality) {
        var representationController = undefined,
            representation = undefined,
            indexHandler = undefined;

        checkStreamProcessor(streamProcessor);
        checkQuality(quality);

        representationController = streamProcessor.getRepresentationController();
        indexHandler = streamProcessor.getIndexHandler();

        representation = representationController ? representationController.getRepresentationForQuality(quality) : null;

        return indexHandler ? indexHandler.getInitRequest(representation) : null;
    }

    function getNextFragmentRequest(streamProcessor, trackInfo) {
        var representationController = undefined,
            representation = undefined,
            indexHandler = undefined;

        checkStreamProcessor(streamProcessor);

        representationController = streamProcessor.getRepresentationController();
        representation = getRepresentationForTrackInfo(trackInfo, representationController);
        indexHandler = streamProcessor.getIndexHandler();

        return indexHandler ? indexHandler.getNextSegmentRequest(representation) : null;
    }

    function getFragmentRequestForTime(streamProcessor, trackInfo, time, options) {
        var representationController = undefined,
            representation = undefined,
            indexHandler = undefined;

        checkStreamProcessor(streamProcessor);

        representationController = streamProcessor.getRepresentationController();
        representation = getRepresentationForTrackInfo(trackInfo, representationController);
        indexHandler = streamProcessor.getIndexHandler();

        return indexHandler ? indexHandler.getSegmentRequestForTime(representation, time, options) : null;
    }

    function generateFragmentRequestForTime(streamProcessor, trackInfo, time) {
        var representationController = undefined,
            representation = undefined,
            indexHandler = undefined;

        checkStreamProcessor(streamProcessor);

        representationController = streamProcessor.getRepresentationController();
        representation = getRepresentationForTrackInfo(trackInfo, representationController);
        indexHandler = streamProcessor.getIndexHandler();

        return indexHandler ? indexHandler.generateSegmentRequestForTime(representation, time) : null;
    }

    function getIndexHandlerTime(streamProcessor) {
        checkStreamProcessor(streamProcessor);

        var indexHandler = streamProcessor.getIndexHandler();

        if (indexHandler) {
            return indexHandler.getCurrentTime();
        }
        return NaN;
    }

    function setIndexHandlerTime(streamProcessor, value) {
        checkStreamProcessor(streamProcessor);

        var indexHandler = streamProcessor.getIndexHandler();
        if (indexHandler) {
            indexHandler.setCurrentTime(value);
        }
    }

    function updateData(streamProcessor) {
        checkStreamProcessor(streamProcessor);

        var selectedVoPeriod = getPeriodForStreamInfo(streamProcessor.getStreamInfo(), voPeriods);
        var mediaInfo = streamProcessor.getMediaInfo();
        var voAdaptation = getAdaptationForMediaInfo(mediaInfo);
        var type = streamProcessor.getType();

        var id = undefined,
            realAdaptation = undefined;

        id = mediaInfo ? mediaInfo.id : null;
        if (voPeriods.length > 0) {
            realAdaptation = id ? dashManifestModel.getAdaptationForId(id, voPeriods[0].mpd.manifest, selectedVoPeriod.index) : dashManifestModel.getAdaptationForIndex(mediaInfo.index, voPeriods[0].mpd.manifest, selectedVoPeriod.index);
            streamProcessor.getRepresentationController().updateData(realAdaptation, voAdaptation, type);
        }
    }

    function getRepresentationInfoForQuality(representationController, quality) {
        checkRepresentationController(representationController);
        checkQuality(quality);

        var voRepresentation = representationController.getRepresentationForQuality(quality);
        return voRepresentation ? convertRepresentationToTrackInfo(voRepresentation) : null;
    }

    function getCurrentRepresentationInfo(representationController) {
        checkRepresentationController(representationController);
        var voRepresentation = representationController.getCurrentRepresentation();
        return voRepresentation ? convertRepresentationToTrackInfo(voRepresentation) : null;
    }

    function getEvent(eventBox, eventStreams, startTime) {
        if (!eventBox || !eventStreams) {
            return null;
        }
        var event = new _voEvent2['default']();
        var schemeIdUri = eventBox.scheme_id_uri;
        var value = eventBox.value;
        var timescale = eventBox.timescale;
        var presentationTimeDelta = eventBox.presentation_time_delta;
        var duration = eventBox.event_duration;
        var id = eventBox.id;
        var messageData = eventBox.message_data;
        var presentationTime = startTime * timescale + presentationTimeDelta;

        if (!eventStreams[schemeIdUri]) return null;

        event.eventStream = eventStreams[schemeIdUri];
        event.eventStream.value = value;
        event.eventStream.timescale = timescale;
        event.duration = duration;
        event.id = id;
        event.presentationTime = presentationTime;
        event.messageData = messageData;
        event.presentationTimeDelta = presentationTimeDelta;

        return event;
    }

    function getEventsFor(info, streamProcessor) {

        var events = [];

        if (voPeriods.length === 0) {
            return events;
        }

        var manifest = voPeriods[0].mpd.manifest;

        if (info instanceof _streamingVoStreamInfo2['default']) {
            events = dashManifestModel.getEventsForPeriod(getPeriodForStreamInfo(info, voPeriods));
        } else if (info instanceof _streamingVoMediaInfo2['default']) {
            events = dashManifestModel.getEventStreamForAdaptationSet(manifest, getAdaptationForMediaInfo(info));
        } else if (info instanceof _streamingVoTrackInfo2['default']) {
            events = dashManifestModel.getEventStreamForRepresentation(manifest, getRepresentationForTrackInfo(info, streamProcessor.getRepresentationController()));
        }

        return events;
    }

    function reset() {
        voPeriods = [];
        voAdaptations = {};
    }

    instance = {
        convertDataToTrack: convertRepresentationToTrackInfo,
        getDataForMedia: getAdaptationForMediaInfo,
        getStreamsInfo: getStreamsInfo,
        getMediaInfoForType: getMediaInfoForType,
        getAllMediaInfoForType: getAllMediaInfoForType,
        getCurrentRepresentationInfo: getCurrentRepresentationInfo,
        getRepresentationInfoForQuality: getRepresentationInfoForQuality,
        updateData: updateData,
        getInitRequest: getInitRequest,
        getNextFragmentRequest: getNextFragmentRequest,
        getFragmentRequestForTime: getFragmentRequestForTime,
        generateFragmentRequestForTime: generateFragmentRequestForTime,
        getIndexHandlerTime: getIndexHandlerTime,
        setIndexHandlerTime: setIndexHandlerTime,
        getEventsFor: getEventsFor,
        getEvent: getEvent,
        setConfig: setConfig,
        updatePeriods: updatePeriods,
        reset: reset
    };

    setup();
    return instance;
}

DashAdapter.__dashjs_factory_name = 'DashAdapter';
exports['default'] = _coreFactoryMaker2['default'].getSingletonFactory(DashAdapter);
module.exports = exports['default'];
//# sourceMappingURL=DashAdapter.js.map
