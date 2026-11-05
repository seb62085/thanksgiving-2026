const main = document.querySelector('main');
const key = 'thanksgiving-at-home-2026-v1';
const defaults = {language:"en", weight:14, shopping:{}, steps:{}, safety:{}, completed:{}, taskEdits:{}, burners:3};
let state = {...defaults};
let storageAvailable = true;
try {
  const saved = JSON.parse(localStorage.getItem(key));
  if (saved && typeof saved === 'object') state = {...defaults, ...saved};
} catch { storageAvailable = false; }
if (!Number.isFinite(state.weight) || state.weight < 8 || state.weight > 20) state.weight = defaults.weight;
for (const name of ['shopping','steps','safety','completed','taskEdits']) {
  if (!state[name] || typeof state[name] !== 'object') state[name] = {};
}
const isSpanish = () => state.language === 'es';
const locale = () => isSpanish() ? 'es-PA' : 'en-US';
function t(message, values = {}) {
  const copy = isSpanish() && Object.hasOwn(spanish,message) ? spanish[message] : message;
  return copy.replace(/\{(\w+)\}/g,(token,key)=>Object.hasOwn(values,key) ? values[key] : token);
}
function localizeMarkup(html) {
  if (!isSpanish()) return html;
  return html.replace(/>([^<>]+)</g,(_,text)=>'>'+text.replace(/^(\s*)(.*?)(\s*)$/s,(_,left,content,right)=>left+t(content)+right)+'<')
    .replace(/aria-label="([^"]+)"/g,(_,label)=>'aria-label="'+t(label)+'"');
}
const translateTime = time => isSpanish()
  ? t(time).replace(/ AM$/,' a. m.').replace(/ PM$/,' p. m.')
  : time;
if (!Number.isInteger(state.burners) || state.burners < 1 || state.burners > 6) state.burners = 3;
function save() {
  try { localStorage.setItem(key,JSON.stringify(state)); storageAvailable = true; }
  catch { storageAvailable = false; announce('Browser storage is unavailable. Progress is available until this page closes.'); }
}
function announce(message) { document.querySelector('#notice').textContent = t(message); }
const sideFactor = 1.5;
const sources = {
  brine:'https://extension.illinois.edu/turkey/brine-method',
  salt:'https://ask.fsis.usda.gov/article/How-do-you-brine-poultry',
  thaw:'https://ask.fsis.usda.gov/article/How-long-can-a-thawed-turkey-remain-in-the-refrigerator-after-thawing',
  temp:'https://www.foodsafety.gov/blog/thanksgiving-day-will-be-here-soon-and-its-time-to-get-ready',
  hold:'https://ask.fsis.usda.gov/article/How-do-I-keep-foods-safe-at-a-buffet',
  weber:'https://www.weber.com/US/en/accessories/grill-tools-and-cookware/rotisserie-2290/2290.html',
  grill:'https://www.weber.com/US/en/recipes/poultry/rotisserie-turkey/weber-2377506.html',
  ninja:'https://support.ninjakitchen.co.uk/hc/en-gb/article_attachments/5160797252252/SP101UK_QSG_MP_Mv1_200903_LR__3_.pdf',
  base:'https://www.betterthanbouillon.com/products/roasted-turkey-base/'
};
const lookup = Object.fromEntries(recipes.map(recipe => [recipe.id,recipe]));
const commonFractions = { '1/2':'½', '1/3':'⅓', '2/3':'⅔', '1/4':'¼', '3/4':'¾',
  '1/5':'⅕', '2/5':'⅖', '3/5':'⅗', '4/5':'⅘', '1/6':'⅙', '5/6':'⅚',
  '1/8':'⅛', '3/8':'⅜', '5/8':'⅝', '7/8':'⅞' };
function number(value) {
  const whole=Math.floor(value+1e-9);
  const remainder=value-whole;
  if(remainder<1e-9)return String(whole);
  for(let denominator=2;denominator<=192;denominator++){
    const numerator=Math.round(remainder*denominator);
    if(Math.abs(remainder-numerator/denominator)<1e-9){
      const fraction=numerator+'/'+denominator;
      return [whole||'',commonFractions[fraction]||fraction].filter(Boolean).join(' ');
    }
  }
  return number(Math.round(value*48)/48);
}
function portion(recipe, item) {
  const [,name,base,unit] = item;
  if (base === null) return null;
  let amount = recipe.id === 'turkey' ? base * state.weight / 12 : base * sideFactor;
  if (recipe.id === 'turkey' && name === 'Water' && unit === 'gal') amount = Math.ceil(amount*4)/4;
  if (recipe.id === 'turkey' && name === 'Kosher salt') amount = Math.ceil(state.weight/12*1.5*4)/4*.75;
  if (['cloves','sprigs','leaves',''].includes(unit) && name !== 'Red onion') amount = Math.ceil(amount);
  return amount;
}
const measure = (amount,unit) => {
  if (amount === null) return '';
  const displayUnit = /^cups?$/.test(unit) ? (amount > 1 ? 'cups' : 'cup') : unit;
  return [number(amount),t(displayUnit)].filter(Boolean).join(' ');
};
function section(title,tag,description) {
  return '<header class="title"><div class="eyebrow">'+tag+'</div><h1>'+title+'</h1><p class="lede">'+description+'</p></header>';
}
const action = (label,id) => '<button class="button" type="button" data-action="'+id+'">'+label+'</button>';
const source = (id,label) => '<a href="'+sources[id]+'" target="_blank" rel="noopener">'+label+'</a>';
const weightForm = () => '<form class="weight"><label for="weight">Turkey weight (lb)</label><input id="weight" name="weight" type="number" value="'+state.weight+'" min="8" max="20" step="0.5" required><button class="button" type="submit">Update plan</button><small>8–20 lb · check rotisserie clearance</small></form>';
function check(kind,id,label,note='') {
  return '<label class="check"><input type="checkbox" data-kind="'+kind+'" data-id="'+id+'"'+(state[kind][id]?' checked':'')+'><span><span class="check-title">'+label+'</span>'+(note?'<small>'+note+'</small>':'')+'</span></label>';
}

function menu() {
  const list = groceries().flatMap(([,items])=>items);
  const bought = list.filter(item => state.shopping[item.name]).length;
  const progress = Math.round(bought/list.length*100);
  const art = document.querySelector('#art').innerHTML;
  return '<section class="hero"><div class="hero-copy"><div class="kicker">THURSDAY, NOVEMBER 26 · DINNER AT 6 PM</div><h1>Thanksgiving<br>at Home.</h1><p>A rotisserie turkey, seven favorites and a kitchen plan for getting everything to the table.</p><div class="actions"><a class="button primary" href="#timeline/cook">Open cooking plan →</a><a class="button secondary" href="#shopping">Shop the menu</a><a class="button secondary" href="#print">Print Cooking Plan</a></div></div><div class="hero-art">'+art+'</div></section>'+
  '<div class="summary"><div><small>THE TABLE</small><strong>10 adults + kids</strong><small>Planned for 5–6 children</small></div><div><small>THE MENU</small><strong>8 recipes</strong><small>One holiday dinner</small></div><div><small>THE MAIN</small><strong>'+t('{weight} lb turkey',{weight:number(state.weight)})+'</strong><a href="#recipe/turkey">Adjust weight</a></div><div><small>SHOPPING</small><strong>'+t('{count} of {total}',{count:bought,total:list.length})+'</strong><progress value="'+progress+'" max="100" aria-label="Shopping progress"></progress></div></div>'+
  '<div class="section-head"><div><div class="eyebrow">THE RECIPE BOOK</div><h2>On the table</h2></div></div><div class="grid">'+recipes.map((r,i)=>'<a class="card" href="#recipe/'+r.id+'"><div class="card-art '+r.color+'"><span class="eyebrow">'+t('RECIPE 0{index}',{index:i+1})+'</span><span aria-hidden="true">'+r.icon+'</span></div><div class="card-copy"><h3>'+r.name+'</h3><p>'+r.desc+'</p><span class="chip">'+r.gear+'</span> <span class="chip">'+r.time+'</span></div></a>').join('')+'</div>';
}
function recipePage(r,activeStep) {
  const sections = [...new Set(r.ingredients.map(item=>item[0]))];
  const plan = ['turkey','gravy','rice','mac'].includes(r.id);
  const notice = plan ? '<div class="callout"><p><strong>Recipe reconstructed from the menu notes.</strong> The original ingredient list and method weren’t available in the referenced chat.</p></div>' : '';
  const yieldText = r.id === 'turkey' ? t('{weight} lb whole bird',{weight:number(state.weight)}) : r.id === 'gravy' ? 'About 4½ cups' : 'About 12–15 side portions';
  return '<div class="recipe-nav"><a class="back" href="#menu">← Recipe book</a> <a class="back" href="#timeline/kitchen">Cooking mode</a></div>'+section(r.name,t(r.gear).toLocaleUpperCase(locale())+' · '+t(r.time).toLocaleUpperCase(locale()),r.desc)+
  '<div class="actions"><a class="button" href="#timeline/cook">Cooking timeline</a>'+action('Print recipe','print')+'</div>'+notice+
  (r.id === 'turkey' ? '<div class="panel">'+weightForm()+'<p class="muted">Brine volume is a starting estimate. Keep ¾ cup kosher salt per gallon of actual water. Scaled injection quantities are preparation amounts. Stop injecting if it pools or runs out.</p><a href="#safety">Open turkey safety checklist</a></div>' : '')+
  '<div class="split"><section class="panel"><div class="eyebrow">'+yieldText+'</div><h2>Ingredients</h2>'+
  sections.map(name=>'<h3 class="subhead">'+name+'</h3>'+r.ingredients.filter(item=>item[0]===name).map(item=>{
    const [,ingredient,,unit,note,optional]=item;
    return '<div class="ingredient"><span>'+ingredient+(optional?' <span class="chip">Optional</span>':'')+(note?'<small>'+note+'</small>':'')+'</span><strong>'+measure(portion(r,item),unit)+'</strong></div>';
  }).join('')).join('')+'</section><div>'+
  [['prep','Prep ahead'],['cook','Cook & serve']].map(([id,label])=>'<section class="panel"><h2>'+label+'</h2>'+r[id].map((step,i)=>'<div id="step-'+id+'-'+i+'" tabindex="-1"'+(activeStep===id+'-'+i?' class="active-step"':'')+'>'+check('steps',r.id+'-'+id+'-'+i,(i+1)+'. '+recipeStep(r,step))+'</div>').join('')+'</section>').join('')+
  (r.id === 'gravy' ? '<div class="callout">For this batch, use up to 6 tbsp total fat, 6 tbsp flour and 4½ cups liquid. Follow the ratios in the ingredient list.</div>' : '')+'</div></div>';
}
const supplies = {
  'Charcoal briquettes':'Enough for the initial fire and replenishment',
  'Ice or frozen cooler packs':'For the brine cooler and vegetable ice baths',
  'Food-grade brining bag':'Large enough for the selected turkey',
  'Heavy-duty foil drip pan':'Fits beneath the bird'
};
function groceries() {
  return Object.entries(groups).map(([group,names])=>[group,names.map(name=>{
    const uses = recipes.flatMap(r=>r.ingredients.filter(item=>item[1]===name).map(item=>({r,item})));
    const amounts = new Map();
    const options = new Map();
    for (const {r,item} of uses) {
      const unit = item[3].replace(/^cups?$/,'cup');
      const target = item[5] ? options : amounts;
      const amount = portion(r,item);
      if (amount !== null) target.set(unit,(target.get(unit)||0)+amount);
    }
    const pretty = map => {
      const volume = (map.get('cup')||0)*48+(map.get('tbsp')||0)*3+(map.get('tsp')||0);
      if (map.has('cup') || (map.has('tbsp') && map.has('tsp'))) {
        const cup = Math.floor(volume/48);
        const rest = volume-cup*48;
        const tbsp = Math.floor(rest/3);
        const tsp = rest-tbsp*3;
        return [[cup,'cup'],[tbsp,'tbsp'],[tsp,'tsp']].filter(([value])=>value>0.00001).map(([value,unit])=>measure(value,unit)).join(' + ');
      }
      return [...map].map(([unit,value])=>measure(value,unit)).join(' + ');
    };
    let amount = pretty(amounts) || t(supplies[name] || 'To taste');
    if (name === 'Lemons') amount = t('3 medium, for about 3¼–3½ tbsp juice');
    if (name === 'Kosher salt') amount += ' + '+t('extra for seasoning and cooking water');
    if (name === 'Black pepper') amount += ' + '+t('extra to taste');
    if (options.size) amount += ' + '+pretty(options)+' '+t('optional');
    const dishes = [...new Set(uses.map(({r})=>t(r.short)))].join(', ');
    return {name,amount,dishes};
  })]);
}
function shopping() {
  const list=groceries();
  const count=list.flatMap(([,items])=>items).length;
  return section('Shopping list','THE MARKET LIST','Combined across all eight recipes. Your checks stay in this browser.')+
  '<div class="panel">'+weightForm()+'<p id="shop-progress" class="muted" data-total="'+count+'"></p></div>'+
  '<div class="actions">'+action('Print / Save as PDF','print')+action('Download Notes text','download')+action('Copy for Apple Notes','copy')+'</div><p id="export-status" class="muted">Notes export is a plain-text list with checkbox symbols and your current checkmarks.</p>'+
  '<div class="grid">'+list.map(([name,items])=>'<section class="panel"><h2>'+name+'</h2>'+items.map(item=>check('shopping',item.name,'<strong>'+t(item.name)+'</strong>',item.amount+(item.dishes?' · '+item.dishes:''))).join('')+'</section>').join('')+'</div>';
}
function progress() {
  const target=document.querySelector('#shop-progress');
  if (target) target.textContent = t('{count} of {total} checked',{count:main.querySelectorAll('[data-kind="shopping"]:checked').length,total:target.dataset.total})+(storageAvailable?'':' · '+t('progress is temporary'));
}
function notesText() {
  return t('Thanksgiving 2026 · Shopping list')+'\n'+t('Thursday, November 26 · 6 PM')+' · '+t('{weight} lb turkey',{weight:number(state.weight)})+'\n\n'+groceries().map(([group,items])=>t(group).toLocaleUpperCase(locale())+'\n'+items.map(({name,amount})=>(state.shopping[name]?'☑':'☐')+' '+t(name)+' — '+amount).join('\n')).join('\n\n')+'\n';
}

const prepTasks = [
 [null,'Make and chill the brine','Use ice packs around the sealed bag. Verify the brine is 40°F or below before adding the turkey.','Cooler / fridge',['turkey'],{"id":"make-brine","phase":"prep","start":540,"duration":30,"appliance":"","units":0,"step":"prep-1","after":[]}],
 [null,'Blanch vegetables and prep the sofrito','Use separate ice baths or refresh the ice water. Drain, dry and refrigerate. Dice the onion and mince garlic for the rice.','Stovetop',['beans','carrots','rice'],{"id":"vegetables","phase":"prep","start":840,"duration":45,"appliance":"stove","units":1,"step":"prep-0","after":[]}],
 [null,'Mix the garlic butter and vinaigrette','Refrigerate both. Wash the salad produce and keep it whole. Leave baguettes unsliced.','Cold prep',['bread','salad'],{"id":"mix","phase":"prep","start":900,"duration":30,"appliance":"","units":0,"step":"prep-0","after":[]}],
 [null,'Shred cheese and check pan fit','Plan for two sequential shallow mac pans and up to four bread batches. Set out a whisk, fat separator, injector, trussing twine, drip pan and thermometers.','Ninja SP101 · cold fit',['mac','bread','gravy','turkey'],{"id":"cheese","phase":"prep","start":960,"duration":20,"appliance":"","units":0,"step":"prep-0","after":[]}],
 [null,'Start the wet brine','Keep turkey submerged in cold brine at 40°F or below. Check before bed and again in the morning.','Cooler / fridge',['turkey'],{"id":"start-brine","phase":"prep","start":1200,"duration":15,"appliance":"","units":0,"step":"prep-2","after":[]}]
];
function timeOf(minutes) {
  const hour=Math.floor(minutes/60);
  return (hour%12||12)+':'+String(minutes%60).padStart(2,'0')+(hour>=12?' PM':' AM');
}
function schedule() {
  const cookMinutes = Math.max(150,Math.ceil(state.weight)*15);
  const on = 17*60+5-cookMinutes;
  const thaw = new Date(Date.UTC(2026,10,25-Math.ceil(state.weight/4)));
  const date = new Intl.DateTimeFormat(locale(),{weekday:'short',month:'short',day:'numeric',timeZone:'UTC'}).format(thaw);
  return {
    early:[[date,'Move the frozen turkey to the fridge','Allow about 24 hours per 4–5 lb. Keep it on a tray on the lowest shelf. Once thawed, cook within 1–2 days, including the brine time.','Refrigerator',['turkey'],{"id":"thaw","phase":"early","start":480,"duration":0,"appliance":"","units":0,"step":"prep-0","after":[]}]],
    prep:prepTasks,
    cook:[
      [null,'Take the turkey out of the brine','Discard brine, pat dry and refrigerate on a rimmed tray. Clean and sanitize the cooler and prep area.','Refrigerator',['turkey'],{"id":"unbrine","phase":"cook","start":540,"duration":15,"appliance":"","units":0,"step":"cook-0","after":[]}],
      [null,'Set up the Weber and prep the turkey','Light the charcoal outdoors. Set up indirect heat and position the drip pan. Inject, truss and check balance and clearance before turning on the motor.','22-inch Weber',['turkey'],{"id":"setup","phase":"cook","start":on-45,"duration":45,"appliance":"weber","units":1,"step":"cook-1","after":[]}],
      [null,'Turkey on the spit','Keep the kettle near 350–400°F. Check kettle heat periodically and replenish fuel as needed.','22-inch Weber',['turkey'],{"id":"turkey","phase":"cook","start":on,"duration":cookMinutes,"appliance":"weber","units":1,"step":"cook-3","after":["setup"]}],
      [null,'Make the mac and cheese','Use up to two burners for pasta and sauce, then divide between two shallow pans. Refrigerate the second pan while the first bakes.','Stovetop',['mac'],{"id":"mac-prep","phase":"cook","start":930,"duration":30,"appliance":"stove","units":2,"step":"cook-0","after":[]}],
      [null,'Start baking mac and cheese','Ninja BAKE at 350°F. Budget 25–30 minutes per shallow pan, longer if cold. Verify the center of any chilled pan reaches 165°F. Keep the finished pans at 140°F or above in a separate holding setup.','Ninja SP101',['mac'],{"id":"mac-bake","phase":"cook","start":960,"duration":60,"appliance":"ninja","units":1,"step":"cook-2","after":["mac-prep"]}],
      [null,'Chop and chill the salad','Cover and refrigerate. Keep the dressing separate.','Cold prep',['salad'],{"id":"chop","phase":"cook","start":985,"duration":10,"appliance":"","units":0,"step":"cook-0","after":[]}],
      [null,'Start rice and soften garlic butter','Allow about 35 minutes for the rice, including covered rest. Hold cooked rice at 140°F or above as needed.','Stovetop',['rice','bread'],{"id":"rice","phase":"cook","start":995,"duration":35,"appliance":"stove","units":1,"step":"cook-0","after":[]}],
      [null,'Slice and butter bread','Ninja BAKE at 375°F after the mac clears. Use a single layer, 6–9 minutes per batch. Budget four batches. If the slices need a fifth batch, add up to 10 minutes to the booking. Transfer finished bread to a basket.','Ninja SP101',['bread'],{"id":"bread","phase":"cook","start":1020,"duration":40,"appliance":"ninja","units":1,"step":"cook-0","after":["mac-bake"]}],
      [null,'Verify turkey, then rest','Check breast, thigh and wing for at least 165°F each. Rest 20–30 minutes once done. If it runs late, keep cooking and move gravy and carving back.','22-inch Weber · temperature gate',['turkey','gravy'],{"id":"rest","phase":"cook","start":1025,"duration":30,"appliance":"","units":0,"step":"cook-4","after":["turkey"]}],
      [null,'Glaze the carrots','Cook in the larger skillet and transfer to a covered dish. Keep hot for service.','Stovetop',['carrots'],{"id":"carrots","phase":"cook","start":1030,"duration":15,"appliance":"stove","units":1,"step":"cook-0","after":[]}],
      [null,'Make the gravy','Use the collected pan drippings. Allow about 15 minutes while the turkey rests.','Stovetop',['gravy'],{"id":"gravy","phase":"cook","start":1025,"duration":15,"appliance":"stove","units":1,"step":"cook-0","after":["turkey"]}],
      [null,'Finish the green beans','Use the skillet from the carrots. If sautéing in two batches, allow up to 15 minutes.','Stovetop',['beans'],{"id":"beans","phase":"cook","start":1045,"duration":15,"appliance":"stove","units":1,"step":"cook-0","after":["carrots"]}],
      [null,'Carve and set out the sides','Carve after the turkey has rested. Check hot-held foods and bring the bread to the table.','Serving station',['turkey','mac','bread'],{"id":"carve","phase":"cook","start":1060,"duration":10,"appliance":"","units":0,"step":"cook-4","after":["rest"]}],
      [null,'Dress the salad','Shake the lemon vinaigrette and toss the salad.','Cold prep',['salad'],{"id":"dress","phase":"cook","start":1070,"duration":5,"appliance":"","units":0,"step":"cook-1","after":["chop"]}],
      [null,'Dinner','Serve the turkey and gravy together. Refrigerate leftovers in shallow containers within 2 hours, or within 1 hour above 90°F.','At the table',[],{"id":"dinner","phase":"cook","start":1080,"duration":0,"appliance":"","units":0,"step":"","after":[]}]
    ]
  };
}
const safetyChecks = [
 ['cool','Brine chilled to 40°F or below before adding turkey','Use a sanitized probe. Keep the bird submerged in the brine and surround the bag with frozen packs.'],
 ['overnight','Brine stayed at 40°F or below','Monitor in the closed cooler and replenish ice packs as needed. If above 40°F for over 2 hours, or duration is uncertain, discard the turkey.'],
 ['fit','Bird rotates freely within the Weber load limit','Weber rates the 22-inch accessory for a maximum of 20 lb. Confirm clearance and balance with the loaded spit.'],
 ['breast','Thickest part of breast reached at least 165°F','Use a clean instant-read probe. Avoid touching bone.'],
 ['thigh','Innermost part of thigh reached at least 165°F','Stop rotation and check before removing turkey.'],
 ['wing','Innermost part of wing reached at least 165°F','Clean the probe after taking readings.'],
 ['hold','Hot-held foods are at 140°F or above','Keep salad and other cold perishables at 40°F or below until serving.']
];
function safety() {
  return section('Kitchen checks','COOLER · KETTLE · THERMOMETERS','Keep the turkey cold during prep and verify doneness in three places before it leaves the grill.')+
  '<div class="actions">'+action('Print safety checks','print')+'</div><div class="split"><div>'+
  '<section class="panel"><h2>Cooler wet brine</h2><p>Use an unenhanced turkey and a clean, leakproof food-grade bag in a dedicated cooler. Chill the brine first. Keep the bird submerged in the bag and place frozen packs around it to avoid diluting the salt ratio. Keep the cooler closed and monitor the temperature.</p><p>Use fresh paper towels to pat the turkey dry. Discard the brine, clean and sanitize equipment and surfaces, and wash your hands before touching cooked food.</p><p>'+source('brine','Illinois Extension cooler brining')+' · '+source('salt','USDA brining')+' · '+source('thaw','USDA thawing')+'</p></section>'+
  '<section class="panel"><h2>Equipment & temperature</h2><p>'+source('weber','Weber 22-inch rotisserie')+' · '+source('grill','Weber indirect rotisserie setup')+' · '+source('ninja','Ninja SP101 quick-start guide (UK)')+'</p><p>'+source('temp','FoodSafety.gov turkey temperatures')+' · '+source('hold','USDA hot and cold holding')+' · '+source('base','Better Than Bouillon turkey base')+'</p></section></div>'+
  '<section class="panel"><h2>Thermometer checklist</h2>'+safetyChecks.map(args=>check('safety',...args)).join('')+'</section></div>';
}

function render({focus=false}={}) {
  document.querySelector('#print-output').innerHTML='';
  const [page,sub,step] = location.hash.slice(1).split('/');
  const route = ['shopping','timeline','safety','recipe','print'].includes(page) ? page : 'menu';
  document.querySelectorAll('.mast nav a').forEach(a=>{
    if(a.hash==='#'+(route==='recipe'?'menu':route)) a.setAttribute('aria-current','page');
    else a.removeAttribute('aria-current');
  });
  const html = {
    menu, shopping, safety, print:printPage,
    timeline:()=>timeline(['early','prep','cook','appliances','kitchen'].includes(sub)?sub:'all'),
    recipe:()=>Object.hasOwn(lookup,sub)?recipePage(lookup[sub],step):'<p class="empty">Recipe unavailable. <a href="#menu">Back to the recipe book</a></p>'
  };
  main.innerHTML = localizeMarkup(html[route]());
  updateLanguage();
  progress();
  document.title = (route === 'menu' ? t('Thanksgiving at Home') : main.querySelector('h1')?.textContent || t('Thanksgiving at Home'))+' · 2026';
  if (focus) {
    main.focus({preventScroll:true});
    window.scrollTo(0,0);
    const target = route === 'recipe' && step ? document.getElementById('step-'+step) : null;
    if (target) { target.focus({preventScroll:true}); target.scrollIntoView({block:'center'}); }
  }
}
window.addEventListener('hashchange',()=>{ if(location.hash!=='#main')render({focus:true}); });
main.addEventListener('change',event=>{
  const {kind,id}=event.target.dataset;
  if(!kind)return;
  if(!Object.hasOwn(state,kind) || !state[kind])return;
  state[kind][id]=event.target.checked;
  save();
  progress();
  if(kind==='completed')refreshPlanner();
});
main.addEventListener('submit',event=>{
  if(!event.target.matches('.weight')){ handlePlannerSubmit(event); return; }
  event.preventDefault();
  const next=Number(new FormData(event.target).get('weight'));
  if(!Number.isFinite(next)||next<8||next>20||next*2%1)return;
  if(next!==state.weight) state.shopping['Whole turkey']=false;
  state.weight=next;
  save();
  render();
  document.querySelector('#weight').focus({preventScroll:true});
  announce(t('Plan updated for a {weight} pound turkey.',{weight:number(next)}));
});
main.addEventListener('click',async event=>{
  const button=event.target.closest('[data-action]');
  if(!button)return;
  const actionId=button.dataset.action;
  if(actionId==='print') window.print();
  if(actionId==='reset-task')resetTask(button);
  if(actionId==='download'){
    const url=URL.createObjectURL(new Blob([notesText()],{type:'text/plain;charset=utf-8'}));
    const link=document.createElement('a');
    link.href=url;
    link.download=isSpanish()?'Accion-de-Gracias-2026-Compras.txt':'Thanksgiving-2026-Shopping.txt';
    link.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  if(actionId==='copy'){
    const status=document.querySelector('#export-status');
    try { await navigator.clipboard.writeText(notesText()); status.textContent=t('Copied. Paste the list into a new note in Apple Notes.'); }
    catch { status.textContent=t('Clipboard access is unavailable. Download the text file and import it into Notes on a Mac, or open it and paste the contents.'); }
    announce(status.textContent);
  }
});
const languageButton = document.querySelector('#language');
const staticCopy = [...document.querySelectorAll('[data-copy]')].map(el=>[el,el.textContent]);
const mastNav = document.querySelector('.mast nav');
function updateLanguage() {
  document.documentElement.lang = isSpanish() ? 'es-PA' : 'en';
  staticCopy.forEach(([el,english])=>{ el.textContent=t(english); });
  mastNav.setAttribute('aria-label',t('Main navigation'));
  languageButton.setAttribute('aria-pressed',String(isSpanish()));
}
languageButton.addEventListener('click',()=>{
  state.language = isSpanish() ? 'en' : 'es';
  save();
  render();
});
render();
setInterval(refreshPlanner,30000);
