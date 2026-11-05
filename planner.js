const dinnerMinute = 18 * 60;
const applianceLabels = {weber:'22-inch Weber',ninja:'Ninja SP101',stove:'Stovetop'};
const phaseLabels = {early:'Advance preparation',prep:'Wednesday, November 25',cook:'Thursday, November 26'};
const phaseOrder = Object.keys(phaseLabels);

function plannedTasks() {
  return Object.values(schedule()).flat().map(([date,title,detail,gear,links,defaults])=>{
    const edit=state.taskEdits[defaults.id];
    const valid=edit && Number.isInteger(edit.start) && Number.isInteger(edit.duration) &&
      edit.start>=0 && edit.duration>=1 && edit.start+edit.duration<=1440;
    const {start,duration}=valid?edit:defaults;
    const units=valid && defaults.appliance==='stove' && Number.isInteger(edit.units) && edit.units>=1 && edit.units<=6
      ? edit.units : defaults.units;
    return {...defaults,date,title,detail,gear,links,start,duration,units,end:start+duration};
  }).sort((a,b)=>phaseOrder.indexOf(a.phase)-phaseOrder.indexOf(b.phase)||a.start-b.start);
}
function overlaps(a,b) {
  return a.start < b.end && b.start < a.end;
}
function taskProblems(task,plan,burners=state.burners) {
  const neighbors=task.appliance ? plan.filter(other=>other.id!==task.id &&
    other.phase===task.phase && other.appliance===task.appliance && overlaps(task,other)) : [];
  const capacity=task.appliance==='stove' ? burners : 1;
  const edges=[task.start,...neighbors.map(other=>Math.max(task.start,other.start))];
  const crowded=edges.flatMap(at=>{
    const active=neighbors.filter(other=>other.start<=at && at<other.end);
    return active.reduce((total,other)=>total+other.units,task.units)>capacity?active:[];
  });
  const before=plan.filter(other=>task.after.includes(other.id)&&task.start<other.end);
  const after=plan.filter(other=>other.after.includes(task.id)&&task.end>other.start);
  return {
    tooMany:task.units>capacity,
    overlaps:[...new Map(crowded.map(other=>[other.id,other])).values()],
    before,after,
    late:task.phase==='cook' && task.end>dinnerMinute
  };
}
const hasProblem = p => Boolean(p.tooMany||p.overlaps.length||p.before.length||p.after.length||p.late);

function suggestedStart(task,plan) {
  // Search the closest available minute, respecting capacity and dependencies.
  const last=(task.phase==='cook'?dinnerMinute:1440)-task.duration;
  for(let distance=1;distance<=1440;distance++){
    for(const start of [task.start+distance,task.start-distance]){
      if(start<0||start>last)continue;
      const proposed={...task,start,end:start+task.duration};
      if(!hasProblem(taskProblems(proposed,plan)))return start;
    }
  }
  return null;
}
function clock(minutes) {
  if(minutes===1440)return translateTime('12:00 AM')+' '+t('(next day)');
  return translateTime(timeOf(minutes));
}
function clockInput(minutes) {
  return String(Math.floor(minutes/60)).padStart(2,'0')+':'+String(minutes%60).padStart(2,'0');
}
function taskDate(task,minutes=task.start) {
  const day=task.phase==='early'?25-Math.ceil(state.weight/4):task.phase==='prep'?25:26;
  return new Date(2026,10,day,0,minutes);
}
function taskStatus(task,now) {
  if(state.completed[task.id])return 'Completed';
  if(now>=taskDate(task) && now<taskDate(task,task.end))return 'In progress';
  return now>=taskDate(task,task.end)?'Overdue':'Pending';
}
function linkToStep(task,id,label=t(lookup[id].short)) {
  const step = id===task.links[0] ? task.step : task.phase==='cook'?'cook-0':'prep-0';
  return '<a href="#recipe/'+id+(step?'/'+step:'')+'">'+label+'</a>';
}
const planLink = () => '<a class="button" href="#print">'+t('Print Cooking Plan')+'</a>';
function equipmentText(task) {
  const gear=t(task.gear);
  return task.appliance==='stove' ? gear+' · '+t(task.units===1?'1 burner':'{count} burners',{count:task.units}) : gear;
}
function taskTime(task) {
  const time=task.phase==='early' ? task.date+' · '+clock(task.start) : clock(task.start);
  return task.duration ? time+' – '+clock(task.end) : time;
}
function taskCard(task,{edit=false,print=false,now=new Date()}={}) {
  const label='<h3>'+t(task.title)+'</h3>';
  const status=taskStatus(task,now);
  const mark=print ? '<span class="print-check" aria-hidden="true"></span>' :
    '<input class="task-check" type="checkbox" data-kind="completed" data-id="'+task.id+'" aria-label="'+t('Mark {task} complete',{task:t(task.title)})+'"'+(state.completed[task.id]?' checked':'')+'>';
  const recipesText=task.links.map(id=>t(lookup[id].name)).join(' · ');
  const editor=edit&&task.duration ? '<details class="task-edit"><summary>'+t('Adjust time')+'</summary>'+
    '<form class="task-form" data-task="'+task.id+'"><label>'+t('Start')+' <input type="time" name="start" value="'+clockInput(task.start)+'" required></label>'+
    '<label>'+t('Minutes')+' <input type="number" name="duration" value="'+task.duration+'" min="1" max="1440" required></label>'+
    (task.id==='mac-prep'?'<label>'+t('Burners for this task')+' <select name="units"><option value="2"'+(task.units===2?' selected':'')+'>2</option><option value="1"'+(task.units===1?' selected':'')+'>1</option></select></label>':'')+
    '<button class="button" type="submit">'+t('Save timing')+'</button>'+
    (Object.hasOwn(state.taskEdits,task.id)?'<button class="button" type="button" data-action="reset-task" data-task="'+task.id+'">'+t('Reset timing')+'</button>':'')+
    '<p class="edit-error" role="alert"></p></form></details>':'';
  return '<article class="task plan-task" data-task-card="'+task.id+'">'+
    '<div class="task-slot"><time>'+taskTime(task)+'</time>'+
    (task.duration?'<small>'+task.duration+' min</small>':'')+'</div><div>'+
    '<div class="task-heading">'+mark+label+'</div><span class="chip">'+equipmentText(task)+'</span>'+
    (print?'':' <span class="chip task-status" data-status="'+task.id+'" data-value="'+status+'">'+t(status)+'</span>')+
    '<p>'+t(task.detail)+'</p>'+
    (print ? (recipesText?'<p class="print-recipes">'+recipesText+'</p>':'') :
      '<div class="task-links">'+task.links.map(id=>linkToStep(task,id)).join('')+'</div>')+
    editor+'</div></article>';
}
function kitchenContent(plan,now) {
  const open=plan.filter(task=>!state.completed[task.id]);
  const active=open.filter(task=>taskStatus(task,now)==='In progress');
  const next=open.filter(task=>taskDate(task)>now).slice(0,2);
  const overdue=open.filter(task=>taskStatus(task,now)==='Overdue');
  return '<section class="panel kitchen-now"><h2>'+t('At a glance')+'</h2>'+
    (active.length?'<h3>'+t('In progress')+'</h3>'+active.map(task=>taskCard(task,{now})).join(''):'')+
    '<h3>'+t('Up next')+'</h3>'+
    (next.length?next.map(task=>taskCard(task,{now})).join(''):'<p>'+t('No upcoming tasks.')+'</p>')+
    (overdue.length?'<details><summary>'+t('Overdue ({count})',{count:overdue.length})+'</summary>'+
      overdue.map(task=>taskCard(task,{now})).join('')+'</details>':'')+'</section>';
}
function nextContent(plan,now) {
  const next=plan.find(task=>!state.completed[task.id]&&taskDate(task)>now);
  const active=plan.find(task=>taskStatus(task,now)==='In progress');
  return [[active,'In progress'],[next,'Up next']].filter(([task])=>task).map(([task,status])=>
    '<p class="next-task"><strong>'+t(status)+'</strong> · '+taskTime(task)+' · '+t(task.title)+
    ' <a href="#timeline/kitchen">'+t('Cooking mode')+'</a></p>').join('');
}
function refreshPlanner() {
  const now=new Date();
  const kitchen=document.querySelector('#kitchen-live');
  const next=document.querySelector('#planner-next');
  if(!kitchen&&!next)return;
  const plan=plannedTasks();
  if(kitchen){
    // Leave the currently focused control and any open details usable.
    const saved = kitchen.querySelector('details')?.open;
    const focus=document.activeElement;
    const checkbox=focus?.dataset?.kind==='completed'?focus.dataset.id:null;
    if(!kitchen.contains(focus)||checkbox){
      const html=kitchenContent(plan,now);
      if(kitchen.dataset.rendered!==html){
        kitchen.innerHTML=html;
        kitchen.dataset.rendered=html;
        if(saved && kitchen.querySelector('details'))kitchen.querySelector('details').open=true;
        if(checkbox) (kitchen.querySelector('[data-id="'+checkbox+'"]')||kitchen).focus({preventScroll:true});
      }
    }
  }
  if(next)next.innerHTML=nextContent(plan,now);
  document.querySelectorAll('[data-status]').forEach(badge=>{
    const task=plan.find(row=>row.id===badge.dataset.status);
    if(!task)return;
    const status=taskStatus(task,now);
    badge.dataset.value=status;
    badge.textContent=t(status);
  });
  const count=document.querySelector('#plan-count');
  if(count)count.textContent=planProgress(plan);
}
function planProgress(plan) {
  return t('{count} of {total} tasks completed',{count:plan.filter(task=>state.completed[task.id]).length,total:plan.length});
}
function conflictPanel(plan) {
  const issues=plan.map(task=>[task,taskProblems(task,plan)]).filter(([,issue])=>hasProblem(issue));
  if(!issues.length)return '<p class="panel no-conflicts">'+t('No scheduling conflicts in the current plan.')+'</p>';
  return '<section class="panel conflicts"><h2>'+t('Scheduling conflicts')+'</h2><p>'+
    t('Review these suggestions and edit the tasks yourself. Times stay as entered.')+'</p><ul>'+
    issues.map(([task,issue])=>{
      const names=list=>list.map(item=>t(item.title)).join(', ');
      const notes=[
        issue.tooMany?t('Needs {required} burners, but available capacity is {available}.',{required:task.units,available:state.burners}):'',
        issue.overlaps.length?t('Competes for equipment with {tasks}.',{tasks:names(issue.overlaps)}):'',
        issue.before.length?t('Starts before {tasks} finishes.',{tasks:names(issue.before)}):'',
        issue.after.length?t('Runs into a dependent task ({tasks}).',{tasks:names(issue.after)}):'',
        issue.late?t('Ends after the 6:00 PM dinner target.'):''
      ].filter(Boolean);
      const next=issue.tooMany?null:suggestedStart(task,plan);
      const advice=issue.tooMany?t('Plan to cook the pasta and sauce sequentially, or make another burner available.') :
        next===null?t('Try moving a related task or revising the duration.') :
        t('Try starting at {time}.',{time:clock(next)});
      return '<li><strong>'+t(task.title)+'</strong> · '+notes.join(' ')+' '+advice+'</li>';
    }).join('')+'</ul></section>';
}
function applianceChart(plan) {
  const tasks=plan.filter(task=>task.phase==='cook'&&task.appliance);
  const first=Math.floor(Math.min(960,...tasks.map(task=>task.start))/60)*60;
  const last=Math.ceil(Math.max(dinnerMinute,...tasks.map(task=>task.end))/60)*60;
  const range=last-first;
  const percent=min=>(min-first)/range*100;
  const hours=[];
  const tick=range>8*60?120:60;
  for(let min=first;min<=last;min+=tick)hours.push('<span style="left:'+percent(min)+'%">'+clock(min)+'</span>');
  return '<section class="panel appliance-chart"><h2>'+t('Appliance occupancy · Thursday')+'</h2><p>'+
    t('The shaded area starts 90 minutes before dinner. Each bar shows one booking.')+
    '</p><div class="chart-scroll" tabindex="0" aria-label="'+t('Appliance occupancy · Thursday')+'"><div class="chart-body">'+
    '<div class="chart-axis">'+hours.join('')+'</div>'+
    Object.entries(applianceLabels).map(([id,name])=>'<h3>'+t(name)+'</h3>'+
      tasks.filter(task=>task.appliance===id).map(task=>{
        const warning=hasProblem(taskProblems(task,plan));
        return '<div class="chart-row"><div>'+linkToStep(task,task.links[0],t(task.title))+'<small>'+taskTime(task)+
          (id==='stove'?' · '+t(task.units===1?'1 burner':'{count} burners',{count:task.units}):'')+
          '</small></div><div class="chart-track" style="--late:'+percent(990)+'%;--dinner:'+percent(dinnerMinute)+'%">'+
          '<span aria-hidden="true" class="chart-bar'+(warning?' chart-conflict':'')+'" style="left:'+percent(task.start)+
          '%;width:'+(task.duration/range*100)+'%"></span></div></div>';
      }).join('')).join('')+'</div></div></section>';
}
function equipmentDays(plan,id,format) {
  return ['prep','cook'].map(phase=>{
    const tasks=plan.filter(task=>task.phase===phase&&task.appliance===id);
    return tasks.length?'<h3 class="equipment-day">'+t(phaseLabels[phase])+'</h3>'+format(tasks):'';
  }).join('');
}
function timeline(mode) {
  const plan=plannedTasks();
  const now=new Date();
  const tabs=[['all','Master plan'],['early','Advance preparation'],['prep','Prep day · Wed 25'],
    ['cook','Cooking day · Thu 26'],['appliances','By appliance'],['kitchen','Cooking mode']];
  const nav='<nav class="actions planner-tabs" aria-label="Timeline views">'+tabs.map(([id,label])=>
    '<a class="button'+(id===mode?' primary':'')+'" href="#timeline/'+id+'"'+(id===mode?' aria-current="page"':'')+'>'+t(label)+'</a>').join('')+
    planLink()+'</nav>';
  const header=section('The dinner timeline','THURSDAY, NOVEMBER 26 · 6 PM',
    'Coordinate the Weber rotisserie, Ninja SP101 and stovetop. Times follow this device’s local clock.');
  const target='<div class="dinner-target"><strong>'+t('Dinner target · Thu Nov 26 · 6:00 PM')+'</strong><span id="plan-count">'+planProgress(plan)+'</span></div>';
  if(mode==='kitchen')return header+target+nav+'<div id="kitchen-live" tabindex="-1">'+kitchenContent(plan,now)+'</div>';
  const phases=phaseOrder.filter(id=>mode==='all'||mode===id);
  const phaseLists=phases.map(id=>'<section class="plan-section"><h2>'+t(phaseLabels[id])+'</h2>'+
    plan.filter(task=>task.phase===id).map(task=>taskCard(task,{edit:true,now})).join('')+'</section>').join('');
  const equipmentLists=Object.entries(applianceLabels).map(([id,label])=>'<section class="plan-section"><h2>'+t(label)+'</h2>'+
    equipmentDays(plan,id,tasks=>tasks.map(task=>taskCard(task,{edit:true,now})).join(''))+'</section>').join('');
  const cooking=['all','cook','appliances'].includes(mode);
  const controls='<div class="panel planner-controls">'+weightForm()+
    '<form class="burner-form"><label>'+t('Available stovetop burners')+' <input type="number" name="burners" min="1" max="6" value="'+state.burners+'" required></label>'+
    '<button class="button" type="submit">'+t('Update capacity')+'</button></form></div>';
  return header+target+nav+'<div id="planner-next">'+nextContent(plan,now)+'</div>'+
    (cooking?controls+
    '<div class="callout"><p>'+t('Use separate hot holding for the first pan of mac and cheese and any turkey that finishes early. Gravy starts after the turkey actually comes off. Check doneness separately.')+'</p></div>'+
    conflictPanel(plan)+applianceChart(plan):'')+(mode==='appliances'?equipmentLists:phaseLists);
}
function restoreEditor(id) {
  const form=main.querySelector('.task-form[data-task="'+id+'"]');
  if(form){form.closest('details').open=true;form.elements.start.focus({preventScroll:true});}
}
function resetTask(button) {
  const id=button.dataset.task;
  delete state.taskEdits[id];
  save();
  render();
  restoreEditor(id);
  announce('Default timing restored.');
}
function handlePlannerSubmit(event) {
  const form=event.target;
  if(form.matches('.burner-form')){
    event.preventDefault();
    const capacity=Number(form.elements.burners.value);
    if(!Number.isInteger(capacity)||capacity<1||capacity>6)return;
    state.burners=capacity;
    save();
    render();
    main.querySelector('.burner-form input').focus({preventScroll:true});
    announce('Stovetop capacity updated.');
  }
  if(form.matches('.task-form')){
    event.preventDefault();
    const [hour,minute]=form.elements.start.value.split(':').map(Number);
    const start=hour*60+minute;
    const duration=Number(form.elements.duration.value);
    const id=form.dataset.task;
    if(!Number.isInteger(start)||start<0||!Number.isInteger(duration)||duration<1||start+duration>1440){
      form.querySelector('.edit-error').textContent=t('Enter a start time and duration that end by midnight.');
      return;
    }
    const task=plannedTasks().find(row=>row.id===id&&row.duration);
    if(!task)return;
    const units=form.elements.units ? Number(form.elements.units.value) : task.units;
    if(form.elements.units && ![1,2].includes(units))return;
    state.taskEdits[id]={start,duration,units};
    save();
    render();
    restoreEditor(id);
    announce('Task timing saved.');
  }
  if(form.matches('.print-form')){
    event.preventDefault();
    const selected=[...form.querySelectorAll('[name="section"]:checked')].map(input=>input.value);
    const area=document.querySelector('#print-output');
    if(!selected.length){
      form.querySelector('[role="alert"]').textContent=t('Select at least one section to print.');
      return;
    }
    form.querySelector('[role="alert"]').textContent='';
    area.innerHTML=localizeMarkup(printContent(selected));
    window.print();
  }
}
function printChoices() {
  return [
    ['all','Complete Thanksgiving schedule'],['early','Advance preparation'],
    ['prep','Wednesday preparation checklist'],['cook','Thursday cooking timeline'],
    ['shopping','Consolidated grocery list'],
    ...Object.entries(applianceLabels).map(([id,label])=>[id,label]),
    ...recipes.map(r=>[r.id,r.name])
  ];
}
function printPage() {
  const options=Object.fromEntries(printChoices());
  const group=(label,ids)=>'<fieldset class="panel"><legend>'+t(label)+'</legend>'+
    ids.map(id=>'<label class="check"><input type="checkbox" name="section" value="'+id+'"'+(id==='all'?' checked':'')+'><span>'+t(options[id])+'</span></label>').join('')+
    '</fieldset>';
  return section('Print Cooking Plan','THANKSGIVING AT HOME / 2026','Choose the sections you want, then print or save as PDF. Letter and A4 are supported.')+
    '<form class="print-form"><div class="grid">'+group('Cooking schedule',['all','early','prep','cook'])+
    group('Appliance schedules',Object.keys(applianceLabels))+group('Individual recipes',recipes.map(r=>r.id))+
    group('Shopping',['shopping'])+'</div><div class="actions"><button type="submit" class="button primary">'+t('Print selected sections')+'</button></div>'+
    '<p role="alert"></p></form>';
}
function printContent(selected) {
  const plan=plannedTasks();
  const heading=section('Print Cooking Plan','THANKSGIVING AT HOME / 2026','Dinner target · Thu Nov 26 · 6:00 PM');
  const group=(title,tasks)=>'<section class="print-group"><h2>'+t(title)+'</h2>'+
    tasks.map(task=>taskCard(task,{print:true})).join('')+'</section>';
  const phaseContent=phaseOrder.filter(id=>selected.includes('all')||selected.includes(id))
    .map(id=>group(phaseLabels[id],plan.filter(task=>task.phase===id))).join('');
  const equipment=Object.entries(applianceLabels).filter(([id])=>selected.includes(id))
    .map(([id,name])=>'<section class="print-group"><h2>'+t(name)+'</h2>'+equipmentDays(plan,id,tasks=>tasks.map(task=>taskCard(task,{print:true})).join(''))+'</section>').join('');
  const shoppingContent=selected.includes('shopping')?'<section class="print-group"><h2>'+t('Consolidated grocery list')+'</h2>'+
    groceries().map(([name,items])=>'<section class="print-ingredients"><h3>'+t(name)+'</h3>'+
    items.map(item=>'<div class="print-line"><span class="print-check"></span><span>'+t(item.name)+'</span><strong>'+item.amount+'</strong></div>').join('')+
    '</section>').join('')+'</section>':'';
  const recipeContent=recipes.filter(r=>selected.includes(r.id)).map(r=>'<section class="print-recipe"><h2>'+t(r.name)+'</h2><p>'+
    t(r.gear)+' · '+t(r.time)+'</p>'+
    [...new Set(r.ingredients.map(item=>item[0]))].map(group=>'<section class="print-ingredients"><h3>'+t(group)+'</h3>'+
      r.ingredients.filter(item=>item[0]===group).map(item=>'<div class="print-line"><span>'+t(item[1])+
        (item[4]?'<small>'+t(item[4])+'</small>':'')+(item[5]?' ('+t('Optional')+')':'')+'</span>'+
        '<strong>'+measure(portion(r,item),item[3])+'</strong></div>').join('')+'</section>').join('')+
    ['prep','cook'].map(id=>'<section class="print-steps"><h3>'+t(id==='prep'?'Prep ahead':'Cook & serve')+'</h3>'+
      r[id].map(step=>'<div class="print-line"><span class="print-check"></span><span>'+recipeStep(r,step)+'</span></div>').join('')+
      '</section>').join('')+'</section>').join('');
  return heading+phaseContent+equipment+shoppingContent+recipeContent;
}
