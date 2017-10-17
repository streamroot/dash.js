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
/**
 * @classdesc Matches and converts xs:string to string, but only for specific attributes on specific nodes
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _BaseMatcher2 = require('./BaseMatcher');

var _BaseMatcher3 = _interopRequireDefault(_BaseMatcher2);

var _constantsDashConstants = require('../../constants/DashConstants');

var _constantsDashConstants2 = _interopRequireDefault(_constantsDashConstants);

var StringMatcher = (function (_BaseMatcher) {
    _inherits(StringMatcher, _BaseMatcher);

    function StringMatcher() {
        _classCallCheck(this, StringMatcher);

        _get(Object.getPrototypeOf(StringMatcher.prototype), 'constructor', this).call(this, function (attr, nodeName) {
            var _stringAttrsInElements;

            var stringAttrsInElements = (_stringAttrsInElements = {}, _defineProperty(_stringAttrsInElements, _constantsDashConstants2['default'].MPD, [_constantsDashConstants2['default'].ID, _constantsDashConstants2['default'].PROFILES]), _defineProperty(_stringAttrsInElements, _constantsDashConstants2['default'].PERIOD, [_constantsDashConstants2['default'].ID]), _defineProperty(_stringAttrsInElements, _constantsDashConstants2['default'].BASE_URL, [_constantsDashConstants2['default'].SERVICE_LOCATION, _constantsDashConstants2['default'].BYTE_RANGE]), _defineProperty(_stringAttrsInElements, _constantsDashConstants2['default'].SEGMENT_BASE, [_constantsDashConstants2['default'].INDEX_RANGE]), _defineProperty(_stringAttrsInElements, _constantsDashConstants2['default'].INITIALIZATION, [_constantsDashConstants2['default'].RANGE]), _defineProperty(_stringAttrsInElements, _constantsDashConstants2['default'].REPRESENTATION_INDEX, [_constantsDashConstants2['default'].RANGE]), _defineProperty(_stringAttrsInElements, _constantsDashConstants2['default'].SEGMENT_LIST, [_constantsDashConstants2['default'].INDEX_RANGE]), _defineProperty(_stringAttrsInElements, _constantsDashConstants2['default'].BITSTREAM_SWITCHING, [_constantsDashConstants2['default'].RANGE]), _defineProperty(_stringAttrsInElements, _constantsDashConstants2['default'].SEGMENT_URL, [_constantsDashConstants2['default'].MEDIA_RANGE, _constantsDashConstants2['default'].INDEX_RANGE]), _defineProperty(_stringAttrsInElements, _constantsDashConstants2['default'].SEGMENT_TEMPLATE, [_constantsDashConstants2['default'].INDEX_RANGE, _constantsDashConstants2['default'].MEDIA, _constantsDashConstants2['default'].INDEX, _constantsDashConstants2['default'].INITIALIZATION_MINUS, _constantsDashConstants2['default'].BITSTREAM_SWITCHING_MINUS]), _defineProperty(_stringAttrsInElements, _constantsDashConstants2['default'].ASSET_IDENTIFIER, [_constantsDashConstants2['default'].VALUE, _constantsDashConstants2['default'].ID]), _defineProperty(_stringAttrsInElements, _constantsDashConstants2['default'].EVENT_STREAM, [_constantsDashConstants2['default'].VALUE]), _defineProperty(_stringAttrsInElements, _constantsDashConstants2['default'].ADAPTATION_SET, [_constantsDashConstants2['default'].PROFILES, _constantsDashConstants2['default'].MIME_TYPE, _constantsDashConstants2['default'].SEGMENT_PROFILES, _constantsDashConstants2['default'].CODECS, _constantsDashConstants2['default'].CONTENT_TYPE]), _defineProperty(_stringAttrsInElements, _constantsDashConstants2['default'].FRAME_PACKING, [_constantsDashConstants2['default'].VALUE, _constantsDashConstants2['default'].ID]), _defineProperty(_stringAttrsInElements, _constantsDashConstants2['default'].AUDIO_CHANNEL_CONFIGURATION, [_constantsDashConstants2['default'].VALUE, _constantsDashConstants2['default'].ID]), _defineProperty(_stringAttrsInElements, _constantsDashConstants2['default'].CONTENT_PROTECTION, [_constantsDashConstants2['default'].VALUE, _constantsDashConstants2['default'].ID]), _defineProperty(_stringAttrsInElements, _constantsDashConstants2['default'].ESSENTIAL_PROPERTY, [_constantsDashConstants2['default'].VALUE, _constantsDashConstants2['default'].ID]), _defineProperty(_stringAttrsInElements, _constantsDashConstants2['default'].SUPPLEMENTAL_PROPERTY, [_constantsDashConstants2['default'].VALUE, _constantsDashConstants2['default'].ID]), _defineProperty(_stringAttrsInElements, _constantsDashConstants2['default'].INBAND_EVENT_STREAM, [_constantsDashConstants2['default'].VALUE, _constantsDashConstants2['default'].ID]), _defineProperty(_stringAttrsInElements, _constantsDashConstants2['default'].ACCESSIBILITY, [_constantsDashConstants2['default'].VALUE, _constantsDashConstants2['default'].ID]), _defineProperty(_stringAttrsInElements, _constantsDashConstants2['default'].ROLE, [_constantsDashConstants2['default'].VALUE, _constantsDashConstants2['default'].ID]), _defineProperty(_stringAttrsInElements, _constantsDashConstants2['default'].RATING, [_constantsDashConstants2['default'].VALUE, _constantsDashConstants2['default'].ID]), _defineProperty(_stringAttrsInElements, _constantsDashConstants2['default'].VIEWPOINT, [_constantsDashConstants2['default'].VALUE, _constantsDashConstants2['default'].ID]), _defineProperty(_stringAttrsInElements, _constantsDashConstants2['default'].CONTENT_COMPONENT, [_constantsDashConstants2['default'].CONTENT_TYPE]), _defineProperty(_stringAttrsInElements, _constantsDashConstants2['default'].REPRESENTATION, [_constantsDashConstants2['default'].ID, _constantsDashConstants2['default'].DEPENDENCY_ID, _constantsDashConstants2['default'].MEDIA_STREAM_STRUCTURE_ID]), _defineProperty(_stringAttrsInElements, _constantsDashConstants2['default'].SUBSET, [_constantsDashConstants2['default'].ID]), _defineProperty(_stringAttrsInElements, _constantsDashConstants2['default'].METRICS, [_constantsDashConstants2['default'].METRICS_MINUS]), _defineProperty(_stringAttrsInElements, _constantsDashConstants2['default'].REPORTING, [_constantsDashConstants2['default'].VALUE, _constantsDashConstants2['default'].ID]), _stringAttrsInElements);
            if (stringAttrsInElements.hasOwnProperty(nodeName)) {
                var attrNames = stringAttrsInElements[nodeName];
                if (attrNames !== undefined) {
                    return attrNames.indexOf(attr.name) >= 0;
                } else {
                    return false;
                }
            }
            return false;
        }, function (str) {
            return String(str);
        });
    }

    return StringMatcher;
})(_BaseMatcher3['default']);

exports['default'] = StringMatcher;
module.exports = exports['default'];
//# sourceMappingURL=StringMatcher.js.map