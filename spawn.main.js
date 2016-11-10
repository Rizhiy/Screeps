var worker = require("creep.worker");
var logistics = require("creep.logistics");

var desiredRatio = {};
desiredRatio.worker = 0.8;
desiredRatio.logistics = 0.2;

var creepComposition = {};
creepComposition.worker = worker.composition;
creepComposition.logistics = logistics.composition;

var spawn = {
    CreateCreep: function () {
        var CreepCount = countCreeps();
        if (CreepCount.total < 20) {
            for (var name in Game.creeps) {
                if (!Game.creeps[name]) {
                    delete Memory.creeps[name];
                    console.log('Clearing non-existing creep memory:', name);
                }
            }
            var creepRatio = calcCreepRatio(CreepCount);
            var creepSpawned = false;
            for (var ratio in creepRatio) {
                if (!creepRatio[ratio] || creepRatio[ratio] < desiredRatio[ratio]) {
                    Game.spawns.Main.createCreep(creepComposition[ratio], Math.random().toString().slice(2, 7), {role: ratio});
                    creepSpawned = true;
                }
            }
            if (!creepSpawned) {
                Game.spawns.Main.createCreep(creepComposition.worker, Math.random().toString(), {role: ratio});
            }
        }
    }
};

function countCreeps() {
    var count = {};
    count.logistics = 0;
    count.worker = 0;
    count.total = 0;
    for (var name in Game.creeps) {
        var creep = Game.creeps[name];
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

module.exports = spawn;