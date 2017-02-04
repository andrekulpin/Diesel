var spawn = require('child_process').spawn;
var EventEmitter = require('events').EventEmitter;
var P = require('bluebird');
var join = require('path').join;
var eventHandler = require('./lib/events');
var __defaults = {}
var __electron = 'electron';
var __path = join(__dirname, './lib/bootstrap.js');

module.exports = Driver;

function Driver( options ){
	if(!(this instanceof Driver)) return new Driver( options );
	EventEmitter.call( this );
	this._options = options || __defaults;
	this._steps = [];
	this._steps.push(() => {
		return new P(( resolve, reject ) => {
			this._awaitType = 'ready';
			this._resolve = resolve;
			this._child = spawn( __electron, [ __path ] );
			this._child.stdout.on( 'data', eventHandler.bind( this ) );
		});
	});
	return this;
}

Driver.prototype.end = function(){
	return new P(( resolve, reject ) => {
		var loop = ( data ) => {
			var step = this._steps.shift();
			if( step ){
				return step()
				.then( loop )
				.catch( reject );
			}
			process.nextTick(() => this._child.stdin.write( 'exit' ));
			return resolve( data );
		}
		process.nextTick( loop );
	});
}

Driver.prototype.goto = function(url){
	this._steps.push(() => {
		return new P(( resolve, reject ) => {
			this._awaitType = 'goto';
			this._resolve = resolve;
			this._child.stdin.write( __sendMessage( this._awaitType, url ));
		});
	})
	return this;	
}

Driver.prototype.evaluate = function( fn ){
	this._steps.push(() => {
		return new P(( resolve, reject ) => {
			this._awaitType = 'evaluate';
			this._resolve = resolve;
			this._child.stdin.write( __sendMessage( this._awaitType, __parseFn( fn ) ));
		});
	})
	return this;
}

function __parseFn( fn ){
	var _fn = fn + '';
	_fn = _fn.replace(/(\r|\n|\t)/g, '');
	return '(' + _fn + ')()';
}

function __sendMessage( type, data ){
	return JSON.stringify({
		type: type,
		data: data
	})
}