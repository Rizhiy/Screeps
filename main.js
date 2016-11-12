var spawnMain = require('spawn.main');
var worker = require("creep.worker");
var logistics = require("creep.logistics");
var builder = require("creep.builder");
var roleHarvester = require("role.harvester");
var TOWER = require("tower");

module.exports.loop = function () {
    var counter = 0;
    spawnMain.CreateCreeps();
    var towers = Game.spawns.Main.room.find(FIND_MY_STRUCTURES,
        {filter: {structureType: STRUCTURE_TOWER}});
    for(var tower in towers){
        TOWER.run(towers[tower]);
    }
    for (var name in Game.creeps) {
        var creep = Game.creeps[name];
        if (creep.memory.role == 'logistics') {
            logistics.run(creep);
        }

        if (creep.memory.role == "worker") {
            worker.run(creep);
        }
        if(creep.memory.role == "builder"){
            builder.run(creep);
        }
        if (creep.memory.role == 'harvester') {
            roleHarvester.run(creep, counter);
            counter += 1;
        }
    }
};