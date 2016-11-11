/**
 * Created by rizhiy on 10/11/16.
 */
var manager = require('manager');
var logistics = {
    composition: [MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY],
    balance: function (creep) {
        var targets = creep.room.find(FIND_STRUCTURES, {
            filter: function (structure) {
                return (structure.structureType == STRUCTURE_TOWER ||
                structure.structureType == STRUCTURE_CONTAINER)
            }
        });
        if (targets) {
            var maxTarget = targets[0];
            var maxValue = 0;
            var minTarget = targets[0];
            var minValue = 1;
            for (var target_index in targets) {
                var target = targets[target_index];
                var fullness;
                if (target.structureType == STRUCTURE_CONTAINER) {
                    fullness = target.store.energy / target.storeCapacity;
                } else {
                    fullness = target.energy / target.energyCapacity;
                }
                if (fullness > maxValue && maxTarget.structureType == STRUCTURE_CONTAINER) {
                    maxValue = fullness;
                    maxTarget = target;
                }
                if (fullness < minValue) {
                    minValue = fullness;
                    minTarget = target;
                }
            }
            if (maxTarget != minTarget) {
                creep.memory.task = "pickup";
                creep.memory.source = maxTarget;
                creep.memory.sink = minTarget;
            }
        }
    },
    pickup: function (creep) {
        var target = Game.getObjectById(creep.memory.source.id);
        var responseCode = creep.withdraw(target, RESOURCE_ENERGY);
        if (responseCode == ERR_NOT_IN_RANGE) {
            creep.moveTo(target);
        }
        if (responseCode == ERR_INVALID_TARGET) {
            creep.memory.task = "balance";
        }
        if (responseCode == ERR_FULL) {
            creep.memory.task = "deliver";
        }
        if (responseCode == ERR_NOT_ENOUGH_RESOURCES) {
            creep.memory.task = "balance";
        }

        if (creep.carry.energy == creep.carryCapacity) {
            creep.memory.task = "deliver";
        }
    },
    deliver: function (creep) {
        if (creep.carry.energy == 0) {
            creep.memory.task = "balance";
        }
        var target = Game.getObjectById(creep.memory.sink.id);
        if (checkFull(target)) {
            creep.memory.task = "balance";
        }
        var responseCode = creep.transfer(target, RESOURCE_ENERGY);
        if (responseCode == ERR_NOT_IN_RANGE) {
            creep.moveTo(target);
        }
        if (responseCode == ERR_INVALID_TARGET) {
            creep.memory.task = "balance";
        }
        if (responseCode == ERR_FULL) {
            creep.memory.task = "balance";
        }
    },
    run: function (creep) {
        if (!creep.memory.task) {
            creep.memory.task = "balance";
        }
        if (creep.memory.task == "balance") {
            this.balance(creep);
        }
        if (creep.memory.task == "pickup") {
            this.pickup(creep);
        }
        if (creep.memory.task == "deliver") {
            this.deliver(creep);
        }
    }
};

function checkFull(structure) {
    if (structure.structureType == STRUCTURE_CONTAINER) {
        if (structure.store.energy == structure.storeCapacity) {
            return true;
        }
    } else {
        if (structure.energy == structure.energyCapacity) {
            return true;
        }
    }
    return false;
}

module.exports = logistics;