/**
 * Created by rizhiy on 13/11/16.
 */
var manager = require('manager');
var settings = require('settings');
var utilities = require('utilities');

var capturer = {
    type: "capturer",
    compositionRatio: {
        claim: 1,
        move: 2
    },
    canSpawn: function (roomName) {
        return Memory.roomsToClaim.length;
    },
    shouldRecycle: function (creep) {
        return false;
    },
    claimRoom: function (creep) {
        if (!creep.memory.roomToClaim) {
            manager.assignRoomToClaim(creep);
        }
        var controller = Game.rooms[creep.memory.roomToClaim].controller;
        var responseCode = creep.claimController(controller);
        if (responseCode == ERR_NOT_IN_RANGE) {
            this.move(creep, controller);
        }
        if (responseCode == ERR_FULL) {
            creep.memory.roomToClaim = null;
        }
        if (responseCode == ERR_GCL_NOT_ENOUGH) {
            creep.memory.task = "reserveRoom";
        }
    },
    reserveRoom: function (creep) {
        var controller = Game.rooms[creep.memory.roomToClaim].controller;
        var responseCode = creep.reserveController(controller);
        if (responseCode == ERR_NOT_IN_RANGE) {
            this.move(creep, controller);
        }
        if (responseCode == ERR_FULL) {
            creep.memory.roomToClaim = null;
        }
    },
    run: function (creep) {
        if (!creep.memory.task) {
            creep.memory.task = "claimRoom";
        }
        if (creep.memory.task) {
            this[creep.memory.task](creep);
        }
    },
    move: function (creep, target) {
        creep.moveTo(target, {reusePath: 10});
    }
};

module.exports = capturer;