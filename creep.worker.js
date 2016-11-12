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
            manager.assignSource(creep);
            var resourse = Game.getObjectById(creep.memory.targetSource);
            if (resourse) {
                if (creep.room == resourse.room) {
                    var responseCode = creep.harvest(resourse);
                    if (responseCode == ERR_NOT_IN_RANGE) {
                        creep.moveTo(resourse);
                    }
                    if (responseCode == ERR_NOT_ENOUGH_RESOURCES) {
                        creep.memory.target = null;
                        manager.assignSource(creep);
                    }
                }
            } else {
                creep.memory.task = "upgrade";
            }
        } else {
            manager.assignTarget(creep);
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
                creep.memory.task = "upgrade";
            }
        }
    },
    upgrade: function (creep) {
        var responseCode = creep.upgradeController(creep.room.controller);
        if (responseCode == ERR_NOT_IN_RANGE) {
            creep.moveTo(creep.room.controller);
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
            manager.getEnergy(creep);
        }

        if (creep.memory.task == "upgrade") {
            this.upgrade(creep);
        }
    }
};


module.exports = worker;