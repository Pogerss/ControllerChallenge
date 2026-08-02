const $=id=>document.getElementById(id);
const XBOX_NAME={0:"A",1:"B",2:"X",3:"Y",4:"LB",5:"RB",6:"LT",7:"RT",8:"View",9:"Start",12:"D-Up",13:"D-Down",14:"D-Left",15:"D-Right"};
const PS_NAME={0:"Cross",1:"Circle",2:"Square",3:"Triangle",4:"L1",5:"R1",6:"L2",7:"R2",8:"Share",9:"Options",12:"D-Up",13:"D-Down",14:"D-Left",15:"D-Right"};
const BUTTONS=[0,1,2,3,4,5,6,7,8,9,12,13,14,15];
const LEFT=[4,6,8,9,12,13,14,15],RIGHT=[0,1,2,3,5,7];
const XBOX_IDS={0:"x-a",1:"x-b",2:"x-x",3:"x-y",4:"x-lb",5:"x-rb",6:"x-lt",7:"x-rt",8:"x-view",9:"x-start",12:"x-du",13:"x-dd",14:"x-dl",15:"x-dr"};
const PS_IDS={0:"p-cross",1:"p-circle",2:"p-square",3:"p-triangle",4:"p-lb",5:"p-rb",6:"p-lt",7:"p-rt",8:"p-view",9:"p-start",12:"p-du",13:"p-dd",14:"p-dl",15:"p-dr"};
const PRESETS={
 balanced:{0:12,1:10,2:10,3:8,4:9,5:9,6:12,7:14,8:1,9:1,12:2,13:2,14:2,15:3},
 movement:{0:18,1:17,2:7,3:7,4:8,5:8,6:8,7:9,8:1,9:1,12:1,13:1,14:1,15:2},
 combat:{0:8,1:8,2:12,3:10,4:12,5:12,6:15,7:18,8:1,9:1,12:1,13:1,14:1,15:2},
 heal:{0:9,1:8,2:8,3:7,4:7,5:7,6:9,7:10,8:1,9:1,12:7,13:6,14:7,15:8}
};
const FLOW_PATTERNS=[
 [1,0,7],[6,7,0],[2,3,7],[5,7,0],[1,0,7,2],[6,7,1,0],[2,3,7,0],[5,0,7,1],
 [15,0,7],[12,0,7],[3,2,7],[1,2,7,0],[4,7,0],[0,1,7],[2,7,1],[6,7,2,0]
];

let saved=JSON.parse(localStorage.getItem("ctv5")||"{}");
const S={
 layout:"xbox",mode:"sequence",preset:"balanced",running:false,paused:false,
 seq:[],full:[],start:0,deadline:0,roundLimit:2500,prev:new Map(),pair:new Set(),
 hits:0,misses:0,sessionInputs:0,sessionSequences:0,sessionStart:0,
 currentCombo:0,longestCombo:saved.longestCombo||0,bestSequence:saved.bestSequence||0,
 sessionEnd:Infinity,infiniteSession:false,pauseStartedAt:0,
 peakApm:0,inputTimes:[],transitionTimes:[],buttonStats:saved.buttonStats||{},
 transitionStats:saved.transitionStats||{},lastInputAt:null,lastButton:null,
 hesitations:0,recoveryTimes:[],lastMissAt:null,stickTargets:[],holdStart:null,
 dualStickHoldLocked:false,dualStickCompletionLocked:false,dualStickNextPairAt:0,
 dualStickWaitingForRelease:false,dualStickPendingReleaseTargets:[],successWindow:[],lifeSessions:saved.lifeSessions||0,lifeInputs:saved.lifeInputs||0,
 trackingStart:0,trackingEnd:0,trackingOnTargetMs:0,trackingLastFrame:0,
 trackingPhaseLeft:0,trackingPhaseRight:Math.PI,trackingWanderLeft:{x:0,y:0,vx:.2,vy:.15},
 trackingWanderRight:{x:0,y:0,vx:-.15,vy:.2},
 reactiveLeft:{x:0,y:0,vx:0,vy:0,nextChange:0,nextJump:0,pauseUntil:0},
 reactiveRight:{x:0,y:0,vx:0,vy:0,nextChange:0,nextJump:0,pauseUntil:0},
 scenarioLeft:{x:0,y:0,targetX:0,nextChange:0},
 scenarioRight:{x:0,y:0,vx:0,vy:0,nextChange:0,nextJump:0},
 scenarioName:"",weaponStyle:"",conceptName:"",scenarioLeftOnMs:0,scenarioRightOnMs:0,
 challenge:saved.challenge||{accuracy100:0,combo50:0,apm300:0,dual100:0},
 leftTrailPoints:[],rightTrailPoints:[],leftOnTarget:false,rightOnTarget:false,
 strafeAimLeft:{x:0,targetX:0,nextChange:0},
 strafeAimRight:{phase:0},
 continuousModeLastFrame:0,
 trackingWasOnTarget:false,
 trackingHitSoundAt:0,
 controllerIndex:null,
 controllerConnected:false,
 controllerLabel:"",
 challengeMode:false,
 challengeQueue:[],
 challengeCurrentMode:null,
 challengeCompletedModes:[],
 challengeModeStats:{},
 combatStylesPracticed:[],
 combatConceptsPracticed:[],
 challengeSwitchPending:false,
 challengeSwitchAt:null,
 challengeTransitioning:false,
 challengeTransitionStartedAt:0,
 challengeProgress:0,
 challengeTargetCount:1,
 challengeFallbackAt:0,
 challengeDurationSec:10,
 challengeType:"full",
 challengeScenarioPreset:null,
 challengeFocusSnapToken:0,
 challengePreviousFocusFamily:null,
 challengeCurrentFocusFamily:null,
 challengeFirstScenarioSnapPending:true,
 challengeSessionFinalized:false,
 simultaneousButtonArmed:true,
 simultaneousButtonFirstPressAt:0,
 simultaneousButtonFirstPressButton:null,
 simultaneousButtonWaitingForRelease:false,
 simultaneousButtonReleaseButtons:[],
 simultaneousButtonRearmAt:0,
 simultaneousButtonConfirmationUntil:0
};

function currentNames(){return S.layout==="playstation"?PS_NAME:XBOX_NAME}
function currentIds(){return S.layout==="playstation"?PS_IDS:XBOX_IDS}
function setLayout(layout){
 S.layout=layout;
 $("xboxSvg").classList.toggle("hidden",layout!=="xbox");
 $("psSvg").classList.toggle("hidden",layout!=="playstation");
 $("layoutBadge").textContent=layout==="xbox"?"Xbox":"PlayStation";
 render();
 updateAnalysis();
}

function updateControllerStatus(connected,label){
 const status=$("controllerStatus");
 if(!status)return;
 if(connected){
  status.textContent=label||"Controller connected";
  status.className="status online";
 }else{
  status.textContent="No controller detected";
  status.className="status offline";
 }
}

function getButtonStateSnapshot(){
 const gp=getActiveGamepad();
 const snapshot=new Map();
 for(const b of BUTTONS)snapshot.set(b,!!gp?.buttons[b]?.pressed);
 return snapshot;
}

function resetControllerState(initialButtonState=null){
 S.prev=new Map();
 if(initialButtonState){
  for(const b of BUTTONS){
   const pressed=initialButtonState instanceof Map?initialButtonState.get(b):!!initialButtonState[b];
   S.prev.set(b,!!pressed);
  }
 }else{
  for(const b of BUTTONS)S.prev.set(b,false);
 }
 S.pair=new Set();
 S.lastButton=null;
 S.holdStart=null;
 S.dualStickHoldLocked=false;
}

function getActiveGamepad(){
 const pads=navigator.getGamepads?navigator.getGamepads():[];
 if(S.controllerIndex!==null){
  const selected=pads[S.controllerIndex];
  if(selected&&selected.connected)return selected;
 }
 for(const pad of pads){
  if(pad&&pad.connected)return pad;
 }
 return null;
}

function handleGamepadConnected(event){
 S.controllerIndex=event.gamepad.index;
 S.controllerConnected=true;
 S.controllerLabel=event.gamepad.id||"";
 resetControllerState();
 updateControllerStatus(true,S.controllerLabel||"Controller connected");
}

function handleGamepadDisconnected(event){
 const remaining=getActiveGamepad();
 if(remaining){
  S.controllerIndex=remaining.index;
  S.controllerConnected=true;
  S.controllerLabel=remaining.id||"";
  resetControllerState();
  updateControllerStatus(true,S.controllerLabel||"Controller connected");
  return;
 }
 S.controllerIndex=null;
 S.controllerConnected=false;
 S.controllerLabel="";
 resetControllerState();
 updateControllerStatus(false);
}

function isStickHeavyMode(){
 return ["sticks","dualsticks","strafeaim","dualtrack","reactivetrack","gamescenario"].includes(S.mode);
}

function isContinuousTrackingMode(){
 return ["strafeaim","dualtrack","reactivetrack","gamescenario"].includes(S.mode);
}

function applyTrainingLayout(){
 const choice=$("trainingLayoutSelect")?.value||"auto";
 const stickFocused=choice==="sticks"||(choice==="auto"&&isStickHeavyMode());
 const trackingFocused=stickFocused&&isContinuousTrackingMode();
 const trainer=$("trainerPanel");
 trainer.classList.toggle("challenge-active",S.challengeMode);
 trainer.classList.toggle("stick-focused",stickFocused);
 trainer.classList.toggle("button-focused",!stickFocused);
 trainer.classList.toggle("tracking-focused",trackingFocused);
 $("trackingRoundProgress")?.classList.toggle("hidden",!trackingFocused);
 $("dualFocusLabel")?.classList.toggle("hidden",!stickFocused);
}

const DEFAULT_LEFT_STICK_COLOR="#FF1493";
const DEFAULT_RIGHT_STICK_COLOR="#00E5FF";

function normalizeHexColor(value){
 const text=String(value||"").trim();
 const match=text.match(/^#?([0-9a-fA-F]{6})$/);
 return match?"#"+match[1].toUpperCase():null;
}

function hexToRgba(hex,alpha){
 const clean=normalizeHexColor(hex);
 if(!clean)return `rgba(255,255,255,${alpha})`;
 const r=parseInt(clean.slice(1,3),16);
 const g=parseInt(clean.slice(3,5),16);
 const b=parseInt(clean.slice(5,7),16);
 return `rgba(${r},${g},${b},${alpha})`;
}

function applyStickColors(left,right,save=true){
 const leftColor=normalizeHexColor(left)||DEFAULT_LEFT_STICK_COLOR;
 const rightColor=normalizeHexColor(right)||DEFAULT_RIGHT_STICK_COLOR;

 document.documentElement.style.setProperty("--left-stick-color",leftColor);
 document.documentElement.style.setProperty("--right-stick-color",rightColor);

 const leftPicker=$("leftStickColor");
 const rightPicker=$("rightStickColor");
 const leftText=$("leftStickColorText");
 const rightText=$("rightStickColorText");

 if(leftPicker)leftPicker.value=leftColor.toLowerCase();
 if(rightPicker)rightPicker.value=rightColor.toLowerCase();
 if(leftText){leftText.value=leftColor;leftText.classList.remove("invalid")}
 if(rightText){rightText.value=rightColor;rightText.classList.remove("invalid")}

 // Update translucent zones and glow layers, which need RGB values.
 const leftZone=$("leftTargetZone");
 const rightZone=$("rightTargetZone");
 if(leftZone){
  leftZone.style.background=hexToRgba(leftColor,.07);
  leftZone.style.boxShadow=`0 0 24px ${hexToRgba(leftColor,.16)}`;
 }
 if(rightZone){
  rightZone.style.background=hexToRgba(rightColor,.07);
  rightZone.style.boxShadow=`0 0 24px ${hexToRgba(rightColor,.16)}`;
 }

 if(save){
  localStorage.setItem("ctv6StickColors",JSON.stringify({left:leftColor,right:rightColor}));
  saveV8Settings();
 }
}

function loadStickColors(){
 let colors={left:DEFAULT_LEFT_STICK_COLOR,right:DEFAULT_RIGHT_STICK_COLOR};
 try{
  const savedColors=JSON.parse(localStorage.getItem("ctv6StickColors")||"null");
  if(savedColors){
   const savedLeft=normalizeHexColor(savedColors.left);
   const savedRight=normalizeHexColor(savedColors.right);
   // Migrate the old untouched cyan/purple defaults, but preserve actual custom choices.
   const oldDefaults=savedLeft==="#3FC7FF"&&savedRight==="#B46CFF";
   if(!oldDefaults){
    colors.left=savedLeft||colors.left;
    colors.right=savedRight||colors.right;
   }
  }
 }catch(_){}
 applyStickColors(colors.left,colors.right,false);
}

function bindColorPicker(pickerId,textId,side){
 const picker=$(pickerId),text=$(textId);
 const other=side==="left"?()=>$("rightStickColor")?.value:()=>$("leftStickColor")?.value;

 picker.oninput=()=>{
  const color=picker.value.toUpperCase();
  text.value=color;
  text.classList.remove("invalid");
  if(side==="left")applyStickColors(color,other());
  else applyStickColors(other(),color);
 };

 const commitText=()=>{
  const color=normalizeHexColor(text.value);
  if(!color){text.classList.add("invalid");return}
  text.classList.remove("invalid");
  if(side==="left")applyStickColors(color,other());
  else applyStickColors(other(),color);
 };
 text.onchange=commitText;
 text.onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();commitText();text.blur()}};
}


function getStickOffset(){
 return +$("stickOffsetSlider")?.value||0;
}

function applyVisualOffset(side,x,y){
 const offset=getStickOffset();
 if(!offset)return{x,y};
 const sign=side==="left"?-1:1;
 return{x:x+sign*offset,y};
}

function pushTrail(side,x,y){
 return;
 const key=side==="left"?"leftTrailPoints":"rightTrailPoints";
 const container=$(side==="left"?"leftTrail":"rightTrail");
 const points=S[key];
 points.push({x,y});
 if(points.length>10)points.shift();
 container.innerHTML="";
 points.forEach((p,index)=>{
  const el=document.createElement("div");
  el.className="trail-point";
  el.style.left=p.x+"px";
  el.style.top=p.y+"px";
  el.style.opacity=((index+1)/points.length*.38).toFixed(2);
  el.style.transform=`translate(-50%,-50%) scale(${(.45+index/points.length*.55).toFixed(2)})`;
  container.appendChild(el);
 });
}

function clearTrails(){
 S.leftTrailPoints=[];
 S.rightTrailPoints=[];
 if($("leftTrail"))$("leftTrail").innerHTML="";
 if($("rightTrail"))$("rightTrail").innerHTML="";
}

function clearSimultaneousButtonsRuntimeState(){
 S.simultaneousButtonArmed=true;
 S.simultaneousButtonFirstPressAt=0;
 S.simultaneousButtonFirstPressButton=null;
 S.simultaneousButtonWaitingForRelease=false;
 S.simultaneousButtonReleaseButtons=[];
 S.simultaneousButtonRearmAt=0;
 S.simultaneousButtonConfirmationUntil=0;
}

function updateArenaClarity(leftOn,rightOn){
 S.leftOnTarget=!!leftOn;
 S.rightOnTarget=!!rightOn;
 $("leftLiveDot")?.classList.remove("hidden-on-target");
 $("rightLiveDot")?.classList.remove("hidden-on-target");
 $("leftTargetDot")?.classList.remove("focused","subdued");
 $("rightTargetDot")?.classList.remove("focused","subdued");
 $("leftTargetZone")?.classList.remove("focused","subdued");
 $("rightTargetZone")?.classList.remove("focused","subdued");
}


const V8_SETTINGS_KEY="controllerTrainerV8Settings";
const V8_SETTING_IDS=[
 "activeMode",
 "layoutSelect","trainingLayoutSelect","trainingDifficulty",
 "sessionDurationMinutes","infiniteStickSession","sequenceLength",
 "leftStickColor","rightStickColor","leftStickColorText","rightStickColorText",
 "stickDeadzone","stickResponseCurve","angleSteps","distanceMode","holdDuration",
 "strafeIntensity","aimTargetStyle","trackingSpeed","trackingPattern",
 "reactiveIntensity","gameScenarioType","leftMovementAmount","leftStickLeniency",
 "trackingTargetSize","trackingDuration","timeSlider","soundToggle","completedToggle",
 "masterVolume","hitSoundSelect","completionSoundToggle","promptStyleSelect",
 "challengeDuration","challengeRandomModesToggle","challengeRandomScenariosToggle","challengeNoRepeatsToggle"
];

function stickFeel(x,y){
 const deadzone=Math.max(0,Math.min(.5,(+$("stickDeadzone")?.value||0)/100));
 const magnitude=Math.hypot(x,y);
 if(magnitude<=deadzone)return{x:0,y:0};

 let output=(magnitude-deadzone)/(1-deadzone);
 if($("stickResponseCurve")?.value==="classic")output=Math.pow(output,1.65);

 return{x:x/magnitude*output,y:y/magnitude*output};
}

function difficultyName(level){
 return["Easy","Controlled","Standard","Hard","Extreme"][level-1]||"Standard";
}

function applyDifficulty(level,updateControls=true){
 level=Math.max(1,Math.min(5,+level||3));
 $("trainingDifficulty").value=String(level);
 $("trainingDifficultyValue").textContent=String(level);
 $("trainingDifficultyName").textContent=difficultyName(level);

 if(!updateControls)return;

 const profiles={
  1:{pressure:3800,speed:"0.45",size:"0.20",angle:25,distance:25,hold:150},
  2:{pressure:3000,speed:"0.45",size:"0.20",angle:22,distance:22,hold:125},
  3:{pressure:2200,speed:"0.75",size:"0.14",angle:18,distance:18,hold:100},
  4:{pressure:1650,speed:"1.10",size:"0.09",angle:14,distance:14,hold:75},
  5:{pressure:1150,speed:"1.45",size:"0.09",angle:10,distance:10,hold:50}
 };
 const profile=profiles[level];
 $("timeSlider").value=profile.pressure;
 $("trackingSpeed").value=profile.speed;
 $("trackingTargetSize").value=profile.size;
 $("angleTolerance").value=profile.angle;
 $("distanceTolerance").value=profile.distance;
 $("holdDuration").value=profile.hold;
 $("angleToleranceValue").textContent=profile.angle;
 $("distanceToleranceValue").textContent=profile.distance;
 $("holdDurationValue").textContent=profile.hold;
 updateUI();

 if(S.running)newRound();
}

function collectV8Settings(){
 const settings={activeMode:S.challengeMode?"challenge":S.mode,challengeType:challengeTypeKey(),sessionDurationUnit:"seconds"};
 for(const id of V8_SETTING_IDS){
  const element=$(id);
  if(!element)continue;
  settings[id]=element.type==="checkbox"?element.checked:element.value;
 }
 return settings;
}

function saveV8Settings(){
 try{
  localStorage.setItem(V8_SETTINGS_KEY,JSON.stringify(collectV8Settings()));
 }catch(_){}
}

function loadV8Settings(){
 let settings=null;
 try{
  settings=JSON.parse(localStorage.getItem(V8_SETTINGS_KEY)||"null");
 }catch(_){ }
 if(!settings){
  S.challengeMode=true;
  S.mode="challenge";
  S.challengeType="full";
  return true;
 }

 if(settings.sessionDurationMinutes!==undefined&&!settings.sessionDurationUnit){
  const raw=Number(settings.sessionDurationMinutes);
  if(Number.isFinite(raw)&&raw>=1&&raw<=180){
   settings.sessionDurationMinutes=String(Math.round(raw*60));
   settings.sessionDurationUnit="seconds";
   try{localStorage.setItem(V8_SETTINGS_KEY,JSON.stringify(settings));}catch(_){ }
  }
 }

 const savedMode=settings.activeMode;
 const hasValidMode=savedMode&&document.querySelector(`[data-mode="${savedMode}"]`);
 S.challengeType=challengeTypeKey(settings.challengeType);
 if(hasValidMode){
  S.mode=savedMode;
  S.challengeMode=savedMode==="challenge";
 }else{
  S.challengeMode=true;
  S.mode="challenge";
  S.challengeType="full";
 }
 if(S.mode!=="challenge" && settings.activeMode===undefined){
  S.challengeMode=true;
  S.mode="challenge";
  S.challengeType="full";
 }
 for(const [id,value] of Object.entries(settings)){
  if(id==="activeMode"||id==="challengeType")continue;
  const element=$(id);
  if(!element)continue;
  if(element.type==="checkbox")element.checked=!!value;
  else if(id==="gameScenarioType")element.value=resolveCombatScenarioId(String(value));
  else element.value=String(value);
 }

 applyDifficulty(+$("trainingDifficulty").value||3,false);
 $("stickDeadzoneValue").textContent=$("stickDeadzone").value;
 $("holdDurationValue").textContent=$("holdDuration").value;
 updateAudioSummary();

 const left=$("leftStickColor")?.value||DEFAULT_LEFT_STICK_COLOR;
 const right=$("rightStickColor")?.value||DEFAULT_RIGHT_STICK_COLOR;
 applyStickColors(left,right,false);
 return !hasValidMode || savedMode==="challenge";
}

function bindV8Settings(){
 for(const id of V8_SETTING_IDS){
  const element=$(id);
  if(!element)continue;
  const event=(element.type==="range"||element.type==="color")?"input":"change";
  element.addEventListener(event,()=>{
   if(["masterVolume","soundToggle","hitSoundSelect","completionSoundToggle"].includes(id))updateAudioSummary();
   if(id==="promptStyleSelect"&&["sequence","simultaneous"].includes(S.mode))render();
   saveV8Settings();
  });
 }
}

function persist(){
 localStorage.setItem("ctv5",JSON.stringify({
  longestCombo:S.longestCombo,bestSequence:S.bestSequence,buttonStats:S.buttonStats,
  transitionStats:S.transitionStats,lifeSessions:S.lifeSessions,lifeInputs:S.lifeInputs,
  challenge:S.challenge
 }));
}
function pressureName(ms){if(ms<=1200)return"Extreme";if(ms<=1700)return"Very Hard";if(ms<=2300)return"Hard";if(ms<=3200)return"Standard";if(ms<=4100)return"Relaxed";return"Easy"}
function baseLimit(){return +$("timeSlider").value}
function trackingIntervalMs(){return Math.max(5,Math.min(120,+$("trackingDuration").value||15))*1000}
function isInfiniteEligibleMode(){return ["dualsticks","strafeaim","dualtrack","reactivetrack","gamescenario"].includes(S.mode)}
function sessionLengthMs(){
 const raw=Number($("sessionDurationMinutes")?.value);
 const seconds=Math.max(10,Math.min(3600,Number.isFinite(raw)&&raw>0?raw:60));
 return seconds*1000;
}
function effectiveLimit(){
 let v=baseLimit();
 if(!$("adaptiveTimerToggle").checked)return v;
 let recent=S.successWindow.slice(-12);
 if(recent.length<6)return v;
 let rate=recent.filter(Boolean).length/recent.length;
 if(rate>=.85)return Math.max(700,v*.88);
 if(rate<=.45)return Math.min(6000,v*1.12);
 return v;
}
function weights(){
 let key=S.preset==="adaptive"?"balanced":S.preset;
 let w={...(PRESETS[key]||PRESETS.balanced)};
 if($("adaptiveToggle").checked||S.preset==="adaptive"){
  for(const b of BUTTONS){
   let s=S.buttonStats[b];
   if(s){
    let total=s.hit+s.miss;
    let missRate=total?s.miss/total:0;
    let slow=s.count?s.totalMs/s.count:0;
    w[b]+=Math.min(8,missRate*8+(slow>700?3:slow>450?1.5:0));
   }
  }
 }
 return w;
}
function weightedPick(excluded=new Set(),pool=BUTTONS){
 let bag=[],w=weights();
 for(const b of pool){
  if(excluded.has(b))continue;
  for(let i=0;i<Math.max(1,Math.round(w[b]||1));i++)bag.push(b);
 }
 return bag[Math.floor(Math.random()*bag.length)];
}
function generateSequence(length){
 let out=[];
 for(let i=0;i<length;i++){
  let ex=new Set();
  if(out.length)ex.add(out[out.length-1]);
  if(out.length>1&&Math.random()<.75)ex.add(out[out.length-2]);
  out.push(weightedPick(ex));
 }
 return out;
}
function makeApexFlow(){
 let base=FLOW_PATTERNS[Math.floor(Math.random()*FLOW_PATTERNS.length)];
 let target=+$("sequenceLength").value;
 let out=[...base];
 while(out.length<target){
  let next=weightedPick(new Set([out[out.length-1]]));
  out.push(next);
 }
 return out.slice(0,target);
}
function clearHighlights(){
 document.querySelectorAll(".control,.stick-ring,.stick-dir,.dpad-piece").forEach(x=>x.classList.remove("active"));
}
function highlightButton(b){
 let el=$(currentIds()[b]);
 if(el)el.classList.add("active");
}
function getPromptStyle(){
 const select=$("promptStyleSelect");
 return select&&select.value==="text"?"text":"visual";
}

function getButtonVisualParts(code){
 const isXbox=S.layout==="xbox";
 if(isXbox){
  switch(code){
   case 0:return {glyph:"A",label:"A",tone:"green",shape:"circle"};
   case 1:return {glyph:"B",label:"B",tone:"red",shape:"circle"};
   case 2:return {glyph:"X",label:"X",tone:"blue",shape:"circle"};
   case 3:return {glyph:"Y",label:"Y",tone:"yellow",shape:"circle"};
   case 4:return {glyph:"LB",label:"LB",tone:"neutral",shape:"shoulder"};
   case 5:return {glyph:"RB",label:"RB",tone:"neutral",shape:"shoulder"};
   case 6:return {glyph:"LT",label:"LT",tone:"neutral",shape:"trigger"};
   case 7:return {glyph:"RT",label:"RT",tone:"neutral",shape:"trigger"};
   case 8:return {glyph:"◷",label:"View",tone:"neutral",shape:"pill"};
   case 9:return {glyph:"☰",label:"Menu",tone:"neutral",shape:"pill"};
   case 12:return {glyph:"▲",label:"Up",tone:"neutral",shape:"dpad"};
   case 13:return {glyph:"▼",label:"Down",tone:"neutral",shape:"dpad"};
   case 14:return {glyph:"◀",label:"Left",tone:"neutral",shape:"dpad"};
   case 15:return {glyph:"▶",label:"Right",tone:"neutral",shape:"dpad"};
   default:return {glyph:currentNames()[code]||String(code),label:currentNames()[code]||String(code),tone:"neutral",shape:"text"};
  }
 }
 switch(code){
  case 0:return {glyph:"✕",label:"Cross",tone:"red",shape:"circle"};
  case 1:return {glyph:"◯",label:"Circle",tone:"red",shape:"circle"};
  case 2:return {glyph:"▢",label:"Square",tone:"blue",shape:"circle"};
  case 3:return {glyph:"△",label:"Triangle",tone:"yellow",shape:"circle"};
  case 4:return {glyph:"L1",label:"L1",tone:"neutral",shape:"shoulder"};
  case 5:return {glyph:"R1",label:"R1",tone:"neutral",shape:"shoulder"};
  case 6:return {glyph:"L2",label:"L2",tone:"neutral",shape:"trigger"};
  case 7:return {glyph:"R2",label:"R2",tone:"neutral",shape:"trigger"};
  case 8:return {glyph:"◫",label:"Share",tone:"neutral",shape:"pill"};
  case 9:return {glyph:"☰",label:"Options",tone:"neutral",shape:"pill"};
  case 10:return {glyph:"L3",label:"L3",tone:"neutral",shape:"pill"};
  case 11:return {glyph:"R3",label:"R3",tone:"neutral",shape:"pill"};
  case 12:return {glyph:"▲",label:"Up",tone:"neutral",shape:"dpad"};
  case 13:return {glyph:"▼",label:"Down",tone:"neutral",shape:"dpad"};
  case 14:return {glyph:"◀",label:"Left",tone:"neutral",shape:"dpad"};
  case 15:return {glyph:"▶",label:"Right",tone:"neutral",shape:"dpad"};
  default:return {glyph:currentNames()[code]||String(code),label:currentNames()[code]||String(code),tone:"neutral",shape:"text"};
 }
}

function renderButtonVisuals(buttons,options={}){
 const separator=options.separator||"";
 const visualButtons=buttons.map((button,index)=>{
  const parts=getButtonVisualParts(button);
  const isActive=options.activeIndices?.has(index) || (options.highlightAll && index>=0) || (options.activeIndex===index);
  const isCompleted=!!options.completedIndices?.has(index);
  return `<span class="prompt-chip ${isActive?"prompt-chip--active":""} ${isCompleted?"prompt-chip--completed":""}"><span class="prompt-badge prompt-badge--${parts.tone} prompt-badge--${parts.shape}">${parts.glyph}</span></span>`;
 });
 return `<div class="prompt-visual-row">${visualButtons.join(separator)}</div>`;
}

function render(){
 applyTrainingLayout();
 clearHighlights();
 let stickMode=["sticks","dualsticks","strafeaim","dualtrack","reactivetrack","gamescenario"].includes(S.mode);
 $("stickTargets").classList.toggle("hidden",!stickMode);
 if(!S.running){
  $("prompt").textContent="READY";$("sequenceStrip").textContent="";
  $("hint").textContent="Press START on your controller";return;
 }
 if(S.paused){
  $("prompt").textContent="PAUSED";$("sequenceStrip").textContent="";
  $("hint").textContent="Press Pause to resume";return;
 }
 if(stickMode){renderStickPrompt();return}
 if(["sequence","simultaneous"].includes(S.mode)&&getPromptStyle()==="visual"){
  const remaining=S.seq;
  $("prompt").innerHTML=renderButtonVisuals(remaining,{highlightAll:S.mode==="simultaneous",activeIndex:0,separator:S.mode==="simultaneous"?'<span class="prompt-separator">+</span>':""});
  $("sequenceStrip").innerHTML="";
  $("sequenceStrip").classList.add("hidden");
  $("hint").textContent=S.mode==="endurance"?"Maintain speed and accuracy":
   S.mode==="pressure"?"The timer tightens as you succeed":
   S.mode==="apex"?"Complete the Apex-style action chain":
   S.mode==="simultaneous"?"Press both highlighted controls together":
   "Complete the chain before time expires";
  if(S.mode==="simultaneous")S.seq.forEach(highlightButton);else if(S.seq[0]!==undefined)highlightButton(S.seq[0]);
  return;
 }
 $("sequenceStrip").classList.remove("hidden");
 let sep=S.mode==="simultaneous"?" + ":" → ";
 $("prompt").textContent=S.seq.map(b=>currentNames()[b]).join(sep);
 let done=S.full.length-S.seq.length;
 $("sequenceStrip").textContent=$("completedToggle").checked
  ?S.full.map((b,i)=>(i<done?"✓ ":"")+currentNames()[b]).join(sep)
  :S.full.map(b=>currentNames()[b]).join(sep);
 $("hint").textContent=S.mode==="endurance"?"Maintain speed and accuracy":
  S.mode==="pressure"?"The timer tightens as you succeed":
  S.mode==="apex"?"Complete the Apex-style action chain":
  S.mode==="simultaneous"?"Press both highlighted controls together":
  "Complete the chain before time expires";
 if(S.mode==="simultaneous")S.seq.forEach(highlightButton);else highlightButton(S.seq[0]);
}

const MODE_HINTS={
 challenge:"Challenge settings",
 sequence:"Button sequence settings",
 simultaneous:"Simultaneous button settings",
 sticks:"Single-stick settings",
 dualsticks:"Simultaneous-stick settings",
 strafeaim:"Strafe and aim settings",
 dualtrack:"Dual-tracking settings",
 reactivetrack:"Reactive-tracking settings",
 gamescenario:"Combat settings"
};
const CHALLENGE_TYPE_DEFS={
 full:{label:"Full Challenge",summary:["Mixed buttons, sticks, tracking, and combat concepts.","Auto-rotates through the full pool."],categories:["button","stick","combat"]},
 combat:{label:"Combat Challenge",summary:["Weapon styles and transferable stick-control concepts.","Rotates through the combat concept set."],categories:["combat"]},
 stick:{label:"Stick Challenge",summary:["Stick placement, tension, tracking, and coordinated movement.","Pairs single-stick and dual-stick work."],categories:["stick"]},
 button:{label:"Button Challenge",summary:["Sequences, simultaneous inputs, timing, and release control.","Focuses on button-only execution."],categories:["button"]}
};

function challengeTypeKey(type){
 return CHALLENGE_TYPE_DEFS[type]?type:"full";
}

function challengeTypeMeta(type=S.challengeType){
 return CHALLENGE_TYPE_DEFS[challengeTypeKey(type)];
}

function challengeEntriesForType(type=S.challengeType){
 const meta=challengeTypeMeta(type);
 return CHALLENGE_MODE_POOL.filter(entry=>meta.categories.includes(challengeEntryCategory(entry)));
}

function challengeStageFocusFallback(){
 return document.querySelector("#trainerPanel .controller-and-stick");
}

function challengeFocusTargetForFamily(family){
 if(family==="buttons")return document.querySelector("#trainerPanel .controller-and-stick")||challengeStageFocusFallback();
 if(family==="sticks")return document.querySelector("#trainerPanel .controller-and-stick")||challengeStageFocusFallback();
 if(family==="tracking"||family==="combat")return document.querySelector("#stickTargets .shared-arena-shell")||challengeStageFocusFallback();
 return challengeStageFocusFallback();
}

function challengeFocusTargetForEntry(entry=S.challengeCurrentMode||S.mode){
 return challengeFocusTargetForFamily(challengeFocusGroupForEntry(entry));
}

function challengeFocusGroupForEntry(entry=S.challengeCurrentMode||S.mode){
 const mode=challengeEntryMeta(entry).mode;
 if(mode==="sequence"||mode==="simultaneous")return"buttons";
 if(mode==="sticks"||mode==="dualsticks"||mode==="strafeaim")return"sticks";
 if(mode==="dualtrack"||mode==="reactivetrack")return"tracking";
 if(mode==="gamescenario")return"combat";
 return"other";
}

function resetChallengeSnapState(){
 S.challengeFocusSnapToken++;
 S.challengePreviousFocusFamily=null;
 S.challengeCurrentFocusFamily=null;
 S.challengeFirstScenarioSnapPending=true;
}

function focusChallengeScenario(target,snapToken){
 if(!target||snapToken!==S.challengeFocusSnapToken)return;
 if(!S.challengeMode||!S.running||S.challengeSessionFinalized)return;
 if(!$('summaryModal')?.classList.contains('hidden'))return;
 const rect=target.getBoundingClientRect();
 const viewportHeight=window.innerHeight||document.documentElement.clientHeight||0;
 if(!viewportHeight||rect.height<=0)return;
 const desiredTop=Math.max(72,Math.round(viewportHeight*0.18));
 const currentTop=window.scrollY+rect.top;
 const nextTop=Math.max(0,currentTop-desiredTop);
 window.scrollTo({top:nextTop,left:window.scrollX,behavior:"auto"});
}

function queueChallengeFocusSnap(nextEntry=S.challengeCurrentMode||S.mode){
 if(!S.challengeMode||!S.running||S.challengeSessionFinalized)return;
 if(!$('summaryModal')?.classList.contains('hidden'))return;
 const nextFamily=challengeFocusGroupForEntry(nextEntry);
 const previousFamily=S.challengeCurrentFocusFamily;
 const target=challengeFocusTargetForFamily(nextFamily);
 if(!target)return;
 const isFirstChallengeScenario=!!S.challengeFirstScenarioSnapPending;
 const shouldSnap=isFirstChallengeScenario||previousFamily!==nextFamily;
 S.challengeFirstScenarioSnapPending=false;
 S.challengePreviousFocusFamily=previousFamily;
 S.challengeCurrentFocusFamily=nextFamily;
 if(!shouldSnap)return;
 const snapToken=++S.challengeFocusSnapToken;
 requestAnimationFrame(()=>requestAnimationFrame(()=>focusChallengeScenario(target,snapToken)));
}

function combatEntryWeight(entry){
 return COMBAT_WEAPON_STYLE_WEIGHTS[challengeEntryMeta(entry)?.weaponStyle]||1;
}

function weightedCombatPick(candidates){
 const combatCandidates=candidates.filter(entry=>challengeEntryCategory(entry)==="combat");
 if(!combatCandidates.length)return null;
 const total=combatCandidates.reduce((sum,entry)=>sum+combatEntryWeight(entry),0);
 let threshold=Math.random()*total;
 for(const entry of combatCandidates){
  threshold-=combatEntryWeight(entry);
  if(threshold<=0)return entry;
 }
 return combatCandidates[combatCandidates.length-1];
}

function updateChallengeTypeSummary(){
 const panel=$("challengeCurrentSummary");
 if(!panel)return;
 panel.classList.toggle("hidden",!S.challengeMode);
 if(!S.challengeMode)return;
 const meta=challengeTypeMeta();
 const title=$("challengeCurrentTitle");
 if(title)title.textContent=meta.label;
 ["challengeCurrentLine1","challengeCurrentLine2"].forEach((id,index)=>{
  const line=$(id);
  if(line)line.textContent=meta.summary[index]||"";
 });
}

function setChallengeType(type,options={}){
 S.challengeType=challengeTypeKey(type);
 updateChallengeTypeSummary();
 updateModeSelectionUI();
 saveV8Settings();
 if(S.challengeMode&&options.restart!==false&&S.running){
  beginChallengeMode();
  return;
 }
 if(S.challengeMode)render();
}

const COMBAT_SCENARIOS=[
 {id:"mirror",label:"AR — Mirror",weaponStyle:"AR",conceptName:"Mirror",description:"Match the movement relationship while keeping controlled stick tension.",mode:"gamescenario",profile:"mirror"},
 {id:"antiMirror",label:"LMG — Anti-Mirror",weaponStyle:"LMG",conceptName:"Anti-Mirror",description:"Counter the movement relationship with deliberate opposite aim pressure.",mode:"gamescenario",profile:"antiMirror"},
 {id:"oppositePush",label:"SMG — Opposite Push",weaponStyle:"SMG",conceptName:"Opposite Push",description:"Push the movement and aim sticks against each other.",mode:"gamescenario",profile:"oppositePush"},
 {id:"sameSidePush",label:"Shotgun — Same-Side Push",weaponStyle:"Shotgun",conceptName:"Same-Side Push",description:"Keep both sticks applying pressure in a related direction.",mode:"gamescenario",profile:"sameSidePush"},
 {id:"microCorrections",label:"Pistol — Micro Corrections",weaponStyle:"Pistol",conceptName:"Micro Corrections",description:"Use small right-stick adjustments while maintaining stable movement.",mode:"gamescenario",profile:"microCorrections"},
 {id:"wideCorrections",label:"LMG — Wide Corrections",weaponStyle:"LMG",conceptName:"Wide Corrections",description:"Use larger right-stick travel and broader target movement.",mode:"gamescenario",profile:"wideCorrections"},
 {id:"centerHold",label:"Marksman — Center Hold",weaponStyle:"Marksman",conceptName:"Center Hold",description:"Maintain stable tension near a central position.",mode:"gamescenario",profile:"centerHold"},
 {id:"pressureHold",label:"AR — Pressure Hold",weaponStyle:"AR",conceptName:"Pressure Hold",description:"Maintain sustained off-center stick tension without drifting.",mode:"gamescenario",profile:"pressureHold"},
 {id:"lead",label:"Sniper — Lead",weaponStyle:"Sniper",conceptName:"Lead",description:"Aim slightly ahead of the target's movement path.",mode:"gamescenario",profile:"lead"},
 {id:"follow",label:"Pistol — Follow",weaponStyle:"Pistol",conceptName:"Follow",description:"Let the aim follow the target's current path smoothly.",mode:"gamescenario",profile:"follow"}
];
const COMBAT_SCENARIO_BY_ID=Object.fromEntries(COMBAT_SCENARIOS.map(entry=>[entry.id,entry]));
const COMBAT_WEAPON_STYLE_WEIGHTS={SMG:5,AR:5,Pistol:4,Shotgun:3,Marksman:2,LMG:1,Sniper:1};
const COMBAT_SCENARIO_ALIASES={smg:"pressureHold",shotgun:"sameSidePush",micro:"microCorrections",reset:"centerHold",mixed:"mixed"};

function resolveCombatScenarioId(value){
 return COMBAT_SCENARIO_ALIASES[value]||value||"mixed";
}

function getCombatScenarioEntry(value){
 const scenarioId=resolveCombatScenarioId(value);
 return COMBAT_SCENARIO_BY_ID[scenarioId]||null;
}

function getCombatScenarioProfile(value){
 return getCombatScenarioEntry(value)?.profile||"mixed";
}

function setCombatScenarioOptions(){
 const select=$("gameScenarioType");
 if(!select)return;
 const currentValue=resolveCombatScenarioId(select.value);
 const options=[
  {value:"mixed",label:"Random combat"},
  ...COMBAT_SCENARIOS.map(entry=>({value:entry.id,label:entry.label}))
 ];
 select.innerHTML=options.map(option=>`<option value="${option.value}">${option.label}</option>`).join("");
 select.value=options.some(option=>option.value===currentValue)?currentValue:"mixed";
}

function updateCombatPracticeDescription(){
 const description=$("combatPracticeDescription");
 if(!description)return;
 const entry=getCombatScenarioEntry($("gameScenarioType")?.value);
 description.textContent=entry?.description||"";
}

function getCombatScenarioDescriptor(){
 if(S.mode==="strafeaim"){
  const style=($("aimTargetStyle")?.value)||"mixed";
  const conceptName={mixed:"Pressure Hold",fine:"Micro Corrections",outer:"Wide Corrections"}[style]||"Pressure Hold";
  return{weaponStyle:"AR",conceptName};
 }
 if(S.mode==="dualtrack"){
  const pattern=($("trackingPattern")?.value)||"wander";
  const conceptName={circle:"Mirror",figure8:"Anti-Mirror",opposite:"Opposite Push",wander:"Follow"}[pattern]||"Follow";
  return{weaponStyle:"LMG",conceptName};
 }
 if(S.mode==="reactivetrack"){
  const intensity=($("reactiveIntensity")?.value)||"standard";
  const conceptName={easy:"Follow",standard:"Lead",hard:"Pressure Hold"}[intensity]||"Lead";
  return{weaponStyle:"SMG",conceptName};
 }
 if(S.mode==="gamescenario"){
  const entry=getCombatScenarioEntry(S.scenarioName||S.challengeScenarioPreset||($("gameScenarioType")?.value));
  return entry?{weaponStyle:entry.weaponStyle,conceptName:entry.conceptName}:{weaponStyle:"AR",conceptName:"Follow"};
 }
 return{weaponStyle:"",conceptName:""};
}
const CHALLENGE_MODE_POOL=["sequence","simultaneous","sticks","dualsticks","strafeaim","dualtrack","reactivetrack",...COMBAT_SCENARIOS.map(entry=>entry.id)];

function challengeEntryMeta(entry){
 const combatEntry=getCombatScenarioEntry(entry);
 if(combatEntry)return{mode:combatEntry.mode,label:`${combatEntry.weaponStyle} — ${combatEntry.conceptName}`,scenario:combatEntry.id,challengeCategory:"combat",weaponStyle:combatEntry.weaponStyle,conceptName:combatEntry.conceptName};
 const labels={sequence:"Sequence",simultaneous:"Simultaneous Buttons",sticks:"Single Stick",dualsticks:"Simultaneous Sticks",strafeaim:"Strafe + Aim",dualtrack:"Dual Tracking",reactivetrack:"Reactive Tracking",gamescenario:"Combat"};
 return{mode:entry,label:labels[entry]||entry,scenario:null,challengeCategory:challengeEntryCategory(entry)};
}

function challengeEntryCategory(entry){
 if(entry==="sequence"||entry==="simultaneous")return"button";
 if(entry==="sticks"||entry==="dualsticks"||entry==="strafeaim"||entry==="dualtrack"||entry==="reactivetrack")return"stick";
 if(COMBAT_SCENARIO_BY_ID[entry]||entry==="gamescenario"||entry==="gamescenario-mixed")return"combat";
 return"other";
}

function updateChallengeDurationLabel(){
 const slider=$("challengeDuration");
 const value=$("challengeDurationValue");
 if(slider&&value){
  const seconds=String(+slider.value||10);
  value.textContent=seconds+"s";
  S.challengeDurationSec=+slider.value||10;
 }
}

function updateModeSelectionUI(){
 document.querySelectorAll(".nav").forEach(button=>{
  if(button.dataset.challengeType){
   button.classList.toggle("active",S.challengeMode&&S.challengeType===button.dataset.challengeType);
   return;
  }
  const isChallenge=button.dataset.mode==="challenge";
  button.classList.toggle("active",S.challengeMode?isChallenge:button.dataset.mode===S.mode);
 });
}

function buildChallengeQueue(){
 const modes=[...challengeEntriesForType()];
 const queue=[];
 let lastEntry=S.challengeCurrentMode||null;
 let lastCategory=lastEntry?challengeEntryCategory(lastEntry):null;
 let lastCombatMeta=lastEntry?challengeEntryMeta(lastEntry):null;
 const typeKey=challengeTypeKey();
 while(modes.length){
  let candidates=[...modes];
  if(lastEntry){
   candidates=candidates.filter(mode=>mode!==lastEntry);
  }
  if(typeKey==="full"&&lastCategory&&candidates.length>1){
   const differentCategoryCandidates=candidates.filter(mode=>challengeEntryCategory(mode)!==lastCategory);
   if(differentCategoryCandidates.length){
    candidates=differentCategoryCandidates;
   }
  }
  if(typeKey==="combat"&&lastCombatMeta&&candidates.length>1){
    const differentStyleCandidates=candidates.filter(mode=>challengeEntryMeta(mode).weaponStyle!==lastCombatMeta.weaponStyle);
    if(differentStyleCandidates.length)candidates=differentStyleCandidates;
    const differentCombatCandidates=candidates.filter(mode=>{
     const meta=challengeEntryMeta(mode);
     return meta.weaponStyle!==lastCombatMeta.weaponStyle||meta.conceptName!==lastCombatMeta.conceptName;
    });
    if(differentCombatCandidates.length){
     candidates=differentCombatCandidates;
    }
  }
  if(!candidates.length)candidates=[...modes];
  let next=candidates[Math.floor(Math.random()*candidates.length)];
  if(challengeEntryCategory(next)==="combat"){
   const weightedCombat=weightedCombatPick(candidates);
   if(weightedCombat)next=weightedCombat;
  }
  queue.push(next);
  const poolIndex=modes.indexOf(next);
  if(poolIndex!==-1)modes.splice(poolIndex,1);
  lastEntry=next;
  lastCategory=challengeEntryCategory(lastEntry);
  lastCombatMeta=challengeEntryMeta(lastEntry);
 }
 return queue;
}

function clearActiveDrillState(options={}){
 clearHighlights();
 S.stickTargets=[];
 S.holdStart=null;
 S.dualStickHoldLocked=false;
 S.lastButton=null;
 S.seq=[];
 S.full=[];
 S.trackingStart=0;
 S.trackingEnd=0;
 S.trackingOnTargetMs=0;
 S.trackingLastFrame=0;
 S.trackingPhaseLeft=0;
 S.trackingPhaseRight=Math.PI;
 S.trackingWanderLeft={x:0,y:0,vx:.22,vy:.17};
 S.trackingWanderRight={x:0,y:0,vx:-.18,vy:.21};
 S.reactiveLeft={x:0,y:0,vx:0,vy:0,nextChange:0,nextJump:0,pauseUntil:0};
 S.reactiveRight={x:0,y:0,vx:0,vy:0,nextChange:0,nextJump:0,pauseUntil:0};
 S.strafeAimLeft={x:0,targetX:0,nextChange:0};
 S.strafeAimRight={phase:0};
 S.scenarioLeft={x:0,y:0,targetX:0,nextChange:0};
 S.scenarioRight={x:0,y:0,vx:0,vy:0,nextChange:0,nextJump:0};
 S.scenarioName="";
 S.weaponStyle="";
 S.conceptName="";
 S.scenarioLeftOnMs=0;
 S.scenarioRightOnMs=0;
 S.continuousModeLastFrame=0;
 S.trackingWasOnTarget=false;
 S.trackingHitSoundAt=0;
 if(!options.preserveSimultaneousReleaseGate)clearSimultaneousButtonsRuntimeState();
 if(options.resetChallengePreset!==false)S.challengeScenarioPreset=null;
 if(options.resetController!==false)resetControllerState();
 clearTrails();
 if(options.resetPromptUi!==false){
  const prompt=$("prompt");
  const strip=$("sequenceStrip");
  if(prompt)prompt.innerHTML="";
  if(strip)strip.innerHTML="";
 }
}

function applyChallengeScenario(mode){
 if(!S.challengeMode)return;
 if(mode==="gamescenario"){
  if(S.challengeScenarioPreset){
   const preset=resolveCombatScenarioId(S.challengeScenarioPreset);
   $("gameScenarioType").value=preset;
   return;
  }
  if($("challengeRandomScenariosToggle")?.checked===false)return;
  const scenarios=COMBAT_SCENARIOS.map(entry=>entry.id);
  $("gameScenarioType").value=scenarios[Math.floor(Math.random()*scenarios.length)];
  return;
 }
 if($("challengeRandomScenariosToggle")?.checked===false)return;
 if(mode==="strafeaim"){
  const styles=["mixed","fine","outer"];
  $("aimTargetStyle").value=styles[Math.floor(Math.random()*styles.length)];
 }else if(mode==="dualtrack"||mode==="reactivetrack"){
  const patterns=["circle","figure8","opposite","wander"];
  $("trackingPattern").value=patterns[Math.floor(Math.random()*patterns.length)];
 }
}

function beginChallengeMode(){
 if(!S.challengeMode)return;
 clearActiveDrillState({resetController:true,resetPromptUi:true});
 resetChallengeSnapState();
 S.challengeCurrentMode=null;
 S.challengeScenarioPreset=null;
 S.challengeQueue=buildChallengeQueue();
 S.challengeCompletedModes=[];
 S.challengeModeStats={};
 S.challengeTransitioning=false;
 S.challengeTransitionStartedAt=0;
 S.challengeSessionFinalized=false;
 const nextEntry=S.challengeQueue.shift()||CHALLENGE_MODE_POOL[0];
 const entryMeta=challengeEntryMeta(nextEntry);
 S.challengeCurrentMode=nextEntry;
 S.mode=entryMeta.mode;
 S.challengeScenarioPreset=entryMeta.scenario;
 S.challengeSwitchPending=false;
 S.challengeSwitchAt=null;
 S.challengeProgress=0;
 S.challengeTargetCount=challengeTargetForCurrentMode();
 S.challengeFallbackAt=performance.now()+15000;
 applyChallengeScenario(S.mode);
 updateContextualSettings();
 applyTrainingLayout();
 if(S.running&&!S.paused)newRound();
 else render();
 queueChallengeFocusSnap(S.challengeCurrentMode);
}

function challengeTargetForCurrentMode(){
 const mode=S.mode;
 if(mode==="sequence")return 1+Math.floor(Math.random()*3);
 if(mode==="simultaneous")return 2+Math.floor(Math.random()*3);
 if(mode==="sticks")return 2+Math.floor(Math.random()*3);
 if(mode==="dualsticks")return 2+Math.floor(Math.random()*3);
 if(mode==="strafeaim")return 2+Math.floor(Math.random()*3);
 return null;
}

function challengeDurationForCurrentMode(){
 const mode=S.mode;
 if(mode==="dualtrack"||mode==="reactivetrack"||mode==="gamescenario")return 6000+Math.floor(Math.random()*6000);
 return null;
}

function beginChallengeDrill(){
 const target=challengeTargetForCurrentMode();
 S.challengeProgress=0;
 S.challengeTargetCount=target;
 S.challengeFallbackAt=performance.now()+15000;
 if(S.challengeMode&&S.mode!=="challenge"){
  S.challengeSwitchPending=false;
  S.challengeSwitchAt=performance.now()+Math.max(6000,Math.min(12000,challengeDurationForCurrentMode()||7000));
 }
}

function advanceChallengeMode(){
 if(!S.challengeMode||!S.running||S.paused||S.challengeTransitioning||S.challengeSessionFinalized)return;
 S.challengeTransitioning=true;
 S.challengeTransitionStartedAt=performance.now();
 if(S.mode&&S.mode!="challenge"){
  if(!S.challengeCompletedModes.includes(S.challengeCurrentMode||S.mode))S.challengeCompletedModes.push(S.challengeCurrentMode||S.mode);
 }
 const nextEntry=S.challengeQueue.shift()||buildChallengeQueue().shift();
 if(!nextEntry){S.challengeTransitioning=false;S.challengeTransitionStartedAt=0;return;}
 const entryMeta=challengeEntryMeta(nextEntry);
 clearActiveDrillState({resetController:true,resetPromptUi:true});
 S.challengeCurrentMode=nextEntry;
 S.mode=entryMeta.mode;
 S.challengeScenarioPreset=entryMeta.scenario;
 S.challengeSwitchPending=false;
 S.challengeSwitchAt=null;
 S.challengeProgress=0;
 S.challengeTargetCount=challengeTargetForCurrentMode();
 S.challengeFallbackAt=performance.now()+15000;
 applyChallengeScenario(S.mode);
 updateContextualSettings();
 applyTrainingLayout();
 newRound();
 render();
 queueChallengeFocusSnap(S.challengeCurrentMode);
 S.challengeTransitioning=false;
 S.challengeTransitionStartedAt=0;
}

function activeChallengeEntryKey(){
 return S.challengeCurrentMode||S.mode||"challenge";
}

function recordChallengeOutcome(mode,ok){
 if(!S.challengeMode||!mode)return;
 const entry=S.challengeModeStats[mode]||(S.challengeModeStats[mode]={rounds:0,successes:0,failures:0});
 entry.rounds++;
 if(ok)entry.successes++;else entry.failures++;
 const meta=challengeEntryMeta(mode);
 if(meta.challengeCategory==="combat"){
  if(meta.weaponStyle&&!S.combatStylesPracticed.includes(meta.weaponStyle))S.combatStylesPracticed.push(meta.weaponStyle);
  if(meta.conceptName&&!S.combatConceptsPracticed.includes(meta.conceptName))S.combatConceptsPracticed.push(meta.conceptName);
 }
}

function updateChallengeSummary(){
 const summary=$("challengeSummary");
 if(!summary)return;
 if(!S.challengeMode){summary.classList.add("hidden");return}
 const typeMeta=challengeTypeMeta();
 const entries=Object.entries(S.challengeModeStats).filter(([,stats])=>stats.rounds>0).map(([mode,stats])=>({mode,stats}));
 if(!entries.length){summary.textContent=`${typeMeta.label} is active. Keep the flow moving and the next drill will appear automatically.`;summary.classList.remove("hidden");return}
 const best=entries.slice().sort((a,b)=>(b.stats.successes/b.stats.rounds)-(a.stats.successes/a.stats.rounds)||b.stats.rounds-a.stats.rounds)[0];
 const needsPractice=entries.slice().sort((a,b)=>(a.stats.successes/a.stats.rounds)-(b.stats.successes/b.stats.rounds)||a.stats.rounds-b.stats.rounds)[0];
 const bestName=best?challengeEntryMeta(best.mode).label:"—";
 const needsPracticeName=needsPractice?challengeEntryMeta(needsPractice.mode).label:"—";
 const challengeLine=`${typeMeta.label}. Modes completed: ${S.challengeCompletedModes.length || entries.length}. Best mode: ${bestName}. Needs practice: ${needsPracticeName}.`;
 const combatLine=S.challengeType==="combat"&&S.combatStylesPracticed.length
  ?`Combat styles: ${S.combatStylesPracticed.join(", ")}. Concepts: ${S.combatConceptsPracticed.join(", ")}.`
  :"";
 summary.textContent=combatLine?`${challengeLine}\n${combatLine}`:challengeLine;
 summary.classList.remove("hidden");
}

function updateContextualSettings(){
 const targetMode=S.challengeMode?"challenge":S.mode;
 $("settingsModeHint").textContent=MODE_HINTS[targetMode]||"Training settings";
 document.querySelectorAll("[data-modes]").forEach(element=>{
  const modes=element.dataset.modes.split(",");
  element.classList.toggle("mode-hidden",!modes.includes(targetMode));
 });
 updateChallengeTypeSummary();
 updateMovingModeDescription();
 updateChallengeDurationLabel();
}

function updateContinuousTargets(now){
 if(!S.running||S.paused)return;
 if(S.mode==="strafeaim")updateStrafeAimTargets(now);
 else if(S.mode==="dualtrack")updateTrackingTargets(now);
 else if(S.mode==="reactivetrack")updateReactiveTrackingTargets(now);
 else if(S.mode==="gamescenario")updateGameScenarioTargets(now);
}

function newRound(){
 if(!S.running||S.paused)return;
 S.trackingWasOnTarget=false;
 const preserveSimultaneousReleaseGate=S.mode==="simultaneous"&&S.simultaneousButtonWaitingForRelease;
 clearActiveDrillState({resetController:true,resetPromptUi:true,preserveSimultaneousReleaseGate});
 let len=+$("sequenceLength").value;
 if(S.challengeMode){
  S.challengeSwitchPending=false;
  S.challengeSwitchAt=null;
  if(challengeDurationForCurrentMode()!=null){
   S.challengeSwitchAt=performance.now()+challengeDurationForCurrentMode();
  }
 }
 if(S.mode==="sticks")S.stickTargets=[makeStickTarget(Math.random()<.5?"ls":"rs")];
 else if(S.mode==="dualsticks")S.stickTargets=[makeStickTarget("ls"),makeStickTarget("rs")];
 else if(S.mode==="strafeaim"){
  const now=performance.now();
  const amount=+$("strafeIntensity").value;
  S.stickTargets=[
   {side:"ls",angle:0,distance:0,role:"strafe"},
   {side:"rs",angle:0,distance:.42,role:"aim"}
  ];
  S.strafeAimLeft={x:0,targetX:(Math.random()<.5?-1:1)*amount,nextChange:now+700};
  S.strafeAimRight={phase:Math.random()*Math.PI*2};
  S.trackingStart=now;
  S.trackingEnd=Infinity;
  S.trackingOnTargetMs=0;
  S.scenarioLeftOnMs=0;
  S.scenarioRightOnMs=0;
  S.trackingLastFrame=now;
  S.continuousModeLastFrame=now;
  S.roundLimit=Infinity;
  S.deadline=Infinity;
 }
 else if(S.mode==="dualtrack"){
  S.stickTargets=[
   {side:"ls",angle:0,distance:.55,role:"track"},
   {side:"rs",angle:180,distance:.55,role:"track"}
  ];
  S.trackingStart=performance.now();
  S.trackingEnd=S.trackingStart+trackingIntervalMs();
  S.trackingOnTargetMs=0;
  S.trackingLastFrame=S.trackingStart;
  S.trackingPhaseLeft=Math.random()*Math.PI*2;
  S.trackingPhaseRight=Math.random()*Math.PI*2;
  S.trackingWanderLeft={x:0,y:0,vx:.22,vy:.17};
  S.trackingWanderRight={x:0,y:0,vx:-.18,vy:.21};
  S.roundLimit=trackingIntervalMs();
  S.deadline=S.trackingEnd;
 }
 else if(S.mode==="reactivetrack"){
  S.stickTargets=[
   {side:"ls",angle:0,distance:.45,role:"reactive"},
   {side:"rs",angle:180,distance:.45,role:"reactive"}
  ];
  S.trackingStart=performance.now();
  S.trackingEnd=S.trackingStart+trackingIntervalMs();
  S.trackingOnTargetMs=0;
  S.trackingLastFrame=S.trackingStart;
  const now=S.trackingStart;
  S.reactiveLeft={x:-.25,y:.1,vx:.35,vy:-.2,nextChange:now+300,nextJump:now+1400,pauseUntil:0};
  S.reactiveRight={x:.25,y:-.1,vx:-.3,vy:.25,nextChange:now+450,nextJump:now+1700,pauseUntil:0};
  S.roundLimit=trackingIntervalMs();
  S.deadline=S.trackingEnd;
 }
 else if(S.mode==="gamescenario"){
  const now=performance.now();
  const selected=resolveCombatScenarioId($("gameScenarioType").value);
  const scenario=selected==="mixed"?COMBAT_SCENARIOS[Math.floor(Math.random()*COMBAT_SCENARIOS.length)].id:selected;
  const entry=getCombatScenarioEntry(scenario);
  S.scenarioName=scenario;
  S.weaponStyle=entry?.weaponStyle||"";
  S.conceptName=entry?.conceptName||"";
  S.stickTargets=[
   {side:"ls",angle:0,distance:.28,role:"scenario-left"},
   {side:"rs",angle:180,distance:.38,role:"scenario-right"}
  ];
  S.trackingStart=now;
  S.trackingEnd=now+trackingIntervalMs();
  S.trackingOnTargetMs=0;
  S.scenarioLeftOnMs=0;
  S.scenarioRightOnMs=0;
  S.trackingLastFrame=now;
  const amount=+$("leftMovementAmount").value;
  const initialDirection=Math.random()<.5?-1:1;
  S.scenarioLeft={x:initialDirection*amount*.55,y:0,targetX:initialDirection*amount,nextChange:now+650};
  S.scenarioRight={x:0,y:0,vx:.24,vy:-.16,nextChange:now+420,nextJump:now+1400};
  S.roundLimit=trackingIntervalMs();
  S.deadline=S.trackingEnd;
 }
 else if(S.mode==="simultaneous")S.seq=[weightedPick(new Set(),LEFT),weightedPick(new Set(),RIGHT)];
 else if(S.mode==="transition")S.seq=[weightedPick(),weightedPick(new Set())];
 else if(S.mode==="apex")S.seq=makeApexFlow();
 else if(S.mode==="endurance")S.seq=generateSequence(Math.max(6,len));
 else S.seq=generateSequence(len);
 S.full=[...S.seq];
 if(["sequence","simultaneous"].includes(S.mode)){
  resetControllerState(getButtonStateSnapshot());
  if(S.mode==="simultaneous"){
   S.simultaneousButtonArmed=!S.simultaneousButtonWaitingForRelease;
   S.simultaneousButtonFirstPressAt=0;
   S.simultaneousButtonFirstPressButton=null;
   S.simultaneousButtonRearmAt=0;
   S.simultaneousButtonConfirmationUntil=0;
  }
 }else if(S.mode==="dualsticks"){
  S.dualStickCompletionLocked=false;
  S.dualStickNextPairAt=0;
  S.dualStickWaitingForRelease=false;
  S.dualStickPendingReleaseTargets=[];
  S.holdStart=null;
 }else{
  clearSimultaneousButtonsRuntimeState();
 }
 S.start=performance.now();
 S.roundLimit=effectiveLimit();
 const untimedStatic=S.infiniteSession&&["dualsticks","strafeaim"].includes(S.mode);
 S.deadline=untimedStatic?Infinity:S.start+S.roundLimit;
 render();
}

const MOVING_MODE_DESCRIPTIONS={
 strafeaim:"Track continuously while matching a slower left-stick strafe target and a more precise right-stick aim target.",
 dualtrack:"Track two independently moving targets at the same time.",
 reactivetrack:"React to readable direction changes without target teleporting.",
 gamescenario:"Practice Combat rhythm: deliberate left-stick strafes with active right-stick aim control."
};

let audioContext=null;
const AUDIO_PROFILES={
 classic:{oscillator:"sine",target:{freq1:660,freq2:880,duration:.07,base:.055,ramp:.045},complete:{freq1:520,freq2:1040,duration:.14,base:.07,ramp:.10},error:{freq1:180,freq2:220,duration:.08,base:.04,ramp:.04}},
 arcade:{oscillator:"square",target:{freq1:780,freq2:1120,duration:.06,base:.06,ramp:.04},complete:{freq1:560,freq2:900,duration:.12,base:.065,ramp:.09},error:{freq1:220,freq2:280,duration:.08,base:.04,ramp:.04}},
 mechanical:{oscillator:"triangle",target:{freq1:420,freq2:620,duration:.065,base:.05,ramp:.03},complete:{freq1:360,freq2:520,duration:.11,base:.06,ramp:.075},error:{freq1:160,freq2:200,duration:.07,base:.035,ramp:.03}},
 soft:{oscillator:"sine",target:{freq1:500,freq2:700,duration:.08,base:.05,ramp:.05},complete:{freq1:440,freq2:680,duration:.13,base:.06,ramp:.10},error:{freq1:200,freq2:240,duration:.07,base:.03,ramp:.04}},
 synth:{oscillator:"sawtooth",target:{freq1:720,freq2:980,duration:.06,base:.055,ramp:.04},complete:{freq1:600,freq2:840,duration:.12,base:.065,ramp:.09},error:{freq1:260,freq2:320,duration:.08,base:.04,ramp:.04}}
};

function getAudioContext(){
 if(!audioContext){
  const AudioContextClass=window.AudioContext||window.webkitAudioContext;
  if(AudioContextClass)audioContext=new AudioContextClass();
 }
 if(audioContext?.state==="suspended")audioContext.resume().catch(()=>{});
 return audioContext;
}

function getMasterVolumePercent(){
 return Math.max(0,Math.min(100,+(($("masterVolume")?.value)||70)));
}

function getSelectedHitSoundProfile(){
 const profile=$("hitSoundSelect")?.value||"classic";
 return profile==="off"?"classic":profile;
}

function updateAudioSummary(){
 const summary=$("audioSummary");
 const output=$("masterVolumeValue");
 const volumeValue=Math.round(getMasterVolumePercent());
 if(output)output.textContent=volumeValue+"%";
 if(summary){
  const selected=$("hitSoundSelect")?.value||"classic";
  const label=selected==="off"?"Off":selected.charAt(0).toUpperCase()+selected.slice(1);
  summary.textContent=`${volumeValue}% • ${label}`;
 }
}

function playFeedbackSound(type){
 if(!$("soundToggle")?.checked)return;
 if(type==="target"&&($("hitSoundSelect")?.value||"classic")==="off")return;
 if(type==="complete"&&!$("completionSoundToggle")?.checked)return;
 const context=getAudioContext();
 if(!context)return;

 const now=context.currentTime;
 const profileName=getSelectedHitSoundProfile();
 const profile=AUDIO_PROFILES[profileName]||AUDIO_PROFILES.classic;
 const spec=type==="complete"?profile.complete:type==="error"?profile.error:profile.target;
 const oscillator=context.createOscillator();
 const gain=context.createGain();
 oscillator.type=profile.oscillator;
 oscillator.connect(gain);
 gain.connect(context.destination);

 const volume=getMasterVolumePercent()/100;
 oscillator.frequency.setValueAtTime(spec.freq1,now);
 oscillator.frequency.exponentialRampToValueAtTime(spec.freq2,now+spec.ramp);
 gain.gain.setValueAtTime(spec.base*volume,now);
 gain.gain.exponentialRampToValueAtTime(.001,now+spec.duration);
 oscillator.start(now);
 oscillator.stop(now+spec.duration+.01);
}

function updateMovingModeDescription(){
 const description=$("movingModeDescription");
 if(description)description.textContent=MOVING_MODE_DESCRIPTIONS[S.mode]||"Controls for continuous tracking drills.";
}

function tone(ok){
 playFeedbackSound(ok?"complete":"error");
}
function recordButton(b,ok,ms){
 let s=S.buttonStats[b]||(S.buttonStats[b]={hit:0,miss:0,totalMs:0,count:0});
 if(ok){s.hit++;s.totalMs+=ms;s.count++}else s.miss++;
}
function recordTransition(a,b,ms){
 if(a==null)return;
 let k=`${a}-${b}`,s=S.transitionStats[k]||(S.transitionStats[k]={totalMs:0,count:0});
 s.totalMs+=ms;s.count++;
 S.transitionTimes.push(ms);
}
function registerInputTimestamp(now){
 S.sessionInputs++;S.lifeInputs++;S.inputTimes.push(now);
 if(S.lastInputAt!=null){
  let gap=now-S.lastInputAt;
  if(gap>450)S.hesitations++;
 }
 S.lastInputAt=now;
 if(S.lastMissAt!=null){
  S.recoveryTimes.push(now-S.lastMissAt);S.lastMissAt=null;
 }
}
function completeRound(){
 let now=performance.now(),ms=Math.round(now-S.start);
 S.hits++;S.sessionSequences++;S.currentCombo++;
 S.longestCombo=Math.max(S.longestCombo,S.currentCombo);
 if(!S.bestSequence||ms<S.bestSequence)S.bestSequence=ms;
 S.successWindow.push(true);
 if(S.mode==="dualsticks"||S.mode==="strafeaim")S.challenge.dual100++;
 recordChallengeOutcome(activeChallengeEntryKey(),true);
 if(S.mode==="simultaneous"){
  S.simultaneousButtonReleaseButtons=[...S.seq];
  S.simultaneousButtonWaitingForRelease=true;
  S.simultaneousButtonArmed=false;
  S.simultaneousButtonFirstPressAt=0;
  S.simultaneousButtonFirstPressButton=null;
  S.simultaneousButtonRearmAt=0;
  S.simultaneousButtonConfirmationUntil=0;
 }
 updateChallenges();
 tone(true);persist();updateUI();
 if(S.challengeMode){
  if(challengeDurationForCurrentMode()==null){
   S.challengeProgress++;
   if(S.challengeProgress>=Math.max(1,S.challengeTargetCount||1)){
    advanceChallengeMode();
    return;
   }
  }
  if(S.challengeSwitchPending){advanceChallengeMode();return}
 }
 newRound();
}

function completeDualStickPair(now){
 if(S.mode!="dualsticks")return;
 const ms=Math.round(now-S.start);
 S.hits++;S.sessionSequences++;S.currentCombo++;
 S.longestCombo=Math.max(S.longestCombo,S.currentCombo);
 if(!S.bestSequence||ms<S.bestSequence)S.bestSequence=ms;
 S.successWindow.push(true);
 S.challenge.dual100++;
 recordChallengeOutcome(activeChallengeEntryKey(),true);
 S.dualStickCompletionLocked=true;
 S.dualStickNextPairAt=now+240;
 S.dualStickWaitingForRelease=true;
 S.dualStickPendingReleaseTargets=[...S.stickTargets];
 S.holdStart=null;
 S.dualStickHoldLocked=true;
 updateChallenges();
 tone(true);persist();updateUI();
 if(S.challengeMode){
  if(challengeDurationForCurrentMode()==null){
   S.challengeProgress++;
   if(S.challengeProgress>=Math.max(1,S.challengeTargetCount||1)){
    advanceChallengeMode();
    return;
   }
  }
  if(S.challengeSwitchPending){advanceChallengeMode();return}
 }
 render();
}
function failRound(options={}){
 if(!S.running||S.paused)return;
 S.misses++;S.currentCombo=0;S.lastMissAt=performance.now();S.successWindow.push(false);
 recordChallengeOutcome(activeChallengeEntryKey(),false);
 if(!options.silent)tone(false);persist();updateUI();
 if(S.challengeMode&&S.challengeSwitchPending){advanceChallengeMode();return}
 newRound();
}

function updateSimultaneousButtonReleaseState(gp){
 if(S.mode!=="simultaneous"||!S.simultaneousButtonWaitingForRelease)return;
 const stillHeld=S.simultaneousButtonReleaseButtons.some(button=>!!gp?.buttons[button]?.pressed);
 if(stillHeld)return;
 S.simultaneousButtonWaitingForRelease=false;
 S.simultaneousButtonReleaseButtons=[];
 S.simultaneousButtonArmed=true;
 S.simultaneousButtonFirstPressAt=0;
 S.simultaneousButtonFirstPressButton=null;
 S.simultaneousButtonRearmAt=0;
 S.simultaneousButtonConfirmationUntil=0;
}

function handlePress(b){
 if(!S.running){
  if(!$('summaryModal').classList.contains('hidden')&&b===1){
   $('summaryModal').classList.add('hidden');
   return;
  }
  if(b===9)startSession();
  return;
 }
 if(S.paused||["sticks","dualsticks","strafeaim","dualtrack","reactivetrack","gamescenario"].includes(S.mode))return;
 let now=performance.now();registerInputTimestamp(now);
 if(S.mode==="simultaneous"){
  if(S.simultaneousButtonWaitingForRelease)return;
  if(!S.seq.includes(b)){recordButton(b,false,0);failRound();return}
  if(S.simultaneousButtonArmed){
   S.simultaneousButtonArmed=false;
   S.simultaneousButtonFirstPressAt=now;
   S.simultaneousButtonFirstPressButton=b;
   S.pair.add(b);
   return;
  }
  const firstPress=S.simultaneousButtonFirstPressAt;
  const firstButton=S.simultaneousButtonFirstPressButton;
  if(!firstPress){
   S.simultaneousButtonFirstPressAt=now;
   S.simultaneousButtonFirstPressButton=b;
   S.pair.add(b);
   return;
  }
  if(b===firstButton)return;
  if(now-firstPress<=120){
   S.pair.add(b);
   if(S.seq.every(x=>S.pair.has(x))){
    for(const x of S.seq)recordButton(x,true,now-S.start);
    completeRound();
   }
   return;
  }
  S.simultaneousButtonFirstPressAt=now;
  S.simultaneousButtonFirstPressButton=b;
  S.pair.clear();
  S.pair.add(b);
  return;
 }
 let expected=S.seq[0],ok=b===expected;
 recordButton(b,ok,now-S.start);
 if(!ok){failRound();return}
 if(S.lastButton!=null)recordTransition(S.lastButton,b,now-S.lastInputAt);
 S.lastButton=b;S.seq.shift();
 if(!S.seq.length)completeRound();else render();
}
function makeStickTarget(side){
 let steps=+$("angleSteps").value,step=360/steps,angle=Math.floor(Math.random()*steps)*step;
 let mode=$("distanceMode").value;
 let distance=mode==="fine"?.18+Math.random()*.34:mode==="outer"?.72+Math.random()*.22:.25+Math.random()*.65;
 return{side,angle,distance};
}
function polar(x,y){return{distance:Math.min(1,Math.hypot(x,y)),angle:(Math.atan2(y,x)*180/Math.PI+360)%360}}
function angleDiff(a,b){return Math.abs(((a-b+540)%360)-180)}
function targetMatch(t,x,y){
 const adjusted=stickFeel(x,y);
 let p=polar(adjusted.x,adjusted.y);
 return angleDiff(p.angle,t.angle)<=+$("angleTolerance").value&&Math.abs(p.distance-t.distance)<=+$("distanceTolerance").value/100;
}
function angleName(a){
 const names=["RIGHT","DOWN-RIGHT","DOWN","DOWN-LEFT","LEFT","UP-LEFT","UP","UP-RIGHT"];
 return names[Math.round((((a%360)+360)%360)/45)%8];
}
function targetGeometry(){
 const arena=$("sharedArena");
 if(arena){
  const rect=arena.getBoundingClientRect();
  const size=Math.min(rect.width,rect.height)||rect.width||rect.height;
  return{center:size/2,radius:size*.455};
 }
 return{center:85,radius:72};
}
function setDot(id,a,d){
 const g=targetGeometry(),rad=a*Math.PI/180;
 let x=g.center+Math.cos(rad)*g.radius*d;
 let y=g.center+Math.sin(rad)*g.radius*d;
 const side=id.startsWith("left")?"left":"right";
 ({x,y}=applyVisualOffset(side,x,y));
 const el=$(id);
 el.style.left=x+"px";el.style.top=y+"px";
 const zone=id==="leftTargetDot"?$("leftTargetZone"):id==="rightTargetDot"?$("rightTargetZone"):null;
 if(zone){zone.style.left=x+"px";zone.style.top=y+"px"}
}
function setLive(id,x,y){
 const adjusted=stickFeel(x,y);
 x=adjusted.x;y=adjusted.y;
 const g=targetGeometry(),side=id.startsWith("left")?"left":"right";
 let px=g.center+x*g.radius;
 let py=g.center+y*g.radius;
 ({x:px,y:py}=applyVisualOffset(side,px,py));
 const el=$(id);
 el.style.left=px+"px";
 el.style.top=py+"px";
 pushTrail(side,px,py);
}
function renderStickPrompt(){
 clearHighlights();
 updateArenaClarity(false,false);
 $("sharedArena")?.classList.remove("both-on");
 let lt=S.stickTargets.find(t=>t.side==="ls"),rt=S.stickTargets.find(t=>t.side==="rs");
 const combatMode=["strafeaim","dualtrack","reactivetrack","gamescenario"].includes(S.mode);
 const combatDescriptor=getCombatScenarioDescriptor();
 S.weaponStyle=combatDescriptor.weaponStyle;
 S.conceptName=combatDescriptor.conceptName;
 $("stickModeBanner").classList.toggle("hidden",!combatMode);
 $("stickModeBanner").textContent=combatMode?`Combat · ${S.conceptName} · ${S.weaponStyle}`:"";
 $("stickModeBanner").classList.toggle("reactive",S.mode==="reactivetrack");
 $("stickModeBanner").classList.toggle("scenario",S.mode==="gamescenario");
 $("trackingScorePanel").classList.toggle("hidden",!["dualtrack","reactivetrack","gamescenario"].includes(S.mode));
 $("trackingScorePanel").classList.toggle("reactive",S.mode==="reactivetrack");
 $("trackingScorePanel").classList.toggle("scenario",S.mode==="gamescenario");

 for(const [side,t] of [["left",lt],["right",rt]]){
  let text=$(side+"TargetText"),stats=$(side+"TargetStats"),dot=$(side+"TargetDot");
  dot.classList.toggle("tracking",["dualtrack","reactivetrack","gamescenario"].includes(S.mode));

  if(!t){
   text.textContent="Not used";stats.textContent="";dot.style.opacity=".12";continue;
  }

  dot.style.opacity="1";
  if(S.mode==="dualtrack"){
   text.textContent=S.mode==="gamescenario"
    ?(side==="left"?"MOVEMENT / STRAFE":"AIM / TRACK")
    :S.mode==="reactivetrack"
      ?(side==="left"?"REACT LEFT":"REACT RIGHT")
      :(side==="left"?"TRACK LEFT TARGET":"TRACK RIGHT TARGET");
   stats.textContent=S.mode==="gamescenario"
    ?(side==="left"?"Wider tolerance · smaller movement":"Tighter tolerance · more active movement")
    :S.mode==="reactivetrack"?"Expect abrupt changes and jumps":"Keep the blue dot near the moving target";
  }else if(S.mode==="strafeaim"&&t.role==="strafe"){
   text.textContent=t.angle===180?"STRAFE LEFT":"STRAFE RIGHT";
   stats.textContent=`Movement · ${Math.round(t.distance*100)}%`;
  }else if(S.mode==="strafeaim"&&t.role==="aim"){
   text.textContent="AIM "+angleName(t.angle);
   stats.textContent=`Aim · ${Math.round(t.angle)}° · ${Math.round(t.distance*100)}%`;
  }else{
   text.textContent=angleName(t.angle);
   stats.textContent=`${Math.round(t.angle)}° · ${Math.round(t.distance*100)}%`;
  }

  setDot(side+"TargetDot",t.angle,t.distance);
 }

 if(S.mode==="dualtrack"||S.mode==="reactivetrack"||S.mode==="gamescenario"){
  $("prompt").textContent=S.mode==="reactivetrack"?"REACT TO BOTH TARGETS":S.mode==="gamescenario"?"MOVE + AIM":"TRACK BOTH TARGETS";
  $("sequenceStrip").textContent=S.mode==="reactivetrack"?"Follow abrupt movements with both sticks":S.mode==="gamescenario"?"Use relaxed movement control while keeping aim precise":"Keep both live dots close to their moving targets";
  $("hint").textContent=S.mode==="reactivetrack"?"React to unpredictable direction and speed changes":S.mode==="gamescenario"?"Game-like left-stick movement with stricter right-stick aim":"Track two independent targets simultaneously";
 }else if(S.mode==="strafeaim"){
  let strafe=lt?.angle===180?"LEFT":"RIGHT";
  $("prompt").textContent=`STRAFE ${strafe} + AIM ${angleName(rt?.angle ?? 0)}`;
  $("sequenceStrip").textContent="Hold the left-stick strafe and place the right stick on the aim target";
  $("hint").textContent="Move and aim simultaneously, then hold both targets";
 }else{
  $("prompt").textContent=S.stickTargets.map(t=>`${t.side.toUpperCase()} ${angleName(t.angle)} ${Math.round(t.distance*100)}%`).join(" + ");
  $("sequenceStrip").textContent=S.stickTargets.length===2?"Move both sticks to their targets":"Move the highlighted stick precisely";
  $("hint").textContent="Match angle and distance, then hold briefly";
 }
}

function updateStrafeAimTargets(now){
 if(S.mode!=="strafeaim"||!S.stickTargets.length)return;
 const dt=Math.min(.05,Math.max(0,(now-S.continuousModeLastFrame)/1000));
 const difficulty=+$("trainingDifficulty").value||3;
 const speed=(+$("trackingSpeed").value)*(0.78+difficulty*.075);
 const amount=+$("strafeIntensity").value;
 const left=S.strafeAimLeft;

 if(now>=left.nextChange){
  left.targetX=(Math.random()<.5?-1:1)*amount;
  left.nextChange=now+700+Math.random()*500;
 }
 left.x+=(left.targetX-left.x)*Math.min(1,dt*4.6);

 S.strafeAimRight.phase+=dt*speed;
 const style=$("aimTargetStyle").value;
 const scale=style==="fine"?.34:style==="outer"?.72:.53;
 const right={
  x:(Math.sin(S.strafeAimRight.phase*.78)*.72+Math.sin(S.strafeAimRight.phase*.29)*.16)*scale,
  y:Math.cos(S.strafeAimRight.phase*.63)*.55*scale
 };

 S.continuousModeLastFrame=now;
 const leftAngle=left.x<0?180:0;
 S.stickTargets[0].angle=leftAngle;
 S.stickTargets[0].distance=Math.abs(left.x);
 S.stickTargets[1].angle=(Math.atan2(right.y,right.x)*180/Math.PI+360)%360;
 S.stickTargets[1].distance=Math.hypot(right.x,right.y);
 setDot("leftTargetDot",S.stickTargets[0].angle,S.stickTargets[0].distance);
 setDot("rightTargetDot",S.stickTargets[1].angle,S.stickTargets[1].distance);
}

function updateTrackingTargets(now){
 if(S.mode!=="dualtrack")return;
 const speed=+$("trackingSpeed").value;
 const pattern=$("trackingPattern").value;
 const t=(now-S.trackingStart)/1000;

 function clampPoint(x,y){
  const m=Math.hypot(x,y);
  if(m>.92){x=x/m*.92;y=y/m*.92}
  return{x,y};
 }

 let left,right;
 if(pattern==="circle"){
  left={x:Math.cos(t*speed+S.trackingPhaseLeft)*.65,y:Math.sin(t*speed+S.trackingPhaseLeft)*.65};
  right={x:Math.cos(t*speed*.83+S.trackingPhaseRight)*.58,y:Math.sin(t*speed*.83+S.trackingPhaseRight)*.58};
 }else if(pattern==="figure8"){
  left={x:Math.sin(t*speed)*.72,y:Math.sin(t*speed*2)*.36};
  right={x:Math.sin(t*speed*.9+Math.PI)*.68,y:Math.sin(t*speed*1.8+Math.PI/2)*.38};
 }else if(pattern==="opposite"){
  left={x:Math.cos(t*speed)*.66,y:Math.sin(t*speed)*.66};
  right={x:-left.x,y:-left.y};
 }else{
  left={
   x:(Math.sin(t*speed*.49+S.trackingPhaseLeft)*.36+Math.sin(t*speed*.18)*.10),
   y:Math.cos(t*speed*.37+S.trackingPhaseLeft)*.18
  };
  right={
   x:(Math.sin(t*speed*.69+S.trackingPhaseRight)*.50+Math.sin(t*speed*.24)*.14),
   y:Math.cos(t*speed*.57+S.trackingPhaseRight)*.34
  };
 }
 left=clampPoint(left.x,left.y);right=clampPoint(right.x,right.y);
 S.continuousModeLastFrame=now;
 S.stickTargets[0].angle=(Math.atan2(left.y,left.x)*180/Math.PI+360)%360;
 S.stickTargets[0].distance=Math.hypot(left.x,left.y);
 S.stickTargets[1].angle=(Math.atan2(right.y,right.x)*180/Math.PI+360)%360;
 S.stickTargets[1].distance=Math.hypot(right.x,right.y);
 setDot("leftTargetDot",S.stickTargets[0].angle,S.stickTargets[0].distance);
 setDot("rightTargetDot",S.stickTargets[1].angle,S.stickTargets[1].distance);
}


function updateReactiveTrackingTargets(now){
 if(S.mode!=="reactivetrack"||!S.stickTargets.length)return;
 const intensity=$("reactiveIntensity").value;
 const config={
  easy:{speed:.34,changeMin:850,changeMax:1400},
  standard:{speed:.52,changeMin:560,changeMax:980},
  hard:{speed:.72,changeMin:340,changeMax:680}
 }[intensity];
 const dt=Math.min(.05,Math.max(0,(now-S.continuousModeLastFrame)/1000));

 function update(body,mostlyHorizontal){
  if(now>=body.nextChange){
   const angle=mostlyHorizontal
    ?(Math.random()<.5?0:Math.PI)+(Math.random()-.5)*.25
    :Math.random()*Math.PI*2;
   const magnitude=config.speed*(.72+Math.random()*.28);
   body.vx=Math.cos(angle)*magnitude;
   body.vy=Math.sin(angle)*magnitude*(mostlyHorizontal?.40:1);
   body.nextChange=now+config.changeMin+Math.random()*(config.changeMax-config.changeMin);
  }

  body.x+=body.vx*dt;
  body.y+=body.vy*dt;

  const limit=mostlyHorizontal?.65:.84;
  const distance=Math.hypot(body.x,body.y);
  if(distance>limit){
   const nx=body.x/distance,ny=body.y/distance;
   body.x=nx*limit;
   body.y=ny*limit;
   const outward=body.vx*nx+body.vy*ny;
   body.vx-=1.8*outward*nx;
   body.vy-=1.8*outward*ny;
  }
 }

 update(S.reactiveLeft,true);
 update(S.reactiveRight,false);
 S.continuousModeLastFrame=now;

 const left=S.reactiveLeft,right=S.reactiveRight;
 S.stickTargets[0].angle=(Math.atan2(left.y,left.x)*180/Math.PI+360)%360;
 S.stickTargets[0].distance=Math.hypot(left.x,left.y);
 S.stickTargets[1].angle=(Math.atan2(right.y,right.x)*180/Math.PI+360)%360;
 S.stickTargets[1].distance=Math.hypot(right.x,right.y);
 setDot("leftTargetDot",S.stickTargets[0].angle,S.stickTargets[0].distance);
 setDot("rightTargetDot",S.stickTargets[1].angle,S.stickTargets[1].distance);
}

function updateGameScenarioTargets(now){
 if(S.mode!=="gamescenario"||!S.stickTargets.length)return;
 const dt=Math.min(.05,Math.max(0,(now-S.continuousModeLastFrame)/1000));
 const amount=+$("leftMovementAmount").value;
 const scenario=S.scenarioName;
 const left=S.scenarioLeft;
 const right=S.scenarioRight;

 let leftChangeMin=700,leftChangeMax=1250,leftSmooth=2.8;
 let rightSpeed=.46,rightChangeMin=520,rightChangeMax=900;
 let rightBias=0.0;

 if(scenario==="smg"){
  leftChangeMin=500;leftChangeMax=850;leftSmooth=3.2;
  rightSpeed=.62;rightChangeMin=360;rightChangeMax=650;rightBias=.16;
 }else if(scenario==="shotgun"){
  leftChangeMin=900;leftChangeMax=1500;leftSmooth=2.1;
  rightSpeed=.33;rightChangeMin=720;rightChangeMax=1100;rightBias=-.12;
 }else if(scenario==="micro"){
  leftChangeMin=650;leftChangeMax=980;leftSmooth=2.4;
  rightSpeed=.28;rightChangeMin=480;rightChangeMax=780;rightBias=.08;
 }else if(scenario==="reset"){
  leftChangeMin=1050;leftChangeMax=1750;leftSmooth=3.4;
  rightSpeed=.24;rightChangeMin=760;rightChangeMax=1180;rightBias=-.18;
 }

 if(now>=left.nextChange){
  if(scenario==="reset"&&Math.random()<.35)left.targetX=0;
  else{
   const scale=scenario==="micro"?.42:scenario==="shotgun"?.65:.78+Math.random()*.22;
   const direction=Math.random()<.5?-1:1;
   left.targetX=direction*amount*scale;
  }
  left.nextChange=now+leftChangeMin+Math.random()*(leftChangeMax-leftChangeMin);
 }

 left.x+=(left.targetX-left.x)*Math.min(1,dt*leftSmooth);
 left.y+=(0-left.y)*Math.min(1,dt*5.5);

 if(now>=right.nextChange){
  const angle=(Math.random()*Math.PI*2)+rightBias;
  const magnitude=rightSpeed*(.78+Math.random()*.22);
  right.vx=Math.cos(angle)*magnitude;
  right.vy=Math.sin(angle)*magnitude;
  right.nextChange=now+rightChangeMin+Math.random()*(rightChangeMax-rightChangeMin);
 }

 right.x+=right.vx*dt;
 right.y+=right.vy*dt;

 const distance=Math.hypot(right.x,right.y);
 if(distance>.86){
  const nx=right.x/distance,ny=right.y/distance;
  right.x=nx*.86;
  right.y=ny*.86;
  const outward=right.vx*nx+right.vy*ny;
  right.vx-=1.6*outward*nx;
  right.vy-=1.6*outward*ny;
 }

 S.continuousModeLastFrame=now;
 S.stickTargets[0].angle=(Math.atan2(left.y,left.x)*180/Math.PI+360)%360;
 S.stickTargets[0].distance=Math.hypot(left.x,left.y);
 S.stickTargets[1].angle=(Math.atan2(right.y,right.x)*180/Math.PI+360)%360;
 S.stickTargets[1].distance=Math.hypot(right.x,right.y);
 setDot("leftTargetDot",S.stickTargets[0].angle,S.stickTargets[0].distance);
 setDot("rightTargetDot",S.stickTargets[1].angle,S.stickTargets[1].distance);
}

function checkSticks(gp,now){
 if(!S.running||S.paused||!["sticks","dualsticks","strafeaim","dualtrack","reactivetrack","gamescenario"].includes(S.mode)||!S.stickTargets.length)return;
 let lx=gp.axes[0]||0,ly=gp.axes[1]||0,rx=gp.axes[2]||0,ry=gp.axes[3]||0;
 const adjustedLeft=stickFeel(lx,ly),adjustedRight=stickFeel(rx,ry);
 lx=adjustedLeft.x;ly=adjustedLeft.y;rx=adjustedRight.x;ry=adjustedRight.y;
 setLive("leftLiveDot",lx,ly);setLive("rightLiveDot",rx,ry);

 if(S.mode==="dualtrack"||S.mode==="reactivetrack"||S.mode==="gamescenario"){
  const radius=+$("trackingTargetSize").value;
  const lt=S.stickTargets[0],rt=S.stickTargets[1];
  const lp={x:Math.cos(lt.angle*Math.PI/180)*lt.distance,y:Math.sin(lt.angle*Math.PI/180)*lt.distance};
  const rp={x:Math.cos(rt.angle*Math.PI/180)*rt.distance,y:Math.sin(rt.angle*Math.PI/180)*rt.distance};
  const leftRadius=S.mode==="gamescenario"?+$("leftStickLeniency").value:
   S.mode==="strafeaim"?Math.max(.17,radius*1.45):radius;
  const rightRadius=S.mode==="gamescenario"?Math.max(.07,radius*.78):
   S.mode==="strafeaim"?Math.max(.07,radius*.85):radius;
  const arenaSize=$("sharedArena")?.getBoundingClientRect().width||700;
  const leftZone=$("leftTargetZone"),rightZone=$("rightTargetZone");
  if(leftZone){
   const px=Math.max(46,leftRadius*arenaSize*.91);
   leftZone.style.width=px+"px";leftZone.style.height=px+"px";
  }
  if(rightZone){
   const px=Math.max(38,rightRadius*arenaSize*.91);
   rightZone.style.width=px+"px";rightZone.style.height=px+"px";
  }
  const leftOn=Math.hypot(lx-lp.x,ly-lp.y)<=leftRadius;
  const rightOn=Math.hypot(rx-rp.x,ry-rp.y)<=rightRadius;
  updateArenaClarity(leftOn,rightOn);
  const bothOn=leftOn&&rightOn;
  if(bothOn&&!S.trackingWasOnTarget&&now-S.trackingHitSoundAt>140){
   playFeedbackSound("target");
   S.trackingHitSoundAt=now;
  }
  S.trackingWasOnTarget=bothOn;
  const dt=Math.max(0,Math.min(50,now-S.trackingLastFrame));
  if(S.mode==="gamescenario"||S.mode==="strafeaim"){
   if(leftOn)S.scenarioLeftOnMs+=dt;
   if(rightOn)S.scenarioRightOnMs+=dt;
   if(leftOn&&rightOn)S.trackingOnTargetMs+=dt;
  }else if(leftOn&&rightOn)S.trackingOnTargetMs+=dt;
  S.trackingLastFrame=now;

  const arena=$("sharedArena");
  arena?.classList.toggle("both-on",leftOn&&rightOn);

  const elapsed=Math.max(1,now-S.trackingStart);
  const simultaneousScore=Math.round(S.trackingOnTargetMs/elapsed*100);
  const leftScore=Math.round(S.scenarioLeftOnMs/elapsed*100);
  const rightScore=Math.round(S.scenarioRightOnMs/elapsed*100);
  const score=(S.mode==="gamescenario"||S.mode==="strafeaim")?Math.round(leftScore*.3+rightScore*.7):simultaneousScore;
  $("trackingScore").textContent=score+"%";
  $("trackingStatus").textContent=(S.mode==="gamescenario"||S.mode==="strafeaim")
   ?`Movement ${leftScore}% · Aim ${rightScore}%`
   :leftOn&&rightOn?"Both targets acquired":leftOn||rightOn?"One target acquired":"Acquire both targets";
  return;
 }

 let leftTarget=S.stickTargets.find(t=>t.side==="ls");
 let rightTarget=S.stickTargets.find(t=>t.side==="rs");
 let leftOn=leftTarget?targetMatch(leftTarget,lx,ly):true;
 let rightOn=rightTarget?targetMatch(rightTarget,rx,ry):true;
 updateArenaClarity(leftOn,rightOn);
 if(S.mode==="dualsticks"){
  if(S.dualStickCompletionLocked){
   if(now>=S.dualStickNextPairAt){
    const pendingTargets=S.dualStickPendingReleaseTargets||[];
    const pendingLeft=pendingTargets.find(t=>t.side==="ls");
    const pendingRight=pendingTargets.find(t=>t.side==="rs");
    const leftReleased=!pendingLeft||!targetMatch(pendingLeft,lx,ly);
    const rightReleased=!pendingRight||!targetMatch(pendingRight,rx,ry);
    S.dualStickCompletionLocked=false;
    S.dualStickNextPairAt=0;
    S.dualStickWaitingForRelease=!(leftReleased&&rightReleased);
    S.dualStickPendingReleaseTargets=leftReleased&&rightReleased?[]:pendingTargets;
    S.stickTargets=[makeStickTarget("ls"),makeStickTarget("rs")];
    S.holdStart=null;
    S.dualStickHoldLocked=!leftReleased||!rightReleased;
    if(S.dualStickWaitingForRelease){render();return}
    render();
    return;
   }else{
    S.holdStart=null;
    return;
   }
  }
  if(S.dualStickWaitingForRelease){
   const pendingTargets=S.dualStickPendingReleaseTargets||[];
   const pendingLeft=pendingTargets.find(t=>t.side==="ls");
   const pendingRight=pendingTargets.find(t=>t.side==="rs");
   const leftReleased=!pendingLeft||!targetMatch(pendingLeft,lx,ly);
   const rightReleased=!pendingRight||!targetMatch(pendingRight,rx,ry);
   if(!(leftReleased&&rightReleased)){
    S.holdStart=null;
    return;
   }
   S.dualStickWaitingForRelease=false;
   S.dualStickPendingReleaseTargets=[];
   S.dualStickHoldLocked=false;
  }
 }
 let all=leftOn&&rightOn;
 if(all){
  if(S.mode==="dualsticks"){
   if(S.dualStickHoldLocked){
    S.holdStart=null;
    return;
   }
   if(S.holdStart==null)S.holdStart=now;
   if(now-S.holdStart>=+$("holdDuration").value){
    for(let i=0;i<S.stickTargets.length;i++)registerInputTimestamp(now);
    completeDualStickPair(now);
   }
  }else{
   if(S.holdStart==null)S.holdStart=now;
   if(now-S.holdStart>=+$("holdDuration").value){
    for(let i=0;i<S.stickTargets.length;i++)registerInputTimestamp(now);
    completeRound();
   }
  }
 }else{
  S.holdStart=null;
  if(S.mode==="dualsticks")S.dualStickHoldLocked=false;
 }
}
function liveApm(now){
 let cutoff=now-10000,recent=S.inputTimes.filter(t=>t>=cutoff);
 return Math.round(recent.length*6);
}
function average(arr){return arr.length?arr.reduce((a,b)=>a+b,0)/arr.length:0}
function weakestButton(){
 let arr=Object.entries(S.buttonStats).filter(([,v])=>v.hit+v.miss>=3).map(([k,v])=>{
  let acc=v.hit/Math.max(1,v.hit+v.miss),speed=v.count?v.totalMs/v.count:0;
  return[k,(1-acc)*100+Math.min(100,speed/10)];
 }).sort((a,b)=>b[1]-a[1]);
 return arr[0]?currentNames()[arr[0][0]]:"—";
}
function updateAnalysis(){
 let weak=Object.entries(S.buttonStats).filter(([,v])=>v.hit+v.miss>=2).map(([k,v])=>[k,Math.round(v.hit/Math.max(1,v.hit+v.miss)*100)]).sort((a,b)=>a[1]-b[1]).slice(0,5);
 $("weakButtons").innerHTML=weak.map(([k,a])=>`<div class="analysis-row"><span>${currentNames()[k]}</span><strong>${a}%</strong></div>`).join("")||"No data yet";
 let tr=Object.entries(S.transitionStats).filter(([,v])=>v.count>=2).map(([k,v])=>[k,Math.round(v.totalMs/v.count)]).sort((a,b)=>b[1]-a[1]).slice(0,5);
 $("slowTransitions").innerHTML=tr.map(([k,ms])=>{let[a,b]=k.split("-");return`<div class="analysis-row"><span>${currentNames()[a]} → ${currentNames()[b]}</span><strong>${ms} ms</strong></div>`}).join("")||"No data yet";
}
function updateChallenges(){
 let total=S.hits+S.misses,acc=total?S.hits/total:1;
 if(total>=100&&acc>=.95)S.challenge.accuracy100=Math.max(S.challenge.accuracy100,Math.min(100,total));
 S.challenge.combo50=Math.max(S.challenge.combo50,Math.min(50,S.longestCombo));
 S.challenge.apm300=Math.max(S.challenge.apm300,Math.min(300,S.peakApm));
 let defs=[
  ["Precision 100",S.challenge.accuracy100,100,"Complete 100+ rounds at 95% accuracy"],
  ["Combo 50",S.challenge.combo50,50,"Reach a 50-round clean combo"],
  ["APM 300",S.challenge.apm300,300,"Reach 300 live APM"],
  ["Dual 100",S.challenge.dual100,100,"Complete 100 simultaneous-stick prompts"]
 ];
 $("challengeList").innerHTML=defs.map(([name,val,max,desc])=>{
  let pct=Math.min(100,val/max*100);
  return`<div class="challenge ${pct>=100?"done":""}"><div class="challenge-top"><strong>${name}</strong><span>${Math.round(val)}/${max}</span></div><small>${desc}</small><div class="progress"><div style="width:${pct}%"></div></div></div>`;
 }).join("");
 persist();
}
function updateCoach(){
 let weak=weakestButton(),avgT=Math.round(average(S.transitionTimes)),total=S.hits+S.misses,acc=total?Math.round(S.hits/total*100):100;
 let msg=[];
 if(weak!=="—")msg.push(`Your weakest current input is ${weak}.`);
 if(avgT)msg.push(`Your average measured transition is ${avgT} ms.`);
 if(acc<90)msg.push("Accuracy is limiting your APM; lower pressure slightly and rebuild clean chains.");
 else if(acc>=97&&S.peakApm>250)msg.push("You are handling the current pressure well; adaptive timer can safely tighten the window.");
 else msg.push("Keep balancing speed with clean execution rather than chasing raw button spam.");
 if(S.hesitations>8)msg.push("Several long gaps appeared between inputs, so rhythm and confidence are the next focus.");
 $("coachText").textContent=msg.join(" ");
}
function updateUI(now=performance.now()){
 let total=S.hits+S.misses,acc=total?Math.round(S.hits/total*100):100,apm=liveApm(now);
 S.peakApm=Math.max(S.peakApm,apm);
 $("liveApm").textContent=apm;$("peakApm").textContent=S.peakApm;$("accuracy").textContent=acc+"%";
 $("currentCombo").textContent=S.currentCombo;$("longestCombo").textContent=S.longestCombo;
 $("avgTransition").textContent=S.transitionTimes.length?Math.round(average(S.transitionTimes))+" ms":"—";
 $("sessionInputs").textContent=S.sessionInputs;$("sessionSequences").textContent=S.sessionSequences;
 $("bestSequence").textContent=S.bestSequence?S.bestSequence+" ms":"—";$("hesitations").textContent=S.hesitations;
 $("recoveryTime").textContent=S.recoveryTimes.length?Math.round(average(S.recoveryTimes))+" ms":"—";
 $("pressureLabel").textContent=pressureName(S.roundLimit||baseLimit());$("timeLabel").textContent=pressureName(baseLimit());
 updateAnalysis();updateChallenges();
}
function startSession(){
 S.running=true;S.paused=false;S.hits=0;S.misses=0;S.sessionInputs=0;S.sessionSequences=0;
 S.sessionStart=performance.now();S.currentCombo=0;S.peakApm=0;S.inputTimes=[];S.transitionTimes=[];
 S.hesitations=0;S.recoveryTimes=[];S.lastMissAt=null;S.successWindow=[];S.lastInputAt=null;
 S.infiniteSession=isInfiniteEligibleMode()&&$("infiniteStickSession").checked;
 S.sessionEnd=S.infiniteSession?Infinity:S.sessionStart+sessionLengthMs();
 if(S.challengeMode){
  beginChallengeMode();
  S.challengeSwitchPending=false;
  S.challengeSwitchAt=null;
  updateUI();
  return;
 }
 newRound();updateUI();
}
function pauseSession(){
 if(!S.running)return;
 const now=performance.now();
 S.paused=!S.paused;
 if(S.paused){
  S.pauseStartedAt=now;
 }else{
  const pausedFor=Math.max(0,now-S.pauseStartedAt);
  S.start=now;
  S.deadline=S.deadline===Infinity?Infinity:S.deadline+pausedFor;
  S.trackingEnd=S.trackingEnd===Infinity?Infinity:S.trackingEnd+pausedFor;
  S.sessionEnd=S.sessionEnd===Infinity?Infinity:S.sessionEnd+pausedFor;
 }
 render();
}
function finalizeChallengeResults(){
 if(!S.challengeMode||S.challengeSessionFinalized)return;
 S.challengeSessionFinalized=true;
 resetChallengeSnapState();
 S.challengeSwitchPending=false;
 S.challengeSwitchAt=null;
 S.challengeTransitioning=false;
 S.challengeTransitionStartedAt=0;
 S.challengeFallbackAt=0;
 clearActiveDrillState({resetController:false,resetPromptUi:true});
 S.lifeSessions++;persist();render();updateCoach();showReport();
}

function stopSession(){
 if(!S.running)return;
 clearTrails();S.running=false;S.paused=false;
 if(S.challengeMode){finalizeChallengeResults();return}
 S.lifeSessions++;persist();render();updateCoach();showReport();
}
function showReport(){
 let total=S.hits+S.misses,acc=total?Math.round(S.hits/total*100):100;
 let duration=Math.max(1,(performance.now()-S.sessionStart)/60000),avgApm=Math.round(S.sessionInputs/duration);
 $("reportApm").textContent=avgApm;$("reportPeak").textContent=S.peakApm;$("reportAccuracy").textContent=acc+"%";
 $("reportTransition").textContent=S.transitionTimes.length?Math.round(average(S.transitionTimes))+" ms":"—";
 $("reportCombo").textContent=S.longestCombo;$("reportWeakest").textContent=weakestButton();
 $("reportRecommendation").textContent=$("coachText").textContent;
 if(S.challengeMode){
  const typeMeta=challengeTypeMeta();
  $("summaryTitle").textContent=`${typeMeta.label} Complete`;
  $("retrySessionBtn").textContent=`Restart ${typeMeta.label}`;
  $("closeSummaryBtn").textContent="Return to Menu";
  updateChallengeSummary();
 }else{
  $("summaryTitle").textContent="Session Complete";
  $("retrySessionBtn").textContent="Retry";
  $("closeSummaryBtn").textContent="Close";
  $("challengeSummary").classList.add("hidden");
 }
 $("summaryModal").classList.remove("hidden");
}
function frame(now){
 if(S.challengeMode&&S.challengeTransitioning&&S.challengeTransitionStartedAt&&now>=S.challengeTransitionStartedAt+400){
  S.challengeTransitioning=false;
  S.challengeTransitionStartedAt=0;
  S.challengeSwitchPending=false;
  S.challengeSwitchAt=null;
  advanceChallengeMode();
  requestAnimationFrame(frame);
  return;
 }
 if(S.challengeMode&&S.challengeTransitioning){
  updateUI(now);
  requestAnimationFrame(frame);
  return;
 }
 updateContinuousTargets(now);
 if(S.challengeMode&&S.challengeSwitchAt!==null&&now>=S.challengeSwitchAt){
  S.challengeSwitchPending=true;
  S.challengeSwitchAt=null;
 }
 if(S.challengeMode&&now>=S.challengeFallbackAt){
  S.challengeSwitchPending=true;
 }
 if(S.challengeMode&&S.challengeSwitchPending&&challengeDurationForCurrentMode()==null){
  advanceChallengeMode();
  requestAnimationFrame(frame);
  return;
 }
 let gp=getActiveGamepad();
 if(gp){
  if(!S.controllerConnected||S.controllerIndex!==gp.index){
   S.controllerIndex=gp.index;
   S.controllerConnected=true;
   S.controllerLabel=gp.id||"";
   resetControllerState();
  }
  updateControllerStatus(true,S.controllerLabel||gp.id||"Controller connected");
  for(const b of BUTTONS){
   let p=!!gp.buttons[b]?.pressed,w=S.prev.get(b)||false;
   if(p&&!w)handlePress(b);if(!p)S.pair.delete(b);S.prev.set(b,p);
  }
  updateSimultaneousButtonReleaseState(gp);
  checkSticks(gp,now);
 }else{
  if(S.controllerConnected||S.controllerIndex!==null){
   S.controllerIndex=null;
   S.controllerConnected=false;
   S.controllerLabel="";
   resetControllerState();
  }
  updateControllerStatus(false);
 }
 if(S.running&&!S.paused){
  if(now>=S.sessionEnd){
   stopSession();
   requestAnimationFrame(frame);
   return;
  }
  let rem=Math.max(0,S.deadline-now),ratio=S.deadline===Infinity?1:rem/Math.max(1,S.roundLimit);
  if(isStickHeavyMode()){
   const total=S.sessionEnd===Infinity?1:Math.max(1,S.sessionEnd-S.sessionStart);
   const sessionRemaining=S.sessionEnd===Infinity?1:Math.max(0,S.sessionEnd-now);
   $("timerFill").style.width=S.sessionEnd===Infinity?"100%":(sessionRemaining/total*100)+"%";
  }else{
   $("timerFill").style.width=(ratio*100)+"%";
  }
  if(isContinuousTrackingMode()){
   $("trackingRoundFill").style.width=S.infiniteSession?"100%":((1-ratio)*100)+"%";
   $("trackingTimeRemaining").textContent=S.infiniteSession?"∞":(rem/1000).toFixed(1)+"s";
  }else{
   $("trackingRoundFill").style.width="0%";
   $("trackingTimeRemaining").textContent=S.infiniteSession?"∞":"—";
  }
  if(rem<=0&&!isContinuousTrackingMode()&&S.mode!=="dualsticks"){
   const silentStick=["sticks","dualsticks","strafeaim"].includes(S.mode);
   failRound({silent:silentStick});
  }
  if(S.challengeMode&&S.challengeSwitchPending&&isContinuousTrackingMode()&&rem<=0){
   advanceChallengeMode();
   requestAnimationFrame(frame);
   return;
  }
  let sec=Math.floor((now-S.sessionStart)/1000);
  $("sessionDuration").textContent=String(Math.floor(sec/60)).padStart(2,"0")+":"+String(sec%60).padStart(2,"0");
 }else{
  $("timerFill").style.width="100%";
  $("trackingRoundFill").style.width="0%";
  $("trackingTimeRemaining").textContent="—";
 }
 updateUI(now);requestAnimationFrame(frame);
}

window.addEventListener("gamepadconnected",handleGamepadConnected);
window.addEventListener("gamepaddisconnected",handleGamepadDisconnected);

document.querySelectorAll(".nav").forEach(b=>b.onclick=()=>{
 const leavingStandaloneSimultaneous=!S.challengeMode&&S.mode==="simultaneous"&&!(b.dataset.mode==="simultaneous");
 if(leavingStandaloneSimultaneous)clearSimultaneousButtonsRuntimeState();
 document.querySelectorAll(".nav").forEach(x=>x.classList.remove("active"));
 if(b.dataset.challengeType){
  S.challengeMode=true;
  S.mode="challenge";
  S.challengeType=challengeTypeKey(b.dataset.challengeType);
  clearActiveDrillState({resetController:true,resetPromptUi:true});
  updateContextualSettings();
  applyTrainingLayout();
  updateModeSelectionUI();
  saveV8Settings();
  beginChallengeMode();
  return;
 }
 if(b.dataset.mode==="challenge"){
  S.challengeMode=true;
  S.mode="challenge";
  clearActiveDrillState({resetController:true,resetPromptUi:true});
  updateContextualSettings();
  applyTrainingLayout();
  saveV8Settings();
  if(!S.running){beginChallengeMode();}else{render();}
  return;
 }
 S.challengeMode=false;
 S.challengeSwitchPending=false;
 S.challengeSwitchAt=null;
 resetChallengeSnapState();
 S.challengeCurrentMode=null;
 S.challengeScenarioPreset=null;
 S.mode=b.dataset.mode;
 clearActiveDrillState({resetController:true,resetPromptUi:true});
 updateContextualSettings();
 applyTrainingLayout();
 saveV8Settings();
 if(S.running)newRound();else render();
 updateModeSelectionUI();
});
$("startBtn").onclick=startSession;$("pauseBtn").onclick=pauseSession;$("stopBtn").onclick=stopSession;
$("fullscreenBtn").onclick=()=>document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen();
$("closeSummaryBtn").onclick=()=>{$("summaryModal").classList.add("hidden");};
$("retrySessionBtn").onclick=()=>{
 $("summaryModal").classList.add("hidden");
 if(S.challengeMode){
  startSession();
 }else{
  startSession();
 }
};
$("resetStatsBtn").onclick=()=>{localStorage.removeItem("ctv5");location.reload()};
$("timeSlider").oninput=()=>{updateUI();if(S.running){S.roundLimit=effectiveLimit();S.start=performance.now();S.deadline=S.start+S.roundLimit}};
$("trainingDifficulty").oninput=()=>applyDifficulty($("trainingDifficulty").value,true);
$("stickDeadzone").oninput=()=>{
 $("stickDeadzoneValue").textContent=$("stickDeadzone").value;
 S.holdStart=null;
};
$("stickResponseCurve").onchange=()=>{S.holdStart=null};

function applyApexDefaults(){
 $("timeSlider").value=2200;
 $("angleSteps").value="16";
 $("distanceMode").value="mixed";
 $("strafeIntensity").value="0.45";
 $("aimTargetStyle").value="mixed";
 $("trackingSpeed").value="0.75";
 $("trackingPattern").value="wander";
 $("reactiveIntensity").value="standard";
 $("gameScenarioType").value="mixed";
 $("leftMovementAmount").value="0.32";
 $("leftStickLeniency").value="0.22";
 $("trackingTargetSize").value="0.14";
 $("trackingDuration").value="15";
 $("sessionDurationMinutes").value="60";
 $("angleTolerance").value=18;
 $("distanceTolerance").value=18;
 $("holdDuration").value=100;
 $("adaptiveTimerToggle").checked=true;
 $("soundToggle").checked=false;
 $("angleToleranceValue").textContent="18";
 $("distanceToleranceValue").textContent="18";
 $("holdDurationValue").textContent="100";
 updateUI();
 if(S.running)newRound();
}
$("applyApexDefaultsBtn").onclick=()=>{};
$("challengeDuration").oninput=()=>{updateChallengeDurationLabel();};
$("challengeRandomModesToggle").onchange=()=>{if(S.running&&S.challengeMode)beginChallengeMode();};
$("challengeRandomScenariosToggle").onchange=()=>{if(S.running&&S.challengeMode)newRound();};
$("challengeNoRepeatsToggle").onchange=()=>{if(S.running&&S.challengeMode)beginChallengeMode();};
$("sessionDurationMinutes").onchange=()=>{
 if(S.running&&!S.infiniteSession)S.sessionEnd=S.sessionStart+sessionLengthMs();
};
$("infiniteStickSession").onchange=()=>{
 if(S.running){
  S.infiniteSession=isInfiniteEligibleMode()&&$("infiniteStickSession").checked;
  S.sessionEnd=S.infiniteSession?Infinity:S.sessionStart+sessionLengthMs();
  newRound();
 }
};
$("layoutSelect").onchange=()=>setLayout($("layoutSelect").value);
$("trainingLayoutSelect").onchange=()=>{applyTrainingLayout();render()};
bindColorPicker("leftStickColor","leftStickColorText","left");
bindColorPicker("rightStickColor","rightStickColorText","right");
$("resetStickColorsBtn").onclick=()=>applyStickColors(DEFAULT_LEFT_STICK_COLOR,DEFAULT_RIGHT_STICK_COLOR);
$("stickOffsetSlider").oninput=()=>{
 $("stickOffsetValue").textContent=$("stickOffsetSlider").value;
 if(S.running&&isStickHeavyMode())renderStickPrompt();
};
$("stickTrailsToggle").onchange=()=>{if(!$("stickTrailsToggle").checked)clearTrails()};
$("hideOnTargetToggle").onchange=()=>{ $("hideOnTargetToggle").checked=false; updateArenaClarity(S.leftOnTarget,S.rightOnTarget); };
$("dynamicFocusToggle").onchange=()=>updateArenaClarity(S.leftOnTarget,S.rightOnTarget);
$("sequenceLength").onchange=()=>{if(S.running)newRound()};
$("angleSteps").onchange=()=>{if(S.running&&["sticks","dualsticks"].includes(S.mode))newRound()};
$("distanceMode").onchange=()=>{if(S.running&&["sticks","dualsticks","strafeaim"].includes(S.mode))newRound()};
$("strafeIntensity").onchange=()=>{if(S.running&&S.mode==="strafeaim")newRound()};
$("aimTargetStyle").onchange=()=>{if(S.running&&S.mode==="strafeaim")newRound()};
$("trackingSpeed").onchange=()=>{if(S.running&&["dualtrack","reactivetrack","gamescenario"].includes(S.mode))newRound()};
$("trackingPattern").onchange=()=>{if(S.running&&S.mode==="dualtrack")newRound()};
$("trackingTargetSize").onchange=()=>{if(S.running&&["dualtrack","reactivetrack","gamescenario"].includes(S.mode))newRound()};
$("trackingDuration").onchange=()=>{if(S.running&&["dualtrack","reactivetrack","gamescenario"].includes(S.mode))newRound()};
$("reactiveIntensity").onchange=()=>{if(S.running&&S.mode==="reactivetrack")newRound()};
$("gameScenarioType").onchange=()=>{updateCombatPracticeDescription();if(S.running&&S.mode==="gamescenario")newRound()};
$("leftMovementAmount").onchange=()=>{if(S.running&&S.mode==="gamescenario")newRound()};
$("leftStickLeniency").onchange=()=>{if(S.running&&S.mode==="gamescenario")newRound()};
$("angleTolerance").oninput=()=>$("angleToleranceValue").textContent=$("angleTolerance").value;
$("distanceTolerance").oninput=()=>$("distanceToleranceValue").textContent=$("distanceTolerance").value;
$("holdDuration").oninput=()=>$("holdDurationValue").textContent=$("holdDuration").value;

$("stickTrailsToggle").checked=false;
$("dynamicFocusToggle").checked=false;
$("hideOnTargetToggle").checked=false;
$("stickOffsetSlider").value="0";
$("stickOffsetValue").textContent="0";
loadStickColors();
setCombatScenarioOptions();
const startupUsesChallenge=loadV8Settings();
bindV8Settings();
updateCombatPracticeDescription();
updateChallengeDurationLabel();
setLayout($("layoutSelect").value||"xbox");
applyDifficulty(+$("trainingDifficulty").value||3,false);
updateContextualSettings();
applyTrainingLayout();
updateModeSelectionUI();
if(startupUsesChallenge && !S.running){beginChallengeMode();}
updateUI();
render();
requestAnimationFrame(frame);

window.addEventListener("beforeunload",saveV8Settings);
