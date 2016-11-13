var utilities = require("utilities");
var manager = require("manager");
var settings = require("settings");

harvester = require("creep.harvester");
logistics = require("creep.logistics");

var lastCreepGenerated2 = null;
var lastCreepGenerated = null;
var spawn = {
    CreateCreeps: function () {
        if (Game.time % 3 == 0) {
            createCreep();
        }
    },
    generateNewCreepName: function () {
        return Math.random().toString().slice(2, 7);
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

function createCreep() {
    //delete old creepNames
    var creepCount = utilities.countCreeps();
    var spawnEnergy = utilities.calculateSpawnEnergy(Game.spawns.Main.room.name);
    for (var name in Memory.creeps) {
        if (!Game.creeps[name]) {
            delete Memory.creeps[name];
            // console.log('Clearing non-existing creep memory:', name);
        }
    }

    lastCreepGenerated2 = lastCreepGenerated;

    var composition;
    var responseCode;
    for (var creepType_index in settings.creepTypes) {
        var creepType = settings.creepTypes[creepType_index];
        if (lastCreepGenerated != creepType) {
            var creepDefinition = require("creep." + creepType);
            composition = utilities.calculateComposition(spawnEnergy, creepDefinition);
            if (creepDefinition.canSpawn(Game.spawns.Main.room.name)) {
                responseCode = Game.spawns.Main.createCreep(composition.composition, spawn.generateNewCreepName(), {
                    role: creepDefinition.type,
                    level: composition.level,
                    age: 0,
                    timer: 0,
                    task: null,
                    subtask: null
                });
            }
            if (!responseCode) lastCreepGenerated = creepDefinition.type;
        }
    }

    //bootstrap in case of failure
    if (responseCode == -6 && creepCount.harvester < Game.spawns.Main.room.find(FIND_SOURCES).length && creepCount.harvester < creepCount.logistics || creepCount.harvester == 0) {
        composition = utilities.calculateComposition(Game.spawns.Main.room.energyAvailable, harvester);
        Game.spawns.Main.createCreep(composition.composition, spawn.generateNewCreepName(), {
            role: harvester.type,
            level: composition.level
        });
        if (!responseCode) lastCreepGenerated = builder.type;
    }

    if (responseCode == -6 && creepCount.logistics < Game.spawns.Main.room.find(FIND_SOURCES).length && creepCount.logistics < creepCount.harvester || creepCount.logistics == 0) {
        composition = utilities.calculateComposition(Game.spawns.Main.room.energyAvailable, logistics);
        Game.spawns.Main.createCreep(composition.composition, spawn.generateNewCreepName(), {
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