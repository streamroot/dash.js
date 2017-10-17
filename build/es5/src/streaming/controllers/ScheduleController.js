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

var _constantsConstants = require('../constants/Constants');

var _constantsConstants2 = _interopRequireDefault(_constantsConstants);

var _voMetricsPlayList = require('../vo/metrics/PlayList');

var _AbrController = require('./AbrController');

var _AbrController2 = _interopRequireDefault(_AbrController);

var _BufferController = require('./BufferController');

var _BufferController2 = _interopRequireDefault(_BufferController);

var _rulesSchedulingBufferLevelRule = require('../rules/scheduling/BufferLevelRule');

var _rulesSchedulingBufferLevelRule2 = _interopRequireDefault(_rulesSchedulingBufferLevelRule);

var _rulesSchedulingNextFragmentRequestRule = require('../rules/scheduling/NextFragmentRequestRule');

var _rulesSchedulingNextFragmentRequestRule2 = _interopRequireDefault(_rulesSchedulingNextFragmentRequestRule);

var _modelsFragmentModel = require('../models/FragmentModel');

var _modelsFragmentModel2 = _interopRequireDefault(_modelsFragmentModel);

var _coreEventBus = require('../../core/EventBus');

var _coreEventBus2 = _interopRequireDefault(_coreEventBus);

var _coreEventsEvents = require('../../core/events/Events');

var _coreEventsEvents2 = _interopRequireDefault(_coreEventsEvents);

var _coreFactoryMaker = require('../../core/FactoryMaker');

var _coreFactoryMaker2 = _interopRequireDefault(_coreFactoryMaker);

var _coreDebug = require('../../core/Debug');

var _coreDebug2 = _interopRequireDefault(_coreDebug);

function ScheduleController(config) {

    var context = this.context;
    var eventBus = (0, _coreEventBus2['default'])(context).getInstance();
    var metricsModel = config.metricsModel;
    var adapter = config.adapter;
    var dashMetrics = config.dashMetrics;
    var dashManifestModel = config.dashManifestModel;
    var timelineConverter = config.timelineConverter;
    var mediaPlayerModel = config.mediaPlayerModel;
    var abrController = config.abrController;
    var playbackController = config.playbackController;
    var mediaController = config.mediaController;
    var streamController = config.streamController;
    var textController = config.textController;
    var sourceBufferController = config.sourceBufferController;
    var type = config.type;
    var streamProcessor = config.streamProcessor;

    var instance = undefined,
        log = undefined,
        fragmentModel = undefined,
        currentRepresentationInfo = undefined,
        initialRequest = undefined,
        isStopped = undefined,
        playListMetrics = undefined,
        playListTraceMetrics = undefined,
        playListTraceMetricsClosed = undefined,
        isFragmentProcessingInProgress = undefined,
        timeToLoadDelay = undefined,
        scheduleTimeout = undefined,
        seekTarget = undefined,
        bufferLevelRule = undefined,
        nextFragmentRequestRule = undefined,
        scheduleWhilePaused = undefined,
        lastQualityIndex = undefined,
        topQualityIndex = undefined,
        lastInitQuality = undefined,
        replaceRequestArray = undefined,
        switchTrack = undefined;

    function setup() {
        log = (0, _coreDebug2['default'])(context).getInstance().log.bind(instance);

        reset();
    }

    function initialize() {
        fragmentModel = streamProcessor.getFragmentModel();
        scheduleWhilePaused = mediaPlayerModel.getScheduleWhilePaused();

        bufferLevelRule = (0, _rulesSchedulingBufferLevelRule2['default'])(context).create({
            abrController: abrController,
            dashMetrics: dashMetrics,
            metricsModel: metricsModel,
            mediaPlayerModel: mediaPlayerModel,
            textController: textController
        });

        nextFragmentRequestRule = (0, _rulesSchedulingNextFragmentRequestRule2['default'])(context).create({
            adapter: adapter,
            sourceBufferController: sourceBufferController,
            textController: textController
        });

        if (dashManifestModel.getIsTextTrack(type)) {
            eventBus.on(_coreEventsEvents2['default'].TIMED_TEXT_REQUESTED, onTimedTextRequested, this);
        }

        //eventBus.on(Events.LIVE_EDGE_SEARCH_COMPLETED, onLiveEdgeSearchCompleted, this);
        eventBus.on(_coreEventsEvents2['default'].QUALITY_CHANGE_REQUESTED, onQualityChanged, this);
        eventBus.on(_coreEventsEvents2['default'].DATA_UPDATE_STARTED, onDataUpdateStarted, this);
        eventBus.on(_coreEventsEvents2['default'].DATA_UPDATE_COMPLETED, onDataUpdateCompleted, this);
        eventBus.on(_coreEventsEvents2['default'].FRAGMENT_LOADING_COMPLETED, onFragmentLoadingCompleted, this);
        eventBus.on(_coreEventsEvents2['default'].STREAM_COMPLETED, onStreamCompleted, this);
        eventBus.on(_coreEventsEvents2['default'].STREAM_INITIALIZED, onStreamInitialized, this);
        eventBus.on(_coreEventsEvents2['default'].BUFFER_LEVEL_STATE_CHANGED, onBufferLevelStateChanged, this);
        eventBus.on(_coreEventsEvents2['default'].BUFFER_CLEARED, onBufferCleared, this);
        eventBus.on(_coreEventsEvents2['default'].BYTES_APPENDED, onBytesAppended, this);
        eventBus.on(_coreEventsEvents2['default'].INIT_REQUESTED, onInitRequested, this);
        eventBus.on(_coreEventsEvents2['default'].QUOTA_EXCEEDED, onQuotaExceeded, this);
        eventBus.on(_coreEventsEvents2['default'].PLAYBACK_SEEKING, onPlaybackSeeking, this);
        eventBus.on(_coreEventsEvents2['default'].PLAYBACK_STARTED, onPlaybackStarted, this);
        eventBus.on(_coreEventsEvents2['default'].PLAYBACK_RATE_CHANGED, onPlaybackRateChanged, this);
        eventBus.on(_coreEventsEvents2['default'].PLAYBACK_TIME_UPDATED, onPlaybackTimeUpdated, this);
        eventBus.on(_coreEventsEvents2['default'].URL_RESOLUTION_FAILED, onURLResolutionFailed, this);
        eventBus.on(_coreEventsEvents2['default'].FRAGMENT_LOADING_ABANDONED, onFragmentLoadingAbandoned, this);
    }

    function isStarted() {
        return isStopped === false;
    }

    function start() {
        if (!currentRepresentationInfo || streamProcessor.isBufferingCompleted()) {
            return;
        }

        addPlaylistTraceMetrics();
        isStopped = false;

        if (initialRequest) {
            initialRequest = false;
        }

        startScheduleTimer(0);

        log('Schedule controller starting for ' + type);
    }

    function stop() {
        if (isStopped) {
            return;
        }

        isStopped = true;
        clearTimeout(scheduleTimeout);
        log('Schedule controller stopping for ' + type);
    }

    function hasTopQualityChanged(type, id) {

        topQualityIndex[id] = topQualityIndex[id] || {};
        var newTopQualityIndex = abrController.getTopQualityIndexFor(type, id);

        if (topQualityIndex[id][type] != newTopQualityIndex) {
            log('Top quality' + type + ' index has changed from ' + topQualityIndex[id][type] + ' to ' + newTopQualityIndex);
            topQualityIndex[id][type] = newTopQualityIndex;
            return true;
        }
        return false;
    }

    function schedule() {

        if (isStopped || isFragmentProcessingInProgress || !streamProcessor.getBufferController() || playbackController.isPaused() && !scheduleWhilePaused) {
            return;
        }

        validateExecutedFragmentRequest();

        var isReplacement = replaceRequestArray.length > 0;
        if (switchTrack || isReplacement || hasTopQualityChanged(currentRepresentationInfo.mediaInfo.type, streamProcessor.getStreamInfo().id) || bufferLevelRule.execute(streamProcessor, type, streamController.isVideoTrackPresent())) {

            var getNextFragment = function getNextFragment() {
                log('ScheduleController - getNextFragment');
                var fragmentController = streamProcessor.getFragmentController();
                if (switchTrack) {
                    log('ScheduleController - switch track has been asked, get init request');
                    streamProcessor.switchInitData(streamProcessor.getStreamInfo().id, currentRepresentationInfo.id);
                    switchTrack = false;
                } else if (currentRepresentationInfo.quality !== lastInitQuality) {
                    log('ScheduleController - quality has changed, get init request');
                    lastInitQuality = currentRepresentationInfo.quality;

                    streamProcessor.switchInitData(currentRepresentationInfo.id);
                } else {
                    var replacement = replaceRequestArray.shift();

                    if (fragmentController.isInitializationRequest(replacement)) {
                        //to be sure the specific init segment had not already been loaded.
                        streamProcessor.switchInitData(replacement.representationId);
                    } else {
                        var request = nextFragmentRequestRule.execute(streamProcessor, replacement);
                        if (request) {
                            log('ScheduleController - getNextFragment - request is ' + request.url);
                            fragmentModel.executeRequest(request);
                        } else {
                            //Use case - Playing at the bleeding live edge and frag is not available yet. Cycle back around.
                            log('getNextFragment - Playing at the bleeding live edge and frag is not available yet');
                            isFragmentProcessingInProgress = false;
                            startScheduleTimer(500);
                        }
                    }
                }
            };

            isFragmentProcessingInProgress = true;
            if (isReplacement || switchTrack) {
                getNextFragment();
            } else {
                abrController.checkPlaybackQuality(type);
                getNextFragment();
            }
        } else {
            startScheduleTimer(500);
        }
    }

    function validateExecutedFragmentRequest() {
        //Validate that the fragment request executed and appended into the source buffer is as
        // good of quality as the current quality and is the correct media track.
        var safeBufferLevel = currentRepresentationInfo.fragmentDuration * 1.5;
        var request = fragmentModel.getRequests({
            state: _modelsFragmentModel2['default'].FRAGMENT_MODEL_EXECUTED,
            time: playbackController.getTime() + safeBufferLevel,
            threshold: 0
        })[0];

        if (request && replaceRequestArray.indexOf(request) === -1 && !dashManifestModel.getIsTextTrack(type)) {
            var isCurrentTrack = mediaController.isCurrentTrack(request.mediaInfo);
            var fastSwitchModeEnabled = mediaPlayerModel.getFastSwitchEnabled();
            var bufferLevel = streamProcessor.getBufferLevel();
            var abandonmentState = abrController.getAbandonmentStateFor(type);

            if (!isCurrentTrack || fastSwitchModeEnabled && request.quality < currentRepresentationInfo.quality && bufferLevel >= safeBufferLevel && abandonmentState !== _AbrController2['default'].ABANDON_LOAD) {
                replaceRequest(request);
                log('Reloading outdated fragment at index: ', request.index);
            } else if (request.quality > currentRepresentationInfo.quality) {
                //The buffer has better quality it in then what we would request so set append point to end of buffer!!
                setSeekTarget(playbackController.getTime() + streamProcessor.getBufferLevel());
            }
        }
    }

    function startScheduleTimer(value) {
        clearTimeout(scheduleTimeout);
        scheduleTimeout = setTimeout(schedule, value);
    }

    function onInitRequested(e) {
        if (!e.sender || e.sender.getStreamProcessor() !== streamProcessor) {
            return;
        }

        getInitRequest(currentRepresentationInfo.quality);
    }

    function getInitRequest(quality) {
        lastInitQuality = quality;

        var request = adapter.getInitRequest(streamProcessor, quality);
        if (request) {
            isFragmentProcessingInProgress = true;
            fragmentModel.executeRequest(request);
        }
    }

    function switchTrackAsked() {
        switchTrack = true;
    }

    function replaceRequest(request) {
        replaceRequestArray.push(request);
    }

    function onQualityChanged(e) {
        if (type !== e.mediaType || streamProcessor.getStreamInfo().id !== e.streamInfo.id) {
            return;
        }

        currentRepresentationInfo = streamProcessor.getRepresentationInfoForQuality(e.newQuality);

        if (currentRepresentationInfo === null || currentRepresentationInfo === undefined) {
            throw new Error('Unexpected error! - currentRepresentationInfo is null or undefined');
        }

        clearPlayListTraceMetrics(new Date(), _voMetricsPlayList.PlayListTrace.REPRESENTATION_SWITCH_STOP_REASON);
        addPlaylistTraceMetrics();
    }

    function completeQualityChange(trigger) {
        if (playbackController && fragmentModel) {
            var item = fragmentModel.getRequests({
                state: _modelsFragmentModel2['default'].FRAGMENT_MODEL_EXECUTED,
                time: playbackController.getTime(),
                threshold: 0
            })[0];
            if (item && playbackController.getTime() >= item.startTime) {
                if (item.quality !== lastQualityIndex && trigger) {
                    eventBus.trigger(_coreEventsEvents2['default'].QUALITY_CHANGE_RENDERED, {
                        mediaType: type,
                        oldQuality: lastQualityIndex,
                        newQuality: item.quality
                    });
                }
                lastQualityIndex = item.quality;
            }
        }
    }

    function onDataUpdateCompleted(e) {
        if (e.error || e.sender.getStreamProcessor() !== streamProcessor) {
            return;
        }

        currentRepresentationInfo = adapter.convertDataToTrack(e.currentRepresentation);
    }

    function onStreamInitialized(e) {
        if (e.error || streamProcessor.getStreamInfo().id !== e.streamInfo.id) {
            return;
        }

        currentRepresentationInfo = streamProcessor.getCurrentRepresentationInfo();

        if (initialRequest) {
            if (playbackController.getIsDynamic()) {
                timelineConverter.setTimeSyncCompleted(true);
                setLiveEdgeSeekTarget();
            } else {
                seekTarget = playbackController.getStreamStartTime(false);
                streamProcessor.getBufferController().setSeekStartTime(seekTarget);
            }
        }

        if (isStopped) {
            start();
        }
    }

    function setLiveEdgeSeekTarget() {
        var liveEdgeFinder = streamProcessor.getLiveEdgeFinder();
        if (liveEdgeFinder) {
            var liveEdge = liveEdgeFinder.getLiveEdge();
            var dvrWindowSize = currentRepresentationInfo.mediaInfo.streamInfo.manifestInfo.DVRWindowSize / 2;
            var startTime = liveEdge - playbackController.computeLiveDelay(currentRepresentationInfo.fragmentDuration, dvrWindowSize);
            var request = adapter.getFragmentRequestForTime(streamProcessor, currentRepresentationInfo, startTime, {
                ignoreIsFinished: true
            });
            seekTarget = playbackController.getLiveStartTime();
            if (isNaN(seekTarget) || request.startTime > seekTarget) {
                //special use case for multi period stream. If the startTime is out of the current period, send a seek command.
                //in onPlaybackSeeking callback (StreamController), the detection of switch stream is done.
                if (request.startTime > currentRepresentationInfo.mediaInfo.streamInfo.start + currentRepresentationInfo.mediaInfo.streamInfo.duration) {
                    playbackController.seek(request.startTime);
                }
                playbackController.setLiveStartTime(request.startTime);
                seekTarget = request.startTime;
            }

            var manifestUpdateInfo = dashMetrics.getCurrentManifestUpdate(metricsModel.getMetricsFor(_constantsConstants2['default'].STREAM));
            metricsModel.updateManifestUpdateInfo(manifestUpdateInfo, {
                currentTime: seekTarget,
                presentationStartTime: liveEdge,
                latency: liveEdge - seekTarget,
                clientTimeOffset: timelineConverter.getClientTimeOffset()
            });
        }
    }

    function onStreamCompleted(e) {
        if (e.fragmentModel !== fragmentModel) {
            return;
        }

        stop();
        isFragmentProcessingInProgress = false;
        log('Stream is complete');
    }

    function onFragmentLoadingCompleted(e) {
        if (e.sender !== fragmentModel) {
            return;
        }

        if (dashManifestModel.getIsTextTrack(type)) {
            isFragmentProcessingInProgress = false;
        }

        if (e.error && e.request.serviceLocation && !isStopped) {
            replaceRequest(e.request);
            isFragmentProcessingInProgress = false;
            startScheduleTimer(0);
        }
    }

    function onPlaybackTimeUpdated() {
        completeQualityChange(true);
    }

    function onBytesAppended(e) {
        if (e.sender.getStreamProcessor() !== streamProcessor) {
            return;
        }

        isFragmentProcessingInProgress = false;
        startScheduleTimer(0);
    }

    function onFragmentLoadingAbandoned(e) {
        if (e.streamProcessor !== streamProcessor) {
            return;
        }

        replaceRequest(e.request);
        isFragmentProcessingInProgress = false;
        startScheduleTimer(0);
    }

    function onDataUpdateStarted(e) {
        if (e.sender.getStreamProcessor() !== streamProcessor) {
            return;
        }

        stop();
    }

    function onBufferCleared(e) {
        if (e.sender.getStreamProcessor() !== streamProcessor) {
            return;
        }

        // after the data has been removed from the buffer we should remove the requests from the list of
        // the executed requests for which playback time is inside the time interval that has been removed from the buffer
        fragmentModel.removeExecutedRequestsBeforeTime(e.to);

        if (e.hasEnoughSpaceToAppend && isStopped) {
            start();
        }
    }

    function onBufferLevelStateChanged(e) {
        if (e.sender.getStreamProcessor() === streamProcessor && e.state === _BufferController2['default'].BUFFER_EMPTY && !playbackController.isSeeking()) {
            log('Buffer is empty! Stalling!');
            clearPlayListTraceMetrics(new Date(), _voMetricsPlayList.PlayListTrace.REBUFFERING_REASON);
        }
    }

    function onQuotaExceeded(e) {
        if (e.sender.getStreamProcessor() !== streamProcessor) {
            return;
        }

        stop();
        isFragmentProcessingInProgress = false;
    }

    function onURLResolutionFailed() {
        fragmentModel.abortRequests();
        stop();
    }

    function onTimedTextRequested(e) {
        if (e.sender.getStreamProcessor() !== streamProcessor) {
            return;
        }

        getInitRequest(e.index);
    }

    function onPlaybackStarted() {
        if (isStopped || !scheduleWhilePaused) {
            start();
        }
    }

    function onPlaybackSeeking(e) {

        seekTarget = e.seekTime;
        setTimeToLoadDelay(0);

        if (isStopped) {
            start();
        }

        var manifestUpdateInfo = dashMetrics.getCurrentManifestUpdate(metricsModel.getMetricsFor(_constantsConstants2['default'].STREAM));
        var latency = currentRepresentationInfo.DVRWindow && playbackController ? currentRepresentationInfo.DVRWindow.end - playbackController.getTime() : NaN;
        metricsModel.updateManifestUpdateInfo(manifestUpdateInfo, {
            latency: latency
        });

        //if, during the seek command, the scheduleController is waiting : stop waiting, request chunk as soon as possible
        if (!isFragmentProcessingInProgress) {
            startScheduleTimer(0);
        }
    }

    function onPlaybackRateChanged(e) {
        if (playListTraceMetrics) {
            playListTraceMetrics.playbackspeed = e.playbackRate.toString();
        }
    }

    function getSeekTarget() {
        return seekTarget;
    }

    function setSeekTarget(value) {
        seekTarget = value;
    }

    function setTimeToLoadDelay(value) {
        timeToLoadDelay = value;
    }

    function getTimeToLoadDelay() {
        return timeToLoadDelay;
    }

    function getBufferTarget() {
        return bufferLevelRule.getBufferTarget(streamProcessor, type, streamController.isVideoTrackPresent());
    }

    function getType() {
        return type;
    }

    function setPlayList(playList) {
        playListMetrics = playList;
    }

    function finalisePlayList(time, reason) {
        clearPlayListTraceMetrics(time, reason);
        playListMetrics = null;
    }

    function clearPlayListTraceMetrics(endTime, stopreason) {
        if (playListMetrics && playListTraceMetricsClosed === false) {
            var startTime = playListTraceMetrics.start;
            var duration = endTime.getTime() - startTime.getTime();
            playListTraceMetrics.duration = duration;
            playListTraceMetrics.stopreason = stopreason;
            playListMetrics.trace.push(playListTraceMetrics);
            playListTraceMetricsClosed = true;
        }
    }

    function addPlaylistTraceMetrics() {
        if (playListMetrics && playListTraceMetricsClosed === true && currentRepresentationInfo) {
            playListTraceMetricsClosed = false;
            playListTraceMetrics = new _voMetricsPlayList.PlayListTrace();
            playListTraceMetrics.representationid = currentRepresentationInfo.id;
            playListTraceMetrics.start = new Date();
            playListTraceMetrics.mstart = playbackController.getTime() * 1000;
            playListTraceMetrics.playbackspeed = playbackController.getPlaybackRate().toString();
        }
    }

    function reset() {
        //eventBus.off(Events.LIVE_EDGE_SEARCH_COMPLETED, onLiveEdgeSearchCompleted, this);
        eventBus.off(_coreEventsEvents2['default'].DATA_UPDATE_STARTED, onDataUpdateStarted, this);
        eventBus.off(_coreEventsEvents2['default'].DATA_UPDATE_COMPLETED, onDataUpdateCompleted, this);
        eventBus.off(_coreEventsEvents2['default'].BUFFER_LEVEL_STATE_CHANGED, onBufferLevelStateChanged, this);
        eventBus.off(_coreEventsEvents2['default'].QUALITY_CHANGE_REQUESTED, onQualityChanged, this);
        eventBus.off(_coreEventsEvents2['default'].FRAGMENT_LOADING_COMPLETED, onFragmentLoadingCompleted, this);
        eventBus.off(_coreEventsEvents2['default'].STREAM_COMPLETED, onStreamCompleted, this);
        eventBus.off(_coreEventsEvents2['default'].STREAM_INITIALIZED, onStreamInitialized, this);
        eventBus.off(_coreEventsEvents2['default'].QUOTA_EXCEEDED, onQuotaExceeded, this);
        eventBus.off(_coreEventsEvents2['default'].BYTES_APPENDED, onBytesAppended, this);
        eventBus.off(_coreEventsEvents2['default'].BUFFER_CLEARED, onBufferCleared, this);
        eventBus.off(_coreEventsEvents2['default'].INIT_REQUESTED, onInitRequested, this);
        eventBus.off(_coreEventsEvents2['default'].PLAYBACK_RATE_CHANGED, onPlaybackRateChanged, this);
        eventBus.off(_coreEventsEvents2['default'].PLAYBACK_SEEKING, onPlaybackSeeking, this);
        eventBus.off(_coreEventsEvents2['default'].PLAYBACK_STARTED, onPlaybackStarted, this);
        eventBus.off(_coreEventsEvents2['default'].PLAYBACK_TIME_UPDATED, onPlaybackTimeUpdated, this);
        eventBus.off(_coreEventsEvents2['default'].URL_RESOLUTION_FAILED, onURLResolutionFailed, this);
        eventBus.off(_coreEventsEvents2['default'].FRAGMENT_LOADING_ABANDONED, onFragmentLoadingAbandoned, this);
        if (dashManifestModel.getIsTextTrack(type)) {
            eventBus.off(_coreEventsEvents2['default'].TIMED_TEXT_REQUESTED, onTimedTextRequested, this);
        }

        stop();
        completeQualityChange(false);
        isFragmentProcessingInProgress = false;
        timeToLoadDelay = 0;
        seekTarget = NaN;
        playListMetrics = null;
        playListTraceMetrics = null;
        playListTraceMetricsClosed = true;
        initialRequest = true;
        lastInitQuality = NaN;
        lastQualityIndex = NaN;
        topQualityIndex = {};
        replaceRequestArray = [];
        isStopped = true;
    }

    instance = {
        initialize: initialize,
        getType: getType,
        getSeekTarget: getSeekTarget,
        setSeekTarget: setSeekTarget,
        setTimeToLoadDelay: setTimeToLoadDelay,
        getTimeToLoadDelay: getTimeToLoadDelay,
        replaceRequest: replaceRequest,
        switchTrackAsked: switchTrackAsked,
        isStarted: isStarted,
        start: start,
        stop: stop,
        reset: reset,
        setPlayList: setPlayList,
        getBufferTarget: getBufferTarget,
        finalisePlayList: finalisePlayList
    };

    setup();

    return instance;
}

ScheduleController.__dashjs_factory_name = 'ScheduleController';
exports['default'] = _coreFactoryMaker2['default'].getClassFactory(ScheduleController);
module.exports = exports['default'];
//# sourceMappingURL=ScheduleController.js.map