'use strict';
const $=id=>document.getElementById(id),S=SimpleOrion;
const number=(x,d=2)=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:d}).format(x);
function compact(x){const a=Math.abs(x),d=a>=1e9?1e9:a>=1e6?1e6:a>=1e3?1e3:1;return '≈'+number(x/d)+(d===1e9?' млрд':d===1e6?' млн':d===1e3?' тыс.':'');}
const query=new URLSearchParams(location.search);
if(query.has('budget'))$('budget').value=query.get('budget');
if(query.has('waves'))$('waves').value=query.get('waves');
function calculate(){
  $('pending').hidden=true;$('error').hidden=true;$('output').innerHTML='';
  let budget;try{budget=S.budgetFromBillions($('budget').value);}catch{$('error').textContent='Введите бюджет от 0 до 9 000 000 млрд МСУ. Можно использовать дробное число.';$('error').hidden=false;return;}
  const raw=$('waves').value.trim(),waves=Number(raw);
  if(!raw||!Number.isInteger(waves)||waves<0||waves>1000){$('error').textContent='Введите целое число волн от 0 до 1 000.';$('error').hidden=false;return;}
  const fit=S.optimize(budget);
  const url=new URL(location.href);url.search='';url.searchParams.set('budget',$('budget').value);url.searchParams.set('waves',waves);history.replaceState({},'',url);
  if(!fit.configuration){$('error').textContent='Для конфигурации на 18 планет с покрытием расходов литием нужно минимум '+compact(Number(fit.minimumTwiceMsu)/2)+' МСУ. Увеличьте бюджет или используйте полный калькулятор для другого количества планет.';$('error').hidden=false;return;}
  const config={...fit.configuration,launchesPerDay:waves},r=Orion.calculate(config),used=Number(fit.twiceMsu)/2;
  const full=new URL('../',location.href);for(const [k,v]of Object.entries(config))full.searchParams.set(k,v);full.searchParams.set('autoFit','0');
  $('output').innerHTML=`<section class="result"><p class="caption">Ожидаемая ресурсная награда за день</p><p class="reward" title="${number(r.daily.resources,6)} МСУ">${compact(r.daily.resources)} МСУ</p><p class="sub">${number(waves,0)} волн × 6 слотов = ${number(r.daily.flights,0)} вылетов в день.<br>Средняя награда до топлива и потерь флота.</p><details class="result-detail"><summary>Что подобрано и сколько потрачено</summary><div class="chosen"><span>Тарелки ${config.scannerLevel}</span><span>Ресурсы ${config.resourceLevel}</span><span>T18 ${config.t18}</span><span>Литий ${config.lithiumLevel}</span></div><dl class="facts"><dt>Вложено</dt><dd>${number(used)} МСУ</dd><dt>Осталось от бюджета</dt><dd>${number(Number(budget)-used)} МСУ</dd><dt>Награда на один вылет</dt><dd>${number(r.rewards.resource,2)} МСУ</dd><dt>Ресурсная награда за день</dt><dd>${number(r.daily.resources,2)} МСУ</dd><dt>Баланс лития за день после сканов и наград</dt><dd>${number(r.daily.lithiumChange)} лития</dd></dl><a class="result-link" href="${full.href}">Открыть эту конфигурацию в полном калькуляторе ↗</a></details></section>`;
}
$('simpleForm').addEventListener('submit',event=>{event.preventDefault();calculate();});
for(const id of ['budget','waves'])$(id).addEventListener('input',()=>{$('pending').hidden=false;$('output').innerHTML='';$('error').hidden=true;});
calculate();
