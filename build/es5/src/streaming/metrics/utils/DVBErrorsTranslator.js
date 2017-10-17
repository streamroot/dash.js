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

var _constantsMetricsConstants = require('../../constants/MetricsConstants');

var _constantsMetricsConstants2 = _interopRequireDefault(_constantsMetricsConstants);

var _voDVBErrors = require('../vo/DVBErrors');

var _voDVBErrors2 = _interopRequireDefault(_voDVBErrors);

var _coreEventsEvents = require('../../../core/events/Events');

var _coreEventsEvents2 = _interopRequireDefault(_coreEventsEvents);

var _MediaPlayerEvents = require('../../MediaPlayerEvents');

var _MediaPlayerEvents2 = _interopRequireDefault(_MediaPlayerEvents);

var _MetricsReportingEvents = require('../MetricsReportingEvents');

var _MetricsReportingEvents2 = _interopRequireDefault(_MetricsReportingEvents);

var _coreFactoryMaker = require('../../../core/FactoryMaker');

var _coreFactoryMaker2 = _interopRequireDefault(_coreFactoryMaker);

function DVBErrorsTranslator(config) {

    var instance = undefined;
    var eventBus = config.eventBus;
    var metricModel = config.metricsModel;
    var mpd = undefined;

    function report(vo) {
        var o = new _voDVBErrors2['default']();

        if (!mpd) {
            return;
        }

        for (var key in vo) {
            if (vo.hasOwnProperty(key)) {
                o[key] = vo[key];
            }
        }

        if (!o.mpdurl) {
            o.mpdurl = mpd.originalUrl || mpd.url;
        }

        if (!o.terror) {
            o.terror = new Date();
        }

        metricModel.addDVBErrors(o);
    }

    function onManifestUpdate(e) {
        if (e.error) {
            return;
        }

        mpd = e.manifest;
    }

    function onServiceLocationChanged(e) {
        report({
            errorcode: _voDVBErrors2['default'].BASE_URL_CHANGED,
            servicelocation: e.entry
        });
    }

    function onBecameReporter() {
        report({
            errorcode: _voDVBErrors2['default'].BECAME_REPORTER
        });
    }

    function handleHttpMetric(vo) {
        if (vo.responsecode === 0 || // connection failure - unknown
        vo.responsecode >= 400 || // HTTP error status code
        vo.responsecode < 100 || // unknown status codes
        vo.responsecode >= 600) {
            // unknown status codes
            report({
                errorcode: vo.responsecode || _voDVBErrors2['default'].CONNECTION_ERROR,
                url: vo.url,
                terror: vo.tresponse,
                servicelocation: vo._serviceLocation
            });
        }
    }

    function onMetricEvent(e) {
        switch (e.metric) {
            case _constantsMetricsConstants2['default'].HTTP_REQUEST:
                handleHttpMetric(e.value);
                break;
            default:
                break;
        }
    }

    function onPlaybackError(e) {
        var reason = e.error ? e.error.code : 0;
        var errorcode = undefined;

        switch (reason) {
            case MediaError.MEDIA_ERR_NETWORK:
                errorcode = _voDVBErrors2['default'].CONNECTION_ERROR;
                break;
            case MediaError.MEDIA_ERR_DECODE:
                errorcode = _voDVBErrors2['default'].CORRUPT_MEDIA_OTHER;
                break;
            default:
                return;
        }

        report({
            errorcode: errorcode
        });
    }

    function initialise() {
        eventBus.on(_coreEventsEvents2['default'].MANIFEST_UPDATED, onManifestUpdate, instance);
        eventBus.on(_coreEventsEvents2['default'].SERVICE_LOCATION_BLACKLIST_CHANGED, onServiceLocationChanged, instance);
        eventBus.on(_MediaPlayerEvents2['default'].METRIC_ADDED, onMetricEvent, instance);
        eventBus.on(_MediaPlayerEvents2['default'].METRIC_UPDATED, onMetricEvent, instance);
        eventBus.on(_MediaPlayerEvents2['default'].PLAYBACK_ERROR, onPlaybackError, instance);
        eventBus.on(_MetricsReportingEvents2['default'].BECAME_REPORTING_PLAYER, onBecameReporter, instance);
    }

    function reset() {
        eventBus.off(_coreEventsEvents2['default'].MANIFEST_UPDATED, onManifestUpdate, instance);
        eventBus.off(_coreEventsEvents2['default'].SERVICE_LOCATION_BLACKLIST_CHANGED, onServiceLocationChanged, instance);
        eventBus.off(_MediaPlayerEvents2['default'].METRIC_ADDED, onMetricEvent, instance);
        eventBus.off(_MediaPlayerEvents2['default'].METRIC_UPDATED, onMetricEvent, instance);
        eventBus.off(_MediaPlayerEvents2['default'].PLAYBACK_ERROR, onPlaybackError, instance);
        eventBus.off(_MetricsReportingEvents2['default'].BECAME_REPORTING_PLAYER, onBecameReporter, instance);
    }

    instance = {
        initialise: initialise,
        reset: reset
    };

    initialise();

    return instance;
}

DVBErrorsTranslator.__dashjs_factory_name = 'DVBErrorsTranslator';
exports['default'] = _coreFactoryMaker2['default'].getSingletonFactory(DVBErrorsTranslator);
module.exports = exports['default'];
//# sourceMappingURL=DVBErrorsTranslator.js.map
