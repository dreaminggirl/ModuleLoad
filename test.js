ModuleLoad.define( '' , [ 'js/testmodule' , 'js/testmodule2'] , function(require , exports){
    var testmodule = require('js/testmodule')
    testmodule.test()
    exports.test = function(){
        console.log(000)
    }
})