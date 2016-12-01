#!/usr/bin/env node

'use strict';

// JKPug irc bot

// core packages

// third party packages
const irc = require( 'irc' );

// local modules
const jkpug = require( './jkpug' );
const utils = require( './utils' );

// exported object
let jkpug_irc = {
};

// local configuration
let config = require( './config.json' ).irc;

jkpug_irc.run = function() {
	console.log( 'IRC support not available :(' );
}

let handlers = {
	'run': ( args ) => {
		jkpug_irc.run();
	},
};

if ( !module.parent ) {
	console.log( 'running jkpug_irc from cli' );

	// cut off the process and script name
	let args = process.argv.slice( 2 );

	let handlerFunc = handlers[args[0]];
	if ( handlerFunc ) {
		return handlerFunc( args );
	}

	console.log( 'please specify a command:\n  ' + Object.keys( handlers ).join( '\n  ' ) );
}

module.exports = jkpug_irc;
