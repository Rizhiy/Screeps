/**
 * Created by rizhiy on 10/11/16.
 */
var manager = require('manager');
var utilities = require('utilities');
var logistics = {
    type: "logistics",
    compositionRatio: {
        move: 5,
        carry: 5
    },
    existenceCondition: function () {
        var sink = logistics.calculateSmallestSink(Game.spawns.Main.room.name);
        var minValue = sink.minValue;
        var origin = logistics.calculateLargestSource(Game.spawns.Main.room.name);
        var maxValue = origin.maxValue;
        var maxTarget = origin.maxTarget;
        return maxValue - minValue > 1000 && maxTarget.structureType != STRUCTURE_STORAGE  || utilities.countCreeps().logistics == 0;
    },
    balance: function (creep) {

        var sink = this.calculateSmallestSink(creep);
        var minTarget = sink.minTarget;
        var minValue = sink.minValue;
        var source = this.calculateLargestSource(creep);
        var maxTarget = source.maxTarget;
        var maxValue = source.maxValue;

        if (maxTarget != minTarget && (maxValue - minValue) / 2 > creep.carryCapacity) {
            creep.memory.task = "pickup";
            creep.memory.origin = maxTarget;
            creep.memory.sink = minTarget;
        } else {
            if (utilities.countCreeps().logistics > 2) creep.memory.task = "recycle";
        }
    },
    calculateLargestSource: function (roomName) {
        var sources = Game.rooms[roomName].find(FIND_STRUCTURES, {
            filter: function (structure) {
                return structure.structureType == STRUCTURE_CONTAINER ||
                    structure.structureType == STRUCTURE_STORAGE;
            }
        });
        var maxTarget = sources[0];
        var maxValue = 0;
        for (var sourceName in sources) {
            var source = sources[sourceName];
            var energy = utilities.getInternalEnergy(source);
            if (energy > maxValue) {
                maxValue = energy;
                maxTarget = source;
            }
        }
        return {maxTarget: maxTarget, maxValue: maxValue};
    },
    calculateClosestSource: function (creep) {
        return creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: function (structure) {
                return (structure.structureType == STRUCTURE_CONTAINER ||
                    structure.structureType == STRUCTURE_STORAGE) && structure.store.energy > 0;
            }
        });
    },
    calculateSmallestSink: function (roomName) {
        var sinks = Game.rooms[roomName].find(FIND_STRUCTURES, {
            filter: function (structure) {
                return structure.structureType == STRUCTURE_CONTAINER ||
                    structure.structureType == STRUCTURE_STORAGE ||
                    structure.structureType == STRUCTURE_TOWER ||
                    structure.structureType == STRUCTURE_EXTENSION ||
                    structure.structureType == STRUCTURE_SPAWN;
            }
        });
        var minTarget = sinks[0];
        var minValue = 10000000;
        for (var sinkName in sinks) {
            var sink = sinks[sinkName];
            var energy = utilities.getInternalEnergy(sink);
            if (energy < minValue) {
                minValue = energy;
                minTarget = sink;
            }
        }
        return {minTarget: minTarget, minValue: minValue};
    },
    calculateClosestSink: function (creep) {
        return sink = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: function (structure) {
                    return ((structure.structureType == STRUCTURE_TOWER && structure.energy < structure.energyCapacity / 2) ||
                    (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN) && structure.energy < structure.energyCapacity);
                }
            }
        );
    },
    supply: function (creep) {
        var source = this.calculateClosestSource(creep);
        var sink = this.calculateClosestSink(creep);
        if (sink && source) {
            creep.memory.task = "pickup";
            creep.memory.origin = source;
            creep.memory.sink = sink;
        } else {
            creep.memory.task = "collectDropped";
        }
    },
    pickup: function (creep) {
        var target;
        if (creep.memory.origin) {
            target = Game.getObjectById(creep.memory.origin.id);
        } else {
            creep.memory.task = null;
        }
        var responseCode;
        if (target) {
            responseCode = creep.withdraw(target, RESOURCE_ENERGY);
        }

        if (responseCode == ERR_NOT_IN_RANGE) {
            utilities.moveTo(creep, target);
        }
        if (responseCode == ERR_INVALID_TARGET) {
            creep.memory.task = null;
        }
        if (responseCode == ERR_FULL) {
            creep.memory.task = "deliver";
        }
        if (responseCode == ERR_NOT_ENOUGH_RESOURCES) {
            creep.memory.origin = this.calculateLargestSource(creep.room.name).maxTarget;
            if (utilities.getInternalEnergy(creep.memory.origin) == 0) creep.memory.task = "deliver";
        }

        if (creep.carry.energy == creep.carryCapacity) {
            creep.memory.task = "deliver";
        }
    },
    deliver: function (creep) {
        if (!creep.memory.sink) {
            creep.memory.sink = this.calculateSmallestSink(creep.room.name).minTarget;
            return;
        }
        var target = Game.getObjectById(creep.memory.sink.id);
        if (!target) {
            creep.memory.sink = null;
            creep.memory.task = null;
        }
        var responseCode = creep.transfer(target, RESOURCE_ENERGY);
        if (responseCode == ERR_NOT_IN_RANGE) {
            creep.moveTo(target);
        }
        if (responseCode == ERR_INVALID_TARGET) {
            creep.memory.sink = this.calculateClosestSink(creep);
        }
        if (responseCode == ERR_FULL) {
            creep.memory.sink = this.calculateClosestSink(creep);
        }
        if (responseCode == ERR_NOT_ENOUGH_RESOURCES) {
            creep.memory.task = null;
        }
    },
    recycle: function (creep) {
        manager.recycleCreep(creep);
    },
    collectDropped: function (creep) {
        if (creep.carry.energy == creep.carryCapacity) {
            creep.memory.sink = this.calculateClosestSink(creep);
            creep.memory.task = "deliver";
        }
        var responseCode;
        var target = creep.pos.findInRange(FIND_DROPPED_ENERGY, 50)[0];
        if (target) {
            responseCode = creep.pickup(target);
            if (responseCode == ERR_NOT_IN_RANGE) {
                creep.moveTo(target);
            }
        } else {
            creep.memory.task = "supply";
        }
    },
    run: function (creep) {
        if (!creep.memory.task) {
            creep.memory.task = "collectDropped";
        } else {
            this[creep.memory.task](creep);
        }
    }
};

module.exports = logistics;