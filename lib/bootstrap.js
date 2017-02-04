var electron = require('electron');
var _ = require('lodash');
var isJson = require('is-json');
var BrowserWindow = electron.BrowserWindow;
var app = electron.app;
var win = null;

app.on('ready', () => {
	win = new BrowserWindow({show: true, width: 800, height: 600});
	emitMessage('ready');
})

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
		case 'goto':
			return win.loadURL.bind( win );
		break;
		case 'evaluate':
			return _.partial( win.webContents.executeJavaScript.bind( win.webContents ), _, true, null );
		break;
	}
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