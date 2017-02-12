var electron = require('electron');
var _ = require('lodash');
var isJson = require('is-json');
var BrowserWindow = electron.BrowserWindow;
var P = require('bluebird');
var app = electron.app;
var win = null;
var __TIMEOUT__ = 1000;

function __init__( config ){
	var $resolve = null;
	app.on('ready', function(){
		win = new BrowserWindow({show: config.show || false, width: 800, height: 600});
		config.debug && win.webContents.openDevTools();
		$resolve();
	});
	return new P(function(resolve, reject){
		$resolve = resolve;
	});
}

process.stdin.on('data', function( message ){
	message = message.toString().trim();
	var _data = isJson( message ) && JSON.parse( message );
	if( !_data && message === 'exit' ) return exit();
	var type = _data.type;
	var data = _data.data;
	var cmd = getCommand( type );
	var res = cmd( data );
	if(typeof res === 'boolean') return emitMessage( type );
	if(typeof res.then === 'function') return res.then(( $ ) => emitMessage( type, $ ));
});

function getCommand( type ){
	switch(type){
		case 'ready':
			return __init__;
		break;
		case 'goto':
			return win.loadURL.bind( win );
		break;
		case 'click':
			return function( el ){
				return __click( el );
			}
		break;
		case 'waitfor':
			return function( condition ){
				return __wait( condition );
			}
		break;
		case 'waituntil':
			return function( condition ){
				return __wait( condition, true );
			}
		break;
		case 'evaluate':
			return _.partial( win.webContents.executeJavaScript.bind( win.webContents ), _, true, null );
		break;
	}
}

function evaluateStrategy( data ){
	if(data.indexOf('function') > -1){
		return data;
	}
	return "(function(){return !!document.querySelector('" + data + "');}())";
}

function __click( el ){
	var cmd = "(function(){document.querySelector('" + el + "').click();}())";
	return win.webContents.executeJavaScript( cmd, true );
}

function __wait( condition, isReverse ){
	var conditionFn = evaluateStrategy( condition );
	return new P(function(resolve, reject){
		loop();
		function loop(){
			win.webContents.executeJavaScript( conditionFn, true )
			.then(function( result ){
				result = isReverse ? !result : result;
				if( result ) return resolve();
				setTimeout(function(){
					loop();
				}, __TIMEOUT__);
			})
			.catch( reject );
		}
	}); 
}

function exit(){
	win = null;
	app.quit();
}

function emitMessage( type, data ){
	return console.log(JSON.stringify({
		type: type,
		data: data
	}))
}