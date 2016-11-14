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
        move: 2,
        carry: 2
    },
    multiplierLimit: 4,
    canSpawn: function (roomName) {
        // if (roomName == "W8N3" && manager.getAllConstructionSites().length > utilities.countCreeps().builder * 4) return true;
        return utilities.calculateStoredEnergy(roomName) >= 2000 &&
            (manager.checkConstruction(roomName) || manager.getAllConstructionSites().length > utilities.countCreeps().builder * 4) &&
            utilities.countCreeps().harvester != 0 && utilities.countCreeps().logistics != 0 ||
            (utilities.countCreeps().builder == 0 && Game.rooms[roomName].find(FIND_MY_CONSTRUCTION_SITES).length != 0);
    },
    shouldRecycle: function (creep) {
        if (roomName == "W8N3" && manager.getAllConstructionSites().length > utilities.countCreeps().builder * 4) return false;
        var roomName = creep.room.name;
        if (creep.memory.timer < 30) return false;
        else creep.memory.timer++;
        if (Game.rooms[roomName].find(FIND_MY_CONSTRUCTION_SITES).length < utilities.countCreeps().builder * 2 &&
            utilities.countCreeps().builder > 1)
            return true;
        else creep.memory.counter = 0;
    },
    build: function (creep) {
        var target = creep.pos.findClosestByPath(FIND_MY_CONSTRUCTION_SITES);
        if (target) {
            var responseCode = creep.build(target);
            if (responseCode == ERR_NOT_IN_RANGE) {
                this.move(creep, target);
            }
        } else {
            var constructionSite = manager.getAllConstructionSites()[0];
            if (constructionSite.room.name != creep.room.name) {
                creep.memory.destinationRoom = constructionSite.room.name;
                creep.memory.subtask = "transfer";
            }
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
                this.move(creep, target);
            }
        } else {
            creep.memory.task = "build";
        }
    },
    recycle: function (creep) {
        manager.recycleCreep(creep);
    },
    run: function (creep) {
        if (this.shouldRecycle(creep) && !creep.memory.destinationRoom) {
            creep.memory.task = "recycle";
        }
        if (creep.carry.energy == 0 && creep.memory.task != "transfer") {
            manager.getEnergy(creep);
            return;
        }
        if (!creep.memory.task && !creep.memory.subtask) {
            creep.memory.task = "repair";
        }

        if (creep.memory.subtask) {
            this[creep.memory.subtask](creep);
        } else {
            this[creep.memory.task](creep);
        }
    },
    move: function (creep, target) {
        creep.moveTo(target, {reusePath: 2});
    },
    transfer: function (creep) {
        var destinationRoom = creep.memory.destinationRoom;
        if (!destinationRoom) {
            creep.memory.subtask = null;
            return;
        }
        if (creep.room.name != destinationRoom) {
            creep.moveTo(creep.pos.findClosestByPath(creep.room.findExitTo(destinationRoom)), {reusePath: 10});
        } else {
            creep.memory.destinationRoom = null;
            creep.memory.subtask = null;
            this.run(creep);
        }
    }
};

module.exports = builder;