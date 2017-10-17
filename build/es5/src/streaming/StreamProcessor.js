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

var _constantsConstants = require('./constants/Constants');

var _constantsConstants2 = _interopRequireDefault(_constantsConstants);

var _utilsLiveEdgeFinder = require('./utils/LiveEdgeFinder');

var _utilsLiveEdgeFinder2 = _interopRequireDefault(_utilsLiveEdgeFinder);

var _controllersBufferController = require('./controllers/BufferController');

var _controllersBufferController2 = _interopRequireDefault(_controllersBufferController);

var _textTextBufferController = require('./text/TextBufferController');

var _textTextBufferController2 = _interopRequireDefault(_textTextBufferController);

var _controllersScheduleController = require('./controllers/ScheduleController');

var _controllersScheduleController2 = _interopRequireDefault(_controllersScheduleController);

var _dashControllersRepresentationController = require('../dash/controllers/RepresentationController');

var _dashControllersRepresentationController2 = _interopRequireDefault(_dashControllersRepresentationController);

var _coreFactoryMaker = require('../core/FactoryMaker');

var _coreFactoryMaker2 = _interopRequireDefault(_coreFactoryMaker);

var _dashDashHandler = require('../dash/DashHandler');

var _dashDashHandler2 = _interopRequireDefault(_dashDashHandler);

function StreamProcessor(config) {

    var context = this.context;

    var indexHandler = undefined;
    var type = config.type;
    var errHandler = config.errHandler;
    var mimeType = config.mimeType;
    var timelineConverter = config.timelineConverter;
    var adapter = config.adapter;
    var manifestModel = config.manifestModel;
    var mediaPlayerModel = config.mediaPlayerModel;
    var stream = config.stream;
    var abrController = config.abrController;
    var playbackController = config.playbackController;
    var streamController = config.streamController;
    var mediaController = config.mediaController;
    var textController = config.textController;
    var sourceBufferController = config.sourceBufferController;
    var domStorage = config.domStorage;
    var metricsModel = config.metricsModel;
    var dashMetrics = config.dashMetrics;
    var dashManifestModel = config.dashManifestModel;

    var instance = undefined,
        mediaInfo = undefined,
        mediaInfoArr = undefined,
        bufferController = undefined,
        scheduleController = undefined,
        liveEdgeFinder = undefined,
        representationController = undefined,
        fragmentModel = undefined,
        spExternalControllers = undefined;

    function setup() {
        liveEdgeFinder = (0, _utilsLiveEdgeFinder2['default'])(context).create({
            timelineConverter: timelineConverter,
            streamProcessor: instance
        });
        resetInitialSettings();
    }

    function initialize(mediaSource) {

        indexHandler = (0, _dashDashHandler2['default'])(context).create({
            mimeType: mimeType,
            timelineConverter: timelineConverter,
            dashMetrics: dashMetrics,
            metricsModel: metricsModel,
            mediaPlayerModel: mediaPlayerModel,
            baseURLController: config.baseURLController,
            errHandler: errHandler
        });

        // initialize controllers
        indexHandler.initialize(this);
        abrController.registerStreamType(type, this);

        fragmentModel = stream.getFragmentController().getModel(type);
        fragmentModel.setStreamProcessor(instance);

        bufferController = createBufferControllerForType(type);
        scheduleController = (0, _controllersScheduleController2['default'])(context).create({
            type: type,
            metricsModel: metricsModel,
            adapter: adapter,
            dashMetrics: dashMetrics,
            dashManifestModel: dashManifestModel,
            timelineConverter: timelineConverter,
            mediaPlayerModel: mediaPlayerModel,
            abrController: abrController,
            playbackController: playbackController,
            mediaController: mediaController,
            streamController: streamController,
            textController: textController,
            sourceBufferController: sourceBufferController,
            streamProcessor: this
        });

        representationController = (0, _dashControllersRepresentationController2['default'])(context).create();

        representationController.setConfig({
            abrController: abrController,
            domStorage: domStorage,
            metricsModel: metricsModel,
            dashMetrics: dashMetrics,
            dashManifestModel: dashManifestModel,
            manifestModel: manifestModel,
            playbackController: playbackController,
            timelineConverter: timelineConverter,
            streamProcessor: this
        });
        bufferController.initialize(mediaSource);
        scheduleController.initialize();
        representationController.initialize();
    }

    function registerExternalController(controller) {
        spExternalControllers.push(controller);
    }

    function unregisterExternalController(controller) {
        var index = spExternalControllers.indexOf(controller);

        if (index !== -1) {
            spExternalControllers.splice(index, 1);
        }
    }

    function unregisterAllExternalController() {
        spExternalControllers = [];
    }

    function resetInitialSettings() {
        mediaInfoArr = [];
        mediaInfo = null;
        unregisterAllExternalController();
    }

    function reset(errored) {

        indexHandler.reset();

        if (bufferController) {
            bufferController.reset(errored);
            bufferController = null;
        }

        if (scheduleController) {
            scheduleController.reset();
            scheduleController = null;
        }

        if (representationController) {
            representationController.reset();
            representationController = null;
        }

        spExternalControllers.forEach(function (controller) {
            controller.reset();
        });

        resetInitialSettings();
        type = null;
        stream = null;
        liveEdgeFinder.reset();
    }

    function isUpdating() {
        return representationController ? representationController.isUpdating() : false;
    }

    function getType() {
        return type;
    }

    function getRepresentationController() {
        return representationController;
    }

    function getIndexHandler() {
        return indexHandler;
    }

    function getFragmentController() {
        return stream ? stream.getFragmentController() : null;
    }

    function getBuffer() {
        return bufferController.getBuffer();
    }

    function setBuffer(buffer) {
        bufferController.setBuffer(buffer);
    }

    function getBufferController() {
        return bufferController;
    }

    function getFragmentModel() {
        return fragmentModel;
    }

    function getLiveEdgeFinder() {
        return liveEdgeFinder;
    }

    function getStreamInfo() {
        return stream ? stream.getStreamInfo() : null;
    }

    function getEventController() {
        return stream ? stream.getEventController() : null;
    }

    function updateMediaInfo(newMediaInfo) {
        if (newMediaInfo !== mediaInfo && (!newMediaInfo || !mediaInfo || newMediaInfo.type === mediaInfo.type)) {
            mediaInfo = newMediaInfo;
        }
        if (mediaInfoArr.indexOf(newMediaInfo) === -1) {
            mediaInfoArr.push(newMediaInfo);
        }
        adapter.updateData(this);
    }

    function getMediaInfoArr() {
        return mediaInfoArr;
    }

    function getMediaInfo() {
        return mediaInfo;
    }

    function getMediaSource() {
        return bufferController.getMediaSource();
    }

    function getScheduleController() {
        return scheduleController;
    }

    function getCurrentRepresentationInfo() {
        return adapter.getCurrentRepresentationInfo(representationController);
    }

    function getRepresentationInfoForQuality(quality) {
        return adapter.getRepresentationInfoForQuality(representationController, quality);
    }

    function isBufferingCompleted() {
        if (bufferController) {
            return bufferController.getIsBufferingCompleted();
        }

        return false;
    }

    function getBufferLevel() {
        return bufferController.getBufferLevel();
    }

    function switchInitData(representationId) {
        if (bufferController) {
            bufferController.switchInitData(getStreamInfo().id, representationId);
        }
    }

    function createBuffer() {
        return bufferController.getBuffer() || bufferController.createBuffer(mediaInfo);
    }

    function switchTrackAsked() {
        scheduleController.switchTrackAsked();
    }

    function createBufferControllerForType(type) {
        var controller = null;

        if (type === _constantsConstants2['default'].VIDEO || type === _constantsConstants2['default'].AUDIO) {
            controller = (0, _controllersBufferController2['default'])(context).create({
                type: type,
                metricsModel: metricsModel,
                mediaPlayerModel: mediaPlayerModel,
                manifestModel: manifestModel,
                sourceBufferController: sourceBufferController,
                errHandler: errHandler,
                streamController: streamController,
                mediaController: mediaController,
                adapter: adapter,
                textController: textController,
                abrController: abrController,
                playbackController: playbackController,
                streamProcessor: instance
            });
        } else {
            controller = (0, _textTextBufferController2['default'])(context).create({
                type: type,
                metricsModel: metricsModel,
                mediaPlayerModel: mediaPlayerModel,
                manifestModel: manifestModel,
                sourceBufferController: sourceBufferController,
                errHandler: errHandler,
                streamController: streamController,
                mediaController: mediaController,
                adapter: adapter,
                textController: textController,
                abrController: abrController,
                playbackController: playbackController,
                streamProcessor: instance
            });
        }

        return controller;
    }

    instance = {
        initialize: initialize,
        isUpdating: isUpdating,
        getType: getType,
        getBufferController: getBufferController,
        getFragmentModel: getFragmentModel,
        getScheduleController: getScheduleController,
        getLiveEdgeFinder: getLiveEdgeFinder,
        getEventController: getEventController,
        getFragmentController: getFragmentController,
        getRepresentationController: getRepresentationController,
        getIndexHandler: getIndexHandler,
        getCurrentRepresentationInfo: getCurrentRepresentationInfo,
        getRepresentationInfoForQuality: getRepresentationInfoForQuality,
        getBufferLevel: getBufferLevel,
        switchInitData: switchInitData,
        isBufferingCompleted: isBufferingCompleted,
        createBuffer: createBuffer,
        getStreamInfo: getStreamInfo,
        updateMediaInfo: updateMediaInfo,
        switchTrackAsked: switchTrackAsked,
        getMediaInfoArr: getMediaInfoArr,
        getMediaInfo: getMediaInfo,
        getMediaSource: getMediaSource,
        getBuffer: getBuffer,
        setBuffer: setBuffer,
        registerExternalController: registerExternalController,
        unregisterExternalController: unregisterExternalController,
        unregisterAllExternalController: unregisterAllExternalController,
        reset: reset
    };

    setup();
    return instance;
}
StreamProcessor.__dashjs_factory_name = 'StreamProcessor';
exports['default'] = _coreFactoryMaker2['default'].getClassFactory(StreamProcessor);
module.exports = exports['default'];
//# sourceMappingURL=StreamProcessor.js.map
