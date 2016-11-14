var creeps = {}

var spawnMain = require("structure.spawn");
creeps.harvester = require("creep.harvester");
creeps.logistics = require("creep.logistics");
creeps.builder = require("creep.builder");
creeps.upgrader = require("creep.upgrader");
creeps.capturer = require("creep.capturer");

var tower = require("structure.tower");
var manager = require("manager");
var utilities = require("utilities");

module.exports.loop = function () {
    var counter = 0;
    var towers = Game.spawns.Main.room.find(FIND_MY_STRUCTURES,
        {filter: {structureType: STRUCTURE_TOWER}});
    for (var tower_index in towers) {
        tower.run(towers[tower_index]);
    }
    if (Game.time % 5 == 0) {
        manager.balanceLinks(Game.spawns.Main.room.name);
    }

    for (var name in Game.creeps) {
        var creep = Game.creeps[name];
        if (Game.time % 10 == 0) {
            creep.memory.age += 10;
        }

        if (creep.ticksToLive > 1450) {
            creep.memory.renewing = false;
        }
        if (creep.memory.renewing) {
            manager.renewCreep(creep);
            continue;
        }
        if (creep.ticksToLive < 150) {
            creep.memory.renewing = true;
        }

        if (creep.memory.role) {
            creeps[creep.memory.role].run(creep);
        }
    }

    for(var spawnName in Game.spawns){
        spawnMain.createCreeps(Game.spawns[spawnName]);
        spawnMain.createExternalCreeps(Game.spawns[spawnName]);
    }

};