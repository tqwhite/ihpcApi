#!/usr/local/bin/node
'use strict';
const qtoolsGen = require('qtools');
const qtools = new qtoolsGen(module);
const async = require('async');

const dispatchGen = require('./dispatch');
const webInit = require('./web-init');
const apiManager = require('./api-manager');
const staticPageDispatch = require('./staticPageDispatch');

let multiIni = require('multi-ini');
multiIni= new multiIni.Class({
	filters:[
		(value)=>{
			if (isNaN(+value)){
				return value;
			}
			else{
				return +value
			}
		}
	]
});

//START OF moduleFunction() ============================================================

var moduleFunction = function() {
	//VALIDATION ====================================

	if (!process.env.srapiProjectPath) {
		var message = 'there must be an environment variable: srapiProjectPath';
		qtools.logError(message);
		return message;
	}
	if (!process.env.USER) {
		var message = 'there must be an environment variable: USER';
		qtools.logError(message);
		return message;
	}
	var configPath =
		process.env.srapiProjectPath +
		'configs/instanceSpecific/ini/' +
		process.env.USER +
		'.ini';
	if (!qtools.realPath(configPath)) {
		var message = 'configuration file ' + configPath + ' is missing';
		qtools.logError(message);
		return message;
	}

	//LOCAL VARIABLES ====================================

	let webReport = [];
	let workerList = {};

	//LOCAL FUNCTIONS ====================================

	//METHODS AND PROPERTIES ====================================

	//INITIALIZATION ====================================

	/*
		Be aware: This application is organized to allow access
		based on a JSON Web Token. In addition to initializing expressjs
		web-init initalizes the permissionMaster. Before an
		expressjs route is acted upon, it has to be approved by
		permissionMaster. 

	*/

	const upgradeConfigItems = config => {
		const outObj = qtools.clone(config);

		for (var i in config.arrayItems) {
			var element = config.arrayItems[i];
			qtools.putSurePath(outObj, element, 'placeholder');

			const inObj = qtools.getSurePath(config, element, []);

			const outArray = [];
			for (i in inObj) {
				outArray[i] = inObj[i];
			}
			qtools.putSurePath(outObj, element, outArray);
		}

		return outObj;
	};

	let config;

	const startSystem = () => {
		config = multiIni.read(configPath);
		config.user = process.env.USER;

		config = upgradeConfigItems(config);
		global.applicationLoggingIdString=config.system.applicationLoggingIdString;
		qtools.logNote(`\n**==*: Starting ${config.system.name} SERVER SSO  \n`);

		const startList = [];

		startList.push(done => {
			const workerName = 'apiManager';
			new apiManager({
				config: config,
				initCallback: function() {
					workerList[workerName] = this;
					done();
				}
			});
		});

		startList.push(done => {
			const workerName = 'webInit';
			new webInit({
				config: config,
				apiManager: workerList.apiManager.init(workerName),
				initCallback: function() {
					workerList[workerName] = this;
					done();
				}
			});
		});

		startList.push(done => {
			const workerName = 'dispatch';
			new dispatchGen({
				config: config,
				apiManager: workerList.apiManager.init(workerName),
				router: workerList.webInit.router,
				permissionMaster: workerList.webInit.permissionMaster,
				initCallback: function() {
					workerList[workerName] = this;
					done();
				}
			});
		});

		startList.push(done => {
			const workerName = 'staticPageDispatch/';
			new staticPageDispatch({
				filePathList: qtools.convertNumericObjectToArray(
					config.system.staticPageLibraryFilePathList
				),
				router: workerList.webInit.router,
				reportPath: urlSegment => {
					workerList.apiManager.getApi(
						'databaseApiServer.bookNumbers.users.session.boilerplate.registerStaticPath'
					)(urlSegment);
					workerList.webInit.permissionMaster.getAccessControl({
						clientName: workerName,
						role: 'all'
					})(urlSegment);
				},
				initCallback: function() {
					workerList[workerName] = this;
					done();
				}
			});
		});

		async.series(startList, () => {
			workerList.webInit.startServer();
			// 			workerList.apiManager.list('dispatch');
			// 			workerList.apiManager.getApi('webInit.listPaths')();
		});
	};

	const cleanup = () => {
		let nameString = '';
		for (var i in workerList) {
			workerList[i] = null;
			nameString += `${i}, `;
		}
		qtools.message(
			`[${nameString.replace(/, $/, '')}] were flushed at ${Date.now()}`
		);

		workerList = {};
	};

	//START SYSTEM =======================================================
	startSystem();

	//for each thing that needs shutting down
	// 	workerList.dispatch = new dispatchGen({
	// 		config: config
	// 	});
	// 	workerList.push(workerList.dispatch);

	//SET UP SIGNAL LISTENERS =======================================================

	const buildShutdownList = message => {
		const shutdownList = [];
		for (var i in workerList) {
			var worker = workerList[i];
			shutdownList.push(
				(i => {
					return done => {
						workerList[i].shutdown(message, done);
					};
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
	};

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
