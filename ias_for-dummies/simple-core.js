(function(root){
  'use strict';
  const O=typeof module!=='undefined'&&module.exports?require('../core.js'):root.Orion;
  const fixed=Object.freeze({...O.defaults,resourceLevel:0,lithiumLevel:0,t18:0,scannerLevel:1});
  const limits=Object.freeze({scanner:80,resource:50,t18:80,lithium:50});
  function budgetFromBillions(value){
    const m=String(value).trim().replace(',','.').match(/^(\d+)(?:\.(\d{1,9}))?$/);
    if(!m)throw new RangeError('budget');
    const budget=BigInt(m[1])*1000000000n+BigInt((m[2]||'').padEnd(9,'0'));
    if(budget<0n||budget>9000000000000000n)throw new RangeError('budget');
    return budget;
  }
  const costs={};
  function prepare(){
    if(costs.scanner)return;
    function table(max,fn){const a=[0n];for(let i=1;i<=max;i++)a.push(a[i-1]+O.twiceMsu(fn(i))*BigInt(fixed.planets));return a;}
    costs.scanner=table(limits.scanner,O.scannerCostAtLevel);
    costs.resource=table(limits.resource,l=>{const a=['metal','crystal','deut'].map(k=>O.resourceCostAtLevel(l,k));return {metal:a.reduce((s,x)=>s+x.metal,0n),crystal:a.reduce((s,x)=>s+x.crystal,0n),deut:a.reduce((s,x)=>s+x.deut,0n)};});
    costs.t18=table(limits.t18,l=>O.generalCostAtLevel(l,fixed.labLevel));
    costs.lithium=table(limits.lithium,l=>O.resourceCostAtLevel(l,'lithium'));
  }
  function optimize(budget,cap=limits){
    if(typeof budget!=='bigint'||budget<0n||budget>9000000000000000n)throw new RangeError('budget');
    for(const key of Object.keys(limits))if(!Number.isInteger(cap[key])||cap[key]<0||cap[key]>limits[key]||(key==='scanner'&&cap[key]<1))throw new RangeError('limits');
    prepare();
    const spending=O.baseline.meanClaimCost+O.baseline.scanPrice/(fixed.resultsPerScan*(O.baseline.selectedFlights/O.baseline.anomalies));
    const variants=[];let minimum=null;
    for(let t=0;t<=cap.t18;t++){
      const e=.002*t*fixed.planets*(1+.001*fixed.experience+fixed.techBoost/100);
      const reward=O.meanRewards(1.5+.5*e,2+e,0,0);
      let lithium=0;while(lithium<=cap.lithium&&reward.lithium*(1+.002*fixed.planets*lithium)<spending)lithium++;
      if(lithium>cap.lithium)continue;
      const base=costs.t18[t]+costs.lithium[lithium];
      const required=base+costs.scanner[1];if(minimum===null||required<minimum)minimum=required;
      variants.push({t,lithium,base,resource:reward.resource});
    }
    const available=2n*budget;let best=null;
    for(let scanner=1;scanner<=cap.scanner;scanner++){
      if(costs.scanner[scanner]>available)break;
      const scale=fixed.planets*O.lithiumPerPlanet(scanner,fixed.economy)/O.baseline.lithiumPerHour;
      for(const v of variants){
        const base=costs.scanner[scanner]+v.base;if(base>available)continue;
        const remaining=available-base;
        let lo=0,hi=cap.resource;while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(costs.resource[mid]<=remaining)lo=mid;else hi=mid-1;}
        const resource=lo,cost=base+costs.resource[resource],score=v.resource*(1+.002*fixed.planets*resource)*scale;
        if(!best||score>best.score||(score===best.score&&cost<best.cost))best={scanner,resource,t18:v.t,lithium:v.lithium,cost,score};
      }
    }
    if(!best)return {configuration:null,minimumTwiceMsu:minimum};
    const configuration={...fixed,scannerLevel:best.scanner,resourceLevel:best.resource,t18:best.t18,lithiumLevel:best.lithium};
    return {configuration,result:O.calculate(configuration),twiceMsu:best.cost,minimumTwiceMsu:minimum};
  }
  const api={fixed,limits,budgetFromBillions,optimize};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.SimpleOrion=api;
})(globalThis);
