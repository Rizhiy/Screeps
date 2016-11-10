/**
 * Created by rizhiy on 10/11/16.
 */
function findFreeSources() {
    var freeSources = [];
    for (var source in Memory.sources) {
        var source_object = Memory.sources[source];
        if (source_object.Workers / source_object.WT < 1.5) {
            freeSources.push(source_object.id);
        }
    }
    return freeSources;
}

var manager = {
    addSources: function (room) {
        if (!Memory.sources) {
            Memory.sources = {};
        }
        var sources = room.find(FIND_SOURCES);
        for (var source in sources) {
            var source_object = sources[source];
            Memory.sources[source_object.id] = source_object;
            Memory.sources[source_object.id]["WT"] = 0;
            Memory.sources[source_object.id]["Workers"] = 0;
            for (var i = -1; i < 2; i++) {
                for (var j = -1; j < 2; j++) {
                    if (Game.map.getTerrainAt(source_object.pos.x + i, source_object.pos.y + j, source_object.room.name) != "wall") {
                        Memory.sources[source_object.id]["WT"]++;
                    }
                }
            }
        }
    },
    assignSource: function (creep) {
        var freeSources = findFreeSources();
        var closestSource;
        var shortestRoute;
        for (var source in freeSources) {
            var source_object = Game.getObjectById(freeSources[source]);
            var route = Game.map.findRoute(creep.room, source_object.room);
            if (!closestSource) {
                closestSource = source_object;
            }
            if (!shortestRoute) {
                shortestRoute = route;
            }
            if (route.length < shortestRoute.length) {
                closestSource = source_object;
                shortestRoute = route;
            }
            if (shortestRoute.length == 0) {
                if (creep.pos.findPathTo(source_object) < creep.pos.findPathTo(closestSource)) {
                    closestSource = source_object;
                    shortestRoute = route;
                }
            }
        }
        if (closestSource) {
            Memory.sources[closestSource.id].Workers++;
            creep.memory.targetSource = closestSource.id;
            creep.memory.target = null;
        }
    },
    assignTarget: function (creep) {
        if (creep.memory.targetSource) {
            Memory.sources[creep.memory.targetSource].Workers--;
            creep.memory.targetSource = null;
        }
        var target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: function (structure) {
                return ((structure.structureType == STRUCTURE_EXTENSION ||
                    structure.structureType == STRUCTURE_SPAWN ||
                    structure.structureType == STRUCTURE_TOWER) && structure.energy < structure.energyCapacity) ||
                    (structure.structureType == STRUCTURE_CONTAINER && structure.store.energy < structure.storeCapacity);
            }
        });
        if (target) {
            creep.memory.target = target;
        }
    },
    findEnergySource: function (creep) {
        var target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: function (structure) {
                return (structure.structureType == STRUCTURE_CONTAINER && structure.store.energy > 0);
            }
        });
        if (target) {
            creep.memory.energySource = target;
        }
    }
};


module.exports = manager;