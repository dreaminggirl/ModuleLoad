/**
 * 模拟模块加载
 */
(function( global ){


    //存储通过ModuleLoad.require()加载实例
    var requires = []
    var Req = function( arr , cbk , ln ) {
        this.arr = arr
        this.cbk = cbk
        this.result = []
        this.resultLen = ln
    }

    //存储通过ModuleLoad.define()加载的模块
    var modules = {} 
    var Module = function( id , deps , state , depsln , factory , make  ) {
        this.id = id || ''
        this.deps = deps || []
        this.state = state || ''
        this.depsln = depsln || 0
        this.factory = factory || null
        this.make = make || []
    }

    var isFunOrObj = function( obj ) {
         var str = Object.prototype.toString.call(obj).slice( 8 , -1 )
         if ( str == 'Object' || str == 'Function') {
            return str
         }
         return false
    }

    var NOOP = function () {
        return true
    }

    var findPath = function() {
        var a = document.createElement('a')
        a.href = ''
        var p = a.href
        if ( p.indexOf( '.html' ) ) {
            return p.slice( 0 , p.match(/(.*?)\.html$/)[1].lastIndexOf( '/' ) + 1 )
        }
    }


    var getModName = function(){
        var head = ''
        var src = document.currentScript.src
        var path = findPath()
        while( true ){
            var reg = new RegExp( '^' + path + '(.*).js$' )
            if ( src.match( reg ) ) {
                return  head + src.match( reg )[1]
            }
            path = path.slice( 0 , src.lastIndexOf( '/' ) + 1 )
            head = '../'
        }
    }
    // src 为要加载的模块名 id 为src依赖的模块名 
    var loadScript = function ( src ) {
            var script = document.createElement('script')
            var head = document.head
            script.defer = 'defer'
            script.async = 'async'
            script.type = 'text/javascript';
            script.src = findPath() + src + '.js'   
            head.appendChild( script )
    }
    var checkInReq = function( req ){
        for( var i = 0 ; i < requires.length ; i ++ ){
            var item = requires[ i ]
            if ( item.arr.indexOf( req ) + 1 ) {
                return true
            }
        }
        return false
    }

    //模块加载完毕后被触发 
    var triggerCheckReq = function( id ) {
        requires.forEach( function( item , index , arr ){
            var n = item.arr.indexOf( id );
            if ( n != -1 ) {
                item.result[ n ] = modules[ id ].info 
                item.resultLen --
                if ( !item.resultLen) {
                    item.cbk.apply( window , item.result )
                }
            }
        } )
    }


    //模块依赖加载完毕后 定义返回对象
    var createModuleInfo = function( exports , _exports , id , factory ) {
        _exports = isFunOrObj(factory) == 'Function' ? factory( require , exports ) : factory
        if ( _exports ) {
            exports = _exports
        }
        modules[id].info = exports 
    }

    //如果依赖全部加载完毕 则触发createModuleInfo 如果依赖未加载完毕 则退出递归 module为模块对象 id为模块名
    var triggerCreate = function( module , id ) {
        var arr = module.deps;
        for( var i = 0 ; i < arr.length ; i++ ){
            !modules[ arr[i] ] && ( modules[ arr[i] ] = new Module( arr[i] , [] , 'undo' ) )
            if ( modules[ arr[i] ].state != 'done' ){
                return
            }
        }
        if ( module.state != 'done' ) {
            var exports = {} 
            var _exports = {}
            module.state = 'done'
            createModuleInfo( exports , _exports , id , module.factory )
            triggerCheckReq( id )  //模块加载完毕，判断该模块是否被全局require
        }        

        module.make.forEach( function( item ,index , arr ){
            triggerCreate( modules[ item ] , item )
        } )
    }

    var require = function( module ) {

        return modules[module].info
    }

    var setModule = function( id , deps , factory ){

        id = getModName()
        switch ( arguments.length ) {
            case 0 :
                throw Error ('define(id?, deps?, factory)请输入必填参数factory')
            case 1 : 
                factory = isFunOrObj( id ) ? id : NOOP
                deps = []
                break
            case 2 :
                factory = isFunOrObj( deps ) ? deps : NOOP
                //参数为两个的时候，需要考虑第一个传递的是id还是deps
                if ( Array.isArray( id ) ) {
                    deps = Array.isArray( id ) ? id : []
                } else {
                    deps = []
                }    
                break
            default :
                deps = Array.isArray( deps ) ? deps : []
                factory = isFunOrObj( factory ) ? factory : NOOP           
        }
        if ( modules[ id ] ) {
            modules[ id ].deps = deps
            modules[ id ].factory = factory
        } else {
            modules[ id ] = new Module( document.currentScript.src , deps.slice() , 'undo' , deps.length , factory) 
        }
        return modules[ id ]

    }
    var checkDeps = function( deps , moduleName ) {
        deps.forEach( function( item , index , arr ) {
            !modules[ item ] && ( modules[ item ] = new Module( '' , [] , 'undo' ) )
            modules[ item ].make.push( moduleName )
            if ( modules[ item ].state == 'undo' ) {
                modules[ item ].state = 'doing'
                modules[ moduleName ].state = 'doing'
                if ( checkInReq( item )) { return }
                loadScript( item )
            }            
        } ) 
    }
    var defineModule = function( id , deps , factory ) {
        var module = setModule( id , deps , factory )
        var moduleName = getModName()

        //依赖都加载完毕 或者不存在依赖时执行
        triggerCreate( module , moduleName )
        //加载未被加载的依赖
        checkDeps( module.deps , moduleName )                

    }

    //加载模块 判断模块是否已经被定义，如果没有，则进行定义。并将模块存入requires数组
    var requireModule = function( arr , cbk ){
        arr.forEach( function( item , index , arr ) {
            if ( ! (item in modules) ){
                loadScript( item )
            }
        } )
        requires.push( new Req( arr , cbk  , arr.length) )


    }

    global.ModuleLoad = {
        define : defineModule 
        ,require : requireModule
    }   
})(this)