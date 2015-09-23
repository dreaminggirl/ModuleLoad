ModuleLoad.define( '' , [] , function(require , exports){
    console.log('testmodule3被定义')
    exports.test = function(){
        console.log('testmodule3被require')
    }
})