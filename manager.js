/**
 * Created by rizhiy on 10/11/16.
 */

var utilities = require('utilities');
var settings = require("settings");
function findFreeSources() {
    var freeSources = [];
    for (var source in Memory.sources) {
        var source_object = Memory.sources[source];
        if (manager.sourceAvailable(source_object) && source_object.energy > 0) {
            freeSources.push(source_object.id);
        }
    }
    return freeSources;
}

var manager = {
    addSources: function (room) {
        if (!Memory.sources) {
            Memory.sources = {};
        }
        var sources = room.find(FIND_SOURCES);
        for (var source in sources) {
            var source_object = sources[source];
            Memory.sources[source_object.id] = source_object;
            Memory.sources[source_object.id].WP = 0;
            Memory.sources[source_object.id].lastEmptyTime = Game.time - 300;
            for (var i = -1; i < 2; i++) {
                for (var j = -1; j < 2; j++) {
                    if (Game.map.getTerrainAt(source_object.pos.x + i, source_object.pos.y + j, source_object.room.name) != "wall") {
                        Memory.sources[source_object.id].WP++;
                    }
                }
            }
        }
    },
    assignSource: function (creep) {
        creep.memory.targetSource = null;
        var freeSources = findFreeSources();
        var closestSource;
        var shortestRoute;
        for (var source in freeSources) {
            var source_object = Game.getObjectById(freeSources[source]);
            var route = Game.map.findRoute(creep.room, source_object.room);
            if (!closestSource) {
                closestSource = source_object;
            }
            if (!shortestRoute) {
                shortestRoute = route;
            }
            if (route.length < shortestRoute.length) {
                closestSource = source_object;
                shortestRoute = route;
            }
            if (shortestRoute.length == 0) {
                if (creep.pos.findPathTo(source_object) < creep.pos.findPathTo(closestSource)) {
                    closestSource = source_object;
                    shortestRoute = route;
                }
            }
        }
        if (closestSource) {
            creep.memory.targetSource = closestSource.id;
        }
    },
    assignTarget: function (creep) {
        creep.memory.target = null;
        var target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: function (structure) {
                return ((structure.structureType == STRUCTURE_EXTENSION ||
                structure.structureType == STRUCTURE_SPAWN ||
                structure.structureType == STRUCTURE_TOWER) && structure.energy < structure.energyCapacity);
            }
        });
        if (target) {
            creep.memory.target = target;
            return;
        } else {
            target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: function (structure) {
                    return ((structure.structureType == STRUCTURE_CONTAINER ||
                    structure.structureType == STRUCTURE_STORAGE) &&
                    structure.store.energy < structure.storeCapacity);
                }
            });
        }
        if (target) {
            creep.memory.target = target;
        }

    }
    ,
    findEnergySource: function (creep) {
        var target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: function (structure) {
                return (structure.structureType == STRUCTURE_CONTAINER && structure.store.energy > 0);
            }
        });
        if (target) {
            creep.memory.energySource = target;
        }
    },
    getEnergy: function (creep) {
        manager.findEnergySource(creep);
        if (creep.memory.energySource) {
            var energySource = Game.getObjectById(creep.memory.energySource.id);
            var responseCode = creep.withdraw(energySource, RESOURCE_ENERGY);
            if (responseCode == ERR_NOT_IN_RANGE) {
                creep.moveTo(energySource);
            }

        }
    },
    checkBuildings: function (spawn) {
        var target = spawn.room.find(FIND_MY_STRUCTURES, {
            filter: function (object) {
                if (object.structureType == STRUCTURE_WALL || object.structureType == STRUCTURE_RAMPART) {
                    return object.hits < settings.wallHealth;
                }
                return object.hits < object.hitsMax * 3 / 5;
            }
        });
        if (target.length) {
            return true;
        } else {
            return false;
        }
    },
    checkConstruction: function (spawn) {
        var target = spawn.room.find(FIND_MY_CONSTRUCTION_SITES);
        if (target.length > utilities.countCreeps().builder * 3) {
            return true;
        } else {
            return false;
        }
    },
    getQueueLengthForSource: function (source) {
        var creeps = Game.rooms[source.room.name].find(FIND_MY_CREEPS);
        var count = 0;
        for (var creep_index in creeps) {
            var creep = creeps[creep_index];
            if (creep.memory.targetSource == source.id) {
                count++;
            }
        }
        return count;
    },
    sourceQueueFull: function (source) {
        return !(this.getQueueLengthForSource(source) < source.WP);
    },
    sourceAvailable: function (source) {
        return !this.sourceQueueFull(source) && source.energy > 0;
    }
};

module.exports = manager;