var roleHarvester = require('role.harvester');
var roleUpgrader = require('role.upgrader');
var roleBuilder = require('role.builder');
var spawnMain = require('spawn.main');

module.exports.loop = function () {
    var counter = 0;
    spawnMain.CreateCreep();
    for(var name in Game.creeps) {
        var creep = Game.creeps[name];
        if(creep.memory.role == 'harvester') {
            roleHarvester.run(creep,counter);
        }
        if(creep.memory.role == 'upgrader') {
            roleUpgrader.run(creep,counter);
        }
        if(creep.memory.role == 'builder') {
            roleBuilder.run(creep,counter);
        }
        counter+=1;
    }
}