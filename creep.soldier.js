/**
 * Created by rizhiy on 11/11/16.
 */

var RoomsToClaim = ["W8N2"];
var soldier = {
    composition: [WORK,MOVE,MOVE,MOVE,CARRY,CLAIM],
    claimRoom: function(creep){
        for(var room_name in RoomsToClaim){
            var room = Game.rooms[room_name];
            if(room.controller.reservation.username != "Rizhiy"){
                var controller = room.controller;
                var responseCode = creep.claimController(controller);
                if(responseCode == ERR_NOT_IN_RANGE){
                    creep.moveTo(room.controller);
                }
            }
        }
    },
    run: function (creep) {
        if(!creep.memory.task){
            creep.memory.task = "claimRoom";
        }
        if(creep.memory.task == "claimRoom"){
            this.claimRoom(creep);
        }
    }
};

module.exports = solder;