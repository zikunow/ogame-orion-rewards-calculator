'use strict';
const E=Expeditions, $=id=>document.getElementById(id), query=new URLSearchParams(location.search);
let state={...E.defaults};
for(const key of Object.keys(state))if(query.has(key))state[key]=query.get(key).trim()===''?NaN:Number(query.get(key));
const defs={economy:['Скорость экономики','8'],topPoints:['Очки игрока №1','100000000'],resourceBonus:['Суммарный бонус к ресурсам, %','0'],shipBonus:['Суммарный бонус к кораблям, %','0'],metalMax:['Максимальная находка металла','120000000'],fleetMetalMax:['Максимальная структура флота × 2','120000000'],slots:['Экспедиций в одной волне','8'],waves:['Волн в день','6'],days:['Дней в периоде','30'],computer:['Множитель экспедиционного компьютера','1'],fuel:['Топливо на одну экспедицию, дейтерий','0'],loss:['Средние потери на экспедицию, МСУ','0'],scrap:['Реализация стоимости флота, %','100'],resourceChance:['Шанс ресурсов, %','34.5'],shipChance:['Шанс кораблей, %','16.5'],fleetK:['МСУ / структура найденного флота','1.5']};
const num=v=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:2}).format(v);
const compact=v=>num(v/(Math.abs(v)>=1e9?1e9:Math.abs(v)>=1e6?1e6:1))+(Math.abs(v)>=1e9?' млрд':Math.abs(v)>=1e6?' млн':'');
function field(key){return `<label for="${key}"><span>${defs[key][0]}</span><input id="${key}" data-key="${key}" type="number" min="${['economy','slots','waves','days','computer','fleetK'].includes(key)?1:0}" ${['resourceChance','shipChance','scrap'].includes(key)?'max="100"':''} step="${['economy','topPoints','slots','waves','days'].includes(key)?1:'any'}" value="${Number.isFinite(state[key])?state[key]:''}"></label>`;}
for(const [id,keys] of Object.entries({automaticFields:['economy','topPoints','resourceBonus','shipBonus'],manualFields:['metalMax','fleetMetalMax'],activityFields:['slots','waves','days','computer'],costFields:['fuel','loss','scrap'],probabilityFields:['resourceChance','shipChance','fleetK']}))$(id).innerHTML=keys.map(field).join('');
$('manual').checked=!!state.manual;$('model').value=state.model;
let theme='minimal';try{theme=localStorage.getItem('ias-theme')||theme;}catch{}
document.documentElement.dataset.theme=theme;$('theme').value=theme;
$('theme').onchange=()=>{document.documentElement.dataset.theme=$('theme').value;try{localStorage.setItem('ias-theme',$('theme').value);}catch{}};
$('calculatorSelect').onchange=()=>{location.href=$('calculatorSelect').value;};
function render(){
  $('automaticFields').hidden=!!state.manual;$('manualFields').hidden=!state.manual;$('probabilityFields').hidden=!state.model;
  for(const el of document.querySelectorAll('[data-key]')){el.removeAttribute('aria-invalid');if(el.type==='number'&&(!Number.isFinite(state[el.dataset.key])||!el.checkValidity()))el.setAttribute('aria-invalid','true');}
  let r;try{r=E.calculate(state);}catch{ $('validation').hidden=false;$('results').innerHTML='';return;}
  $('validation').hidden=true;
  const metric=(title,value,help)=>`<div class="metric"><span>${title}</span><b>${compact(value)}</b><small>${help}</small></div>`;
  const row=(label,mult)=>`<tr><td>${label}</td><td>${num(r.resources*mult)}</td><td>${num(r.ships*mult)}</td><td>${num(r.realised*mult)}</td><td>${num((r.fuel+state.loss)*mult)}</td><td><strong>${num(r.net*mult)}</strong></td></tr>`;
  $('results').innerHTML=`<section class="panel daily-panel"><div class="section-top"><h2>Ожидаемый доход</h2><span>${num(r.dailyFlights)} экспедиций в день</span></div><div class="metrics">${metric('Ресурсы за экспедицию',r.resources,'МСУ · до расходов')}${metric('Флот за экспедицию',r.ships,'МСУ · полная стоимость кораблей')}${metric('Итого за день',r.daily,'МСУ · с заданными расходами и возвратом флота')}</div><div class="table-wrap"><table><thead><tr><th>Период</th><th>Ресурсы, МСУ</th><th>Флот, МСУ</th><th>Флот к доходу, МСУ</th><th>Расходы, МСУ</th><th>Итого, МСУ</th></tr></thead><tbody>${row('Одна экспедиция',1)}${row('Одна волна',state.slots)}${row('Один день',r.dailyFlights)}${row(state.days+' дней',r.dailyFlights*state.days)}</tbody></table></div><p class="note">Итого = ресурсы + флот × ${num(state.scrap)}% − топливо × 3 − заданные средние потери. Флот к доходу уже входит в итог.</p></section><section class="panel account-panel"><h2>Максимальные находки</h2><div class="metrics">${metric('Металл',r.metalMax,'единиц ресурса')}${metric('Кристалл',r.metalMax/2,'единиц ресурса')}${metric('Дейтерий',r.metalMax/3,'единиц ресурса')}</div><p class="note">Максимальная структура кораблей: ${num(r.fleetMetalMax/2)}. Оценка её полной стоимости: ${num(r.fleetMetalMax/2*state.fleetK)} МСУ. Корабельный и ресурсный максимумы используют разные бонусы.</p><p class="exp-formula">${state.manual?'Максимумы заданы вручную.':`Базовый максимум: ${num(r.base)} × ${state.economy} (экономика) × 1,5 (Исследователь) × 2 (первопроходец).`}<br>Коэффициенты среднего: ресурсы ${num(r.resourceRate*100)}%; флот ${num(r.shipRate*100)}%; компьютер ×${num(state.computer)}.</p></section>`;
  const url=new URL(location.href);url.search='';for(const[k,v]of Object.entries(state))url.searchParams.set(k,v);history.replaceState({},'',url);
}
$('settings').addEventListener('input',event=>{const el=event.target,key=el.dataset.key;if(!key)return;state[key]=el.type==='checkbox'?Number(el.checked):el.value.trim()===''?NaN:Number(el.value);render();});
$('settings').addEventListener('submit',event=>event.preventDefault());
$('reset').onclick=()=>{history.replaceState({},'',location.pathname);location.reload();};
$('share').onclick=async()=>{try{await navigator.clipboard.writeText(location.href);$('copyStatus').textContent='Ссылка скопирована.';}catch{$('copyStatus').textContent='Скопируйте адрес из адресной строки.';}};
render();
