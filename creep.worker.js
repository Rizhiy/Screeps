/**
 * Created by rizhiy on 10/11/16.
 */
var manager = require('manager');
var settings = require('settings');
var utilities = require('utilities');
var worker = {
    composition: [WORK, WORK, WORK, WORK, MOVE, MOVE, CARRY],
    harvest: function (creep) {
        if (creep.carry.energy < creep.carryCapacity) {
            if (creep.memory.energySource) {
                creep.memory.energySource = null;
            }
            if (!creep.memory.targetSource) {
                manager.assignSource(creep);
            }
            var resourse = Game.getObjectById(creep.memory.targetSource);
            if (resourse) {
                if (creep.room == resourse.room) {
                    var responseCode = creep.harvest(resourse);
                    if (responseCode == ERR_NOT_IN_RANGE) {
                        creep.moveTo(resourse);
                    }
                    if (responseCode == ERR_NOT_ENOUGH_RESOURCES) {
                        creep.memory.targetSource = null;
                    }
                }
            } else {
                creep.memory.task = "repair";
            }
        } else {
            if (!creep.memory.target) {
                manager.assignTarget(creep);
            }
            var target = creep.memory.target;
            if (target) {
                target = Game.getObjectById(creep.memory.target.id);
                var responseCode = creep.transfer(target, RESOURCE_ENERGY);
                if (responseCode == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target);
                }
                if (responseCode == ERR_INVALID_TARGET) {
                    manager.assignTarget(creep);
                }
                if (responseCode == ERR_FULL) {
                    manager.assignTarget(creep);
                }
            } else {
                creep.memory.task = "repair";
            }
        }
    },
    upgrade: function (creep) {
        var responseCode = creep.upgradeController(creep.room.controller);
        if (responseCode == ERR_NOT_IN_RANGE) {
            creep.moveTo(creep.room.controller);
        }
    },
    build: function (creep) {
        var target = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
        if (target) {
            var responseCode = creep.build(target);
            if (responseCode == ERR_NOT_IN_RANGE) {
                creep.moveTo(target);
            }
        } else {
            creep.memory.task = "upgrade";
        }

    },
    repair: function (creep) {
        var target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: function (object) {
                if (object.structureType == STRUCTURE_WALL) {
                    return object.hits < settings.wallHealth;
                }
                return object.hits < object.hitsMax * 2 / 3;
            }
        });
        if (target) {
            var responseCode = creep.repair(target);
            if (responseCode == ERR_NOT_IN_RANGE) {
                creep.moveTo(target);
            }
        } else {
            creep.memory.task = "build";
        }
    },
    getEnergy: function (creep) {
        manager.findEnergySource(creep);
        var energySource = creep.memory.energySource;
        if (energySource) {
            energySource = Game.getObjectById(creep.memory.energySource.id);
            var responseCode = creep.withdraw(energySource, RESOURCE_ENERGY);
            if (responseCode == ERR_NOT_IN_RANGE) {
                creep.moveTo(energySource);
            }
            if (responseCode == ERR_INVALID_TARGET) {
                manager.assignTarget(creep);
            }
            if (responseCode == ERR_NOT_ENOUGH_RESOURCES) {
                creep.memory.task = "harvest";
            }
            if (responseCode == ERR_FULL) {
                creep.memory.task = "repair";
            }
        } else {
            creep.memory.task = "harvest";
        }

        if (creep.carry.energy == creep.carryCapacity) {
            creep.memory.task = "repair";
        }
    },
    run: function (creep) {
        if (!creep.memory.task) {
            creep.memory.task = "harvest";
        }
        if (creep.memory.task == "harvest") {
            this.harvest(creep);
        } else {
            creep.memory.targetSource = null;
        }

        if (creep.carry.energy == 0 && creep.memory.task != "harvest" || creep.memory.task == "getEnergy") {
            this.getEnergy(creep);
        }

        if (creep.memory.task == "upgrade") {
            this.upgrade(creep);
        }
        if (creep.memory.task == "build") {
            this.build(creep);
        }
        if (creep.memory.task == "repair") {
            this.repair(creep);
        }
    }
};


module.exports = worker;