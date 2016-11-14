/**
 * Created by rizhiy on 10/11/16.
 */
var manager = require("manager");
var utilities = require("utilities");
var settings = require("settings");
var logistics = {
    type: "logistics",
    compositionRatio: {
        move: 2,
        carry: 2
    },
    multiplierLimit: 2,
    canSpawn: function (roomName) {
        var sink = Game.getObjectById(this.calculateSmallestSink(roomName));
        var source = Game.getObjectById(this.calculateLargestSource(roomName));
        return utilities.getInternalEnergy(source) - utilities.getInternalEnergy(sink) > 1000 &&
            (source.structureType != STRUCTURE_STORAGE || utilities.getInternalEnergy(sink) < utilities.getCapacity(sink) * 0.8) &&
            utilities.countCreepsInRoom(roomName).harvester != 0 ||
            utilities.countCreeps().logistics == 0;
    },
    shouldRecycle: function (creep) {
        var roomName = creep.room.name;
        var sink = Game.getObjectById(this.calculateSmallestSink(roomName));
        var source = Game.getObjectById(this.calculateLargestSource(roomName));
        return utilities.getInternalEnergy(source) - utilities.getInternalEnergy(sink) < creep.carryCapacity &&
            utilities.countCreeps().logistics > 3;
    },
    balance: function (creep) {
        var source = Game.getObjectById(this.calculateLargestSource(creep.room.name));
        var sink = Game.getObjectById(this.checkClosestLink(creep));
        if (!(utilities.getInternalEnergy(source) - utilities.getInternalEnergy(sink) > 0)) {
            sink = Game.getObjectById(this.calculateSmallestSink(creep.room.name));
        }

        if (utilities.getInternalEnergy(source) - utilities.getInternalEnergy(sink) > creep.carryCapacity * 2 &&
            utilities.getInternalEnergy(sink) < utilities.getCapacity(sink) * 4 / 5) {
            creep.memory.source = source.id;
            creep.memory.sink = sink.id;
            if (creep.carry.energy > 0) {
                creep.memory.subtask = "deliver";
            } else {
                creep.memory.subtask = "pickup";
            }
        } else {
            creep.memory.task = null;
            creep.memory.subtask = null;
        }
    },
    supply: function (creep) {
        var sink = Game.getObjectById(this.calculateClosestSink(creep));
        var source = Game.getObjectById(this.calculateClosestSource(creep));

        if (sink && source) {
            creep.memory.source = source.id;
            creep.memory.sink = sink.id;
            if (creep.carry.energy > 0) {
                creep.memory.subtask = "deliver";
            } else {
                creep.memory.subtask = "pickup";
            }
        } else {
            creep.memory.subtask = null;
            creep.memory.task = null;
        }
    },
    collectDropped: function (creep) {
        if (creep.carry.energy == creep.carryCapacity) {
            var sink = this.calculateClosestSink(creep);
            if (!sink) {
                sink = this.calculateSmallestSink(creep.room.name);
            }
            creep.memory.sink = sink;
            creep.memory.subtask = "deliver";
            return;
        }
        var responseCode;
        var target = creep.pos.findInRange(FIND_DROPPED_ENERGY, 25)[0];
        if (target) {
            responseCode = creep.pickup(target);
            if (responseCode == ERR_NOT_IN_RANGE) {
                this.move(creep, target);
            }
        } else {
            creep.memory.subtask = null;
            if (creep.room.energyAvailable < creep.room.energyCapacityAvailable * 0.8) {
                creep.memory.task = "supply";
            } else {
                creep.memory.task = "balance";
            }
        }
    },
    recycle: function (creep) {
        manager.recycleCreep(creep);
    },
    pickup: function (creep) {
        var target = Game.getObjectById(creep.memory.source);
        if (!target) {
            creep.memory.subtask = null;
            return;
        }
        var responseCode = creep.withdraw(target, RESOURCE_ENERGY);
        if (responseCode == ERR_NOT_IN_RANGE) {
            this.move(creep, target);
        }
        if (responseCode == ERR_INVALID_TARGET) {
            creep.memory.subtask = null;
        }
        if (responseCode == ERR_FULL) {
            creep.memory.subtask = null;
        }
        if (responseCode == ERR_NOT_ENOUGH_RESOURCES) {
            creep.memory.subtask = null;
        }
    },
    deliver: function (creep) {
        var target = Game.getObjectById(creep.memory.sink);
        if (!target) {
            creep.memory.subtask = null;
            return;
        }
        var responseCode = creep.transfer(target, RESOURCE_ENERGY);
        if (responseCode == ERR_NOT_IN_RANGE) {
            this.move(creep, target);
            return;
        }
        if (responseCode == ERR_INVALID_TARGET) {
            creep.memory.subtask = null;
        }
        if (responseCode == ERR_FULL) {
            creep.memory.subtask = null;
        }
        if (responseCode == ERR_NOT_ENOUGH_RESOURCES) {
            creep.memory.subtask = null;
        }
    },
    run: function (creep) {
        //clear subtask to re-evaluate
        if ((Game.time + creep.name ) % 5 == 0) {
            creep.subtask = null;
        }
        if (this.shouldRecycle(creep)) {
            creep.memory.subtask = null;
            creep.memory.task = "recycle";
        }
        if (!creep.memory.task) {
            creep.memory.task = "collectDropped";
        }
        if (creep.memory.subtask) {
            this[creep.memory.subtask](creep);
        } else {
            this[creep.memory.task](creep);
        }
    },
    checkClosestLink: function (creep) {
        var link = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: {structureType: STRUCTURE_LINK}
        });
        if (link.energy < link.energyCapacity) {
            return link.id
        }
    },
    calculateSmallestSink: function (roomName) {
        var sinks = Game.rooms[roomName].find(FIND_STRUCTURES, {
            filter: function (structure) {
                return (structure.structureType == STRUCTURE_CONTAINER ||
                    structure.structureType == STRUCTURE_STORAGE ||
                    structure.structureType == STRUCTURE_LINK ||
                    structure.structureType == STRUCTURE_EXTENSION ||
                    structure.structureType == STRUCTURE_SPAWN) &&
                    utilities.getInternalEnergy(structure) < utilities.getCapacity(structure);
            }
        });
        if (sinks[0]) {
            var minTarget = sinks[0];
            var minValue = utilities.getInternalEnergy(sinks[0]);
            for (var sinkName in sinks) {
                var sink = sinks[sinkName];
                var energy = utilities.getInternalEnergy(sink);
                if (energy < minValue) {
                    minValue = energy;
                    minTarget = sink;
                }
            }
            return minTarget.id;
        }
    },
    calculateLargestSource: function (roomName) {
        var sources = Game.rooms[roomName].find(FIND_STRUCTURES, {
            filter: function (structure) {
                return (structure.structureType == STRUCTURE_CONTAINER ||
                    structure.structureType == STRUCTURE_STORAGE) && utilities.getInternalEnergy(structure) > 0;
            }
        });
        if (sources) {
            var maxTarget = sources[0];
            //ATTENTION: this check is here on purpose as there was a bug in their code at some point
            if (maxTarget) {
                var maxValue = utilities.getInternalEnergy(sources[0]);
                for (var sourceName in sources) {
                    var source = sources[sourceName];
                    var energy = utilities.getInternalEnergy(source);
                    if (energy > maxValue) {
                        maxValue = energy;
                        maxTarget = source;
                    }
                }
                return maxTarget.id;
            }
        }
    },
    calculateClosestSink: function (creep) {
        var sink;
        if (utilities.countCreeps().logistics < 2 || utilities.countCreeps().harvester < 2) {
            sink = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: function (structure) {
                    return (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN) &&
                        utilities.getInternalEnergy(structure) < utilities.getCapacity(structure);
                }
            });
            if (!sink) {
                sink = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                    filter: function (structure) {
                        return (structure.structureType == STRUCTURE_TOWER && structure.energy < structure.energyCapacity * settings.towerEnergy) ||
                            (structure.structureType == STRUCTURE_LINK && utilities.getInternalEnergy(structure) < utilities.getCapacity(structure));
                    }
                });
            }
        } else {
            sink = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: function (structure) {
                    return ((structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN) &&
                        utilities.getInternalEnergy(structure) < utilities.getCapacity(structure)) ||
                        (structure.structureType == STRUCTURE_TOWER && structure.energy < structure.energyCapacity * settings.towerEnergy) ||
                        (structure.structureType == STRUCTURE_LINK && utilities.getInternalEnergy(structure) < utilities.getCapacity(structure));
                }
            });
        }
        if (sink) {
            return sink.id;
        }
    },
    calculateClosestSource: function (creep) {
        var source = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: function (structure) {
                return (structure.structureType == STRUCTURE_CONTAINER ||
                    structure.structureType == STRUCTURE_STORAGE) && structure.store.energy > 0;
            }
        });

        if (source) return source.id;
    },
    move: function (creep, target) {
        creep.moveTo(target)
    },
    transfer: function (creep) {
        var destinationRoom = creep.memory.destinationRoom;
        if (!destinationRoom) {
            creep.memory.task = null;
            return;
        }
        if (creep.room.name != destinationRoom) {
            creep.moveTo(creep.pos.findClosestByPath(creep.room.findExitTo(destinationRoom)), {reusePath: 10});
        } else {
            creep.memory.destinationRoom = null;
            creep.memory.task = null;
            this.run(creep);
        }
    }
};

module.exports = logistics;