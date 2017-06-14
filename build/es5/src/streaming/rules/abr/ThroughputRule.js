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

var _controllersBufferController = require('../../controllers/BufferController');

var _controllersBufferController2 = _interopRequireDefault(_controllersBufferController);

var _controllersAbrController = require('../../controllers/AbrController');

var _controllersAbrController2 = _interopRequireDefault(_controllersAbrController);

var _modelsMediaPlayerModel = require('../../models/MediaPlayerModel');

var _modelsMediaPlayerModel2 = _interopRequireDefault(_modelsMediaPlayerModel);

var _voMetricsHTTPRequest = require('../../vo/metrics/HTTPRequest');

var _coreFactoryMaker = require('../../../core/FactoryMaker');

var _coreFactoryMaker2 = _interopRequireDefault(_coreFactoryMaker);

var _coreDebug = require('../../../core/Debug');

var _coreDebug2 = _interopRequireDefault(_coreDebug);

var _SwitchRequestJs = require('../SwitchRequest.js');

var _SwitchRequestJs2 = _interopRequireDefault(_SwitchRequestJs);

function ThroughputRule(config) {

    var MAX_MEASUREMENTS_TO_KEEP = 20;
    var AVERAGE_THROUGHPUT_SAMPLE_AMOUNT_LIVE = 3;
    var AVERAGE_THROUGHPUT_SAMPLE_AMOUNT_VOD = 4;
    var AVERAGE_LATENCY_SAMPLES = AVERAGE_THROUGHPUT_SAMPLE_AMOUNT_VOD;
    var THROUGHPUT_DECREASE_SCALE = 1.3;
    var THROUGHPUT_INCREASE_SCALE = 1.3;

    var context = this.context;
    var log = (0, _coreDebug2['default'])(context).getInstance().log;
    var dashMetrics = config.dashMetrics;
    var metricsModel = config.metricsModel;

    var throughputArray = undefined,
        latencyArray = undefined,
        mediaPlayerModel = undefined;

    function setup() {
        throughputArray = [];
        latencyArray = [];
        mediaPlayerModel = (0, _modelsMediaPlayerModel2['default'])(context).getInstance();
    }

    function storeLastRequestThroughputByType(type, throughput) {
        throughputArray[type] = throughputArray[type] || [];
        throughputArray[type].push(throughput);
    }

    function storeLatency(mediaType, latency) {
        if (!latencyArray[mediaType]) {
            latencyArray[mediaType] = [];
        }
        latencyArray[mediaType].push(latency);

        if (latencyArray[mediaType].length > AVERAGE_LATENCY_SAMPLES) {
            return latencyArray[mediaType].shift();
        }

        return undefined;
    }

    function getAverageLatency(mediaType) {
        var average = undefined;
        if (latencyArray[mediaType] && latencyArray[mediaType].length > 0) {
            average = latencyArray[mediaType].reduce(function (a, b) {
                return a + b;
            }) / latencyArray[mediaType].length;
        }

        return average;
    }

    function getSample(type, isDynamic) {
        var size = Math.min(throughputArray[type].length, isDynamic ? AVERAGE_THROUGHPUT_SAMPLE_AMOUNT_LIVE : AVERAGE_THROUGHPUT_SAMPLE_AMOUNT_VOD);
        var sampleArray = throughputArray[type].slice(size * -1, throughputArray[type].length);
        if (sampleArray.length > 1) {
            sampleArray.reduce(function (a, b) {
                if (a * THROUGHPUT_INCREASE_SCALE <= b || a >= b * THROUGHPUT_DECREASE_SCALE) {
                    size++;
                }
                return b;
            });
        }
        size = Math.min(throughputArray[type].length, size);
        return throughputArray[type].slice(size * -1, throughputArray[type].length);
    }

    function getAverageThroughput(type, isDynamic) {
        var sample = getSample(type, isDynamic);
        var averageThroughput = 0;
        if (sample.length > 0) {
            var totalSampledValue = sample.reduce(function (a, b) {
                return a + b;
            }, 0);
            averageThroughput = totalSampledValue / sample.length;
        }
        if (throughputArray[type].length >= MAX_MEASUREMENTS_TO_KEEP) {
            throughputArray[type].shift();
        }
        return averageThroughput / 1000 * mediaPlayerModel.getBandwidthSafetyFactor();
    }

    function isCachedResponse(latency, downloadTime, mediaType) {
        var cacheLoadThresholdLatency = mediaPlayerModel.getCacheLoadThresholdLatency();
        var cacheLoadThresholdVideo = mediaPlayerModel.getCacheLoadThresholdVideo();
        var cacheLoadThresholdAudio = mediaPlayerModel.getCacheLoadThresholdAudio();
        var ret = false;

        if (latency < cacheLoadThresholdLatency) {
            ret = true;
        }

        if (!ret) {
            switch (mediaType) {
                case 'video':
                    ret = downloadTime < cacheLoadThresholdVideo;
                    break;
                case 'audio':
                    ret = downloadTime < cacheLoadThresholdAudio;
                    break;
                default:
                    break;
            }
        }

        return ret;
    }

    function getMaxIndex(rulesContext) {
        var mediaInfo = rulesContext.getMediaInfo();
        var mediaType = mediaInfo.type;
        var metrics = metricsModel.getReadOnlyMetricsFor(mediaType);
        var streamProcessor = rulesContext.getStreamProcessor();
        var abrController = streamProcessor.getABRController();
        var isDynamic = streamProcessor.isDynamic();
        var lastRequest = dashMetrics.getCurrentHttpRequest(metrics);
        var bufferStateVO = metrics.BufferState.length > 0 ? metrics.BufferState[metrics.BufferState.length - 1] : null;
        var hasRichBuffer = rulesContext.hasRichBuffer();
        var switchRequest = (0, _SwitchRequestJs2['default'])(context).create();

        if (!metrics || !lastRequest || lastRequest.type !== _voMetricsHTTPRequest.HTTPRequest.MEDIA_SEGMENT_TYPE || !bufferStateVO || hasRichBuffer) {
            return switchRequest;
        }

        var downloadTimeInMilliseconds = undefined;
        var latencyTimeInMilliseconds = undefined;

        if (lastRequest.trace && lastRequest.trace.length) {
            var useDeadTimeLatency = abrController.getUseDeadTimeLatency();
            latencyTimeInMilliseconds = lastRequest.tresponse.getTime() - lastRequest.trequest.getTime() || 1;
            downloadTimeInMilliseconds = lastRequest._tfinish.getTime() - lastRequest.tresponse.getTime() || 1; //Make sure never 0 we divide by this value. Avoid infinity!

            var bytes = lastRequest.trace.reduce(function (a, b) {
                return a + b.b[0];
            }, 0);

            var throughputMeasureTime = useDeadTimeLatency ? downloadTimeInMilliseconds : latencyTimeInMilliseconds + downloadTimeInMilliseconds;
            var lastRequestThroughput = Math.round(bytes * 8 / (throughputMeasureTime / 1000));

            var throughput = undefined;
            var latency = undefined;
            //Prevent cached fragment loads from skewing the average throughput value - allow first even if cached to set allowance for ABR rules..
            if (isCachedResponse(latencyTimeInMilliseconds, downloadTimeInMilliseconds, mediaType)) {
                if (!throughputArray[mediaType] || !latencyArray[mediaType]) {
                    throughput = lastRequestThroughput / 1000;
                    latency = latencyTimeInMilliseconds;
                } else {
                    throughput = getAverageThroughput(mediaType, isDynamic);
                    latency = getAverageLatency(mediaType);
                }
            } else {
                storeLastRequestThroughputByType(mediaType, lastRequestThroughput);
                throughput = getAverageThroughput(mediaType, isDynamic);
                storeLatency(mediaType, latencyTimeInMilliseconds);
                latency = getAverageLatency(mediaType, isDynamic);
            }

            abrController.setAverageThroughput(mediaType, throughput);

            if (abrController.getAbandonmentStateFor(mediaType) !== _controllersAbrController2['default'].ABANDON_LOAD) {

                if (bufferStateVO.state === _controllersBufferController2['default'].BUFFER_LOADED || isDynamic) {
                    if (useDeadTimeLatency) {
                        switchRequest.value = abrController.getQualityForBitrate(mediaInfo, throughput, latency);
                    } else {
                        switchRequest.value = abrController.getQualityForBitrate(mediaInfo, throughput);
                    }
                    streamProcessor.getScheduleController().setTimeToLoadDelay(0);
                    log('ThroughputRule requesting switch to index: ', switchRequest.value, 'type: ', mediaType, 'Average throughput', Math.round(throughput), 'kbps');
                    switchRequest.reason = { throughput: throughput, latency: latency };
                }
            }
        }
        return switchRequest;
    }

    function reset() {
        setup();
    }

    var instance = {
        getMaxIndex: getMaxIndex,
        reset: reset
    };

    setup();
    return instance;
}

ThroughputRule.__dashjs_factory_name = 'ThroughputRule';
exports['default'] = _coreFactoryMaker2['default'].getClassFactory(ThroughputRule);
module.exports = exports['default'];
//# sourceMappingURL=ThroughputRule.js.map
