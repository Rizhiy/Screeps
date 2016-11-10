var spawnMain = require('spawn.main');
var worker = require("creep.worker");
var logistics = require("creep.logistics");

module.exports.loop = function () {
    var counter = 0;
    spawnMain.CreateCreep();
    for(var name in Game.creeps) {
        var creep = Game.creeps[name];
        if(creep.memory.role == 'logistics') {
            logistics.run(creep);
        }
        if(creep.memory.role == 'upgrader') {
            roleUpgrader.run(creep,counter);
        }
        if(creep.memory.role == 'builder') {
            roleBuilder.run(creep,counter);
        }
        if(creep.memory.role == "worker"){
            worker.run(creep);
        }
        counter+=1;
    }
}