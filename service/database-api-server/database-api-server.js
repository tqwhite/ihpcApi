'use strict';
const qtoolsGen = require('qtools');
const qtools = new qtoolsGen(module);
const async = require('async');

const mongoose = require('mongoose');


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

	let db = mongoose.connect(this.config.database.connectionString).connection;

	let workerList = {};

	//LOCAL FUNCTIONS ====================================

	const startSystem = () => {

		const startList = [];

		const sessionsGen = require('sessions');
		startList.push((done) => {
			const workerName = 'users'
			new usersGen({
				config: this.config,
				router: this.router,
				permissionMaster: this.permissionMaster,
				mongoose: mongoose,
				initCallback: function() {
					workerList[workerName] = this; done();
				}
			});
		});

		const usersGen = require('users');
		startList.push((done) => {
			const workerName = 'session'
			new sessionsGen({
				config: this.config,
				router: this.router,
				permissionMaster: this.permissionMaster,
				usersModel: workerList.users,
				initCallback: function() {
					workerList[workerName] = this; done();
				}
			});
		});
		
		

		const boilerplateGen = require('boilerplate');
		startList.push((done) => {
			const workerName = 'boilerplate'
			new boilerplateGen({
				config: this.config,
				router: this.router,
				permissionMaster: this.permissionMaster,
				mongoose: mongoose,
				initCallback: function() {
					workerList[workerName] = this; done();
				}
			});
		});
		
		

		const studentsGen = require('students');
		startList.push((done) => {
			const workerName = 'students'
			new studentsGen({
				config: this.config,
				router: this.router,
				permissionMaster: this.permissionMaster,
				mongoose: mongoose,
				initCallback: function() {
					workerList[workerName] = this; done();
				}
			});
		});

		const plansGen = require('plans');
		startList.push((done) => {
			const workerName = 'plans'
			new plansGen({
				config: this.config,
				router: this.router,
				permissionMaster: this.permissionMaster,
				mongoose: mongoose,
				initCallback: function() {
					workerList[workerName] = this; done();
				}
			});
		});

		const backupGen = require('backup-database');
		startList.push((done) => {
			const workerName = 'backup-database'
			new backupGen({
				config: this.config,
				initCallback: function() {
					workerList[workerName] = this; done();
				}
			});
		});

		async.series(startList, () => {
			this.initCallback()
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

