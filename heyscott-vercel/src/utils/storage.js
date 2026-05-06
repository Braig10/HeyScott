const PROGRESS_KEY      = "heyscott_progress_v1";
const ROLEPLAYS_KEY     = "heyscott_roleplays_v1";
const SMART_GOALS_KEY   = "heyscott_smart_goals_v1";
const REFLECTIONS_KEY   = "heyscott_reflections_v1";
const MANAGER_INBOX_KEY = "heyscott_manager_inbox_v1";
const TEAM_STORE_KEY    = "heyscott_team_v1";

export function loadProgress() { try { const s = localStorage.getItem(PROGRESS_KEY); return s ? JSON.parse(s) : {}; } catch(e) { return {}; } }
export function saveProgress(ids) { try { localStorage.setItem(PROGRESS_KEY, JSON.stringify({completedIds:ids,savedAt:new Date().toISOString()})); } catch(e) {} }
export function loadCompletedIds() { try { const p=loadProgress(); return Array.isArray(p.completedIds)?p.completedIds:[]; } catch(e) { return []; } }
export function loadTeamData() { try { const s=localStorage.getItem(TEAM_STORE_KEY); return s?JSON.parse(s):[]; } catch(e) { return []; } }
export function saveTeamData(d) { try { localStorage.setItem(TEAM_STORE_KEY,JSON.stringify(d)); } catch(e) {} }
export function loadRoleplays() { try { const s=localStorage.getItem(ROLEPLAYS_KEY); return s?JSON.parse(s):[]; } catch(e) { return []; } }
export function saveRoleplay(e) { try { const a=loadRoleplays(); a.push(e); localStorage.setItem(ROLEPLAYS_KEY,JSON.stringify(a)); } catch(e) {} }
export function loadSmartGoals() { try { const s=localStorage.getItem(SMART_GOALS_KEY); return s?JSON.parse(s):null; } catch(e) { return null; } }
export function saveSmartGoals(g) { try { localStorage.setItem(SMART_GOALS_KEY,JSON.stringify(g)); } catch(e) {} }
export function loadReflections() { try { const s=localStorage.getItem(REFLECTIONS_KEY); return s?JSON.parse(s):[]; } catch(e) { return []; } }
export function saveReflection(entry) { try { const a=loadReflections(); a.push(entry); localStorage.setItem(REFLECTIONS_KEY,JSON.stringify(a)); const inbox=loadManagerInbox(); inbox.push({...entry,type:"reflection",read:false,savedAt:new Date().toISOString()}); localStorage.setItem(MANAGER_INBOX_KEY,JSON.stringify(inbox)); } catch(e) {} }
export function loadManagerInbox() { try { const s=localStorage.getItem(MANAGER_INBOX_KEY); return s?JSON.parse(s):[]; } catch(e) { return []; } }
export function markInboxRead(idx) { try { const a=loadManagerInbox(); if(a[idx]){a[idx].read=true; localStorage.setItem(MANAGER_INBOX_KEY,JSON.stringify(a));} } catch(e) {} }
export function loadManagerEmail() { try { return localStorage.getItem("heyscott_manager_email_v1")||""; } catch(e) { return ""; } }
export function saveManagerEmail(email) { try { localStorage.setItem("heyscott_manager_email_v1",email); } catch(e) {} }
export function loadManagerReport() { try { const s=localStorage.getItem("heyscott_manager_report_v1"); return s?JSON.parse(s):null; } catch(e) { return null; } }
export function saveManagerReport(r) { try { localStorage.setItem("heyscott_manager_report_v1",JSON.stringify(r)); } catch(e) {} }
