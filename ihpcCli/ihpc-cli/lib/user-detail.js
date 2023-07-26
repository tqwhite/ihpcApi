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

const moduleFunction = function(args = {}) {

const {refId, bookNumber}=args.requestValues;



	async function main({ collections }) {
		// Use connect method to connect to the server
		const {
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
		} = collections;
		
		
	
		let criterion;

		if (refId) {
			criterion={
				refId: refId.qtLast()
			};

		} else if (bookNumber) {

		const booknumbers = await booknumbersCollection
			.find({ number:bookNumber.qtLast() })
			.toArray();


			criterion={
				refId: booknumbers.qtLast().userRefId
			};


		}		
		
		
		
		

		const users = await usersCollection
			.find(criterion)
			.toArray();
		
	

		const userRefIdList = users.map(item => item.refId);
		const booknumbers = await booknumbersCollection
			.find({ userRefId: { $in: userRefIdList } })
			.toArray();

		const studentplansaccesses = await studentplansaccessesCollection
			.find({})
			.toArray();

		const userstudentsaccessesActual = await userstudentsaccessesCollection
			.find({ userRefId: { $in: userRefIdList } })
			.toArray();

		const userstudentsaccesses = userstudentsaccessesActual.qtMapProperties({
			hello: (item, name, entire) =>
				studentplansaccesses.filter(plansItem =>
					entire.studentRefIdList.includes(plansItem.studentRefId)
				)
		});

		// 		add --refId=, --bookNumbe=
		// 		add help, validation
		// 		add output file support
		// 		add toTsv
		//
		// prettier-ignore
		const userOut = users
			.qtMapProperties({
				
// 				first:item=>item.replace(/^(.).*$/, "$1*****"),
// 				last:item=>item.replace(/^(.).*$/, "$1*****"),
// 				emailAddress:item=>item?item.replace(/^.*@(.*)$/, "*****@$1"):undefined,
// 				emailAddressSecondary:item=>item?item.replace(/^.*@(.*)$/, "*****@$1"):undefined,
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
				})
			.qtSelectProperties(
				['first', 'last', 'emailAddress', 'emailAddressSecondary','plansCount', 'studentCount', 'bookNumber', 'renewals', 'lastLoginDaysAgo', 'remainingSubscriptionDays', 'subscriptionLongevityDays',  'lastDayInSubscription', 'acumenAccountId', 'refId', 'lastLogin', 'createdAt',  'exportDate', ],
				{moreDefaultValues:{exportDate:()=>new Date().toLocaleString()}, NOTE:"THIS CLAUSE IS HERE TO SET THE ORDER OF THE PROPERTIES IN THE FINAL OBJECT"}
				);

		return userOut;
	}

	return main;
};

//END OF moduleFunction() ============================================================

module.exports = moduleFunction;
//module.exports = new moduleFunction();
//moduleFunction().workingFunction().qtDump();

