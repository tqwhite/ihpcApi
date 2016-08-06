#!/usr/local/bin/node
'use strict';
const qtoolsGen = require('qtools');
const qtools = new qtoolsGen(module);
const multiIni = require('multi-ini');
const async = require('async');

const dispatchGen = require('./dispatch');
const webInit = require('./web-init');

//START OF moduleFunction() ============================================================

var moduleFunction = function() {

	//VALIDATION ====================================

	if (!process.env.srapiProjectPath) {
		var message = "there must be an environment variable: srapiProjectPath";

		console.log(message);
		return (message);
	}
	if (!process.env.USER) {
		var message = "there must be an environment variable: USER";

		console.log(message);
		return (message);
	}
	var configPath = process.env.srapiProjectPath + 'configs/instanceSpecific/ini/' + process.env.USER + '.ini';
	if (!qtools.realPath(configPath)) {
		var message = "configuration file " + configPath + " is missing";

		console.log(message);
		return (message);
	}

	//LOCAL VARIABLES ====================================

	let webReport = [];
	let workerList = {};

	//LOCAL FUNCTIONS ====================================

	//METHODS AND PROPERTIES ====================================

	//INITIALIZATION ====================================

	let config;

	const startSystem = () => {
		config = multiIni.read(configPath);
		config.user = process.env.USER;

		const startList = [];

		startList.push((done) => {
			const workerName = 'webInit'
			new webInit({
				config: config,
				initCallback: function() {
					workerList[workerName] = this; done();
				}
			});
		});

		startList.push((done) => {
			const workerName = 'dispatch'
			new dispatchGen({
				config: config,
				router: workerList.webInit.router,
				permissionMaster: workerList.webInit.permissionMaster,
				initCallback: function() {
					workerList[workerName] = this; done();
				}
			});
		});

		async.series(startList, () => {
			workerList.webInit.startServer();
		});

	};

	const cleanup = () => {
		let nameString = '';
		for (var i in workerList) {
			workerList[i] = null;
			nameString += `${i}, `;
		}
		qtools.message(`[${nameString.replace(/, $/, '')}] were flushed at ${Date.now()}`);

		workerList = {};
	}

	//START SYSTEM =======================================================
	startSystem();

	//for each thing that needs shutting down
	// 	workerList.dispatch = new dispatchGen({
	// 		config: config
	// 	});
	// 	workerList.push(workerList.dispatch);

	//SET UP SIGNAL LISTENERS =======================================================

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

	//this is presently not attached to anything
	const restart = () => {
		async.parallel(buildShutdownList('restart'), () => {
			cleanup();
			startSystem();
		});
	}

	process.on('SIGINT', () => {

		if (this.interruptInProcess) {
			process.nextTick(() => {
				this.interruptInProcess = false;
			});
			return;
		}
		this.interruptInProcess = true;

		async.parallel(buildShutdownList('SIGINT'), () => {
			cleanup();
			qtools.die('SIGINT');
		});
	});

	process.on('SIGTERM', () => {

		if (this.interruptInProcess) {
			process.nextTick(() => {
				this.interruptInProcess = false;
			});
			return;
		}
		async.parallel(buildShutdownList('SIGTERM'), () => {
			cleanup();
			qtools.die('SIGTERM');
		});
	});
	return this;
};

//END OF moduleFunction() ============================================================

//module.exports = moduleFunction;
module.exports = new moduleFunction();

