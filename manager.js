/**
 * Created by rizhiy on 10/11/16.
 */

var utilities = require('utilities');
var settings = require("settings");


var manager = {
    findFreeSources: function() {
        var freeSources = [];
        for (var source in Memory.sources) {
            var source_object = Game.getObjectById(source);
            if (manager.sourceAvailable(source_object.id) && source_object.energy > 0) {
                freeSources.push(source_object.id);
            }
        }
        return freeSources;
    },
    addSources: function (room) {
        if (!Memory.sources) {
            Memory.sources = {};
        }
        var sources = room.find(FIND_SOURCES);
        for (var source in sources) {
            var source_object = sources[source];
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
        var freeSources = this.findFreeSources();
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
        target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: function (structure) {
                return ((structure.structureType == STRUCTURE_LINK || structure.structureType == STRUCTURE_TOWER) && structure.energy < structure.energyCapacity) ||
                    ((structure.structureType == STRUCTURE_CONTAINER ||
                    structure.structureType == STRUCTURE_STORAGE) &&
                    structure.store.energy < structure.storeCapacity);
            }
        });
        if (target) {
            creep.memory.target = target;
        }

    }
    ,
    findEnergySource: function (creep) {
        var target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: function (structure) {
                return ((structure.structureType == STRUCTURE_CONTAINER || structure.structureType == STRUCTURE_STORAGE) && structure.store.energy > 0) ||
                    (structure.structureType == STRUCTURE_LINK && structure.energy > 0);
            }
        });
        creep.memory.energySource = target;
    },
    getEnergy: function (creep) {
        manager.findEnergySource(creep);
        if (creep.memory.energySource) {
            var energySource = Game.getObjectById(creep.memory.energySource.id);
            var responseCode = creep.withdraw(energySource, RESOURCE_ENERGY);
            if (responseCode == ERR_NOT_IN_RANGE) {
                creep.moveTo(energySource);
            }
            if (responseCode == ERR_NOT_ENOUGH_RESOURCES) {
                creep.memory.energySource = null;
            }
        } else {
            var responseCode;
            var target = creep.pos.findInRange(FIND_DROPPED_ENERGY, 50)[0];
            if (target) {
                responseCode = creep.pickup(target);
                if(responseCode == ERR_NOT_IN_RANGE){
                    creep.moveTo(target);
                }
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
    checkConstruction: function (roomName) {
        var target = Game.rooms[roomName].find(FIND_MY_CONSTRUCTION_SITES);
        if (target.length > utilities.countCreeps().builder * 3) {
            return true;
        } else {
            return false;
        }
    },
    getQueueLengthForSource: function (sourceId) {
        var creeps = Game.getObjectById(sourceId).room.find(FIND_MY_CREEPS);
        var count = 0;
        for (var creep_index in creeps) {
            var creep = creeps[creep_index];
            if (creep.memory.targetSource == sourceId) {
                count++;
            }
        }
        return count;
    },
    sourceQueueFull: function (sourceId) {

        return !(this.getQueueLengthForSource(sourceId) < Memory.sources[sourceId].WP);
    },
    sourceAvailable: function (sourceId) {
        var source = Game.getObjectById(sourceId);
        var workers = source.room.find(FIND_MY_CREEPS, {
            filter: function (creep) {
                return creep.memory.targetSource == sourceId;
            }
        });
        var workUnits = 0;
        for (var worker_index in workers) {
            var worker = workers[worker_index];
            workUnits += worker.getActiveBodyparts(WORK);
        }
        if (workUnits == 0 && source.energy > 0) return true;
        return source.energyCapacity / (2 * workUnits) > 300;
    },
    balanceLinks: function (roomName) {
        var room = Game.rooms[roomName];
        var links = room.find(FIND_STRUCTURES, {
            filter: {structureType: STRUCTURE_LINK}
        });

        if (links) {
            var minValue = 100000;
            var minTarget = links[0];
            var maxValue = 0;
            var maxTarget = links[0];

            for (var linkName in links) {
                var link = links[linkName];
                if (link.energy < minValue) {
                    minValue = link.energy;
                    minTarget = link;
                }
                if (link.energy > maxValue && link.cooldown == 0) {
                    maxValue = link.energy;
                    maxTarget = link;
                }
            }

            if (maxTarget != minTarget && maxValue - minValue > 1) {
                maxTarget.transferEnergy(minTarget, (maxValue - minValue) / 2);
            }
        }
    },
    renewCreep: function (creep) {
        var spawn = Game.spawns[creep.room.name];
        if (!spawn) {
            spawn = Game.spawns.Main;
        }
        var responseCode = spawn.renewCreep(creep);
        if (responseCode == ERR_NOT_IN_RANGE) {
            creep.moveTo(spawn);
        }
    },
    recycleCreep: function (creep) {
        if(creep.memory.age < 100) return;
        if (Game.time % 10) creep.memory.task = null;
        var spawn = Game.spawns[creep.room.name];
        if (!spawn) {
            spawn = Game.spawns.Main;
        }
        var responseCode = spawn.recycleCreep(creep);
        if (responseCode == ERR_NOT_IN_RANGE) {
            creep.moveTo(spawn);
        }
    }


};

module.exports = manager;