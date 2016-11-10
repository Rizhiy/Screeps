var spawn = {
    CreateCreep: function(){
        CreepCount = countCreeps();
        if(CreepCount.harvesters < CreepCount.builders+1){
            Game.spawns.Main.createCreep([WORK,CARRY,MOVE],'Harvester'+Math.random().toString().slice(2,6),{role: 'harvester'});
        }
        else if(CreepCount.builders < CreepCount.upgraders+1){
            Game.spawns.Main.createCreep([WORK,CARRY,MOVE],'Builder'+Math.random().toString().slice(2,6),{role: 'builder'});
        }
        else if(CreepCount.upgraders < 3){
            Game.spawns.Main.createCreep([WORK,CARRY,MOVE],'Upgrader'+Math.random().toString().slice(2,6),{role: 'upgrader'});
        }
        for(var name in Memory.creeps) {
            if(!Game.creeps[name]) {
                delete Memory.creeps[name];
                console.log('Clearing non-existing creep memory:', name);
            }
        }
    }
}

function countCreeps(){
    var count = {}
    count.harvesters = 0;
    count.builders = 0;
    count.upgraders = 0;
    for(var name in Game.creeps){
        var creep = Game.creeps[name];
        if(creep.role == 'harvester'){
            count.harvesters +=1;
        }
        if(creep.role == 'builder'){
            count.builders +=1;
        }
        if(creep.role == 'upgrader'){
            count.upgraders +=1;
        }
    }
    return count;
}

module.exports = spawn;