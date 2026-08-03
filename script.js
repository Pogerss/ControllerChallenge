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
const DEBUG=new URLSearchParams(location.search).get("debug")==="1";

let saved=JSON.parse(localStorage.getItem("ctv5")||"{}");
const S={
 layout:"xbox",mode:"sequence",preset:"balanced",running:false,paused:false,
 seq:[],full:[],start:0,deadline:0,roundLimit:2500,prev:new Map(),pair:new Set(),
 hits:0,misses:0,sessionInputs:0,sessionSequences:0,sessionStart:0,
 sessionScore:0,
 currentCombo:0,longestCombo:saved.longestCombo||0,bestSequence:saved.bestSequence||0,
 sessionEnd:Infinity,infiniteSession:false,pauseStartedAt:0,
 peakApm:0,inputTimes:[],transitionTimes:[],buttonStats:saved.buttonStats||{},
 transitionStats:saved.transitionStats||{},lastInputAt:null,lastButton:null,
 hesitations:0,recoveryTimes:[],lastMissAt:null,stickTargets:[],holdStart:null,
 dualStickHoldLocked:false,dualStickCompletionLocked:false,dualStickNextPairAt:0,
 dualStickWaitingForRelease:false,dualStickPendingReleaseTargets:[],successWindow:[],lifeSessions:saved.lifeSessions||0,lifeInputs:saved.lifeInputs||0,
 trackingStart:0,trackingEnd:0,trackingOnTargetMs:0,trackingLastFrame:0,
 sessionTrackingOnTargetMs:0,sessionTrackingElapsedMs:0,
 trackingPhaseLeft:0,trackingPhaseRight:Math.PI,trackingWanderLeft:{x:0,y:0,vx:.2,vy:.15},
 trackingWanderRight:{x:0,y:0,vx:-.15,vy:.2},
 reactiveLeft:{x:0,y:0,vx:0,vy:0,nextChange:0,nextJump:0,pauseUntil:0},
 reactiveRight:{x:0,y:0,vx:0,vy:0,nextChange:0,nextJump:0,pauseUntil:0},
 scenarioLeft:{x:0,y:0,vx:0,vy:0,targetVx:0,targetVy:0,speed:0,targetX:0,targetY:0,nextChange:0},
 scenarioRight:{x:0,y:0,vx:0,vy:0,targetVx:0,targetVy:0,speed:0,targetX:0,targetY:0,nextChange:0,nextJump:0},
 currentCombatMechanicId:null,combatMechanicHistory:[],
 currentMovementPatternId:null,combatMovementPatternDirection:1,combatDrillHistory:[],
 combatActivationCounts:{},combatRoleSwap:false,scenarioMotionStartedAt:0,
 mechanicTrace:null,
 scenarioName:"",weaponStyle:"",conceptName:"",scenarioLeftOnMs:0,scenarioRightOnMs:0,
 challenge:saved.challenge||{accuracy100:0,combo50:0,apm300:0,dual100:0},
 leftTrailPoints:[],rightTrailPoints:[],leftOnTarget:false,rightOnTarget:false,
 strafeAimLeft:{x:0,targetX:0,nextChange:0},
 strafeAimRight:{phase:0},
 continuousModeLastFrame:0,
 trackingWasOnTarget:false,
 trackingHitSoundAt:0,
 trackingScoreRemainderMs:0,
 scoreFinalized:false,
 controllerIndex:null,
 controllerConnected:false,
 controllerLabel:"",
 challengeMode:false,
 challengeQueue:[],
 challengeCurrentMode:null,
 challengeCompletedModes:[],
 challengeModeStats:{},
 analysisRenderKey:"",
 challengeRenderKey:"",
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
 challengePendingSnapFamily:null,
 challengePreviousFocusFamily:null,
 challengeCurrentFocusFamily:null,
 challengeFirstScenarioSnapPending:true,
 challengeSnapFrame:0,
 challengeSessionFinalized:false,
 resultsActionLocked:false,
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
 return ["strafeaim","dualtrack","reactivetrack"].includes(S.mode)||(S.mode==="gamescenario"&&isContinuousCombatMechanic());
}

function applyTrainingLayout(){
 const choice=$("trainingLayoutSelect")?.value||"auto";
 const stickFocused=choice==="sticks"||(choice==="auto"&&isStickHeavyMode());
 const trackingFocused=stickFocused&&isContinuousTrackingMode();
 const arenaHudMode=["strafeaim","dualtrack","reactivetrack","gamescenario"].includes(S.mode);
 const trainer=$("trainerPanel");
 trainer.classList.toggle("challenge-active",S.challengeMode);
 trainer.classList.toggle("stick-focused",stickFocused);
 trainer.classList.toggle("button-focused",!stickFocused);
 trainer.classList.toggle("tracking-focused",trackingFocused);
 trainer.classList.toggle("arena-hud-mode",arenaHudMode);
 trainer.classList.toggle("mechanic-challenge",S.challengeMode&&S.challengeType==="mechanic");
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

function defaultSequenceLengthForDifficulty(level){
 return ({1:1,2:2,3:3,4:4,5:4})[level]||3;
}

function applyDifficulty(level,updateControls=true){
 level=Math.max(1,Math.min(5,+level||3));
 $("trainingDifficulty").value=String(level);
 $("trainingDifficultyValue").textContent=String(level);
 $("trainingDifficultyName").textContent=difficultyName(level);

 if(!updateControls)return;

 const profiles={
  1:{pressure:3800,speed:"0.45",size:"0.20",angle:25,distance:25,hold:150,sequenceLength:1},
  2:{pressure:3000,speed:"0.45",size:"0.20",angle:22,distance:22,hold:125,sequenceLength:2},
  3:{pressure:2200,speed:"0.75",size:"0.14",angle:18,distance:18,hold:100,sequenceLength:3},
  4:{pressure:1650,speed:"1.10",size:"0.09",angle:14,distance:14,hold:75,sequenceLength:4},
  5:{pressure:1400,speed:"1.45",size:"0.09",angle:10,distance:10,hold:50,sequenceLength:4}
 };
 const profile=profiles[level];
 $("timeSlider").value=profile.pressure;
 $("sequenceLength").value=String(profile.sequenceLength||defaultSequenceLengthForDifficulty(level));
 $("trackingSpeed").value=profile.speed;
 $("trackingTargetSize").value=profile.size;
 $("angleTolerance").value=profile.angle;
 $("distanceTolerance").value=profile.distance;
 $("holdDuration").value=profile.hold;
 $("angleToleranceValue").textContent=profile.angle;
 $("distanceToleranceValue").textContent=profile.distance;
 $("holdDurationValue").textContent=profile.hold;
 updateUI();
 saveV8Settings();

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

const SCORE_DIFFICULTY_MULTIPLIER={1:1,2:1.1,3:1.2,4:1.35,5:1.5};
const TRACKING_SCORE_INTERVAL_MS=400;
const COMBAT_TRACKING_TOLERANCE_SCALE=.88;
const COMBAT_DIFFICULTY_PROFILES={
 1:{motionSpeed:.52,pathRange:.72,outerPressureChance:.08,directionChangeRate:.68,trackingTolerance:1.35,independenceAmount:.5},
 2:{motionSpeed:.65,pathRange:.84,outerPressureChance:.2,directionChangeRate:.8,trackingTolerance:1.2,independenceAmount:.68},
 3:{motionSpeed:.76,pathRange:.94,outerPressureChance:.35,directionChangeRate:.9,trackingTolerance:1.05,independenceAmount:.82},
 4:{motionSpeed:1,pathRange:1.18,outerPressureChance:.7,directionChangeRate:1.14,trackingTolerance:.86,independenceAmount:1.25},
 5:{motionSpeed:1.18,pathRange:1.32,outerPressureChance:.9,directionChangeRate:1.32,trackingTolerance:.72,independenceAmount:1.5}
};
const COMBAT_DIFFICULTY_FIELDS_BY_FAMILY={
 hold:["motionSpeed","pathRange","outerPressureChance","trackingTolerance"],
 precision:["motionSpeed","trackingTolerance"],
 counter:["motionSpeed","pathRange","outerPressureChance","directionChangeRate","trackingTolerance","independenceAmount"],
 follow:["motionSpeed","pathRange","outerPressureChance","directionChangeRate","trackingTolerance"],
 pressure:["motionSpeed","pathRange","outerPressureChance","directionChangeRate","trackingTolerance","independenceAmount"],
 stability:["motionSpeed","pathRange","outerPressureChance","directionChangeRate","trackingTolerance","independenceAmount"],
 timing:["motionSpeed","pathRange","directionChangeRate","trackingTolerance","independenceAmount"],
 control:["motionSpeed","pathRange","directionChangeRate","trackingTolerance"],
 separation:["motionSpeed","pathRange","outerPressureChance","directionChangeRate","trackingTolerance","independenceAmount"],
 recovery:["motionSpeed","pathRange","directionChangeRate","trackingTolerance"],
 release:["motionSpeed","pathRange","outerPressureChance","directionChangeRate","trackingTolerance"],
 ladder:["motionSpeed","pathRange","outerPressureChance","directionChangeRate","trackingTolerance"],
 curve:["motionSpeed","pathRange","directionChangeRate","trackingTolerance"],
 angle:["motionSpeed","pathRange","trackingTolerance"],
 priority:["motionSpeed","pathRange","directionChangeRate","trackingTolerance","independenceAmount"],
 Strafe:["motionSpeed","pathRange","outerPressureChance","directionChangeRate","trackingTolerance","independenceAmount"]
};

function clampNumber(value,min,max){
 return Math.max(min,Math.min(max,value));
}

function combatDifficultyLevel(){
 return Math.max(1,Math.min(5,+$("trainingDifficulty")?.value||3));
}

function combatDifficultyProfile(){
 return COMBAT_DIFFICULTY_PROFILES[combatDifficultyLevel()]||COMBAT_DIFFICULTY_PROFILES[3];
}

function combatDifficultyUses(mechanic,field){
 return COMBAT_DIFFICULTY_FIELDS_BY_FAMILY[mechanic.family]?.includes(field)===true;
}

function formatWholeNumber(value){
 return Math.round(value).toLocaleString("en-US");
}

function sessionDifficultyMultiplier(){
 const level=Math.max(1,Math.min(5,+$("trainingDifficulty")?.value||3));
 return SCORE_DIFFICULTY_MULTIPLIER[level]||1.2;
}

function scoreTimeWindow(){
 if(S.deadline===Infinity)return Math.max(900,baseLimit());
 return Math.max(900,S.roundLimit||baseLimit());
}

function currentTrackingQuality(){
 const elapsed=Math.max(1,performance.now()-S.trackingStart);
 if(S.mode==="gamescenario"||S.mode==="strafeaim"){
  const movementRatio=S.scenarioLeftOnMs/elapsed;
  const aimRatio=S.scenarioRightOnMs/elapsed;
  return clampNumber(movementRatio*.3+aimRatio*.7,.65,1.1);
 }
 return clampNumber(S.trackingOnTargetMs/elapsed,.65,1.08);
}

function updateScoreDisplay(){
 const live=$("liveScore");
 const report=$("reportScore");
 if(live)live.textContent=formatWholeNumber(S.sessionScore);
 if(report)report.textContent=formatWholeNumber(S.sessionScore);
}

function resetSessionScore(){
 S.sessionScore=0;
 S.trackingScoreRemainderMs=0;
 S.scoreFinalized=false;
 updateScoreDisplay();
}

function finalizeSessionScore(){
 if(S.scoreFinalized)return;
 S.scoreFinalized=true;
}

function addScoreEvent(basePoints,quality=1,options={}){
 if(!S.running||S.paused||S.scoreFinalized||basePoints<=0)return 0;
 const scaledQuality=clampNumber(quality,.7,1.15);
 let speedBonus=0;
 if(Number.isFinite(options.elapsedMs)&&Number.isFinite(options.windowMs)&&options.windowMs>0){
  const pace=clampNumber(1-options.elapsedMs/options.windowMs,0,1);
  speedBonus=pace*.2;
 }
 const streakBonus=Math.min(.1,Math.max(0,S.currentCombo-1)*.02);
 const total=basePoints*sessionDifficultyMultiplier()*scaledQuality*(1+speedBonus+streakBonus);
 const points=Math.max(0,Math.round(total));
 if(!points)return 0;
 S.sessionScore+=points;
 updateScoreDisplay();
 return points;
}

function awardTrackingScore(validOnTargetMs){
 if(validOnTargetMs<=0)return;
 S.trackingScoreRemainderMs+=validOnTargetMs;
 const basePoints=S.mode==="gamescenario"?7:S.mode==="strafeaim"?6:6;
 while(S.trackingScoreRemainderMs>=TRACKING_SCORE_INTERVAL_MS){
  S.trackingScoreRemainderMs-=TRACKING_SCORE_INTERVAL_MS;
  addScoreEvent(basePoints,currentTrackingQuality());
 }
}

function awardButtonInputScore(elapsedMs){
 addScoreEvent(8,1,{elapsedMs,windowMs:scoreTimeWindow()});
}

function awardCompletionScore(mode,elapsedMs){
 const sequenceSize=Math.max(1,S.full.length||S.seq.length||1);
 const windowMs=scoreTimeWindow();
 if(mode==="simultaneous"){
  addScoreEvent(44,1,{elapsedMs,windowMs});
  return;
 }
 if(["sequence","transition","apex","endurance"].includes(mode)){
  addScoreEvent(22+sequenceSize*8,1,{elapsedMs,windowMs});
  return;
 }
 if(mode==="sticks"){
  addScoreEvent(32,1,{elapsedMs,windowMs});
  return;
 }
 if(mode==="dualsticks"){
  addScoreEvent(52,1,{elapsedMs,windowMs});
  return;
 }
 if(mode==="strafeaim"){
  addScoreEvent(40,currentTrackingQuality(),{elapsedMs,windowMs});
 }
}

function formatOnTargetReport(){
 if(!S.sessionTrackingElapsedMs)return "—";
 const seconds=(S.sessionTrackingOnTargetMs/1000).toFixed(1);
 const percent=Math.round(S.sessionTrackingOnTargetMs/Math.max(1,S.sessionTrackingElapsedMs)*100);
 return `${seconds}s · ${percent}%`;
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
 challenge:"Drill settings",
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
 full:{label:"Full Drill",summary:["Mixed buttons, sticks, tracking, and combat concepts.","Auto-rotates through the full pool."],categories:["button","stick","combat"]},
 combat:{label:"Combat Drill",summary:["Random movement patterns paired with existing Combat mechanics.","Each timed scenario trains one movement and aim combination."],categories:["combat"]},
 combatflow:{label:"Combat Flow Drill",summary:["Ten authored movement-and-aim fight scenarios.","Each flows through establish, pressure, and recovery phases."],categories:["combat"]},
 mechanic:{label:"Mechanic Drill",summary:["Every enabled continuous Combat mechanic.","Time-based tracking with no contact completion."],categories:["combat"]},
 strafe:{label:"Strafe Drill",summary:["Transferable FPS movement situations using the shared Combat trainer.","Continuous, time-scored strafing with no contact completion."],categories:["combat"]},
 stick:{label:"Stick Drill",summary:["Stick placement, tension, tracking, and coordinated movement.","Pairs single-stick and dual-stick work."],categories:["stick"]},
 button:{label:"Button Drill",summary:["Sequences, simultaneous inputs, timing, and release control.","Focuses on button-only execution."],categories:["button"]}
};

function challengeTypeKey(type=S.challengeType){
 return CHALLENGE_TYPE_DEFS[type]?type:"full";
}

function challengeTypeMeta(type=S.challengeType){
 return CHALLENGE_TYPE_DEFS[challengeTypeKey(type)];
}

function challengeEntriesForType(type=S.challengeType){
 const typeKey=challengeTypeKey(type);
 if(typeKey==="combatflow")return COMBAT_FLOW_SCENARIOS.map(entry=>entry.id);
 if(typeKey==="strafe"){
  return STRAFE_COMBAT_SCENARIOS
   .filter(entry=>getCombatMechanicById(entry.mechanics[0]).family==="Strafe")
   .map(entry=>entry.id);
 }
 if(typeKey==="mechanic"){
  return COMBAT_SCENARIOS
   .filter(entry=>getCombatMechanicById(entry.mechanics?.[0]||entry.id).behavior==="continuous")
   .map(entry=>entry.id);
 }
 const meta=challengeTypeMeta(type);
 return CHALLENGE_MODE_POOL.filter(entry=>meta.categories.includes(challengeEntryCategory(entry)));
}

function challengeStageFocusFallback(){
 return document.querySelector("#trainerPanel .controller-and-stick");
}

function challengeFocusTargetForFamily(family){
 if(family==="buttons")return document.querySelector("#trainerPanel .controller-and-stick")||challengeStageFocusFallback();
 if(family==="sticks")return document.querySelector("#trainerPanel .controller-and-stick")||challengeStageFocusFallback();
 if(family==="tracking"||family==="combat")return $("stickTargets")||challengeStageFocusFallback();
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
 cancelPendingChallengeFocusSnap();
 S.challengePreviousFocusFamily=null;
 S.challengeCurrentFocusFamily=null;
 S.challengeFirstScenarioSnapPending=true;
}

function challengeRenderedFocusRect(target){
 if(target?.id!=="stickTargets")return target?.getBoundingClientRect()||null;
 const gameplayContainer=target.querySelector(".shared-arena-shell");
 return gameplayContainer?.getBoundingClientRect()||target.getBoundingClientRect();
}

function cancelPendingChallengeFocusSnap(){
 if(S.challengeSnapFrame){
  cancelAnimationFrame(S.challengeSnapFrame);
  S.challengeSnapFrame=0;
 }
 S.challengeFocusSnapToken++;
 S.challengePendingSnapFamily=null;
}

function focusChallengeScenario(target,snapToken){
 if(!target||snapToken!==S.challengeFocusSnapToken)return;
 if(!S.challengeMode||!S.running||S.challengeSessionFinalized)return;
 if(!$('summaryModal')?.classList.contains('hidden'))return;
 const rect=challengeRenderedFocusRect(target);
 const viewportHeight=window.innerHeight||document.documentElement.clientHeight||0;
 if(!rect||!viewportHeight||rect.height<=0)return;
 const renderedCenter=window.scrollY+rect.top+rect.height/2;
 const nextTop=Math.max(0,renderedCenter-viewportHeight/2);
 const reducedMotion=window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
 window.scrollTo({top:nextTop,left:window.scrollX,behavior:reducedMotion?"auto":"smooth"});
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
 if(S.challengePendingSnapFamily===nextFamily&&S.challengeSnapFrame)return;
 cancelPendingChallengeFocusSnap();
 S.challengePendingSnapFamily=nextFamily;
 const snapToken=S.challengeFocusSnapToken;
 S.challengeSnapFrame=requestAnimationFrame(()=>{
  S.challengeSnapFrame=requestAnimationFrame(()=>{
   S.challengeSnapFrame=0;
   S.challengePendingSnapFamily=null;
   focusChallengeScenario(target,snapToken);
  });
 });
}

function combatEntryWeight(entry){
 const meta=challengeEntryMeta(entry);
 return getCombatMechanicById(meta.mechanicId).weight||1;
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

const COMBAT_MOVEMENT_PATTERNS=[
 {id:"wideStrafe",label:"Wide Strafe",cycleMs:6200,band:[.66,.86],speed:.88,kind:"switch",transition:.2},
 {id:"tightStrafe",label:"Tight Strafe",cycleMs:2800,band:[.3,.5],speed:.72,kind:"switch",transition:.32},
 {id:"longHold",label:"Long Hold",cycleMs:9200,band:[.62,.8],speed:.68,kind:"switch",transition:.08},
 {id:"delayedSwitch",label:"Delayed Switch",cycleMs:5200,band:[.54,.78],speed:.82,kind:"delayed",transition:.18},
 {id:"burstStrafe",label:"Burst Strafe",cycleMs:3200,band:[.18,.82],speed:.92,kind:"burst"},
 {id:"rhythmBreak",label:"Rhythm Break",cycleMs:6100,band:[.34,.78],speed:.86,kind:"rhythm"},
 {id:"strafeRecovery",label:"Strafe Recovery",cycleMs:4300,band:[.46,.82],speed:.84,kind:"recovery"},
 {id:"pressureCarry",label:"Pressure Carry",cycleMs:6800,band:[.7,.86],speed:.74,kind:"carry",transition:.12},
 {id:"reversePressure",label:"Reverse Pressure",cycleMs:3900,band:[.6,.84],speed:.9,kind:"switch",transition:.12}
];
const COMBAT_MOVEMENT_PATTERN_BY_ID=Object.fromEntries(COMBAT_MOVEMENT_PATTERNS.map(pattern=>[pattern.id,pattern]));

const COMBAT_FLOW_SCENARIOS=[
 {id:"flowWideStrafeHold",label:"Wide Strafe Hold",cue:"Commit and hold",family:"commit",mechanic:"pressureHold",cycleMs:7600},
 {id:"flowDelayedReversal",label:"Delayed Reversal",cue:"Wait, then reverse",family:"timing",mechanic:"independentTiming",cycleMs:8200},
 {id:"flowBurstAndSettle",label:"Burst and Settle",cue:"Burst, then settle",family:"control",mechanic:"settle",cycleMs:5600},
 {id:"flowCounterAim",label:"Counter Aim",cue:"Counter gently",family:"counter",mechanic:"counterPressure",cycleMs:6800},
 {id:"flowPressureRelease",label:"Pressure Release",cue:"Release smoothly",family:"release",mechanic:"pressureRelease",cycleMs:7200},
 {id:"flowEdgeControl",label:"Edge Control",cue:"Control the edge",family:"edge",mechanic:"controlledExit",cycleMs:7000},
 {id:"flowStrafeRecovery",label:"Strafe Recovery",cue:"Recover, don’t chase",family:"recovery",mechanic:"recover",cycleMs:6600},
 {id:"flowStableAimSwitch",label:"Stable Aim Switch",cue:"Keep aim calm",family:"stability",mechanic:"stableAim",cycleMs:6200},
 {id:"flowMovementHoldAimWork",label:"Movement Hold, Aim Work",cue:"Hold movement",family:"separation",mechanic:"pressureUnderAim",cycleMs:7400},
 {id:"flowRhythmBreak",label:"Rhythm Break",cue:"Break the rhythm",family:"rhythm",mechanic:"strafeSwitch",cycleMs:7800}
].map(entry=>({...entry,weaponStyle:"",conceptName:entry.label,description:entry.cue,mode:"gamescenario",profile:entry.mechanic,mechanics:[entry.mechanic]}));
const COMBAT_FLOW_SCENARIO_BY_ID=Object.fromEntries(COMBAT_FLOW_SCENARIOS.map(entry=>[entry.id,entry]));
const COMBAT_FLOW_PHASE_TRACKS={
 flowWideStrafeHold:[
  {at:0,phase:"establish",left:[.2,0],right:[.14,.01]},
  {at:.16,phase:"pressure",left:[.78,0],right:[.22,-.01]},
  {at:.4,phase:"pressure",left:[.8,.01],right:[.24,.01]},
  {at:.52,phase:"recover",left:[.08,0],right:[.14,0]},
  {at:.68,phase:"establish",left:[-.76,0],right:[-.2,-.01]},
  {at:.9,phase:"recover",left:[-.34,0],right:[-.15,0]},
  {at:1,phase:"establish",left:[.2,0],right:[.14,.01]}
 ],
 flowDelayedReversal:[
  {at:0,phase:"establish",left:[.28,0],right:[-.12,.02]},
  {at:.16,phase:"pressure",left:[.72,0],right:[-.16,-.01]},
  {at:.54,phase:"pressure",left:[.74,0],right:[-.11,.02]},
  {at:.66,phase:"recover",left:[-.7,0],right:[-.08,-.01]},
  {at:.86,phase:"recover",left:[-.5,0],right:[.12,0]},
  {at:1,phase:"establish",left:[.28,0],right:[-.12,.02]}
 ],
 flowBurstAndSettle:[
  {at:0,phase:"establish",left:[.18,0],right:[.12,0]},
  {at:.16,phase:"pressure",left:[.82,0],right:[.18,.03]},
  {at:.32,phase:"recover",left:[.2,0],right:[.1,0]},
  {at:.54,phase:"establish",left:[.16,0],right:[-.08,-.02]},
  {at:.7,phase:"pressure",left:[-.76,0],right:[-.16,.02]},
  {at:.84,phase:"recover",left:[-.18,0],right:[-.08,0]},
  {at:1,phase:"establish",left:[.18,0],right:[.12,0]}
 ],
 flowCounterAim:[
  {at:0,phase:"establish",left:[.3,0],right:[-.12,.01]},
  {at:.24,phase:"pressure",left:[.8,.03],right:[-.3,-.02]},
  {at:.5,phase:"recover",left:[.18,0],right:[-.08,0]},
  {at:.72,phase:"pressure",left:[-.78,-.03],right:[.28,.02]},
  {at:.9,phase:"recover",left:[-.22,0],right:[.09,0]},
  {at:1,phase:"establish",left:[.3,0],right:[-.12,.01]}
 ],
 flowPressureRelease:[
  {at:0,phase:"establish",left:[.76,.04],right:[-.44,-.02]},
  {at:.42,phase:"pressure",left:[.62,.02],right:[-.34,.03]},
  {at:.72,phase:"recover",left:[.38,0],right:[-.2,0]},
  {at:.9,phase:"recover",left:[.3,0],right:[-.16,-.01]},
  {at:1,phase:"establish",left:[.76,.04],right:[-.44,-.02]}
 ],
 flowEdgeControl:[
  {at:0,phase:"establish",left:[.58,0],right:[.28,.02]},
  {at:.24,phase:"pressure",left:[.86,.05],right:[.48,-.03]},
  {at:.5,phase:"pressure",left:[.82,-.04],right:[.44,.03]},
  {at:.76,phase:"recover",left:[.48,0],right:[.24,0]},
  {at:1,phase:"establish",left:[.58,0],right:[.28,.02]}
 ],
 flowStrafeRecovery:[
  {at:0,phase:"establish",left:[.58,0],right:[.22,.01]},
  {at:.28,phase:"pressure",left:[-.72,0],right:[.16,.02]},
  {at:.48,phase:"pressure",left:[-.76,0],right:[-.08,-.02]},
  {at:.72,phase:"recover",left:[-.48,0],right:[-.22,0]},
  {at:.88,phase:"recover",left:[-.18,0],right:[-.12,.01]},
  {at:1,phase:"establish",left:[.58,0],right:[.22,.01]}
 ],
 flowStableAimSwitch:[
  {at:0,phase:"establish",left:[.34,0],right:[.13,.01]},
  {at:.22,phase:"pressure",left:[.72,0],right:[.17,-.01]},
  {at:.48,phase:"recover",left:[-.7,0],right:[.12,.01]},
  {at:.72,phase:"pressure",left:[-.72,0],right:[.16,-.01]},
  {at:.9,phase:"recover",left:[-.22,0],right:[.13,0]},
  {at:1,phase:"establish",left:[.34,0],right:[.13,.01]}
 ],
 flowMovementHoldAimWork:[
  {at:0,phase:"establish",left:[.68,0],right:[.08,0]},
  {at:.25,phase:"pressure",left:[.7,.01],right:[.32,.08]},
  {at:.5,phase:"pressure",left:[.68,-.01],right:[-.25,-.06]},
  {at:.75,phase:"recover",left:[.66,0],right:[.14,.02]},
  {at:1,phase:"establish",left:[.68,0],right:[.08,0]}
 ],
 flowRhythmBreak:[
  {at:0,phase:"establish",left:[.28,0],right:[.12,0]},
  {at:.16,phase:"establish",left:[.68,0],right:[.2,.01]},
  {at:.32,phase:"establish",left:[-.68,0],right:[-.19,-.01]},
  {at:.48,phase:"pressure",left:[.7,0],right:[.18,.01]},
  {at:.7,phase:"pressure",left:[.7,0],right:[.14,-.01]},
  {at:.84,phase:"recover",left:[-.62,0],right:[-.16,0]},
  {at:1,phase:"establish",left:[.28,0],right:[.12,0]}
 ]
};

const COMBAT_SCENARIOS=[
 {id:"mirror",label:"Mirror",weaponStyle:"",conceptName:"Mirror",description:"Aim broadly supports movement without copying it exactly.",mode:"gamescenario",profile:"mirror",mechanics:["mirror"]},
 {id:"antiMirror",label:"Anti-Mirror",weaponStyle:"",conceptName:"Anti-Mirror",description:"Aim broadly counters movement while keeping both roles separate.",mode:"gamescenario",profile:"antiMirror",mechanics:["antiMirror"]},
 {id:"counterPressure",label:"Counter Pressure",weaponStyle:"",conceptName:"Counter Pressure",description:"Movement commits one way while aim applies controlled opposing pressure.",mode:"gamescenario",profile:"oppositePush",mechanics:["counterPressure"]},
 {id:"microCorrections",label:"Micro Corrections",weaponStyle:"",conceptName:"Micro Corrections",description:"Maintain readable movement while making tiny aim changes.",mode:"gamescenario",profile:"microCorrections",mechanics:["microCorrections"]},
 {id:"pressureHold",label:"Pressure Hold",weaponStyle:"",conceptName:"Pressure Hold",description:"Hold deliberate off-center pressure with both sticks.",mode:"gamescenario",profile:"pressureHold",mechanics:["pressureHold"]},
 {id:"unequalPressure",label:"Unequal Pressure",weaponStyle:"",conceptName:"Unequal Pressure",description:"Both sticks hold different deliberate pressure levels.",mode:"gamescenario",profile:"sameSidePush",mechanics:["unequalPressure"]},
 {id:"independentHold",label:"Independent Hold",weaponStyle:"",conceptName:"Independent Hold",description:"Keep one path calm while tracking a more active independent path.",mode:"gamescenario",profile:"independentHold",mechanics:["independentHold"]},
 {id:"strafeSwitch",label:"Strafe Switch",weaponStyle:"",conceptName:"Strafe Switch",description:"Track readable movement reversals while keeping aim smooth.",mode:"gamescenario",profile:"strafeSwitch",mechanics:["strafeSwitch"]},
 {id:"lead",label:"Lead",weaponStyle:"",conceptName:"Lead",description:"Right-stick aim leads the implied movement path.",mode:"gamescenario",profile:"lead",mechanics:["lead"]},
 {id:"follow",label:"Follow",weaponStyle:"",conceptName:"Follow",description:"Right-stick aim follows smoothly without overreacting.",mode:"gamescenario",profile:"follow",mechanics:["follow"]},
 {id:"stableAim",label:"Stable Aim",weaponStyle:"",conceptName:"Stable Aim",description:"Aim remains steady while movement changes.",mode:"gamescenario",profile:"centerHold",mechanics:["stableAim"]},
 {id:"stableMovement",label:"Stable Movement",weaponStyle:"",conceptName:"Stable Movement",description:"Movement remains steady while aim changes.",mode:"gamescenario",profile:"wideCorrections",mechanics:["stableMovement"]},
 {id:"pressureUnderMotion",label:"Pressure Under Motion",weaponStyle:"",conceptName:"Pressure Under Motion",description:"Change movement direction while maintaining calm off-center aim pressure.",mode:"gamescenario",profile:"pressureUnderMotion",mechanics:["pressureUnderMotion"]},
 {id:"pressureUnderAim",label:"Pressure Under Aim",weaponStyle:"",conceptName:"Pressure Under Aim",description:"Maintain off-center movement pressure while aim changes direction.",mode:"gamescenario",profile:"pressureUnderAim",mechanics:["pressureUnderAim"]},
 {id:"controlledEntry",label:"Controlled Entry",weaponStyle:"",conceptName:"Controlled Entry",description:"Accelerate smoothly into both active tracking paths.",mode:"gamescenario",profile:"controlledEntry",mechanics:["controlledEntry"]},
 {id:"controlledExit",label:"Controlled Exit",weaponStyle:"",conceptName:"Controlled Exit",description:"Decelerate smoothly before each readable direction change.",mode:"gamescenario",profile:"controlledExit",mechanics:["controlledExit"]},
 {id:"settle",label:"Settle",weaponStyle:"",conceptName:"Settle",description:"Reduce speed near path endpoints and land each correction softly.",mode:"gamescenario",profile:"settle",mechanics:["settle"]},
 {id:"thumbSeparation",label:"Thumb Separation",weaponStyle:"",conceptName:"Thumb Separation",description:"Track intentionally different directions, speeds, radii, and timing.",mode:"gamescenario",profile:"thumbSeparation",mechanics:["thumbSeparation"]},
 {id:"recover",label:"Recover",weaponStyle:"",conceptName:"Recover",description:"Return to the intended tracking path after a controlled overshoot.",mode:"gamescenario",profile:"recover",mechanics:["recover"]},
 {id:"commit",label:"Commit",weaponStyle:"",conceptName:"Commit",description:"Move confidently toward the required stick pressure instead of hesitating.",mode:"gamescenario",profile:"commit",mechanics:["commit"]},
 {id:"pressureChange",label:"Pressure Change",weaponStyle:"",conceptName:"Pressure Change",description:"Transition between lighter and heavier stick pressure while maintaining tracking.",mode:"gamescenario",profile:"pressureChange",mechanics:["pressureChange"]},
 {id:"pressureRelease",label:"Pressure Release",weaponStyle:"",conceptName:"Pressure Release",description:"Reduce stick pressure gradually without snapping toward center.",mode:"gamescenario",profile:"pressureRelease",mechanics:["pressureRelease"]},
 {id:"pressureLadder",label:"Pressure Ladder",weaponStyle:"",conceptName:"Pressure Ladder",description:"Move through multiple controlled pressure levels during continuous tracking.",mode:"gamescenario",profile:"pressureLadder",mechanics:["pressureLadder"]},
 {id:"arcTracking",label:"Arc Tracking",weaponStyle:"",conceptName:"Arc Tracking",description:"Track smooth curved motion instead of straight-line motion.",mode:"gamescenario",profile:"arcTracking",mechanics:["arcTracking"]},
 {id:"angleHold",label:"Angle Hold",weaponStyle:"",conceptName:"Angle Hold",description:"Maintain one consistent movement angle while aiming responds naturally.",mode:"gamescenario",profile:"angleHold",mechanics:["angleHold"]},
 {id:"movementPriority",label:"Movement Priority",weaponStyle:"",conceptName:"Movement Priority",description:"Movement drives the mechanic while aim adapts.",mode:"gamescenario",profile:"movementPriority",mechanics:["movementPriority"]},
 {id:"aimPriority",label:"Aim Priority",weaponStyle:"",conceptName:"Aim Priority",description:"Aim drives the mechanic while movement adapts.",mode:"gamescenario",profile:"aimPriority",mechanics:["aimPriority"]},
 {id:"independentTiming",label:"Independent Timing",weaponStyle:"",conceptName:"Independent Timing",description:"One thumb deliberately leads the other while both remain continuous.",mode:"gamescenario",profile:"independentTiming",mechanics:["independentTiming"]}
];
const STRAFE_COMBAT_SCENARIOS=[
 {id:"wideStrafe",label:"Wide Strafe",weaponStyle:"",conceptName:"Wide Strafe",description:"Use committed lateral movement while aim follows the broad crossing path.",mode:"gamescenario",profile:"wideStrafe",mechanics:["wideStrafe"]},
 {id:"tightStrafe",label:"Tight Strafe",weaponStyle:"",conceptName:"Tight Strafe",description:"Make compact lateral adjustments for close cover or fine duel spacing.",mode:"gamescenario",profile:"tightStrafe",mechanics:["tightStrafe"]},
 {id:"longHold",label:"Long Hold",weaponStyle:"",conceptName:"Long Hold",description:"Commit to one strafe direction long enough to punish premature switching.",mode:"gamescenario",profile:"longHold",mechanics:["longHold"]},
 {id:"delayedSwitch",label:"Delayed Switch",weaponStyle:"",conceptName:"Delayed Switch",description:"Reverse movement first, then settle aim onto the new direction after a readable delay.",mode:"gamescenario",profile:"delayedSwitch",mechanics:["delayedSwitch"]},
 {id:"strafeRecovery",label:"Strafe Recovery",weaponStyle:"",conceptName:"Strafe Recovery",description:"Recover the movement and aim path after a controlled strafe overshoot.",mode:"gamescenario",profile:"strafeRecovery",mechanics:["strafeRecovery"]},
 {id:"pressureCarry",label:"Pressure Carry",weaponStyle:"",conceptName:"Pressure Carry",description:"Carry deliberate stick pressure through a sustained lateral crossing.",mode:"gamescenario",profile:"pressureCarry",mechanics:["pressureCarry"]},
 {id:"reversePressure",label:"Reverse Pressure",weaponStyle:"",conceptName:"Reverse Pressure",description:"Reverse a committed strafe while preserving controlled opposing aim pressure.",mode:"gamescenario",profile:"reversePressure",mechanics:["reversePressure"]},
 {id:"burstStrafe",label:"Burst Strafe",weaponStyle:"",conceptName:"Burst Strafe",description:"Alternate short movement bursts with brief controlled reductions in pressure.",mode:"gamescenario",profile:"burstStrafe",mechanics:["burstStrafe"]},
 {id:"strafeCounterPressure",label:"Counter Pressure",weaponStyle:"",conceptName:"Counter Pressure",description:"Strafe decisively while aim applies measured pressure against the movement direction.",mode:"gamescenario",profile:"strafeCounterPressure",mechanics:["strafeCounterPressure"]},
 {id:"strafeMovementPriority",label:"Movement Priority",weaponStyle:"",conceptName:"Movement Priority",description:"Let positioning lead the exchange while aim adapts to each movement decision.",mode:"gamescenario",profile:"strafeMovementPriority",mechanics:["strafeMovementPriority"]}
];
const COMBAT_MECHANICS={
 pressureHold:{id:"pressureHold",name:"Pressure Hold",coachingCue:"Keep both steady",family:"hold",behavior:"continuous",weight:3,motion:{relation:"same",leftSpeed:.32,rightSpeed:.24,response:2,turn:.16,changeMin:3800,changeMax:5000,offset:.04},left:{job:"stable movement",band:[.66,.8],diagonalChance:.06},right:{job:"stable aim pressure",band:[.38,.5],horizontal:{mode:"sameOrFree",followChance:.82,min:.08,max:.15},vertical:{profile:"neutralTight",jitterChance:0}}},
 microCorrections:{id:"microCorrections",name:"Micro Corrections",coachingCue:"Small aim pressure",family:"precision",behavior:"continuous",weight:3,motion:{relation:"same",leftSpeed:.55,rightSpeed:.19,response:2.35,turn:.16,changeMin:2100,changeMax:3100,offset:-.04},left:{job:"readable movement",band:[.42,.58],diagonalChance:.05},right:{job:"tiny aim changes",band:[.12,.23],horizontal:{mode:"free",min:-.06,max:.06},vertical:{profile:"neutralTight",jitterChance:0}}},
 counterPressure:{id:"counterPressure",name:"Counter Pressure",coachingCue:"Counter gently",family:"counter",behavior:"continuous",weight:3,motion:{relation:"counter",leftSpeed:.82,rightSpeed:.64,response:4.8,turn:.32,changeMin:1700,changeMax:2400},left:{job:"committed movement",band:[.64,.82],diagonalChance:.16},right:{job:"opposing aim pressure",band:[.3,.5],horizontal:{mode:"opposite",followChance:.92,min:.16,max:.3},vertical:{profile:"balanced",jitterChance:0}}},
 mirror:{id:"mirror",name:"Mirror",coachingCue:"Match, don't copy",family:"follow",behavior:"continuous",weight:3,motion:{relation:"same",leftSpeed:.75,rightSpeed:.67,response:4.9,turn:.3,changeMin:1800,changeMax:2600,offset:0},left:{job:"clear movement",band:[.54,.76],diagonalChance:.12},right:{job:"supporting aim",band:[.32,.52],horizontal:{mode:"same",followChance:.92,min:.13,max:.24},vertical:{profile:"balanced",jitterChance:0}}},
 antiMirror:{id:"antiMirror",name:"Anti-Mirror",coachingCue:"Separate the sticks",family:"counter",behavior:"continuous",weight:3,motion:{relation:"opposite",leftSpeed:.75,rightSpeed:.67,response:4.9,turn:.3,changeMin:1800,changeMax:2600,offset:0},left:{job:"clear movement",band:[.54,.76],diagonalChance:.12},right:{job:"countering aim",band:[.32,.52],horizontal:{mode:"opposite",followChance:.92,min:.13,max:.24},vertical:{profile:"balanced",jitterChance:0}}},
 unequalPressure:{id:"unequalPressure",name:"Unequal Pressure",coachingCue:"Different pressure",family:"pressure",behavior:"continuous",weight:2,motion:{relation:"independent",leftSpeed:.35,rightSpeed:.42,response:2.15,turn:.18,changeMin:3200,changeMax:4500},left:{job:"stronger movement pressure",band:[.72,.84],diagonalChance:.06},right:{job:"different aim pressure",band:[.16,.27],horizontal:{mode:"free",min:-.11,max:.11},vertical:{profile:"neutralTight",jitterChance:0}}},
 independentHold:{id:"independentHold",name:"Independent Hold",coachingCue:"Hold one, move one",family:"stability",behavior:"continuous",weight:3,motion:{relation:"independent",leftSpeed:.08,rightSpeed:.8,response:2.8,turn:.4,changeMin:3000,changeMax:4200,alternateRoles:true},left:{job:"narrow stable path",band:[.56,.62],diagonalChance:.04},right:{job:"active independent aim",band:[.24,.46],horizontal:{mode:"free",min:-.2,max:.2},vertical:{profile:"balanced",jitterChance:0}}},
 strafeSwitch:{id:"strafeSwitch",name:"Strafe Switch",coachingCue:"Read the reversal",family:"timing",behavior:"continuous",weight:2,motion:{relation:"same",leftSpeed:.79,rightSpeed:.61,response:3.4,turn:.08,changeMin:1550,changeMax:2200,reverse:true,offset:.06},left:{job:"readable reversals",band:[.54,.76],diagonalChance:.03},right:{job:"smooth aim path",band:[.24,.42],horizontal:{mode:"same",followChance:.88,min:.1,max:.19},vertical:{profile:"neutralTight",jitterChance:0}}},
 lead:{id:"lead",name:"Lead",coachingCue:"Aim slightly ahead",family:"timing",behavior:"continuous",weight:2,motion:{relation:"lead",path:"relationship",cycleMs:5800,phaseOffset:.16,arcSpan:.92,pathResponse:4.8,pathEntryMs:950,leftSpeed:.7,rightSpeed:.66,response:3.4,turn:.3,changeMin:2200,changeMax:3000},left:{job:"movement path",band:[.5,.74],diagonalChance:.08},right:{job:"leading aim",band:[.27,.47],horizontal:{mode:"same",followChance:.92,min:.12,max:.21},vertical:{profile:"balanced",jitterChance:0}}},
 follow:{id:"follow",name:"Follow",coachingCue:"Track, don’t chase",family:"timing",behavior:"continuous",weight:2,motion:{relation:"same",path:"relationship",cycleMs:5800,phaseOffset:-.18,arcSpan:.92,pathResponse:4.1,pathEntryMs:1000,leftSpeed:.7,rightSpeed:.56,response:2.8,turn:.3,changeMin:2200,changeMax:3000},left:{job:"movement path",band:[.5,.74],diagonalChance:.08},right:{job:"following aim",band:[.27,.47],horizontal:{mode:"same",followChance:.92,min:.1,max:.19},vertical:{profile:"balanced",jitterChance:0}}},
 stableAim:{id:"stableAim",name:"Stable Aim",coachingCue:"Keep aim calm",family:"stability",behavior:"continuous",weight:2,motion:{relation:"independent",leftSpeed:.8,rightSpeed:.07,response:1.85,turn:.24,changeMin:3000,changeMax:4400},left:{job:"active movement",band:[.52,.74],diagonalChance:.08},right:{job:"hold aim steady",band:[.26,.31],horizontal:{mode:"free",min:-.04,max:.04},vertical:{profile:"neutralTight",jitterChance:0}}},
 stableMovement:{id:"stableMovement",name:"Stable Movement",coachingCue:"Keep movement calm",family:"stability",behavior:"continuous",weight:2,motion:{relation:"independent",leftSpeed:.07,rightSpeed:.82,response:2.8,turn:.44,changeMin:2400,changeMax:3500},left:{job:"stable movement",band:[.48,.56],diagonalChance:.04},right:{job:"active aim",band:[.24,.46],horizontal:{mode:"free",min:-.2,max:.2},vertical:{profile:"balanced",jitterChance:0}}},
 pressureUnderMotion:{id:"pressureUnderMotion",name:"Pressure Under Motion",coachingCue:"Hold aim pressure",family:"pressure",behavior:"continuous",weight:2,motion:{relation:"independent",leftSpeed:.88,rightSpeed:.07,response:2.3,turn:.55,changeMin:1550,changeMax:2200},left:{job:"changing movement",band:[.48,.76],diagonalChance:.14},right:{job:"stable off-center aim",band:[.58,.66],horizontal:{mode:"free",min:-.07,max:.07},vertical:{profile:"neutralTight",jitterChance:0}}},
 pressureUnderAim:{id:"pressureUnderAim",name:"Pressure Under Aim",coachingCue:"Hold movement pressure",family:"pressure",behavior:"continuous",weight:2,motion:{relation:"independent",leftSpeed:.07,rightSpeed:.88,response:2.8,turn:.55,changeMin:1550,changeMax:2200},left:{job:"stable off-center movement",band:[.7,.8],diagonalChance:.03},right:{job:"changing aim",band:[.25,.52],horizontal:{mode:"free",min:-.22,max:.22},vertical:{profile:"balanced",jitterChance:0}}},
 controlledEntry:{id:"controlledEntry",name:"Controlled Entry",coachingCue:"Enter smoothly",family:"control",behavior:"continuous",weight:2,motion:{relation:"independent",leftSpeed:.75,rightSpeed:.64,response:2.8,turn:.32,changeMin:2200,changeMax:3100,entryMs:2400,entryFloor:.05},left:{job:"smooth movement entry",band:[.44,.7],diagonalChance:.08},right:{job:"smooth aim entry",band:[.24,.45],horizontal:{mode:"free",min:-.17,max:.17},vertical:{profile:"balanced",jitterChance:0}}},
 controlledExit:{id:"controlledExit",name:"Controlled Exit",coachingCue:"Exit smoothly",family:"control",behavior:"continuous",weight:2,motion:{relation:"independent",leftSpeed:.77,rightSpeed:.66,response:3,turn:.45,changeMin:1900,changeMax:2750,decelerateMs:1250,decelerateFloor:.08},left:{job:"controlled movement exit",band:[.47,.72],diagonalChance:.08},right:{job:"controlled aim exit",band:[.24,.45],horizontal:{mode:"free",min:-.17,max:.17},vertical:{profile:"balanced",jitterChance:0}}},
 settle:{id:"settle",name:"Settle",coachingCue:"Land softly",family:"control",behavior:"continuous",weight:2,motion:{relation:"independent",leftSpeed:.72,rightSpeed:.61,response:2.6,turn:.36,changeMin:2200,changeMax:3100,settleZone:.5,settleFloor:.07},left:{job:"soft movement landing",band:[.43,.72],diagonalChance:.08},right:{job:"soft aim landing",band:[.22,.47],horizontal:{mode:"free",min:-.17,max:.17},vertical:{profile:"balanced",jitterChance:0}}},
 thumbSeparation:{id:"thumbSeparation",name:"Thumb Separation",coachingCue:"Separate the sticks",family:"separation",behavior:"continuous",weight:2,motion:{relation:"independent",leftSpeed:.86,rightSpeed:.34,response:3,turn:.65,changeMin:1550,changeMax:2200,rightChangeScale:1.9},left:{job:"wide movement path",band:[.64,.82],diagonalChance:.18},right:{job:"separate aim path",band:[.19,.35],horizontal:{mode:"free",min:-.17,max:.17},vertical:{profile:"balanced",jitterChance:0}}},
 recover:{id:"recover",name:"Recover",coachingCue:"Recover smoothly",family:"recovery",behavior:"continuous",weight:2,motion:{relation:"independent",path:"recover",cycleMs:4200,overshoot:.32,recoverAt:.46,pathResponse:5.3,pathEntryMs:850,leftSpeed:.75,rightSpeed:.64,response:3.2,turn:.38,changeMin:2200,changeMax:3000},left:{job:"recover movement path",band:[.47,.72],diagonalChance:.08},right:{job:"recover aim path",band:[.24,.45],horizontal:{mode:"free",min:-.17,max:.17},vertical:{profile:"balanced",jitterChance:0}}},
 commit:{id:"commit",name:"Commit",coachingCue:"Commit",family:"pressure",behavior:"continuous",weight:2,motion:{relation:"independent",path:"pressure",pressurePattern:"commit",cycleMs:4100,pathResponse:5.8,pathEntryMs:850,leftSpeed:.77,rightSpeed:.66,response:3.4,turn:.24,changeMin:2200,changeMax:3000},left:{job:"confident movement pressure",band:[.32,.8],diagonalChance:.05},right:{job:"confident aim pressure",band:[.16,.48],horizontal:{mode:"free",min:-.14,max:.14},vertical:{profile:"neutralTight",jitterChance:0}}},
 pressureChange:{id:"pressureChange",name:"Pressure Change",coachingCue:"Change pressure",family:"pressure",behavior:"continuous",weight:2,motion:{relation:"independent",path:"pressure",pressurePattern:"wave",cycleMs:4200,pathResponse:5.3,pathEntryMs:850,leftSpeed:.64,rightSpeed:.55,response:3,turn:.22,changeMin:2400,changeMax:3200},left:{job:"changing movement pressure",band:[.25,.8],diagonalChance:.06},right:{job:"changing aim pressure",band:[.12,.48],horizontal:{mode:"free",min:-.14,max:.14},vertical:{profile:"balanced",jitterChance:0}}},
 pressureRelease:{id:"pressureRelease",name:"Pressure Release",coachingCue:"Release smoothly",family:"release",behavior:"continuous",weight:2,motion:{relation:"independent",path:"pressure",pressurePattern:"release",cycleMs:6000,pathResponse:5,pathEntryMs:850,leftSpeed:.6,rightSpeed:.51,response:2.8,turn:.2,changeMin:3000,changeMax:4000},left:{job:"gradual movement release",band:[.22,.82],diagonalChance:.05},right:{job:"gradual aim release",band:[.1,.5],horizontal:{mode:"free",min:-.14,max:.14},vertical:{profile:"neutralTight",jitterChance:0}}},
 pressureLadder:{id:"pressureLadder",name:"Pressure Ladder",coachingCue:"Climb pressure",family:"ladder",behavior:"continuous",weight:2,motion:{relation:"independent",path:"pressure",pressurePattern:"ladder",cycleMs:5500,pathResponse:5.3,pathEntryMs:850,leftSpeed:.62,rightSpeed:.53,response:3,turn:.18,changeMin:2800,changeMax:3700},left:{job:"movement pressure levels",band:[.22,.82],diagonalChance:.05},right:{job:"aim pressure levels",band:[.1,.5],horizontal:{mode:"free",min:-.14,max:.14},vertical:{profile:"neutralTight",jitterChance:0}}},
 arcTracking:{id:"arcTracking",name:"Arc Tracking",coachingCue:"Follow the curve",family:"curve",behavior:"continuous",weight:2,motion:{relation:"independent",path:"arc",cycleMs:6500,arcSpan:1.4,pathResponse:5.3,pathEntryMs:950,leftSpeed:.68,rightSpeed:.6,response:3,turn:.3,changeMin:2600,changeMax:3500},left:{job:"smooth movement arc",band:[.55,.76],diagonalChance:.12},right:{job:"smooth aim arc",band:[.27,.47],horizontal:{mode:"free",min:-.17,max:.17},vertical:{profile:"balanced",jitterChance:0}}},
 angleHold:{id:"angleHold",name:"Angle Hold",coachingCue:"Hold the angle",family:"angle",behavior:"continuous",weight:2,motion:{relation:"same",path:"angleHold",cycleMs:5000,pathResponse:5.3,pathEntryMs:850,leftSpeed:.6,rightSpeed:.51,response:3.2,turn:.12,changeMin:3200,changeMax:4300},left:{job:"fixed movement angle",band:[.38,.78],diagonalChance:.28},right:{job:"natural aim response",band:[.22,.45],horizontal:{mode:"same",followChance:.88,min:.09,max:.18},vertical:{profile:"balanced",jitterChance:0}}},
 movementPriority:{id:"movementPriority",name:"Movement Priority",coachingCue:"Move first",family:"priority",behavior:"continuous",weight:2,motion:{relation:"same",priority:"left",cycleMs:4700,pathResponse:5.3,pathEntryMs:950,leftSpeed:.9,rightSpeed:.42,response:2.4,turn:.6,changeMin:1650,changeMax:2350,offset:.08},left:{job:"driving movement",band:[.56,.78],diagonalChance:.14},right:{job:"adapting aim",band:[.22,.4],horizontal:{mode:"same",followChance:.86,min:.09,max:.17},vertical:{profile:"balanced",jitterChance:0}}},
 aimPriority:{id:"aimPriority",name:"Aim Priority",coachingCue:"Aim first",family:"priority",behavior:"continuous",weight:2,motion:{relation:"same",priority:"right",cycleMs:4700,pathResponse:5.3,pathEntryMs:950,leftSpeed:.42,rightSpeed:.9,response:2.4,turn:.6,changeMin:1650,changeMax:2350,offset:-.08},left:{job:"adapting movement",band:[.45,.65],diagonalChance:.1},right:{job:"driving aim",band:[.3,.52],horizontal:{mode:"free",min:-.2,max:.2},vertical:{profile:"balanced",jitterChance:0}}},
 independentTiming:{id:"independentTiming",name:"Independent Timing",coachingCue:"One then the other",family:"timing",behavior:"continuous",weight:2,motion:{relation:"independent",path:"timing",cycleMs:6100,leadFraction:.21,pathResponse:5.3,pathEntryMs:1100,leftSpeed:.68,rightSpeed:.68,response:3,turn:.38,changeMin:2400,changeMax:3300,alternateRoles:true},left:{job:"leading movement timing",band:[.5,.74],diagonalChance:.12},right:{job:"following aim timing",band:[.25,.47],horizontal:{mode:"free",min:-.17,max:.17},vertical:{profile:"balanced",jitterChance:0}}},
 wideStrafe:{id:"wideStrafe",name:"Wide Strafe",coachingCue:"Commit to the lane",family:"Strafe",behavior:"continuous",weight:2,motion:{relation:"same",path:"relationship",cycleMs:6200,phaseOffset:-.1,arcSpan:1.35,pathResponse:4.8,pathEntryMs:850,leftSpeed:.88,rightSpeed:.62,response:3.4,turn:.22,changeMin:2600,changeMax:3600},left:{job:"wide lateral strafe",band:[.68,.86],diagonalChance:.03},right:{job:"tracking across the lane",band:[.28,.5],horizontal:{mode:"same",followChance:.9,min:.12,max:.22},vertical:{profile:"neutralTight",jitterChance:0}}},
 tightStrafe:{id:"tightStrafe",name:"Tight Strafe",coachingCue:"Keep switches compact",family:"Strafe",behavior:"continuous",weight:2,motion:{relation:"same",path:"relationship",cycleMs:3300,phaseOffset:-.08,arcSpan:.38,pathResponse:6.2,pathEntryMs:650,leftSpeed:.72,rightSpeed:.58,response:4.4,turn:.12,changeMin:1100,changeMax:1650},left:{job:"compact lateral strafe",band:[.32,.5],diagonalChance:.02},right:{job:"fine aim tracking",band:[.16,.32],horizontal:{mode:"same",followChance:.92,min:.07,max:.14},vertical:{profile:"neutralTight",jitterChance:0}}},
 longHold:{id:"longHold",name:"Long Hold",coachingCue:"Hold the direction",family:"Strafe",behavior:"continuous",weight:2,motion:{relation:"same",leftSpeed:.68,rightSpeed:.5,response:3.2,turn:.06,changeMin:4200,changeMax:5600,reverse:true,offset:.03},left:{job:"sustained lateral hold",band:[.62,.8],diagonalChance:.02},right:{job:"steady aim carry",band:[.25,.42],horizontal:{mode:"same",followChance:.9,min:.1,max:.18},vertical:{profile:"neutralTight",jitterChance:0}}},
 delayedSwitch:{id:"delayedSwitch",name:"Delayed Switch",coachingCue:"Move, then settle aim",family:"Strafe",behavior:"continuous",weight:2,motion:{relation:"independent",path:"timing",cycleMs:4800,leadFraction:.24,pathResponse:5.8,pathEntryMs:800,leftSpeed:.82,rightSpeed:.6,response:3.4,turn:.18,changeMin:1900,changeMax:2600},left:{job:"leading strafe switch",band:[.56,.78],diagonalChance:.03},right:{job:"delayed aim switch",band:[.24,.44],horizontal:{mode:"free",min:-.16,max:.16},vertical:{profile:"neutralTight",jitterChance:0}}},
 strafeRecovery:{id:"strafeRecovery",name:"Strafe Recovery",coachingCue:"Recover without snapping",family:"Strafe",behavior:"continuous",weight:2,motion:{relation:"same",path:"recover",cycleMs:3900,overshoot:.38,recoverAt:.44,pathResponse:5.6,pathEntryMs:750,leftSpeed:.84,rightSpeed:.62,response:3.6,turn:.28,changeMin:1800,changeMax:2500},left:{job:"recovering strafe path",band:[.48,.8],diagonalChance:.05},right:{job:"recovering aim path",band:[.22,.46],horizontal:{mode:"same",followChance:.88,min:.1,max:.19},vertical:{profile:"balanced",jitterChance:0}}},
 pressureCarry:{id:"pressureCarry",name:"Pressure Carry",coachingCue:"Carry pressure through",family:"Strafe",behavior:"continuous",weight:2,motion:{relation:"same",path:"relationship",cycleMs:5700,phaseOffset:-.14,arcSpan:.92,pathResponse:4.6,pathEntryMs:900,leftSpeed:.74,rightSpeed:.48,response:3,turn:.16,changeMin:2800,changeMax:3900},left:{job:"carried movement pressure",band:[.7,.84],diagonalChance:.03},right:{job:"stable tracking pressure",band:[.4,.56],horizontal:{mode:"same",followChance:.9,min:.13,max:.22},vertical:{profile:"neutralTight",jitterChance:0}}},
 reversePressure:{id:"reversePressure",name:"Reverse Pressure",coachingCue:"Reverse, keep control",family:"Strafe",behavior:"continuous",weight:2,motion:{relation:"counter",leftSpeed:.86,rightSpeed:.64,response:4.9,turn:.12,changeMin:1500,changeMax:2200,reverse:true},left:{job:"reversing committed strafe",band:[.62,.82],diagonalChance:.04},right:{job:"preserved opposing pressure",band:[.3,.5],horizontal:{mode:"opposite",followChance:.92,min:.14,max:.25},vertical:{profile:"neutralTight",jitterChance:0}}},
 burstStrafe:{id:"burstStrafe",name:"Burst Strafe",coachingCue:"Burst, pause, burst",family:"Strafe",behavior:"continuous",weight:2,motion:{relation:"same",path:"pressure",pressurePattern:"ladder",cycleMs:3000,pathResponse:7,pathEntryMs:600,leftSpeed:.92,rightSpeed:.6,response:4.2,turn:.1,changeMin:1200,changeMax:1700},left:{job:"short strafe bursts",band:[.18,.82],diagonalChance:.02},right:{job:"aim through each burst",band:[.18,.44],horizontal:{mode:"same",followChance:.88,min:.08,max:.18},vertical:{profile:"neutralTight",jitterChance:0}}},
 strafeCounterPressure:{id:"strafeCounterPressure",name:"Counter Pressure",coachingCue:"Counter the strafe",family:"Strafe",behavior:"continuous",weight:2,motion:{relation:"counter",leftSpeed:.84,rightSpeed:.66,response:5.1,turn:.26,changeMin:1800,changeMax:2500},left:{job:"decisive lateral movement",band:[.64,.82],diagonalChance:.06},right:{job:"measured counter pressure",band:[.3,.5],horizontal:{mode:"opposite",followChance:.94,min:.15,max:.27},vertical:{profile:"neutralTight",jitterChance:0}}},
 strafeMovementPriority:{id:"strafeMovementPriority",name:"Movement Priority",coachingCue:"Position first",family:"Strafe",behavior:"continuous",weight:2,motion:{relation:"same",priority:"left",cycleMs:4400,pathResponse:5.7,pathEntryMs:800,leftSpeed:.94,rightSpeed:.4,response:2.6,turn:.52,changeMin:1500,changeMax:2200,offset:.07},left:{job:"positioning-led strafe",band:[.58,.82],diagonalChance:.1},right:{job:"aim adapting to movement",band:[.2,.4],horizontal:{mode:"same",followChance:.88,min:.08,max:.16},vertical:{profile:"balanced",jitterChance:0}}}
};
const COMBAT_SCENARIO_BY_ID=Object.fromEntries([...COMBAT_SCENARIOS,...STRAFE_COMBAT_SCENARIOS,...COMBAT_FLOW_SCENARIOS].map(entry=>[entry.id,entry]));
const COMBAT_SCENARIO_ALIASES={smg:"pressureHold",shotgun:"stableMovement",micro:"microCorrections",reset:"stableAim",mixed:"mixed"};

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

function getCombatMechanicById(id){
 return COMBAT_MECHANICS[id]||COMBAT_MECHANICS.follow;
}

function activeCombatMechanic(){
 const scenarioId=S.scenarioName||S.challengeScenarioPreset||($('gameScenarioType')?.value);
 const entry=getCombatScenarioEntry(scenarioId);
 return getCombatMechanicById(S.currentCombatMechanicId||entry?.mechanics?.[0]||entry?.id);
}

function isContinuousCombatMechanic(){
 return activeCombatMechanic().behavior==="continuous";
}

function isCombatDrill(){
 return S.challengeMode&&S.challengeType==="combat"&&S.mode==="gamescenario";
}

function isCombatFlowDrill(){
 return S.challengeMode&&S.challengeType==="combatflow"&&S.mode==="gamescenario";
}

function isCombatCompositionDrill(){
 return isCombatDrill();
}

function activeCombatMovementPattern(){
 return COMBAT_MOVEMENT_PATTERN_BY_ID[S.currentMovementPatternId]||COMBAT_MOVEMENT_PATTERNS[0];
}

function selectCombatMovementPattern(mechanicId){
 const previous=S.combatDrillHistory[S.combatDrillHistory.length-1];
 let candidates=COMBAT_MOVEMENT_PATTERNS.filter(pattern=>
  pattern.id!==previous?.patternId&&`${pattern.id}:${mechanicId}`!==previous?.combination
 );
 if(!candidates.length)candidates=[...COMBAT_MOVEMENT_PATTERNS];
 const pattern=candidates[Math.floor(Math.random()*candidates.length)];
 S.currentMovementPatternId=pattern.id;
 S.combatMovementPatternDirection=Math.random()<.5?-1:1;
 S.combatDrillHistory.push({patternId:pattern.id,mechanicId,combination:`${pattern.id}:${mechanicId}`});
 if(S.combatDrillHistory.length>12)S.combatDrillHistory.shift();
 return pattern;
}

function activeCombatMovementPatternConfig(pattern=activeCombatMovementPattern()){
 const profile=combatDifficultyProfile();
 return{
  ...pattern,
  cycleMs:pattern.cycleMs/((profile.motionSpeed+profile.directionChangeRate)/2),
  speed:pattern.speed*profile.motionSpeed
 };
}

function activeCombatMovementPatternBand(pattern=activeCombatMovementPattern()){
 if(!isCombatFlowDrill())return pattern.band;
 const profile=combatDifficultyProfile();
 const center=(pattern.band[0]+pattern.band[1])/2;
 const span=(pattern.band[1]-pattern.band[0])*(1+(profile.pathRange-1)*.65);
 const edgeShift=(profile.outerPressureChance-.35)*.1;
 return[
  Math.max(.05,center-span/2+edgeShift),
  Math.min(.9,center+span/2+edgeShift)
 ];
}

function combatMovementPatternTarget(pattern,now,band){
 const elapsed=Math.max(0,now-S.scenarioMotionStartedAt);
 const cycleMs=Math.max(1200,pattern.cycleMs);
 const phase=(elapsed%cycleMs)/cycleMs;
 const halfPhase=(phase%.5)*2;
 const side=(phase<.5?1:-1)*S.combatMovementPatternDirection;
 const pressureAt=value=>band.min+(band.max-band.min)*clampNumber(value,0,1);
 let pressure=.72;
 let direction=side;

 if(pattern.kind==="switch"){
  const transition=Math.max(.04,pattern.transition||.16);
  const edgeDistance=Math.min(halfPhase,1-halfPhase);
  pressure=clampNumber(edgeDistance/transition,0,1);
 }else if(pattern.kind==="delayed"){
  pressure=halfPhase<.62?1:1-smoothCombatStep((halfPhase-.62)/.38);
 }else if(pattern.kind==="burst"){
  const burstPhase=(phase*4)%1;
  direction=(Math.floor(phase*4)%2?1:-1)*S.combatMovementPatternDirection;
  pressure=burstPhase<.58?smoothCombatStep(burstPhase/.18):1-smoothCombatStep((burstPhase-.58)/.42);
 }else if(pattern.kind==="rhythm"){
  const steps=[{end:.18,side:1,pressure:.92},{end:.31,side:-1,pressure:.52},{end:.59,side:1,pressure:.76},{end:.72,side:1,pressure:.38},{end:1,side:-1,pressure:1}];
  const step=steps.find(item=>phase<item.end)||steps[steps.length-1];
  direction=step.side*S.combatMovementPatternDirection;
  pressure=step.pressure;
 }else if(pattern.kind==="recovery"){
  const recovery=Math.sin(halfPhase*Math.PI);
  pressure=.58+recovery*.42;
  if(halfPhase>.68)pressure-=smoothCombatStep((halfPhase-.68)/.32)*.28;
 }else if(pattern.kind==="carry"){
  pressure=.84+Math.sin(phase*Math.PI*4)*.08;
 }

 return{x:direction*pressureAt(pressure),y:0};
}

function activeCombatFlowScenario(){
 return COMBAT_FLOW_SCENARIO_BY_ID[S.scenarioName]||null;
}

function authoredCombatFlowBand(side){
 const profile=combatDifficultyProfile();
 const edgeBonus=(profile.outerPressureChance-.35)*(side==="left"?.1:.06);
 const range=(side==="left"?.82:.52)*profile.pathRange+edgeBonus;
 return[.04,clampNumber(range,.36,.9)];
}

function authoredCombatFlowTargets(scenario,now){
 const track=COMBAT_FLOW_PHASE_TRACKS[scenario.id];
 const profile=combatDifficultyProfile();
 const timingScale=(profile.motionSpeed+profile.directionChangeRate)/2;
 const cycleMs=Math.max(3600,scenario.cycleMs/timingScale);
 const phase=(Math.max(0,now-S.scenarioMotionStartedAt)%cycleMs)/cycleMs;
 const nextIndex=track.findIndex(point=>point.at>=phase);
 const next=track[nextIndex<0?track.length-1:nextIndex];
 const previous=track[Math.max(0,(nextIndex<0?track.length-1:nextIndex)-1)];
 const progress=smoothCombatStep((phase-previous.at)/Math.max(.001,next.at-previous.at));
 const interpolate=(side,index)=>previous[side][index]+(next[side][index]-previous[side][index])*progress;
 const rangeScale=profile.pathRange/.94;
 const independenceScale=.82+profile.independenceAmount*.22;
 const edgeScale=1+(profile.outerPressureChance-.35)*.08;
 const target=side=>{
  const sideScale=side==="left"?rangeScale*edgeScale:rangeScale*independenceScale;
  const x=interpolate(side,0)*sideScale;
  const y=interpolate(side,1)*sideScale;
  const distance=Math.hypot(x,y);
  if(distance<=.88)return{x,y};
  return{x:x/distance*.88,y:y/distance*.88};
 };
 return{left:target("left"),right:target("right"),phase:previous.phase};
}

function beginMechanicTrace(now){
 if(!DEBUG||!S.challengeMode||!["mechanic","strafe"].includes(S.challengeType))return;
 const motionInitialized=Math.hypot(S.scenarioLeft.vx,S.scenarioLeft.vy)>0&&Math.hypot(S.scenarioRight.vx,S.scenarioRight.vy)>0;
 S.mechanicTrace={
  mechanic:S.currentCombatMechanicId,
  enteredAt:now,
  durationMs:Math.max(0,(S.challengeSwitchAt||now)-now),
  motionInitialized,
  stayedInsideBounds:true
 };
 console.debug(`[${challengeTypeMeta().label}] mechanic entered`,{...S.mechanicTrace});
}

function updateMechanicTraceBounds(left,right){
 if(!S.mechanicTrace)return;
 const positions=[left.x,left.y,right.x,right.y];
 const inside=positions.every(Number.isFinite)&&Math.hypot(left.x,left.y)<=.9&&Math.hypot(right.x,right.y)<=.9;
 S.mechanicTrace.stayedInsideBounds&&=inside;
}

function endMechanicTrace(reason){
 if(!DEBUG||!S.mechanicTrace)return;
 console.debug(`[${challengeTypeMeta().label}] mechanic exited`,{
  ...S.mechanicTrace,
  elapsedMs:Math.max(0,performance.now()-S.mechanicTrace.enteredAt),
  reason
 });
 S.mechanicTrace=null;
}

function activeCombatMotion(mechanic=activeCombatMechanic()){
 const baseMotion=mechanic.motion;
 const motion=baseMotion.alternateRoles&&S.combatRoleSwap
  ?{...baseMotion,leftSpeed:baseMotion.rightSpeed,rightSpeed:baseMotion.leftSpeed}
  :baseMotion;
 const profile=combatDifficultyProfile();
 const speedScale=combatDifficultyUses(mechanic,"motionSpeed")?profile.motionSpeed:1;
 const directionScale=combatDifficultyUses(mechanic,"directionChangeRate")?profile.directionChangeRate:1;
 const independence=combatDifficultyUses(mechanic,"independenceAmount")?profile.independenceAmount:1;
 const responseScale=Math.sqrt(speedScale);
 const tuned={
  ...motion,
  leftSpeed:motion.leftSpeed*speedScale,
  rightSpeed:motion.rightSpeed*speedScale,
  response:motion.response*responseScale,
  changeMin:motion.changeMin/directionScale,
  changeMax:motion.changeMax/directionScale,
  turn:motion.turn*(.7+independence*.3)
 };
 if(motion.cycleMs)tuned.cycleMs=motion.cycleMs/((speedScale+directionScale)/2);
 if(motion.pathResponse)tuned.pathResponse=motion.pathResponse*responseScale;
 if(motion.pathEntryMs)tuned.pathEntryMs=motion.pathEntryMs/responseScale;
 if(mechanic.family==="hold"&&combatDifficultyUses(mechanic,"outerPressureChance")){
  const holdScale=1+(profile.outerPressureChance-.35)*.3;
  tuned.changeMin*=holdScale;
  tuned.changeMax*=holdScale;
 }
 if(motion.phaseOffset)tuned.phaseOffset=motion.phaseOffset*independence;
 if(motion.leadFraction)tuned.leadFraction=motion.leadFraction*independence;
 if(motion.rightChangeScale)tuned.rightChangeScale=Math.pow(motion.rightChangeScale,independence);
 if(motion.relation==="counter")tuned.counterOffset=.16*independence;
 if((motion.relation==="counter"||motion.relation==="opposite")&&independence!==1){
  tuned.offset=(motion.offset||0)+Math.sign(independence-1)*Math.min(.05,Math.abs(independence-1)*.08);
 }
 if(motion.relation==="independent"||motion.priority){
  const separationExponent=1+(independence-1)*.35;
  const geometricSpeed=Math.sqrt(Math.max(.0001,tuned.leftSpeed*tuned.rightSpeed));
  tuned.leftSpeed=geometricSpeed*Math.pow(tuned.leftSpeed/geometricSpeed,separationExponent);
  tuned.rightSpeed=geometricSpeed*Math.pow(tuned.rightSpeed/geometricSpeed,separationExponent);
 }
 return tuned;
}

function combatBandForSide(mechanic,side){
 const source=mechanic.motion.alternateBands&&S.combatRoleSwap
  ?mechanic[side==="left"?"right":"left"]
  :mechanic[side];
 const band=source.band;
 const profile=combatDifficultyProfile();
 if(!combatDifficultyUses(mechanic,"pathRange"))return band;

 const center=(band[0]+band[1])/2;
 const baseSpan=band[1]-band[0];
 const pressurePath=mechanic.motion.path==="pressure";
 const rangeScale=pressurePath?profile.pathRange:1+(profile.pathRange-1)*.65;
 const outerShift=combatDifficultyUses(mechanic,"outerPressureChance")&&!pressurePath
  ?(profile.outerPressureChance-.35)*.12
  :0;
 const halfSpan=baseSpan*rangeScale/2;
 const min=Math.max(.05,center+outerShift-halfSpan);
 const max=Math.min(.88,center+outerShift+halfSpan);
 return[min,max];
}

function combatMotionSpeedScale(body,band,motion,now){
 let scale=1;
 if(motion.entryMs){
  const entryProgress=clampNumber((now-S.scenarioMotionStartedAt)/motion.entryMs,0,1);
  scale*=motion.entryFloor+(1-motion.entryFloor)*entryProgress;
 }
 if(motion.decelerateMs){
  const turnProgress=clampNumber((body.nextChange-now)/motion.decelerateMs,0,1);
  scale*=motion.decelerateFloor+(1-motion.decelerateFloor)*turnProgress;
 }
 if(motion.settleZone){
  const distance=Math.hypot(body.x,body.y);
  const span=Math.max(.01,band.max-band.min);
  const endpointDistance=Math.max(0,Math.min(distance-band.min,band.max-distance));
  const settleProgress=clampNumber(endpointDistance/(span*motion.settleZone),0,1);
  scale*=motion.settleFloor+(1-motion.settleFloor)*settleProgress;
 }
 return scale;
}

function smoothCombatStep(value){
 const clamped=clampNumber(value,0,1);
 return clamped*clamped*(3-2*clamped);
}

function combatPressureProgress(pattern,phase,outerPressureChance=.35){
 let progress;
 if(pattern==="commit"){
  if(phase<.25)progress=smoothCombatStep(phase/.25);
  else if(phase<.72)progress=1;
  else progress=1-smoothCombatStep((phase-.72)/.28);
 }else if(pattern==="release"){
  progress=phase<.8?1-smoothCombatStep(phase/.8):smoothCombatStep((phase-.8)/.2);
 }else if(pattern==="ladder"){
  const levels=[0,.34,.67,1,.67,.34];
  const position=phase*levels.length;
  const index=Math.floor(position)%levels.length;
  const previous=levels[(index+levels.length-1)%levels.length];
  const local=position-index;
  progress=local<.42?previous+(levels[index]-previous)*smoothCombatStep(local/.42):levels[index];
 }else{
  progress=.5-Math.cos(phase*Math.PI*2)*.5;
 }
 return Math.pow(clampNumber(progress,0,1),1-outerPressureChance*.25);
}

function combatPathRadius(band,progress){
 return band.min+(band.max-band.min)*clampNumber(progress,0,1);
}

function combatPathPoint(angle,radius){
 return{x:Math.cos(angle)*radius,y:Math.sin(angle)*radius};
}

function combatParameterizedTargets(mechanic,motion,now,leftBand,rightBand){
 const path=motion.path;
 if(!path&&!motion.priority)return{left:null,right:null};
 const elapsed=Math.max(0,now-S.scenarioMotionStartedAt);
 const cycleMs=Math.max(1200,motion.cycleMs||3600);
 const phase=(elapsed%cycleMs)/cycleMs;
 const leftAnchor=Math.atan2(S.scenarioLeft.targetY,S.scenarioLeft.targetX);
 const rightAnchor=Math.atan2(S.scenarioRight.targetY,S.scenarioRight.targetX);
 const withSmoothEntry=targets=>{
  const progress=smoothCombatStep(elapsed/Math.max(1,motion.pathEntryMs||700));
  const blend=(target,body,band)=>{
   if(!target)return null;
   const origin=clampCombatTargetToBand(body.targetX,body.targetY,band.min,band.max);
   return{x:origin.x+(target.x-origin.x)*progress,y:origin.y+(target.y-origin.y)*progress};
  };
  return{
   left:blend(targets.left,S.scenarioLeft,leftBand),
   right:blend(targets.right,S.scenarioRight,rightBand)
  };
 };

 if(path==="pressure"){
  const profile=combatDifficultyProfile();
  const outerPressureChance=combatDifficultyUses(mechanic,"outerPressureChance")?profile.outerPressureChance:.35;
  const pressure=combatPressureProgress(motion.pressurePattern,phase,outerPressureChance);
  return withSmoothEntry({
   left:combatPathPoint(leftAnchor,combatPathRadius(leftBand,pressure)),
   right:combatPathPoint(rightAnchor,combatPathRadius(rightBand,pressure))
  });
 }
 if(path==="arc"){
  const sweep=Math.sin(phase*Math.PI*2)*(motion.arcSpan||1.4);
  return withSmoothEntry({
   left:combatPathPoint(leftAnchor+sweep,combatPathRadius(leftBand,.62)),
   right:combatPathPoint(rightAnchor-sweep*.72,combatPathRadius(rightBand,.58))
  });
 }
 if(path==="relationship"){
  const span=motion.arcSpan||.8;
  const leftSweep=Math.sin(phase*Math.PI*2)*span;
  const rightSweep=Math.sin((phase+(motion.phaseOffset||0))*Math.PI*2)*span;
  return withSmoothEntry({
   left:combatPathPoint(leftAnchor+leftSweep,combatPathRadius(leftBand,.62)),
   right:combatPathPoint(leftAnchor+rightSweep,combatPathRadius(rightBand,.58))
  });
 }
 if(path==="angleHold"){
  const pressure=.5-Math.cos(phase*Math.PI*2)*.5;
  return withSmoothEntry({left:combatPathPoint(leftAnchor,combatPathRadius(leftBand,pressure)),right:null});
 }
 if(path==="recover"){
  const cycleIndex=Math.floor(elapsed/cycleMs);
  const direction=cycleIndex%2?-1:1;
  const recoveryPhase=clampNumber(phase/(motion.recoverAt||.34),0,1);
  const overshoot=phase<(motion.recoverAt||.34)?Math.sin(recoveryPhase*Math.PI)*(motion.overshoot||.3)*direction:0;
  const drift=elapsed/cycleMs*.72;
  return withSmoothEntry({
   left:combatPathPoint(leftAnchor+drift+overshoot,combatPathRadius(leftBand,.62)),
   right:combatPathPoint(rightAnchor+drift*.82+overshoot*.72,combatPathRadius(rightBand,.58))
  });
 }
 if(path==="timing"){
  const leftLeads=!S.combatRoleSwap;
  const delay=motion.leadFraction||.22;
  const leftPhase=phase-(leftLeads?0:delay);
  const rightPhase=phase-(leftLeads?delay:0);
  return withSmoothEntry({
   left:combatPathPoint(leftAnchor+leftPhase*Math.PI*2,combatPathRadius(leftBand,.58)),
   right:combatPathPoint(rightAnchor+rightPhase*Math.PI*2,combatPathRadius(rightBand,.58))
  });
 }
 if(motion.priority){
  const driverIsLeft=motion.priority==="left";
  const driverAnchor=driverIsLeft?leftAnchor:rightAnchor;
  const driverAngle=driverAnchor+Math.sin(phase*Math.PI*2)*1.05;
  const followerAngle=driverAnchor+Math.sin((phase-.16)*Math.PI*2)*.48+(motion.offset||0);
  return withSmoothEntry({
   left:combatPathPoint(driverIsLeft?driverAngle:followerAngle,combatPathRadius(leftBand,driverIsLeft?.72:.52)),
   right:combatPathPoint(driverIsLeft?followerAngle:driverAngle,combatPathRadius(rightBand,driverIsLeft?.52:.72))
  });
 }
 return{left:null,right:null};
}

function advanceCombatPathBody(body,target,motion,dt){
 const previousX=body.x,previousY=body.y;
 const blend=Math.min(1,dt*(motion.pathResponse||motion.response||6));
 body.x+=(target.x-body.x)*blend;
 body.y+=(target.y-body.y)*blend;
 if(dt>0){
  body.vx=(body.x-previousX)/dt;
  body.vy=(body.y-previousY)/dt;
 }
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
  const mechanic=getCombatMechanicById(S.currentCombatMechanicId||entry?.mechanics?.[0]);
  if(isCombatFlowDrill())return{weaponStyle:"",conceptName:entry.label,coachingCue:entry.cue};
  if(isCombatCompositionDrill())return{weaponStyle:"",movementPatternName:activeCombatMovementPattern().label,conceptName:mechanic.name,coachingCue:mechanic.coachingCue};
  return entry?{weaponStyle:"",conceptName:entry.label,coachingCue:mechanic.coachingCue}:{weaponStyle:"",conceptName:"Follow",coachingCue:COMBAT_MECHANICS.follow.coachingCue};
 }
 return{weaponStyle:"",conceptName:""};
}

function getCombatMechanic(entry){
 if(S.currentCombatMechanicId){
  const current=getCombatMechanicById(S.currentCombatMechanicId);
  if(entry?.mechanics?.includes(current.id))return current;
 }
 const ids=entry?.mechanics?.length?entry.mechanics:[entry?.id||S.scenarioName||"follow"];
 const candidates=ids.map(getCombatMechanicById).filter(Boolean);
 const recent=S.combatMechanicHistory.slice(-3);
 let pool=candidates.filter(mechanic=>mechanic.id!==recent[recent.length-1]?.id);
 if(!pool.length)pool=[...candidates];
 if(recent.length>=2&&recent.slice(-2).every(item=>item.family===recent[recent.length-1].family)){
  const varied=pool.filter(mechanic=>mechanic.family!==recent[recent.length-1].family);
  if(varied.length)pool=varied;
 }
 const total=pool.reduce((sum,mechanic)=>sum+(mechanic.weight||1),0);
 let threshold=Math.random()*Math.max(1,total);
 let mechanic=pool[0]||COMBAT_MECHANICS.follow;
 for(const candidate of pool){
  threshold-=(candidate.weight||1);
  if(threshold<=0){mechanic=candidate;break;}
 }
 S.currentCombatMechanicId=mechanic.id;
 S.combatMechanicHistory.push({id:mechanic.id,family:mechanic.family});
 if(S.combatMechanicHistory.length>3)S.combatMechanicHistory.shift();
 return mechanic;
}

function combatUsableBand(minFactor,maxFactor){
 const deadzone=Math.max(0,Math.min(.5,(+$("stickDeadzone")?.value||0)/100));
 const usableOuter=.88;
 const usableSpan=Math.max(.18,usableOuter-deadzone);
 const toOutputRadius=raw=>Math.max(0,Math.min(.86,(raw-deadzone)/Math.max(.01,1-deadzone)));
 return{
  min:toOutputRadius(deadzone+usableSpan*minFactor),
  max:toOutputRadius(Math.min(usableOuter,deadzone+usableSpan*maxFactor))
 };
}

function sampleCombatAimBand(){
 const roll=Math.random();
 if(roll<.30)return-(.12+Math.random()*.18);
 if(roll<.70)return (Math.random()-.5)*.16;
 return .12+Math.random()*.18;
}

function sampleCombatVerticalProfile(profile){
 if(profile==="neutralTight")return (Math.random()-.5)*.12;
 return sampleCombatAimBand();
}

function clampCombatTargetToBand(x,y,minRadius,maxRadius){
 const distance=Math.hypot(x,y);
 if(!distance)return{x:minRadius,y:0};
 const clamped=Math.max(minRadius,Math.min(maxRadius,distance));
 const scale=clamped/distance;
 return{x:x*scale,y:y*scale};
}

function chooseBiasedDirection(preferredDirection,followChance=.7){
 if(Math.random()<followChance)return preferredDirection;
 return Math.random()<.5?-1:1;
}

function sampleCombatMovementTask(mechanic,amount,options={}){
 const direction=options.direction||(Math.random()<.5?-1:1);
 const leftBand=combatBandForSide(mechanic,"left");
 const leftPressureBand=combatUsableBand(leftBand[0],leftBand[1]);
 const strafeScale=options.strafeScale||(.7+Math.random()*.18);
 const leftX=direction*amount*strafeScale;
 const diagonalTilt=Math.random()<mechanic.left.diagonalChance;
 const leftY=diagonalTilt
  ?(Math.random()<.5?-1:1)*(.05+Math.random()*.07)
  :((Math.random()<.16?(Math.random()-.5)*.05:0));
 const leftTarget=clampCombatTargetToBand(leftX,leftY,leftPressureBand.min,leftPressureBand.max);
 return{leftX:leftTarget.x,leftY:leftTarget.y,direction};
}

function sampleCombatAimTask(mechanic,direction){
 const rightBand=combatBandForSide(mechanic,"right");
 const rightPressureBand=combatUsableBand(rightBand[0],rightBand[1]);
 const sameSideDirection=chooseBiasedDirection(direction,mechanic.right.horizontal.followChance||.78);
 const oppositeDirection=chooseBiasedDirection(-direction,mechanic.right.horizontal.followChance||.78);
 let rightX=0;
 let rightY=sampleCombatVerticalProfile(mechanic.right.vertical.profile);

 if(mechanic.right.horizontal.mode==="same"){
  rightX=sameSideDirection*(mechanic.right.horizontal.min+Math.random()*(mechanic.right.horizontal.max-mechanic.right.horizontal.min));
 }else if(mechanic.right.horizontal.mode==="opposite"){
  rightX=oppositeDirection*(mechanic.right.horizontal.min+Math.random()*(mechanic.right.horizontal.max-mechanic.right.horizontal.min));
 }else if(mechanic.right.horizontal.mode==="sameOrFree"){
  const mixDirection=chooseBiasedDirection(direction,mechanic.right.horizontal.followChance||.62);
  rightX=mixDirection*(mechanic.right.horizontal.min+Math.random()*(mechanic.right.horizontal.max-mechanic.right.horizontal.min));
 }else if(mechanic.right.horizontal.mode==="free"){
  rightX=mechanic.right.horizontal.min+Math.random()*(mechanic.right.horizontal.max-mechanic.right.horizontal.min);
 }

 if(mechanic.right.vertical.jitterChance&&Math.random()<mechanic.right.vertical.jitterChance){
  rightY+=(Math.random()<.5?-1:1)*(mechanic.right.vertical.jitterMin+Math.random()*(mechanic.right.vertical.jitterMax-mechanic.right.vertical.jitterMin));
 }

 const rightTarget=clampCombatTargetToBand(rightX,Math.max(-.34,Math.min(.34,rightY)),rightPressureBand.min,rightPressureBand.max);
 return{rightX:rightTarget.x,rightY:Math.max(-.34,Math.min(.34,rightTarget.y))};
}

function sampleCombatTargets(entry,amount,options={}){
 const mechanic=getCombatMechanic(entry);
 const movementTask=sampleCombatMovementTask(mechanic,amount,options);
 const aimTask=sampleCombatAimTask(mechanic,movementTask.direction);
 if(Math.abs(movementTask.leftX)<Math.abs(movementTask.leftY)*1.2)return null;
 if(Math.hypot(aimTask.rightX-movementTask.leftX,aimTask.rightY-movementTask.leftY)<.12)return null;
 return{leftX:movementTask.leftX,leftY:movementTask.leftY,rightX:aimTask.rightX,rightY:aimTask.rightY,direction:movementTask.direction};
}

function applyCombatTargets(entry,amount,options={}){
 let targets=null;
 for(let attempt=0;attempt<6&&!targets;attempt++)targets=sampleCombatTargets(entry,amount,options);
 if(!targets)targets=sampleCombatTargets(entry,amount,{...options,direction:Math.random()<.5?-1:1,strafeScale:.76});
 S.scenarioLeft.targetX=targets.leftX;
 S.scenarioLeft.targetY=targets.leftY;
 S.scenarioRight.targetX=targets.rightX;
 S.scenarioRight.targetY=targets.rightY;
 if(options.immediate){
  S.scenarioLeft.x=targets.leftX;
  S.scenarioLeft.y=targets.leftY;
  S.scenarioRight.x=targets.rightX;
  S.scenarioRight.y=targets.rightY;
 }
 return targets.direction;
}

const CHALLENGE_MODE_POOL=["sequence","simultaneous","sticks","dualsticks","strafeaim","dualtrack","reactivetrack",...COMBAT_SCENARIOS.map(entry=>entry.id)];

function challengeEntryMeta(entry){
 const combatEntry=getCombatScenarioEntry(entry);
 if(combatEntry){
  const mechanicId=combatEntry.mechanics?.[0]||combatEntry.id;
  const mechanic=getCombatMechanicById(mechanicId);
  return{mode:combatEntry.mode,label:combatEntry.label,scenario:combatEntry.id,challengeCategory:"combat",weaponStyle:"",conceptName:combatEntry.label,mechanicId,family:combatEntry.family||mechanic.family};
 }
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
  if((typeKey==="combat"||typeKey==="combatflow"||typeKey==="mechanic"||typeKey==="strafe")&&lastCombatMeta&&candidates.length>1){
    const differentCombatCandidates=candidates.filter(mode=>{
     const meta=challengeEntryMeta(mode);
       return meta.mechanicId!==lastCombatMeta.mechanicId&&meta.family!==lastCombatMeta.family;
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
 S.scenarioLeft={x:0,y:0,vx:0,vy:0,targetVx:0,targetVy:0,speed:0,targetX:0,targetY:0,nextChange:0};
 S.scenarioRight={x:0,y:0,vx:0,vy:0,targetVx:0,targetVy:0,speed:0,targetX:0,targetY:0,nextChange:0,nextJump:0};
 S.combatRoleSwap=false;
 S.currentCombatMechanicId=null;
 S.currentMovementPatternId=null;
 S.combatMovementPatternDirection=1;
 S.scenarioMotionStartedAt=0;
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
  $("stickModeBanner")?.classList.add("hidden");
  $("combatMechanicLabel")?.classList.add("hidden");
  $("combatCueLabel")?.classList.add("hidden");
  $("combatPromptBadge")?.classList.add("hidden");
  if($("stickModeBanner"))$("stickModeBanner").textContent="";
  if($("combatMechanicLabel"))$("combatMechanicLabel").textContent="";
  if($("combatCueLabel"))$("combatCueLabel").textContent="";
  if($("combatPromptBadge"))$("combatPromptBadge").textContent="";
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
 endMechanicTrace("challenge-restart");
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
 if(mode==="strafeaim")return null;
 return null;
}

function challengeDurationForCurrentMode(){
 const mode=S.mode;
 if(mode==="gamescenario"&&S.challengeMode&&["mechanic","strafe"].includes(S.challengeType))return 8000+Math.floor(Math.random()*7001);
 if(mode==="strafeaim"||mode==="dualtrack"||mode==="reactivetrack"||mode==="gamescenario")return 6000+Math.floor(Math.random()*6000);
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

function requestChallengeTransition(reason="advance"){
 if(!S.challengeMode||!S.running||S.paused||S.challengeSessionFinalized)return false;
 if(S.challengeTransitioning)return false;
 cancelPendingChallengeFocusSnap();
 S.challengeTransitioning=true;
 S.challengeTransitionStartedAt=performance.now();
 S.challengeSwitchPending=false;
 S.challengeSwitchAt=null;
 return true;
}

function advanceChallengeMode(){
 if(!S.challengeMode||!S.running||S.paused||!S.challengeTransitioning||S.challengeSessionFinalized)return;
 if(S.mode&&S.mode!="challenge"){
  if(!S.challengeCompletedModes.includes(S.challengeCurrentMode||S.mode))S.challengeCompletedModes.push(S.challengeCurrentMode||S.mode);
 }
 const nextEntry=S.challengeQueue.shift()||buildChallengeQueue().shift();
 if(!nextEntry){S.challengeTransitioning=false;S.challengeTransitionStartedAt=0;return;}
 const entryMeta=challengeEntryMeta(nextEntry);
 endMechanicTrace("duration-complete");
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
 const combatLine=(S.challengeType==="combat"||S.challengeType==="combatflow"||S.challengeType==="mechanic"||S.challengeType==="strafe")&&S.combatConceptsPracticed.length
  ?`Combat mechanics: ${S.combatConceptsPracticed.join(", ")}.`
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
 const preserveChallengeScenarioPreset=S.challengeMode&&["strafe","combatflow"].includes(S.challengeType);
 clearActiveDrillState({resetController:true,resetPromptUi:true,preserveSimultaneousReleaseGate,resetChallengePreset:!preserveChallengeScenarioPreset});
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
   S.continuousModeLastFrame=S.trackingStart;
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
   S.continuousModeLastFrame=S.trackingStart;
  const now=S.trackingStart;
  S.reactiveLeft={x:-.25,y:.1,vx:.35,vy:-.2,nextChange:now+300,nextJump:now+1400,pauseUntil:0};
  S.reactiveRight={x:.25,y:-.1,vx:-.3,vy:.25,nextChange:now+450,nextJump:now+1700,pauseUntil:0};
  S.roundLimit=trackingIntervalMs();
  S.deadline=S.trackingEnd;
 }
 else if(S.mode==="gamescenario"){
  const now=performance.now();
  const selected=resolveCombatScenarioId(preserveChallengeScenarioPreset?S.challengeScenarioPreset:$("gameScenarioType").value);
  const scenario=selected==="mixed"?COMBAT_SCENARIOS[Math.floor(Math.random()*COMBAT_SCENARIOS.length)].id:selected;
  const entry=getCombatScenarioEntry(scenario);
  S.currentCombatMechanicId=null;
  const mechanic=getCombatMechanic(entry);
  const movementPattern=isCombatDrill()?selectCombatMovementPattern(mechanic.id):null;
  const flowScenario=isCombatFlowDrill()?entry:null;
  const activationCount=S.combatActivationCounts[mechanic.id]||0;
  S.combatRoleSwap=!!(mechanic.motion.alternateRoles&&activationCount%2===1);
  S.combatActivationCounts[mechanic.id]=activationCount+1;
  S.scenarioMotionStartedAt=now;
  S.scenarioName=scenario;
  S.weaponStyle="";
  S.conceptName=entry?.label||"";
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
  S.scenarioLeft={x:0,y:0,vx:0,vy:0,targetVx:0,targetVy:0,speed:0,targetX:0,targetY:0,nextChange:now+650};
  S.scenarioRight={x:0,y:0,vx:0,vy:0,targetVx:0,targetVy:0,speed:0,targetX:0,targetY:0,nextChange:now+420,nextJump:now+1400};
  let movementDirection;
  if(flowScenario){
   const flowTargets=authoredCombatFlowTargets(flowScenario,now);
   S.scenarioLeft.x=S.scenarioLeft.targetX=flowTargets.left.x;
   S.scenarioLeft.y=S.scenarioLeft.targetY=flowTargets.left.y;
   S.scenarioRight.x=S.scenarioRight.targetX=flowTargets.right.x;
   S.scenarioRight.y=S.scenarioRight.targetY=flowTargets.right.y;
   movementDirection=Math.sign(flowTargets.left.x)||1;
  }else if(movementPattern){
   const movementConfig=activeCombatMovementPatternConfig(movementPattern);
    const movementPatternBand=activeCombatMovementPatternBand(movementPattern);
    const movementBand=combatUsableBand(movementPatternBand[0],movementPatternBand[1]);
   const movementTarget=combatMovementPatternTarget(movementConfig,now,movementBand);
   const aimTarget=sampleCombatAimTask(mechanic,Math.sign(movementTarget.x)||1);
   S.scenarioLeft.x=S.scenarioLeft.targetX=movementTarget.x;
   S.scenarioLeft.y=S.scenarioLeft.targetY=movementTarget.y;
   S.scenarioRight.x=S.scenarioRight.targetX=aimTarget.rightX;
   S.scenarioRight.y=S.scenarioRight.targetY=aimTarget.rightY;
   movementDirection=Math.sign(movementTarget.x)||1;
  }else{
   movementDirection=applyCombatTargets(entry,amount,{immediate:true});
  }
  S.stickTargets[0].angle=(Math.atan2(S.scenarioLeft.y,S.scenarioLeft.x)*180/Math.PI+360)%360;
  S.stickTargets[0].distance=Math.hypot(S.scenarioLeft.x,S.scenarioLeft.y);
  S.stickTargets[1].angle=(Math.atan2(S.scenarioRight.y,S.scenarioRight.x)*180/Math.PI+360)%360;
  S.stickTargets[1].distance=Math.hypot(S.scenarioRight.x,S.scenarioRight.y);
  {
  const motion=activeCombatMotion(mechanic);
   const baseMovementSpeed=.11+1.78*.09;
    const movementSpeed=baseMovementSpeed*(movementPattern?activeCombatMovementPatternConfig(movementPattern).speed:motion.leftSpeed);
   const aimSpeed=baseMovementSpeed*motion.rightSpeed;
   const movementAngle=(movementDirection<0?Math.PI:0)+(Math.random()-.5)*.45;
  S.scenarioLeft.targetVx=Math.cos(movementAngle)*movementSpeed;
  S.scenarioLeft.targetVy=Math.sin(movementAngle)*movementSpeed;
  const entryScale=motion.entryFloor||1;
  S.scenarioLeft.vx=S.scenarioLeft.targetVx*entryScale;
  S.scenarioLeft.vy=S.scenarioLeft.targetVy*entryScale;
   S.scenarioLeft.speed=movementSpeed;
  S.scenarioLeft.nextChange=now+motion.changeMin+Math.random()*(motion.changeMax-motion.changeMin);
  const aimAngle=motion.relation==="opposite"||motion.relation==="counter"
   ?movementAngle+Math.PI
   :motion.relation==="independent"?Math.random()*Math.PI*2:movementAngle+(motion.offset||0);
  S.scenarioRight.targetVx=Math.cos(aimAngle)*aimSpeed;
  S.scenarioRight.targetVy=Math.sin(aimAngle)*aimSpeed;
  S.scenarioRight.vx=S.scenarioRight.targetVx*entryScale;
  S.scenarioRight.vy=S.scenarioRight.targetVy*entryScale;
  S.scenarioRight.speed=aimSpeed;
  const rightChangeScale=motion.rightChangeScale||1;
  S.scenarioRight.nextChange=now+(motion.changeMin+Math.random()*(motion.changeMax-motion.changeMin))*rightChangeScale;
  }
  S.continuousModeLastFrame=now;
  beginMechanicTrace(now);
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
 awardCompletionScore(S.mode,ms);
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
    requestChallengeTransition("target-complete");
    return;
   }
  }
  if(S.challengeSwitchPending){requestChallengeTransition("switch-pending");return}
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
 awardCompletionScore(S.mode,ms);
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
    requestChallengeTransition("target-complete");
    return;
   }
  }
  if(S.challengeSwitchPending){requestChallengeTransition("switch-pending");return}
 }
 render();
}
function failRound(options={}){
 if(!S.running||S.paused)return;
 S.misses++;S.currentCombo=0;S.lastMissAt=performance.now();S.successWindow.push(false);
 recordChallengeOutcome(activeChallengeEntryKey(),false);
 if(!options.silent)tone(false);persist();updateUI();
 if(S.challengeMode&&S.challengeSwitchPending){requestChallengeTransition("switch-pending");return}
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
  if(isSummaryOpen()&&b===9){
   restartSessionFromResults();
   return;
  }
  if(isSummaryOpen()&&b===1){
   closeSummaryOverlay();
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
 awardButtonInputScore(now-S.start);
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

function setTargetArrow(id,a,d){
 const arrow=$(id);
 if(!arrow)return;
 if(d<=0){arrow.classList.add("hidden");return;}
 const g=targetGeometry(),rad=a*Math.PI/180;
 const offset=28;
 let x=g.center+Math.cos(rad)*(g.radius*d+offset);
 let y=g.center+Math.sin(rad)*(g.radius*d+offset);
 const side=id.startsWith("left")?"left":"right";
 ({x,y}=applyVisualOffset(side,x,y));
 arrow.style.left=x+"px";
 arrow.style.top=y+"px";
 arrow.style.transform=`translate(-50%,-50%) rotate(${a+45}deg)`;
 arrow.classList.remove("hidden");
}

function setTargetArrowVisibility(showLeft,showRight){
 $("leftTargetArrow")?.classList.toggle("hidden",!showLeft);
 $("rightTargetArrow")?.classList.toggle("hidden",!showRight);
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
 if(id==="leftTargetDot")setTargetArrow("leftTargetArrow",a,d);
 else if(id==="rightTargetDot")setTargetArrow("rightTargetArrow",a,d);
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
 setTargetArrowVisibility(false,false);
 updateArenaClarity(false,false);
 $("sharedArena")?.classList.remove("both-on");
 let lt=S.stickTargets.find(t=>t.side==="ls"),rt=S.stickTargets.find(t=>t.side==="rs");
 const combatMode=["strafeaim","dualtrack","reactivetrack","gamescenario"].includes(S.mode);
 const combatScenario=S.mode==="gamescenario";
 const combatDescriptor=getCombatScenarioDescriptor();
 const combatMechanic=combatScenario?getCombatMechanicById(S.currentCombatMechanicId||getCombatScenarioEntry(S.scenarioName||S.challengeScenarioPreset||($("gameScenarioType")?.value))?.mechanics?.[0]):null;
 const badgeLabel=S.mode==="dualtrack"?"TRACK BOTH":S.mode==="reactivetrack"?"TRACK":"MOVE + AIM";
 const contextLabel=S.mode==="dualtrack"?"DUAL TRACKING":
  S.mode==="reactivetrack"?"REACTIVE TRACKING":
  S.mode==="strafeaim"?"STRAFE + AIM":
  isCombatFlowDrill()?combatDescriptor.conceptName:
  isCombatCompositionDrill()?combatDescriptor.movementPatternName:
  S.challengeMode&&["mechanic","strafe"].includes(S.challengeType)?combatDescriptor.conceptName:
  `COMBAT · ${combatDescriptor.conceptName}`;
 S.weaponStyle=combatDescriptor.weaponStyle;
 S.conceptName=combatDescriptor.conceptName;
 $("stickModeBanner").classList.toggle("hidden",!combatMode);
 $("combatMechanicLabel").classList.toggle("hidden",!isCombatCompositionDrill());
 $("combatCueLabel").classList.toggle("hidden",!combatScenario);
 $("combatPromptBadge").classList.toggle("hidden",!combatMode);
 $("combatPromptBadge").textContent=combatMode?badgeLabel:"";
 $("stickModeBanner").textContent=combatMode?contextLabel:"";
 $("combatMechanicLabel").textContent=isCombatCompositionDrill()?combatDescriptor.conceptName:"";
 $("combatCueLabel").textContent=combatScenario?(combatDescriptor.coachingCue||combatMechanic?.coachingCue||"").toUpperCase():"";
 $("stickModeBanner").classList.toggle("hud-context-label",combatMode);
 $("stickModeBanner").classList.toggle("reactive",S.mode==="reactivetrack");
 $("stickModeBanner").classList.toggle("scenario",S.mode==="gamescenario");
 $("trackingScorePanel").classList.toggle("hidden",!["strafeaim","dualtrack","reactivetrack","gamescenario"].includes(S.mode));
 $("trackingScorePanel").classList.toggle("reactive",S.mode==="reactivetrack");
 $("trackingScorePanel").classList.toggle("scenario",S.mode==="gamescenario");
 const showDirectionalArrows=["sticks","dualsticks","strafeaim","gamescenario"].includes(S.mode);

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
 setTargetArrowVisibility(showDirectionalArrows&&!!lt,showDirectionalArrows&&!!rt);

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
 const left=S.scenarioLeft;
 const right=S.scenarioRight;
 const mechanic=activeCombatMechanic();
 const motion=activeCombatMotion(mechanic);
 const flowScenario=isCombatFlowDrill()?activeCombatFlowScenario():null;
 const movementPattern=isCombatCompositionDrill()?activeCombatMovementPatternConfig():null;
 const dt=Math.min(.05,Math.max(0,(now-S.continuousModeLastFrame)/1000));
 const leftBandConfig=flowScenario?authoredCombatFlowBand("left"):movementPattern?activeCombatMovementPatternBand(movementPattern):combatBandForSide(mechanic,"left");
 const rightBandConfig=flowScenario?authoredCombatFlowBand("right"):combatBandForSide(mechanic,"right");
 const leftBand=combatUsableBand(leftBandConfig[0],leftBandConfig[1]);
 const rightBand=combatUsableBand(rightBandConfig[0],rightBandConfig[1]);
 const pathTargets=flowScenario?authoredCombatFlowTargets(flowScenario,now):combatParameterizedTargets(mechanic,motion,now,leftBand,rightBand);
 if(movementPattern)pathTargets.left=combatMovementPatternTarget(movementPattern,now,leftBand);

 const velocityBlend=Math.min(1,dt*2.4);
 if(pathTargets.left){
  advanceCombatPathBody(left,pathTargets.left,motion,dt);
 }else{
  if(now>=left.nextChange){
   const currentAngle=Math.atan2(left.targetVy,left.targetVx);
   const nextAngle=motion.reverse?currentAngle+Math.PI+(Math.random()-.5)*motion.turn:currentAngle+(Math.random()-.5)*motion.turn;
   left.targetVx=Math.cos(nextAngle)*left.speed;
   left.targetVy=Math.sin(nextAngle)*left.speed;
   left.nextChange=now+motion.changeMin+Math.random()*(motion.changeMax-motion.changeMin);
  }
  const leftSpeedScale=combatMotionSpeedScale(left,leftBand,motion,now);
  left.vx+=(left.targetVx*leftSpeedScale-left.vx)*velocityBlend;
  left.vy+=(left.targetVy*leftSpeedScale-left.vy)*velocityBlend;
  left.x+=left.vx*dt;
  left.y+=left.vy*dt;
 }

 const leftDistance=Math.hypot(left.x,left.y);
 if(leftDistance>leftBand.max||leftDistance<leftBand.min){
  const boundary=leftDistance>leftBand.max?leftBand.max:leftBand.min;
  const normalX=leftDistance?left.x/leftDistance:1;
  const normalY=leftDistance?left.y/leftDistance:0;
  left.x=normalX*boundary;
  left.y=normalY*boundary;
  const outward=left.vx*normalX+left.vy*normalY;
  const shouldReflect=(leftDistance>leftBand.max&&outward>0)||(leftDistance<leftBand.min&&outward<0);
  if(shouldReflect){
    const reflection=motion.boundaryResponse||1.35;
    left.vx-=reflection*outward*normalX;
    left.vy-=reflection*outward*normalY;
   left.targetVx=left.vx;
   left.targetVy=left.vy;
  }
 }

 if(pathTargets.right){
  advanceCombatPathBody(right,pathTargets.right,motion,dt);
 }else if(motion.relation==="independent"){
  if(now>=right.nextChange){
   const currentAngle=Math.atan2(right.targetVy,right.targetVx);
   const nextAngle=currentAngle+(Math.random()-.5)*motion.turn;
   right.targetVx=Math.cos(nextAngle)*right.speed;
   right.targetVy=Math.sin(nextAngle)*right.speed;
  const rightChangeScale=motion.rightChangeScale||1;
  right.nextChange=now+(motion.changeMin+Math.random()*(motion.changeMax-motion.changeMin))*rightChangeScale;
  }
  const rightSpeedScale=combatMotionSpeedScale(right,rightBand,motion,now);
  right.vx+=(right.targetVx*rightSpeedScale-right.vx)*velocityBlend;
  right.vy+=(right.targetVy*rightSpeedScale-right.vy)*velocityBlend;
 }else{
  const relationSign=motion.relation==="opposite"||motion.relation==="counter"?-1:1;
  const leadSeconds=motion.leadSeconds||0;
  const offset=motion.offset||0;
  const baseGuideX=(left.x+left.vx*leadSeconds)*relationSign;
  const baseGuideY=(left.y+left.vy*leadSeconds)*relationSign;
  const guideAngle=Math.atan2(baseGuideY,baseGuideX)+offset;
  const counterOffset=motion.relation==="counter"?(motion.counterOffset||.16):0;
  const guideX=Math.cos(guideAngle)+Math.cos(guideAngle+Math.PI/2)*counterOffset;
  const guideY=Math.sin(guideAngle)+Math.sin(guideAngle+Math.PI/2)*counterOffset;
  const guideDistance=Math.hypot(guideX,guideY)||1;
  const rightRadius=Math.max(rightBand.min,Math.min(rightBand.max,Math.hypot(right.targetX,right.targetY)||((rightBand.min+rightBand.max)/2)));
  const desiredRightX=guideX/guideDistance*rightRadius;
  const desiredRightY=guideY/guideDistance*rightRadius;
  right.vx+=(desiredRightX-right.x)*motion.response*dt;
  right.vy+=(desiredRightY-right.y)*motion.response*dt;
 }
 const rightVelocity=Math.hypot(right.vx,right.vy);
 const rightSpeedLimit=right.speed*combatMotionSpeedScale(right,rightBand,motion,now);
 if(rightVelocity>rightSpeedLimit){
  right.vx=right.vx/rightVelocity*rightSpeedLimit;
  right.vy=right.vy/rightVelocity*rightSpeedLimit;
 }
 right.x+=right.vx*dt;
 right.y+=right.vy*dt;
 const rightDistance=Math.hypot(right.x,right.y);
 if(rightDistance>rightBand.max||rightDistance<rightBand.min){
  const boundary=rightDistance>rightBand.max?rightBand.max:rightBand.min;
  const normalX=rightDistance?right.x/rightDistance:1;
  const normalY=rightDistance?right.y/rightDistance:0;
  right.x=normalX*boundary;
  right.y=normalY*boundary;
  const outward=right.vx*normalX+right.vy*normalY;
  const shouldReflect=(rightDistance>rightBand.max&&outward>0)||(rightDistance<rightBand.min&&outward<0);
  if(shouldReflect){
    const reflection=motion.boundaryResponse||1.35;
    right.vx-=reflection*outward*normalX;
    right.vy-=reflection*outward*normalY;
   right.targetVx=right.vx;
   right.targetVy=right.vy;
  }
 }
 updateMechanicTraceBounds(left,right);
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

 if(isContinuousTrackingMode()){
  const radius=+$("trackingTargetSize").value;
  const combatProfile=S.mode==="gamescenario"?combatDifficultyProfile():null;
  const combatToleranceScale=combatProfile?.trackingTolerance||1;
  const lt=S.stickTargets[0],rt=S.stickTargets[1];
  const lp={x:Math.cos(lt.angle*Math.PI/180)*lt.distance,y:Math.sin(lt.angle*Math.PI/180)*lt.distance};
  const rp={x:Math.cos(rt.angle*Math.PI/180)*rt.distance,y:Math.sin(rt.angle*Math.PI/180)*rt.distance};
  const leftRadius=S.mode==="gamescenario"?+$("leftStickLeniency").value*COMBAT_TRACKING_TOLERANCE_SCALE*combatToleranceScale:
   S.mode==="strafeaim"?Math.max(.17,radius*1.45):radius;
  const rightRadius=S.mode==="gamescenario"?Math.max(.065,radius*.78*COMBAT_TRACKING_TOLERANCE_SCALE)*combatToleranceScale:
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
    S.sessionTrackingElapsedMs+=dt;
  if(S.mode==="gamescenario"||S.mode==="strafeaim"){
   if(leftOn)S.scenarioLeftOnMs+=dt;
   if(rightOn)S.scenarioRightOnMs+=dt;
     if(leftOn&&rightOn){
      S.trackingOnTargetMs+=dt;
      S.sessionTrackingOnTargetMs+=dt;
      awardTrackingScore(dt);
     }
    }else if(leftOn&&rightOn){
     S.trackingOnTargetMs+=dt;
     S.sessionTrackingOnTargetMs+=dt;
     awardTrackingScore(dt);
    }
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

function refreshSupplementalPanels(){
 const analysisKey=`${S.sessionInputs}|${S.transitionTimes.length}|${S.hits}|${S.misses}`;
 if(S.analysisRenderKey!==analysisKey){
  S.analysisRenderKey=analysisKey;
  updateAnalysis();
 }
 const challengeKey=`${S.hits}|${S.misses}|${S.longestCombo}|${S.peakApm}`;
 if(S.challengeRenderKey!==challengeKey){
  S.challengeRenderKey=challengeKey;
  updateChallenges();
 }
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
 updateScoreDisplay();$("peakApm").textContent=S.peakApm;$("accuracy").textContent=acc+"%";
 $("currentCombo").textContent=S.currentCombo;$("longestCombo").textContent=S.longestCombo;
 $("avgTransition").textContent=S.transitionTimes.length?Math.round(average(S.transitionTimes))+" ms":"—";
 $("sessionInputs").textContent=S.sessionInputs;$("sessionSequences").textContent=S.sessionSequences;
 $("bestSequence").textContent=S.bestSequence?S.bestSequence+" ms":"—";$("hesitations").textContent=S.hesitations;
 $("recoveryTime").textContent=S.recoveryTimes.length?Math.round(average(S.recoveryTimes))+" ms":"—";
 $("pressureLabel").textContent=pressureName(S.roundLimit||baseLimit());$("timeLabel").textContent=pressureName(baseLimit());
 refreshSupplementalPanels();
}
function startSession(){
 S.running=true;S.paused=false;S.hits=0;S.misses=0;S.sessionInputs=0;S.sessionSequences=0;
 S.sessionStart=performance.now();S.currentCombo=0;S.peakApm=0;S.inputTimes=[];S.transitionTimes=[];
 S.hesitations=0;S.recoveryTimes=[];S.lastMissAt=null;S.successWindow=[];S.lastInputAt=null;
 S.analysisRenderKey="";S.challengeRenderKey="";
 S.currentCombatMechanicId=null;S.combatMechanicHistory=[];S.currentMovementPatternId=null;S.combatDrillHistory=[];S.combatActivationCounts={};S.combatRoleSwap=false;
 S.sessionTrackingOnTargetMs=0;S.sessionTrackingElapsedMs=0;
 resetSessionScore();
 S.infiniteSession=isInfiniteEligibleMode()&&$("infiniteStickSession").checked;
 S.sessionEnd=S.infiniteSession?Infinity:S.sessionStart+sessionLengthMs();
 if(S.challengeMode){
  beginChallengeMode();
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
function isSummaryOpen(){
 return !$("summaryModal").classList.contains("hidden");
}

function closeSummaryOverlay(){
 if(S.resultsActionLocked||!isSummaryOpen())return;
 $("summaryModal").classList.add("hidden");
}

function restartSessionFromResults(){
 if(S.resultsActionLocked||!isSummaryOpen())return;
 S.resultsActionLocked=true;
 $("summaryModal").classList.add("hidden");
 S.challengeSessionFinalized=false;
 S.scoreFinalized=false;
 startSession();
 S.resultsActionLocked=false;
}

function finalizeChallengeResults(){
 if(!S.challengeMode||S.challengeSessionFinalized)return;
 S.challengeSessionFinalized=true;
 endMechanicTrace("session-complete");
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
 finalizeSessionScore();
 clearTrails();S.running=false;S.paused=false;
 clearActiveDrillState({resetController:false,resetPromptUi:true,resetChallengePreset:false});
 if(S.challengeMode){finalizeChallengeResults();return}
 S.lifeSessions++;persist();render();updateCoach();showReport();
}
function showReport(){
 let total=S.hits+S.misses,acc=total?Math.round(S.hits/total*100):100;
 let duration=Math.max(1,(performance.now()-S.sessionStart)/60000),avgApm=Math.round(S.sessionInputs/duration);
 $("reportScore").textContent=formatWholeNumber(S.sessionScore);$("reportAccuracy").textContent=acc+"%";
 $("reportPace").textContent=formatWholeNumber(avgApm);$("reportCombo").textContent=S.longestCombo;$("reportOnTarget").textContent=formatOnTargetReport();
 $("reportRecommendation").textContent=$("coachText").textContent;
 if(S.challengeMode){
  const typeMeta=challengeTypeMeta();
  $("summaryTitle").textContent=`${typeMeta.label} Complete`;
  $("retrySessionBtn").textContent=`Restart ${typeMeta.label}`;
  $("closeSummaryBtn").textContent="Close";
  updateChallengeSummary();
 }else{
  $("summaryTitle").textContent="Session Complete";
  $("retrySessionBtn").textContent="Retry";
  $("closeSummaryBtn").textContent="Close";
  $("challengeSummary").classList.add("hidden");
 }
 $("summaryControlsHint").textContent=`START - ${$("retrySessionBtn").textContent}   B - Close`;
 S.resultsActionLocked=false;
 $("summaryModal").classList.remove("hidden");
}
function frame(now){
 if(S.challengeMode&&S.challengeTransitioning&&S.challengeTransitionStartedAt&&now>=S.challengeTransitionStartedAt+120){
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
  requestChallengeTransition("fallback");
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
    requestChallengeTransition("continuous-boundary");
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

function bindStartupEvents(){
document.querySelectorAll(".nav").forEach(b=>b.onclick=()=>{
 endMechanicTrace("mode-change");
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
$("closeSummaryBtn").onclick=closeSummaryOverlay;
$("retrySessionBtn").onclick=restartSessionFromResults;
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
}

function initializeSettings(){
bindStartupEvents();
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
return startupUsesChallenge;
}

function initializeControllerPolling(){
 window.addEventListener("gamepadconnected",handleGamepadConnected);
 window.addEventListener("gamepaddisconnected",handleGamepadDisconnected);
 const gamepad=getActiveGamepad();
 if(!gamepad)return;
 S.controllerIndex=gamepad.index;
 S.controllerConnected=true;
 S.controllerLabel=gamepad.id||"";
 resetControllerState();
 updateControllerStatus(true,S.controllerLabel||"Controller connected");
}

function initializeSessionState(startupUsesChallenge){
updateContextualSettings();
applyTrainingLayout();
updateModeSelectionUI();
if(startupUsesChallenge && !S.running){beginChallengeMode();}
updateUI();
render();
}

let frameLoopStarted=false;
function startFrameLoop(){
 if(frameLoopStarted)return;
 try{
  frameLoopStarted=true;
  requestAnimationFrame(frame);
 }catch(error){
  frameLoopStarted=false;
  console.error("Frame loop failed to start",error);
 }
}

function initializeApp(){
 const requiredIds=["trainerPanel","timerFill","trackingRoundFill","trackingTimeRemaining","sessionDuration"];
 const missingIds=requiredIds.filter(id=>!$(id));
 if(missingIds.length)console.error("Missing required DOM element(s): "+missingIds.join(", "));

 let startupUsesChallenge=false;
 try{
  startupUsesChallenge=initializeSettings();
 }catch(error){
  console.error("Settings initialization failed",error);
 }
 try{
  initializeControllerPolling();
 }catch(error){
  console.error("Controller polling failed to initialize",error);
 }
 try{
  initializeSessionState(startupUsesChallenge);
 }catch(error){
  console.error("Session initialization failed",error);
 }
 startFrameLoop();
 window.addEventListener("beforeunload",saveV8Settings);
}

if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",initializeApp,{once:true});
else initializeApp();
