#!/usr/bin/env node

'use strict';

// JKPug utility functions

// core packages

// third party packages

// local modules

// exported object
let utils = {
};

utils.timestamp = function() {
	return Math.floor( Date.now() / 1000 );
}

if ( !module.parent ) {
	console.log( 'running utils from cli' );

	// cut off the process and script name
	let args = process.argv.slice( 2 );

	let handlerFunc = handlers[args[0]];
	if ( handlerFunc ) {
		return handlerFunc( args );
	}

	console.log( 'please specify a command:\n  ' + Object.keys( handlers ).join( '\n  ' ) );
}

module.exports = utils;
