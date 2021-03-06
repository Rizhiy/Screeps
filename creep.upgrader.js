/**
 *  Created by rizhiy on 12/11/16.
 */

var manager = require('manager');
var settings = require('settings');
var utilities = require('utilities');

var upgrader = {
    type: "upgrader",
    compositionRatio: {
        work: 4,
        move: 2,
        carry: 1
    },
    multiplierLimit: 2,
    canSpawn: function (roomName) {
        if(utilities.calculateStoredEnergy(roomName) == 0) return false;
        if (utilities.countCreepsInRoom(roomName) == 0) return true;
        return !manager.checkConstruction(roomName) &&
            utilities.calculateStoredEnergy(roomName) / utilities.countCreeps().upgrader > 2000 &&
            utilities.countCreeps().harvester != 0 && utilities.countCreeps().upgrader < utilities.countCreeps().logistics / 3;
    },
    shouldRecycle: function (creep) {
        if (creep.memory.timer < 50) {
            creep.memory.timer++;
            return false;
        }
        var roomName = creep.room.name;
        if (utilities.countCreepsInRoom(roomName) == 1) return false;
        if (utilities.calculateStoredEnergy(creep.room.name) / utilities.countCreeps().upgrader < 300) {
            return true;
        } else {
            creep.memory.timer = 0;
        }
    },
    upgrade: function (creep) {
        var responseCode = creep.upgradeController(creep.room.controller);
        if (responseCode == ERR_NOT_IN_RANGE) {
            this.move(creep,creep.room.controller);
        }
        if (responseCode == ERR_NOT_ENOUGH_RESOURCES) {
            creep.memory.task = manager.getEnergy(creep);
        }

    },
    recycle: function (creep) {
        manager.recycleCreep(creep);
    },
    run: function (creep) {
        if (this.shouldRecycle(creep)) {
            creep.memory.task = "recycle";
        }
        if (!creep.memory.task) {
            creep.memory.task = "upgrade";
        }
        if (creep.carry.energy == 0 || creep.memory.task == "getEnergy") {
            manager.getEnergy(creep);
        }

        if (creep.memory.task) {
            this[creep.memory.task](creep);
        }

    },
    move: function (creep,target) {
        creep.moveTo(target, {reusePath:1});
    },
    transfer: function (creep) {
        var destinationRoom = creep.memory.destinationRoom;
        if (!destinationRoom) {
            creep.memory.task = null;
            return;
        }
        if (creep.room.name != destinationRoom) {
            creep.moveTo(creep.pos.findClosestByPath(creep.room.findExitTo(destinationRoom)), {reusePath: 10});
        } else {
            creep.memory.destinationRoom = null;
            creep.memory.task = null;
            this.run(creep);
        }
    }
};

module.exports = upgrader;