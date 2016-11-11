/**
 * Created by rizhiy on 11/11/16.
 */

var utilities = {
    removeFromArray: function (array,value){
    return array.filter(function(el){
        return el != value;
    });
}
}

module.exports = utilities;