/**
 * Created by rizhiy on 10/11/16.
 */
var manager = require('manager');
var settings = require('settings');
var utilities = require('utilities');
var harvester = {
    type: "harvester",
    compositionRatio: {
        work: 4,
        move: 2,
        carry: 1
    },
    canSpawn: function (roomName) {
        var freeSources = manager.findFreeSources();
        var closestSource;
        var shortestRoute;
        for (var source in freeSources) {
            var source_object = Game.getObjectById(freeSources[source]);
            var route = Game.map.findRoute(Game.rooms[roomName], source_object.room);
            if (!closestSource) {
                closestSource = source_object;
            }
            if (!shortestRoute) {
                shortestRoute = route;
            }
            if (route.length < shortestRoute.length) {
                closestSource = source_object;
                shortestRoute = route;
            }
            if (shortestRoute.length == 0) {
                if ((new RoomPosition(25, 25, roomName)).findPathTo(source_object) < (new RoomPosition(25, 25, roomName)).findPathTo(closestSource)) {
                    closestSource = source_object;
                    shortestRoute = route;
                }
            }
        }
        return closestSource;
    },
    harvest: function (creep) {
        if (creep.carry.energy < creep.carryCapacity) {
            if (creep.memory.energySource) {
                creep.memory.energySource = null;
            }
            manager.assignSource(creep);
            var resourse = Game.getObjectById(creep.memory.targetSource);
            if (resourse) {
                creep.memory.timer = 0;
                if (creep.room == resourse.room) {
                    var responseCode = creep.harvest(resourse);
                    if (responseCode == ERR_NOT_IN_RANGE) {
                        this.move(creep,resourse);
                    }
                    if (responseCode == ERR_NOT_ENOUGH_RESOURCES) {
                        creep.memory.target = null;
                        manager.assignSource(creep);
                    }
                }
            } else {
                if(creep.memory.timer > 300) creep.memory.task = "recycle";
                creep.memory.timer++;
            }
        } else {
            creep.memory.task = "deliver";
        }
    },
    deliver: function (creep) {
        manager.assignTarget(creep);
        var target = creep.memory.target;
        target = Game.getObjectById(creep.memory.target.id);
        var responseCode = creep.transfer(target, RESOURCE_ENERGY);
        if (responseCode == ERR_NOT_IN_RANGE) {
            this.move(creep,target);
        }
        if (responseCode == ERR_INVALID_TARGET) {
            manager.assignTarget(creep);
        }
        if (responseCode == ERR_FULL) {
            manager.assignTarget(creep);
        }
        if (!responseCode) {
            creep.memory.task = "harvest";
        }
    },
    recycle: function (creep) {
        manager.recycleCreep(creep);
    },
    run: function (creep) {
        if (!creep.memory.task) {
            creep.memory.task = "harvest";
        }
        if (creep.memory.task == "harvest") {
            this.harvest(creep);
        } else if (creep.memory.task != "deliver") {
            creep.memory.targetSource = null;
        }

        if (creep.carry.energy == 0 && creep.memory.task != "harvest" || creep.memory.task == "getEnergy") {
            manager.getEnergy(creep);
        }

        if (creep.memory.task) {
            this[creep.memory.task](creep);
        }
    },
    move: function (creep,target) {
        creep.moveTo(target,{reusePath:1});
    }
};


module.exports = harvester;