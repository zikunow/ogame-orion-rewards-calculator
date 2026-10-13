const {test}=require('node:test');
const assert=require('node:assert/strict');
const O=require('../core.js');
const calc=changes=>O.calculate({...O.defaults,...changes});
const close=(a,b,epsilon=.00001)=>assert.ok(Math.abs(a-b)<epsilon,`${a} != ${b}`);
test('original +62% baseline with unenhanced General reproduces experiment',()=>{
  const r=O.meanRewards(1.5,2,.62,.62);
  close(r.resource,728937762.315527);close(r.lithium,23137587.615496);
});
test('default configuration reproduces all cost and reward checkpoints',()=>{
  const r=calc({});
  assert.equal(r.q,4436514);assert.equal(r.ias,702);assert.equal(r.scan,2218257);
  close(r.rewards.resource,795254665.2844315);close(r.rewards.lithium,26893709.00253577);
  close(r.claim,21717567.43137255);close(r.pve,1.64805);close(r.pvp,2.2961);
  assert.equal(O.twiceMsu(r.costs.scanner),2n*53738627841n);
  assert.equal(O.twiceMsu(r.costs.metal)+O.twiceMsu(r.costs.crystal)+O.twiceMsu(r.costs.deut),2n*10439577882n);
  assert.equal(O.twiceMsu(r.costs.lithium),2n*11763442944n);
  assert.equal(O.twiceMsu(r.costs.t18),2n*5157545220n);
  assert.equal(O.twiceMsu(r.total),2n*81099193887n);
});
test('T18 changes rewards and investment but does not change claim costs',()=>{
  const a=calc({t18:0}),b=calc({t18:8});
  assert.equal(a.claim,b.claim);assert.ok(b.rewards.resource>a.rewards.resource);
  assert.ok(b.rewards.lithium>a.rewards.lithium);
});
test('resource and lithium bonuses are independent',()=>{
  const a=calc({}),b=calc({resourceLevel:16}),c=calc({lithiumLevel:19});
  assert.equal(a.rewards.lithium,b.rewards.lithium);assert.equal(a.rewards.resource,c.rewards.resource);
  assert.ok(b.rewards.resource>a.rewards.resource);assert.ok(c.rewards.lithium>a.rewards.lithium);
});
test('used slots change daily totals, not per-flight rewards',()=>{
  const a=calc({usedSlots:3}),b=calc({usedSlots:6});
  assert.deepEqual(a.rewards,b.rewards);close(b.daily.resources,a.daily.resources*2);
  close(b.daily.lithiumChange,a.daily.lithiumChange*2);
  assert.equal(calc({availableSlots:8}).daily.flights,b.daily.flights);
});
test('scan result count changes expected scans, not flight count or scan price',()=>{
  const a=calc({resultsPerScan:3}),b=calc({resultsPerScan:6});
  assert.equal(a.daily.flights,b.daily.flights);assert.equal(a.scan,b.scan);
  close(a.daily.scans,b.daily.scans*2);close(b.scansPerFlight,313/102);
});
test('no General bonus means both multipliers equal one regardless of T18',()=>{
  const a=calc({playerClass:'collector',t18:0}),b=calc({playerClass:'collector',t18:10});
  assert.equal(b.pve,1);assert.equal(b.pvp,1);assert.deepEqual(a.rewards,b.rewards);
});
test('scanner scale is applied once; lithium scaling is explicitly optional',()=>{
  const a=calc({}),b=calc({scannerLevel:40}),c=calc({scannerLevel:40,scaleLithium:true});
  close(b.rewards.resource,a.rewards.resource*b.scannerScale);close(b.claim,a.claim*b.scannerScale);
  assert.equal(b.rewards.lithium,a.rewards.lithium);close(c.rewards.lithium,a.rewards.lithium*c.scannerScale);
});
test('daily ledger subtracts claim and expected scan spending, excluding conversion',()=>{
  const r=calc({}),d=r.daily;
  assert.equal(d.flights,36);close(d.resources,28629167950.239532);
  close(d.lithiumChange,d.lithium-d.claimCost-d.scanCost);
  close(d.lithiumChange,-58711059.085182816);
  assert.equal(d.scanBudget,246226527);
  const zero=calc({launchesPerDay:0}).daily;
  for(const v of Object.values(zero))assert.equal(v,0);
});
test('exact cost arithmetic, floor, nearest rounding and discount cap',()=>{
  assert.deepEqual(O.scannerCostAtLevel(2),{metal:135n,crystal:68n,deut:23n});
  assert.deepEqual(O.resourceCostAtLevel(2,'metal'),{metal:168750n,crystal:56250n,deut:27000n});
  assert.deepEqual(O.generalCostAtLevel(1,25),{metal:281250n,crystal:168750n,deut:112500n});
  assert.deepEqual(O.generalCostAtLevel(10,100),O.generalCostAtLevel(10,200));
  assert.equal(typeof O.twiceMsu(calc({planets:50,scannerLevel:80}).total),'bigint');
});
test('invalid, fractional, nonfinite and unsupported settings fail visibly',()=>{
  for(const change of [{usedSlots:7},{planets:0},{experience:101},{planets:1.5},{scannerLevel:NaN},{techBoost:Infinity},{economy:8},{playerClass:'unknown'},{race:'unknown'},{resultsPerScan:0}])assert.throws(()=>calc(change),RangeError);
});
