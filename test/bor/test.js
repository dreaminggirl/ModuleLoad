ModuleLoad.define( '' , [ 'js/testmodule' , 'js/testmodule2'] , function(require , exports){
    console.log('test被定义')
    exports.test = function(){
        console.log('test被require')
    }
})