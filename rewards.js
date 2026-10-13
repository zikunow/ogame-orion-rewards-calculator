'use strict';
const $=id=>document.getElementById(id), O=Orion;
const params=new URLSearchParams(location.search);
let lang=params.get('lang')==='en'?'en':'ru';
let state={...O.defaults};
let autoFitEnabled=params.get('autoFit')==='1';
let autoFitResult=null;
let settingsOpen=false;
let investmentOpen=false;
for(const key of Object.keys(state)) if(params.has(key)){
  const value=params.get(key);
  state[key]=typeof state[key]==='number'?(value.trim()===''?NaN:Number(value)):typeof state[key]==='boolean'?value==='1':value;
}
let savedTheme='minimal';try{savedTheme=localStorage.getItem('ias-theme')||'minimal';}catch{}
let theme=(params.get('theme')||savedTheme)==='cosmic'?'cosmic':'minimal';
const t=(ru,en)=>lang==='ru'?ru:en;
const n=(v,d=2)=>new Intl.NumberFormat(lang==='ru'?'ru-RU':'en-US',{maximumFractionDigits:d}).format(v);
const pct=v=>n(v*100)+'%';
const msuLabel=()=>t('МСУ','MSU');
const exactMsu=r=>{const a=O.twiceMsu(r);return n(a/2n,0)+(a%2n?t(',5','.5'):'');};
const compact=(v)=>{
  const a=Math.abs(Number(v)), divisor=a>=1e9?1e9:a>=1e6?1e6:a>=1e3?1e3:1;
  const suffix=divisor===1e9?t(' млрд',' bn'):divisor===1e6?t(' млн',' m'):divisor===1e3?t(' тыс.',' k'):'';
  return (divisor>1?'≈':'')+n(Number(v)/divisor,2)+suffix;
};
const signedCompact=v=>{const value=compact(v);return v>0?(value.startsWith('≈')?'≈+'+value.slice(1):'+'+value):value;};
const fields={
  playerClass:['Класс','Class'],economy:['Скорость экономики','Economy speed'],planets:['Количество планет','Number of planets'],scannerLevel:['Тарелка на каждой планете','Scanner level per planet'],
  race:['Активная раса ФЖ','Active lifeform'],experience:['Уровень опыта активной ФЖ','Lifeform experience level'],techBoost:['Усиление технологий зданием ФЖ, %','Lifeform building technology boost, %'],labLevel:['Здание скидки исследований','Research discount building level'],
  t18:['T18 на каждой планете','T18 level per planet'],resourceLevel:['Три ресурсных подздания · общий уровень','Three resource sub-buildings · shared level'],lithiumLevel:['Литиевое подздание','Lithium sub-building level'],availableSlots:['Доступных слотов аномалий','Available anomaly slots'],
  resultsPerScan:['Результатов одного скана','Results per scan'],launchesPerDay:['Запусков флотов в день','Fleet launches per day'],usedSlots:['Слотов в одном запуске','Slots per launch']};
const label=k=>t(...fields[k]);
const races={human:['Исследовательский центр','Research Centre'],rocktal:['Рунный технологиум','Rune Technologium'],mecha:['Исследовательский центр робототехники','Robotics Research Centre'],kaelesh:['Вихревая камера','Vortex Chamber']};
function field(k,help=''){
  let input;
  const choices=k==='playerClass'?{general:t('Генерал','General'),collector:t('Коллекционер · без бонуса Генерала','Collector · no General bonus'),discoverer:t('Исследователь · без бонуса Генерала','Discoverer · no General bonus')}:k==='race'?{human:t('Люди','Humans'),rocktal:t('Рок’тал','Rock’tal'),mecha:t('Мехи','Mecha'),kaelesh:t('Каэлеш','Kaelesh')}:null;
  if(k==='economy')input=`<select id="economy" data-setting="economy">${Array.from({length:10},(_,i)=>i+1).map(v=>`<option value="${v}"${state.economy===v?' selected':''}>×${v}</option>`).join('')}</select>`;
  else if(choices)input=`<select id="${k}" data-setting="${k}">${Object.entries(choices).map(([v,text])=>`<option value="${v}"${state[k]===v?' selected':''}>${text}</option>`).join('')}</select>`;
  else{const [min,max]=O.ranges[k]||[10,10];input=`<input id="${k}" data-setting="${k}" type="number" value="${Number.isFinite(state[k])?state[k]:''}" min="${min}" max="${max}" step="${k==='techBoost'?'.1':'1'}">`;}
  return `<label for="${k}"><span>${label(k)}</span>${input}<small id="help-${k}">${help}</small></label>`;
}
function syncUrl(){
  const url=new URL(location.href);url.search='';
  url.searchParams.set('autoFit',autoFitEnabled?'1':'0');
  url.searchParams.set('lang',lang);url.searchParams.set('theme',theme);
  for(const [k,v] of Object.entries(state))url.searchParams.set(k,typeof v==='boolean'?v?'1':'0':String(v));
  history.replaceState({},'',url);
}
function setTheme(){document.documentElement.dataset.theme=theme;$('theme').value=theme;try{localStorage.setItem('ias-theme',theme);}catch{}syncUrl();}
function applyAutoFit(){
  autoFitResult=null;
  if(!autoFitEnabled)return;
  // Auto-managed fields may be repaired; other invalid settings remain visible.
  if(O.validate({...state,resourceLevel:0,t18:0,lithiumLevel:0}).length)return;
  autoFitResult=O.autoFit(state);Object.assign(state,autoFitResult.levels);
}
function build(){
  applyAutoFit();
  document.documentElement.lang=lang;
  document.title=t('Награды Ориона — OGame','Orion Rewards — OGame');
  $('title').textContent=t('Награды Ориона','Orion Rewards');
  $('intro').textContent=t('Стоимость развития, награды и баланс лития.','Account investment, rewards and lithium balance.');
  for(const [id,ru,en] of [['navIas','Калькулятор тарелок (IAS)','Scanner calculator (IAS)'],['navResources','Калькулятор подзданий','Sub-building calculator'],['navGeneral','Калькулятор T18 Генерала','General T18 calculator'],['navRewards','Награды Ориона','Orion rewards'],['navPlanner','Планировщик улучшений','Upgrade planner']]) $(id).textContent=t(ru,en);
  $('calculatorSelect').setAttribute('aria-label',t('Калькулятор','Calculator'));
  $('themeLabel').textContent=t('Дизайн','Design');$('minimal').textContent=t('Минимализм','Minimal');$('cosmic').textContent=t('Космос','Cosmic');
  for(const l of ['ru','en'])$('lang'+(l==='ru'?'Ru':'En')).setAttribute('aria-pressed',String(lang===l));
  $('form').innerHTML=`<section class="panel account-panel"><details id="accountSettings"${settingsOpen?' open':''}><summary class="settings-summary"><div><h2>${t('Конфигурация аккаунта','Account configuration')}</h2><p class="account-summary" id="accountSummary"></p></div><span class="settings-close">${t('Свернуть','Collapse')}</span><span class="settings-open">${t('Изменить','Edit')}</span></summary><div class="settings-actions"><button type="button" class="secondary" id="reset">${t('Начальные настройки','Reset defaults')}</button> <button type="button" class="secondary" id="copy">${t('Скопировать ссылку','Copy share link')}</button></div>
    <div class="field-grid">${['playerClass','economy','planets','scannerLevel','race','experience','techBoost','labLevel','t18','resourceLevel','lithiumLevel','availableSlots','resultsPerScan'].map(k=>field(k,k==='techBoost'?t('Усиливает эффект T18.','Boosts the T18 effect.'):k==='resourceLevel'?t('Одинаковый уровень металла, кристалла и дейтерия.','The same level for metal, crystal and deuterium.'):k==='availableSlots'?t('Число слотов, не уровень улучшения.','Slot count, not an upgrade level.'):k==='resultsPerScan'?t('Число результатов, не уровень улучшения.','Result count, not an upgrade level.'):'')).join('')}</div></details>
    <div class="auto-fit-control"><label class="auto-fit-label" for="autoFit"><input id="autoFit" type="checkbox"${autoFitEnabled?' checked':''}><span>${t('Автоподбор улучшений под тарелки','Match upgrades to scanner level')}</span></label><p class="note">${t('Подбирает ресурсные подздания, T18 и литий. Меняйте уровень тарелок в настройках аккаунта.','Fits resource sub-buildings, T18 and lithium. Change the scanner level in account settings.')}</p><p class="auto-fit-status" id="autoFitStatus" role="status"></p></div>
    <div class="metrics" id="accountMetrics"></div>
    <p class="status" id="copyStatus" role="status"></p></section>
    <section class="panel flight-panel"><div class="section-top"><h2>${t('Сколько получите за день','Your daily rewards')}</h2></div><div class="field-grid simulator-controls">${field('launchesPerDay')}${field('usedSlots')}<p class="flight-count" id="flightCount"></p><button type="button" class="calculate-button" id="calculateLoot">${t('Рассчитать','Calculate')}</button></div><p class="simulation-status" id="simulationStatus" role="status"></p><p class="note">${t('Один запуск — отправка флотов на выбранное число аномалий.','One launch sends fleets to the chosen number of anomalies.')}</p><div id="results" aria-live="polite"></div></section><div id="averagesMount"></div><div id="investmentMount"></div><div id="modelMount"></div>`;
  $('accountSettings').addEventListener('toggle',()=>{settingsOpen=$('accountSettings').open;});
  document.querySelectorAll('[data-setting]').forEach(el=>el.addEventListener('input',()=>{
    const k=el.dataset.setting;state[k]=typeof O.defaults[k]==='number'?(el.value.trim()===''?NaN:Number(el.value)):el.value;
    if(k==='launchesPerDay'||k==='usedSlots'){updateFlightCount();$('simulationStatus').textContent=t('Нажмите «Рассчитать», чтобы обновить прогноз за день.','Click Calculate to update the daily forecast.');return;}
    applyAutoFit();render();
  }));
  $('autoFit').onchange=()=>{autoFitEnabled=$('autoFit').checked;applyAutoFit();render();};
  $('calculateLoot').onclick=()=>{applyAutoFit();render();$('simulationStatus').textContent=O.validate(state).length?t('Проверьте введённые значения.','Check your inputs.'):t('Расчёт обновлён.','Calculation updated.');};
  $('reset').onclick=()=>{state={...O.defaults};autoFitEnabled=false;autoFitResult=null;build();};
  $('copy').onclick=async()=>{try{await navigator.clipboard.writeText(location.href);$('copyStatus').textContent=t('Ссылка скопирована.','Link copied.');}catch{$('copyStatus').textContent=t('Не удалось скопировать. Скопируйте адрес страницы из браузера.','Copy failed. Copy the address from your browser.');}};
  $('footer').textContent=t('Неофициальный калькулятор сообщества. Диапазоны полей — ограничения калькулятора, не максимальные уровни игры.','Unofficial community calculator. Input ranges are calculator limits, not game level caps.');
  setTheme();render();
}
function updateFlightCount(){
  $('flightCount').textContent=Number.isInteger(state.launchesPerDay)&&Number.isInteger(state.usedSlots)?`${n(state.launchesPerDay,0)} × ${n(state.usedSlots,0)} = ${n(state.launchesPerDay*state.usedSlots,0)} ${t('вылетов в день','flights per day')}`:'—';
}
function card(title,value,detail,tone='income'){return `<article class="stat ${tone}"><span>${title}</span><strong title="${n(value,6)}">${tone==='negative'?signedCompact(value):compact(value)}</strong><small>${detail}</small></article>`;}
function render(){
  for(const key of ['resourceLevel','t18','lithiumLevel']){$(key).disabled=autoFitEnabled;$(key).value=Number.isFinite(state[key])?state[key]:'';}
  $('autoFitStatus').textContent=autoFitEnabled?(autoFitResult?
    `${t('Подобрано: ресурсы','Selected: resources')} ${state.resourceLevel} · T18 ${state.t18} · ${t('литий','lithium')} ${state.lithiumLevel}. `+
    (autoFitResult.lithiumCovered?t('Литий покрывает ожидаемые расходы на награды и сканы.','Lithium covers expected reward claims and scans.'):t('Даже максимального уровня лития в калькуляторе недостаточно для покрытия расходов.','Even the calculator’s maximum lithium level does not cover spending.'))+
    (state.resultsPerScan!==6?t(' Цена скана при другом количестве результатов не подтверждена; подбор лития условный.',' Scan pricing for a different result count is unconfirmed; lithium fitting is conditional.'):'')+
    (autoFitResult.resourceLimit||autoFitResult.t18Limit?t(' Достигнут предел уровней калькулятора.',' Calculator level limit reached.'):''):
    t('Для автоподбора проверьте настройки аккаунта.','Check account settings to use automatic fitting.')):'';
  $('autoFitStatus').className='auto-fit-status'+(autoFitResult&&!autoFitResult.lithiumCovered?' negative':'');
  updateFlightCount();
  const errors=O.validate(state);$('validation').hidden=!errors.length;
  $('validation').textContent=errors.length?t('Проверьте настройки: ','Check settings: ')+errors.map(k=>k==='slots'?t('слотов в запуске больше, чем доступно','slots per launch exceed available slots'):fields[k]?label(k):k).join('; '):'';
  $('copy').disabled=Boolean(errors.length);
  if(errors.length){$('results').innerHTML='';$('investmentMount').innerHTML='';$('averagesMount').innerHTML='';$('accountMetrics').textContent='—';$('accountSummary').textContent=t('Проверьте настройки','Check settings');$('modelMount').innerHTML='';for(const key of ['experience','labLevel','t18','lithiumLevel'])$('help-'+key).textContent='—';return;}
  const s=state,r=O.calculate(s),d=r.daily;
  const classes={general:t('Генерал','General'),collector:t('Коллекционер','Collector'),discoverer:t('Исследователь','Discoverer')};
  $('accountSummary').textContent=`${classes[s.playerClass]} · ×${s.economy} · ${n(s.planets,0)} ${t('планет','planets')} · ${t('тарелки','scanners')} ${s.scannerLevel} · T18 ${s.t18}`;
  $('help-experience').textContent=t('Бонус опыта: +','Experience boost: +')+pct(.001*s.experience)+t(' · Максимум +10%',' · Maximum +10%');
  $('help-labLevel').textContent=t(...races[s.race])+t(' · Скидка: ',' · Discount: ')+pct(Math.min(.0025*s.labLevel,.25));
  $('help-t18').textContent=s.playerClass==='general'?`PvE ×${n(r.pve,5)} · PvP ×${n(r.pvp,5)}`:t('Эффект T18 Генерала не применяется.','General T18 effects are not applied.');
  $('help-lithiumLevel').textContent=t('Бонус лития: +','Lithium bonus: +')+pct(r.lithiumBonus);
  $('help-resourceLevel').textContent=t('Металл / кристалл / дейтерий: каждый +','Metal / crystal / deuterium: each +')+pct(r.resourceBonus);
  $('accountMetrics').innerHTML=`<div class="metric"><span>${t('IAS / уровень поиска','IAS / search level')}</span><b>${n(r.ias,0)}</b></div><div class="metric"><span>${t('Конверсия лития в час','Lithium conversion per hour')}</span><b title="${n(r.q,0)}">${compact(r.q)}</b></div><div class="metric"><span>${t('Цена одного скана','Cost per scan')}</span><b title="${n(r.scan)}">${compact(r.scan)}</b><small>${t('лития','lithium')}</small></div>`;
  const componentLabels={scanner:t('Тарелки','Scanners'),metal:t('Металлические подздания','Metal sub-buildings'),crystal:t('Кристаллические подздания','Crystal sub-buildings'),deut:t('Дейтериевые подздания','Deuterium sub-buildings'),lithium:t('Литиевые подздания','Lithium sub-buildings'),t18:'T18'};
  const row=(name,v)=>`<tr><td>${name}</td><td>${n(v.metal,0)}</td><td>${n(v.crystal,0)}</td><td>${n(v.deut,0)}</td><td>${exactMsu(v)}</td></tr>`;
  const changed=r.scannerOnlyScale!==1;
  const resultWarning=s.resultsPerScan!==6?t('Цена скана рассчитана по модели Q/2 для шести результатов. Цена при другом количестве результатов не подтверждена; расходы и баланс ниже условные.','Scan price uses the Q/2 model for six results. Pricing at other result counts is unconfirmed; spending and balance below are conditional.'):'';
  const classWarning=s.playerClass!=='general'?t('Режим без бонуса Генерала. Эффекты Коллекционера и Исследователя в прогноз не включены.','No-General-bonus mode. Collector and Discoverer effects are not included in the forecast.'):'';
  const warn=x=>x?`<p class="model-warning">${x}</p>`:'';
  $('investmentMount').innerHTML=`<details id="investmentDetails" class="panel investment"${investmentOpen?' open':''}><summary class="settings-summary"><div><h2>${t('Стоимость развития с нуля','Investment from zero')}</h2><strong class="investment-preview" title="${exactMsu(r.total)} ${msuLabel()}">${compact(Number(O.twiceMsu(r.total))/2)} ${msuLabel()}</strong></div><span class="investment-close">${t('Свернуть','Collapse')}</span><span class="investment-open">${t('Подробнее','Details')}</span></summary><div class="investment-body">
    <div class="investment-total">${exactMsu(r.total)} ${msuLabel()}</div>
    <p class="note">${t('Без стоимости открытия слотов и результатов скана: цены улучшений пока не подтверждены. Здания усиления ФЖ и скидки исследований не включены; их эффекты учтены.','Excludes slot and scan-result unlock costs: upgrade prices are unconfirmed. Lifeform boost and research discount buildings are excluded; their effects are applied.')}</p>
    <div class="table-wrap"><table><thead><tr><th>${t('Компонент · все планеты','Component · all planets')}</th><th>${t('Металл','Metal')}</th><th>${t('Кристалл','Crystal')}</th><th>${t('Дейтерий','Deuterium')}</th><th>${msuLabel()}</th></tr></thead><tbody>${Object.entries(r.costs).map(([k,v])=>row(componentLabels[k],v)).join('')}</tbody><tfoot>${row(t('Итого','Total'),r.total)}</tfoot></table></div></div></details>`;
  $('investmentDetails').addEventListener('toggle',()=>{investmentOpen=$('investmentDetails').open;});
  $('averagesMount').innerHTML=`<section class="averages-panel" aria-label="${t('Средние на один вылет','Averages per flight')}"><h2>${t('Средние значения на один вылет','Average values per flight')}</h2><p class="note averages-description">${t('Средние награды при отборе выгодных аномалий.','Average rewards when selecting profitable anomalies.')}</p>
    <div class="summary-grid rewards-summary">${card(t('Ресурсная награда · МСУ','Resource reward · MSU'),r.rewards.resource,t('До расходов, топлива и потерь.','Before spending, fuel and losses.'))}${card(t('Литий получен','Lithium received'),r.rewards.lithium,t('Включая вылеты без литиевой находки.','Includes flights with no lithium find.'))}${card(t('Расход лития на вылет','Lithium spent per flight'),r.claim+r.scansPerFlight*r.scan,t('Получение награды + поиск аномалий.','Reward claim + anomaly search.'),'expense')}${card(t('Баланс лития','Lithium balance'),r.rewards.lithium-r.claim-r.scansPerFlight*r.scan,t('После получения награды и сканов.','After reward claims and scans.'),r.rewards.lithium-r.claim-r.scansPerFlight*r.scan<0?'negative':'income')}</div>
    <details class="flight-details"><summary>${t('Точные значения и расходы','Exact values and spending')}</summary><dl class="ledger"><dt>${t('Ресурсы · МСУ','Resources · MSU')}</dt><dd>${n(r.rewards.resource,6)}</dd><dt>${t('Литий получен','Lithium received')}</dt><dd>${n(r.rewards.lithium,6)}</dd><dt>${t('Получение награды · литий','Reward claim · lithium')}</dt><dd>${n(r.claim,6)}</dd><dt>${t('Поиск аномалий · литий','Anomaly search · lithium')}</dt><dd>${n(r.scansPerFlight*r.scan,6)}</dd><dt>${t('Баланс лития','Lithium balance')}</dt><dd>${n(r.rewards.lithium-r.claim-r.scansPerFlight*r.scan,6)}</dd></dl></details>
    ${warn(classWarning)}${warn(resultWarning)}</section>`;
  $('results').innerHTML=`<section class="daily-panel"><div class="section-top"><h2>${t('Прогноз за день','Daily forecast')}</h2><span class="note">${n(s.launchesPerDay,0)} × ${n(s.usedSlots,0)} = ${n(d.flights,0)} ${t('вылетов','flights')}</span></div>
    <div class="daily-grid"><article class="balance"><h3>${t('Ресурсная награда · МСУ','Resource reward · MSU')}</h3><strong title="${n(d.resources,6)}">${compact(d.resources)} ${msuLabel()}</strong><p class="note">${t('Металл + 1,5 × кристалл + 3 × дейтерий. Литий в МСУ не включён.','Metal + 1.5 × crystal + 3 × deuterium. Lithium is excluded from MSU.')}</p><p class="note">${t('Топливо и потери флота не учитываются.','Fuel and fleet losses are excluded.')}</p></article>
    <article class="balance"><h3>${t('Изменение лития за день','Daily lithium change')}</h3><strong title="${n(d.lithiumChange,6)}" class="${d.lithiumChange<0?'negative':''}">${signedCompact(d.lithiumChange)}</strong><dl class="ledger"><dt>${t('Литий получен','Lithium received')}</dt><dd>+${n(d.lithium)}</dd><dt>${t('Получение наград','Reward claims')}</dt><dd>−${n(d.claimCost)}</dd><dt>${t('Сканы · среднее ожидание','Scans · expected average')}</dt><dd>−${n(d.scanCost)}</dd></dl><p class="note">${t('Конверсия лития не включена в этот баланс.','Lithium conversion is excluded from this balance.')}</p></article></div>
    <p class="note">${t('Ожидаемо сканов на вылет: ','Expected scans per flight: ')}${n(r.scansPerFlight,6)} · ${t('За день: ','Per day: ')}${n(d.scans,4)}. ${t('При округлении сканов вверх: ','Rounding scans up: ')}${n(Math.ceil(d.scans),0)} ${t('сканов → бюджет ','scans → budget ')}${n(d.scanBudget)} ${t('лития','lithium')}.</p>
    ${warn(resultWarning)}${warn(changed?t('Награды ресурсов и стоимость получения масштабированы через Q. Прогноз предполагает прежнее распределение миссий, звёзд, внутренних волн и отношения уровня аномалии к IAS.','Resource rewards and claim costs are scaled by Q. The forecast assumes unchanged mission, star and internal-wave distributions and anomaly-level-to-IAS ratios.'):'')}
    </section>`;
  $('modelMount').innerHTML=modelDetails();
  syncUrl();
}
function modelDetails(){const b=O.baseline;return `<details class="panel model-panel"><summary>${t('Как считается прогноз','How the forecast works')}</summary>
  <h3>${t('Автоподбор улучшений','Automatic upgrade fitting')}</h3><p>${t('Для выбранных тарелок подбор начинается с нулевых уровней ресурсных подзданий и T18. На каждом шаге выбирается улучшение с минимальной стоимостью МСУ за +1% ресурсной награды относительно текущих уровней, пока оно не станет дороже следующего уровня тарелок. Три ресурсных подздания повышаются вместе на всех планетах. T18 подбирается только для Генерала. Затем выбирается минимальный уровень литиевого подздания, покрывающий ожидаемые расходы на получение наград и сканы. Это рекомендуемая конфигурация по выбранному правилу, а не глобальный оптимум и не план улучшения уже построенного аккаунта.','Fitting starts at zero resource sub-building and T18 levels for the chosen scanners. Each step chooses the lowest MSU cost per relative +1% resource reward until further upgrades are more expensive than the next scanner level. All three resource sub-buildings are upgraded together across all planets. T18 is fitted for General only. Lithium then uses the lowest level covering expected reward claims and scans. This is a recommended target under this rule, not a global optimum or an upgrade plan for an existing account.')}</p>
  <h3>${t('Исходный эксперимент' ,'Original experiment')}</h3><p>${t('Экономика ×10 · 18 планет × тарелка 39 · IAS и поиск 702 · конверсия 4 436 514 лития/ч · скан 2 218 257 лития · 6 результатов. 1 878 аномалий за 313 сканов; выбрано 102 вылета: 62 ресурсных PvP и 40 литиевых. Всего 12 PvE и 90 PvP. Исходный Генерал: PvE ×1,5, PvP ×2; бонус подзданий +62%.','Economy ×10 · 18 planets × scanner 39 · IAS and search 702 · conversion 4,436,514 lithium/h · scan price 2,218,257 lithium · 6 results. 1,878 anomalies from 313 scans; 102 selected flights: 62 resource PvP and 40 lithium missions. In total: 12 PvE and 90 PvP. Original General: PvE ×1.5, PvP ×2; sub-building bonus +62%.')}</p>
  <p>${t('Средние исходного эксперимента: 728 937 762,315527 МСУ ресурсов; 23 137 587,615496 лития получено; 21 717 567,431373 лития на получение. Все награды до расходов.','Original experiment averages: 728,937,762.315527 resource MSU; 23,137,587.615496 lithium received; 21,717,567.431373 lithium claim cost. All rewards are before spending.')}</p>
  <h3>${t('Второй алгоритм отбора','Second selection algorithm')}</h3><ol><li>${t('Ресурсы: только PvP, индивидуальный базовый K лута >12, ресурсная награда с бонусами >200 млн МСУ.','Resources: PvP only, individual base loot K >12, reward including bonuses >200 million MSU.')}</li><li>${t('Литий: награда с бонусами ≥1,5 полной стоимости получения. Для отбора награды приведены к бонусу +62%.','Lithium: boosted reward ≥1.5 times the full claim cost. Selection rewards were normalized to a +62% bonus.')}</li><li>${t('Миссия, подходящая под оба условия, считается один раз.','A mission matching both conditions is counted once.')}</li></ol>
  <div class="table-wrap"><table><thead><tr><th>${t('Режим','Mode')}</th><th>${t('Вылетов','Flights')}</th><th>${t('Базовый МСУ · сумма','Base MSU · sum')}</th><th>${t('Базовый литий · сумма','Base lithium · sum')}</th></tr></thead><tbody>${['pve','pvp'].map(k=>`<tr><td>${k.toUpperCase()}</td><td>${b[k].flights}</td><td>${n(b[k].baseMsuSum,8)}</td><td>${n(b[k].baseLithiumSum,8)}</td></tr>`).join('')}</tbody></table></div>
  <p>${t('Из базовых сумм сняты бонусы подзданий и Генерала. P — планеты, L — уровень тарелки, T — T18, H — уровень здания скидки, R — уровень опыта, B — усиление здания в долях единицы, U — ресурсный уровень, V — литиевый уровень.','Base sums exclude sub-building and General bonuses. P = planets, L = scanner level, T = T18, H = discount building level, R = experience level, B = building boost as a decimal, U = resource level, V = lithium level.')}</p>
  <pre>IAS = P × L; search = IAS
Q = P × floor(16.896 × economy × L × 1.1^(L−1))
scale = Q / 4436514; scanPrice = Q / 2
experienceBoost = 0.001 × R
E = 0.002 × T × P × (1 + experienceBoost + B)
GeneralPvE = 1.5 + 0.5 × E; GeneralPvP = 2 + E
${t('Без Генерала оба множителя = 1','Without General, both multipliers = 1')}
resourceBonus = 0.002 × P × U
lithiumBonus = 0.002 × P × V
resourceMean = (247005407.19766924 × GeneralPvE
  + 22762786610.090557 × GeneralPvP) / 102 × scale × (1 + resourceBonus)
lithiumMean = (107452034.20347393 × GeneralPvE
  + 647816510.3907931 × GeneralPvP) / 102 × scale × (1 + lithiumBonus)
claimMean = 21717567.43137255 × scale
selectionRate = 102 / 1878
flights = launchesPerDay × usedSlots
scans = flights / (resultsPerScan × selectionRate)
dailyResource = resourceMean × flights
dailyLithiumChange = lithiumMean × flights − claimMean × flights − scans × scanPrice
MSU = Metal + 1.5 × Crystal + 3 × Deuterium
scannerCost(L) = round([90,45,15] × 1.5^(L−1))
subBuildingCost(L) = floor(base × 1.5^(L−1))
discount = min(0.0025 × H, 0.25)
T18Cost(T) = floor([300000,180000,120000] × T × 1.7^(T−1) × (1−discount))
totalCost = P × sum(level costs from 1 to target)</pre>
  <p>${t('Награда лития всегда масштабируется пропорционально конверсии лития в час: учитываются уровень тарелок, число планет и скорость экономики. Зависимость награды лития от тарелок — допущение модели, пока не подтверждённое экспериментом.', 'Lithium rewards always scale proportionally to hourly lithium conversion, accounting for scanner level, planet count and economy speed. The dependency of lithium rewards on scanners is a model assumption that has not yet been confirmed experimentally.')}</p>
  <p>${t('Q — конверсия лития в час. Экономика масштабируется линейно относительно baseline ×10; для других скоростей это допущение модели.', 'Q is lithium conversion per hour. Economy is scaled linearly relative to the ×10 baseline; other speeds use this model assumption.')}</p>
  <p>${t('Каждый ресурс округляется отдельно. Стоимость рассчитана точной целочисленной арифметикой; награды — средние по эмпирической модели. Корабли, артефакты, предметы и XP в МСУ не входят. Изменение числа результатов меняет ожидаемое число сканов, но его влияние на цену скана не подтверждено.','Each resource is rounded separately. Costs use exact integer arithmetic; rewards are empirical-model averages. Ships, artifacts, items and XP are excluded from MSU. Result count changes the expected scan count, but its effect on scan price is unconfirmed.')}</p>
  <p>${t('Базовые цены подзданий М/К/Д: металл 112500/37500/18000; кристалл 37500/67500/27000; дейтерий 30000/37500/45000; литий 52500/37500/37500.','Sub-building base prices M/C/D: metal 112500/37500/18000; crystal 37500/67500/27000; deuterium 30000/37500/45000; lithium 52500/37500/37500.')}</p>
  <p><a href="https://github.com/zikunow/ogame-orion-ias-calculator">${t('Исходный проект и формулы стоимости','Original project and cost formulas')}</a> · <a href="https://docs.google.com/spreadsheets/d/1qThnC-g_e5L8qr_c1JbNX0UI3StwBIj048nCSvhY9Ps/edit">${t('Таблица исходного эксперимента','Original experiment spreadsheet')}</a></p>
  </details>`;}
$('calculatorSelect').onchange=()=>{const url=new URL($('calculatorSelect').value);url.searchParams.set('lang',lang);url.searchParams.set('theme',theme);location.href=url.href;};
$('langRu').onclick=()=>{lang='ru';build();};$('langEn').onclick=()=>{lang='en';build();};
$('theme').onchange=()=>{theme=$('theme').value;setTheme();};
build();

