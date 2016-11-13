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
    calculateComposition: function (energy, creepPrototype) {
        var composition = [];
        var potentialComposition = [];
        var multiplier = 0;
        var cost = BODYPART_COST;
        var requiredEnergy = 0;
        while (requiredEnergy < energy && multiplier < 4) {
            //TODO: separate definitions into separate file
            if (multiplier > 2 && creepPrototype.type == "logistics") break;
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
                    for (var counter = 0; counter < multiplier; counter++) {
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
        Memory.compositions = {
            harvester: {},
            builder: {},
            logistics: {},
            upgrader: {}
        }
    },
    getInternalEnergy: function (structure) {
        var result = 0;
        if (structure.structureType == STRUCTURE_CONTAINER || structure.structureType == STRUCTURE_STORAGE) {
            result = structure.store.energy;
        } else {
            result = structure.energy;
        }

        return result;
    },
    getCapacity: function (structure) {
        var result = 0;
        if(structure.structureType == STRUCTURE_CONTAINER || structure.structureType == STRUCTURE_STORAGE){
            result = structure.storeCapacity;
            for(var resource_name in structure.store){
                if(resource_name != "energy"){
                    result -= structure.store[resource_name];
                }
            }
        } else {
            result = structure.energyCapacity;
        }
        return result;
    }
};

module.exports = utilities;