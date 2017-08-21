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

var _coreEventBus = require('../../core/EventBus');

var _coreEventBus2 = _interopRequireDefault(_coreEventBus);

var _coreEventsEvents = require('../../core/events/Events');

var _coreEventsEvents2 = _interopRequireDefault(_coreEventsEvents);

var _coreFactoryMaker = require('../../core/FactoryMaker');

var _coreFactoryMaker2 = _interopRequireDefault(_coreFactoryMaker);

var _utilsInitCache = require('../utils/InitCache');

var _utilsInitCache2 = _interopRequireDefault(_utilsInitCache);

function NotFragmentedTextBufferController(config) {

    var context = this.context;
    var eventBus = (0, _coreEventBus2['default'])(context).getInstance();

    var sourceBufferController = config.sourceBufferController;
    var errHandler = config.errHandler;

    var instance = undefined,
        isBufferingCompleted = undefined,
        initialized = undefined,
        mediaSource = undefined,
        buffer = undefined,
        type = undefined,
        streamProcessor = undefined,
        representationController = undefined,
        initCache = undefined;

    function setup() {

        initialized = false;
        mediaSource = null;
        buffer = null;
        type = null;
        streamProcessor = null;
        representationController = null;
        isBufferingCompleted = false;

        eventBus.on(_coreEventsEvents2['default'].DATA_UPDATE_COMPLETED, onDataUpdateCompleted, this);
        eventBus.on(_coreEventsEvents2['default'].INIT_FRAGMENT_LOADED, onInitFragmentLoaded, this);
    }

    function initialize(Type, source, StreamProcessor) {
        type = Type;
        setMediaSource(source);
        streamProcessor = StreamProcessor;
        representationController = streamProcessor.getRepresentationController();
        initCache = (0, _utilsInitCache2['default'])(context).getInstance();
    }

    /**
     * @param {MediaInfo }mediaInfo
     * @returns {Object} SourceBuffer object
     * @memberof BufferController#
     */
    function createBuffer(mediaInfo) {
        try {
            buffer = sourceBufferController.createSourceBuffer(mediaSource, mediaInfo);

            if (!initialized) {
                if (buffer.hasOwnProperty('initialize')) {
                    buffer.initialize(type, this);
                }
                initialized = true;
            }
        } catch (e) {
            errHandler.mediaSourceError('Error creating ' + type + ' source buffer.');
        }

        return buffer;
    }

    function getType() {
        return type;
    }

    function getBuffer() {
        return buffer;
    }

    function setBuffer(value) {
        buffer = value;
    }

    function setMediaSource(value) {
        mediaSource = value;
    }

    function getMediaSource() {
        return mediaSource;
    }

    function setStreamProcessor(value) {
        streamProcessor = value;
    }

    function getStreamProcessor() {
        return streamProcessor;
    }

    function getBufferLevel() {
        return 0;
    }

    function getCriticalBufferLevel() {
        return 0;
    }

    function reset(errored) {

        eventBus.off(_coreEventsEvents2['default'].DATA_UPDATE_COMPLETED, onDataUpdateCompleted, this);
        eventBus.off(_coreEventsEvents2['default'].INIT_FRAGMENT_LOADED, onInitFragmentLoaded, this);

        if (!errored) {
            sourceBufferController.abort(mediaSource, buffer);
            sourceBufferController.removeSourceBuffer(mediaSource, buffer);
        }
    }

    function onDataUpdateCompleted(e) {
        if (e.sender.getStreamProcessor() !== streamProcessor) {
            return;
        }

        eventBus.trigger(_coreEventsEvents2['default'].TIMED_TEXT_REQUESTED, {
            index: 0,
            sender: e.sender
        }); //TODO make index dynamic if referring to MP?
    }

    function onInitFragmentLoaded(e) {
        if (e.fragmentModel !== streamProcessor.getFragmentModel() || !e.chunk.bytes) {
            return;
        }

        sourceBufferController.append(buffer, e.chunk);
    }

    function getIsBufferingCompleted() {
        return isBufferingCompleted;
    }

    function switchInitData(streamId, quality) {
        var chunk = initCache.extract(streamId, type, quality);
        if (chunk) {
            sourceBufferController.append(chunk);
        } else {
            eventBus.trigger(_coreEventsEvents2['default'].INIT_REQUESTED, {
                sender: instance
            });
        }
    }

    instance = {
        initialize: initialize,
        createBuffer: createBuffer,
        getType: getType,
        getStreamProcessor: getStreamProcessor,
        setStreamProcessor: setStreamProcessor,
        getBuffer: getBuffer,
        setBuffer: setBuffer,
        getBufferLevel: getBufferLevel,
        getCriticalBufferLevel: getCriticalBufferLevel,
        setMediaSource: setMediaSource,
        getMediaSource: getMediaSource,
        getIsBufferingCompleted: getIsBufferingCompleted,
        switchInitData: switchInitData,
        reset: reset
    };

    setup();

    return instance;
}

NotFragmentedTextBufferController.__dashjs_factory_name = 'NotFragmentedTextBufferController';
exports['default'] = _coreFactoryMaker2['default'].getClassFactory(NotFragmentedTextBufferController);
module.exports = exports['default'];
//# sourceMappingURL=NotFragmentedTextBufferController.js.map
