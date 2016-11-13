/**
 * Created by Rizhiy on 12/11/2016.
 */

var settings = require('settings');

var tower = {
    run: function (tower) {
        if (tower) {
            var closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
            if (closestHostile) {
                tower.attack(closestHostile);
            } else {
                //TODO: find out why settings don't work
                var closestDamagedStructure = tower.pos.findClosestByRange(FIND_STRUCTURES, {
                    filter: function (object) {
                        if (object.structureType == STRUCTURE_WALL || object.structureType == STRUCTURE_RAMPART) {
                            return object.hits < 10000;
                        }
                        return object.hits < object.hitsMax * 4 / 5;
                    }
                });
                if (closestDamagedStructure) {
                    tower.repair(closestDamagedStructure);
                }
            }
        }
    }
};

module.exports = tower;
