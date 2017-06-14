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

var _coreFactoryMaker = require('../../core/FactoryMaker');

var _coreFactoryMaker2 = _interopRequireDefault(_coreFactoryMaker);

function RulesContext(config) {

    var instance = undefined;
    var representationInfo = config.streamProcessor.getCurrentRepresentationInfo();
    var sp = config.streamProcessor;
    var currentValue = config.currentValue;
    var playbackIndex = config.playbackIndex;
    var switchHistory = config.switchHistory;
    var droppedFramesHistory = config.droppedFramesHistory;
    var currentRequest = config.currentRequest;
    var richBuffer = config.hasRichBuffer;

    function getStreamInfo() {
        return representationInfo.mediaInfo.streamInfo;
    }

    function getMediaInfo() {
        return representationInfo.mediaInfo;
    }

    function getTrackInfo() {
        return representationInfo;
    }

    function getCurrentValue() {
        return currentValue;
    }

    function getManifestInfo() {
        return representationInfo.mediaInfo.streamInfo.manifestInfo;
    }

    function getStreamProcessor() {
        return sp;
    }

    function getPlaybackIndex() {
        return playbackIndex;
    }

    function getSwitchHistory() {
        return switchHistory;
    }

    function getDroppedFramesHistory() {
        return droppedFramesHistory;
    }

    function getCurrentRequest() {
        return currentRequest;
    }

    function hasRichBuffer() {
        return richBuffer;
    }

    instance = {
        getCurrentValue: getCurrentValue,
        getManifestInfo: getManifestInfo,
        getMediaInfo: getMediaInfo,
        getPlaybackIndex: getPlaybackIndex,
        getDroppedFramesHistory: getDroppedFramesHistory,
        getCurrentRequest: getCurrentRequest,
        getSwitchHistory: getSwitchHistory,
        getStreamInfo: getStreamInfo,
        getStreamProcessor: getStreamProcessor,
        getTrackInfo: getTrackInfo,
        hasRichBuffer: hasRichBuffer
    };

    return instance;
}

RulesContext.__dashjs_factory_name = 'RulesContext';
exports['default'] = _coreFactoryMaker2['default'].getClassFactory(RulesContext);
module.exports = exports['default'];
//# sourceMappingURL=RulesContext.js.map
