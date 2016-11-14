var utilities = require("utilities");
var manager = require("manager");
var settings = require("settings");

harvester = require("creep.harvester");
logistics = require("creep.logistics");
builder = require("creep.builder");

var lastCreepGenerated2 = null;
var lastCreepGenerated = null;
var spawn = {
    createCreeps: function (spawn_object) {
        if (Game.time % 3 == 0) {
            createCreep(spawn_object);
        }
    },
    generateNewCreepName: function () {
        return Math.random().toString().slice(2, 7);
    },
    createExternalCreeps: function (spawn_object) {
        for (var roomName_index in Memory.usedRooms) {
            var roomName = Memory.usedRooms[roomName_index];
            var shouldContinue = false;
            for(var spawnName in Game.spawns){
                if(Game.spawns[spawnName].room.name == roomName) shouldContinue = true;
            }
            if(shouldContinue) continue;
            if (!Game.rooms[roomName]) {
                continue;
            }
            if(builder.canSpawn(roomName)){
                createExternalCreep(spawn_object,roomName);
            }
        }

    }
};

function calcCreepRatio(count) {
    var creepRatio = {};
    for (var name in count) {
        if (name == 'total') continue;
        creepRatio[name] = count[name] / count.total;
    }
    return creepRatio;
}

function createCreep(spawn_object) {
    createExternalCreep(spawn_object, spawn_object.room.name);
}

function createExternalCreep(spawn_object, destinationRoom) {
    //delete old creepNames
    var creepCount = utilities.countCreeps();
    for (var name in Memory.creeps) {
        if (!Game.creeps[name]) {
            delete Memory.creeps[name];
        }
    }

    lastCreepGenerated2 = lastCreepGenerated;
    // normal creeps
    var composition;
    var responseCode;
    for (var creepType_index in settings.creepTypes) {
        var creepType = settings.creepTypes[creepType_index];
        if (lastCreepGenerated != creepType) {
            var creepDefinition = require("creep." + creepType);
            composition = utilities.calculateComposition(spawn_object.room.name, creepDefinition);
            if (creepDefinition.canSpawn(destinationRoom)) {
                responseCode = spawn_object.createCreep(composition.composition, spawn.generateNewCreepName(), {
                    role: creepDefinition.type,
                    level: composition.level,
                    age: 0,
                    timer: 0,
                    task: null,
                    subtask: "transfer",
                    destinationRoom: destinationRoom,
                    originalRoom: spawn_object.room.name
                });
            }
            if (!responseCode) lastCreepGenerated = creepDefinition.type;
        }
    }


    //bootstrap in case of failure
    if (responseCode == -6 && creepCount.harvester < spawn_object.room.find(FIND_SOURCES).length && creepCount.harvester < creepCount.logistics || creepCount.harvester == 0) {
        composition = utilities.calculateComposition(spawn_object.room.name, harvester);
        spawn_object.createCreep(composition.composition, spawn.generateNewCreepName(), {
            role: harvester.type,
            level: composition.level
        });
        if (!responseCode) lastCreepGenerated = builder.type;
    }

    if (responseCode == -6 && creepCount.logistics < spawn_object.room.find(FIND_SOURCES).length && creepCount.logistics < creepCount.harvester || creepCount.logistics == 0) {
        composition = utilities.calculateComposition(spawn_object.room.name, logistics);
        spawn_object.createCreep(composition.composition, spawn.generateNewCreepName(), {
            role: logistics.type,
            level: composition.level
        });
        if (!responseCode) lastCreepGenerated = builder.type;
    }

    if (lastCreepGenerated == lastCreepGenerated) {
        lastCreepGenerated = null;
    }
}

module.exports = spawn;