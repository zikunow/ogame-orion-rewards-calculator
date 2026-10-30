const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const O=require('../core.js'),S=require('../ias_for-dummies/simple-core.js');
test('budget parsing is exact and rejects malformed values',()=>{
 assert.equal(S.budgetFromBillions('100'),100000000000n);assert.equal(S.budgetFromBillions('0,000000001'),1n);
 for(const x of ['','-1','NaN','Infinity','1e5','9000001','1.1234567890'])assert.throws(()=>S.budgetFromBillions(x),RangeError);
});
test('budget fit maximizes sustainable income and returns consistent costs and sessions',()=>{
 let previous=0;
 for(const b of ['1','10','100','200','1000','10000']){
  const budget=S.budgetFromBillions(b),fit=S.optimize(budget);assert.ok(fit.configuration);assert.ok(fit.twiceMsu<=2n*budget);assert.equal(fit.twiceMsu,O.twiceMsu(fit.result.total));assert.ok(fit.result.dailyIncome>=previous);previous=fit.result.dailyIncome;
  const full=O.calculate(fit.configuration);assert.equal(fit.result.dailyIncome,full.dailyIncome);assert.deepEqual(fit.result.session,full.session);
 }
});
test('optimized search agrees with exhaustive enumeration including lithium on a bounded grid',()=>{
 const cap={scanner:5,resource:3,t18:2,lithium:3},all=[];
 for(let scannerLevel=1;scannerLevel<=cap.scanner;scannerLevel++)for(let resource=0;resource<=cap.resource;resource++)for(let t18=0;t18<=cap.t18;t18++)for(let lithium=0;lithium<=cap.lithium;lithium++){
  const c={...S.fixed,scannerLevel,metal:resource,crystal:resource,deut:resource,t18,lithium},r=O.calculate(c,{withSession:false});all.push({cost:O.twiceMsu(r.total),score:r.dailyIncome});
 }
 for(const budget of [0n,3645n,10000n,1000000n,10000000n,100000000n]){
  const eligible=all.filter(x=>x.cost<=budget*2n).sort((a,b)=>b.score-a.score),fit=S.optimize(budget,cap);
  if(!eligible.length)assert.equal(fit.configuration,null);else assert.ok(Math.abs(fit.result.dailyIncome-eligible[0].score)<1e-5);
 }
});
test('minimum configuration and invalid level caps are explicit',()=>{
 const empty=S.optimize(0n);assert.equal(empty.configuration,null);const min=(empty.minimumTwiceMsu+1n)/2n;assert.ok(S.optimize(min).configuration);assert.equal(S.optimize(min-1n).configuration,null);
 assert.throws(()=>S.optimize(1n,{scanner:0,resource:0,t18:0,lithium:0}),RangeError);assert.throws(()=>S.optimize(-1n),RangeError);
});
test('simple UI uses only budget, removes old waves parameter and links identical full configuration',()=>{
 const elements={};const el=id=>elements[id]??=({value:'100',textContent:'',innerHTML:'',hidden:false,handlers:{},addEventListener(k,f){this.handlers[k]=f}});
 let address='';const context=vm.createContext({SimpleOrion:S,URL,URLSearchParams,Intl,Number,Math,BigInt,document:{getElementById:el},location:{href:'https://example.com/ias_for-dummies/?budget=100&waves=6',search:'?budget=100&waves=6'},history:{replaceState(a,b,url){address=String(url)}}});
 vm.runInContext(fs.readFileSync(require.resolve('../ias_for-dummies/simple.js'),'utf8'),context);
 assert.match(el('output').innerHTML,/Ресурсы за сессию/);assert.match(el('output').innerHTML,/Одна сессия/);assert.match(el('output').innerHTML,/Следующий заход/);assert.doesNotMatch(address,/waves/);
 const href=el('output').innerHTML.match(/class="result-link" href="([^"]+)"/)[1],params=new URL(href).searchParams,fit=S.optimize(100000000000n);
 for(const key of ['scannerLevel','metal','crystal','deut','lithium','t18'])assert.equal(Number(params.get(key)),fit.configuration[key]);
 el('budget').value='0';el('simpleForm').handlers.submit({preventDefault(){}});assert.equal(el('error').hidden,false);assert.equal(el('output').innerHTML,'');
});
