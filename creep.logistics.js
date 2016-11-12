/**
 * Created by rizhiy on 10/11/16.
 */
var manager = require('manager');
var utilities = require('utilities');
var logistics = {
    composition: [MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY],
    balance: function (creep) {
        var targets = creep.room.find(FIND_STRUCTURES, {
            filter: function (structure) {
                return structure.structureType == STRUCTURE_CONTAINER || structure.structureType == STRUCTURE_STORAGE;
            }
        });
        if (targets) {
            var maxTarget = targets[0];
            var maxValue = 0;
            var minTarget = targets[0];
            var minValue = 10000000;
            for (var target_index in targets) {
                var target = targets[target_index];
                var fullness;
                if (target.structureType == STRUCTURE_CONTAINER || target.structureType == STRUCTURE_STORAGE) {
                    fullness = target.store.energy;
                } else {
                    fullness = target.energy;
                }

                if (fullness > maxValue && maxTarget.structureType == STRUCTURE_CONTAINER) {
                    maxValue = fullness;
                    maxTarget = target;
                }
                if (fullness < minValue) {
                    minValue = fullness;
                    minTarget = target;
                }
            }
            if (maxTarget != minTarget && (maxValue - minValue)/2 > creep.carryCapacity) {
                creep.memory.task = "pickup";
                creep.memory.source = maxTarget;
                creep.memory.sink = minTarget;
            } else {
                creep.memory.task = "wait";
            }
        }
    },
    pickup: function (creep) {
        var responseCode;
        var target = creep.pos.findInRange(FIND_DROPPED_ENERGY,5)[0];
        if(target){
            responseCode = creep.pickup(target);
        } else {
            target = Game.getObjectById(creep.memory.source.id);
            responseCode = creep.withdraw(target, RESOURCE_ENERGY);
        }
        if (responseCode == ERR_NOT_IN_RANGE) {
            utilities.moveTo(creep,target);
        }
        if (responseCode == ERR_INVALID_TARGET) {
            creep.memory.task = "balance";
        }
        if (responseCode == ERR_FULL) {
            creep.memory.task = "deliver";
        }
        if (responseCode == ERR_NOT_ENOUGH_RESOURCES) {
            creep.memory.task = "balance";
        }

        if (creep.carry.energy == creep.carryCapacity) {
            creep.memory.task = "deliver";
        }
    },
    deliver: function (creep) {
        if (creep.carry.energy == 0) {
            creep.memory.task = "balance";
        }
        if(!creep.memory.sink){
            creep.memory.task = "balance";
        }
        var target = Game.getObjectById(creep.memory.sink.id);
        if(!target){
            creep.memory.sink = null;
            creep.memory.task = "balance";
        }
        if (checkFull(target)) {
            creep.memory.task = "balance";
        }
        var responseCode = creep.transfer(target, RESOURCE_ENERGY);
        if (responseCode == ERR_NOT_IN_RANGE) {
            creep.moveTo(target);
        }
        if (responseCode == ERR_INVALID_TARGET) {
            creep.memory.task = "balance";
        }
        if (responseCode == ERR_FULL) {
            creep.memory.task = "balance";
        }
    },
    wait: function(creep){
        if(Game.time % 2 == 0){
            if(creep.memory.timer < 0){
                creep.memory.timer = 10;
            }
            if(creep.memory.timer > 0){
                creep.memory.timer -=2;
            } else {
                creep.memory.timer = -1;
                creep.memory.task = "balance";
            }
        }


    },
    run: function (creep) {
        if (!creep.memory.task) {
            creep.memory.task = "balance";
        }
        if (creep.memory.task == "balance") {
            this.balance(creep);
        }
        if (creep.memory.task == "pickup") {
            this.pickup(creep);
        }
        if (creep.memory.task == "deliver") {
            this.deliver(creep);
        }
        if(creep.memory.task == "wait"){
            this.wait(creep);
        }
    }
};

function checkFull(structure) {
    if (structure.structureType == STRUCTURE_CONTAINER) {
        if (structure.store.energy == structure.storeCapacity) {
            return true;
        }
    } else {
        if (structure.energy == structure.energyCapacity) {
            return true;
        }
    }
    return false;
}

module.exports = logistics;