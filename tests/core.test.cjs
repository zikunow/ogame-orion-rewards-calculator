const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const O=require('../core.js'),P=require('../shared/planner-core.js');
const s=(patch={})=>({...O.defaults,...patch});
const close=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1e-7,Math.abs(b)*1e-11),`${a} != ${b}`);
test('full calculator uses the planner model and identical session forecasts',()=>{
 for(const patch of [{},{metal:17,crystal:17,deut:17,t18:0},{economy:3,scannerLevel:28,lithium:5,threshold:20}]){
  const state=s(patch),a=O.calculate(state),b=P.value(state);
  for(const key of Object.keys(b))assert.deepEqual(a[key],b[key]);assert.deepEqual(a.session,P.session(state));
 }
});
test('cashback reduces claim expense only; no lithium reward windfall',()=>{
 const a=O.calculate(s({metal:17,crystal:17,deut:17,t18:0}),{withSession:false});
 close(a.cashback,.0806);assert.equal(a.selected,162);close(a.netPerFlight,a.meanClaimCost*.9194+a.scanPrice*a.scansPerFlight);
 const b=O.calculate(s({metal:17,crystal:17,deut:17,t18:0,lithium:18}),{withSession:false});
 close(a.meanReward,b.meanReward);close(a.netPerFlight-b.netPerFlight,a.meanClaimCost*.0018);assert.ok(b.dailyIncome>a.dailyIncome);
 assert.equal(a.lithium,undefined);
});
test('costs include each distinct building level and all planets exactly',()=>{
 const state=s({metal:4,crystal:3,deut:2,lithium:1,t18:1,scannerLevel:1}),x=O.calculate(state,{withSession:false});
 for(const key of ['metal','crystal','deut','lithium']){
  const expected=O.cumulative(state[key],18,l=>O.resourceCostAtLevel(l,key));assert.deepEqual(x.costs[key],expected);
 }
 const total=Object.values(x.costs).reduce((a,b)=>({metal:a.metal+b.metal,crystal:a.crystal+b.crystal,deut:a.deut+b.deut}),{metal:0n,crystal:0n,deut:0n});assert.deepEqual(x.total,total);
 const smaller=O.calculate({...state,planets:9},{withSession:false});assert.equal(O.twiceMsu(x.total),2n*O.twiceMsu(smaller.total));
});
test('no targets, slot-limited sessions, invalid inputs and zero cashback',()=>{
 assert.equal(O.calculate(s({threshold:1000})).session.status,'noTargets');
 assert.equal(O.calculate(s({slots:1,fleetSpeed:.1})).session.status,'continuous');
 for(const patch of [{planets:0},{lithium:NaN},{reservePercent:100},{baseCashback:Infinity},{race:'wrong'}])assert.throws(()=>O.calculate(s(patch)),RangeError);
 const a=O.calculate(s({baseCashback:0}),{withSession:false}),b=O.calculate(s({baseCashback:0,lithium:0}),{withSession:false});close(a.dailyIncome,b.dailyIncome);
});
test('matching upgrades keeps current levels and follows calendar-income marginal value',()=>{
 const state=s(),fit=O.autoFit(state);for(const key of Object.keys(fit.levels))assert.ok(fit.levels[key]>=state[key]);
 let current=state;
 for(const row of fit.steps){const choices=P.candidates(current),scanner=choices.find(x=>x.type==='scannerLevel');assert.ok(row.efficiency>scanner.efficiency);assert.notEqual(row.type,'scannerLevel');current=row.state;}
 assert.ok(O.calculate({...state,...fit.levels},{withSession:false}).dailyIncome>=O.calculate(state,{withSession:false}).dailyIncome);
});
test('full UI handles legacy links, language, validation and stale results',()=>{
 const elements={};const el=id=>elements[id]??=({value:'',textContent:'',innerHTML:'',hidden:false,disabled:false,handlers:{},addEventListener(k,f){this.handlers[k]=f},setAttribute(){}});
 const context=vm.createContext({Orion:O,URL,URLSearchParams,Intl,Number,BigInt,Math,document:{getElementById:el,documentElement:{dataset:{}}},location:{href:'https://example.com/',search:'?resourceLevel=17&lithiumLevel=17&availableSlots=6&t18=0'},history:{replaceState(){}},navigator:{clipboard:{async writeText(){}}}});
 vm.runInContext(fs.readFileSync(require.resolve('../rewards.js'),'utf8'),context);
 assert.match(el('cashbackHelp').textContent,/8,06/);assert.match(el('results').innerHTML,/162 \/ 1998/);assert.match(el('results').innerHTML,/В календарный день/);
 el('planets').value='0';el('planets').handlers.input();assert.equal(el('results').innerHTML,'');assert.equal(el('validation').hidden,false);
 el('reset').handlers.click();el('langEn').handlers.click();assert.match(el('results').innerHTML,/Per calendar day/);
});
