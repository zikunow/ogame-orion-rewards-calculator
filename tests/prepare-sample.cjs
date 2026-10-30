// Test-only local copy of the dataset already published by the planner.
// The sample is gitignored and is not included in the deployed calculators.
const fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');
const url='https://raw.githubusercontent.com/zikunow/ogame-orion-upgrade-planner/084b6a37aebc550b8a14547e1554be00e6bac71a/anomaly-sample.js';
(async()=>{
 const r=await fetch(url,{signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error('Sample download: '+r.status);
 const text=await r.text();const sha=crypto.createHash('sha1').update('blob '+Buffer.byteLength(text)+'\0').update(text).digest('hex');
 if(sha!=='aac7c3653238b4e4950971f7373afc534c1c06f2')throw Error('Published sample version differs');
 fs.writeFileSync(path.join(__dirname,'../shared/anomaly-sample.js'),text);console.log('Prepared published planner sample for tests');
})().catch(e=>{console.error(e);process.exitCode=1});
