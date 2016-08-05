'use strict';
const qtoolsGen = require('qtools');
const qtools = new qtoolsGen(module);
const async = require('async');

const mongoose = require('mongoose');

const usersGen = require('users');
const sessionsGen = require('sessions');

//START OF moduleFunction() ============================================================

var moduleFunction = function(args) {

	qtools.validateProperties({
		subject: args || {},
		targetScope: this, //will add listed items to targetScope
		propList: [
			{
				name: 'config',
				optional: false
			},
			{
				name: 'router',
				optional: false
			},
			{
				name:'permissionMaster',
				optional:false
			}
		]
	});

	//LOCAL VARIABLES ====================================

	let db = mongoose.connect(this.config.database.connectionString).connection;

	let workerList = {};

	//LOCAL FUNCTIONS ====================================

	const startSystem = () => {
		const argsPackage = {
			config: this.config,
			router: this.router,
			permissionMaster:this.permissionMaster,
			mongoose: mongoose
		}

		const usersModel=new usersGen(argsPackage);
		workerList.users = usersModel;
		
		workerList.sessions = new sessionsGen({
			config: this.config,
			router: this.router,
			permissionMaster:this.permissionMaster,
			usersModel: usersModel
		});
	};

	const buildShutdownList = (message) => {
		const shutdownList = [];
		for (var i in workerList) {
			var worker = workerList[i];
			shutdownList.push(
				((i) => {
					return (done) => {
						workerList[i].shutdown(message, done)
					}
				})(i)
			);
		}
		return shutdownList;
	};

	const cleanup = (callback) => {
		let nameString = '';
		for (var i in workerList) {
			workerList[i] = null;
			nameString += `${i}, `;
		}
		workerList = {};
		db.close((err) => {
			nameString += `mongoConnection, `;
			qtools.message(`[${nameString.replace(/, $/, '')}] were flushed at ${Date.now()}`);
			callback(err);
		});
	}

	//METHODS AND PROPERTIES ====================================

	this.shutdown = (message, callback) => {
		async.parallel(buildShutdownList(message), () => {
			cleanup((err) => {
				callback(err, message)
			});

		});
	}

	//INITIALIZATION ====================================

	db.on('error', console.error.bind(console, `connection error: ${this.config.database.connectionString}`));
	db.once('open', startSystem);

	//START SYSTEM =======================================================

	return this;
};

//END OF moduleFunction() ============================================================

module.exports = moduleFunction;
//module.exports = new moduleFunction();

