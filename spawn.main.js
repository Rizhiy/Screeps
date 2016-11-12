var worker = require("creep.worker");
var logistics = require("creep.logistics");
var builder = require("creep.builder");
var utilities = require("utilities");
var manager = require("manager");

var creepComposition = {};
creepComposition.worker = worker.composition;
creepComposition.logistics = logistics.composition;

var sources = Memory.sources;
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
    for (var name in Memory.creeps) {
        if (!Game.creeps[name]) {
            delete Memory.creeps[name];
            // console.log('Clearing non-existing creep memory:', name);
        }
    }

    var responseCode;
    //check workers
    for (var source_index in sources) {
        var source = sources[source_index];
        if (manager.sourceAvailable(source)) {
            responseCode = Game.spawns.Main.createCreep(worker.composition, spawn.generateNewCreepName(), {role: "worker"});
        }
    }

    //check logistics
    var targets = Game.spawns.Main.room.find(FIND_STRUCTURES, {
        filter: function (structure) {
            return structure.structureType == STRUCTURE_CONTAINER;
        }
    });
    var minValue = 1;
    var minTarget = targets[0];
    var maxValue = 0;
    var maxTarget = targets[0];
    for (var target_index in targets) {
        var target = targets[target_index];
        var fullness;
        if (target.structureType == STRUCTURE_CONTAINER) {
            fullness = target.store.energy / target.storeCapacity;
        } else {
            fullness = target.energy / target.energyCapacity;
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

    if (maxValue - minValue > 0.5 || (minValue < 0.1 && utilities.countCreeps().logistics < 2)) {
        responseCode = Game.spawns.Main.createCreep(logistics.composition, spawn.generateNewCreepName(), {role: "logistics"});
    }

    //check builders
    if (manager.checkBuildings(Game.spawns.Main) || (manager.checkConstruction(Game.spawns.Main) && utilities.countCreeps().builder < 4)) {
        responseCode = Game.spawns.Main.createCreep(builder.composition, Math.random().toString().slice(2, 7), {role: "builder"});
    }

    //bootstrap in case of failure
    if (responseCode == -6 && creepCount.worker == 0 && creepCount.harvester < 2) {
        Game.spawns.Main.createCreep([WORK, CARRY, MOVE], Math.random().toString().slice(2, 7), {role: "harvester"});
    }
}

module.exports = spawn;