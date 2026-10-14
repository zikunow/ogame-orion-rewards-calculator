const {test}=require('node:test');const assert=require('node:assert/strict');const O=require('../core.js');const S=require('../ias_for-dummies/simple-core.js');
test('budget parsing preserves exact MSU and rejects invalid amounts',()=>{
 assert.equal(S.budgetFromBillions('100'),100000000000n);assert.equal(S.budgetFromBillions('0,000000001'),1n);assert.equal(S.budgetFromBillions('81.099193887'),81099193887n);
 for(const x of ['','-1','NaN','Infinity','1e5','9000001','1.1234567890'])assert.throws(()=>S.budgetFromBillions(x),RangeError);
});
test('budget fitting keeps exact costs within budget and covers lithium spending',()=>{
 let previous=0;
 for(const b of ['40','50','100','200','1000','10000']){
  const budget=S.budgetFromBillions(b),x=S.optimize(budget);assert.ok(x.configuration);assert.ok(x.twiceMsu<=2n*budget);assert.equal(x.twiceMsu,O.twiceMsu(x.result.total));assert.ok(x.result.daily.lithiumChange>=-1e-5);
  assert.ok(x.result.rewards.resource>=previous);previous=x.result.rewards.resource;
  if(x.configuration.lithiumLevel>0){const fewer=O.calculate({...x.configuration,lithiumLevel:x.configuration.lithiumLevel-1});assert.ok(fewer.daily.lithiumChange<0);}
 }
});
test('budget fitting matches exhaustive enumeration on a bounded level grid',()=>{
 const cap={scanner:5,resource:6,t18:9,lithium:50};const candidates=[];
 for(let t18=0;t18<=cap.t18;t18++){
  let lithiumLevel=0;
  while(lithiumLevel<=cap.lithium&&O.calculate({...S.fixed,t18,lithiumLevel}).daily.lithiumChange<0)lithiumLevel++;
  if(lithiumLevel>cap.lithium)continue;
  for(let scannerLevel=1;scannerLevel<=cap.scanner;scannerLevel++)for(let resourceLevel=0;resourceLevel<=cap.resource;resourceLevel++){
   const r=O.calculate({...S.fixed,t18,lithiumLevel,scannerLevel,resourceLevel});candidates.push({cost:O.twiceMsu(r.total),score:r.rewards.resource});
  }
 }
 for(const budget of [37000000000n,40000000000n,45000000000n,60000000000n,100000000000n]){
  const feasible=candidates.filter(x=>x.cost<=budget*2n).sort((a,b)=>b.score-a.score);const fit=S.optimize(budget,cap);
  if(!feasible.length)assert.equal(fit.configuration,null);else assert.ok(Math.abs(fit.result.rewards.resource-feasible[0].score)<1e-5);
 }
});
test('minimum budget, empty budgets and wave counts behave consistently',()=>{
 const empty=S.optimize(0n);assert.equal(empty.configuration,null);assert.ok(empty.minimumTwiceMsu>0n);
 const min=(empty.minimumTwiceMsu+1n)/2n;assert.ok(S.optimize(min).configuration);assert.equal(S.optimize(min-1n).configuration,null);
 const x=S.optimize(100000000000n);const two=O.calculate({...x.configuration,launchesPerDay:2});assert.equal(two.daily.flights,12);assert.equal(two.daily.resources,two.rewards.resource*12);
 assert.equal(O.calculate({...x.configuration,launchesPerDay:0}).daily.resources,0);
});
