var utilities = {

    /** @param {Creep} creep **/
    findSources: function(creep,i) {
if(creep.harvest(sources[i%sources.length]) == ERR_NOT_IN_RANGE) {
            creep.moveTo(sources[i%sources.length]);
        }
    }
};

module.exports = utilities;