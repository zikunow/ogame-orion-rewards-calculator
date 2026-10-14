const {test}=require('node:test');
const assert=require('node:assert/strict');
const E=require('../expeditions-core.js');
const calc=overrides=>E.calculate({...E.defaults,...overrides});
test('discoverer + pathfinder at eco 8 reaches 120M metal and rounded expected yields',()=>{const r=calc();assert.equal(r.metalMax,120e6);assert.equal(r.resources,6720000);assert.equal(r.ships,2628000);assert.equal(r.daily,448704000);});
test('resource and ship upgrades remain independent',()=>{const a=calc(),b=calc({resourceBonus:100});assert.equal(b.resources,a.resources*2);assert.equal(b.ships,a.ships);});
test('manual maxima include bonuses once; fuel is converted into MSU',()=>{const r=calc({manual:1,metalMax:100e6,fleetMetalMax:200e6,resourceBonus:100,shipBonus:100,fuel:1000,loss:200,scrap:75});assert.equal(r.resources,5600000);assert.equal(r.ships,4380000);assert.equal(r.net,5600000+4380000*.75-3000-200);});
test('derived probabilities reproduce forum arithmetic with explicit assumptions',()=>{const r=calc({model:1});assert.ok(Math.abs(r.resourceRate-.0558971875)<1e-12);assert.ok(Math.abs(r.shipRate-.0218728125)<1e-12);});
test('bracket boundaries and invalid input',()=>{assert.equal(calc({topPoints:99999999}).base,4200000);assert.equal(calc({topPoints:100000000}).base,5000000);assert.throws(()=>calc({slots:1.2}));assert.throws(()=>calc({fuel:NaN}));assert.throws(()=>calc({resourceChance:90,shipChance:20}));});
