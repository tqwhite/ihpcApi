#!/usr/bin/env node
'use strict';

const srapiProjectPath = '/home/api/prod/system/';
const moduleName = __filename.replace(__dirname + '/', '').replace(/.js$/, ''); //this just seems to come in handy a lot
//const projectRoot=fs.realpathSync(path.join(__dirname, '..', '..')); // adjust the number of '..' to fit reality

const qt = require('qtools-functional-library'); //console.dir(qt.help());
const path = require('path');
// const fs=require('fs');;

const commandLineParser = require('qtools-parse-command-line');
const commandLineParameters = commandLineParser.getParameters();

process.global = {};
process.global.xLog = require('./lib/x-log');

const assembleConfigurationShowHelpMaybeExit = require('./lib/assemble-configuration-show-help-maybe-exit');

//START OF moduleFunction() ============================================================
// ln -sf /home/api/prod/system/code/ihpcCli/ihpc-cli/index.js /usr/bin/ihpcCli

const moduleFunction = async function(args = {}) {
	const configPath = path.join(
		srapiProjectPath,
		'configs/instanceSpecific/ini/apiprod.ini'
	);

	const { xLog } = process.global;

	const {
		getConfig,
		commandLineParameters,
		rawConfig
	} = assembleConfigurationShowHelpMaybeExit({ configPath });
	// 	Object.freeze(config);
	// 	Object.freeze(rawConfig);
	// 	Object.freeze(commandLineParameters);

	const { MongoClient } = require('mongodb');

	const dbConfig = getConfig('database');

	const url = dbConfig.connectionString;
	const client = new MongoClient(url);
	const dbName = 'ihpcProd';
	
	async function init({ client }) {
		// Use connect method to connect to the server
		await client.connect();
		const db = client.db(dbName);

		const boilerplatesCollection = db.collection('boilerplates');
		const booknumbersCollection = db.collection('booknumbers');
		const messagesCollection = db.collection('messages');
		const plansCollection = db.collection('plans');
		const studentplansaccessesCollection = db.collection(
			'studentplansaccesses'
		);
		const studentsCollection = db.collection('students');
		const transfersCollection = db.collection('transfers');
		const userStatsCollection = db.collection('userStats');
		const usersCollection = db.collection('users');
		const userstudentsaccessesCollection = db.collection(
			'userstudentsaccesses'
		);

		return {
			boilerplatesCollection,
			booknumbersCollection,
			messagesCollection,
			plansCollection,
			studentplansaccessesCollection,
			studentsCollection,
			transfersCollection,
			userStatsCollection,
			usersCollection,
			userstudentsaccessesCollection
		};
	}
	
	let workingFunction;
	
	if (
		commandLineParameters.values.refId ||
		commandLineParameters.values.bookNumber
	) {
		

		workingFunction = require('./lib/user-detail')({requestValues:commandLineParameters.values});
	} else {
		workingFunction = require('./lib/redacted-user-summary')();
	}
	
	let outputFunction;
	if (commandLineParameters.switches.json){
	
		outputFunction=result=>console.log(JSON.stringify(result, '', '    '));
	
	}
	else if (commandLineParameters.switches.tsv){
		const jsonToTsv=require('./lib/json-to-tsv');
		outputFunction=result=>console.log(jsonToTsv(result));
	}
	else{
		outputFunction=result=>console.dir(result, { showHidden: false, depth: 2, colors: true });

	}
	
	init({ client })
		.then(collections =>
			workingFunction({ collections })
		)
		.then(result =>
			outputFunction(result)
		)
		.catch(console.error)
		.finally(() => client.close()); //missing client.close() prevents the program from exiting

	
};
//END OF moduleFunction() ============================================================

moduleFunction();

// boilerplates
// booknumbers
// messages
// plans
// studentplansaccesses
// students
// transfers
// userStats
// users
// userstudentsaccesses

// first name
// last name
// username
// email
// secondary email
// book code
// student count
// plan count
// last day in subscription
