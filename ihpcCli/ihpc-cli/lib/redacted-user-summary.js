#!/usr/bin/env node
'use strict';

const moduleName = __filename.replace(__dirname + '/', '').replace(/.js$/, ''); //this just seems to come in handy a lot
//const projectRoot=fs.realpathSync(path.join(__dirname, '..', '..')); // adjust the number of '..' to fit reality

const qt = require('qtools-functional-library'); //console.dir(qt.help());

//npm i qtools-functional-library
//npm i qtools-config-file-processor
//npm i qtools-parse-command-line

// const path=require('path');
// const fs=require('fs');

// const configFileProcessor = require('qtools-config-file-processor');
//const config = configFileProcessor.getConfig('systemConfig.ini', __dirname)[__filename.replace(__dirname+'/', '').replace(/.js$/, '')];

// const commandLineParser = require('qtools-parse-command-line');
// const commandLineParameters = commandLineParser.getParameters();

//START OF moduleFunction() ============================================================

const moduleFunction =  function(args = {}) {
	const { xLog } = process.global;


	async function main({collections}) {
		// Use connect method to connect to the server
		const {boilerplatesCollection, booknumbersCollection, messagesCollection, plansCollection, studentplansaccessesCollection, studentsCollection, transfersCollection, userStatsCollection, usersCollection, userstudentsaccessesCollection, }=collections;

		xLog.status('Extracting all users. This will take at least two minutes');
		

		xLog.status(`Getting Users.`);
		
		const users = await usersCollection
			.find()
// 			.skip(100)
// 			.limit(10)
			.toArray();
			
		xLog.status(`Found ${users.length} users.`);

		xLog.status(`Getting BookNumbers.`);
		
		const userRefIdList = users.map(item => item.refId);
		const booknumbers = await booknumbersCollection
			.find({ userRefId: { $in: userRefIdList } })
			.toArray();
			
		xLog.status(`Getting Plans.`);

		const studentplansaccesses = await studentplansaccessesCollection
			.find({})
			.toArray();
			
		xLog.status(`Getting Students.`);

		const userstudentsaccessesActual = await userstudentsaccessesCollection
			.find({ userRefId: { $in: userRefIdList } })
			.toArray();

		const userstudentsaccesses = userstudentsaccessesActual.qtMapProperties({
			hello: (item, name, entire) =>
				studentplansaccesses.filter(plansItem =>
					entire.studentRefIdList.includes(plansItem.studentRefId)
				)
		});
		xLog.status(`Starting analysis.`);
		
// 		add --refId=, --bookNumbe=
// 		add help, validation
// 		add output file support
// 		add toTsv 
// 		
		// prettier-ignore
		const userOut = users
			.qtMapProperties({
				first:item=>item.replace(/^(.).*$/, "$1*****"),
				last:item=>item.replace(/^(.).*$/, "$1*****"),
				emailAddress:item=>item?item.replace(/^.*@(.*)$/, "*****@$1"):undefined,
				emailAddressSecondary:item=>item?item.replace(/^.*@(.*)$/, "*****@$1"):undefined,
				lastLogin:item=>item?item.toLocaleDateString():'',
				lastDayInSubscription:item=>item.toLocaleDateString(),
				createdAt:item=>item.toLocaleDateString(),
				subscriptionLongevityDays:(item, name, entire)=>Math.ceil((entire.lastDayInSubscription - entire.createdAt) / (1000 * 60 * 60 * 24)),
				remainingSubscriptionDays:(item, name, entire)=>Math.ceil((entire.lastDayInSubscription - new Date())/ (1000 * 60 * 60 * 24)) ,
				lastLoginDaysAgo:(item, name, entire)=>Math.ceil((new Date()- entire.lastLogin) / (1000 * 60 * 60 * 24)),
				studentRefIdList:(item, name, entire)=>userstudentsaccesses.filter(accessItem=>accessItem.userRefId==entire.refId).qtPop({}).qtGetSurePath('studentRefIdList', []),
				})
			.qtMapProperties({
				plansCount:(item, name, entire)=>studentplansaccesses.filter(plansItem=>entire.studentRefIdList.includes(plansItem.studentRefId)).qtSelectProperties({planRefIdList:[]}).reduce((result, item)=>result+item.planRefIdList.length, 0),
				studentCount:(item, name, entire)=>entire.studentRefIdList.length,
				bookNumber:(item, name, entire)=>booknumbers.filter(bookNumberItem=>bookNumberItem.userRefId==entire.refId).filter(bookNumberItem=>bookNumberItem.number.match(/^[A-Z0-9]{6}$/i)).qtSelectProperties(['number']).qtPop({}).number,
				renewals:(item, name, entire)=>booknumbers.filter(bookNumberItem=>bookNumberItem.userRefId==entire.refId).filter(bookNumberItem=>bookNumberItem.number.length>6).length,
				lookupCommand1:(item, name, entire)=>`ihpcCli -getUserPersonal --refId='${entire.refId}'`,
				})
			.qtMapProperties({
				lookupCommand2:(item, name, entire)=>`ihpcCli -getUserPersonal --bookNumber='${entire.bookNumber}'`,

				})
			.qtSelectProperties(
				['plansCount', 'studentCount', 'bookNumber', 'renewals', 'lastLoginDaysAgo', 'remainingSubscriptionDays', 'subscriptionLongevityDays',  'lastDayInSubscription', 'acumenAccountId', 'refId', 'lookupCommand2', 'lookupCommand1', 'lastLogin', 'createdAt', 'first', 'last', 'emailAddress', 'emailAddressSecondary', 'exportDate', ],
				{moreDefaultValues:{exportDate:()=>new Date().toLocaleString()}, NOTE:"THIS CLAUSE SELECTS OUTPUT PROPERTIES AND CONTROLS THE ORDER THEY APPEAR IN THE FINAL OBJECTS"}
				);     
				


		xLog.status(`Analysis complete. Sending results.`);
		return userOut;
	}

	return main;
};

//END OF moduleFunction() ============================================================

module.exports = moduleFunction;
//module.exports = new moduleFunction();
//moduleFunction().workingFunction().qtDump();

