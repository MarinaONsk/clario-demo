import {api} from './transport.js';
const $ = selector => document.querySelector(selector);
const categories = ['ВОПРОС','ПРОСЬБА','ПРОБЛЕМА','ПРЕДЛОЖЕНИЕ','ИНФОРМАЦИЯ'];
const categoryClass = c => `category-${categories.indexOf(c)}`;
const statuses = {new:'Новая',in_progress:'В работе',done:'Выполнена'};
let state = {messages:[],tasks:[],today:'',analytics:{}};
let mode = 'single'; let activeView = 'messages'; let taskContext = null; let mutationBusy = false;
const escape = value => String(value ?? '').replace(/[&<>"']/g,c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const categoryOptions = selected => categories.map(c=>`<option value="${c}" ${c===selected?'selected':''}>${c}</option>`).join('');
function notice(message, error = false) { const el=$('#notice');el.textContent=message;el.className=error?'notice error':'notice';el.hidden=false; }
async function refresh() {
  try {state=await api('/state');applyRuntime();$('#connection').className='connection';render();return true;}
  catch(error){$('#connection').textContent='● Нет соединения';$('#connection').className='connection offline';notice(error.message,true);return false;}
}
function applyRuntime() {
  const cloud=state.mode==='workers-ai';
  const browser=state.mode==='browser-demo';
  document.querySelector('#demo-controls')?.toggleAttribute('hidden',!browser);
  if(browser){
    $('.outline-label').textContent='Браузерная демоверсия · 1.0';
    $('.sidebar-bottom p').textContent='Данные только в этом браузере. Не вводите персональные или корпоративные сведения.';
    const dot=$('.sidebar-bottom > span');
    dot.textContent='';
    if(dot.nextSibling?.nodeType===Node.TEXT_NODE)dot.nextSibling.textContent=' Браузерное пространство';
    $('footer > span:last-child').textContent=state.storagePersistent?'Данные сохраняются в этом браузере':'Данные только в памяти — до обновления страницы';
    $('#storage-warning').hidden=state.storagePersistent;
  }
  $('#connection').textContent=cloud?'● Cloudflare · защищённый доступ':browser?'● Браузерная демоверсия':'● Локальный сервер';
  $('.demo-tag').textContent=cloud?'ОБЛАКО':'ДЕМО';
  $('.demo-banner strong').textContent=cloud?(state.aiEnabled?'Облачный режим — Workers AI':'Облачный режим — AI отключён'):'Демонстрационный режим — AI не вызывается';
  $('.demo-banner div > span').textContent=cloud?(state.aiEnabled?`Модель ${state.model}. Проверьте предложенную категорию; при ошибке сохранения не будет.`:'Выберите категорию вручную. Автоматическая обработка пока недоступна.'):'Категории определяются простыми правилами. Проверьте результат и при необходимости измените его.';
  $('#initial-category').options[0].textContent=cloud?'Через Workers AI':'По демоправилам';
  const publicAI=state.classificationMode==='real-ai';
  if(state.classificationMode){
    $('#public-ai-controls').hidden=false;$('#classification-mode').value=state.classificationMode;
    $('#public-ai-status').textContent=publicAI?(state.publicAiConfigured?`Только синтетические данные. Общий лимит — ${state.aiDailyLimit??5} сообщений-попыток в сутки UTC. ${state.aiQuota?'Последний известный остаток: '+state.aiQuota.remaining+'. ':''}Текст отправляется только при обработке.`:'Настоящий AI выбран, но ещё не настроен. Автоматическая обработка недоступна.'):'Демонстрационные правила — AI не вызывается. Суточного лимита CLARIO нет, пакет — до 15 сообщений.';
    const fallbackButton=$('#continue-without-ai');if(fallbackButton)fallbackButton.hidden=!publicAI;
    if(publicAI){$('.demo-tag').textContent='AI';$('.demo-banner strong').textContent='Настоящий AI — GLM-4.7-Flash';$('.demo-banner div > span').textContent='Только синтетические обращения. Перед отправкой — Turnstile. При ошибке демоподмены нет.';$('#initial-category').options[0].textContent='Через Workers AI';}
    $('#demo-controls > p').textContent=publicAI?'История и задачи остаются в браузере; для AI передаются только отправляемые тексты.':'Только синтетические данные. AI не вызывается; данные не отправляются в API.';
  }
  if(cloud){
    $('.outline-label').textContent='Облачная версия · 1.0';
    $('.sidebar-bottom').innerHTML='<span class="local-dot"></span> Облачное пространство<p>Данные хранятся в Cloudflare D1.<br>Доступ ограничен Cloudflare Access.</p><div class="profile"><span class="avatar">К</span><div>Координатор<small>Защищённое рабочее место</small></div></div>';
    $('footer > span:last-child').textContent='Облачная версия · данные в D1';
  }
}
function showView(view) {
  if(!['messages','tasks','analytics'].includes(view))view='messages';
  activeView=view;
  document.querySelectorAll('.view').forEach(el=>el.hidden=el.id!==`view-${view}`);
  document.querySelectorAll('[data-view]').forEach(el=>{el.classList.toggle('active',el.dataset.view===view);el.setAttribute('aria-current',el.dataset.view===view?'page':'false');});
  $('#breadcrumb').textContent={messages:'Сообщения',tasks:'Задачи',analytics:'Аналитика'}[view];
}
function addInput(value = '') {
  const n=$('#message-inputs').children.length+1;
  const wrap=document.createElement('div');wrap.className='message-input';
  wrap.innerHTML=`<div class="input-caption"><label for="message-${n}">Сообщение <span class="input-number">${n}</span></label><button type="button" class="remove-input" aria-label="Удалить это поле сообщения">Убрать</button></div><textarea id="message-${n}" maxlength="4000" rows="3" required placeholder="Например: Пожалуйста, подготовьте отчёт по итогам встречи…"></textarea>`;
  wrap.querySelector('textarea').value=value;
  wrap.querySelector('button').addEventListener('click',()=>{wrap.remove();renumber();});
  $('#message-inputs').append(wrap);renumber();
}
function renumber() {
  const inputs=[...$('#message-inputs').children];
  inputs.forEach((el,i)=>{el.querySelector('.input-number').textContent=i+1;el.querySelector('textarea').id=`message-${i+1}`;el.querySelector('label').htmlFor=`message-${i+1}`;el.querySelector('.remove-input').hidden=mode!=='batch'||inputs.length===1;});
  $('#batch-count').textContent=`${inputs.length} / 15`;$('#add-message').disabled=inputs.length>=15||mutationBusy;
}
function setMode(next) {
  if(mutationBusy||next===mode)return;
  if(next==='single'&&$('#message-inputs').children.length>1){notice('Чтобы перейти к одному сообщению, сохраните пакет или уберите дополнительные поля.',true);return;}
  mode=next;$('#single-mode').classList.toggle('selected',mode==='single');$('#batch-mode').classList.toggle('selected',mode==='batch');
  $('#single-mode').setAttribute('aria-pressed',String(mode==='single'));$('#batch-mode').setAttribute('aria-pressed',String(mode==='batch'));
  $('#batch-controls').hidden=mode!=='batch';$('#save-messages').textContent=mode==='batch'?'Добавить пакет ↗':'Добавить сообщение ↗';
  $('#composer-hint').textContent=mode==='batch'?'Одно поле — одно сообщение. Выбранная категория применяется ко всему пакету.':'До 4 000 символов · категория доступна для исправления';renumber();
}
function formatDate(value, withTime=false){return new Intl.DateTimeFormat('ru-RU',withTime?{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}:{day:'numeric',month:'short',year:'numeric'}).format(new Date(withTime?value:value+'T12:00:00'));}
function renderMessages() {
  const filtered=state.messages.filter(m=>!$('#message-filter').value||m.category===$('#message-filter').value);
  $('#message-count').textContent=state.messages.length;
  $('#message-list').innerHTML=filtered.length?filtered.map(m=>{
    const tasks=state.tasks.filter(t=>t.message_id===m.id);
    return `<article class="message-card"><div class="message-icon ${categoryClass(m.category)}">${['?','↗','!','✧','i'][categories.indexOf(m.category)]}</div><div class="message-main"><div class="message-meta"><span class="category-chip ${categoryClass(m.category)}">${escape(m.category)}</span><span>${m.classification_method==='manual'?'Выбрано вручную':m.classification_method==='workers-ai'?'Workers AI':'Демоправила'}${m.manually_corrected?' · исправлено вручную':''}</span><time datetime="${escape(m.created_at)}">${formatDate(m.created_at,true)}</time></div><p class="message-text">${escape(m.text)}</p><div class="message-actions"><label>Категория <select class="category-select" data-message="${m.id}" aria-label="Категория сообщения: ${escape(m.text.slice(0,60))}">${categoryOptions(m.category)}</select></label><span class="task-link-count">${tasks.length?`Задач: ${tasks.length}`:'Без задач'}</span><button class="create-task" data-create-task="${m.id}">＋ Создать задачу</button></div></div></article>`;
  }).join(''):`<div class="empty-state"><span>◫</span><h3>${state.messages.length?'Нет сообщений этой категории':'Начните с первого сообщения'}</h3><p>${state.messages.length?'Выберите другую категорию в фильтре.':'Добавьте сообщение выше — оно появится здесь с категорией и возможностью создать задачу.'}</p></div>`;
  $('#message-list').querySelectorAll('[data-create-task]').forEach(el=>el.addEventListener('click',()=>openTask(el.dataset.createTask)));
  $('#message-list').querySelectorAll('[data-message]').forEach(el=>el.addEventListener('change',async()=>{
    if(mutationBusy)return;mutationBusy=true;el.disabled=true;
    try{await api('/messages/'+el.dataset.message,'PATCH',{category:el.value});notice('Категория сохранена вручную.');await refresh();}
    catch(error){notice(error.message,true);el.value=state.messages.find(m=>m.id===el.dataset.message).category;}
    finally{mutationBusy=false;el.disabled=false;}
  }));
}
function renderTasks() {
  const assignee=$('#task-assignee-filter').value;
  $('#task-assignee-filter').innerHTML='<option value="">Все ответственные</option>'+[...new Set(state.tasks.map(t=>t.assignee))].sort().map(a=>`<option ${a===assignee?'selected':''} value="${escape(a)}">${escape(a)}</option>`).join('');
  const list=state.tasks.filter(t=>(!$('#task-status-filter').value||t.status===$('#task-status-filter').value)&&(!$('#task-assignee-filter').value||t.assignee===$('#task-assignee-filter').value)&&(!$('#task-overdue-filter').checked||(t.status!=='done'&&t.due_date<state.today)));
  $('#task-list').innerHTML=list.length?`<div class="task-list">${list.map(t=>{
    const overdue=t.status!=='done'&&t.due_date<state.today;
    return `<article class="task-card"><div class="task-top"><span class="status-chip status-${t.status}">${statuses[t.status]}</span>${overdue?'<span class="overdue-label">Срок истёк</span>':''}<button class="text-button" data-edit-task="${t.id}">Изменить</button></div><h2>${escape(t.title)}</h2><p class="task-origin">${escape(t.message_text)}</p><div class="task-bottom"><span><b class="mini-avatar">${escape(t.assignee[0].toUpperCase())}</b>${escape(t.assignee)}</span><time class="${overdue?'overdue-label':''}" datetime="${t.due_date}">До ${formatDate(t.due_date)}</time></div></article>`;
  }).join('')}</div>`:`<div class="empty-state"><span>☑</span><h3>${state.tasks.length?'Задач по этим фильтрам нет':'Здесь будут ваши задачи'}</h3><p>${state.tasks.length?'Измените фильтры, чтобы увидеть остальные задачи.':'Откройте «Сообщения» и нажмите «Создать задачу» у нужного сообщения.'}</p></div>`;
  $('#task-list').querySelectorAll('[data-edit-task]').forEach(el=>el.addEventListener('click',()=>openTask(null,el.dataset.editTask)));
}
function renderAnalytics() {
  const a=state.analytics;
  const bar=(name,value,total,cls='')=>`<div class="chart-row"><div><span>${escape(name)}</span><strong>${value}</strong></div><div class="bar-track"><span class="${cls}" data-width="${total?value/total*100:0}"></span></div></div>`;
  $('#analytics-content').innerHTML=`<div class="analytics-totals"><div class="panel"><span>Сообщений</span><strong>${a.messages}</strong></div><div class="panel"><span>Задач</span><strong>${a.tasks}</strong></div><div class="panel"><span>Выполнено</span><strong>${a.byStatus.done}</strong></div><div class="panel"><span>Просрочено</span><strong>${a.overdue}</strong></div></div><div class="analytics-grid"><section class="panel"><h2>Сообщения по категориям</h2>${categories.map(c=>bar(c,a.byCategory[c],a.messages,categoryClass(c))).join('')}</section><section class="panel"><h2>Задачи по статусам</h2>${Object.entries(statuses).map(([s,name])=>bar(name,a.byStatus[s],a.tasks)).join('')}</section><section class="panel"><h2>Нагрузка по ответственным</h2>${Object.entries(a.byAssignee).length?Object.entries(a.byAssignee).sort((a,b)=>b[1]-a[1]).map(([name,count])=>bar(name,count,a.tasks)).join(''):'<p class="muted">Создайте первую задачу — здесь появится распределение.</p>'}</section><section class="panel insight"><span class="spark">✧</span><h2>Все действия на виду</h2><p>Изменение категории и статуса задачи сразу обновляет показатели. Просроченными считаются незавершённые задачи со сроком раньше сегодняшней даты.</p><small>Локальная дата: ${formatDate(state.today)}</small></section></div>`;
  $('#analytics-content').querySelectorAll('[data-width]').forEach(el=>{el.style.width=el.dataset.width+'%';});
}
function render() {
  $('#nav-message-count').textContent=state.messages.length;$('#nav-task-count').textContent=state.tasks.filter(t=>t.status!=='done').length;
  $('#stat-messages').textContent=state.analytics.messages;$('#stat-active').textContent=state.analytics.byStatus.in_progress;$('#stat-overdue').textContent=state.analytics.overdue;
  renderMessages();renderTasks();renderAnalytics();
}
function openTask(messageId, taskId) {
  if(mutationBusy)return;
  const task=taskId?state.tasks.find(t=>t.id===taskId):null;
  const message=state.messages.find(m=>m.id===(task?.message_id??messageId));
  taskContext={taskId:task?.id,messageId:message.id};
  $('#task-dialog-title').textContent=task?'Изменить задачу':'Новая задача';$('#task-source').textContent=message.text;
  $('#task-title').value=task?.title??message.text.slice(0,200);$('#task-assignee').value=task?.assignee??'';$('#task-due').value=task?.due_date??state.today;$('#task-status').value=task?.status??'new';$('#task-error').textContent='';$('#task-dialog').showModal();
}
$('#initial-category').insertAdjacentHTML('beforeend',categoryOptions());$('#message-filter').insertAdjacentHTML('beforeend',categoryOptions());
$('#single-mode').addEventListener('click',()=>setMode('single'));$('#batch-mode').addEventListener('click',()=>setMode('batch'));
$('#add-message').addEventListener('click',()=>{if(!mutationBusy&&$('#message-inputs').children.length<15){addInput();$('#message-inputs').lastElementChild.querySelector('textarea').focus();}});
$('#message-form').addEventListener('submit',async event=>{
  event.preventDefault();if(mutationBusy)return;
  const messages=[...document.querySelectorAll('#message-inputs textarea')].map(el=>({text:el.value,category:$('#initial-category').value||undefined}));
  const controls=[...$('#message-form').querySelectorAll('button,select,textarea'),...document.querySelectorAll('#classification-mode,#demo-reset,#demo-load')].map(el=>[el,el.disabled]);
  mutationBusy=true;controls.forEach(([el])=>el.disabled=true);$('#message-form').setAttribute('aria-busy','true');
  if(state.classificationMode==='real-ai'&&!$('#initial-category').value)notice('Подтвердите Turnstile и дождитесь ответа AI. Автоматического повтора нет.');
  try{const result=await api('/messages','POST',{messages});$('#message-inputs').replaceChildren();addInput();const usedAI=result.messages.some(m=>m.classification_method==='workers-ai');notice(`Сохранено сообщений: ${messages.length}. ${$('#initial-category').value?'Категория выбрана вручную.':usedAI?'Категории получены через Workers AI.':'Использованы демоправила, AI не вызывался.'}`);await refresh();}
  catch(error){notice(error.message,true);}
  finally{mutationBusy=false;controls.forEach(([el,disabled])=>el.disabled=disabled);$('#message-form').setAttribute('aria-busy','false');renumber();}
});
$('#task-form').addEventListener('submit',async event=>{
  event.preventDefault();if(mutationBusy)return;mutationBusy=true;$('#save-task').disabled=true;
  const body={message_id:taskContext.messageId,title:$('#task-title').value,assignee:$('#task-assignee').value,due_date:$('#task-due').value,status:$('#task-status').value};
  try{await api('/tasks'+(taskContext.taskId?'/'+taskContext.taskId:''),taskContext.taskId?'PATCH':'POST',body);$('#task-dialog').close();notice('Задача сохранена.');await refresh();}
  catch(error){$('#task-error').textContent=error.message;}
  finally{mutationBusy=false;$('#save-task').disabled=false;}
});
for(const selector of ['#close-dialog','#cancel-task'])$(selector).addEventListener('click',()=>{if(!mutationBusy)$('#task-dialog').close();});
$('#task-dialog').addEventListener('cancel',event=>{if(mutationBusy)event.preventDefault();});
document.querySelectorAll('[data-view]').forEach(el=>el.addEventListener('click',()=>{location.hash=el.dataset.view;showView(el.dataset.view);refresh();}));
window.addEventListener('hashchange',()=>showView(location.hash.slice(1)));
$('#message-filter').addEventListener('change',renderMessages);
for(const selector of ['#task-status-filter','#task-assignee-filter','#task-overdue-filter'])$(selector).addEventListener('change',renderTasks);
document.querySelector('#demo-load')?.addEventListener('click',async()=>{
  if(mutationBusy)return;
  if([...document.querySelectorAll('#message-inputs textarea')].some(el=>el.value.trim())&&!confirm('Заменить несохранённый ввод синтетическими примерами?'))return;
  try{
    const {demoMessages}=await import('./transport.js');
    $('#message-inputs').replaceChildren();mode='single';setMode('batch');
    $('#initial-category').value='';demoMessages.forEach(value=>addInput(value));
    notice('Добавлены синтетические примеры в форму. Нажмите «Добавить пакет». AI не вызывается.');
  }catch{notice('Не удалось загрузить примеры.',true);}
});
document.querySelector('#demo-reset')?.addEventListener('click',async()=>{
  if(mutationBusy||!confirm('Удалить обращения и задачи этой демоверсии и очистить ввод? Другие проекты не затрагиваются.'))return;
  mutationBusy=true;$('#demo-reset').disabled=true;$('#demo-load').disabled=true;
  try{
    await api('/reset','POST');$('#task-dialog').close();taskContext=null;
    $('#message-inputs').replaceChildren();addInput();
    $('#initial-category').value='';$('#message-filter').value='';$('#task-status-filter').value='';$('#task-assignee-filter').value='';$('#task-overdue-filter').checked=false;
    await refresh();notice('Демосценарий сброшен.');
  }catch(error){notice(error.message,true);}
  finally{mutationBusy=false;$('#demo-reset').disabled=false;$('#demo-load').disabled=false;renumber();}
});
document.querySelector('#classification-mode')?.addEventListener('change',async event=>{
  if(mutationBusy)return;
  try{await api('/classification-mode','POST',{mode:event.target.value});await refresh();}catch(error){notice(error.message,true);}
});
document.querySelector('#continue-without-ai')?.addEventListener('click',async()=>{
  if(mutationBusy)return;
  try{await api('/classification-mode','POST',{mode:'demo'});await refresh();notice('Выбран демонстрационный режим — AI не вызывается. Введённый текст сохранён в форме; нажмите добавление для обработки по правилам.');}
  catch(error){notice(error.message,true);}
});
addInput();showView(location.hash.slice(1));refresh();
