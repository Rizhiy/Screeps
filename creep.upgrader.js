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
    existenceCondition: function (roomName) {
        return !manager.checkConstruction(roomName) &&
            utilities.calculateStoredEnergy(Game.spawns.Main.room.name) / utilities.countCreeps().upgrader > 1000 &&
            utilities.countCreeps().harvester != 0 && utilities.countCreeps().logistics != 0;
    },
    upgrade: function (creep) {
        var responseCode = creep.upgradeController(creep.room.controller);
        if (responseCode == ERR_NOT_IN_RANGE) {
            creep.moveTo(creep.room.controller);
        }
        if (responseCode == ERR_NOT_ENOUGH_RESOURCES) {
            creep.memory.task = manager.getEnergy(creep);
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
        if (!creep.memory.task) {
            creep.memory.task = "upgrade";
        }
        if (creep.carry.energy == 0 || creep.memory.task == "getEnergy") {
            manager.getEnergy(creep);
        }

        if (creep.memory.task) {
            this[creep.memory.task](creep);
        }

    }
};

module.exports = upgrader;