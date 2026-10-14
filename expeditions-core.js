'use strict';
(function(root){
  const brackets=[[10000,40000],[100000,500000],[1000000,1200000],[5000000,1800000],[25000000,2400000],[50000000,3000000],[75000000,3600000],[100000000,4200000],[Infinity,5000000]];
  const defaults={economy:8,topPoints:100000000,resourceBonus:0,shipBonus:0,manual:0,metalMax:120000000,fleetMetalMax:120000000,slots:8,waves:6,days:30,computer:1,fuel:0,loss:0,scrap:100,resourceChance:34.5,shipChance:16.5,fleetK:1.5,model:0};
  function calculate(s){
    for(const k of Object.keys(defaults))if(!Number.isFinite(s[k])||s[k]<0)throw new RangeError(k);
    for(const k of ['economy','slots','waves','days'])if(!Number.isInteger(s[k])||s[k]<1||s[k]>10000)throw new RangeError(k);
    for(const k of ['resourceChance','shipChance','scrap'])if(s[k]>100)throw new RangeError(k);
    if(s.resourceChance+s.shipChance>100||s.fleetK<1||s.computer<1||s.computer>10||![0,1].includes(s.manual)||![0,1].includes(s.model))throw new RangeError('model');
    const base=brackets.find(([limit])=>s.topPoints<limit)[1];
    // Discoverer with a Pathfinder. Bonus fields are TOTAL effective yield increases,
    // including T18/items if applicable; no unverified stacking is inferred here.
    const reference=base*s.economy*1.5*2;
    const metalMax=s.manual?s.metalMax:reference*(1+s.resourceBonus/100);
    const fleetMetalMax=s.manual?s.fleetMetalMax:reference*(1+s.shipBonus/100);
    const f=.9*.15+.09*.38+.01*.755;
    const resourceRate=s.model?s.resourceChance/100*f*(.5+1/3*.5*1.5+1/6/3*3):.056;
    const shipRate=s.model?s.shipChance/100*f*.5*s.fleetK:.0219;
    const resources=metalMax*resourceRate*s.computer, ships=fleetMetalMax*shipRate*s.computer;
    const realised=ships*s.scrap/100, fuel=s.fuel*3, net=resources+realised-fuel-s.loss;
    const dailyFlights=s.slots*s.waves;
    return {base,reference,metalMax,fleetMetalMax,f,resourceRate,shipRate,resources,ships,realised,fuel,net,dailyFlights,daily:net*dailyFlights,period:net*dailyFlights*s.days};
  }
  const api={brackets,defaults,calculate};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Expeditions=api;
})(globalThis);
