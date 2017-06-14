'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _coreFactoryMakerJs = require('../../core/FactoryMaker.js');

var _coreFactoryMakerJs2 = _interopRequireDefault(_coreFactoryMakerJs);

function DroppedFramesHistory() {

    var values = [];
    var lastDroppedFrames = 0;
    var lastTotalFrames = 0;

    function push(index, playbackQuality) {
        var intervalDroppedFrames = playbackQuality.droppedVideoFrames - lastDroppedFrames;
        lastDroppedFrames = playbackQuality.droppedVideoFrames;

        var intervalTotalFrames = playbackQuality.totalVideoFrames - lastTotalFrames;
        lastTotalFrames = playbackQuality.totalVideoFrames;

        if (!values[index]) {
            values[index] = { droppedVideoFrames: intervalDroppedFrames, totalVideoFrames: intervalTotalFrames };
        } else {
            values[index].droppedVideoFrames += intervalDroppedFrames;
            values[index].totalVideoFrames += intervalTotalFrames;
        }
    }

    function getDroppedFrameHistory() {
        return values;
    }

    function reset(playbackQuality) {
        values = [];
        lastDroppedFrames = playbackQuality.droppedVideoFrames;
        lastTotalFrames = playbackQuality.totalVideoFrames;
    }

    return {
        push: push,
        getFrameHistory: getDroppedFrameHistory,
        reset: reset
    };
}

DroppedFramesHistory.__dashjs_factory_name = 'DroppedFramesHistory';
var factory = _coreFactoryMakerJs2['default'].getClassFactory(DroppedFramesHistory);
exports['default'] = factory;
module.exports = exports['default'];
//# sourceMappingURL=DroppedFramesHistory.js.map
