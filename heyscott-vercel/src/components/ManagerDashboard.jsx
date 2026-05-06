import { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { C, R, Sh, F } from '../constants/design.js';
import { callAPI, parseJSON } from '../services/api.js';
import { loadProfile, loadTeamData, saveTeamData, loadManagerInbox, markInboxRead, loadManagerEmail, saveManagerEmail, loadManagerReport, saveManagerReport } from '../utils/storage.js';

const MOCK_TEAM = [
  { id:101, name:"Jamie Chen",        ini:"JC", col:"#5B8DB8", role:"Senior Recruiter",  focus:"Tech & Engineering",
    bh:[{w:"W6",o:0.45,d:0.40,l:0.50,ob:0.35,cl:0.30},{w:"W5",o:0.50,d:0.45,l:0.55,ob:0.40,cl:0.35},{w:"W4",o:0.55,d:0.50,l:0.60,ob:0.45,cl:0.40},{w:"W3",o:0.62,d:0.55,l:0.65,ob:0.50,cl:0.45},{w:"W2",o:0.68,d:0.62,l:0.70,ob:0.57,cl:0.52},{w:"W1",o:0.75,d:0.68,l:0.76,ob:0.63,cl:0.58}],
    ch:[{s:1,c:3,b:55},{s:2,c:3,b:58},{s:3,c:3,b:60},{s:4,c:4,b:63},{s:5,c:4,b:67},{s:6,c:4,b:70},{s:7,c:4,b:72},{s:8,c:4,b:74},{s:9,c:5,b:75},{s:10,c:5,b:76}],
    avgConf:4.0, avgSkill:67, energy:[4,4,3,5,4,4,5,4,3,4,5,4,4,5], avgEnergy:4.1,
    sessW:4, sessLW:3, lastActive:0, status:"improving", quad:"on_track", flag:null, score:74, rpc:10 },

  { id:102, name:"Sarah O'Brien",     ini:"SO", col:"#A090CC", role:"Recruiter",          focus:"Accounting & Finance",
    bh:[{w:"W6",o:0.55,d:0.38,l:0.58,ob:0.42,cl:0.36},{w:"W5",o:0.56,d:0.37,l:0.58,ob:0.43,cl:0.37},{w:"W4",o:0.57,d:0.38,l:0.59,ob:0.42,cl:0.36},{w:"W3",o:0.56,d:0.39,l:0.57,ob:0.41,cl:0.37},{w:"W2",o:0.57,d:0.38,l:0.58,ob:0.42,cl:0.36},{w:"W1",o:0.58,d:0.37,l:0.59,ob:0.43,cl:0.37}],
    ch:[{s:1,c:4,b:60},{s:2,c:4,b:60},{s:3,c:4,b:61},{s:4,c:4,b:60},{s:5,c:4,b:61},{s:6,c:4,b:60},{s:7,c:4,b:61},{s:8,c:4,b:62},{s:9,c:4,b:61},{s:10,c:4,b:62}],
    avgConf:4.0, avgSkill:61, energy:[3,4,3,4,3,4,3,4,3,4,3,4,3,4], avgEnergy:3.5,
    sessW:3, sessLW:3, lastActive:1, status:"plateau", quad:"on_track", flag:null, score:61, rpc:10 },

  { id:103, name:"Marcus Lee",        ini:"ML", col:"#C48A4A", role:"Senior Recruiter",   focus:"Sales & BD",
    bh:[{w:"W6",o:0.80,d:0.72,l:0.78,ob:0.68,cl:0.74},{w:"W5",o:0.78,d:0.70,l:0.76,ob:0.66,cl:0.72},{w:"W4",o:0.74,d:0.67,l:0.73,ob:0.63,cl:0.68},{w:"W3",o:0.68,d:0.62,l:0.68,ob:0.57,cl:0.62},{w:"W2",o:0.61,d:0.56,l:0.62,ob:0.50,cl:0.54},{w:"W1",o:0.55,d:0.50,l:0.57,ob:0.44,cl:0.48}],
    ch:[{s:1,c:5,b:80},{s:2,c:5,b:78},{s:3,c:5,b:76},{s:4,c:5,b:73},{s:5,c:4,b:70},{s:6,c:4,b:67},{s:7,c:4,b:64},{s:8,c:4,b:61},{s:9,c:4,b:58},{s:10,c:4,b:55}],
    avgConf:4.4, avgSkill:62, energy:[4,4,5,4,4,3,4,4,5,4,4,4,5,4], avgEnergy:4.2,
    sessW:3, sessLW:4, lastActive:2, status:"regressing", quad:"overconfident", flag:null, score:62, rpc:10,
    regressionSkill:"Opening & Close", regressionNote:"Opening scores dropped from 80% → 55% over 6 weeks. Confidence remains high — classic overconfidence blind spot." },

  { id:104, name:"Priya Sharma",      ini:"PS", col:"#7B9E6A", role:"Recruiter",          focus:"Healthcare & Allied",
    bh:[{w:"W6",o:0.32,d:0.28,l:0.38,ob:0.25,cl:0.22},{w:"W5",o:0.38,d:0.34,l:0.43,ob:0.30,cl:0.28},{w:"W4",o:0.45,d:0.40,l:0.50,ob:0.37,cl:0.34},{w:"W3",o:0.53,d:0.48,l:0.58,ob:0.44,cl:0.41},{w:"W2",o:0.62,d:0.55,l:0.66,ob:0.52,cl:0.48},{w:"W1",o:0.70,d:0.63,l:0.74,ob:0.60,cl:0.56}],
    ch:[{s:1,c:2,b:35},{s:2,c:2,b:40},{s:3,c:2,b:46},{s:4,c:3,b:52},{s:5,c:3,b:57},{s:6,c:3,b:62},{s:7,c:3,b:66},{s:8,c:3,b:69},{s:9,c:3,b:72},{s:10,c:3,b:70}],
    avgConf:2.7, avgSkill:57, energy:[3,3,4,3,4,4,3,4,4,5,4,4,5,4], avgEnergy:3.9,
    sessW:5, sessLW:4, lastActive:0, status:"improving", quad:"hidden_gem", flag:null, score:61, rpc:10,
    hiddenGemNote:"Skill improving fast but confidence hasn't caught up yet. Needs positive reinforcement this week." },

  { id:105, name:"Tom Walsh",         ini:"TW", col:"#6B8A7C", role:"Recruiter",          focus:"Construction & Infra",
    bh:[{w:"W6",o:0.60,d:0.55,l:0.65,ob:0.50,cl:0.45},{w:"W5",o:0.62,d:0.56,l:0.66,ob:0.51,cl:0.46},{w:"W4",o:0.61,d:0.55,l:0.65,ob:0.50,cl:0.45},{w:"W3",o:0.63,d:0.57,l:0.67,ob:0.52,cl:0.47},{w:"W2",o:0.62,d:0.56,l:0.66,ob:0.51,cl:0.46},{w:"W1",o:0.64,d:0.57,l:0.68,ob:0.53,cl:0.47}],
    ch:[{s:1,c:4,b:63},{s:2,c:4,b:64},{s:3,c:4,b:63},{s:4,c:4,b:65},{s:5,c:4,b:64},{s:6,c:4,b:63},{s:7,c:4,b:65},{s:8,c:4,b:64},{s:9,c:4,b:65},{s:10,c:4,b:64}],
    avgConf:4.0, avgSkill:64, energy:[4,3,4,4,3,0,0,0,0,0,0,0,0,0], avgEnergy:2.7,
    sessW:0, sessLW:3, lastActive:6, status:"stable", quad:"on_track", flag:"inactive", score:64, rpc:10,
    flagNote:"6 days without a session. Last energy check-in was 4/5 before the gap — reach out to check in." },

  { id:106, name:"Amy Davidson",      ini:"AD", col:"#C4839A", role:"Senior Recruiter",   focus:"Marketing & Comms",
    bh:[{w:"W6",o:0.42,d:0.38,l:0.46,ob:0.34,cl:0.30},{w:"W5",o:0.50,d:0.45,l:0.54,ob:0.41,cl:0.37},{w:"W4",o:0.58,d:0.52,l:0.62,ob:0.48,cl:0.44},{w:"W3",o:0.65,d:0.58,l:0.69,ob:0.55,cl:0.51},{w:"W2",o:0.71,d:0.65,l:0.75,ob:0.61,cl:0.57},{w:"W1",o:0.78,d:0.72,l:0.80,ob:0.68,cl:0.64}],
    ch:[{s:1,c:3,b:44},{s:2,c:3,b:50},{s:3,c:4,b:57},{s:4,c:4,b:63},{s:5,c:4,b:68},{s:6,c:4,b:72},{s:7,c:4,b:75},{s:8,c:5,b:78},{s:9,c:5,b:79},{s:10,c:5,b:80}],
    avgConf:4.1, avgSkill:67, energy:[4,5,4,5,5,4,5,5,4,5,4,5,5,4], avgEnergy:4.6,
    sessW:5, sessLW:4, lastActive:0, status:"improving", quad:"on_track", flag:null, score:72, rpc:10 },

  { id:107, name:"Ryan Carter",       ini:"RC", col:"#8A6F98", role:"Recruiter",           focus:"Legal",
    bh:[{w:"W6",o:0.65,d:0.58,l:0.68,ob:0.55,cl:0.50},{w:"W5",o:0.62,d:0.52,l:0.64,ob:0.50,cl:0.45},{w:"W4",o:0.57,d:0.45,l:0.59,ob:0.43,cl:0.38},{w:"W3",o:0.50,d:0.38,l:0.53,ob:0.36,cl:0.31},{w:"W2",o:0.44,d:0.32,l:0.47,ob:0.30,cl:0.25},{w:"W1",o:0.38,d:0.27,l:0.41,ob:0.24,cl:0.19}],
    ch:[{s:1,c:3,b:62},{s:2,c:3,b:58},{s:3,c:2,b:53},{s:4,c:2,b:48},{s:5,c:2,b:43},{s:6,c:2,b:39},{s:7,c:2,b:35},{s:8,c:2,b:32},{s:9,c:2,b:29},{s:10,c:2,b:28}],
    avgConf:2.2, avgSkill:43, energy:[3,2,2,1,2,1,2,1,2,2,1,1,2,2], avgEnergy:1.7,
    sessW:2, sessLW:4, lastActive:2, status:"regressing", quad:"needs_support", flag:"low_energy", score:43, rpc:10,
    regressionSkill:"Discovery & Close", regressionNote:"All behaviour scores declining for 6 consecutive weeks. Energy averaging 1.7/5 — this needs a 1:1 conversation before more roleplay.",
    hiddenGemNote:null },

  { id:108, name:"Ella Morton",       ini:"EM", col:"#B5956A", role:"Recruiter",           focus:"Property & Real Estate",
    bh:[{w:"W6",o:0.52,d:0.48,l:0.55,ob:0.44,cl:0.40},{w:"W5",o:0.53,d:0.49,l:0.56,ob:0.45,cl:0.41},{w:"W4",o:0.53,d:0.48,l:0.55,ob:0.44,cl:0.40},{w:"W3",o:0.54,d:0.50,l:0.57,ob:0.46,cl:0.42},{w:"W2",o:0.52,d:0.48,l:0.55,ob:0.44,cl:0.40},{w:"W1",o:0.53,d:0.49,l:0.56,ob:0.45,cl:0.41}],
    ch:[{s:1,c:2,b:55},{s:2,c:2,b:55},{s:3,c:2,b:56},{s:4,c:2,b:54},{s:5,c:2,b:55},{s:6,c:2,b:57},{s:7,c:2,b:55},{s:8,c:2,b:56},{s:9,c:2,b:54},{s:10,c:2,b:55}],
    avgConf:2.0, avgSkill:55, energy:[3,3,4,3,3,3,4,3,3,4,3,3,4,3], avgEnergy:3.2,
    sessW:3, sessLW:3, lastActive:1, status:"plateau", quad:"hidden_gem", flag:null, score:55, rpc:10,
    hiddenGemNote:"Consistent skill level but confidence chronically low. Has potential — a confidence-focused coaching session could unlock improvement." },

  { id:109, name:"James Xu",          ini:"JX", col:"#5C7B9E", role:"Senior Recruiter",   focus:"Finance & Banking",
    bh:[{w:"W6",o:0.70,d:0.65,l:0.72,ob:0.62,cl:0.58},{w:"W5",o:0.71,d:0.66,l:0.73,ob:0.63,cl:0.59},{w:"W4",o:0.70,d:0.65,l:0.72,ob:0.62,cl:0.58},{w:"W3",o:0.72,d:0.66,l:0.74,ob:0.63,cl:0.60},{w:"W2",o:0.71,d:0.66,l:0.73,ob:0.63,cl:0.59},{w:"W1",o:0.72,d:0.67,l:0.74,ob:0.63,cl:0.60}],
    ch:[{s:1,c:4,b:71},{s:2,c:4,b:72},{s:3,c:4,b:71},{s:4,c:4,b:72},{s:5,c:4,b:71},{s:6,c:4,b:73},{s:7,c:4,b:72},{s:8,c:4,b:72},{s:9,c:4,b:73},{s:10,c:4,b:72}],
    avgConf:4.0, avgSkill:72, energy:[4,4,4,5,4,4,4,4,5,4,4,4,5,4], avgEnergy:4.2,
    sessW:4, sessLW:4, lastActive:0, status:"stable", quad:"on_track", flag:null, score:72, rpc:10 },

  { id:110, name:"Sophie Blackwell",  ini:"SB", col:"#9E5C5C", role:"Senior Recruiter",   focus:"Executive & C-Suite",
    bh:[{w:"W6",o:0.78,d:0.74,l:0.80,ob:0.76,cl:0.80},{w:"W5",o:0.76,d:0.70,l:0.78,ob:0.72,cl:0.75},{w:"W4",o:0.72,d:0.65,l:0.74,ob:0.65,cl:0.67},{w:"W3",o:0.66,d:0.58,l:0.68,ob:0.55,cl:0.57},{w:"W2",o:0.58,d:0.50,l:0.60,ob:0.46,cl:0.48},{w:"W1",o:0.50,d:0.43,l:0.54,ob:0.38,cl:0.40}],
    ch:[{s:1,c:5,b:80},{s:2,c:5,b:76},{s:3,c:5,b:73},{s:4,c:5,b:69},{s:5,c:5,b:64},{s:6,c:4,b:60},{s:7,c:4,b:56},{s:8,c:4,b:53},{s:9,c:4,b:51},{s:10,c:4,b:50}],
    avgConf:4.5, avgSkill:63, energy:[4,4,5,4,4,4,5,4,4,4,5,4,4,4], avgEnergy:4.2,
    sessW:3, sessLW:5, lastActive:2, status:"regressing", quad:"overconfident", flag:null, score:63, rpc:10,
    regressionSkill:"Close & Objection Handling", regressionNote:"Close rate dropped from 80% → 40% over 6 weeks. High confidence masking the decline. Needs candid conversation." },

  { id:111, name:"Daniel Frost",      ini:"DF", col:"#7A8C6E", role:"Recruiter",           focus:"Supply Chain & Ops",
    bh:[{w:"W6",o:0.35,d:0.30,l:0.40,ob:0.28,cl:0.24},{w:"W5",o:0.42,d:0.37,l:0.46,ob:0.34,cl:0.30},{w:"W4",o:0.50,d:0.45,l:0.54,ob:0.42,cl:0.38},{w:"W3",o:0.58,d:0.52,l:0.62,ob:0.49,cl:0.45},{w:"W2",o:0.65,d:0.60,l:0.69,ob:0.56,cl:0.52},{w:"W1",o:0.72,d:0.66,l:0.75,ob:0.63,cl:0.58}],
    ch:[{s:1,c:3,b:37},{s:2,c:3,b:44},{s:3,c:3,b:51},{s:4,c:4,b:57},{s:5,c:4,b:63},{s:6,c:4,b:68},{s:7,c:4,b:72},{s:8,c:4,b:74},{s:9,c:5,b:75},{s:10,c:5,b:73}],
    avgConf:3.9, avgSkill:61, energy:[4,4,4,5,4,4,4,5,4,4,4,5,4,4], avgEnergy:4.2,
    sessW:5, sessLW:4, lastActive:0, status:"improving", quad:"on_track", flag:null, score:65, rpc:10 },

  { id:112, name:"Mia Nguyen",        ini:"MN", col:"#8E6AB8", role:"Recruiter",           focus:"Nursing & Healthcare",
    bh:[{w:"W6",o:0.34,d:0.30,l:0.37,ob:0.26,cl:0.22},{w:"W5",o:0.35,d:0.29,l:0.38,ob:0.27,cl:0.23},{w:"W4",o:0.35,d:0.30,l:0.38,ob:0.27,cl:0.22},{w:"W3",o:0.34,d:0.29,l:0.37,ob:0.26,cl:0.22},{w:"W2",o:0.35,d:0.30,l:0.38,ob:0.27,cl:0.23},{w:"W1",o:0.34,d:0.29,l:0.37,ob:0.26,cl:0.22}],
    ch:[{s:1,c:2,b:35},{s:2,c:2,b:34},{s:3,c:2,b:35},{s:4,c:2,b:34},{s:5,c:2,b:35},{s:6,c:2,b:34},{s:7,c:2,b:35},{s:8,c:2,b:34},{s:9,c:2,b:35},{s:10,c:2,b:34}],
    avgConf:2.0, avgSkill:35, energy:[2,3,2,3,2,2,3,2,3,2,2,3,2,3], avgEnergy:2.4,
    sessW:2, sessLW:2, lastActive:2, status:"plateau", quad:"needs_support", flag:"low_energy", score:35, rpc:10,
    flagNote:"Stuck at beginner level for 6+ weeks and energy chronically low. Likely needs structured mentoring, not more solo roleplay." },

  { id:113, name:"Connor Reilly",     ini:"CR", col:"#7A7A7A", role:"Recruiter",           focus:"Civil Engineering",
    bh:[{w:"W6",o:0.60,d:0.54,l:0.63,ob:0.50,cl:0.46},{w:"W5",o:0.61,d:0.55,l:0.64,ob:0.51,cl:0.47},{w:"W4",o:0.60,d:0.54,l:0.63,ob:0.50,cl:0.46},{w:"W3",o:0.62,d:0.56,l:0.65,ob:0.52,cl:0.48},{w:"W2",o:0.61,d:0.55,l:0.64,ob:0.51,cl:0.47},{w:"W1",o:0.60,d:0.54,l:0.63,ob:0.50,cl:0.46}],
    ch:[{s:1,c:3,b:60},{s:2,c:3,b:61},{s:3,c:3,b:60},{s:4,c:3,b:61},{s:5,c:3,b:60},{s:6,c:3,b:62},{s:7,c:3,b:61},{s:8,c:3,b:60},{s:9,c:3,b:61},{s:10,c:3,b:60}],
    avgConf:3.0, avgSkill:61, energy:[3,3,4,3,0,0,0,0,0,0,0,0,0,0], avgEnergy:1.9,
    sessW:0, sessLW:3, lastActive:8, status:"stable", quad:"on_track", flag:"inactive", score:60, rpc:10,
    flagNote:"8 days without any activity. Was showing stable progress before going quiet. Priority check-in this week." },

  { id:114, name:"Kira Patel",        ini:"KP", col:"#6B9E8C", role:"Recruiter",           focus:"HR & People",
    bh:[{w:"W6",o:0.28,d:0.24,l:0.32,ob:0.20,cl:0.18},{w:"W5",o:0.36,d:0.31,l:0.40,ob:0.28,cl:0.24},{w:"W4",o:0.45,d:0.40,l:0.49,ob:0.37,cl:0.33},{w:"W3",o:0.54,d:0.48,l:0.58,ob:0.45,cl:0.41},{w:"W2",o:0.63,d:0.56,l:0.67,ob:0.53,cl:0.49},{w:"W1",o:0.72,d:0.65,l:0.75,ob:0.61,cl:0.57}],
    ch:[{s:1,c:2,b:28},{s:2,c:2,b:34},{s:3,c:2,b:42},{s:4,c:2,b:49},{s:5,c:3,b:56},{s:6,c:3,b:62},{s:7,c:3,b:66},{s:8,c:3,b:70},{s:9,c:3,b:72},{s:10,c:3,b:73}],
    avgConf:2.6, avgSkill:55, energy:[4,3,4,4,5,4,4,5,4,5,4,5,4,5], avgEnergy:4.4,
    sessW:6, sessLW:5, lastActive:0, status:"improving", quad:"hidden_gem", flag:null, score:60, rpc:10,
    hiddenGemNote:"Fastest improver on the team — skill up 44pp in 6 weeks. Confidence still lagging behind real gains. Acknowledge progress explicitly." },

  { id:115, name:"Ben Fraser",        ini:"BF", col:"#6B7A8D", role:"Senior Recruiter",   focus:"Digital & Media",
    bh:[{w:"W6",o:0.68,d:0.62,l:0.70,ob:0.58,cl:0.54},{w:"W5",o:0.69,d:0.63,l:0.71,ob:0.59,cl:0.55},{w:"W4",o:0.68,d:0.62,l:0.70,ob:0.58,cl:0.54},{w:"W3",o:0.70,d:0.64,l:0.72,ob:0.60,cl:0.56},{w:"W2",o:0.69,d:0.63,l:0.71,ob:0.59,cl:0.55},{w:"W1",o:0.70,d:0.64,l:0.72,ob:0.60,cl:0.56}],
    ch:[{s:1,c:4,b:69},{s:2,c:4,b:69},{s:3,c:4,b:70},{s:4,c:4,b:69},{s:5,c:4,b:70},{s:6,c:4,b:70},{s:7,c:4,b:70},{s:8,c:4,b:71},{s:9,c:4,b:70},{s:10,c:4,b:71}],
    avgConf:4.0, avgSkill:70, energy:[4,4,4,4,4,4,4,4,4,4,4,4,4,4], avgEnergy:4.0,
    sessW:4, sessLW:4, lastActive:1, status:"stable", quad:"on_track", flag:null, score:70, rpc:10 },
];

/* ── Helpers ── */
const skillKeys = [
  {key:"o",label:"Opening"},
  {key:"d",label:"Discovery"},
  {key:"l",label:"Listening"},
  {key:"ob",label:"Objections"},
  {key:"cl",label:"Close"},
];

export function Sparkline({data, color="#4A3F8C", height=28, width=80}){
  if(!data||data.length<2) return null;
  const min=Math.min(...data), max=Math.max(...data);
  const range=max-min||0.001;
  const pts=data.map((v,i)=>{
    const x=(i/(data.length-1))*width;
    const y=height-((v-min)/range)*(height-4)-2;
    return `${x},${y}`;
  }).join(" ");
  return(
    <svg width={width} height={height} style={{display:"block"}}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={pts.split(" ").pop().split(",")[0]} cy={pts.split(" ").pop().split(",")[1]} r={3} fill={color}/>
    </svg>
  );
}

export function BehaviourSparkline({history, skillKey, color}){
  const vals = history.map(w=>w[skillKey]);
  return <Sparkline data={vals} color={color} height={24} width={64}/>;
}

export function EnergyBar({energy, maxH=20}){
  const col = energy<=0?"#E5E7EB":energy<=2?"#F87171":energy===3?"#FBBF24":energy===4?"#34D399":"#10B981";
  const h = energy<=0 ? 3 : Math.max(4, (energy/5)*maxH);
  return <div style={{width:8,height:maxH,display:"flex",flexDirection:"column",justifyContent:"flex-end"}}><div style={{height:h,background:col,borderRadius:2,transition:"height 0.3s"}}/></div>;
}

export function statusBadge(status){
  const map={
    improving:{bg:"#DCFCE7",c:"#166534",label:"Improving ↑"},
    regressing:{bg:"#FEE2E2",c:"#991B1B",label:"Regressing ↓"},
    plateau:{bg:"#FEF3C7",c:"#854D0E",label:"Plateau →"},
    stable:{bg:"#F3F4F6",c:"#6B7280",label:"Stable"},
  };
  const s=map[status]||map.stable;
  return <span style={{background:s.bg,color:s.c,borderRadius:999,padding:"2px 10px",fontSize:10,fontWeight:700}}>{s.label}</span>;
}

export function quadrantStyle(quad){
  const map={
    on_track:{bg:"#F0FDF4",border:"#BBF7D0",c:"#166534",icon:"✓",label:"On Track"},
    overconfident:{bg:"#FEF3C7",border:"#FDE68A",c:"#92400E",icon:"⚠",label:"Overconfident"},
    hidden_gem:{bg:"#EDE9FE",border:"#C4B5FD",c:"#5B21B6",icon:"💎",label:"Hidden Gem"},
    needs_support:{bg:"#FEE2E2",border:"#FECACA",c:"#991B1B",icon:"🔴",label:"Needs Support"},
  };
  return map[quad]||map.on_track;
}


/* ══════════════════════════════════════════════════════════════
   MANAGER DASHBOARD
══════════════════════════════════════════════════════════════ */
export function ManagerDashboard({go, userId=null}){
  const [activeTab, setActiveTab] = useState("overview");
  const [teamData, setTeamData]   = useState([]);
  const [inboxItems, setInboxItems] = useState([]);
  const [expandedInbox, setExpandedInbox] = useState(null);
  const [managerEmail, setManagerEmail] = useState(()=>loadManagerEmail()||"");
  const [addModal, setAddModal]   = useState(false);
  const [newMember, setNewMember] = useState({name:"",role:"",billings:"",focus:""});
  const [selLearner, setSelLearner] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const [companyId, setCompanyId] = useState(()=>{ const p=loadProfile(); return p?.company_id||null; });
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteSent, setInviteSent]   = useState(false);
  const inviteLink = companyId ? `${window.location.origin}?company=${companyId}` : null;

  // Insight module state
  const [briefing, setBriefing]       = useState(null);
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [driftFilter, setDriftFilter] = useState("all");
  const [confSelected, setConfSelected] = useState(null);
  const [engFilter, setEngFilter]     = useState("all");

  useEffect(()=>{
    (async()=>{
      setLoadingData(true);
      try {
        const [team, inbox] = await Promise.all([
          Promise.race([sbLoadTeamData(), new Promise((_,r)=>setTimeout(()=>r(new Error('timeout')),4000))]),
          Promise.race([sbLoadManagerInbox(), new Promise((_,r)=>setTimeout(()=>r(new Error('timeout')),4000))]),
        ]);
        setTeamData(Array.isArray(team) ? team : loadTeamData());
        setInboxItems(Array.isArray(inbox) && inbox.length ? inbox : loadManagerInbox());
      } catch(e) {
        setTeamData(loadTeamData());
        setInboxItems(loadManagerInbox());
      }
      setLoadingData(false);
    })();
  },[]);

  // Use real team data only when it has analytics fields; otherwise show MOCK_TEAM as sample
  const hasRichData = teamData.length > 0 && teamData[0]?.bh;
  const usingSampleData = !hasRichData;
  const analyticsTeam = hasRichData ? teamData : MOCK_TEAM;

  const refreshInbox = async () => {
    const inbox = await sbLoadManagerInbox();
    setInboxItems(Array.isArray(inbox) ? inbox : loadManagerInbox());
  };

  const addMember = () => {
    if(!newMember.name.trim()) return;
    const member = {...newMember, id:Date.now(), score:0, ragFlags:[], emotionalReadiness:{}, smartGoals:[]};
    const updated = [...teamData, member];
    saveTeamData(updated);
    setTeamData(updated);
    setNewMember({name:"",role:"",billings:"",focus:""});
    setAddModal(false);
  };
  const removeMember = (id) => { const u=teamData.filter(m=>m.id!==id); saveTeamData(u); setTeamData(u); };

  // Generate Scott's briefing
  const generateBriefing = async () => {
    setBriefingLoading(true);
    const flags = analyticsTeam.filter(m=>m.flag||m.status==="regressing"||m.quad==="needs_support");
    const gems  = analyticsTeam.filter(m=>m.quad==="hidden_gem");
    const summary = `Team of ${analyticsTeam.length} recruiters.
Flags: ${flags.map(m=>`${m.name} (${m.status}, ${m.quad}${m.flag?", "+m.flag:""})`).join("; ")}.
Hidden gems: ${gems.map(m=>m.name).join(", ")}.
Inactive (5+ days): ${analyticsTeam.filter(m=>m.lastActive>=5).map(m=>`${m.name} (${m.lastActive}d)`).join(", ")||"none"}.
Low energy (<2.5): ${analyticsTeam.filter(m=>m.avgEnergy<2.5).map(m=>`${m.name} (${m.avgEnergy.toFixed(1)}/5)`).join(", ")||"none"}.
Regressing: ${analyticsTeam.filter(m=>m.status==="regressing").map(m=>`${m.name} (${m.regressionSkill||"skills"})`).join(", ")||"none"}.`;
    try {
      const text = await callAPI(
        [{role:"user",content:`Here is a summary of my 15-person recruitment team:\n\n${summary}\n\nGenerate a Scott's Briefing for me as their manager. Give me exactly 3 specific action items for today, naming the specific people and what to say or do. Be direct and practical. Format as JSON: {"headline":"one sentence summary of team state","actions":[{"priority":"high|medium","person":"name","action":"what to do","script":"exact opening line to say to them","why":"1 sentence reason"}]}`}],
        "You are Scott, a senior recruitment performance coach advising a manager. Be direct, specific, and practical. Focus on the 2-3 people who need immediate attention and 1 person with untapped potential. Return only valid JSON.",
        {max_tokens:600, temperature:0}
      );
      try {
        const parsed = parseJSON(text);
        setBriefing(parsed);
      } catch(e) {
        setBriefing({headline:"Team briefing generated", actions:[{priority:"high",person:"Team",action:"Review the Skill Drift and Engagement tabs for specific action items",script:"",why:"Manual review recommended"}]});
      }
    } catch(e) {
      setBriefing({headline:"Could not connect to AI — review tabs manually", actions:[]});
    }
    setBriefingLoading(false);
  };

  const tabs = [
    {id:"overview",   label:"Overview"},
    {id:"briefing",   label:"Scott's Briefing ✦"},
    {id:"drift",      label:"Skill Drift"},
    {id:"confidence", label:"Confidence Map"},
    {id:"engagement", label:"Engagement"},
    {id:"inbox",      label:`Inbox${inboxItems.filter(i=>!i.read).length?" ("+inboxItems.filter(i=>!i.read).length+")":""}` },
    {id:"goals",      label:"Dev Goals"},
    {id:"settings",   label:"Settings"},
  ];

  const EmptyTeam = ({message="Add team members to get started"}) => (
    <div style={{background:C.white,borderRadius:14,border:`1px solid ${C.border}`,padding:36,textAlign:"center"}}>
      <div style={{fontSize:28,marginBottom:8}}>👥</div>
      <div style={{fontWeight:700,color:C.navy,fontSize:14,marginBottom:4}}>No team members yet</div>
      <div style={{fontSize:13,color:C.muted,marginBottom:16}}>{message}</div>
      <button onClick={()=>setAddModal(true)} style={{background:C.purple,color:"#fff",border:"none",borderRadius:999,padding:"9px 20px",fontWeight:700,fontSize:13,cursor:"pointer"}}>+ Add member</button>
    </div>
  );

  /* ── Alert counts from analyticsTeam ── */
  const alertCount = analyticsTeam.filter(m=>m.status==="regressing"||m.flag==="inactive"||m.quad==="needs_support"||m.flag==="low_energy").length;
  const gemCount   = analyticsTeam.filter(m=>m.quad==="hidden_gem").length;

  return(
    <Shell page="team" go={go} userRole="manager" panel={false}>
      <div style={{animation:"fadeUp 0.35s ease both",maxWidth:960}}>

        {/* ── Header ── */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:10}}>
          <div>
            <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:2,color:C.muted,marginBottom:2}}>Manager View</div>
            <h1 style={{fontSize:22,fontWeight:800,color:C.navy}}>Team Development</h1>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {alertCount>0 && (
              <div style={{background:"#FEE2E2",border:"1px solid #FECACA",borderRadius:999,padding:"6px 14px",fontSize:12,fontWeight:700,color:"#991B1B",cursor:"pointer"}} onClick={()=>setActiveTab("drift")}>
                ⚠ {alertCount} need attention
              </div>
            )}
            {gemCount>0 && (
              <div style={{background:"#EDE9FE",border:"1px solid #C4B5FD",borderRadius:999,padding:"6px 14px",fontSize:12,fontWeight:700,color:"#5B21B6",cursor:"pointer"}} onClick={()=>setActiveTab("confidence")}>
                💎 {gemCount} hidden gems
              </div>
            )}
            <button onClick={()=>go("admin")} style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:999,padding:"8px 16px",fontSize:12,fontWeight:600,color:C.muted,cursor:"pointer"}}>⚙ Firm Setup</button>
            <button onClick={()=>setAddModal(true)} style={{background:C.purple,color:"#fff",border:"none",borderRadius:999,padding:"8px 18px",fontSize:12,fontWeight:700,cursor:"pointer"}}>+ Add member</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{display:"flex",gap:4,marginBottom:20,background:C.white,borderRadius:5,padding:4,border:`1px solid ${C.border}`,overflowX:"auto",flexWrap:"wrap"}}>
          {tabs.map(t=>(
            <button key={t.id} onClick={()=>setActiveTab(t.id)}
              style={{padding:"7px 14px",borderRadius:9,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,whiteSpace:"nowrap",background:activeTab===t.id?C.navy:"none",color:activeTab===t.id?"#fff":C.muted,transition:"all 0.15s"}}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════
            TAB: OVERVIEW
        ══════════════════════════════════════════ */}
        {activeTab==="overview" && (
          <div style={{animation:"fadeUp 0.3s ease both",display:"flex",flexDirection:"column",gap:14}}>

            {/* Sample data notice */}
            {usingSampleData && (
              <div style={{background:"#FEF3C7",borderRadius:10,border:"1px solid #FDE68A",padding:"10px 16px",display:"flex",gap:10,alignItems:"center"}}>
                <span style={{fontSize:16}}>📊</span>
                <span style={{fontSize:12,color:"#92400E"}}>Showing sample data. Invite your team to see their real analytics here.</span>
              </div>
            )}

            {/* Quick stats row */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
              {[
                {label:"Team size",      val:analyticsTeam.length,                                                    icon:"👥",  sub:"active consultants"},
                {label:"Need attention", val:alertCount,                                                              icon:"⚠",  sub:"regressions + flags",    accent:"#991B1B", bg:"#FEE2E2"},
                {label:"Hidden gems",    val:gemCount,                                                                icon:"💎", sub:"high skill, low conf",   accent:"#5B21B6", bg:"#EDE9FE"},
                {label:"Improving",      val:analyticsTeam.filter(m=>m.status==="improving").length,                  icon:"↑",   sub:"6-week trend up",         accent:"#166534", bg:"#DCFCE7"},
              ].map((s,i)=>(
                <div key={i} style={{background:s.bg||C.white,borderRadius:14,border:`1px solid ${s.bg?"transparent":C.border}`,padding:"16px 18px"}}>
                  <div style={{fontSize:20,marginBottom:2}}>{s.icon}</div>
                  <div style={{fontSize:26,fontWeight:900,color:s.accent||C.navy,lineHeight:1}}>{s.val}</div>
                  <div style={{fontSize:11,color:s.accent||C.muted,marginTop:3,fontWeight:600}}>{s.label}</div>
                  <div style={{fontSize:10,color:s.accent||C.muted,opacity:0.7}}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Quick status per person */}
            <div style={{background:C.white,borderRadius:14,border:`1px solid ${C.border}`,padding:18}}>
              <div style={{fontSize:12,fontWeight:700,color:C.navy,marginBottom:14}}>Team at a glance — last 6 weeks</div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {analyticsTeam.map(m=>{
                  const lastWeek = m.bh[m.bh.length-1];
                  const overall = Math.round(((lastWeek.o+lastWeek.d+lastWeek.l+lastWeek.ob+lastWeek.cl)/5)*100);
                  const qs = quadrantStyle(m.quad);
                  return(
                    <div key={m.id} style={{display:"flex",alignItems:"center",gap:12,padding:"8px 0",borderBottom:`1px solid ${C.bg}`}}>
                      <Av ini={m.ini} col={m.col} sz={32}/>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                          <span style={{fontWeight:700,color:C.navy,fontSize:13}}>{m.name}</span>
                          {statusBadge(m.status)}
                          {m.flag&&<span style={{background:"#FEF3C7",color:"#92400E",borderRadius:999,padding:"1px 8px",fontSize:10,fontWeight:700}}>{m.flag==="inactive"?"⏸ Inactive":"⚡ Low energy"}</span>}
                        </div>
                        <div style={{fontSize:11,color:C.muted}}>{m.role} · {m.focus}</div>
                      </div>
                      <div style={{display:"flex",gap:3,alignItems:"flex-end",height:20}}>
                        {m.bh.map((w,i)=>{
                          const s=Math.round(((w.o+w.d+w.l+w.ob+w.cl)/5)*100);
                          const h=Math.max(3,Math.round((s/100)*20));
                          const col=s>=70?"#34D399":s>=55?"#FBBF24":"#F87171";
                          return <div key={i} style={{width:6,height:h,background:col,borderRadius:2,opacity:0.7+i*0.05}}/>;
                        })}
                      </div>
                      <div style={{width:40,textAlign:"right",fontSize:13,fontWeight:800,color:overall>=70?C.green:overall>=55?C.amber:C.red}}>{overall}%</div>
                      <div style={{background:qs.bg,border:`1px solid ${qs.border}`,borderRadius:6,padding:"3px 8px",fontSize:10,fontWeight:700,color:qs.c,flexShrink:0}}>
                        {qs.icon}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick action prompt */}
            <div style={{background:C.navy,borderRadius:14,padding:"16px 20px",display:"flex",alignItems:"center",gap:14}}>
              <Av ini="SC" col={C.lavSoft} sz={36}/>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,color:"#fff",fontSize:14,marginBottom:3}}>Get Scott's briefing for today</div>
                <div style={{fontSize:12,color:"rgba(255,255,255,0.55)"}}>AI-generated action items based on your team's current data — who to talk to, what to say.</div>
              </div>
              <button onClick={()=>{ setActiveTab("briefing"); if(!briefing) generateBriefing(); }}
                style={{background:C.purple,color:"#fff",border:"none",borderRadius:999,padding:"10px 20px",fontWeight:700,fontSize:13,cursor:"pointer",whiteSpace:"nowrap"}}>
                Get briefing →
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            TAB: SCOTT'S BRIEFING
        ══════════════════════════════════════════ */}
        {activeTab==="briefing" && (
          <div style={{animation:"fadeUp 0.3s ease both",display:"flex",flexDirection:"column",gap:14}}>

            {/* Header card */}
            <div style={{background:C.navy,borderRadius:5,padding:"20px 22px",display:"flex",alignItems:"flex-start",gap:14}}>
              <Av ini="SC" col={C.lavSoft} sz={44}/>
              <div style={{flex:1}}>
                <div style={{fontWeight:800,color:"#fff",fontSize:16,marginBottom:4}}>Scott's Daily Briefing</div>
                <p style={{fontSize:13,color:"rgba(255,255,255,0.6)",lineHeight:1.65,margin:0}}>
                  I've analysed your team's recent activity, skill trends, confidence patterns, and engagement data.
                  Here are the 3 things that need your attention today — with exactly what to say.
                </p>
              </div>
              <button onClick={generateBriefing} disabled={briefingLoading}
                style={{background:"rgba(255,255,255,0.12)",color:"#fff",border:"1px solid rgba(255,255,255,0.2)",borderRadius:999,padding:"9px 18px",fontWeight:700,fontSize:12,cursor:briefingLoading?"not-allowed":"pointer",whiteSpace:"nowrap",opacity:briefingLoading?0.6:1}}>
                {briefingLoading?"Thinking…":"↺ Refresh"}
              </button>
            </div>

            {briefingLoading && (
              <div style={{background:C.white,borderRadius:14,border:`1px solid ${C.border}`,padding:40,textAlign:"center"}}>
                <div style={{display:"flex",justifyContent:"center",gap:6,marginBottom:12}}>
                  {[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:C.purple,animation:"bounce 1s infinite",animationDelay:`${i*0.2}s`}}/>)}
                </div>
                <div style={{fontSize:13,color:C.muted}}>Analysing team data…</div>
              </div>
            )}

            {!briefing && !briefingLoading && (
              <div style={{background:C.white,borderRadius:14,border:`1px solid ${C.border}`,padding:40,textAlign:"center"}}>
                <div style={{fontSize:36,marginBottom:12}}>📋</div>
                <div style={{fontWeight:700,color:C.navy,fontSize:15,marginBottom:8}}>Ready when you are</div>
                <p style={{fontSize:13,color:C.muted,marginBottom:20}}>Click the button above to generate today's briefing. Takes about 10 seconds.</p>
                <button onClick={generateBriefing} style={{background:C.purple,color:"#fff",border:"none",borderRadius:999,padding:"11px 28px",fontWeight:700,fontSize:14,cursor:"pointer"}}>
                  Generate briefing →
                </button>
              </div>
            )}

            {briefing && !briefingLoading && (
              <>
                {/* Headline */}
                <div style={{background:C.lavPale,borderRadius:14,border:`1px solid ${C.lavSoft}`,padding:"14px 18px"}}>
                  <div style={{fontSize:10,fontWeight:700,color:C.purple,textTransform:"uppercase",letterSpacing:1.5,marginBottom:4}}>Today's team status</div>
                  <div style={{fontSize:15,fontWeight:700,color:C.navy,lineHeight:1.5}}>{briefing.headline}</div>
                </div>

                {/* Action items */}
                {(briefing.actions||[]).map((action,i)=>(
                  <div key={i} style={{background:C.white,borderRadius:14,border:`2px solid ${action.priority==="high"?"#FECACA":action.priority==="medium"?"#FDE68A":C.border}`,padding:"18px 20px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                      <div style={{width:28,height:28,borderRadius:"50%",background:action.priority==="high"?"#FEE2E2":"#FEF3C7",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:900,color:action.priority==="high"?"#991B1B":"#92400E",flexShrink:0}}>{i+1}</div>
                      <div>
                        <div style={{fontSize:12,fontWeight:800,color:C.navy}}>{action.person}</div>
                        <span style={{background:action.priority==="high"?"#FEE2E2":"#FEF3C7",color:action.priority==="high"?"#991B1B":"#92400E",borderRadius:999,padding:"1px 8px",fontSize:10,fontWeight:700}}>{action.priority} priority</span>
                      </div>
                    </div>
                    <p style={{fontSize:13,color:C.navy,lineHeight:1.6,margin:"0 0 12px",fontWeight:500}}>{action.action}</p>
                    {action.script&&(
                      <div style={{background:C.bg,borderRadius:5,padding:"10px 14px",border:`1px solid ${C.border}`,marginBottom:8}}>
                        <div style={{fontSize:9,fontWeight:700,color:C.purple,textTransform:"uppercase",letterSpacing:1.5,marginBottom:4}}>What to say</div>
                        <p style={{fontSize:13,color:C.navy,fontStyle:"italic",lineHeight:1.55,margin:0}}>"{action.script}"</p>
                      </div>
                    )}
                    {action.why&&<div style={{fontSize:11,color:C.muted,lineHeight:1.55}}>Why: {action.why}</div>}
                  </div>
                ))}
              </>
            )}

            {/* Quick data panel */}
            <div style={{background:C.white,borderRadius:14,border:`1px solid ${C.border}`,padding:18}}>
              <div style={{fontSize:12,fontWeight:700,color:C.navy,marginBottom:12}}>Data behind the briefing</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                {[
                  {label:"Regressing", items:analyticsTeam.filter(m=>m.status==="regressing").map(m=>m.name), color:"#991B1B", bg:"#FEE2E2"},
                  {label:"Inactive 5+ days", items:analyticsTeam.filter(m=>m.lastActive>=5).map(m=>`${m.name} (${m.lastActive}d)`), color:"#92400E", bg:"#FEF3C7"},
                  {label:"Low energy", items:analyticsTeam.filter(m=>m.avgEnergy<2.5).map(m=>`${m.name} (${m.avgEnergy.toFixed(1)}/5)`), color:"#6B21A8", bg:"#EDE9FE"},
                ].map((section,i)=>(
                  <div key={i} style={{background:section.bg,borderRadius:5,padding:"12px 14px"}}>
                    <div style={{fontSize:10,fontWeight:800,color:section.color,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>{section.label}</div>
                    {section.items.length===0
                      ? <div style={{fontSize:12,color:section.color,opacity:0.6}}>None ✓</div>
                      : section.items.map((n,j)=><div key={j} style={{fontSize:12,color:section.color,fontWeight:600,marginBottom:2}}>• {n}</div>)
                    }
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            TAB: SKILL DRIFT
        ══════════════════════════════════════════ */}
        {activeTab==="drift" && (
          <div style={{animation:"fadeUp 0.3s ease both",display:"flex",flexDirection:"column",gap:14}}>

            {/* Explainer */}
            <div style={{background:C.lavPale,borderRadius:14,border:`1px solid ${C.lavSoft}`,padding:"13px 17px",display:"flex",gap:10,alignItems:"flex-start"}}>
              <span style={{fontSize:16}}>📉</span>
              <p style={{fontSize:12,color:C.purple,lineHeight:1.65,margin:0}}>
                <strong>Skill Drift</strong> tracks each consultant's behaviour scores across 6 weeks, per skill area.
                A <strong>regression</strong> means scores that were improving have reversed.
                A <strong>plateau</strong> means no meaningful progress for 4+ weeks.
                Both warrant different coaching conversations.
              </p>
            </div>

            {/* Filter chips */}
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {[
                {id:"all",    label:"All (15)"},
                {id:"regressing", label:"Regressing ("+analyticsTeam.filter(m=>m.status==="regressing").length+")"},
                {id:"plateau",    label:"Plateau ("+analyticsTeam.filter(m=>m.status==="plateau").length+")"},
                {id:"improving",  label:"Improving ("+analyticsTeam.filter(m=>m.status==="improving").length+")"},
                {id:"stable",     label:"Stable ("+analyticsTeam.filter(m=>m.status==="stable").length+")"},
              ].map(f=>(
                <button key={f.id} onClick={()=>setDriftFilter(f.id)}
                  style={{background:driftFilter===f.id?C.navy:C.white,color:driftFilter===f.id?"#fff":C.muted,border:`1px solid ${driftFilter===f.id?C.navy:C.border}`,borderRadius:999,padding:"6px 16px",fontSize:12,fontWeight:600,cursor:"pointer",transition:"all 0.15s"}}>
                  {f.label}
                </button>
              ))}
            </div>

            {/* Cards */}
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {analyticsTeam
                .filter(m=> driftFilter==="all" || m.status===driftFilter)
                .map(m=>{
                  const qs = quadrantStyle(m.quad);
                  const lastWeek = m.bh[m.bh.length-1];
                  const firstWeek = m.bh[0];
                  const overallNow = Math.round(((lastWeek.o+lastWeek.d+lastWeek.l+lastWeek.ob+lastWeek.cl)/5)*100);
                  const overallThen = Math.round(((firstWeek.o+firstWeek.d+firstWeek.l+firstWeek.ob+firstWeek.cl)/5)*100);
                  const delta = overallNow - overallThen;
                  return(
                    <div key={m.id} style={{background:C.white,borderRadius:14,border:`1px solid ${m.status==="regressing"?"#FECACA":m.status==="plateau"?"#FDE68A":C.border}`,padding:"16px 18px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
                        <Av ini={m.ini} col={m.col} sz={38}/>
                        <div style={{flex:1}}>
                          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                            <span style={{fontWeight:800,color:C.navy,fontSize:14}}>{m.name}</span>
                            {statusBadge(m.status)}
                            <span style={{fontSize:12,fontWeight:700,color:delta>=0?"#166534":"#991B1B"}}>{delta>=0?"+":""}{delta}pp over 6 weeks</span>
                          </div>
                          <div style={{fontSize:11,color:C.muted}}>{m.role} · {m.focus}</div>
                        </div>
                        <div style={{textAlign:"right"}}>
                          <div style={{fontSize:22,fontWeight:900,color:overallNow>=70?C.green:overallNow>=55?C.amber:C.red}}>{overallNow}%</div>
                          <div style={{fontSize:10,color:C.muted}}>current</div>
                        </div>
                      </div>

                      {/* Skill sparklines */}
                      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8}}>
                        {skillKeys.map(sk=>{
                          const vals = m.bh.map(w=>w[sk.key]);
                          const now = vals[vals.length-1];
                          const then = vals[0];
                          const d = now - then;
                          const sparkColor = d>0.08?"#22C55E":d<-0.08?"#EF4444":C.muted;
                          return(
                            <div key={sk.key} style={{textAlign:"center"}}>
                              <div style={{fontSize:9,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:0.5,marginBottom:4}}>{sk.label}</div>
                              <div style={{display:"flex",justifyContent:"center"}}>
                                <BehaviourSparkline history={m.bh} skillKey={sk.key} color={sparkColor}/>
                              </div>
                              <div style={{fontSize:11,fontWeight:800,color:sparkColor,marginTop:3}}>{Math.round(now*100)}%</div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Regression/plateau note */}
                      {m.regressionNote && (
                        <div style={{background:"#FEF2F2",borderRadius:5,padding:"9px 12px",border:"1px solid #FECACA",marginTop:10}}>
                          <div style={{fontSize:9,fontWeight:800,color:"#991B1B",textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>⚠ Coaching note</div>
                          <p style={{fontSize:12,color:"#7F1D1D",lineHeight:1.55,margin:0}}>{m.regressionNote}</p>
                        </div>
                      )}
                      {m.status==="plateau" && !m.regressionNote && (
                        <div style={{background:"#FFFBEB",borderRadius:5,padding:"9px 12px",border:"1px solid #FDE68A",marginTop:10}}>
                          <div style={{fontSize:9,fontWeight:800,color:"#92400E",textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>→ Plateau detected</div>
                          <p style={{fontSize:12,color:"#78350F",lineHeight:1.55,margin:0}}>Scores consistent for 6 weeks with no breakthrough. Consider switching the practice format — paired roleplay or scenario variety often breaks a plateau.</p>
                        </div>
                      )}
                    </div>
                  );
              })}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            TAB: CONFIDENCE MAP
        ══════════════════════════════════════════ */}
        {activeTab==="confidence" && (
          <div style={{animation:"fadeUp 0.3s ease both",display:"flex",flexDirection:"column",gap:14}}>

            {/* Explainer */}
            <div style={{background:C.lavPale,borderRadius:14,border:`1px solid ${C.lavSoft}`,padding:"13px 17px",display:"flex",gap:10,alignItems:"flex-start"}}>
              <span style={{fontSize:16}}>🎯</span>
              <p style={{fontSize:12,color:C.purple,lineHeight:1.65,margin:0}}>
                <strong>Confidence Map</strong> plots each consultant's self-rated confidence against their actual behaviour scores from roleplays.
                The biggest coaching opportunities are <strong>Hidden Gems</strong> (high skill, low confidence — they're better than they think)
                and <strong>Overconfident</strong> (declining skill, but don't know it yet).
              </p>
            </div>

            {/* 2x2 quadrant grid */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              {[
                {quad:"on_track",    label:"On Track",      sub:"High confidence + Strong skill",       border:"#BBF7D0", bg:"#F0FDF4", headCol:"#166534", icon:"✓"},
                {quad:"overconfident",label:"Overconfident",sub:"High confidence + Skill declining",    border:"#FDE68A", bg:"#FFFBEB", headCol:"#92400E", icon:"⚠"},
                {quad:"hidden_gem",  label:"Hidden Gems",   sub:"Low confidence + Strong skill",        border:"#C4B5FD", bg:"#EDE9FE", headCol:"#5B21B6", icon:"💎"},
                {quad:"needs_support",label:"Needs Support",sub:"Low confidence + Lower skill",         border:"#FECACA", bg:"#FEF2F2", headCol:"#991B1B", icon:"🔴"},
              ].map(q=>{
                const people = analyticsTeam.filter(m=>m.quad===q.quad);
                return(
                  <div key={q.quad} style={{background:q.bg,borderRadius:14,border:`2px solid ${q.border}`,padding:"16px 18px",minHeight:160}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                      <span style={{fontSize:18}}>{q.icon}</span>
                      <div>
                        <div style={{fontWeight:800,color:q.headCol,fontSize:14}}>{q.label}</div>
                        <div style={{fontSize:11,color:q.headCol,opacity:0.7}}>{q.sub}</div>
                      </div>
                      <div style={{marginLeft:"auto",width:26,height:26,borderRadius:"50%",background:"rgba(255,255,255,0.6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:q.headCol}}>{people.length}</div>
                    </div>
                    <div style={{borderTop:`1px solid ${q.border}`,paddingTop:10,marginTop:8,display:"flex",flexDirection:"column",gap:8}}>
                      {people.length===0 && <div style={{fontSize:12,color:q.headCol,opacity:0.5,fontStyle:"italic"}}>Nobody here right now</div>}
                      {people.map(m=>(
                        <div key={m.id} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",borderRadius:5,padding:"6px 8px",background:"rgba(255,255,255,0.5)",transition:"all 0.15s"}}
                          onClick={()=>setConfSelected(confSelected?.id===m.id?null:m)}
                          onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.8)"}
                          onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.5)"}>
                          <Av ini={m.ini} col={m.col} sz={26}/>
                          <div style={{flex:1}}>
                            <div style={{fontSize:12,fontWeight:700,color:q.headCol}}>{m.name}</div>
                            <div style={{fontSize:10,color:q.headCol,opacity:0.7}}>Conf: {m.avgConf.toFixed(1)}/5 · Skill: {m.avgSkill}%</div>
                          </div>
                          <span style={{fontSize:10,color:q.headCol,opacity:0.5}}>›</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Detail panel for selected person */}
            {confSelected && (
              <div style={{background:C.white,borderRadius:14,border:`1px solid ${C.border}`,padding:"18px 20px",animation:"fadeUp 0.2s ease both"}}>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
                  <Av ini={confSelected.ini} col={confSelected.col} sz={40}/>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:800,color:C.navy,fontSize:15}}>{confSelected.name}</div>
                    <div style={{fontSize:12,color:C.muted}}>{confSelected.role} · {confSelected.focus}</div>
                  </div>
                  <button onClick={()=>setConfSelected(null)} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:18}}>×</button>
                </div>

                {/* Confidence vs Behaviour chart */}
                <div style={{fontSize:12,fontWeight:700,color:C.navy,marginBottom:10}}>Confidence vs Behaviour — last {confSelected.ch.length} sessions</div>
                <div style={{background:C.bg,borderRadius:5,padding:12,marginBottom:12}}>
                  <div style={{display:"flex",alignItems:"flex-end",gap:4,height:80}}>
                    {confSelected.ch.map((pt,i)=>{
                      const confH = Math.round((pt.c/5)*80);
                      const skillH = Math.round((pt.b/100)*80);
                      return(
                        <div key={i} style={{flex:1,display:"flex",gap:2,alignItems:"flex-end",justifyContent:"center"}}>
                          <div style={{width:6,height:confH,background:C.lavSoft,borderRadius:"3px 3px 0 0"}} title={`Confidence: ${pt.c}/5`}/>
                          <div style={{width:6,height:skillH,background:C.purple,borderRadius:"3px 3px 0 0"}} title={`Skill: ${pt.b}%`}/>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{display:"flex",gap:14,marginTop:6,fontSize:10,color:C.muted}}>
                    <span><span style={{display:"inline-block",width:8,height:8,background:C.lavSoft,borderRadius:2,marginRight:4}}/>Confidence (1-5)</span>
                    <span><span style={{display:"inline-block",width:8,height:8,background:C.purple,borderRadius:2,marginRight:4}}/>Skill score (%)</span>
                  </div>
                </div>

                {/* Coaching note */}
                {confSelected.hiddenGemNote && (
                  <div style={{background:"#EDE9FE",borderRadius:5,padding:"10px 14px",border:"1px solid #C4B5FD",marginBottom:10}}>
                    <div style={{fontSize:9,fontWeight:800,color:"#5B21B6",textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>💎 Coaching opportunity</div>
                    <p style={{fontSize:12,color:"#3B0764",lineHeight:1.6,margin:0}}>{confSelected.hiddenGemNote}</p>
                  </div>
                )}
                {confSelected.regressionNote && (
                  <div style={{background:"#FEF2F2",borderRadius:5,padding:"10px 14px",border:"1px solid #FECACA"}}>
                    <div style={{fontSize:9,fontWeight:800,color:"#991B1B",textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>⚠ Watch closely</div>
                    <p style={{fontSize:12,color:"#7F1D1D",lineHeight:1.6,margin:0}}>{confSelected.regressionNote}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════
            TAB: ENGAGEMENT
        ══════════════════════════════════════════ */}
        {activeTab==="engagement" && (
          <div style={{animation:"fadeUp 0.3s ease both",display:"flex",flexDirection:"column",gap:14}}>

            {/* Explainer */}
            <div style={{background:C.lavPale,borderRadius:14,border:`1px solid ${C.lavSoft}`,padding:"13px 17px",display:"flex",gap:10,alignItems:"flex-start"}}>
              <span style={{fontSize:16}}>⚡</span>
              <p style={{fontSize:12,color:C.purple,lineHeight:1.65,margin:0}}>
                <strong>Engagement Cadence</strong> tracks who's actively using HeyScott and how their energy is trending.
                Consistent usage drops and low energy scores are early warning signals — they usually precede performance issues by 2-3 weeks.
              </p>
            </div>

            {/* Summary row */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
              {[
                {label:"Active this week", val:analyticsTeam.filter(m=>m.sessW>0).length+"/"+analyticsTeam.length, icon:"✅", bg:"#F0FDF4", c:"#166534"},
                {label:"Inactive 5+ days", val:analyticsTeam.filter(m=>m.lastActive>=5).length, icon:"⏸", bg:"#FEF3C7", c:"#92400E"},
                {label:"Low energy (<2.5)", val:analyticsTeam.filter(m=>m.avgEnergy<2.5).length, icon:"🔋", bg:"#FEE2E2", c:"#991B1B"},
              ].map((s,i)=>(
                <div key={i} style={{background:s.bg,borderRadius:5,padding:"14px 16px",border:"1px solid transparent"}}>
                  <div style={{fontSize:22,marginBottom:4}}>{s.icon}</div>
                  <div style={{fontSize:24,fontWeight:900,color:s.c}}>{s.val}</div>
                  <div style={{fontSize:11,fontWeight:600,color:s.c,marginTop:2}}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Filter */}
            <div style={{display:"flex",gap:8}}>
              {[
                {id:"all",      label:"All"},
                {id:"inactive", label:"Inactive"},
                {id:"low_energy",label:"Low energy"},
                {id:"declining",label:"Usage declining"},
              ].map(f=>(
                <button key={f.id} onClick={()=>setEngFilter(f.id)}
                  style={{background:engFilter===f.id?C.navy:C.white,color:engFilter===f.id?"#fff":C.muted,border:`1px solid ${engFilter===f.id?C.navy:C.border}`,borderRadius:999,padding:"6px 16px",fontSize:12,fontWeight:600,cursor:"pointer",transition:"all 0.15s"}}>
                  {f.label}
                </button>
              ))}
            </div>

            {/* Per-person rows */}
            <div style={{background:C.white,borderRadius:14,border:`1px solid ${C.border}`,overflow:"hidden",overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
              <div style={{minWidth:640}}>
              {/* Header */}
              <div style={{display:"grid",gridTemplateColumns:"200px 1fr 80px 90px 80px 100px",gap:0,padding:"10px 16px",background:C.bg,borderBottom:`1px solid ${C.border}`,fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:0.5}}>
                <span>Consultant</span>
                <span>Energy — 14 days</span>
                <span style={{textAlign:"center"}}>Avg energy</span>
                <span style={{textAlign:"center"}}>Sessions</span>
                <span style={{textAlign:"center"}}>Last active</span>
                <span style={{textAlign:"center"}}>Flags</span>
              </div>

              {analyticsTeam
                .filter(m=>{
                  if(engFilter==="all") return true;
                  if(engFilter==="inactive") return m.lastActive>=5;
                  if(engFilter==="low_energy") return m.avgEnergy<2.5;
                  if(engFilter==="declining") return m.sessW < m.sessLW-1;
                  return true;
                })
                .sort((a,b)=>{
                  // Sort: flagged first, then by engagement descending
                  const aFlag = a.flag?1:0;
                  const bFlag = b.flag?1:0;
                  if(bFlag!==aFlag) return bFlag-aFlag;
                  return b.avgEnergy-a.avgEnergy;
                })
                .map((m,i,arr)=>{
                  const hasFlag = m.flag || m.lastActive>=5;
                  const lastBg = hasFlag?"#FFFBEB":C.white;
                  return(
                    <div key={m.id} style={{display:"grid",gridTemplateColumns:"200px 1fr 80px 90px 80px 100px",gap:0,padding:"12px 16px",borderBottom:i<arr.length-1?`1px solid ${C.bg}`:"none",background:lastBg,alignItems:"center"}}>
                      {/* Name */}
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <Av ini={m.ini} col={m.col} sz={28}/>
                        <div>
                          <div style={{fontSize:12,fontWeight:700,color:C.navy}}>{m.name}</div>
                          <div style={{fontSize:10,color:C.muted}}>{m.focus}</div>
                        </div>
                      </div>

                      {/* Energy sparkline — 14 days */}
                      <div style={{display:"flex",gap:2,alignItems:"flex-end",height:24}}>
                        {m.energy.map((e,j)=>(
                          <EnergyBar key={j} energy={e} maxH={22}/>
                        ))}
                      </div>

                      {/* Avg energy */}
                      <div style={{textAlign:"center"}}>
                        <div style={{fontSize:14,fontWeight:800,color:m.avgEnergy>=4?"#22C55E":m.avgEnergy>=2.5?"#FBBF24":"#EF4444"}}>{m.avgEnergy.toFixed(1)}</div>
                        <div style={{fontSize:9,color:C.muted}}>/5</div>
                      </div>

                      {/* Sessions this vs last week */}
                      <div style={{textAlign:"center"}}>
                        <div style={{fontSize:13,fontWeight:700,color:C.navy}}>{m.sessW} <span style={{fontSize:10,fontWeight:400,color:C.muted}}>this wk</span></div>
                        <div style={{fontSize:10,color:m.sessW<m.sessLW?"#EF4444":C.muted}}>{m.sessW<m.sessLW?"↓":m.sessW>m.sessLW?"↑":"="} {m.sessLW} last</div>
                      </div>

                      {/* Last active */}
                      <div style={{textAlign:"center"}}>
                        <div style={{fontSize:13,fontWeight:700,color:m.lastActive>=5?"#EF4444":m.lastActive>=3?"#FBBF24":C.navy}}>
                          {m.lastActive===0?"Today":m.lastActive===1?"Yesterday":`${m.lastActive}d ago`}
                        </div>
                      </div>

                      {/* Flags */}
                      <div style={{textAlign:"center",display:"flex",flexDirection:"column",gap:3,alignItems:"center"}}>
                        {m.flag==="inactive" && <span style={{background:"#FEF3C7",color:"#92400E",borderRadius:999,padding:"2px 8px",fontSize:9,fontWeight:700}}>⏸ Inactive</span>}
                        {m.flag==="low_energy" && <span style={{background:"#FEE2E2",color:"#991B1B",borderRadius:999,padding:"2px 8px",fontSize:9,fontWeight:700}}>🔋 Low energy</span>}
                        {m.sessW<m.sessLW-1 && <span style={{background:"#F3F4F6",color:"#6B7280",borderRadius:999,padding:"2px 8px",fontSize:9,fontWeight:700}}>↓ Dropping</span>}
                        {!m.flag && m.sessW>=m.sessLW && m.avgEnergy>=4 && <span style={{background:"#F0FDF4",color:"#166534",borderRadius:999,padding:"2px 8px",fontSize:9,fontWeight:700}}>✓ Active</span>}
                      </div>
                    </div>
                  );
              })}
              </div>{/* end minWidth wrapper */}
            </div>

            {/* Flag notes */}
            {analyticsTeam.filter(m=>m.flagNote).map(m=>(
              <div key={m.id} style={{background:C.white,borderRadius:5,border:`1px solid ${C.border}`,padding:"12px 16px",display:"flex",gap:10,alignItems:"flex-start"}}>
                <Av ini={m.ini} col={m.col} sz={28}/>
                <div>
                  <div style={{fontSize:12,fontWeight:700,color:C.navy,marginBottom:3}}>{m.name}</div>
                  <p style={{fontSize:12,color:C.muted,lineHeight:1.55,margin:0}}>{m.flagNote}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══════════════════════════════════════════
            TAB: INBOX (preserved)
        ══════════════════════════════════════════ */}
        {activeTab==="inbox" && (
          <div style={{animation:"fadeUp 0.3s ease both"}}>
            {inboxItems.length===0 ? (
              <div style={{background:C.white,borderRadius:14,border:`1px solid ${C.border}`,padding:36,textAlign:"center"}}>
                <div style={{fontSize:28,marginBottom:8}}>📬</div>
                <div style={{fontWeight:700,color:C.navy,fontSize:14,marginBottom:4}}>No items yet</div>
                <div style={{fontSize:13,color:C.muted}}>Completed roleplays and reflections from your team will appear here.</div>
              </div>
            ):(
              <div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                  <div style={{fontSize:12,color:C.muted}}>{inboxItems.length} items · {inboxItems.filter(i=>!i.read).length} unread</div>
                  <button onClick={()=>{inboxItems.forEach((_,idx)=>markInboxRead(idx));refreshInbox();}} style={{background:"none",border:"none",color:C.purple,fontSize:12,fontWeight:600,cursor:"pointer"}}>Mark all read</button>
                </div>
                {[...inboxItems].reverse().map((item,i)=>{
                  const realIdx=inboxItems.length-1-i;
                  const isOpen=expandedInbox===realIdx;
                  const isRP=item.type==="roleplay_complete";
                  const borderCol=item.read?C.border:isRP?"#FDE68A":"#C4BCEE";
                  return(
                    <div key={i} style={{background:C.white,borderRadius:14,border:`1px solid ${borderCol}`,marginBottom:8,overflow:"hidden",opacity:item.read?0.88:1}}>
                      <div onClick={()=>{setExpandedInbox(isOpen?null:realIdx);if(!item.read){markInboxRead(realIdx);refreshInbox();}}}
                        style={{display:"flex",gap:12,alignItems:"center",padding:"12px 18px",cursor:"pointer"}}>
                        {!item.read&&<div style={{width:8,height:8,borderRadius:"50%",background:isRP?C.amber:C.purple,flexShrink:0}}/>}
                        <div style={{flex:1}}>
                          <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:2}}>
                            <div style={{fontSize:12,fontWeight:700,color:C.navy}}>{item.learner||"Learner"} — {isRP?"roleplay":"reflection"}</div>
                            {isRP&&<span style={{background:item.score>=80?C.greenBg:item.score>=65?"#FEF3C7":"#FEE2E2",color:item.score>=80?C.green:item.score>=65?C.amber:C.red,borderRadius:999,padding:"1px 8px",fontSize:10,fontWeight:700}}>{item.score}</span>}
                          </div>
                          <div style={{fontSize:11,color:C.muted}}>{isRP?`${item.scenario} · ${item.difficulty} · ${item.verdict}`:item.prompt?.slice(0,70)} · {item.savedAt?new Date(item.savedAt).toLocaleDateString():""}</div>
                        </div>
                        <span style={{fontSize:14,color:C.muted,transform:isOpen?"rotate(90deg)":"none",transition:"transform 0.2s"}}>›</span>
                      </div>
                      {isOpen&&(
                        <div style={{padding:"0 18px 18px",borderTop:`1px solid ${C.bg}`}}>
                          {isRP?(
                            <div style={{marginTop:14}}>
                              {item.coachSummary&&<div style={{background:C.lavPale,borderRadius:5,padding:"10px 14px",border:`1px solid ${C.lavSoft}`,marginBottom:12}}><div style={{fontSize:10,fontWeight:700,color:C.purple,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>Scott's summary</div><p style={{fontSize:12,color:C.navy,lineHeight:1.6,margin:0}}>{item.coachSummary}</p></div>}
                              {item.strongMoment&&<div style={{background:"#F0FDF4",borderRadius:5,padding:"10px 14px",border:"1px solid #BBF7D0",marginBottom:8}}><div style={{fontSize:10,fontWeight:700,color:C.green,textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>✓ Best moment</div><p style={{fontSize:12,color:"#14532D",lineHeight:1.5,margin:0,fontStyle:"italic"}}>"{item.strongMoment.quote||item.strongMoment}"</p></div>}
                              {item.nextFocus&&<div style={{background:C.navy,borderRadius:5,padding:"10px 14px"}}><div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>Work on next</div><p style={{fontSize:12,color:"rgba(255,255,255,0.85)",margin:0}}>{item.nextFocus}</p></div>}
                            </div>
                          ):(
                            <div style={{marginTop:12}}>
                              <div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>Prompt</div>
                              <p style={{fontSize:12,color:C.muted,fontStyle:"italic",lineHeight:1.6,marginBottom:8}}>"{item.prompt}"</p>
                              <div style={{background:C.bg,borderRadius:5,padding:"10px 12px",fontSize:13,color:C.text,lineHeight:1.65}}>{item.text||<span style={{color:C.muted,fontStyle:"italic"}}>No response</span>}</div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════
            TAB: DEV GOALS (preserved)
        ══════════════════════════════════════════ */}
        {activeTab==="goals" && (
          <div style={{animation:"fadeUp 0.3s ease both"}}>
            {teamData.length===0 ? <EmptyTeam message="Add team members to view dev goals"/> : (
              <>
                <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}>
                  {teamData.map(m=>(
                    <button key={m.id} onClick={()=>setSelLearner(selLearner?.id===m.id?null:m)}
                      style={{background:selLearner?.id===m.id?C.navy:C.white,color:selLearner?.id===m.id?"#fff":C.text,border:`1px solid ${selLearner?.id===m.id?C.navy:C.border}`,borderRadius:999,padding:"6px 14px",fontSize:12,fontWeight:600,cursor:"pointer"}}>
                      {m.name}
                    </button>
                  ))}
                </div>
                {selLearner ? (
                  <div style={{background:C.white,borderRadius:14,border:`1px solid ${C.border}`,padding:18}}>
                    <div style={{fontSize:13,fontWeight:700,color:C.navy,marginBottom:12}}>Dev goals — {selLearner.name}</div>
                    {selLearner.smartGoals?.length ? (
                      selLearner.smartGoals.map((g,i)=>(
                        <div key={i} style={{background:C.bg,borderRadius:5,padding:"12px 14px",marginBottom:8}}>
                          <div style={{fontWeight:700,color:C.navy,fontSize:13,marginBottom:4}}>{g.title}</div>
                          <div style={{fontSize:12,color:C.muted,lineHeight:1.55}}>{g.specific}</div>
                        </div>
                      ))
                    ):(
                      <p style={{fontSize:13,color:C.muted,fontStyle:"italic"}}>No SMART goals generated yet for {selLearner.name}. Goals are generated automatically after 3 roleplays.</p>
                    )}
                  </div>
                ):(
                  <div style={{background:C.white,borderRadius:14,border:`1px solid ${C.border}`,padding:24,textAlign:"center"}}>
                    <p style={{fontSize:13,color:C.muted}}>Select a team member to view their development goals.</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════
            TAB: SETTINGS (preserved)
        ══════════════════════════════════════════ */}
        {activeTab==="settings" && (
          <div style={{animation:"fadeUp 0.3s ease both",display:"flex",flexDirection:"column",gap:14}}>

            {/* Team invite section */}
            <div style={{background:C.white,borderRadius:14,border:`1px solid ${C.border}`,padding:20}}>
              <div style={{fontSize:13,fontWeight:700,color:C.navy,marginBottom:4}}>Invite team members</div>
              <p style={{fontSize:12,color:C.muted,marginBottom:14}}>Share the link below or send an email invite. New members will be prompted to set up their profile.</p>

              {inviteLink ? (
                <>
                  <div style={{fontSize:11,fontWeight:600,color:C.muted,marginBottom:6}}>Shareable invite link</div>
                  <div style={{display:"flex",gap:8,marginBottom:16}}>
                    <div style={{flex:1,background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",fontSize:11,color:C.muted,wordBreak:"break-all",lineHeight:1.4}}>{inviteLink}</div>
                    <button onClick={()=>navigator.clipboard?.writeText(inviteLink)}
                      style={{background:C.purple,color:"#fff",border:"none",borderRadius:8,padding:"9px 14px",fontSize:12,fontWeight:600,cursor:"pointer",flexShrink:0,alignSelf:"flex-start"}}>Copy</button>
                  </div>
                  <div style={{fontSize:11,fontWeight:600,color:C.muted,marginBottom:6}}>Or invite by email</div>
                  <div style={{display:"flex",gap:8}}>
                    <input type="email" value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)}
                      placeholder="recruiter@company.com"
                      style={{flex:1,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",fontSize:13,color:C.text,outline:"none",background:C.bg,boxSizing:"border-box"}}/>
                    <button onClick={async()=>{
                      if(!inviteEmail.trim()) return;
                      try {
                        await fetch("/api/invite",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:inviteEmail.trim(),companyId})});
                        setInviteSent(true); setInviteEmail("");
                        setTimeout(()=>setInviteSent(false),3000);
                      } catch(e){}
                    }} disabled={!inviteEmail.trim()}
                      style={{background:inviteEmail.trim()?C.purple:C.border,color:inviteEmail.trim()?"#fff":C.muted,border:"none",borderRadius:8,padding:"9px 14px",fontSize:12,fontWeight:600,cursor:inviteEmail.trim()?"pointer":"not-allowed",flexShrink:0}}>
                      {inviteSent ? "Sent ✓" : "Send"}
                    </button>
                  </div>
                </>
              ) : (
                <div style={{background:C.bg,borderRadius:8,padding:"12px 16px",fontSize:12,color:C.muted}}>
                  Company ID not set. Sign up as a manager to generate your invite link.
                </div>
              )}
            </div>

            <div style={{background:C.white,borderRadius:14,border:`1px solid ${C.border}`,padding:20}}>
              <div style={{fontSize:13,fontWeight:700,color:C.navy,marginBottom:12}}>Manager email</div>
              <div style={{display:"flex",gap:8}}>
                <input value={managerEmail} onChange={e=>setManagerEmail(e.target.value)}
                  placeholder="your@email.com" type="email"
                  style={{flex:1,background:C.bg,border:`1px solid ${C.border}`,borderRadius:5,padding:"9px 12px",fontSize:13,color:C.text,outline:"none"}}/>
                <button onClick={()=>{saveManagerEmail(managerEmail);}}
                  style={{background:C.purple,color:"#fff",border:"none",borderRadius:5,padding:"9px 16px",fontWeight:700,fontSize:12,cursor:"pointer"}}>
                  Save
                </button>
              </div>
            </div>
            <div style={{background:C.white,borderRadius:14,border:`1px solid ${C.border}`,padding:20}}>
              <div style={{fontSize:13,fontWeight:700,color:C.navy,marginBottom:4}}>Firm coaching setup</div>
              <p style={{fontSize:13,color:C.muted,marginBottom:12}}>Configure how Scott coaches your team — firm voice, objection language, values.</p>
              <button onClick={()=>go("admin")} style={{background:C.navy,color:"#fff",border:"none",borderRadius:999,padding:"9px 20px",fontWeight:700,fontSize:13,cursor:"pointer"}}>Open firm setup →</button>
            </div>
            <div style={{background:C.lavPale,borderRadius:14,border:`1px solid ${C.lavSoft}`,padding:18}}>
              <div style={{fontSize:12,fontWeight:700,color:C.purple,marginBottom:6}}>About the analytics data</div>
              <p style={{fontSize:12,color:C.purple,lineHeight:1.65,margin:0}}>
                Skill Drift, Confidence Map, and Engagement data are pulled from your team's completed roleplays, confidence check-ins, and journal energy entries stored in Supabase.
                The data shown updates in real time as your team uses HeyScott.
                Mock data is displayed until live Supabase data is available.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Add member modal */}
      {addModal&&(
        <Modal onClose={()=>setAddModal(false)}>
          <div style={{fontWeight:800,color:C.navy,fontSize:16,marginBottom:16}}>Add team member</div>
          {[{f:"name",p:"Full name *"},{f:"role",p:"Job title"},{f:"focus",p:"Recruitment focus"},{f:"billings",p:"Annual billings"}].map(({f,p})=>(
            <input key={f} value={newMember[f]||""} onChange={e=>setNewMember(prev=>({...prev,[f]:e.target.value}))}
              placeholder={p}
              style={{width:"100%",background:C.bg,border:`1px solid ${C.border}`,borderRadius:5,padding:"9px 12px",fontSize:13,color:C.text,outline:"none",marginBottom:8,boxSizing:"border-box"}}/>
          ))}
          <div style={{display:"flex",gap:8,marginTop:8}}>
            <button onClick={()=>setAddModal(false)} style={{flex:1,background:C.bg,border:`1px solid ${C.border}`,borderRadius:999,padding:"10px",fontSize:13,color:C.muted,cursor:"pointer"}}>Cancel</button>
            <button onClick={addMember} disabled={!newMember.name.trim()} style={{flex:2,background:C.purple,color:"#fff",border:"none",borderRadius:999,padding:"10px",fontWeight:700,fontSize:13,cursor:newMember.name.trim()?"pointer":"not-allowed",opacity:newMember.name.trim()?1:0.5}}>Add member</button>
          </div>
        </Modal>
      )}
    </Shell>
  );
}


export default ManagerDashboard;