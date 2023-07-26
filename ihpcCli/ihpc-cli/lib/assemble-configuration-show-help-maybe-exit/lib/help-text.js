#!/usr/bin/env node
'use strict';


const qt = require('qtools-functional-library');

//START OF moduleFunction() ============================================================

const moduleFunction = function() {
const {xLog}=process.global;


const mainHelp=(args={})=>{


const {configPath, version='n/a', errorMessage=''}=args;

return `
============================================================

NAME

	ihpcCli - Extract and report data from IHPC production database

DESCRIPTION

	ihpcCli looks summarizes user data or provides details. In both cases, user activity
	details are summarized, ie, number of plans, number of students, days since login, etc.
	
	Default is to summarize entire user dataset with personally identifying information
	redacted. 
	
	Two flags, --refid and --bookNumber allow lookup of dtail mode (unredacted) user data based  
	on the entered criterion. To prevent data leakage, this option produces information
	for one user at a time.
	
	For either case, output can be formatted in three ways, JSON, TSV and interactive
	terminal (colored Javascript) output.
	

CONTROLS

	--refId         get data for the user with that refId in detail mode
	--bookNumber    get data for the user with that book number in detail mode
	(default)       get summarized, redacted data for all users
	
	-tsv            produce output in tab separated format
	-json           produce the output in JSON format
	(default)       display in the terminal


OUTPUT

-help, --help	shows this help message. No processing is done.


EXAMPLES

ihpcCli -help
ihpcCli --refId=af6acddc-ebff-49e4-a957-6eaf2e4f077b -tsv
ihpcCli --bookNumber=HTG64V -json

ihpcCli #alone, this show the summary for all users

Remote access:

This will retrieve information from the ihpc server and save it into a ${xLog.color.red('local')} file.

ssh ihpc 'ihpcCli -tsv' > ~/Desktop/clientSummaryData.tsv 

(${xLog.color.green('open ~/Desktop/clientSummaryData.tsv;')} will open this file in Numbers on a Macintosh.)

These will display detailed information for a single user:

ssh ihpc 'ihpcCli --refId=af6acddc-ebff-49e4-a957-6eaf2e4f077b'

ssh ihpc 'ihpcCli --bookNumber=HTG64V'


[version: ${version}]
============================================================
${errorMessage}
`
	;

}

	return ({mainHelp});
};

//END OF moduleFunction() ============================================================

module.exports = moduleFunction();
//moduleFunction().workingFunction().qtDump();

