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
    multiplierLimit: 2,
    canSpawn: function (roomName) {
        return Memory.roomsToClaim;
    },
    shouldRecycle: function (creep) {
        return !Memory.roomsToClaim;
    },
    claimRoom: function (creep) {
        var roomToClaim = creep.memory.roomToClaim;
        if (!roomToClaim) {
            manager.assignRoomToClaim(creep);
        }
        if(creep.room.name != roomToClaim){
            this.move(creep,creep.pos.findClosestByPath(creep.room.findExitTo(roomToClaim)));
            return;
        }
        var controller = Game.rooms[creep.memory.roomToClaim].controller;
        if(controller.my){
            var index = Memory.roomsToClaim.indexOf(creep.memory.roomToClaim);
            if(index > -1){
                Memory.roomsToClaim = Memory.roomsToClaim.splice(index,1);
            }
            creep.memory.task = "recycle";
        }
        var responseCode = creep.claimController(controller);
        if (responseCode == ERR_NOT_IN_RANGE) {
            this.move(creep, controller);
        }
        if (responseCode == ERR_FULL) {
            creep.memory.roomToClaim = null;
        }
        if (responseCode == ERR_GCL_NOT_ENOUGH && !controller.my) {
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
    recycle: function (creep) {
        manager.recycleCreep(creep);
    },
    run: function (creep) {
        if(!this.shouldRecycle(creep)){
            creep.memory.task = "recycle";
        }
        if(!creep.memory.roomToClaim){
            creep.memory.roomToClaim = Memory.roomsToClaim[0];
        }
        if (!creep.memory.task) {
            creep.memory.task = "claimRoom";
        }
        if (creep.memory.task) {
            this[creep.memory.task](creep);
        }
    },
    move: function (creep, target) {
        if(creep.pos.lookFor(LOOK_CONSTRUCTION_SITES) == ""){
            creep.room.createConstructionSite(creep.pos,STRUCTURE_ROAD);
            if(!Memory.usedRooms.includes(creep.room.name)){
                Memory.usedRooms.push(creep.room.name);
            }
        }
        creep.moveTo(target, {reusePath: 10});
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

module.exports = capturer;