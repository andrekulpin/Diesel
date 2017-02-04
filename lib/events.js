var P = require('bluebird');
var isJson = require('is-json');

module.exports = function( message ){
	var _data = message && message.toString().trim();
	_data = isJson( _data ) && JSON.parse( _data );
	return this._awaitType === _data.type && this._resolve( _data.data );
}