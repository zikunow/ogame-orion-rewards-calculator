'use strict';
const $=id=>document.getElementById(id),S=SimpleOrion;
const number=(x,d=2)=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:d}).format(x);
const query=new URLSearchParams(location.search);
if(query.has('budget'))$('budget').value=query.get('budget');
function calculate(){
  $('pending').hidden=true;$('error').hidden=true;$('output').innerHTML='';
  let budget;try{budget=S.budgetFromBillions($('budget').value);}catch{$('error').textContent='Введите бюджет от 0 до 9 000 000 млрд МСУ. Можно использовать дробное число.';$('error').hidden=false;return;}
  const fit=S.optimize(budget),url=new URL(location.href);url.search='';url.searchParams.set('budget',$('budget').value);history.replaceState({},'',url);
  if(!fit.configuration){$('error').textContent='Минимальная стоимость конфигурации: '+number(Number(fit.minimumTwiceMsu)/2)+' МСУ.';$('error').hidden=false;return;}
  const c=fit.configuration,r=fit.result,x=r.session,ok=x.status==='ok',used=Number(fit.twiceMsu)/2;
  const full=new URL('../',location.href);for(const [k,v]of Object.entries(c))full.searchParams.set(k,v);full.searchParams.set('autoFit','0');
  const metric=(label,value,note)=>`<article class="forecast-stat"><span>${label}</span><strong>${value}</strong><small>${note}</small></article>`;
  $('output').innerHTML=`<section class="result"><div class="forecast-grid">${metric('В календарный день',number(r.dailyIncome/1e9)+'Г МСУ','Включая дни накопления лития')}${metric('За час полётов',ok&&x.activeHours>0?number(x.resource/x.activeHours/1e9)+'Г МСУ':'—','Ресурсы сессии / часы полётов')}${metric('Одна сессия',ok?number(x.activeHours)+' ч':'—',ok?number(x.flights,1)+' вылетов · '+number(x.scans,1)+' сканов':'Конечная сессия не прогнозируется')}${metric('Следующий заход',ok?number(x.cycleDays)+' дня':'—',ok?'После сессии ждать '+number(x.waitDays)+' дня':'Слоты ограничивают расход лития')}</div><p class="sub forecast-caption">Недельный запас → выбранные аномалии → резерв 20% → пополнение.</p>
  <details class="result-detail"><summary>Подобранные улучшения и результат сессии</summary><div class="chosen"><span>Тарелки ${c.scannerLevel}</span><span>Ресурсы ${c.metal}</span><span>T18 ${c.t18}</span><span>Литий ${c.lithium}</span></div><dl class="facts"><dt>Вложено, МСУ</dt><dd>${number(used)}</dd><dt>Осталось от бюджета, МСУ</dt><dd>${number(Number(budget)-used)}</dd><dt>Средний кэшбэк</dt><dd>${number(r.cashback*100)}%</dd><dt>Недельный запас лития</dt><dd>${number(r.weeklyCap/1e6)} млн</dd><dt>Целевой резерв лития</dt><dd>${number(r.reserve/1e6)} млн</dd><dt>Ресурсы за сессию</dt><dd>${ok?number(x.resource/1e9)+'Г МСУ':'—'}</dd></dl><a class="result-link" href="${full.href}">Открыть эту конфигурацию в полном калькуляторе ↗</a></details></section>`;
}
$('simpleForm').addEventListener('submit',event=>{event.preventDefault();calculate();});
$('budget').addEventListener('input',()=>{$('pending').hidden=false;$('output').innerHTML='';$('error').hidden=true;});
calculate();
