var roleHarvester = {

    /** @param {Creep} creep **/
    run: function(creep,i) {
        if(creep.carry.energy < creep.carryCapacity) {
            var sources = creep.room.find(FIND_SOURCES);
            if(creep.harvest(sources[i%sources.length]) == ERR_NOT_IN_RANGE) {
                creep.moveTo(sources[i%sources.length]);
            }
            creep.say('harvesting');
        }
        else {
            var targets = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return (structure.structureType == STRUCTURE_EXTENSION ||
                                structure.structureType == STRUCTURE_SPAWN ||
                                structure.structureType == STRUCTURE_TOWER) && structure.energy < structure.energyCapacity;
                    }
            });
            if(targets.length > 0) {
                if(creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(targets[0]);
                }
            }
            creep.say('delivering');
        }
    }
};

module.exports = roleHarvester;