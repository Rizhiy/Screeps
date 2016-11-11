/**
 * Created by rizhiy on 11/11/16.
 */

var utilities = {
    removeFromArray: function (array, value) {
        return array.filter(function (el) {
            return el != value;
        });
    },
    cleanSourceQueue: function (creep) {
        if (creep.memory.targetSource) {
            Memory.sources[creep.memory.targetSource].Workers = this.removeFromArray(Memory.sources[creep.memory.targetSource].Workers, creep.name);
            creep.memory.targetSource = null;
        }
    }
}

module.exports = utilities;