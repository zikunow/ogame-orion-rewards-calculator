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
test('scanner scale is applied once to resource and lithium rewards',()=>{
  const a=calc({}),b=calc({scannerLevel:40}),c=calc({scannerLevel:40,scaleLithium:true});
  close(b.rewards.resource,a.rewards.resource*b.scannerScale);close(b.claim,a.claim*b.scannerScale);
  close(b.rewards.lithium,a.rewards.lithium*b.scannerScale);close(c.rewards.lithium,a.rewards.lithium*c.scannerScale);
  assert.equal(calc({scannerLevel:40,scaleLithium:false}).rewards.lithium,b.rewards.lithium);
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
  for(const change of [{usedSlots:7},{planets:0},{experience:101},{planets:1.5},{scannerLevel:NaN},{techBoost:Infinity},{economy:11},{playerClass:'unknown'},{race:'unknown'},{resultsPerScan:0}])assert.throws(()=>calc(change),RangeError);
});

test('economy affects conversion, rewards and spending exactly once; costs and IAS stay fixed',()=>{
  const base=calc({}),slow=calc({economy:5}),scaled=calc({economy:5,scaleLithium:true});
  assert.equal(slow.q,18*O.lithiumPerPlanet(39,5));
  assert.equal(slow.ias,base.ias);assert.deepEqual(slow.costs,base.costs);
  assert.equal(slow.daily.flights,base.daily.flights);assert.equal(slow.daily.scans,base.daily.scans);
  close(slow.rewards.resource,base.rewards.resource*slow.scannerScale);
  close(slow.claim,base.claim*slow.scannerScale);
  close(slow.scan,base.scan*slow.scannerScale);
  close(slow.rewards.lithium,base.rewards.lithium*slow.scannerScale);
  close(scaled.rewards.lithium,base.rewards.lithium*scaled.scannerScale);
});
test('all selectable economy speeds work and preserve integer per-planet rounding',()=>{
  for(let economy=1;economy<=10;economy++){
    const r=calc({economy});assert.ok(r.q>0);assert.ok(Number.isInteger(r.q/18));
    assert.equal(r.economyScale,economy/10);
  }
  for(const economy of [0,11,1.5,NaN,Infinity])assert.throws(()=>calc({economy}),RangeError);
});


test('automatic fitting beats next scanners until its stopping point',()=>{
  for(const scannerLevel of [1,20,39,45,80]){
    const s={...O.defaults,scannerLevel,resourceLevel:0,t18:0,lithiumLevel:0};
    const fit=O.autoFit(s);
    assert.deepEqual(fit.levels,O.autoFit({...s,...fit.levels}).levels);
    for(const step of fit.steps)assert.ok(step.msuPerPercent<=fit.scannerMsuPerPercent);
    for(const next of fit.nextCandidates)assert.ok(next.msuPerPercent>fit.scannerMsuPerPercent);
    const r=O.calculate({...s,...fit.levels});
    assert.ok(r.daily.lithiumChange>=-1e-5);
    if(fit.levels.lithiumLevel>0)assert.ok(O.calculate({...s,...fit.levels,lithiumLevel:fit.levels.lithiumLevel-1}).daily.lithiumChange<0);
  }
  assert.deepEqual(O.autoFit(O.defaults).levels,{resourceLevel:15,t18:7,lithiumLevel:21});
  assert.deepEqual(O.autoFit({...O.defaults,scannerLevel:45}).levels,{resourceLevel:21,t18:11,lithiumLevel:18});
});
test('automatic fitting handles no General, low planet counts, zero flights and scan-result changes',()=>{
  for(const playerClass of ['collector','discoverer'])assert.equal(O.autoFit({...O.defaults,playerClass}).levels.t18,O.defaults.t18);
  const poor=O.autoFit({...O.defaults,planets:1,scannerLevel:1});
  assert.equal(poor.lithiumCovered,false);assert.equal(poor.levels.lithiumLevel,50);
  assert.deepEqual(O.autoFit({...O.defaults,launchesPerDay:0}).levels,O.autoFit(O.defaults).levels);
  assert.ok(O.autoFit({...O.defaults,resultsPerScan:1}).levels.lithiumLevel>=O.autoFit(O.defaults).levels.lithiumLevel);
  for(const economy of [1,5,10]){
    const fit=O.autoFit({...O.defaults,economy});
    assert.ok(O.calculate({...O.defaults,economy,...fit.levels}).daily.lithiumChange>=-1e-5);
  }
  assert.throws(()=>O.autoFit({...O.defaults,scannerLevel:NaN}),RangeError);
});

test('automatic fitting never demolishes existing levels across scanner and class changes',()=>{
  const keys=['resourceLevel','t18','lithiumLevel'];
  let s={...O.defaults};
  s={...s,...O.autoFit(s).levels};
  assert.equal(s.lithiumLevel,21);
  const higher=O.autoFit({...s,scannerLevel:45});
  assert.deepEqual(higher.levels,{resourceLevel:21,t18:11,lithiumLevel:21});
  s={...s,scannerLevel:45,...higher.levels};
  for(const change of [{scannerLevel:39},{scannerLevel:1},{playerClass:'collector'},{playerClass:'discoverer'},{planets:1},{resultsPerScan:100},{techBoost:1000}]){
    const fit=O.autoFit({...s,...change});
    for(const key of keys)assert.ok(fit.levels[key]>=s[key],key+' must not decrease');
  }
  const built={...O.defaults,resourceLevel:40,t18:30,lithiumLevel:45};
  assert.deepEqual(O.autoFit(built).levels,{resourceLevel:40,t18:30,lithiumLevel:45});
  assert.throws(()=>O.autoFit({...O.defaults,lithiumLevel:NaN}),RangeError);
});
