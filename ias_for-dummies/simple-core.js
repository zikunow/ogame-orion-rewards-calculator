(function(root){
  'use strict';
  const O=typeof module!=='undefined'&&module.exports?require('../core.js'):root.Orion;
  const fixed=Object.freeze({...O.defaults,scannerLevel:1,metal:0,crystal:0,deut:0,lithium:0,t18:0});
  const limits=Object.freeze({scanner:80,resource:50,t18:80,lithium:50});
  const costTables={};
  function budgetFromBillions(value){
    const m=String(value).trim().replace(',','.').match(/^(\d+)(?:\.(\d{1,9}))?$/);
    if(!m)throw new RangeError('budget');
    const budget=BigInt(m[1])*1000000000n+BigInt((m[2]||'').padEnd(9,'0'));
    if(budget>9000000000000000n)throw new RangeError('budget');return budget;
  }
  function prepare(){
    if(costTables.scanner)return;
    const table=(max,fn)=>{const a=[0n];for(let i=1;i<=max;i++)a.push(a[i-1]+O.twiceMsu(fn(i))*BigInt(fixed.planets));return a;};
    costTables.scanner=table(80,O.scannerCostAtLevel);
    costTables.resource=table(50,l=>['metal','crystal','deut'].map(k=>O.resourceCostAtLevel(l,k)).reduce((a,b)=>({metal:a.metal+b.metal,crystal:a.crystal+b.crystal,deut:a.deut+b.deut}),{metal:0n,crystal:0n,deut:0n}));
    costTables.t18=table(80,l=>O.generalCostAtLevel(l,fixed.labLevel));
    costTables.lithium=table(50,l=>O.resourceCostAtLevel(l,'lithium'));
  }
  const selectionCache=new Map();
  function profile(resource,t18){
    const key=resource+':'+t18;
    if(!selectionCache.has(key)){
      const v=O.planner.value({...fixed,scannerLevel:39,metal:resource,crystal:resource,deut:resource,t18});
      selectionCache.set(key,{selected:v.selected,rewardPerProduction:v.meanReward/v.production,claimPerProduction:v.meanClaimCost/v.production,scansPerFlight:v.scansPerFlight,slotFlights:v.slotFlights});
    }
    return selectionCache.get(key);
  }
  function optimize(budget,cap=limits){
    if(typeof budget!=='bigint'||budget<0n||budget>9000000000000000n)throw new RangeError('budget');
    for(const k of Object.keys(limits))if(!Number.isInteger(cap[k])||cap[k]<0||cap[k]>limits[k]||(k==='scanner'&&cap[k]<1))throw new RangeError('limits');
    prepare();const available=budget*2n,minimum=costTables.scanner[1];let best=null;
    // Reward and claim scale together with production, so for each building
    // combination the highest affordable scanner is optimal within this model.
    for(let t18=0;t18<=cap.t18;t18++){
      if(costTables.t18[t18]+minimum>available)break;
      for(let resource=0;resource<=cap.resource;resource++){
        const base=costTables.t18[t18]+costTables.resource[resource];
        if(base+minimum>available)break;
        const v=profile(resource,t18);if(!v.selected)continue;
        for(let lithium=0;lithium<=cap.lithium;lithium++){
          const extras=base+costTables.lithium[lithium];if(extras+minimum>available)break;
          let lo=1,hi=cap.scanner;
          while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(extras+costTables.scanner[mid]<=available)lo=mid;else hi=mid-1;}
          const production=fixed.planets*O.lithiumPerPlanet(lo,fixed.economy);
          const cashback=fixed.baseCashback/100*(1+.002*fixed.planets*lithium);
          const netPerProduction=v.claimPerProduction*(1-cashback)+.5*v.scansPerFlight;
          const score=production*v.rewardPerProduction*Math.min(24/netPerProduction,v.slotFlights);
          const cost=extras+costTables.scanner[lo];
          if(!best||score>best.score||(score===best.score&&cost<best.cost))best={scanner:lo,resource,t18,lithium,score,cost};
        }
      }
    }
    if(!best)return {configuration:null,minimumTwiceMsu:minimum};
    const configuration={...fixed,scannerLevel:best.scanner,metal:best.resource,crystal:best.resource,deut:best.resource,t18:best.t18,lithium:best.lithium};
    return {configuration,result:O.calculate(configuration),twiceMsu:best.cost,minimumTwiceMsu:minimum};
  }
  const api={fixed,limits,budgetFromBillions,optimize};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.SimpleOrion=api;
})(globalThis);
