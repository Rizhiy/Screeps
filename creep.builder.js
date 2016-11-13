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
    canSpawn: function (roomName) {
        return utilities.calculateStoredEnergy(roomName) >= 2000 && manager.checkConstruction(roomName) &&
            utilities.countCreeps().harvester != 0 && utilities.countCreeps().logistics != 0 ||
            (utilities.countCreeps().builder == 0 && Game.rooms[roomName].find(FIND_MY_CONSTRUCTION_SITES).length != 0);
    },
    shouldRecycle: function (creep) {
        var roomName = creep.room.name;
        if (creep.memory.timer < 30) return false;
        else creep.memory.timer++;
        if (Game.rooms[roomName].find(FIND_MY_CONSTRUCTION_SITES).length < utilities.countCreeps().builder * 4 &&
            utilities.countCreeps().builder > 1)
            return true;
        else creep.memory.counter = 0;
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
                return object.hits < object.hitsMax * 3 / 5;
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
        if (this.shouldRecycle(creep)) {
            creep.memory.task = "recycle";
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