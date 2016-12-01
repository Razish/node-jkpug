#!/usr/bin/env node

'use strict';

// JKPug discord bot

// core packages

// third party packages
const discord = require( 'discord.io' );
const jkutils = require( 'jkutils' );

// local modules
const jkpug = require( './jkpug' );
const utils = require( './utils' );

// local configuration
let config = require( './config.json' ).discord;

module.exports.run = function() {
	let client = new discord.Client({
		autorun: true,
		token: config.token,
	});

	client.on(
		'disconnect',
		( err, code ) => {
			if ( code === 1001 ) {
				// cloudflare websocket update
				console.log( 'reconnecting after cloudfare websocket update' );
				setTimeout( client.connect, 10000 );
			}
			else {
				console.log( 'unhandled error code: ' + code );
				console.log( 'msg: ' + err );
			}
			setTimeout( client.connect, 10000 );
		}
	);

	client.on(
		'message',
		( user, userID, channelID, message, event ) => {
			console.log( '[MSG/#' + client.channels[channelID].name + '] <' + user + '> ' + client.fixMessage( message ) );

			if ( !client.users[userID] ) {
				// this has happened, i don't know how
				return;
			}

			if ( client.users[userID].bot ) {
				// obviously ignore bots, including ourselves
				return;
			}

			if ( client.channels[channelID].name !== 'pug' ) {
				// only respond to #pug channel
				return;
			}

			let toks = message.split( ' ' );
			if ( toks[0] === '!add' ) {
				if ( toks.length == 1 ) {

				}
				let toAdd = toks.slice( 1 );
				let response = '';
				for ( let gametype of toAdd ) {
					let game = jkpug.games[gametype];

					// check if gametype exists
					if ( !game ) {
						client.sendMessage({
							to: channelID,
							message: user + ': I don\'t know that gametype :(\n'
								+ 'try: ' + Object.keys( jkpug.games ).join( ', ' ),
						});
						continue;
					}


					if ( !game.added ) {
						game.added = {};
					}
					if ( game.added[userID] ) {
						response += 'Renewing your subscription to ' + gametype + '\n';
						game.added[userID] = utils.timestamp();
					}
					else {
						response += 'Thanks for subscribing!\n';
						game.added[userID] = utils.timestamp();
					}
					let players = Object.keys( game.added ).map(
						( element, index, array ) => {
							return client.users[element].username;
						}
					);
					let count = players.length;
					if ( count >= game.threshold ) {
						response += '*** W I N N E R   W I N N E R   C H I C K E N   D I N N E R***\n';
						response += 'Attention **' + gametype + '**: ' + players.join( '. ' ) + '\n';
						response += 'now attempting to find a server...';
						process.nextTick(
							() => {
								jkpug.findServer(
									gametype,
									channelID,
									( info, ip, port ) => {
										client.sendMessage({
											to: channelID,
											message: user + ': ' + jkutils.stripColours( info.hostname ) + ' ('
											+ info.clients + '/' + info.sv_maxclients + ') `' + ip + ':' + port + '`'
										});
										for ( let userID in game.added ) {
											delete game.added[userID];
										}
									}
								);
							}
						);
						break;
					}
					else {
						response += gametype + ' has ' + count + '/' + game.threshold + ' players queued\n';
					}
				}
				if ( response ) {
					return client.sendMessage({
						to: channelID,
						message: user + ': ' + response,
					});
				}
			}

			else if ( toks[0] === '!remove' ) {
				let toRemove = (toks.length > 1)
					? toks.slice( 1 )
					: Object.keys( jkpug.games );
				let response = 'Removing you from ' + toRemove.join( ', ' ) + '\n';
				for ( let gametype of toRemove ) {
					let game = jkpug.games[gametype];

					// check if gametype exists
					if ( !game ) {
						client.sendMessage({
							to: channelID,
							message: user + ': no such gametype ' + gametype + ' :(\n'
								+ 'try: ' + Object.keys( jkpug.games ).join( ', ' ),
						});
						continue;
					}
					if ( !game.added ) {
						game.added = {};
						//response += '- You\'re not queued for ' + gametype + '\n'
						continue;
					}
					if ( !game.added[userID] ) {
						//response += '- You\'re not queued for ' + gametype + '\n'
						continue;
					}
					delete game.added[userID];
					response += '* Removed from ' + gametype + ' (now ' + Object.keys( game.added ).length + '/'
						+ game.threshold + ')\n'
				}
				return client.sendMessage({
					to: channelID,
					message: user + ': ' + response,
				});
			}
			else if ( toks[0] === '!games' ) {
				let response = '';
				for ( let gametype in jkpug.games ) {
					let game = jkpug.games[gametype];
					if ( !game.added ) {
						game.added = {};
					}
					let count = Object.keys( game.added ).length;
					let addedNames = Object.keys( game.added ).map(
						( element, index, array ) => {
							return client.users[element].username;
						}
					).join( ', ' );
					response += gametype + ' has ' + count + '/' + game.threshold + ' players queued'
					if ( count ) {
						response += ' (' + addedNames + ')';
					}
					response += '\n'
				}
				return client.sendMessage({
					to: channelID,
					message: user + ': ' + response,
				});
			}
			else if ( toks[0] === '!servers' ) {
				let response = 'Listing PUG servers ';
				let gametype = (toks.length === 2) ? toks[1] : null;
				if ( toks.length === 2 ) {
					let game = jkpug.games[gametype];
					if ( !game ) {
						return client.sendMessage({
							to: channelID,
							message: user + ': I don\'t know that gametype :(\n'
								+ 'try: ' + Object.keys( jkpug.games ).join( ', ' ),
						});
					}
					response += 'for ' + gametype + ' (' + game.description + ')\n';
				}
				client.sendMessage({
					to: channelID,
					message: user + ': ' + response,
				});

				for ( let serverName in jkpug.servers ) {
					let server = jkpug.servers[serverName];
					if ( gametype && server.gametypes.indexOf( gametype ) === -1 ) {
						continue;
					}

					jkutils.createSocket(
						( err, socket ) => {
							function noResponse() {
								let msg = '**' + serverName + '** ';
								if ( server.password ) {
									msg += '(:lock:) ';
								}
								if ( !gametype ) {
									msg += ' [' + server.gametypes.join( ', ' ) + '] ';
								}
								msg += '(no response) ';
								msg += '`' + server.ip + ':' + server.port + '`';
								client.sendMessage({
									to: channelID,
									message: msg,
								});
							}
							if ( err ) {
								return console.log( err );
							}

							let timeoutResponse = {};
							timeoutResponse[server.ip+':'+server.port] = {};
							if ( !socket ) {
								noResponse();
								return;
							}
							else {
								timeoutResponse[server.ip+':'+server.port]['getinfo'] = setTimeout(
									() => {
										if ( !socket ) {
											// this has already been done, the timeout is useless
											return;
										}
										//console.log( 'timeout for socket on getinfo' );
										noResponse();
										socket.close();
										socket = null;
									},
									5000
								);
							}

							socket.sendServerCommand.getinfo(
								{
									ip: server.ip,
									port: server.port,
									challenge: 'jkpug-query',
								},
								( err ) => {
									if ( err ) {
										return console.log( 'error: ' + err );
									}
								}
							);
							socket.on(
								'infoResponse',
								( info, ip, port ) => {
									if ( timeoutResponse[server.ip+':'+server.port]['getinfo'] ) {
										clearTimeout( timeoutResponse[server.ip+':'+server.port]['getinfo'] );
										timeoutResponse[server.ip+':'+server.port]['getinfo'] = null;
									}
									//console.log( 'info: ' + JSON.stringify( info, null, 4 ) );
									let msg = '**' + serverName + '** ';
									if ( server.password ) {
										msg += '(:lock:) ';
									}
									if ( !gametype ) {
										msg += ' [' + server.gametypes.join( ', ' ) + '] ';
									}
									msg += '(' + info.clients + '/' + info.sv_maxclients + ' on ' + info.mapname + ') ';
									msg += '`' + server.ip + ':' + server.port + '`';

									client.sendMessage({
										to: channelID,
										message: msg,
									});

									// we're done, close the socket
									socket.close();
									socket = null;
								}
							);
						}
					);
				}
			}
		}
	);

	client.on(
		'presence',
		( user, userID, status, game, event ) => {
			let obj = { user, userID, status, game, event };
			//console.log( 'presence: ' + JSON.stringify( obj ) );
		}
	);

	client.on(
		'ready',
		( event ) => {
			console.log( 'Logged in as %s / %s', client.username, client.id );
			//console.log( 'servers: ' + JSON.stringify( client.servers, null, 4 ) );
			//console.log( 'channels: ' + JSON.stringify( client.channels, null, 4 ) );
			//console.log( 'users: ' + JSON.stringify( client.users, null, 4 ) );
		}
	);
}

let handlers = {
	'run': ( args ) => {
		jkpug_discord.run();
	},
};

if ( !module.parent ) {
	console.log( 'running jkpug_discord from cli' );

	// cut off the process and script name
	let args = process.argv.slice( 2 );

	let handlerFunc = handlers[args[0]];
	if ( handlerFunc ) {
		return handlerFunc( args );
	}

	console.log( 'please specify a command:\n  ' + Object.keys( handlers ).join( '\n  ' ) );
}
