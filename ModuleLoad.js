/**
 * 模拟模块加载
 */
(function( global ){
    var i = 0
    // var PATH = ''
    var anonymous = 'anonymous'
    

    var Req = function( arr , cbk) {
        this.arr = arr
        this.cbk = cbk
        this.result = []
    }
    var requires = []



    var modules = {} //存储定义的模块的名
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
    var findPath = function( path ) {
        var a = document.createElement('a')
        a.href = ''
        var p = a.href
        if ( p.indexOf( '.html' ) ) {
            return p.slice(0,p.match(/(.*?)\.html$/)[1].lastIndexOf('/'))
        } else  if ( path ) {
            return path.slice(0, path.lastIndexOf('/'))
        }
        
    }

    var returnSrc = function( src ) {
        if ( src.charAt(0) == '.' ){

        } else {
            return findPath() + '/' + src + '.js'
        }
    }

    var getModName = function(){
        var src = document.currentScript.src
        var reg = new RegExp( '^' + findPath() + '/' + '(.*).js$' )

        if ( src.match( reg ) ){
            //说明与.html同级或偏下
            return src.match( reg )[1]
        } else {

        }

    }

    var loadScript = function ( src , id ) {

        if ( modules[ src ].state == 'undo' ) {

            id && ( modules[ id ].state = 'doing' ) //修改上级模块的状态

            modules[ src ].state = 'doing'

            var script = document.createElement('script')
            var head = document.head
            script.defer = 'defer'
            script.async = 'async'
            script.type = 'text/javascript';
            //检测src
            script.src = returnSrc( src )    
            head.appendChild( script )

        }

    }

    var createModuleInfo = function( exports , _exports , id , factory ) {
            _exports = isFunOrObj(factory) == 'Function' ? factory( require , exports ) : factory
            if ( _exports ) {
                exports = _exports
            }
            modules[id].info = exports 
    }

    var triggerCheckReq = function( id ) {
        requires.forEach( function( iterm , index , arr ){
            var n = iterm.arr.indexOf( id );
            if ( n != -1 ) {
                iterm.result.push( modules[ id ].info )
                iterm.arr.splice( n , 1 )
                if ( !iterm.arr.length ) {
                    iterm.cbk.apply( window , iterm.result )
                }
            }
        } )
    }

    var triggerCreate = function( module , id ) {

        var arr = module.deps;
        for( var i = 0 ; i < arr.length ;i++ ){
            if ( modules[ arr[i] ].state != 'done' ){
                return
            }
        }
        var exports = {} 
        var _exports = {}
        module.state = 'done'
        createModuleInfo( exports , _exports , id , module.factory )
        triggerCheckReq( id )       
        module.make && (
        module.make.forEach( function( iterm ,index , arr ){
                triggerCreate( modules[ iterm ] , iterm )
        } ))
        if ( module.id == anonymous ) {
            delete modules[ module.id ]
        }
    }




    var require = function( module ) {
        return modules[module].info
    }
    var defineModule = function( id , deps, factory ) {
        debugger
        //1、判断参数 
        switch ( arguments.length ) {
            case 0 :
                throw Error ('define(id?, deps?, factory)请输入必填参数factory')
            case 1 : 
                factory = isFunOrObj( id ) ? id : NOOP
                id = anonymous
                deps = []
                break
            case 2 :
                factory = isFunOrObj( deps ) ? deps : NOOP
                //参数为两个的时候，需要考虑第一个传递的是id还是deps
                if ( Array.isArray( id ) ) {
                    deps = Array.isArray( id ) ? id : []
                    id = anonymous
                } else {
                    id = id
                    deps = []
                }    
                break
            default :
                id = ( typeof id == 'string' && id.length ) ? id : anonymous
                deps = Array.isArray( deps ) ? deps : []
                factory = isFunOrObj( factory ) ? factory : NOOP           
        }

        ( id == anonymous ) && ( id = getModName() ) 
        isFunOrObj( modules[ id ] ) != 'Object' && ( modules[ id ] = new Module( '' , [] , 'undo' ) )
        modules[ id ].id = document.currentScript.src
        modules[ id ].deps =  deps.length != 0 ? deps.slice() : []
        modules[ id ].depsln = modules[id].deps.length
        modules[ id ].state == '' && ( modules[ id ].state = 'undo' )
        modules[ id ].factory = factory


        //3、加载依赖模块
        
        var _deps = modules[ id ].deps

        if ( !_deps.length ) {
            //表示不存在依赖
            var exports = {} 
            var _exports = {}
            modules[id].state = 'done'
            createModuleInfo( exports , _exports , id , factory )

            //监听requires数组
            triggerCheckReq( id )

            modules[ id ].make && (
            modules[ id ].make.forEach( function( iterm ,index , arr ){
                triggerCreate( modules[ iterm ] , iterm )
            } ) )

            
        }
        var finish = 0
        _deps.forEach( function( iterm , index , arr ) {


            !modules[ iterm ] && ( modules[ iterm ] = new Module( '' , [] , 'undo' ) )
            modules[ iterm ].make.push( id )
            if ( modules[ iterm ].state == 'undo' ) {
                loadScript( iterm , id )
            } else if ( modules[ iterm ].state == 'done' ) {
                finish ++
            }
            if ( finish == arr.length ) {
                triggerCreate( modules[ id ] , iterm )
                triggerCheckReq( id )
            }

            
        } )                

    }

    //加载模块 判断模块是否已经被定义，如果没有，则进行定义。并将模块存入requires数组
    var requireModule = function( arr , cbk ){
        arr.forEach( function( iterm , index , arr ) {
            if ( ! (iterm in modules) ){
                modules[ iterm ] = new Module( '' , [] , 'undo' )
                loadScript( iterm )
            }
        } )
        requires.push( new Req( arr , cbk ) )

    }

    global.ModuleLoad = {
        define : defineModule 
        ,require : requireModule
    }   
})(this)