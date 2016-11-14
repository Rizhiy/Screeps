/**
 * Created by rizhiy on 11/11/16.
 */

var settings = require("settings");

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
        count.harvester = 0;
        count.builder = 0;
        count.upgrader = 0;
        count.total = 0;
        for (var name in Game.creeps) {
            var creep = Game.creeps[name];
            if (creep.memory.role) {
                count[creep.memory.role]++;
            }
            count.total++;
        }
        return count;
    },
    countCreepsInRoom: function (roomName) {
        var count = {};
        count.total = 0;
        for (var creepType_index in settings.creepTypes) {
            count[settings.creepTypes[creepType_index]] = 0;
        }
        for (var creepName in Game.creeps) {
            var creep = Game.creeps[creepName];
            if (creep.memory.role && creep.room.name == roomName) {
                count[creep.memory.role]++;
                count.total++;
            }
        }
        return count;
    },
    calculateComposition: function (roomName, creepPrototype) {
        var energy = this.calculateSpawnEnergy(roomName);
        var composition = [];
        var potentialComposition = [];
        var multiplier = 0;
        var cost = BODYPART_COST;
        var requiredEnergy = 0;
        while (requiredEnergy < energy && multiplier <= creepPrototype.multiplierLimit) {
            //TODO: separate definitions into separate file
            if (creepPrototype.type == "logistics" && multiplier > this.getMaxCreepLevel(roomName, "harvester")) break;
            composition = potentialComposition;
            potentialComposition = [];
            if (multiplier == 0) {
                composition = ["move", "carry", "work"];
                if (creepPrototype.type == "logistics") composition.splice(-1);
                potentialComposition = composition;
            } else {
                if (Memory.compositions[creepPrototype.type][multiplier]) {
                    potentialComposition = Memory.compositions[creepPrototype.type][multiplier];
                } else {
                    for (var counter = 0; counter <= multiplier; counter++) {
                        for (part in creepPrototype.compositionRatio) {
                            for (var i = 0; i < creepPrototype.compositionRatio[part]; i++) {
                                potentialComposition.push(part);
                            }
                        }
                    }
                    Memory.compositions[creepPrototype.type][multiplier] = potentialComposition;
                }
            }
            requiredEnergy = 0;
            for (var part in potentialComposition) {
                requiredEnergy += cost[potentialComposition[part]];
            }
            multiplier++;
        }
        return {
            composition: composition,
            level: multiplier - 1
        };

    },
    calculateStoredEnergy: function (roomName) {
        var storage = Game.rooms[roomName].find(FIND_STRUCTURES, {
            filter: function (structure) {
                if (structure.structureType == STRUCTURE_CONTAINER || structure.structureType == STRUCTURE_STORAGE) {
                    return true;
                }
            }
        });
        var totalEnergy = 0;
        for (var container_index in storage) {
            totalEnergy += storage[container_index].store.energy;
        }

        return totalEnergy;
    },
    calculateSpawnEnergy: function (roomName) {
        var extensions = Game.rooms[roomName].find(FIND_STRUCTURES, {
            filter: function (structure) {
                return structure.structureType == STRUCTURE_SPAWN || structure.structureType == STRUCTURE_EXTENSION;
            }
        });
        var totalEnergy = 0;
        for (var extensionIndex in extensions) {
            totalEnergy += extensions[extensionIndex].energyCapacity;
        }

        return totalEnergy;
    },
    init: function () {
        if (!Memory.usedRooms) {
            Memory.usedRooms = [Game.spawns.Main.room.name];
        }
        for (var spawnName in Game.spawns) {
            var roomName = Game.spawns[spawnName].room.name;
            if (!Memory.usedRooms.includes(roomName)) {
                Memory.usedRooms.push(roomName);
            }
        }
        Memory.sources = {};
        for (var roomName_index in Memory.usedRooms) {
            if(Game.rooms[Memory.usedRooms[roomName_index]]){
                this.addSources(Memory.usedRooms[roomName_index]);
            }
        }
        for (var creepType_index in settings.creepTypes) {
            Memory.compositions[settings.creepTypes[creepType_index]] = {}
        }
    },
    getInternalEnergy: function (structure) {
        var result = 0;
        if (!structure) return;
        if (structure.structureType == STRUCTURE_CONTAINER || structure.structureType == STRUCTURE_STORAGE) {
            result = structure.store.energy;
        } else {
            result = structure.energy;
        }

        return result;
    },
    getCapacity: function (structure) {
        var result = 0;
        if (structure.structureType == STRUCTURE_CONTAINER || structure.structureType == STRUCTURE_STORAGE) {
            result = structure.storeCapacity;
            for (var resource_name in structure.store) {
                if (resource_name != "energy") {
                    result -= structure.store[resource_name];
                }
            }
        } else {
            result = structure.energyCapacity;
        }
        return result;
    },
    getMaxCreepLevel: function (roomName, creepType) {
        var room = Game.rooms[roomName];
        var creeps = room.find(FIND_MY_CREEPS);
        var maxLevel = 0;
        for (var creep_index in creeps) {
            var creep = creeps[creep_index];
            if (creep.memory.role == creepType && creep.memory.level > maxLevel) {
                maxLevel = creep.memory.level;
            }
        }
        return maxLevel;
    },
    addSources: function (roomName) {
        var room = Game.rooms[roomName];
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
}

module.exports = utilities;