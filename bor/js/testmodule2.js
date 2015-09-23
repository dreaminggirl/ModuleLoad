ModuleLoad.define( 'js/testmodule2' , [] , function(require , exports){
    console.log('js/testmodule2被定义')
    exports.test = function(){
        console.log('js/testmodule2被require')
    }
})