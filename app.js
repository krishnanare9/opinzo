/* Opinzo — vanilla JS, GitHub Pages compatible.
   Demo: browser-local virtual points. Live: Supabase SQL RPC with server-side validation.
   Never treat demo points as a financial asset or use for real-money betting. */
(() => {
  'use strict';
  const CONFIG = window.OPINZO_CONFIG || {};
  const authLinkError = new URLSearchParams(window.location.hash.slice(1)).get('error_description') || new URLSearchParams(window.location.search||'').get('error_description');
  const recoveryArrival = new URLSearchParams(window.location.hash.slice(1)).get('type') === 'recovery';
  const isConfigured = Boolean(CONFIG.supabaseUrl && CONFIG.supabaseAnonKey);
  const isLive = isConfigured && Boolean(window.supabase?.createClient);
  const sb = isLive ? window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey) : null;
  const DEMO_KEY = 'opinzo-demo-v2';
  const ICONS = {Sports:'🏏'};
  const state = {
    mode: isLive ? 'live' : 'demo', view:'cricket', category:'All', query:'', sort:'popular',
    markets:[], predictions:[], ledger:[], leaderboard:[], profile:null, user:null,
    admin:false, modal:null, voteChoice:'yes', stake:25, authTab:'signin', busy:false,
    demo:null, error:'', recovery:recoveryArrival, cricketMatchId:null, cricketTab:'all', cricket:{data:null,loading:false,error:'',fetchedAt:0,lastAttempt:0,onlyOpen:false,onlyLive:false,kind:'all',listFilter:'all',competitionsOpen:false,competition:'all',expandedCompetitions:[]}
  };
  const $ = (s) => document.querySelector(s);
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num = (n) => Number(n || 0).toLocaleString('en-IN');
  const niceDate = (v) => v ? new Date(v).toLocaleDateString(window.OPINZO_I18N?.dateLocale || 'en-IN',{day:'numeric',month:'short',year:'numeric'}) : '—';
  const niceTime = (v) => v ? new Date(v).toLocaleString(window.OPINZO_I18N?.dateLocale || 'en-IN',{day:'numeric',month:'short',hour:'numeric',minute:'2-digit'}) : '—';
  const daysTo = (v) => { const d = Math.ceil((new Date(v) - Date.now()) / 86400000); return new Date(v).getTime() <= Date.now() ? 'Closed' : d > 1 ? `${d} days left` : d === 1 ? '1 day left' : d === 0 ? 'Closes today' : 'Closed'; };
  const id = () => (window.crypto?.randomUUID?.() || `d${Date.now()}${Math.random().toString(36).slice(2)}`);
  const safeLink = (u) => /^https:\/\/[^\s]+$/i.test(String(u||'')) ? esc(u) : '';
  const demoMarketSeeds = [];
  function seedDemo() {
    const monthEnd = new Date(); monthEnd.setUTCMonth(monthEnd.getUTCMonth()+1,0); monthEnd.setUTCHours(23,59,59,0);
    const markets = demoMarketSeeds.map((m) => {
      const {dayOffset, ...rest} = m;
      const end = new Date(Date.now() + dayOffset*86400000); end.setUTCHours(23,59,59,0);
      return {...rest,ends_at:end.toISOString(),created_at:new Date().toISOString(),status:'open',outcome:null,resolution_source:null};
    });
    return {markets,profile:{username:'Demo player',coin_balance:500},predictions:[],ledger:[{id:'welcome',amount:500,reason:'Welcome bonus',balance_after:500,created_at:new Date().toISOString()}]};
  }
  function loadDemo() {
    try {
      const raw=localStorage.getItem(DEMO_KEY);if(!raw)return seedDemo();
      const d=JSON.parse(raw);
      if(!d||!Array.isArray(d.markets)||!Array.isArray(d.predictions)||!Array.isArray(d.ledger)||!d.profile||!Number.isInteger(d.profile.coin_balance)||d.profile.coin_balance<0) return seedDemo();
      return d;
    } catch {return seedDemo();}
  }
  function saveDemo() {try {localStorage.setItem(DEMO_KEY,JSON.stringify(state.demo));} catch {toast('Browser storage is disabled: progress will not persist.','error');}}
  function getStats() {
    const resolved=state.predictions.filter(p=>p.status==='won'||p.status==='lost');
    const wins=resolved.filter(p=>p.status==='won').length;
    return {active:state.predictions.filter(p=>p.status==='pending').length,total:state.predictions.length,wins,accuracy:resolved.length?Math.round(100*wins/resolved.length):0,settled:resolved.length};
  }
  function setDemoState() {
    const d=state.demo;
    state.markets=d.markets.filter(m=>m.cricket_match_id&&m.cricket_kind);
    state.profile=d.profile;
    state.predictions=d.predictions.filter(p=>state.markets.some(m=>m.id===p.market_id));
    state.ledger=d.ledger.slice().reverse();
    const sample=[['Mira_99',32,42,1120],['AstroK',26,37,985],['InfoNinja',21,31,865],['NovaQueen',17,28,790],['DataWiz',11,21,720]];
    const mine=getStats();
    state.leaderboard=[...sample.map(([username,wins,predictions,coins])=>({username,wins,predictions,coins})),{username:'Demo player (you)',wins:mine.wins,predictions:mine.total,coins:d.profile.coin_balance}].sort((a,b)=>b.wins-a.wins || b.coins-a.coins);
  }
  async function loadLive() {
    if(!sb) return;
    const [marketResult,leaderResult]=await Promise.all([
      sb.from('markets').select('id,question,description,category,ends_at,created_at,status,outcome,resolution_source,yes_votes,no_votes,cricket_match_id,cricket_kind,cricket_subject,cricket_line,cricket_period').not('cricket_match_id','is',null).order('created_at',{ascending:false}).limit(120),
      sb.rpc('get_leaderboard')
    ]);
    const {data:markets,error:marketError}=marketResult;
    if(marketError) {state.error=marketError.message;state.markets=[];} else {state.error='';state.markets=(markets||[]).filter(m=>m.cricket_match_id&&m.cricket_kind);}
    const {data:leaders,error:leaderError}=leaderResult;
    state.leaderboard=leaderError?[]:(leaders||[]);
    if(state.user) {
      const [p,x,l,a]=await Promise.all([
        sb.from('profiles').select('username,coin_balance').eq('id',state.user.id).single(),
        sb.from('predictions').select('id,market_id,choice,stake,payout,status,created_at').order('created_at',{ascending:false}).limit(300),
        sb.from('coin_ledger').select('id,amount,reason,market_id,balance_after,created_at').order('created_at',{ascending:false}).limit(100),
        sb.rpc('is_admin')
      ]);
      state.profile=p.data||null; state.predictions=(x.data||[]).filter(p=>state.markets.some(m=>m.id===p.market_id));state.ledger=l.data||[];state.admin=Boolean(a.data);
      if(p.error) state.error=`Account profile unavailable: ${p.error.message}`;
    } else {state.profile=null;state.predictions=[];state.ledger=[];state.admin=false;}
    render();
  }
  function marketStatus(m) {if(m.status==='resolved')return 'resolved';if(m.status==='void')return 'void';return new Date(m.ends_at).getTime()<=Date.now()?'closed':'open';}
  function ownPick(marketId) {return state.predictions.find(p=>p.market_id===marketId);}
  function marketPerc(m) {const yes=Number(m.yes_votes||0),no=Number(m.no_votes||0); return yes+no ? Math.round(100*yes/(yes+no)):50;}
  function getMarket(marketId) {return state.markets.find(m=>String(m.id)===String(marketId));}
  function statCard(label,value,note,symbol) {return `<article class="stat-card"><div class="stat-card-top"><span>${esc(label)}</span><span class="stat-card-icon">${symbol}</span></div><strong>${value}</strong><small>${note}</small></article>`;}
  function modeNotice() {return state.mode==='demo' ? `<div class="info-banner"><span class="info-symbol">ⓘ</span><div><strong>Preview mode is active.</strong><p>Predictions, points and the sample leaderboard are stored or simulated in this browser only. No real users, live prices, or real rewards. Connect Supabase to launch online accounts.</p></div></div>` : '' ;}
  function resultBadge(p) {return p.status==='won'?'<span class="mini-tag yes">✓ WON</span>':p.status==='lost'?'<span class="mini-tag no">✕ LOST</span>':p.status==='refunded'?'<span class="mini-tag">↩ REFUNDED</span>':'<span class="mini-tag">◷ PENDING</span>';}
  function portfolioView() {
    const stats=getStats();
    const entries=state.predictions;
    return `<div class="eyebrow">YOUR TRACK RECORD</div><h1 class="page-title">My predictions</h1><p class="page-subtitle">All your opinions, outcomes and virtual point gains in one place.</p>${!state.profile?signinEmpty():`<section class="stat-grid">${statCard('Total picks',stats.total,'Since joining','▤')}${statCard('Correct picks',stats.wins,'Resolved wins','✓')}${statCard('Accuracy',stats.accuracy+'%',`${stats.settled} resolved picks`,'⌁')}</section><div class="wide-panel"><h3>Prediction history</h3>${entries.length?entries.map(p=>{const m=getMarket(p.market_id);return `<div class="prediction-row"><span class="history-icon">${ICONS[m?.category]||'◉'}</span><div class="history-info"><div class="history-title">${esc(m?.question||'Market #'+String(p.market_id).slice(0,8))}</div><div class="history-sub">Picked ${esc(p.choice).toUpperCase()} · ${num(p.stake)} points staked · ${niceTime(p.created_at)}</div></div><div style="text-align:right">${resultBadge(p)}<div class="history-sub" style="margin-top:5px">${p.status==='won'?`+${num(p.payout||0)} paid`:p.status==='lost'?'No payout':p.status==='refunded'?'Stake returned':'Awaiting result'}</div></div></div>`;}).join(''):`<div class="empty-state"><div class="empty-icon">◎</div><h3>No predictions yet</h3><p>Explore questions and make your first pick.</p><button class="btn-primary" data-view="cricket" type="button">Open cricket matches</button></div>`}</div>`}`;
  }
  function signinEmpty() {return `<div class="empty-state"><div class="empty-icon">♙</div><h3>Sign in to get started</h3><p>Create your free account to track predictions and virtual points.</p><button class="btn-primary" type="button" data-action="auth">Sign in / Create account</button></div>`;}
  function walletView() {
    const profile=state.profile;
    return `<div class="eyebrow">YOUR VIRTUAL WALLET</div><h1 class="page-title">Coin wallet</h1><p class="page-subtitle">A transparent record of your free virtual points. No withdrawals, purchases or redemptions.</p>${profile?`<div class="wallet-hero"><p>Available virtual balance</p><strong><span class="coin-icon">◈</span> ${num(profile.coin_balance)}</strong><div class="subtitle">Opinzo Points • No monetary value</div></div><div class="wide-panel"><h3>Transaction history</h3>${state.ledger.length?state.ledger.map(l=>`<div class="history-row"><span class="history-icon">${Number(l.amount)>=0?'↗':'↘'}</span><div class="history-info"><div class="history-title">${esc(l.reason)}</div><div class="history-sub">${niceTime(l.created_at)} · Balance after: ${num(l.balance_after)}</div></div><strong class="history-amount ${Number(l.amount)>0?'positive':Number(l.amount)<0?'negative':'neutral'}">${Number(l.amount)>0?'+':''}${num(l.amount)}</strong></div>`).join(''):'<p class="subtle">No transactions yet.</p>'}</div>`:signinEmpty()}<div class="info-banner"><span class="info-symbol">ⓘ</span><div><strong>How virtual coins work</strong><p>New users start with 500 free points. A pick deducts your stake. Correct pick: 2× the stake is returned (net +1×). Incorrect pick: you lose the virtual stake (net −1×). Points cannot be bought, sold, transferred or converted to gifts or cash.</p></div></div>`;
  }
  function leaderboardView() {
    const l=state.leaderboard||[];
    return `<div class="eyebrow">THE COMMUNITY</div><h1 class="page-title">Top predictors</h1><p class="page-subtitle">Knowledge meets consistency. Rankings are based on number of correct resolved picks.</p>${state.mode==='demo'?modeNotice():''}<div class="wide-panel"><h3>Leaderboard <span class="count-badge">${l.length} players</span></h3><div style="overflow-x:auto"><table class="leaderboard-table"><thead><tr><th>RANK</th><th>PLAYER</th><th>WINS</th><th>PICKS</th><th>POINTS</th></tr></thead><tbody>${l.length?l.map((u,i)=>`<tr><td class="rank">#${i+1}</td><td><div class="user-col"><span class="leader-avatar ${i===1?'second':i===2?'third':''}">${esc(String(u.username||'U').slice(0,1).toUpperCase())}</span><span class="nowrap">${esc(u.username||'Player')}</span></div></td><td>${num(u.wins)}</td><td>${num(u.predictions)}</td><td>${num(u.coins)}</td></tr>`).join(''):'<tr><td colspan="5">No rankings yet.</td></tr>'}</tbody></table></div></div>`;
  }
  function adminView() {
    if(!state.admin && state.mode!=='demo') return '<div class="empty-state"><h3>Admin access required</h3><p>This area is not available to your account.</p></div>';
    return `<div class="eyebrow">${state.mode==='demo'?'LOCAL SANDBOX':'ADMIN AREA'}</div><h1 class="page-title">Cricket market management</h1><p class="page-subtitle">${state.mode==='demo'?'Simulated outcomes for browser testing only.':'Only approved admins can create and resolve markets through secure database functions.'}</p>${modeNotice()}<div class="wide-panel"><h3>Cricket market management</h3><p class="subtle">Open a cricket match and use Add market to configure team, session or player selections.</p><button class="btn-primary" type="button" data-view="cricket">Open cricket matches →</button></div><div class="wide-panel"><h3>Settle markets</h3><p class="subtle">${state.mode==='demo'?'Demo outcomes are arbitrary simulations.':'Real markets can only be settled after their closing time. Verify an authoritative source first.'}</p>${state.markets.filter(m=>!['resolved','void'].includes(marketStatus(m))).length?state.markets.filter(m=>!['resolved','void'].includes(marketStatus(m))).map(m=>`<div class="admin-market"><div class="history-info"><div class="history-title">${esc(cricketMarketLabel(m))}</div><div class="history-sub">${marketStatus(m).toUpperCase()} · Closes ${niceTime(m.ends_at)}</div></div>${m.cricket_match_id&&marketStatus(m)==='open'?`<button type="button" class="btn-outline btn-small" data-action="closeCricketNow" data-id="${esc(m.id)}">Close predictions now</button>`:''}<button type="button" class="btn-outline btn-small" data-action="settle" data-id="${esc(m.id)}" ${state.mode==='live'&&marketStatus(m)==='open'?'disabled title="Market not closed"':''}>Resolve</button></div>`).join(''):'<p class="subtle">No unresolved markets.</p>'}</div>${state.mode==='demo'?'<button class="btn-outline btn-small" data-action="resetDemo" type="button">Reset browser demo (erase local picks)</button>':''}`;
  }
  const CRICKET_KINDS={match_winner:'Match winner',session_runs:'Session / over runs',innings_runs:'Innings total runs',wickets:'Team wickets',player_runs:'Player runs',player_wickets:'Player wickets'};
  function cricketMatch(matchId){return state.cricket.data?.matches.find(m=>String(m.id)===String(matchId));}
  function cricketMatchName(m){return m.score.split(/\s+v\s+/i).map(x=>x.replace(/\s+\d.*$/,'').replace(/\*/g,'').trim()).join(' v ');}
  function cricketChoice(m,side){
    if(!m.cricket_kind)return side.toUpperCase();
    if(m.cricket_kind==='match_winner')return side==='yes'?m.cricket_subject+' wins':'Other team wins';
    return (side==='yes'?'Over ':'Under / equal ')+m.cricket_line;
  }
  function openMatchPredictions(matchId){
    if(!/^\d{5,12}$/.test(String(matchId)))return;
    closeModal();state.view='cricket';state.cricketMatchId=String(matchId);state.cricketTab='all';state.query='';$('#searchInput').value='';
    $('#sidebar').classList.remove('mobile-open');window.location.hash='cricket/'+matchId;render();window.scrollTo({top:0,behavior:'auto'});
  }
  function cricketRoute(hash){
    const match=/^cricket\/(\d{5,12})$/.exec(hash);
    if(match)return {view:'cricket',matchId:match[1]};
    if(['','explore','trending','sports','crypto','technology','markets','world'].includes(hash))return {view:'cricket',matchId:null};
    return ['portfolio','wallet','leaderboard','admin','cricket','matches'].includes(hash)?{view:hash,matchId:null}:null;
  }
  function isSingleOver(m){return m.cricket_kind==='session_runs'&&/^Single over:\s*\d+\b/i.test(m.cricket_period||'');}
  function cricketTabMarkets(markets,tab){
    return markets.filter(m=>tab==='all'||tab==='overs'&&['session_runs','innings_runs'].includes(m.cricket_kind)&&!isSingleOver(m)||tab==='single'&&isSingleOver(m)||tab==='players'&&['player_runs','player_wickets'].includes(m.cricket_kind)||tab==='wickets'&&m.cricket_kind==='wickets');
  }
  function cricketEventScore(){
    const c=state.cricket,m=cricketMatch(state.cricketMatchId),d=c.data,age=Date.now()-Date.parse(d?.sourcePublishedAt||'');
    const delayed=Boolean(c.error||d?.stale||!Number.isFinite(age)||age>600000),competition=m?cricketCompetitionName(m):'';
    return `<div class="ref-event-title"><h1>${m?esc(cricketMatchName(m)):'Match #'+esc(state.cricketMatchId)}${competition?' · '+esc(competition):''}</h1><time>${m?cricketMatchTime(m):'—'} <span>IST</span></time></div><div class="ref-event-scoreline">${m?cricketLiveBadge(m):''}<strong>${m?esc(m.score):c.loading?'Fetching cricket scores…':'Match score unavailable in the current feed'}</strong><button type="button" data-action="refreshCricket" ${c.loading?'disabled':''}>${c.loading?'Refreshing…':'Refresh scores'}</button></div><div class="ref-event-source"><span>${delayed?'FEED DELAYED':'SCORE FEED CONNECTED'}</span><span>${d?.sourcePublishedAt?'Provider update: '+niceTime(d.sourcePublishedAt):'Provider update time unavailable'}</span>${m?`<a href="${safeLink(m.url)}" target="_blank" rel="noopener noreferrer">Full scorecard ↗</a>`:''}</div>${c.error?`<p class="event-score-error" role="status">${esc(c.error)}</p>`:''}`;
  }
  function cricketProviderBoard(match,kind){
    const board=kind==='bookmaker'?match?.bookmaker:match?.odds,time=Date.parse(board?.updatedAt||'');
    const fresh=!state.cricket.error&&!state.cricket.data?.stale&&Number.isFinite(time)&&time<=Date.now()+60000&&Date.now()-time<180000;
    const stopped=fresh&&['suspended','ball_running'].includes(board?.status);
    const teams=match?cricketMatchName(match).split(' v '):['Team 1','Team 2'];
    const title=kind==='bookmaker'?'Bookmaker':'Match Odds';
    const runners=[['one',teams[0]||'Team 1'],['two',teams[1]||'Team 2'],['draw','The Draw']];
    return `<details class="provider-market-board" open><summary><span>${title}</span><small>Read-only provider prices</small></summary><div class="provider-ladder-scroll"><table class="provider-ladder"><thead><tr><th scope="col">SELECTION</th><th colspan="2"></th><th scope="col" class="provider-back-label">Back</th><th scope="col" class="provider-lay-label">Lay</th><th colspan="2"></th></tr></thead><tbody>${runners.map(([key,label])=>`<tr><th scope="row">${esc(label)}</th>${stopped?`<td colspan="6"><div class="provider-halted"><span>${board.status==='suspended'?'Suspended':'Ball Running'}</span></div></td>`:['back','lay'].map(side=>[0,1,2].map(column=>{
      const index=side==='back'?2-column:column,levels=board?.[key]?.[side+'Levels'];
      const point=Array.isArray(levels)?levels[index]:index===0?{price:board?.[key]?.[side]}:null;
      const valid=fresh&&point&&typeof point.price==='number'&&Number.isFinite(point.price)&&point.price>1&&point.price<=1000;
      const size=valid&&typeof point.size==='number'&&Number.isFinite(point.size)&&point.size>=0?num(point.size):'';
      return `<td><span class="provider-price provider-${side} ${index===0?'best-price':''}"><strong>${valid?point.price.toFixed(2):'—'}</strong>${size?`<small>${size}</small>`:''}</span></td>`;
    }).join('')).join('')}</tr>`).join('')}</tbody></table></div><p class="provider-board-note">${fresh?'Provider prices are informational. Free-point predictions below have their own payout rules.':'Verified prices and market status are unavailable from the current score feed.'}</p></details>`;
  }
  function cricketMarketLabel(m){
    const subject=m.cricket_subject||'Team';
    if(m.cricket_kind==='match_winner')return subject+' · Match winner';
    const unit=['wickets','player_wickets'].includes(m.cricket_kind)?'wickets':'runs';
    return subject+' · '+(m.cricket_period||'Full match')+' · '+m.cricket_line+' '+unit;
  }
  function cricketMatchState(match){
    const c=state.cricket,d=c.data,time=Date.parse(match?.statusUpdatedAt||d?.sourcePublishedAt||'');
    if(c.error||d?.stale||!Number.isFinite(time)||Date.now()-time>180000||time>Date.now()+60000)return 'unknown';
    return ['live','completed','scheduled'].includes(match?.status)?match.status:'unknown';
  }
  function cricketLiveCountState(){
    const matches=state.cricket.data?.matches;
    if(!Array.isArray(matches)||!matches.length)return {text:'—',confirmed:0,complete:false};
    const unique=new Map(matches.map(m=>[String(m.id),m])),statuses=[...unique.values()].map(cricketMatchState);
    const count=statuses.filter(status=>status==='live').length,complete=!statuses.includes('unknown');
    return {text:complete?String(count):count?count+'+':'—',confirmed:count,complete};
  }
  function renderCricketLiveCount(){
    const badge=$('#cricketLiveBadge'),count=$('#cricketLiveCount');if(!badge||!count)return;
    const status=cricketLiveCountState();count.textContent=status.text;
    badge.classList.toggle('has-live',status.confirmed>0);badge.classList.toggle('unconfirmed',!status.complete);
    badge.title=status.complete?status.confirmed+' confirmed live cricket matches':status.confirmed?'At least '+status.confirmed+' confirmed live matches; some statuses are unavailable.':'Live count unavailable: the score feed does not confirm match status.';
    badge.setAttribute('aria-label',badge.title);
  }
  function cricketLiveBadge(match){
    const status=cricketMatchState(match);
    return status==='live'?'<span class="match-state live">● LIVE</span>':status==='completed'?'<span class="match-state">FINISHED</span>':status==='scheduled'?'<span class="match-state">UPCOMING</span>':'<span class="match-state unknown">STATUS UNCONFIRMED</span>';
  }
  function cricketRunnerName(m,side){
    if(m.cricket_kind!=='match_winner')return cricketMarketLabel(m);
    if(side==='yes')return m.cricket_subject;
    return cricketMatchName(cricketMatch(m.cricket_match_id)||{score:''}).split(' v ').find(team=>team&&team.toLowerCase()!==String(m.cricket_subject).toLowerCase())||'Other team';
  }
  function cricketInlineEntry(m){
    const backing=m.cricket_kind==='match_winner'?state.voteChoice===(state.cricketRunner||'yes'):state.voteChoice==='yes';
    const bal=Number(state.profile?.coin_balance||0),n=state.stake,blocked=state.busy||n>bal||marketStatus(m)!=='open'||Boolean(ownPick(m.id));
    return `<tr class="inline-entry-row"><td colspan="3"><div class="inline-entry ${backing?'back-entry':'lay-entry'}"><div class="inline-entry-title"><strong>${esc(m.cricket_kind==='match_winner'?cricketRunnerName(m,state.cricketRunner||'yes'):cricketMarketLabel(m))}</strong><span>${m.cricket_kind==='match_winner'?(backing?'SUPPORT':'OPPOSE'):esc(state.voteChoice==='yes'?'OVER':'UNDER / EQUAL')} · 2× POINTS</span><button type="button" data-action="clearEventPick">× <span class="sr-only">Cancel</span></button></div><div class="inline-entry-controls"><div class="inline-amount"><button type="button" data-action="stepStake" data-step="-1" aria-label="Decrease stake" ${n===10?'disabled':''}>−</button><output aria-label="Point stake">${n}</output><button type="button" data-action="stepStake" data-step="1" aria-label="Increase stake" ${n===100?'disabled':''}>+</button></div><div class="inline-presets">${[10,25,50,100].map(value=>`<button type="button" data-action="stake" data-stake="${value}" class="${n===value?'active':''}">${value}</button>`).join('')}</div><button class="inline-confirm" type="button" data-action="submitVote" ${blocked?'disabled':''}>${state.busy?'Submitting…':'Place prediction'}</button><button class="inline-cancel" type="button" data-action="clearEventPick">Cancel</button></div><div class="inline-entry-review"><span>Balance: ${num(bal)}</span><span>Stake: −${n}</span><span>If correct: +${n*2} returned</span><span>If incorrect: −${n}</span><span>Free points · No cash value</span></div>${n>bal?'<p class="form-error">Insufficient points.</p>':''}<details><summary>Settlement rules</summary><p>${esc(m.description||'')}</p></details></div></td></tr>`;
  }
  function cricketEventRow(m){
    const status=marketStatus(m),pick=ownPick(m.id),selected=state.modal?.type==='vote'&&state.modal.marketId===m.id;
    const runners=m.cricket_kind==='match_winner'?['yes','no']:['yes'];
    return runners.map(runner=>{
      const label=m.cricket_kind==='match_winner'?cricketRunnerName(m,runner):cricketMarketLabel(m);
      const sides=m.cricket_kind==='match_winner'?[runner,runner==='yes'?'no':'yes']:['no','yes'];
      return `<tr><td><strong class="event-question">${esc(label)}</strong><div class="event-row-meta">${status==='open'?'Closes '+niceTime(m.ends_at):esc(status.toUpperCase())}</div><button class="event-rules" type="button" data-action="detail" data-id="${esc(m.id)}">Rules / details ↗</button></td>${sides.map((side,index)=>`<td><button type="button" class="event-choice ${(m.cricket_kind==='match_winner'?index===0:side==='yes')?'event-back':'event-lay'} ${selected&&state.voteChoice===side?'selected':''}" data-action="vote" data-id="${esc(m.id)}" data-choice="${side}" data-runner="${runner}" ${status!=='open'||pick?'disabled':''}><strong>${m.cricket_kind==='match_winner'?(index===0?'Support':'Oppose'):(side==='yes'?'Over '+m.cricket_line:'Under / equal '+m.cricket_line)}</strong><small>${pick?'✓ Pick recorded':status==='open'?'2× points if correct':status.toUpperCase()}</small></button></td>`).join('')}</tr>${selected&&(state.cricketRunner||'yes')===runner?cricketInlineEntry(m):''}`;
    }).join('');
  }
  function cricketUnavailableWinners(){
    const match=cricketMatch(state.cricketMatchId);if(!match)return cricketEventTable([],'Match winner unavailable');
    const teams=cricketMatchName(match).split(' v ');
    return `<div class="event-table-wrap"><table class="event-table"><thead><tr><th scope="col">TEAM</th><th scope="col" class="event-yes-label">SUPPORT</th><th scope="col" class="event-no-label">OPPOSE</th></tr></thead><tbody>${teams.map(team=>`<tr><td><strong class="event-question">${esc(team)}</strong></td><td><button class="event-choice event-back" type="button" disabled>Unavailable</button></td><td><button class="event-choice event-lay" type="button" disabled>Unavailable</button></td></tr>`).join('')}</tbody></table></div><p class="unavailable-market-note">Market data is unavailable. Scores alone cannot create verified odds or settlement lines.</p>`;
  }
  function cricketEventTable(markets,empty){
    return markets.length?`<div class="event-table-wrap"><table class="event-table"><thead><tr><th scope="col">SELECTION / CUTOFF</th><th scope="col" class="${markets[0]?.cricket_kind==='match_winner'?'event-yes-label':'event-no-label'}">${markets[0]?.cricket_kind==='match_winner'?'SUPPORT':'NO'}</th><th scope="col" class="${markets[0]?.cricket_kind==='match_winner'?'event-no-label':'event-yes-label'}">${markets[0]?.cricket_kind==='match_winner'?'OPPOSE':'YES'}</th></tr></thead><tbody>${markets.map(cricketEventRow).join('')}</tbody></table></div>`:`<div class="event-empty"><strong>${empty}</strong><p>Selection is unavailable until a verified market line and cutoff are supplied.</p></div>`;
  }
  function cricketEventHistory(markets){
    const ids=new Set(markets.map(m=>m.id)),picks=state.predictions.filter(p=>ids.has(p.market_id));
    return `<section class="event-history ref-event-history"><h2>My placed predictions</h2><div class="placed-picks-scroll"><table><thead><tr><th>Selection</th><th>Return</th><th>Stake</th></tr></thead><tbody>${picks.length?picks.map(p=>{const m=getMarket(p.market_id);return `<tr><td><button type="button" data-action="detail" data-id="${esc(p.market_id)}">${esc(m?cricketMarketLabel(m):'Prediction')}</button><span>${esc(p.choice.toUpperCase())}</span>${resultBadge(p)}</td><td>${p.status==='pending'?'2× if correct':num(p.payout||0)}</td><td>${num(p.stake)}<small>points</small></td></tr>`;}).join(''):`<tr><td colspan="3" class="placed-picks-empty">${state.profile?'No predictions on this match yet.':'Sign in to see your match predictions.'}</td></tr>`}</tbody></table></div></section>`;
  }
  function cricketEventView(){
    const match=cricketMatch(state.cricketMatchId),markets=state.markets.filter(m=>String(m.cricket_match_id)===state.cricketMatchId);
    const winners=markets.filter(m=>m.cricket_kind==='match_winner'),others=markets.filter(m=>m.cricket_kind!=='match_winner');
    const tabs=[['all','All'],['overs','Overs'],['single','Single over'],['players','Batsman / players'],['wickets','Wickets']];
    const filtered=cricketTabMarkets(others,state.cricketTab).filter(m=>!state.query||cricketMarketLabel(m).toLowerCase().includes(state.query.toLowerCase()));
    return `<div class="event-breadcrumb"><button type="button" data-view="matches">← All cricket matches</button><span>CRICKET / MATCH</span></div><div class="event-workspace ref-event-workspace"><div class="event-main"><section class="event-scoreboard" id="cricketScores" aria-live="polite">${cricketEventScore()}</section>${cricketProviderBoard(match,'match')}${cricketProviderBoard(match,'bookmaker')}<div class="event-admin-bar"><span>Free-point markets · 10–100 points · Fixed 2× payout</span>${state.admin&&match?`<button type="button" data-action="createCricket" data-id="${esc(state.cricketMatchId)}">+ Add market</button>`:''}</div>${winners.length?`<section class="event-market"><h2 class="event-market-title"><span>Match winner · Free points</span><small>10–100 virtual points</small></h2>${cricketEventTable(winners,'Match winner unavailable')}</section>`:''}<section class="event-market ref-fancy-market"><h2 class="event-market-title"><span>Session & player lines</span><small>Read each cutoff</small></h2><div class="event-tabs" role="group" aria-label="Prediction categories">${tabs.map(([tab,label])=>`<button type="button" data-action="eventTab" data-tab="${tab}" class="${tab===state.cricketTab?'active':''}" aria-pressed="${tab===state.cricketTab}">${label}<span>${cricketTabMarkets(others,tab).length}</span></button>`).join('')}</div>${cricketEventTable(filtered,'No lines available in this section')}</section><div class="event-data-note"><strong>Score feed ≠ settlement</strong><p>Scores may be delayed. Player and session results are verified against the question's declared source before points are settled.</p></div></div><aside class="event-side">${cricketEventHistory(markets)}<div class="event-balance-summary"><strong>Available points: ${num(state.profile?.coin_balance||0)}</strong><span>Free points · No cash value</span></div></aside></div>`;
  }
  function openCricketCreate(matchId){
    if(!state.admin||!sb){toast('Admin access required.','error');return;}
    const match=cricketMatch(matchId);if(!match)return;
    state.cricketMatchId=matchId;state.modal={type:'cricketCreate'};
    const end=new Date(Date.now()+30*60000);end.setMinutes(end.getMinutes()-end.getTimezoneOffset());
    const teams=cricketMatchName(match).split(' v ');
    modal(`<div class="eyebrow">ADMIN · CRICKET</div><h2>Add cricket market</h2><p class="modal-intro">${esc(cricketMatchName(match))}</p><form id="cricketCreateForm" class="admin-form"><div class="field"><label for="cricketKind">Prediction type</label><select name="kind" id="cricketKind">${Object.entries(CRICKET_KINDS).map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}<option value="single_over">Single over runs</option></select></div><div class="field"><label for="cricketSubject">Exact team or player</label><input id="cricketSubject" name="subject" required minlength="2" maxlength="80" value="${esc(teams[0])}" placeholder="Team name, or full player name"></div><div class="two-col"><div class="field"><label for="cricketLine">Over / Under line (ignored for winner)</label><input id="cricketLine" name="line" type="number" min="0" max="1000" step="0.5" value="49.5"></div><div class="field"><label for="cricketPeriod">Innings and exact period</label><input id="cricketPeriod" name="period" required minlength="3" maxlength="100" value="Full match" placeholder="1st innings, overs 1–6; or full innings"></div></div><div class="field"><label for="cricketEnd">Predictions close (local time)</label><input id="cricketEnd" name="ends_at" type="datetime-local" value="${end.toISOString().slice(0,16)}" required></div><div class="field"><label for="cricketRules">Exact settlement and refund rules</label><textarea id="cricketRules" name="rules" required minlength="30" maxlength="650" placeholder="Declare innings, overs, how DLS / reduced overs / retirement / abandoned matches are handled, and when to VOID."></textarea></div><p class="subtle">Close at least 5 minutes from now, before the deciding event. Only publish unresolved outcomes. Session/player results require admin verification against the official scorecard.</p><div id="cricketCreateError" class="form-error" role="alert"></div><button class="btn-primary modal-submit" type="submit">Publish market</button></form>`);
  }
  function buildCricketQuestion(kind,subject,line,period,matchName){
    if(kind==='match_winner')return `Will ${subject} win ${matchName}?`;
    const unit=kind.includes('wickets')?'wickets':'runs';
    return `Will ${subject} ${unit==='runs'?'score':kind==='player_wickets'?'take':'lose'} over ${line} ${unit} (${period})?`;
  }
  async function createCricketMarket(form){
    if(!sb||!state.admin||state.busy)return;
    const match=cricketMatch(state.cricketMatchId);if(!match)return;
    const singleOver=form.kind.value==='single_over';
    const kind=singleOver?'session_runs':form.kind.value,subject=form.subject.value.trim(),period=form.period.value.trim(),rules=form.rules.value.trim();
    const line=kind==='match_winner'?null:Number(form.line.value),end=new Date(form.ends_at.value),errorEl=$('#cricketCreateError');
    errorEl.textContent='';
    if(singleOver&&!/^Single over:\s*([1-9]\d?|100)\b/i.test(period)){errorEl.textContent='Use period: Single over: 11 · 1st innings (change the over and innings).';return;}
    if(!CRICKET_KINDS[kind]||subject.length<2||period.length<3||rules.length<30||isNaN(end.getTime())||end.getTime()<=Date.now()+300000){errorEl.textContent='Add exact rules and a cutoff at least 5 minutes from now.';return;}
    if(kind!=='match_winner'&&(!form.line.value||!Number.isFinite(line)||line<0||line>1000||line*2%1!==0||(kind.includes('wickets')&&line>=10))){errorEl.textContent='Use a valid whole / half line. Wicket lines must be below 10.';return;}
    const question=buildCricketQuestion(kind,subject,line,period,cricketMatchName(match));
    const choiceRule=kind==='match_winner'?'YES: named team wins; NO: other team wins. Tie, draw, abandonment or no result: VOID.':`YES: strictly more than ${line}; NO: ${line} or less. `;
    const description=`${CRICKET_KINDS[kind]} · ${cricketMatchName(match)} · ${period}. ${choiceRule} ${rules} Verify: ${match.url}`;
    if(question.length>220||description.length>1000){errorEl.textContent='Question or rules are too long. Shorten the subject / period / rules.';return;}
    const button=form.querySelector('button[type="submit"]');state.busy=true;button.disabled=true;
    try{
      const {error}=await sb.rpc('admin_create_cricket_market',{p_match_id:match.id,p_kind:kind,p_subject:subject,p_line:line,p_period:period,p_question:question,p_description:description,p_ends_at:end.toISOString()});
      if(error)throw error;await loadLive();state.busy=false;openMatchPredictions(match.id);toast('Cricket market published.','success');
    }catch(e){if($('#cricketCreateError'))$('#cricketCreateError').textContent=humanError(e);else toast(humanError(e),'error');}
    finally{state.busy=false;button.disabled=false;}
  }
  function cricketPanel() {
    return `<section class="cricket-panel" aria-label="Cricket matches"><div class="section-heading"><div><div class="eyebrow">SPORTS / CRICKET</div><h2>🏏 Cricket score feed</h2><p>Current scores from ESPNcricinfo. Auto-refresh every 2 minutes while this page is visible.</p></div><button class="btn-outline btn-small" data-action="refreshCricket" type="button">Refresh scores</button></div><div id="cricketScores" aria-live="polite">${cricketContent()}</div><p class="subtle">Scores can be delayed by the provider. * marks the batting side in the source feed. Scores do not automatically settle prediction questions.</p></section>`;
  }
  function cricketView(){
    if(state.view==='matches')return cricketMatchesView();
    if(state.cricketMatchId)return cricketEventView();
    return `<section class="ref-home-hero"><img src="assets/cricket-arena-v1.webp" alt="" aria-hidden="true" width="1440" height="720" fetchpriority="high"><div class="ref-hero-shape" aria-hidden="true"></div><div class="ref-hero-copy"><span class="ref-hero-eyebrow">WELCOME TO OPINZO CRICKET</span><h1><span>ALL ABOUT</span><br>CRICKET.</h1><p>One game. Every perspective.</p><div class="ref-hero-description">Follow the scores, back your knowledge and build your cricket track record with free virtual points.</div><button type="button" data-action="scrollCricket">EXPLORE MATCHES <span aria-hidden="true">↗</span></button><span class="ref-free-note">FREE TO PLAY · NO CASH VALUE</span></div><div class="ref-hero-badge"><span aria-hidden="true">🏏</span><strong>YOUR GAME.<br>YOUR CALL.</strong></div></section><section class="ref-feature-tiles" aria-label="Cricket sections"><button type="button" data-action="homeFilter" data-kind="winner"><span class="ref-tile-icon" aria-hidden="true">🏆</span><span><small>CHOOSE YOUR SIDE</small><strong>MATCH WINNER</strong><em>Explore team selections ↗</em></span></button><button type="button" data-action="homeFilter" data-kind="sessions"><span class="ref-tile-icon" aria-hidden="true">🏏</span><span><small>EVERY OVER COUNTS</small><strong>SESSIONS & OVERS</strong><em>Browse run lines ↗</em></span></button><button type="button" data-action="homeFilter" data-kind="players"><span class="ref-tile-icon" aria-hidden="true">✦</span><span><small>FOLLOW THE PLAYERS</small><strong>PLAYER MARKETS</strong><em>Runs and wickets ↗</em></span></button></section><div class="ref-home-matchlist" id="cricketMatchList">${cricketPanel()}</div><section class="ref-access-banner"><div class="ref-phone" aria-hidden="true"><span>OPINZO<span>🏏</span></span></div><div><span class="ref-access-eyebrow">OPINZO CRICKET</span><h2>Your matchday.<br>On every screen.</h2><p>Cricket scores and your prediction history, on desktop and mobile.</p></div><button type="button" data-view="portfolio">MY PREDICTIONS ↗</button></section><section class="ref-home-faq" aria-label="Cricket frequently asked questions"><details><summary>How does Opinzo Cricket work?</summary><p>Choose a match, read the market rules, then select a team or line using free virtual points. Confirm the stake before placing your prediction.</p></details><details><summary>Can I deposit or withdraw money?</summary><p>No. Opinzo uses free, non-transferable virtual points. They cannot be purchased, withdrawn or converted into cash.</p></details><details><summary>Are all matches and scores live?</summary><p>Scores come from ESPNcricinfo and may be delayed. A LIVE label is only shown when the provider explicitly confirms live status. Market selections require published lines and cutoff rules.</p></details></section><footer class="ref-home-footer"><div class="ref-footer-top"><span>🏏 CRICKET ONLY</span><span>FREE VIRTUAL POINTS</span><span>ENGLISH · हिंदी · मराठी</span></div><div class="ref-footer-columns"><div class="ref-footer-brand"><strong>OPIN<span>ZO</span></strong><p>A dedicated home for cricket scores, team selections and your prediction record.</p><small>Free to play. No cash value.</small></div><div><h3>Cricket</h3><button type="button" data-action="scrollCricket">Match centre</button><button type="button" data-action="homeFilter" data-kind="winner">Match winner</button><button type="button" data-action="homeFilter" data-kind="sessions">Sessions & overs</button><button type="button" data-action="homeFilter" data-kind="players">Player markets</button></div><div><h3>Your Opinzo</h3><button type="button" data-action="auth">My account</button><button type="button" data-view="portfolio">My predictions</button><button type="button" data-view="wallet">Point wallet</button><button type="button" data-view="leaderboard">Leaderboard</button></div><div><h3>How to play</h3><button type="button" data-action="showHow">Getting started</button><p>Read the cutoff. Review the rules. Confirm your free-point stake.</p><p>Results are settled after verification.</p></div></div><div class="ref-footer-bottom">© ${new Date().getFullYear()} Opinzo Cricket · Free-to-play · Non-transferable points · No money value</div></footer>`;
  }
  const CRICKET_COMPETITIONS=[
    {id:'odi',name:'One Day Internationals',aliases:['ODI','One Day International','One Day Internationals']},
    {id:'sa-t20',name:'South Africa T20 Challenge',aliases:['South Africa T20 Challenge','CSA T20 Challenge']},
    {id:'wbbl',name:'WBBL',aliases:['WBBL',"Women's Big Bash League"]},
    {id:'tests',name:'Test Matches',aliases:['Tests','Test Matches','Test Match']},
    {id:'one-day',name:'One Day Matches',aliases:['One Day Matches','One Day Match']},
    {id:'abu-dhabi-t10',name:'Abu Dhabi T10',aliases:['Abu Dhabi T10']},
    {id:'npl',name:'Nepal Premier League',aliases:['Nepal Premier League']}
  ];
  function cricketCompetitionName(match){
    const c=match.competition;
    return typeof c==='string'?c.trim():c&&typeof c.name==='string'?c.name.trim():'';
  }
  function cricketCompetitionId(match){
    const name=cricketCompetitionName(match);if(!name)return 'unclassified';
    const normalized=name.toLowerCase().replace(/\s+/g,' ');
    return CRICKET_COMPETITIONS.find(c=>c.aliases.some(alias=>alias.toLowerCase()===normalized))?.id||'provider:'+normalized;
  }
  function cricketCompetitionGroups(){
    const matches=state.cricket.data?.matches||[],groups=CRICKET_COMPETITIONS.map(c=>({...c,matches:[]}));
    for(const match of matches){const id=cricketCompetitionId(match);let group=groups.find(g=>g.id===id);if(!group){group={id,name:id==='unclassified'?'Unclassified matches':cricketCompetitionName(match),matches:[]};groups.push(group);}group.matches.push(match);}
    return groups;
  }
  function renderCompetitionNav(){
    const target=$('#cricketCompetitionNav'),toggle=$('#cricketLeagueToggle');if(!target||!toggle)return;
    const sidebar=$('#sidebar'),scrollTop=sidebar?.scrollTop||0;
    const c=state.cricket;target.hidden=!c.competitionsOpen;toggle.setAttribute('aria-expanded',String(c.competitionsOpen));toggle.classList.toggle('active',state.view==='matches'||(state.view==='cricket'&&Boolean(state.cricketMatchId)));
    target.innerHTML=`<button type="button" class="competition-all ${c.competition==='all'?'selected':''}" data-action="competitionAll">All cricket matches</button>${cricketCompetitionGroups().map((group,index)=>{const expanded=(c.expandedCompetitions||[]).includes(group.id),panelId='competition-fixtures-'+index;return `<div class="competition-group"><div class="competition-heading ${c.competition===group.id?'selected':''}"><button class="competition-name" type="button" data-action="competitionSelect" data-id="${esc(group.id)}">${esc(group.name)}</button><button class="competition-expand" type="button" data-action="competitionExpand" data-id="${esc(group.id)}" aria-expanded="${expanded}" aria-controls="${panelId}" aria-label="${esc((expanded?'Collapse ':'Expand ')+group.name)}">${expanded?'−':'+'}</button></div><div class="competition-fixtures" id="${panelId}" role="group" aria-label="${esc(group.name)}" ${expanded?'':'hidden'}>${group.matches.length?group.matches.map(match=>`<button type="button" data-action="matchPredictions" data-id="${esc(match.id)}"><span class="fixture-name">${esc(cricketMatchName(match))}</span><span class="fixture-open" aria-hidden="true">↗</span>${cricketMatchTime(match)!=='—'?`<span class="fixture-time">${cricketMatchTime(match)}</span>`:''}</button>`).join(''):'<p>Competition data unavailable</p>'}</div></div>`;}).join('')}<p class="competition-note">League classification is not supplied by the current score feed.</p>`;
    if(sidebar)sidebar.scrollTop=scrollTop;
  }
  function cricketMatchesView(){
    return `<section class="cricket-list-banner"><img src="assets/cricket-arena-v1.webp" alt="" aria-hidden="true" width="1440" height="720"><div><span>OPINZO</span><h1>CRICKET</h1><p>Match centre · Schedule · Scores</p></div></section><section class="cricket-list-board"><div class="cricket-list-heading"><h2>Cricket${state.cricket.competition&&state.cricket.competition!=='all'?' / '+esc(cricketCompetitionGroups().find(g=>g.id===state.cricket.competition)?.name||'Competition'):''}</h2><label class="mobile-competition-picker"><span class="sr-only">Competition</span><select id="mobileCompetitionSelect" aria-label="Competition"><option value="all">All cricket matches</option>${cricketCompetitionGroups().map(g=>`<option value="${esc(g.id)}" ${state.cricket.competition===g.id?'selected':''}>${esc(g.name)}</option>`).join('')}</select></label><button type="button" data-action="refreshCricket">Refresh</button></div><div id="cricketScores" aria-live="polite">${cricketContent()}</div></section><div class="cricket-list-explainer"><span>Times shown in IST (Asia/Kolkata).</span><span>“—” means the provider has not supplied verified data.</span></div>`;
  }
  function cricketMatchTime(match){
    const time=Date.parse(match.startsAt||'');
    return Number.isFinite(time)?new Date(time).toLocaleString(window.OPINZO_I18N?.dateLocale||'en-IN',{timeZone:'Asia/Kolkata',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',hour12:false}):'—';
  }
  function cricketPriceCell(match,runner,side){
    const odds=match.odds,time=Date.parse(odds?.updatedAt||''),price=odds?.[runner]?.[side];
    const verified=!state.cricket.error&&!state.cricket.data?.stale&&Number.isFinite(time)&&time<=Date.now()+60000&&Date.now()-time<180000&&typeof price==='number'&&Number.isFinite(price)&&price>1&&price<=1000;
    return `<td class="cricket-price-cell"><button type="button" class="cricket-price ${side==='back'?'price-back':'price-lay'}" ${verified?`data-action="matchPredictions" data-id="${esc(match.id)}"`:'disabled'} title="${verified?'Open match · provider price, not a guaranteed payout':'Verified odds unavailable'}">${verified?price.toFixed(2):'—'}</button></td>`;
  }
  function cricketExchangeRows(matches){
    const filter=state.cricket.listFilter||'all',statusFor={live:'live',upcoming:'scheduled',finished:'completed'};
    const rows=matches.filter(m=>(!state.cricket.competition||state.cricket.competition==='all'||cricketCompetitionId(m)===state.cricket.competition)&&(!state.query||String(m.score||'').toLowerCase().includes(state.query.toLowerCase()))&&(filter==='all'||cricketMatchState(m)===statusFor[filter]));
    rows.sort((a,b)=>{const rank={live:0,scheduled:1,unknown:2,completed:3};const difference=rank[cricketMatchState(a)]-rank[cricketMatchState(b)];if(difference)return difference;const at=Date.parse(a.startsAt||''),bt=Date.parse(b.startsAt||'');return Number.isFinite(at)&&Number.isFinite(bt)?at-bt:0;});
    if(!rows.length)return `<div class="cricket-list-empty"><h3>No verified matches for this filter</h3><p>The current score feed does not supply match schedules, live status or exchange odds.</p><button type="button" data-action="competitionAll">Show all matches</button></div>`;
    return `<div class="cricket-exchange-scroll"><table class="cricket-exchange-table"><caption class="sr-only">Cricket match schedule, status and provider prices. Times in IST. Missing data is shown as a dash.</caption><thead><tr><th scope="col" class="cricket-event-label">DATE / TIME (IST) · MATCH</th><th scope="colgroup" colspan="2">1</th><th scope="colgroup" colspan="2">X</th><th scope="colgroup" colspan="2">2</th></tr></thead><tbody>${rows.map(match=>`<tr><td><div class="cricket-compact-match"><time class="cricket-start-time" ${Number.isFinite(Date.parse(match.startsAt||''))?`datetime="${esc(match.startsAt)}"`:''}>${cricketMatchTime(match)}</time><span class="cricket-row-divider">|</span><button type="button" class="cricket-match-link" data-action="matchPredictions" data-id="${esc(match.id)}">${esc(cricketMatchName(match))}</button>${cricketLiveBadge(match)}</div></td>${['one','draw','two'].map(runner=>['back','lay'].map(side=>cricketPriceCell(match,runner,side)).join('')).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  function cricketListContent(){
    const c=state.cricket,d=c.data;
    const controls=`<div class="cricket-list-controls">${[['all','All matches'],['live','Live'],['upcoming','Upcoming'],['finished','Finished']].map(([key,label])=>`<button type="button" data-action="listFilter" data-filter="${key}" class="${(c.listFilter||'all')===key?'active':''}" aria-pressed="${(c.listFilter||'all')===key}">${label}</button>`).join('')}<span>${state.cricket.competition&&state.cricket.competition!=='all'?esc(cricketCompetitionGroups().find(g=>g.id===state.cricket.competition)?.name||'Competition')+' · ':''}1 = Team 1 · X = Draw · 2 = Team 2</span></div>`;
    if(!d)return controls+`<div class="cricket-list-empty"><h3>${c.loading?'Fetching cricket scores…':'Scores temporarily unavailable'}</h3><p>${esc(c.error||'Connecting to the score provider.')}</p></div>`;
    return controls+`<div class="cricket-list-data-note">Schedule, confirmed match status and exchange odds are not included in the current score feed. Missing values remain unavailable.</div>${c.error?`<p class="form-error">${esc(c.error)} Showing the last received scores.</p>`:''}${cricketExchangeRows(d.matches)}<div class="cricket-list-source"><span>Source: ESPNcricinfo score feed</span><span>${c.loading?'Refreshing…':d.sourcePublishedAt?'Provider update: '+niceTime(d.sourcePublishedAt):'Provider update time unavailable'}</span><span>Blue: Back · Pink: Lay · Provider prices are informational</span></div>`;
  }
  function cricketRows(matches) {
    const c=state.cricket;
    const kinds=c.kind==='players'?['player_runs','player_wickets']:c.kind==='sessions'?['session_runs','innings_runs']:c.kind==='wickets'?['wickets']:c.kind==='winner'?['match_winner']:null;
    const rows=matches.map(match=>{
      const markets=state.markets.filter(m=>String(m.cricket_match_id)===String(match.id)&&marketStatus(m)==='open'&&(!kinds||kinds.includes(m.cricket_kind)));
      return {match,markets};
    }).filter(({match,markets})=>(!state.query||String(match.score).toLowerCase().includes(state.query.toLowerCase()))&&(!c.onlyLive||cricketMatchState(match)==='live')&&(!(c.onlyOpen||kinds)||markets.length));
    if(!rows.length)return `<div class="empty-state"><h3>No matches for this filter</h3><p>Try all matches or a different filter. The score feed does not confirm live status.</p><button class="btn-outline" type="button" data-action="cricketAll">Show all matches</button></div>`;
    return `<div class="sports-table-wrap"><table class="sports-table"><caption class="sr-only">Cricket scores and published virtual-point predictions</caption><thead><tr><th scope="col">MATCH / MARKET</th><th scope="col">SCORE FEED</th><th scope="col" class="yes-column">YES</th><th scope="col" class="no-column">NO</th><th scope="col">DETAILS</th></tr></thead><tbody>${rows.map(({match,markets})=>{
      const m=markets[0],pick=m&&ownPick(m.id);
      const choices=m&&!pick?`<td><button class="sports-choice sports-yes" type="button" data-action="vote" data-choice="yes" data-id="${esc(m.id)}"><strong>${esc(cricketChoice(m,'yes'))}</strong><small>2× points if correct</small></button></td><td><button class="sports-choice sports-no" type="button" data-action="vote" data-choice="no" data-id="${esc(m.id)}"><strong>${esc(cricketChoice(m,'no'))}</strong><small>2× points if correct</small></button></td>`:`<td colspan="2"><span class="sports-pending">${pick?'✓ Prediction recorded':'Market unavailable'}</span></td>`;
      return `<tr><td><div class="sports-match-name"><span class="sports-ball" aria-hidden="true">🏏</span><strong>${esc(cricketMatchName(match))}</strong>${cricketLiveBadge(match)}</div><div class="sports-match-question">${m?esc(cricketMarketLabel(m)):'Team and session lines unavailable'}</div><a class="sports-score-link" href="${safeLink(match.url)}" target="_blank" rel="noopener noreferrer">Full scorecard ↗</a></td><td><span class="sports-score">${esc(match.score)}</span></td>${choices}<td><button class="sports-open" type="button" data-action="matchPredictions" data-id="${esc(match.id)}">Open match <span aria-hidden="true">↗</span></button><small class="sports-open-count">${markets.length} open</small></td></tr>`;
    }).join('')}</tbody></table></div>`;
  }
  function cricketContent() {
    if(state.view==='matches')return cricketListContent();
    if(state.view==='cricket'&&state.cricketMatchId)return cricketEventScore();
    const c=state.cricket,d=c.data;
    if(!d)return `<div class="empty-state"><h3>${c.loading?'Fetching cricket scores…':c.error?'Scores temporarily unavailable':'Loading match centre…'}</h3><p>${esc(c.error||'Connecting to the score provider.')}</p></div>`;
    const age=Date.now()-Date.parse(d.sourcePublishedAt||'');
    const delayed=Boolean(c.error||d.stale||!Number.isFinite(age)||age>600000);
    return `<div class="sports-toolbar"><div class="sports-tabs" role="group" aria-label="Match filters"><button type="button" data-action="cricketAll" class="${!c.onlyOpen&&!c.onlyLive?'active':''}" aria-pressed="${!c.onlyOpen&&!c.onlyLive}">All matches</button><button type="button" data-action="cricketLive" class="${c.onlyLive?'active':''}" aria-pressed="${c.onlyLive}">Live</button><button type="button" data-action="cricketOpen" class="${c.onlyOpen?'active':''}" aria-pressed="${c.onlyOpen}">Open markets</button></div><label class="sports-kind-label"><span class="sr-only">Prediction type</span><select id="cricketKindFilter" aria-label="Prediction type">${[['all','All prediction types'],['winner','Match winner'],['sessions','Sessions / runs'],['players','Players'],['wickets','Team wickets']].map(([value,label])=>`<option value="${value}" ${c.kind===value?'selected':''}>${label}</option>`).join('')}</select></label></div><div class="cricket-status"><span class="mini-tag ${delayed?'':'yes'}">${delayed?'FEED DELAYED':'SCORE FEED CONNECTED'}</span><span>${d.sourcePublishedAt?'Provider update: '+niceTime(d.sourcePublishedAt):'Provider update time unavailable'}</span>${c.loading?'<span>Refreshing…</span>':''}</div>${c.error?`<p class="form-error">${esc(c.error)} Showing the last received scores.</p>`:''}<p class="match-status-note">Live status is not supplied by this score feed. Unconfirmed matches are not marked LIVE.</p>${cricketRows(d.matches)}<p class="subtle sports-source">Source: <a class="muted-link" href="https://static.espncricinfo.com/rss/livescores.xml" target="_blank" rel="noopener noreferrer">ESPNcricinfo score feed</a> · Last received ${niceTime(d.retrievedAt)}</p>`;
  }
  async function loadCricket(force=false,background=false){
    const c=state.cricket;
    if(c.loading||document.visibilityState==='hidden'||(!background&&!$('#cricketScores')))return;
    if(Date.now()-c.lastAttempt<10000||(!force&&c.data&&Date.now()-c.fetchedAt<120000))return;
    c.loading=true;c.lastAttempt=Date.now();const scoreTarget=$('#cricketScores');if(scoreTarget)scoreTarget.innerHTML=cricketContent();
    try{
      if(!CONFIG.supabaseUrl||!CONFIG.supabaseAnonKey)throw Error('Live scores require an online connection.');
      const response=await fetch(CONFIG.supabaseUrl+'/functions/v1/cricket-live',{headers:{apikey:CONFIG.supabaseAnonKey},signal:AbortSignal.timeout(15000)});
      const d=await response.json();if(!response.ok)throw Error(d.error||'Score provider unavailable.');
      if(!Array.isArray(d.matches)||!d.matches.length)throw Error('No current scores returned.');
      c.data=d;c.error='';c.fetchedAt=Date.now();
    }catch(e){c.error=e.name==='TimeoutError'?'Score request timed out. Please retry.':humanError(e);}
    finally{c.loading=false;const target=$('#cricketScores');if(state.view==='cricket'&&state.cricketMatchId)renderMain();else{if(target)target.innerHTML=cricketContent();renderCompetitionNav();}renderCricketLiveCount();}
  }
  function renderMain() {
    document.body.classList.add('sports-mode');
    document.body.classList.add('cricket-home-mode');
    document.body.classList.toggle('cricket-landing-mode',state.view==='cricket'&&!state.cricketMatchId);
    document.body.classList.toggle('cricket-list-mode',state.view==='matches'||(state.view==='cricket'&&Boolean(state.cricketMatchId)));
    $('#searchInput').placeholder='Search teams, players or markets…';
    document.body.classList.toggle('cricket-event-mode',state.view==='cricket'&&Boolean(state.cricketMatchId));
    const output=['cricket','matches'].includes(state.view)?cricketView():state.view==='portfolio'?portfolioView():state.view==='wallet'?walletView():state.view==='leaderboard'?leaderboardView():state.view==='admin'?adminView():cricketView();
    $('#mainContent').innerHTML=(state.error?`<div class="info-banner"><span class="info-symbol">!</span><div><strong>Backend notice</strong><p>${esc(state.error)}</p></div></div>`:'')+output;
    if($('#cricketScores'))window.setTimeout(()=>loadCricket(false),0);
    const defaultTime=new Date(Date.now()+86400000);defaultTime.setMinutes(defaultTime.getMinutes()-defaultTime.getTimezoneOffset());
    const endInput=$('#adminEnd');if(endInput&&!endInput.value)endInput.value=defaultTime.toISOString().slice(0,16);
    renderCompetitionNav();
  }
  function renderRail() {
    const p=state.profile,stats=getStats(),top=state.leaderboard.slice(0,4);
    $('#rightRail').innerHTML=`<div class="rail-header">Your overview</div><div class="rail-card rail-wallet"><div class="rail-card-label">◈ &nbsp; Opinzo Points</div><div class="rail-balance"><span class="coin-icon">◈</span> ${p?num(p.coin_balance):'—'}</div><div class="rail-card-note">Virtual balance · No cash value</div><div class="rail-divider"></div><div class="rail-mini-stat"><span>Active predictions</span><b>${p?stats.active:'—'}</b></div><div class="rail-mini-stat"><span>Correct picks</span><b>${p?stats.wins:'—'}</b></div><button class="btn-outline btn-small" type="button" data-view="wallet">View wallet ↗</button></div><div class="rail-header">🏆 &nbsp;Top predictors</div><div class="rail-card"><div class="rail-leaders">${top.length?top.map((u,i)=>`<div class="rail-leader"><span class="leader-avatar ${i===1?'second':i===2?'third':''}">${esc(String(u.username||'U').charAt(0).toUpperCase())}</span><div><div class="leader-name">${esc(u.username||'Player')}</div><div class="leader-sub">${num(u.wins)} correct picks</div></div><span class="leader-score">#${i+1}</span></div>`).join(''):'<p class="subtle">No players yet.</p>'}</div><button class="btn-outline btn-small" type="button" data-view="leaderboard">Full leaderboard ↗</button></div><div class="tips-box"><h4>✳ Play smart, not risky</h4><p>Read the exact settlement criteria before you vote. Community pick percentages reflect participation, not guaranteed outcomes.</p></div>${state.mode==='demo'||state.admin?`<button class="text-button" style="margin-top:19px" data-view="admin" type="button">⚙ ${state.mode==='demo'?'Demo tools':'Admin dashboard'} →</button>`:''}`;
  }
  function renderTop() {
    $('#headerBalance').textContent=state.profile?num(state.profile.coin_balance):'—';
    $('#modePill').textContent=state.mode==='live'?'● LIVE BETA':'● DEMO';
    $('#modePill').classList.toggle('live',state.mode==='live');
    $('#authButton').textContent=state.mode==='demo'?'Demo player':state.user?(state.profile?.username||'Account'):'Sign in';
    document.querySelectorAll('[data-view]').forEach(el=>el.classList.toggle('active',el.dataset.view===state.view));
    $('#adminNav').hidden=!state.admin&&state.mode!=='demo';
    $('#topAdminNav').hidden=!state.admin&&state.mode!=='demo';
    $('#homeSignup').hidden=Boolean(state.user);
    renderCricketLiveCount();window.setTimeout(()=>loadCricket(false,true),0);
    $('#homeClock').textContent=new Date().toLocaleString(window.OPINZO_I18N?.dateLocale||'en-IN',{timeZone:'Asia/Kolkata',day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
  }
  function render() {renderMain();renderRail();renderTop();}
  function toast(message,type='') {const stack=$('#toastStack');const e=document.createElement('div');e.className='toast '+type;e.textContent=message;stack.append(e);window.setTimeout(()=>e.remove(),4300);}
  function modal(html,size='') {$('#modalRoot').innerHTML=`<div class="modal-backdrop" data-backdrop="1"><div class="modal ${size}" role="dialog" aria-modal="true" aria-label="Opinzo dialog"><button class="modal-close" type="button" data-action="closeModal" aria-label="Close dialog">×</button>${html}</div></div>`;window.setTimeout(()=>$('#modalRoot .modal input, #modalRoot .modal button:not(.modal-close)')?.focus(),0);}
  function closeModal() {const wasEventPick=state.view==='cricket'&&state.cricketMatchId;state.modal=null;$('#modalRoot').innerHTML='';if(wasEventPick)renderMain();}
  function openHow() {state.modal={type:'how'};modal(`<div class="eyebrow">THE BASICS</div><h2>How Opinzo works</h2><p class="modal-intro">Predict with free, non-redeemable virtual points. No real money involved.</p><div class="how-step"><span class="step-num">1</span><div><strong>Choose a question</strong><p>Read its precise deadline and official resolution criteria.</p></div></div><div class="how-step"><span class="step-num">2</span><div><strong>Pick Yes or No</strong><p>Stake 10, 25, 50 or 100 virtual points. Your stake is deducted immediately.</p></div></div><div class="how-step"><span class="step-num">3</span><div><strong>Earn by being right</strong><p>If correct, receive 2× your stake (net gain 1×). If wrong, your original stake is lost. No market will auto-settle without verification.</p></div></div><div class="how-step"><span class="step-num">4</span><div><strong>Build your track record</strong><p>See your history and compete on the leaderboard.</p></div></div><button class="btn-primary modal-submit" data-action="closeModal" type="button">Got it</button>`);}
  function openAuth() {
    if(state.mode==='demo') {state.modal={type:'demo'};modal(`<div class="eyebrow">BROWSER DEMO</div><h2>You're using the demo</h2><p class="modal-intro">This preview lets you test OPINZO without creating an account. Your 500 starting points, picks and outcomes stay only in this browser.</p><div class="info-banner"><span class="info-symbol">ⓘ</span><div>To enable email signup and online coins, connect the free Supabase project using the included <strong>README.md</strong>, <strong>schema.sql</strong> and <strong>config.js</strong> files.</div></div><button class="btn-primary modal-submit" type="button" data-action="closeModal">Continue demo</button>`);return;}
    if(state.user) {state.modal={type:'account'};modal(`<div class="eyebrow">YOUR ACCOUNT</div><h2>${esc(state.profile?.username||'Opinzo member')}</h2><p class="modal-intro">${esc(state.user.email||'Signed in')}<br>Virtual balance: ${num(state.profile?.coin_balance||0)} points</p><button class="btn-outline modal-submit" type="button" data-action="forgotPassword">Reset password by email</button><button class="btn-outline modal-submit" type="button" data-action="logout">Sign out</button>`,'sm');return;}
    if(state.recovery){openPasswordUpdate();return;}
    state.authTab='signin';renderAuth();
  }
  function renderAuth() {
    state.modal={type:'auth'};
    const signup=state.authTab==='signup';
    modal(`<div class="eyebrow">JOIN OPINZO</div><h2>${signup?'Create your free account':'Welcome back'}</h2><p class="modal-intro">${signup?'Start with 500 free virtual points.':'Sign in to see your predictions and wallet.'}</p><form id="authForm" class="admin-form">${signup?'<div class="field"><label for="authName">Public display name</label><input id="authName" name="username" minlength="3" maxlength="20" required placeholder="Your nickname"></div>':''}<div class="field"><label for="authEmail">Email address</label><input id="authEmail" name="email" type="email" autocomplete="email" required placeholder="you@example.com"></div><div class="field"><label for="authPassword">Password</label><input id="authPassword" name="password" type="password" minlength="6" autocomplete="${signup?'new-password':'current-password'}" required placeholder="At least 6 characters"></div><div class="form-error" id="authError" role="alert"></div><button class="btn-primary modal-submit" type="submit" ${state.busy?'disabled':''}>${signup?'Create free account':'Sign in'}</button></form>${!signup?'<div class="auth-switch"><button type="button" data-action="forgotPassword">Forgot password?</button></div>':''}<div class="auth-switch">${signup?'Already have an account?':'New to Opinzo?'} <button type="button" data-action="authSwitch">${signup?'Sign in':'Create account'}</button></div>`,'sm');
  }
  function openPasswordReset() {
    if(!sb)return;
    state.modal={type:'resetRequest'};
    modal(`<div class="eyebrow">ACCOUNT RECOVERY</div><h2>Forgot password?</h2><p class="modal-intro">Enter your email to receive a secure password reset link.</p><form id="resetRequestForm" class="admin-form"><div class="field"><label for="resetEmail">Email address</label><input id="resetEmail" name="email" type="email" autocomplete="email" required value="${esc(state.user?.email||'')}" placeholder="you@example.com"></div><div id="recoveryError" class="form-error" role="alert"></div><button class="btn-primary modal-submit" type="submit">Send reset link</button></form><div class="auth-switch"><button data-action="backToSignin" type="button">Back to sign in</button></div>`,'sm');
  }
  async function requestPasswordReset(form) {
    if(!sb||state.busy)return;
    const button=form.querySelector('button[type="submit"]');
    state.busy=true;button.disabled=true;$('#recoveryError').textContent='';
    try {
      const {error}=await sb.auth.resetPasswordForEmail(form.email.value.trim(),{redirectTo:window.location.origin+window.location.pathname});
      if(error)throw error;
      state.modal={type:'resetSent'};
      modal(`<div class="eyebrow">CHECK YOUR EMAIL</div><h2>Reset link requested</h2><p class="modal-intro">If this address has an account, a reset email will arrive shortly. Check spam too. Open the newest link and choose a new password. Never share the link.</p><button class="btn-primary modal-submit" type="button" data-action="closeModal">Done</button>`,'sm');
    }catch(e){const n=$('#recoveryError');if(n)n.textContent=humanError(e);}
    finally{state.busy=false;button.disabled=false;}
  }
  function openPasswordUpdate() {
    if(!sb)return;
    state.modal={type:'passwordUpdate'};
    modal(`<div class="eyebrow">SECURE YOUR ACCOUNT</div><h2>Choose a new password</h2><p class="modal-intro">Use at least 8 characters. This changes your Opinzo sign-in password.</p><form id="passwordUpdateForm" class="admin-form"><div class="field"><label for="newPassword">New password</label><input id="newPassword" name="password" type="password" minlength="8" autocomplete="new-password" required></div><div class="field"><label for="confirmPassword">Confirm new password</label><input id="confirmPassword" name="confirmation" type="password" minlength="8" autocomplete="new-password" required></div><div id="recoveryError" class="form-error" role="alert"></div><button class="btn-primary modal-submit" type="submit">Update password</button></form>`,'sm');
  }
  async function updatePassword(form) {
    if(!sb||state.busy||!state.recovery)return;
    const errorEl=$('#recoveryError');errorEl.textContent='';
    const password=form.password.value;
    if(password.length<8){errorEl.textContent='Use at least 8 characters.';return;}
    if(password!==form.confirmation.value){errorEl.textContent='Passwords do not match.';return;}
    const button=form.querySelector('button[type="submit"]');state.busy=true;button.disabled=true;
    try {
      const {data:{session},error:sessionError}=await sb.auth.getSession();
      if(sessionError)throw sessionError;
      if(!session)throw Error('Reset link expired. Request a new reset email.');
      const {error}=await sb.auth.updateUser({password});if(error)throw error;
      state.recovery=false;form.reset();closeModal();toast('Password updated successfully.','success');await refreshLive();
    }catch(e){if($('#recoveryError'))$('#recoveryError').textContent=humanError(e);}
    finally{state.busy=false;button.disabled=false;}
  }
  function openVote(marketId,choice) {
    const m=getMarket(marketId);if(!m) return;
    if(marketStatus(m)!=='open'){toast('This prediction is closed.','error');return;}
    if(ownPick(marketId)){toast('You already made a prediction here.','error');return;}
    if(state.mode==='live'&&!state.user){openAuth();toast('Sign in before placing a prediction.');return;}
    if(!state.profile){toast('Your account profile is not ready. Please refresh.','error');return;}
    state.modal={type:'vote',marketId};state.voteChoice=choice||'yes';state.stake=25;renderVote();if(state.view==='cricket'&&state.cricketMatchId&&window.matchMedia('(max-width:1000px)').matches)document.querySelector('.inline-entry')?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'start'});
  }
  function renderVote() {
    if(state.view==='cricket'&&state.cricketMatchId&&state.modal?.type==='vote'){renderMain();return;}
    const m=getMarket(state.modal.marketId);if(!m){closeModal();return;}
    const bal=Number(state.profile?.coin_balance||0);const amount=state.stake;
    modal(`<div class="eyebrow">MAKE A PREDICTION</div><h2>Pick your side</h2><div class="market-category"><span class="category-icon">${ICONS[m.category]||'◎'}</span>${esc(m.category)} · Ends ${niceTime(m.ends_at)}</div><h3 class="modal-question">${esc(m.question)}</h3><p class="subtle">${esc(m.description||'')}</p><div class="modal-options"><button class="option-card ${state.voteChoice==='yes'?'selected':''}" type="button" data-action="pick" data-choice="yes">↗ ${esc(cricketChoice(m,'yes'))}</button><button class="option-card no ${state.voteChoice==='no'?'selected':''}" type="button" data-action="pick" data-choice="no">↘ ${esc(cricketChoice(m,'no'))}</button></div><div class="field"><label>Choose your virtual point stake</label></div><div class="stake-picker">${[10,25,50,100].map(n=>`<button type="button" data-action="stake" data-stake="${n}" class="${state.stake===n?'active':''}">${n}</button>`).join('')}</div><div class="vote-details"><span>Your balance</span><strong>◈ ${num(bal)} points</strong></div><div class="vote-details"><span>Stake deducted now</span><strong class="negative">−${num(amount)}</strong></div><div class="vote-details"><span>Payout if correct (includes stake)</span><strong class="positive">+${num(amount*2)}</strong></div><div class="settlement-note">Outcome is resolved by the admin after the deadline. Each market allows one prediction per account. ${state.mode==='demo'?'This is a browser-local simulation.':''}</div><button class="btn-primary modal-submit" type="button" data-action="submitVote" ${state.busy||amount>bal?'disabled':''}>Confirm ${esc(cricketChoice(m,state.voteChoice))} · Stake ${amount} points</button>${amount>bal?'<p class="form-error">Insufficient points.</p>':''}`);
  }
  function openDetail(marketId) {
    const m=getMarket(marketId);if(!m)return;const p=ownPick(marketId);const status=marketStatus(m);
    state.modal={type:'detail',marketId};modal(`<div class="eyebrow">MARKET DETAILS</div><h2>${esc(m.cricket_kind?cricketMarketLabel(m):m.question)}</h2><div class="market-category"><span class="category-icon">${ICONS[m.category]||'◎'}</span>${esc(m.category)}</div><div class="settlement-note">${esc(m.description||'No additional criteria provided.')}</div><div class="vote-details"><span>Closes</span><strong>${niceTime(m.ends_at)}</strong></div><div class="vote-details"><span>Status</span><strong>${status.toUpperCase()}</strong></div>${(status==='resolved'||status==='void')?`<div class="vote-details"><span>Official outcome</span><strong>${status==='void'?'VOID / REFUND':esc(String(m.outcome).toUpperCase())}</strong></div>${safeLink(m.resolution_source)?`<p class="subtle">Source: <a class="muted-link" href="${safeLink(m.resolution_source)}" target="_blank" rel="noopener noreferrer">View resolution evidence ↗</a></p>`:''}`:''}${p?`<div class="vote-details"><span>Your prediction</span><strong>${esc(p.choice).toUpperCase()} · ${num(p.stake)} points</strong></div><div class="vote-details"><span>Result</span>${resultBadge(p)}</div>`:''}<button class="btn-primary modal-submit" type="button" data-action="closeModal">Close</button>`);
  }
  function openSettle(marketId) {
    const m=getMarket(marketId);if(!m)return;
    state.modal={type:'settle',marketId};modal(`<div class="eyebrow">${state.mode==='demo'?'SIMULATE RESULT':'ADMIN RESOLUTION'}</div><h2>Resolve prediction</h2><p class="modal-intro">${esc(m.question)}</p><form id="settleForm" class="admin-form"><div class="field"><label for="settleOutcome">Verified outcome</label><select id="settleOutcome" name="outcome"><option value="yes">YES</option><option value="no">NO</option><option value="void">VOID (refund points)</option></select></div>${state.mode==='live'?'<div class="field"><label for="settleSource">Public source URL (https://)</label><input type="url" id="settleSource" name="source" required placeholder="https://official-source.example/result"></div>':'<div class="info-banner"><span class="info-symbol">ⓘ</span><div>This simulates a result locally. It does not verify an actual event.</div></div>'}<div class="form-error" id="settleError"></div><button class="btn-primary modal-submit" type="submit">${state.mode==='demo'?'Simulate outcome':'Confirm verified outcome'}</button></form>`);
  }
  function navigate(view) {const route=cricketRoute(view);if(!route)return;closeModal();state.cricketMatchId=route.matchId;state.view=route.view;state.category='All';state.query='';$('#searchInput').value='';$('#sidebar').classList.remove('mobile-open');window.location.hash=route.matchId?'cricket/'+route.matchId:route.view;render();window.scrollTo({top:0,behavior:'auto'});}
  function ledgerEntry(amount,reason,marketId=null) {return {id:id(),amount,reason,market_id:marketId,balance_after:state.demo.profile.coin_balance,created_at:new Date().toISOString()};}
  async function submitVote() {
    if(state.busy||state.modal?.type!=='vote')return;
    const m=getMarket(state.modal.marketId),pick=state.voteChoice,stake=state.stake;
    if(!m||!['yes','no'].includes(pick)||![10,25,50,100].includes(stake)||ownPick(m.id)||marketStatus(m)!=='open') {toast('Prediction is no longer available.','error');return;}
    if(!state.profile||Number(state.profile.coin_balance)<stake){toast('Insufficient points.','error');return;}
    state.busy=true;if(state.view==='cricket'&&state.cricketMatchId)renderMain();
    try {
      if(state.mode==='demo') {
        state.demo.profile.coin_balance-=stake;
        state.demo.predictions.unshift({id:id(),market_id:m.id,choice:pick,stake,payout:0,status:'pending',created_at:new Date().toISOString()});
        const match=state.demo.markets.find(x=>x.id===m.id);match[pick+'_votes']+=1;
        state.demo.ledger.push(ledgerEntry(-stake,'Prediction stake · '+m.question,m.id));
        saveDemo();setDemoState();
      } else {
        const {error}=await sb.rpc('place_prediction',{p_market_id:m.id,p_choice:pick,p_stake:stake});
        if(error)throw error;await loadLive();
      }
      closeModal();toast(`${pick.toUpperCase()} prediction placed · ${stake} points staked`,'success');render();
    } catch(e){toast(humanError(e),'error');}finally{state.busy=false;if(state.view==='cricket'&&state.cricketMatchId)renderMain();}
  }
  async function settle(form) {
    if(state.busy||state.modal?.type!=='settle')return;
    const m=getMarket(state.modal.marketId);if(!m)return;const o=form.outcome.value;
    if(!['yes','no','void'].includes(o))return;
    state.busy=true;
    try {
      if(state.mode==='demo') {
        const target=state.demo.markets.find(x=>x.id===m.id);if(target.status!=='open')throw Error('Already resolved');
        target.status=o==='void'?'void':'resolved';target.outcome=o==='void'?null:o;target.resolution_source=null;
        for(const p of state.demo.predictions.filter(p=>p.market_id===m.id&&p.status==='pending')){
          if(o==='void'){p.status='refunded';p.payout=p.stake;state.demo.profile.coin_balance+=p.stake;state.demo.ledger.push(ledgerEntry(p.stake,'Voided market refund · '+m.question,m.id));}
          else if(p.choice===o){p.status='won';p.payout=p.stake*2;state.demo.profile.coin_balance+=p.payout;state.demo.ledger.push(ledgerEntry(p.payout,'Correct prediction · '+m.question,m.id));}
          else{p.status='lost';p.payout=0;}
        }
        saveDemo();setDemoState();
      } else {
        const source=form.source.value.trim();
        if(!/^https:\/\//i.test(source))throw Error('A valid https:// source is required');
        const {error}=await sb.rpc('admin_settle_market',{p_market_id:m.id,p_outcome:o,p_resolution_source:source});
        if(error)throw error;await loadLive();
      }
      closeModal();render();toast('Prediction outcome settled.','success');
    }catch(e){const n=$('#settleError');if(n)n.textContent=humanError(e);else toast(humanError(e),'error');}finally{state.busy=false;}
  }
  async function authSubmit(form) {
    if(!sb||state.busy)return;
    const email=form.email.value.trim(),password=form.password.value;state.busy=true;
    const errorEl=$('#authError');if(errorEl)errorEl.textContent='';
    try {
      if(state.authTab==='signup'){
        const username=form.username.value.trim();if(!/^[\p{L}\p{N}_ .-]{3,20}$/u.test(username))throw Error('Use a 3–20 character nickname: letters, numbers, spaces, underscores or dashes.');
        const {data,error}=await sb.auth.signUp({email,password,options:{data:{username},emailRedirectTo:window.location.origin+window.location.pathname}});if(error)throw error;
        closeModal();toast(data.session?'Account created. Welcome to Opinzo!':'Check your email to confirm your account.','success');
      }else{const {error}=await sb.auth.signInWithPassword({email,password});if(error)throw error;closeModal();toast('Signed in successfully.','success');}
      await refreshLive();
    }catch(e){if($('#authError'))$('#authError').textContent=humanError(e);else toast(humanError(e),'error');}
    finally{state.busy=false;}
  }
  function humanError(err) {const m=String(err?.message||err||'Something went wrong');return m.length>230?m.slice(0,230)+'…':m;}
  async function refreshLive() {if(!sb)return;const {data}=await sb.auth.getUser();state.user=data.user||null;await loadLive();}
  async function googleAuth() {if(!sb)return;const {error}=await sb.auth.signInWithOAuth({provider:'google',options:{redirectTo:window.location.origin+window.location.pathname}});if(error)toast(humanError(error),'error');}
  function runAction(button) {
    const action=button.dataset.action,mId=button.dataset.id;
    if(action==='toggleCompetitions'){state.cricket.competitionsOpen=!state.cricket.competitionsOpen;if(state.view!=='matches')navigate('matches');else renderCompetitionNav();}
    else if(action==='competitionAll'){state.cricket.competition='all';state.cricket.listFilter='all';state.query='';$('#searchInput').value='';if(state.view!=='matches')navigate('matches');else renderMain();}
    else if(action==='competitionSelect'||action==='competitionExpand'){if(!cricketCompetitionGroups().some(g=>g.id===mId))return;const expanded=state.cricket.expandedCompetitions||[];if(action==='competitionExpand'){state.cricket.expandedCompetitions=expanded.includes(mId)?expanded.filter(id=>id!==mId):[...expanded,mId];renderCompetitionNav();return;}if(!expanded.includes(mId))state.cricket.expandedCompetitions=[...expanded,mId];state.cricket.competition=mId;state.cricket.listFilter='all';state.query='';$('#searchInput').value='';if(state.view!=='matches')navigate('matches');else renderMain();}
    else if(action==='listFilter'){if(!['all','live','upcoming','finished'].includes(button.dataset.filter))return;state.cricket.listFilter=button.dataset.filter;renderMain();}
    else if(action==='showHow')openHow();
    else if(action==='homeSignup'){if(state.user||state.mode==='demo'||state.recovery)openAuth();else{state.authTab='signup';renderAuth();}}
    else if(action==='homeFilter'){if(state.view==='matches'&&button.dataset.live==='true'){state.cricket.listFilter='live';renderMain();return;}if(state.view!=='cricket'||state.cricketMatchId)navigate('cricket');state.cricket.kind=['winner','sessions','players','wickets'].includes(button.dataset.kind)?button.dataset.kind:'all';state.cricket.onlyLive=button.dataset.live==='true';state.cricket.onlyOpen=false;renderMain();window.setTimeout(()=>$('#cricketMatchList')?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'start'}),0);}
    else if(action==='stepStake'){const amounts=[10,25,50,100],index=amounts.indexOf(state.stake);state.stake=amounts[Math.max(0,Math.min(3,index+Number(button.dataset.step)))];renderVote();}
    else if(action==='scrollCricket'){if(state.view!=='cricket'||state.cricketMatchId)navigate('cricket');$('#cricketMatchList')?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'start'});}
    else if(action==='scrollMarkets')$('#marketsSection')?.scrollIntoView({behavior:'smooth'});
    else if(action==='vote'){state.cricketRunner=button.dataset.runner||'yes';openVote(mId,button.dataset.choice);}
    else if(action==='detail')openDetail(mId);
    else if(action==='closeModal')closeModal();
    else if(action==='matchPredictions')openMatchPredictions(mId);
    else if(action==='eventTab'){if(!['all','overs','single','players','wickets'].includes(button.dataset.tab))return;state.cricketTab=button.dataset.tab;renderMain();}
    else if(action==='clearEventPick')closeModal();
    else if(action==='closeCricketNow'){if(!state.admin||state.busy)return;state.busy=true;sb.rpc('admin_close_cricket_market',{p_market_id:mId}).then(async({error})=>{if(error)throw error;await loadLive();toast('Cricket predictions closed.','success');}).catch(e=>toast(humanError(e),'error')).finally(()=>{state.busy=false;});}
    else if(action==='createCricket')openCricketCreate(mId);
    else if(action==='refreshCricket')loadCricket(true);
    else if(action==='cricketAll'){state.cricket.onlyOpen=false;state.cricket.onlyLive=false;state.cricket.kind='all';state.query='';$('#searchInput').value='';renderMain();}
    else if(action==='cricketOpen'){state.cricket.onlyOpen=true;state.cricket.onlyLive=false;renderMain();}
    else if(action==='cricketLive'){state.cricket.onlyLive=true;state.cricket.onlyOpen=false;renderMain();}
    else if(action==='auth')openAuth();
    else if(action==='authSwitch'){state.authTab=state.authTab==='signin'?'signup':'signin';renderAuth();}
    else if(action==='forgotPassword')openPasswordReset();
    else if(action==='backToSignin'){state.authTab='signin';renderAuth();}
    else if(action==='google')googleAuth();
    else if(action==='logout'&&sb){sb.auth.signOut().then(()=>{closeModal();state.user=null;loadLive();toast('Signed out.');});}
    else if(action==='pick'){state.voteChoice=button.dataset.choice;renderVote();}
    else if(action==='stake'){state.stake=Number(button.dataset.stake);renderVote();}
    else if(action==='submitVote')submitVote();
    else if(action==='settle')openSettle(mId);
    else if(action==='resetFilters'){state.category='All';state.query='';$('#searchInput').value='';render();}
    else if(action==='resetDemo') {if(window.confirm('Delete your browser demo predictions, points, and custom markets?')){state.demo=seedDemo();saveDemo();setDemoState();render();toast('Demo reset.');}}
  }
  document.addEventListener('click',e=>{
    const nav=e.target.closest('button[data-view]');if(nav){navigate(nav.dataset.view);return;}
    const a=e.target.closest('[data-action]');if(a){runAction(a);return;}
    if(e.target.matches('[data-backdrop]'))closeModal();
  });
  document.addEventListener('submit',e=>{
    if(e.target.id==='resetRequestForm'){e.preventDefault();requestPasswordReset(e.target);}
    if(e.target.id==='passwordUpdateForm'){e.preventDefault();updatePassword(e.target);}
    if(e.target.id==='cricketCreateForm'){e.preventDefault();createCricketMarket(e.target);}
    if(e.target.id==='authForm'){e.preventDefault();authSubmit(e.target);}
    if(e.target.id==='settleForm'){e.preventDefault();settle(e.target);}
  });
  $('#sortSelect')?.addEventListener('change',e=>{state.sort=e.target.value;renderMain();});
  document.addEventListener('change',e=>{if(e.target.id==='mobileCompetitionSelect'){const competition=e.target.value;if(competition==='all'||cricketCompetitionGroups().some(g=>g.id===competition)){state.cricket.competition=competition;state.cricket.listFilter='all';renderMain();}}if(e.target.id==='cricketKind'&&e.target.value==='single_over')$('#cricketPeriod').value='Single over: 11 · 1st innings';if(e.target.id==='cricketKindFilter'){state.cricket.kind=e.target.value;renderMain();}if(e.target.id==='sortSelect'){state.sort=e.target.value;renderMain();}});
  $('#searchInput').addEventListener('input',e=>{state.query=e.target.value;if(!['cricket','matches'].includes(state.view)){state.view='matches';state.cricketMatchId=null;window.location.hash='matches';}renderMain();renderTop();});
  $('#walletTop').addEventListener('click',()=>navigate('wallet'));
  $('#authButton').addEventListener('click',openAuth);
  $('#sideHow').addEventListener('click',openHow);
  $('#menuButton').addEventListener('click',()=>$('#sidebar').classList.toggle('mobile-open'));
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();if(e.key==='/'&&!['INPUT','TEXTAREA'].includes(document.activeElement.tagName)&&!$('#modalRoot .modal')){e.preventDefault();$('#searchInput').focus();}});
  window.addEventListener('hashchange',()=>{
    const route=cricketRoute(window.location.hash.slice(1)||'cricket');
    if(route&&(route.view!==state.view||route.matchId!==state.cricketMatchId)){
      closeModal();state.view=route.view;state.cricketMatchId=route.matchId;state.cricketTab='all';state.category='All';state.query='';$('#searchInput').value='';render();
    }
  });
  window.setInterval(()=>loadCricket(false,true),120000);
  window.setInterval(renderCricketLiveCount,30000);
  window.setInterval(()=>{if(state.view!=='cricket'||!state.cricketMatchId||state.busy||document.visibilityState==='hidden')return;if([...document.querySelectorAll('.event-choice[data-id]:not(:disabled)')].some(el=>{const m=getMarket(el.dataset.id);return !m||marketStatus(m)!=='open';}))renderMain();},5000);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')loadCricket(false,true);});
  window.addEventListener('opinzo:language-changed',()=>{if(state.view!=='admin')render();});
  document.getElementById('footerYear').textContent=String(new Date().getFullYear());
  async function init() {
    if(isConfigured&&!isLive){state.error='Supabase SDK failed to load. Check your connection or the script CDN.';}
    const route=cricketRoute(window.location.hash.slice(1));if(route){state.view=route.view;state.cricketMatchId=route.matchId;}
    if(state.mode==='demo'){state.demo=loadDemo();setDemoState();render();return;}
    try {
      sb.auth.onAuthStateChange((event,session)=>{
        if(event==='PASSWORD_RECOVERY'){
          state.recovery=true;state.user=session?.user||null;
          window.setTimeout(()=>{loadLive().catch(e=>toast(humanError(e),'error'));openPasswordUpdate();},0);
          return;
        }
        const next=session?.user?.id||null;
        if(next!==(state.user?.id||null)){
          state.user=session?.user||null;
          if(session&&state.modal?.type==='auth')closeModal();
          window.setTimeout(()=>loadLive().catch(e=>toast(humanError(e),'error')),0);
        }
      });
      const {data:{session},error}=await sb.auth.getSession();if(error)throw error;state.user=session?.user||null;
      await loadLive();
      if(authLinkError){state.recovery=false;openPasswordReset();$('#recoveryError').textContent=authLinkError;}
      else if(state.recovery){
        if(session)openPasswordUpdate();
        else{state.recovery=false;openPasswordReset();$('#recoveryError').textContent='Reset link expired. Request a new reset email.';}
      }
    }catch(e){state.error=humanError(e);render();}
  }
  init();
})();







