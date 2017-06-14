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

var _coreFactoryMaker = require('../../../../core/FactoryMaker');

var _coreFactoryMaker2 = _interopRequireDefault(_coreFactoryMaker);

var _utilsHandlerHelpers = require('../../utils/HandlerHelpers');

var _utilsHandlerHelpers2 = _interopRequireDefault(_utilsHandlerHelpers);

function HttpListHandler() {

    var instance = undefined,
        reportingController = undefined,
        n = undefined,
        type = undefined,
        name = undefined,
        interval = undefined;

    var storedVos = [];

    var handlerHelpers = (0, _utilsHandlerHelpers2['default'])(this.context).getInstance();

    function intervalCallback() {
        var vos = storedVos;

        if (vos.length) {
            if (reportingController) {
                reportingController.report(name, vos);
            }
        }

        storedVos = [];
    }

    function initialize(basename, rc, n_ms, requestType) {
        if (rc) {

            // this will throw if n is invalid, to be
            // caught by the initialize caller.
            n = handlerHelpers.validateN(n_ms);

            reportingController = rc;

            if (requestType && requestType.length) {
                type = requestType;
            }

            name = handlerHelpers.reconstructFullMetricName(basename, n_ms, requestType);

            interval = setInterval(intervalCallback, n);
        }
    }

    function reset() {
        clearInterval(interval);
        interval = null;
        n = null;
        type = null;
        storedVos = [];
        reportingController = null;
    }

    function handleNewMetric(metric, vo) {
        if (metric === 'HttpList') {
            if (!type || type === vo.type) {
                storedVos.push(vo);
            }
        }
    }

    instance = {
        initialize: initialize,
        reset: reset,
        handleNewMetric: handleNewMetric
    };

    return instance;
}

HttpListHandler.__dashjs_factory_name = 'HttpListHandler';
exports['default'] = _coreFactoryMaker2['default'].getClassFactory(HttpListHandler);
module.exports = exports['default'];
//# sourceMappingURL=HttpListHandler.js.map
