#!/usr/local/bin/node
'use strict';
const qtoolsGen = require('qtools');
const qtools = new qtoolsGen(module);
const multiIni = require('multi-ini');
const async = require('async');

const utilityServerGen = require('../utilityServer');
const databaseApiServerGen = require('../database-api-server');
const mailToolServerGen = require('../mail-tool');

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
				name: 'apiManager',
				optional: false
			},
			{
				name: 'router',
				optional: false
			},
			{
				name: 'permissionMaster',
				optional: false
			},
			{
				name: 'initCallback',
				optional: false
			}
		]
	});

	//LOCAL VARIABLES ====================================

	let workerList = {};

	//LOCAL FUNCTIONS ====================================

	const startSystem = () => {

		const startList = [];

		startList.push((done) => {
			const workerName = 'utilityServer'
			new utilityServerGen({
				config: this.config,
				router: this.router,
				permissionMaster: this.permissionMaster,
				initCallback: function() {
					workerList[workerName] = this; done();
				}
			});
		});

		startList.push((done) => {
			const workerName = 'databaseApiServer'
			new databaseApiServerGen({
				config: this.config,
				router: this.router,
				apiManager:this.apiManager.init(workerName, 'newRoot'),
				permissionMaster: this.permissionMaster,
				initCallback: function() {
					workerList[workerName] = this; done();
				}
			});
		});

		startList.push((done) => {
			const workerName = 'mailTool'
			new mailToolServerGen({
				config: this.config,
				router: this.router,
				apiManager:this.apiManager.init(workerName, 'newRoot'),
				permissionMaster: this.permissionMaster,
				initCallback: function() {
					workerList[workerName] = this; done();
				}
			});
		});

		async.series(startList, () => {
			this.initCallback()
		});
	};

	//METHODS AND PROPERTIES ====================================

	//INITIALIZATION ====================================

	//START SYSTEM =======================================================
	
	startSystem();

	//SHUTDOWN FUNCTIONS ====================================	

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

	const cleanup = () => {
		let nameString = '';
		for (var i in workerList) {
			workerList[i] = null;
			nameString += `${i}, `;
		}
		qtools.message(`[${nameString.replace(/, $/, '')}] were flushed at ${Date.now()}`);
		workerList = {};
	}

	this.shutdown = (message, callback) => {
		async.parallel(buildShutdownList(message), () => {
			cleanup();
			callback('', message);
		});
	}
	
	
	return this;
};

//END OF moduleFunction() ============================================================

module.exports = moduleFunction;
//module.exports = new moduleFunction();

