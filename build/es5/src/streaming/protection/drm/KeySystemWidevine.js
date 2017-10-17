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
 * Google Widevine DRM
 *
 * @class
 * @implements MediaPlayer.dependencies.protection.KeySystem
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _CommonEncryption = require('../CommonEncryption');

var _CommonEncryption2 = _interopRequireDefault(_CommonEncryption);

var _coreFactoryMaker = require('../../../core/FactoryMaker');

var _coreFactoryMaker2 = _interopRequireDefault(_coreFactoryMaker);

var _externalsBase64 = require('../../../../externals/base64');

var _externalsBase642 = _interopRequireDefault(_externalsBase64);

var uuid = 'edef8ba9-79d6-4ace-a3c8-27dcd51d21ed';
var systemString = 'com.widevine.alpha';
var schemeIdURI = 'urn:uuid:' + uuid;

function KeySystemWidevine() {

    var instance = undefined;
    var protData = null;

    function init(protectionData) {
        if (protectionData) {
            protData = protectionData;
        }
    }

    function replaceKID(pssh, KID) {
        var pssh_array = undefined;
        var replace = true;
        var kidLen = 16;
        var pos = undefined;
        var i = undefined,
            j = undefined;

        pssh_array = new Uint8Array(pssh);

        for (i = 0; i <= pssh_array.length - (kidLen + 2); i++) {
            if (pssh_array[i] === 0x12 && pssh_array[i + 1] === 0x10) {
                pos = i + 2;
                for (j = pos; j < pos + kidLen; j++) {
                    if (pssh_array[j] !== 0xFF) {
                        replace = false;
                        break;
                    }
                }
                break;
            }
        }

        if (replace) {
            pssh_array.set(KID, pos);
        }

        return pssh_array.buffer;
    }

    function getInitData(cp) {
        var pssh = null;
        // Get pssh from protectionData or from manifest
        if (protData && protData.pssh) {
            pssh = _externalsBase642['default'].decodeArray(protData.pssh).buffer;
        } else {
            pssh = _CommonEncryption2['default'].parseInitDataFromContentProtection(cp);
        }

        // Check if KID within pssh is empty, in that case set KID value according to 'cenc:default_KID' value
        if (pssh) {
            pssh = replaceKID(pssh, cp['cenc:default_KID']);
        }

        return pssh;
    }

    function getRequestHeadersFromMessage() /*message*/{
        return null;
    }

    function getLicenseRequestFromMessage(message) {
        return new Uint8Array(message);
    }

    function getLicenseServerURLFromInitData() /*initData*/{
        return null;
    }

    instance = {
        uuid: uuid,
        schemeIdURI: schemeIdURI,
        systemString: systemString,
        init: init,
        getInitData: getInitData,
        getRequestHeadersFromMessage: getRequestHeadersFromMessage,
        getLicenseRequestFromMessage: getLicenseRequestFromMessage,
        getLicenseServerURLFromInitData: getLicenseServerURLFromInitData
    };

    return instance;
}

KeySystemWidevine.__dashjs_factory_name = 'KeySystemWidevine';
exports['default'] = _coreFactoryMaker2['default'].getSingletonFactory(KeySystemWidevine);
module.exports = exports['default'];
//# sourceMappingURL=KeySystemWidevine.js.map