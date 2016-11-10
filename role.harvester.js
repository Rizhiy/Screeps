var roleHarvester = {

    /** @param {Creep} creep **/
    run: function(creep,i) {
        if(creep.carry.energy < creep.carryCapacity) {
            var sources = creep.room.find(FIND_SOURCES);
            if(creep.harvest(sources[i%sources.length]) == ERR_NOT_IN_RANGE) {
                creep.moveTo(sources[i%sources.length]);
            }
        }
        else {
            var target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return (structure.structureType == STRUCTURE_EXTENSION ||
                                structure.structureType == STRUCTURE_SPAWN ||
                                structure.structureType == STRUCTURE_TOWER ||
                                structure.structureType == STRUCTURE_CONTAINER) && structure.energy < structure.energyCapacity;
                    }
            });
            if(target) {
                if(creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target);
                }
            } else {
                if(i%2 == 0){
                    creep.memory.role = 'builder';
                } else {
                    creep.memory.role = 'upgrader';
                }
            }
        }
    }
};

module.exports = roleHarvester;