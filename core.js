/* Uses the same empirical economics/session engine as the upgrade planner. */
(function(root){
  'use strict';
  const node=typeof module!=='undefined'&&module.exports;
  const P=node?require('./shared/planner-core.js'):root.OrionPlanner;
  const C=node?require('./shared/planner-costs.js'):root.OrionCosts;
  const defaults=Object.freeze({...P.defaults,race:'mecha'});
  const zero=()=>({metal:0n,crystal:0n,deut:0n});
  const add=(a,b)=>({metal:a.metal+b.metal,crystal:a.crystal+b.crystal,deut:a.deut+b.deut});
  function cumulative(level,planets,fn){let sum=zero();for(let i=1;i<=level;i++)sum=add(sum,fn(i));return Object.fromEntries(Object.entries(sum).map(([k,v])=>[k,v*BigInt(planets)]));}
  function validate(s){const errors=P.validate(s);if(!['human','rocktal','mecha','kaelesh'].includes(s.race))errors.push('race');return errors;}
  function costs(s){return {
    scanner:cumulative(s.scannerLevel,s.planets,C.scannerCostAtLevel),
    metal:cumulative(s.metal,s.planets,l=>C.resourceCostAtLevel(l,'metal')),
    crystal:cumulative(s.crystal,s.planets,l=>C.resourceCostAtLevel(l,'crystal')),
    deut:cumulative(s.deut,s.planets,l=>C.resourceCostAtLevel(l,'deut')),
    lithium:cumulative(s.lithium,s.planets,l=>C.resourceCostAtLevel(l,'lithium')),
    t18:cumulative(s.t18,s.planets,l=>C.generalCostAtLevel(l,s.labLevel))
  };}
  function calculate(s,{withSession=true,runs=256}={}){
    const errors=validate(s);if(errors.length)throw new RangeError(errors.join(','));
    const value=P.value(s),components=costs(s),total=Object.values(components).reduce(add,zero());
    return {...value,costs:components,total,session:withSession?P.session(s,runs):null};
  }
  function autoFit(initial){
    const errors=validate(initial);if(errors.length)throw new RangeError(errors.join(','));
    let s={...initial};const steps=[];
    for(let i=0;i<400;i++){
      const choices=P.candidates(s),scanner=choices.find(c=>c.type==='scannerLevel');
      const best=choices.find(c=>c.type!=='scannerLevel'&&c.dailyGain>0);
      if(!best||!scanner||best.efficiency<=scanner.efficiency)break;
      steps.push(best);s=best.state;
    }
    return {levels:Object.fromEntries(['metal','crystal','deut','lithium','t18'].map(k=>[k,s[k]])),steps};
  }
  const api={defaults,validate,calculate,costs,cumulative,autoFit,planner:P,...C};
  if(node)module.exports=api;else root.Orion=api;
})(globalThis);
