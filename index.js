var spawn = require('child_process').spawn;
var EventEmitter = require('events').EventEmitter;
var P = require('bluebird');
var join = require('path').join;
var _ = require('lodash');
var eventHandler = require('./lib/events');
//var IPC = require('./lib/IPC');
var __defaults = {}
var __electron = 'electron';
var __path = join(__dirname, './lib/bootstrap.js');

module.exports = Driver;
var __defaults = {
	show: true,
	xhrSniffer: false
}

function Driver( options ){
	if(!(this instanceof Driver)) return new Driver( options );
	EventEmitter.call( this );
	this._options = _.extend({}, __defaults, options);
	this._steps = [];
	this._steps.push(() => {
		return new P(( resolve, reject ) => {
			this._awaitType = 'ready';
			this._resolve = resolve;
			this._child = spawn( __electron, [ __path ] );
			this._child.stdout.on( 'data', eventHandler.bind( this ) );
			this._child.stdin.write( __sendMessage( 'ready', this._options ));
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

Driver.prototype.wait = function( time ){
	this._steps.push(() => {
		return new P( resolve => {
			setTimeout(function(){
				resolve();
			}, time);
		});
	})
	return this;	
}

Driver.prototype.waitFor = function( fn ){
	this._steps.push(() => {
		return new P(( resolve, reject ) => {
			this._awaitType = 'waitfor';
			this._resolve = resolve;
			fn = typeof fn === 'function' ? __parseFn( fn ) : fn;
			this._child.stdin.write( __sendMessage( this._awaitType, fn ));
		});
	})
	return this;	
}

Driver.prototype.click = function( el ){
	this._steps.push(() => {
		return new P(( resolve, reject ) => {
			this._awaitType = 'click';
			this._resolve = resolve;
			this._child.stdin.write( __sendMessage( this._awaitType, el ));
		});
	})
	return this;
}

Driver.prototype.waitUntil = function( fn ){
	this._steps.push(() => {
		return new P(( resolve, reject ) => {
			this._awaitType = 'waituntil';
			this._resolve = resolve;
			fn = typeof fn === 'function' ? __parseFn( fn ) : fn;
			this._child.stdin.write( __sendMessage( this._awaitType, fn ));
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