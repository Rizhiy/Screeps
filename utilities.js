/**
 * Created by rizhiy on 11/11/16.
 */

var utilities = {
    removeFromArray: function (array, value) {
        return array.filter(function (el) {
            return el != value;
        });
    },
    moveTo: function (creep, target) {
        var containers = creep.room.find(FIND_STRUCTURES, {
            filter: function (structure) {
                if (structure.structureType == STRUCTURE_CONTAINER ||
                    structure.structureType == STRUCTURE_STORAGE) {
                    return true;
                }
            }
        });
        creep.moveTo(target, {
            reusePath: true,
            costCallback: function (room_name, costMatrix) {
                for (var container_index in containers) {
                    var container = containers[container_index];
                    costMatrix.set(containers.x, container.y, 5);
                }
                return costMatrix;
            }
        });
    },
    countCreeps: function () {
        var count = {};
        count.harvester = 0;
        count.logistics = 0;
        count.worker = 0;
        count.builder = 0;
        count.total = 0;
        for (var name in Game.creeps) {
            var creep = Game.creeps[name];
            if (creep.memory.role == "harvester") {
                count.harvester++;
            }
            if (creep.memory.role == 'logistics') {
                count.logistics++;
            }
            if (creep.memory.role == 'worker') {
                count.worker++;
            }
            if (creep.memory.role == "builder") {
                count.builder++;
            }
            count.total++;
        }
        return count;
    }
};

module.exports = utilities;