/**
 * Created by rizhiy on 11/11/16.
 */
var manager = require('manager');
var settings = require('settings');
var utilities = require("utilities");

var builder = {
    type: "builder",
    compositionRatio: {
        work: 2,
        move: 4,
        carry: 2
    },
    existenceCondition: function (roomName) {
        return utilities.calculateStoredEnergy(roomName) >= 2000 && manager.checkConstruction(roomName) &&
            utilities.countCreeps().harvester != 0 && utilities.countCreeps().logistics != 0;
    },
    build: function (creep) {
        var target = creep.pos.findClosestByPath(FIND_MY_CONSTRUCTION_SITES);
        if (target) {
            var responseCode = creep.build(target);
            if (responseCode == ERR_NOT_IN_RANGE) {
                creep.moveTo(target);
            }
        } else {
            creep.memory.task = "recycle";
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
    recycle: function (creep) {
        manager.recycleCreep(creep);
    },
    run: function (creep) {
        if (!this.existenceCondition(creep.room.name)) {
            creep.memory.task = "recycle";
        } else {
            creep.memory.task = creep.memory.task != "recycle" ? creep.memory.task : null;
        }
        if (creep.carry.energy == 0) {
            manager.getEnergy(creep);
            return;
        }
        if (!creep.memory.task) {
            creep.memory.task = "repair";
        } else {
            this[creep.memory.task](creep);
        }
    }
};

module.exports = builder;