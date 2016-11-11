var worker = require("creep.worker");
var logistics = require("creep.logistics");
var utilities = require("utilities");

var desiredRatio = {};
desiredRatio.worker = 0.8;
desiredRatio.logistics = 0.2;
desiredRatio.harvester = 0.0;

var creepComposition = {};
creepComposition.worker = worker.composition;
creepComposition.logistics = logistics.composition;

var sources = Game.spawns.Main.room.find(FIND_SOURCES);
var spawn = {
    CreateCreeps: function () {
        for (var source_index in sources) {
            var source = sources[source_index];
            if (source.energy == 0) {
                Memory.sources[source.id].lastEmptyTime = Game.time;
            }
            // console.log(Game.time - Memory.sources[source.id].lastEmptyTime);
            // if(Game.time - Memory.sources[source.id].lastEmptyTime > 300){
            if (countCreeps() < 20) {
                createCreep();
            }
        }
    }
};

function countCreeps() {
    var count = {};
    count.harvester = 0;
    count.logistics = 0;
    count.worker = 0;
    count.total = 0;
    for (var name in Game.creeps) {
        var creep = Game.creeps[name];
        if (creep.memory.role == "harvester") {
            count.harvester++;
        }
        if (creep.memory.role == 'logistics') {
            count.logistics++;
        }
        if (creep.memory.role == 'worker') {
            count.worker++;
        }
        count.total++;
    }
    return count;
}

function calcCreepRatio(count) {
    var creepRatio = {};
    for (var name in count) {
        if (name == 'total') continue;
        creepRatio[name] = count[name] / count.total;
    }
    return creepRatio;
}

function createCreep() {
    for (var name in Game.creeps) {
        if (!Game.creeps[name]) {
            for (var source in Memory.sources) {
                Memory.sources[source].Workers = this.removeFromArray(Memory.sources[source].Workers, name);
            }

            delete Memory.creeps[name];
            console.log('Clearing non-existing creep memory:', name);
        }
    }
    var creepCount = countCreeps();
    var creepRatio = calcCreepRatio(creepCount);
    var creepSpawned = false;
    for (var ratio in creepRatio) {
        if ((!creepRatio[ratio] && ratio != "harvester") || creepRatio[ratio] < desiredRatio[ratio]) {
            var responseCode = Game.spawns.Main.createCreep(creepComposition[ratio], Math.random().toString().slice(2, 7), {role: ratio});

            if (responseCode < 0) {
            } else {
                creepSpawned = true;
            }
        }
    }
    if (!creepSpawned) {
        if (creepCount.harvester < 2 && creepCount.worker == 0) {
            Game.spawns.Main.createCreep([WORK, MOVE, CARRY], Math.random().toString(), {role: "harvester"});
        } else {
            Game.spawns.Main.createCreep(creepComposition.worker, Math.random().toString().slice(2, 7), {role: "worker"});
        }
    }
}

module.exports = spawn;