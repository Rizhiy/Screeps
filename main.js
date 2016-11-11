var spawnMain = require('spawn.main');
var worker = require("creep.worker");
var logistics = require("creep.logistics");
var roleHarvester = require("role.harvester");

module.exports.loop = function () {
    var counter = 0;
    spawnMain.CreateCreeps();
    for (var name in Game.creeps) {
        var creep = Game.creeps[name];
        if (creep.memory.role == 'logistics') {
            logistics.run(creep);
        }

        if (creep.memory.role == "worker") {
            worker.run(creep);
        }
        if (creep.memory.role == 'harvester') {
            roleHarvester.run(creep, counter);
            counter += 1;
        }
    }
}