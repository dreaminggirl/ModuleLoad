ModuleLoad.define( 'js/testmodule' , [] , function(require , exports){
    console.log('js/testmodule被定义')
    exports.test = function(){
        console.log('js/testmodule被require')
    }
})