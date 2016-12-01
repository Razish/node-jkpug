#!/usr/bin/env node

'use strict';

// JKPug bot

// core packages

// third party packages
let jkutils = require( 'jkutils' );

// local modules
let jkpug_discord = null;
let jkpug_irc = null;

// local configuration
let config = require( './config.json' );

module.exports.games = config.games || {};
module.exports.servers = config.servers || {};

module.exports.findServer = function( gametype, channelID, callback ) {
	let response = 'finding servers ';
	// assume discord for now...
	let game = module.exports.games[gametype];
	if ( !game ) {
		// unknown gametype
		console.log( 'unknown gametype' );
		return;
	}
	response += 'for ' + gametype + ' (' + game.description + ')\n';

	for ( let serverName in module.exports.servers ) {
		let server = module.exports.servers[serverName];
		if ( server.gametypes.indexOf( gametype ) === -1 ) {
			continue;
		}
		response += '\n* querying ' + serverName + ' at `' + server.ip + ':' + server.port + '`\n';
		jkutils.createSocket(
			( err, socket ) => {
				if ( err ) {
					return console.log( err );
				}

				socket.sendServerCommand.getinfo(
					{
						ip: server.ip,
						port: server.port,
						challenge: 'jkpug-query',
					},
					( err, info ) => {
						if ( err ) {
							return console.log( 'error: ' + err );
						}
						console.log( 'info: ' + info );
					}
				);

				socket.on(
					'infoResponse',
					( info, ip, port ) => {
						console.log( 'info: ' + JSON.stringify( info, null, 4 ) );
						if ( game.require_empty && info.clients != 0 ) {
							console.log( 'skipping non-empty server: ' + jkutils.stripColours( info.hostname ) );
							return;
						}
						if ( game.protocol !== Number( info.protocol ) ) {
							console.log(
								'skipping server on different protocol (' + game.protocol + ' != '
								+ Number( info.protocol ) + '): ' + jkutils.stripColours( info.hostname )
							);
							return;
						}
						callback( info, ip, port );
						socket.close();
						socket = null;
					}
				);
			}
		);
	}

	console.log( response );
}

let handlers = {
	'run': ( args ) => {
		// TODO: parse valid games + servers from config
		let frontends = {
			'discord': () => {
				jkpug_discord = require( './jkpug-discord' );
				jkpug_discord.run();
			},
			'irc': () => {
				jkpug_irc = require( './jkpug-irc' );
				jkpug_irc.run();
			},
		};

		if ( args.length === 0 ) {
			return console.log( 'please specify a frontend:\n  ' + Object.keys( frontends ).join( '\n  ' ) );
		}

		for ( let frontend in frontends ) {
			if ( args.indexOf( frontend ) !== -1 ) {
				let dispatch = frontends[frontend];
				dispatch();
			}
		}
	},
};

if ( !module.parent ) {
	console.log( 'running jkpug from cli' );

	// cut off the process and script name
	let args = process.argv.slice( 2 );

	let handlerFunc = handlers[args[0]];
	if ( handlerFunc ) {
		return handlerFunc( args.slice(1) );
	}

	console.log( 'please specify a command:\n  ' + Object.keys( handlers ).join( '\n  ' ) );
}
