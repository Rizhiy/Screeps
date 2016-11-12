/**
 * Created by rizhiy on 11/11/16.
 */
var manager = require('manager');
var settings = require('settings');

var builder = {
    composition: [WORK, WORK, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY],
    build: function (creep) {
        var target = creep.pos.findClosestByPath(FIND_MY_CONSTRUCTION_SITES);
        if (target) {
            var responseCode = creep.build(target);
            if (responseCode == ERR_NOT_IN_RANGE) {
                creep.moveTo(target);
            }
        } else {
            creep.memory.task = "repair";
        }

    },
    repair: function (creep) {
        var target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
            filter: function (object) {
                if (object.structureType == STRUCTURE_WALL || object.structureType == STRUCTURE_RAMPART) {
                    return object.hits < settings.wallHealth;
                }
                return object.hits < object.hitsMax * 4 / 5;
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
    run: function (creep) {
        if (creep.carry.energy == 0) {
            manager.getEnergy(creep);
        }

        if (!creep.memory.task) {
            creep.memory.task = "repair";
        }
        if (creep.memory.task == "repair") {
            this.repair(creep);
        }
        if (creep.memory.task == "build") {
            this.build(creep);
        }

    }
};

module.exports = builder;