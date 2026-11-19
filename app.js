const main = document.querySelector('main');
const key = 'thanksgiving-at-home-2026-v1';
const defaults = {language:"en", adults:10, children:6, portionsChanged:false, weight:14, turkeyEta:null, shopping:{}, steps:{}, safety:{}, completed:{}, taskEdits:{}, burners:3};
let state = {...defaults};
let storageAvailable = true;
try {
  const saved = JSON.parse(localStorage.getItem(key));
  if (saved && typeof saved === 'object') state = {...defaults, ...saved};
} catch { storageAvailable = false; }
if (!Number.isFinite(state.weight) || state.weight < 8 || state.weight > 20) state.weight = defaults.weight;
if(etaMinutes()===null)state.turkeyEta=null;
for (const name of ['shopping','steps','safety','completed','taskEdits']) {
  if (!state[name] || typeof state[name] !== 'object') state[name] = {};
}

// New preparation steps must not inherit checks from the former wet-brine steps.
if(state.turkeyPrepVersion!==2){
  for(const id of ['turkey-prep-1','turkey-prep-2','turkey-cook-0','turkey-cook-1'])delete state.steps[id];
  for(const id of ['make-brine','start-brine','unbrine']){
    delete state.completed[id];
    delete state.taskEdits[id];
  }
  for(const id of ['cool','overnight'])delete state.safety[id];
  for(const id of ['Bay leaves','Black peppercorns','Ice or frozen cooler packs','Food-grade brining bag'])delete state.shopping[id];
  state.turkeyPrepVersion=2;
  try{localStorage.setItem(key,JSON.stringify(state));}catch{storageAvailable=false;}
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
const baseSideServings = 9;
function guestPortions(adults=state.adults,children=state.children) {
  return adults + children / 2;
}
if (!Number.isInteger(state.adults) || state.adults<0 || state.adults>40) state.adults=defaults.adults;
if (!Number.isInteger(state.children) || state.children<0 || state.children>30) state.children=defaults.children;
if (!guestPortions()) { state.adults=defaults.adults; state.children=defaults.children; }
const sideFactor = () => guestPortions() / baseSideServings;
const guestSummary = () => t('{adults} adults · {children} children',{adults:state.adults,children:state.children});
const portionSummary = (adults=state.adults,children=state.children) =>
  t('{portions} adult portions',{portions:number(guestPortions(adults,children))});
function turkeySuggestion(adults=state.adults,children=state.children) {
  return Math.ceil(guestPortions(adults,children) * 1.25 * 2) / 2;
}
function guestPanel(expanded=false) {
  const control=(name,label,max)=>'<div class="guest-control"><label for="guest-'+name+'">'+t(label)+'</label>'+
    '<input aria-label="'+t(label)+'" data-guest-range="'+name+'" type="range" min="0" max="'+max+'" step="1" value="'+state[name]+'">'+
    '<input id="guest-'+name+'" name="'+name+'" type="number" min="0" max="'+max+'" step="1" required value="'+state[name]+'"></div>';
  return '<details class="panel guest-panel"'+(expanded?' open':'')+'><summary>'+guestSummary()+' · '+portionSummary()+'</summary><div><div class="eyebrow">'+t('PLAN YOUR TABLE')+'</div><h2>'+t('Who’s coming?')+'</h2>'+
    '<p>'+t('Each child counts as ½ an adult portion. Adjust the guests, then update the portions.')+'</p></div>'+
    '<form class="guest-form">'+control('adults','Adults',40)+control('children','Children',30)+
    '<p class="guest-preview" aria-live="polite">'+portionSummary()+'</p>'+
    '<button class="button primary" type="submit">'+t('Update portions')+'</button><p class="guest-error" role="alert"></p></form>'+
    '<p class="muted guest-turkey">'+t('Suggested whole-turkey weight: {weight} lb.',{weight:number(turkeySuggestion())})+' '+
      t('Guide: 1¼ lb per adult portion. Your selected turkey stays at {weight} lb.',{weight:number(state.weight)})+'</p>'+
    '<p class="muted">'+t('Side recipes use a 9-portion base. Whole produce, garlic cloves and loaves round up.')+' <a href="https://extension.illinois.edu/turkey/choosing-your-turkey" target="_blank" rel="noopener">'+t('Turkey size guide')+'</a></p>'+
    (turkeySuggestion()>20?'<div class="callout">'+t('The suggested total exceeds the Weber’s 20 lb limit. Plan additional turkey separately.')+'</div>':'')+
    (state.portionsChanged?'<div class="callout"><p>'+t('Portions changed. Review checked shopping items and completed prep for any extra amounts needed.')+'</p>'+
      action(t('Reviewed quantities'),'review-portions')+'</div>':'')+'</details>';
}
function previewGuests(form) {
  const adults=Number(form.elements.adults.value);
  const children=Number(form.elements.children.value);
  if(!Number.isInteger(adults)||adults<0||adults>40||!Number.isInteger(children)||children<0||children>30)return;
  form.querySelector('.guest-preview').textContent=portionSummary(adults,children);
}
function saveGuests(event) {
  event.preventDefault();
  const form=event.target;
  const adults=Number(form.elements.adults.value);
  const children=Number(form.elements.children.value);
  if(!Number.isInteger(adults)||adults<0||adults>40||!Number.isInteger(children)||children<0||children>30||adults+children===0){
    form.querySelector('.guest-error').textContent=t('Choose at least one guest, with whole numbers within the displayed limits.');
    return;
  }
  if(adults!==state.adults||children!==state.children)state.portionsChanged=true;
  state.adults=adults;
  state.children=children;
  save();
  render();
  main.querySelector('[name="adults"]').focus({preventScroll:true});
  announce(t('Portions updated for {adults} adults and {children} children.',{adults,children}));
}
const sources = {
  washing:'https://ask.fsis.usda.gov/article/Should-I-wash-chicken-or-other-poultry-before-cooking',
  thaw:'https://ask.fsis.usda.gov/article/How-long-can-a-thawed-turkey-remain-in-the-refrigerator-after-thawing',
  temp:'https://www.foodsafety.gov/blog/thanksgiving-day-will-be-here-soon-and-its-time-to-get-ready',
  hold:'https://ask.fsis.usda.gov/article/How-do-I-keep-foods-safe-at-a-buffet',
  weber:'https://www.weber.com/US/en/accessories/grill-tools-and-cookware/rotisserie-2290/2290.html',
  grill:'https://www.weber.com/US/en/recipes/poultry/rotisserie-turkey/weber-2377506.html',
  ninja:'https://support.ninjakitchen.co.uk/hc/en-gb/article_attachments/5160797252252/SP101UK_QSG_MP_Mv1_200903_LR__3_.pdf',
  base:'https://www.betterthanbouillon.com/products/roasted-turkey-base/'
};
const lookup = Object.fromEntries(recipes.map(recipe => [recipe.id,recipe]));
const kitchenFractions = [[0,''],[1/8,'⅛'],[1/4,'¼'],[1/3,'⅓'],[3/8,'⅜'],
  [1/2,'½'],[5/8,'⅝'],[2/3,'⅔'],[3/4,'¾'],[7/8,'⅞'],[1,'']];
function kitchenFraction(value) {
  const remainder=value-Math.floor(value);
  return kitchenFractions.reduce((best,fraction)=>
    Math.abs(remainder-fraction[0])<=Math.abs(remainder-best[0])+1e-9?fraction:best);
}
function number(value) {
  const [fraction,symbol]=kitchenFraction(value);
  const whole=Math.floor(value)+(fraction===1?1:0);
  return [whole||'',symbol].filter(Boolean).join(' ')||'0';
}
function roundIngredient(amount,unit,recipeId,name) {
  if(/^cups?$/.test(unit)){
    if(amount<1/8)return Math.max(1/8,Math.round(amount*48*8)/8)/48;
    return Math.floor(amount)+kitchenFraction(amount)[0];
  }
  // Half-ounce cheese totals divide into eighth-ounce topping quantities.
  const step=unit==='oz'?1/2:recipeId==='beans'&&name==='Unsalted butter'?1/4:1/8;
  return Math.max(step,Math.round((amount+1e-9)/step)*step);
}
function portion(recipe, item) {
  const [,name,base,unit] = item;
  if (base === null) return null;
  let amount = recipe.id === 'turkey' ? base * state.weight / 12 : base * sideFactor();
  if (['cloves','sprigs','leaves',''].includes(unit) && name !== 'Red onion') return Math.ceil(amount);
  return roundIngredient(amount,unit,recipe.id,name);
}
const measure = (amount,unit) => {
  if (amount === null) return '';
  if(amount>0&&amount<1/8&&/^cups?$/.test(unit)){amount*=48;unit='tsp';}
  if(amount>0&&amount<1/8&&unit==='tbsp'){amount*=3;unit='tsp';}
  if(amount>0&&amount<1/8)amount=1/8;
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
  '<div class="summary"><div><small>THE TABLE</small><strong>'+guestSummary()+'</strong><small>'+portionSummary()+'</small></div><div><small>THE MENU</small><strong>8 recipes</strong><small>One holiday dinner</small></div><div><small>THE MAIN</small><strong>'+t('{weight} lb turkey',{weight:number(state.weight)})+'</strong><a href="#recipe/turkey">Adjust weight</a></div><div><small>SHOPPING</small><strong>'+t('{count} of {total}',{count:bought,total:list.length})+'</strong><progress value="'+progress+'" max="100" aria-label="Shopping progress"></progress></div></div>'+
  guestPanel(true)+'<div class="section-head"><div><div class="eyebrow">THE RECIPE BOOK</div><h2>On the table</h2></div></div><div class="grid">'+recipes.map((r,i)=>'<a class="card" href="#recipe/'+r.id+'"><div class="card-art '+r.color+'"><span class="eyebrow">'+t('RECIPE 0{index}',{index:i+1})+'</span><span aria-hidden="true">'+r.icon+'</span></div><div class="card-copy"><h3>'+r.name+'</h3><p>'+r.desc+'</p><span class="chip">'+r.gear+'</span> <span class="chip">'+r.time+'</span></div></a>').join('')+'</div>';
}
function recipePage(r,activeStep) {
  const sections = [...new Set(r.ingredients.map(item=>item[0]))];
  const plan = ['turkey','gravy','rice','mac'].includes(r.id);
  const notice = plan ? '<div class="callout"><p><strong>Recipe reconstructed from the menu notes.</strong> The original ingredient list and method weren’t available in the referenced chat.</p></div>' : '';
  const yieldText = r.id === 'turkey' ? t('{weight} lb whole bird',{weight:number(state.weight)}) : r.id === 'gravy' ? t('About {quantity} gravy',{quantity:measure(portion(r,r.ingredients.find(item=>item[1]==='Water')),'cups')}) : portionSummary();
  return '<div class="recipe-nav"><a class="back" href="#menu">← Recipe book</a> <a class="back" href="#timeline/kitchen">Cooking mode</a></div>'+section(r.name,t(r.gear).toLocaleUpperCase(locale())+' · '+t(r.time).toLocaleUpperCase(locale()),r.desc)+
  '<div class="actions"><a class="button" href="#timeline/cook">Cooking timeline</a>'+action('Print recipe','print')+'</div>'+notice+
  (r.id === 'turkey' ? '<div class="panel">'+weightForm()+'<p class="muted">Your turkey already contains a salted solution. Dry the skin overnight in the refrigerator, then add the herb-butter injection on cooking day. Use unsalted butter and taste the injection before raw contact. Stop injecting if it pools or runs out.</p><a href="#safety">Open turkey safety checklist</a></div>' : '')+
  (r.id==='turkey'?turkeyEtaPanel():'')+guestPanel()+'<div class="split"><section class="panel"><div class="eyebrow">'+yieldText+'</div><h2>Ingredients</h2><p class="muted">Scaled amounts use common kitchen measures.</p>'+
  sections.map(name=>'<h3 class="subhead">'+name+'</h3>'+r.ingredients.filter(item=>item[0]===name).map(item=>{
    const [,ingredient,,unit,note,optional]=item;
    return '<div class="ingredient"><span>'+ingredient+(optional?' <span class="chip">Optional</span>':'')+(note?'<small>'+note+'</small>':'')+'</span><strong>'+measure(portion(r,item),unit)+'</strong></div>';
  }).join('')).join('')+'</section><div>'+
  [['prep','Prep ahead'],['cook','Cook & serve']].map(([id,label])=>'<section class="panel"><h2>'+label+'</h2>'+r[id].map((step,i)=>'<div id="step-'+id+'-'+i+'" tabindex="-1"'+(activeStep===id+'-'+i?' class="active-step"':'')+'>'+check('steps',r.id+'-'+id+'-'+i,(i+1)+'. '+recipeStep(r,step))+'</div>').join('')+'</section>').join('')+
  (r.id === 'gravy' ? '<div class="callout">'+t('Follow the scaled fat, flour and liquid amounts in the ingredients and steps.')+'</div>' : '')+'</div></div>';
}
const supplies = {
  'Charcoal briquettes':'Enough for the initial fire and replenishment',
  'Ice':'For chilling blanched vegetables',
  'Paper towels':'For patting the turkey dry',
  'Wire rack and rimmed tray':'For overnight refrigerator drying; check that they fit',
  'Heavy-duty foil drip pan':'Fits beneath the bird'
};
function groceries() {
  return Object.entries(groups).map(([group,names])=>[group,names.map(name=>{
    const uses = recipes.flatMap(r=>r.ingredients.filter(item=>(item[1]==='Lemon juice'?'Lemons':item[1])===name).map(item=>({r,item})));
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
    if (name === 'Lemons') {
      const juice=uses.reduce((total,{r,item})=>total+portion(r,item)*(item[3]==='tbsp'?3:1),0);
      amount=t('{count} lemons · about {quantity} juice',{count:Math.ceil(juice/9),quantity:measure(juice/3,'tbsp')});
    }
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
  guestPanel()+'<div class="panel">'+weightForm()+'<p id="shop-progress" class="muted" data-total="'+count+'"></p></div>'+
  '<div class="actions">'+action('Print / Save as PDF','print')+action('Download Notes text','download')+action('Copy for Apple Notes','copy')+'</div><p id="export-status" class="muted">Notes export is a plain-text list with checkbox symbols and your current checkmarks.</p>'+
  '<div class="grid">'+list.map(([name,items])=>'<section class="panel"><h2>'+name+'</h2>'+items.map(item=>check('shopping',item.name,'<strong>'+t(item.name)+'</strong>',item.amount+(item.dishes?' · '+item.dishes:''))).join('')+'</section>').join('')+'</div>';
}
function progress() {
  const target=document.querySelector('#shop-progress');
  if (target) target.textContent = t('{count} of {total} checked',{count:main.querySelectorAll('[data-kind="shopping"]:checked').length,total:target.dataset.total})+(storageAvailable?'':' · '+t('progress is temporary'));
}
function notesText() {
  return t('Thanksgiving 2026 · Shopping list')+'\n'+t('Thursday, November 26 · 6 PM')+'\n'+guestSummary()+' · '+portionSummary()+'\n'+t('{weight} lb turkey',{weight:number(state.weight)})+'\n\n'+groceries().map(([group,items])=>t(group).toLocaleUpperCase(locale())+'\n'+items.map(({name,amount})=>(state.shopping[name]?'☑':'☐')+' '+t(name)+' — '+amount).join('\n')).join('\n\n')+'\n';
}

const prepTasks = [
 [null,'Unpack, pat dry and refrigerate the turkey uncovered','Once fully thawed, discard the bag liquid and remove the neck and giblets. Pat the skin and cavity dry with paper towels. Set on a wire rack in a rimmed tray, uncovered on the lowest refrigerator shelf at 40°F or below, away from ready-to-eat foods. Let the skin dry overnight.','Refrigerator',['turkey'],{"id":"dry-turkey","phase":"prep","start":990,"duration":15,"appliance":"","units":0,"step":"prep-1","after":[]}],
 [null,'Blanch vegetables and prep the sofrito','Use separate ice baths or refresh the ice water. Drain, dry and refrigerate. Dice the onion and mince garlic for the rice.','Stovetop',['beans','carrots','rice'],{"id":"vegetables","phase":"prep","start":840,"duration":45,"appliance":"stove","units":1,"step":"prep-0","after":[]}],
 [null,'Mix the garlic butter and vinaigrette','Refrigerate both. Wash the salad produce and keep it whole. Leave baguettes unsliced.','Cold prep',['bread','salad'],{"id":"mix","phase":"prep","start":900,"duration":30,"appliance":"","units":0,"step":"prep-0","after":[]}],
 [null,'Shred cheese and check pan fit','Check the batch estimates on Thursday’s timeline after updating your guest count. Set out a whisk, fat separator, injector, trussing twine, drip pan and thermometers.','Ninja SP101 · cold fit',['mac','bread','gravy','turkey'],{"id":"cheese","phase":"prep","start":960,"duration":20,"appliance":"","units":0,"step":"prep-0","after":[]}],
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
    early:[[date,'Move the frozen turkey to the fridge','Allow about 24 hours per 4–5 lb in the refrigerator. Keep the packaged turkey on a rimmed tray on the lowest shelf. Once fully thawed, cook within 1–2 days, including overnight skin drying.','Refrigerator',['turkey'],{"id":"thaw","phase":"early","start":480,"duration":0,"appliance":"","units":0,"step":"prep-0","after":[]}]],
    prep:prepTasks,
    cook:[
      [null,'Keep the turkey chilled until grill prep','Leave the turkey on its rack in the refrigerator at 40°F or below. Prepare the unsalted butter, herbs and injector for later. Pat away any remaining skin moisture just before seasoning.','Refrigerator',['turkey'],{"id":"keep-chilled","phase":"cook","start":540,"duration":5,"appliance":"","units":0,"step":"cook-0","after":[]}],
      [null,'Set up the Weber and prep the turkey','Light the charcoal outdoors. Set up indirect heat and position the drip pan. Inject, truss and check balance and clearance before turning on the motor.','22-inch Weber',['turkey'],{"id":"setup","phase":"cook","start":on-45,"duration":45,"appliance":"weber","units":1,"step":"cook-1","after":[]}],
      [null,'Turkey on the spit','Keep the kettle near 350–400°F. Check kettle heat periodically and replenish fuel as needed.','22-inch Weber',['turkey'],{"id":"turkey","phase":"cook","start":on,"duration":cookMinutes,"appliance":"weber","units":1,"step":"cook-3","after":["setup"]}],
      [null,'Make the mac and cheese','Use up to two burners for pasta and sauce, then divide between shallow pans. Refrigerate waiting pans while one bakes.','Stovetop',['mac'],{"id":"mac-prep","phase":"cook","start":930,"duration":30,"appliance":"stove","units":2,"step":"cook-0","after":[]}],
      [null,'Start baking mac and cheese','Ninja BAKE at 350°F. Budget 25–30 minutes per shallow pan, longer if cold. Verify the center of any chilled pan reaches 165°F. Keep finished pans at 140°F or above in a separate holding setup.','Ninja SP101',['mac'],{"id":"mac-bake","phase":"cook","start":960,"duration":60,"appliance":"ninja","units":1,"step":"cook-2","after":["mac-prep"]}],
      [null,'Chop and chill the salad','Cover and refrigerate. Keep the dressing separate.','Cold prep',['salad'],{"id":"chop","phase":"cook","start":985,"duration":10,"appliance":"","units":0,"step":"cook-0","after":[]}],
      [null,'Start rice and soften garlic butter','Allow about 35 minutes for the rice, including covered rest. Hold cooked rice at 140°F or above as needed.','Stovetop',['rice','bread'],{"id":"rice","phase":"cook","start":995,"duration":35,"appliance":"stove","units":1,"step":"cook-0","after":[]}],
      [null,'Slice and butter bread','Ninja BAKE at 375°F after the mac clears. Use a single layer, 6–9 minutes per batch. Check the batch estimate below and adjust the booking to suit your actual bread slices and pan. Transfer finished bread to a basket.','Ninja SP101',['bread'],{"id":"bread","phase":"cook","start":1020,"duration":40,"appliance":"ninja","units":1,"step":"cook-0","after":["mac-bake"]}],
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
 ['fridge-cold','Refrigerator stayed at 40°F or below during thawing and skin drying','Cook within 1–2 days after the turkey is fully thawed, counting the overnight drying time.'],
 ['turkey-rack','Turkey is on a clean rack in a rimmed tray on the lowest shelf','Keep the turkey uncovered for skin drying, with all drips caught and raw poultry away from ready-to-eat food.'],
 ['fit','Bird rotates freely within the Weber load limit','Weber rates the 22-inch accessory for a maximum of 20 lb. Confirm clearance and balance with the loaded spit.'],
 ['breast','Thickest part of breast reached at least 165°F','Use a clean instant-read probe. Avoid touching bone.'],
 ['thigh','Innermost part of thigh reached at least 165°F','Stop rotation and check before removing turkey.'],
 ['wing','Innermost part of wing reached at least 165°F','Clean the probe after taking readings.'],
 ['hold','Hot-held foods are at 140°F or above','Keep salad and other cold perishables at 40°F or below until serving.']
];
function safety() {
  return section('Kitchen checks','REFRIGERATOR · KETTLE · THERMOMETERS','Keep the turkey cold during prep and verify doneness in three places before it leaves the grill.')+
  '<div class="actions">'+action('Print safety checks','print')+'</div><div class="split"><div>'+
  '<section class="panel"><h2>Overnight refrigerator drying</h2><p>After thawing, remove the packaging, neck and giblets, and pat the turkey dry with paper towels. Put it uncovered on a wire rack inside a rimmed tray on the lowest refrigerator shelf at 40°F or below. Keep it apart from ready-to-eat food and catch all drips.</p><p>Cook within 1–2 days of full thawing, including the overnight drying time. Skip rinsing poultry. Clean and sanitize tools and surfaces, and wash your hands before handling cooked food.</p><p>'+source('thaw','USDA thawing')+' · '+source('washing','USDA poultry handling')+'</p></section>'+
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
main.addEventListener('input',event=>{
  const form=event.target.closest('.guest-form');
  if(!form)return;
  const name=event.target.dataset.guestRange || event.target.name;
  if(!['adults','children'].includes(name))return;
  if(event.target.dataset.guestRange)form.elements[name].value=event.target.value;
  else form.querySelector('[data-guest-range="'+name+'"]').value=event.target.value;
  previewGuests(form);
});
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
  if(event.target.matches('.eta-form')){saveTurkeyEta(event);return;}
  if(event.target.matches('.guest-form')){saveGuests(event);return;}
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
  if(actionId==='clear-turkey-eta'){
    state.turkeyEta=null;
    save();
    render();
    main.querySelector('#turkey-eta').focus({preventScroll:true});
    announce('Turkey finish estimate cleared. Previous task timings restored.');
  }
  if(actionId==='review-portions'){
    state.portionsChanged=false;
    save();
    render();
  }
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
