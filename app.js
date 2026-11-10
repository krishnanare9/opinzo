/* Opinzo — vanilla JS, GitHub Pages compatible.
   Demo: browser-local virtual points. Live: Supabase SQL RPC with server-side validation.
   Never treat demo points as a financial asset or use for real-money betting. */
(() => {
  'use strict';
  const CONFIG = window.OPINZO_CONFIG || {};
  const recoveryArrival = new URLSearchParams(window.location.hash.slice(1)).get('type') === 'recovery';
  const isConfigured = Boolean(CONFIG.supabaseUrl && CONFIG.supabaseAnonKey);
  const isLive = isConfigured && Boolean(window.supabase?.createClient);
  const sb = isLive ? window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey) : null;
  const DEMO_KEY = 'opinzo-demo-v2';
  const CATEGORIES = ['All', 'Crypto', 'Sports', 'Technology', 'Markets', 'World'];
  const ICONS = {Crypto:'₿', Sports:'⚽', Technology:'✦', Markets:'▥', World:'◎'};
  const state = {
    mode: isLive ? 'live' : 'demo', view:'explore', category:'All', query:'', sort:'popular',
    markets:[], predictions:[], ledger:[], leaderboard:[], profile:null, user:null,
    admin:false, modal:null, voteChoice:'yes', stake:25, authTab:'signin', busy:false,
    demo:null, error:'', recovery:recoveryArrival
  };
  const $ = (s) => document.querySelector(s);
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num = (n) => Number(n || 0).toLocaleString('en-IN');
  const niceDate = (v) => v ? new Date(v).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : '—';
  const niceTime = (v) => v ? new Date(v).toLocaleString('en-IN',{day:'numeric',month:'short',hour:'numeric',minute:'2-digit'}) : '—';
  const daysTo = (v) => { const d = Math.ceil((new Date(v) - Date.now()) / 86400000); return new Date(v).getTime() <= Date.now() ? 'Closed' : d > 1 ? `${d} days left` : d === 1 ? '1 day left' : d === 0 ? 'Closes today' : 'Closed'; };
  const id = () => (window.crypto?.randomUUID?.() || `d${Date.now()}${Math.random().toString(36).slice(2)}`);
  const safeLink = (u) => /^https:\/\/[^\s]+$/i.test(String(u||'')) ? esc(u) : '';
  const demoMarketSeeds = [
    {id:'demo-btc',question:'Will Bitcoin close above $100,000 at the end of this month?',category:'Crypto',description:'Illustrative market. Resolve using the BTC/USD UTC daily close from a clearly declared exchange.',yes_votes:213,no_votes:149,dayOffset:19},
    {id:'demo-eth',question:'Will Ethereum close above $4,000 at the end of this month?',category:'Crypto',description:'Illustrative market. Use the ETH/USD UTC close on the final calendar day.',yes_votes:176,no_votes:189,dayOffset:23},
    {id:'demo-sports',question:'Will India win its next completed men\'s ODI match?',category:'Sports',description:'Illustrative market. No-result or abandoned fixtures must be refunded manually in a real market.',yes_votes:348,no_votes:138,dayOffset:12},
    {id:'demo-ai',question:'Will Apple announce a new Mac model before the end of this month?',category:'Technology',description:'Illustrative market. Announcement must appear on Apple Newsroom before 23:59 UTC on the final day.',yes_votes:165,no_votes:122,dayOffset:17},
    {id:'demo-nifty',question:'Will the NIFTY 50 finish above 28,000 at month end?',category:'Markets',description:'Illustrative market. Final official closing level at the last trading session of the month.',yes_votes:291,no_votes:174,dayOffset:25},
    {id:'demo-fed',question:'Will the US Federal Reserve cut rates at its next FOMC decision?',category:'World',description:'Illustrative market. Use the Federal Reserve\'s official rate announcement.',yes_votes:136,no_votes:203,dayOffset:21},
    {id:'demo-sol',question:'Will Solana close above $200 at the end of this month?',category:'Crypto',description:'Illustrative market. Use a declared exchange\'s SOL/USD UTC day-close.',yes_votes:215,no_votes:182,dayOffset:29},
    {id:'demo-gold',question:'Will gold close above $4,500 per troy ounce at month end?',category:'Markets',description:'Illustrative market. Settlement benchmark must be declared before accepting predictions.',yes_votes:102,no_votes:92,dayOffset:27}
  ];
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
    state.markets=d.markets;
    state.profile=d.profile;
    state.predictions=d.predictions;
    state.ledger=d.ledger.slice().reverse();
    const sample=[['Mira_99',32,42,1120],['AstroK',26,37,985],['InfoNinja',21,31,865],['NovaQueen',17,28,790],['DataWiz',11,21,720]];
    const mine=getStats();
    state.leaderboard=[...sample.map(([username,wins,predictions,coins])=>({username,wins,predictions,coins})),{username:'Demo player (you)',wins:mine.wins,predictions:mine.total,coins:d.profile.coin_balance}].sort((a,b)=>b.wins-a.wins || b.coins-a.coins);
  }
  async function loadLive() {
    if(!sb) return;
    const {data:markets,error:marketError}=await sb.from('markets').select('id,question,description,category,ends_at,created_at,status,outcome,resolution_source,yes_votes,no_votes').order('created_at',{ascending:false}).limit(120);
    if(marketError) {state.error=marketError.message;state.markets=[];} else {state.error='';state.markets=markets||[];}
    const {data:leaders,error:leaderError}=await sb.rpc('get_leaderboard');
    state.leaderboard=leaderError?[]:(leaders||[]);
    if(state.user) {
      const [p,x,l,a]=await Promise.all([
        sb.from('profiles').select('username,coin_balance').eq('id',state.user.id).single(),
        sb.from('predictions').select('id,market_id,choice,stake,payout,status,created_at').order('created_at',{ascending:false}).limit(300),
        sb.from('coin_ledger').select('id,amount,reason,market_id,balance_after,created_at').order('created_at',{ascending:false}).limit(100),
        sb.rpc('is_admin')
      ]);
      state.profile=p.data||null; state.predictions=x.data||[];state.ledger=l.data||[];state.admin=Boolean(a.data);
      if(p.error) state.error=`Account profile unavailable: ${p.error.message}`;
    } else {state.profile=null;state.predictions=[];state.ledger=[];state.admin=false;}
    render();
  }
  function marketStatus(m) {if(m.status==='resolved')return 'resolved';if(m.status==='void')return 'void';return new Date(m.ends_at).getTime()<=Date.now()?'closed':'open';}
  function ownPick(marketId) {return state.predictions.find(p=>p.market_id===marketId);}
  function marketPerc(m) {const yes=Number(m.yes_votes||0),no=Number(m.no_votes||0); return yes+no ? Math.round(100*yes/(yes+no)):50;}
  function getMarket(marketId) {return state.markets.find(m=>String(m.id)===String(marketId));}
  function statCard(label,value,note,symbol) {return `<article class="stat-card"><div class="stat-card-top"><span>${esc(label)}</span><span class="stat-card-icon">${symbol}</span></div><strong>${value}</strong><small>${note}</small></article>`;}
  function hero() {return `<section class="hero"><div class="hero-content"><span class="hero-kicker">✦&nbsp; THE FUTURE IS AN OPINION</span><h2>Think it. <span>Predict it.</span><br>Prove it.</h2><p>Turn your knowledge into a track record. Pick a side, earn virtual points, and rise on the leaderboard.</p><button class="btn-primary" data-action="scrollMarkets" type="button">Explore markets &nbsp;↗</button></div><div class="hero-floating"><span>Your decisions matter</span><strong>↑ Think ahead</strong></div><div class="hero-graphic"><svg viewBox="0 0 460 210" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#90e7db" stop-opacity=".35"/><stop offset="1" stop-color="#90e7db" stop-opacity="0"/></linearGradient></defs><path d="M0 182 L35 160 L64 170 L101 124 L139 136 L166 106 L204 114 L248 67 L289 88 L338 37 L369 54 L414 15 L460 -4 L460 210 L0 210 Z" fill="url(#chartFill)"/><path d="M0 182 L35 160 L64 170 L101 124 L139 136 L166 106 L204 114 L248 67 L289 88 L338 37 L369 54 L414 15 L460 -4" fill="none" stroke="#91eed6" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="414" cy="15" r="7" fill="#e7fff7" stroke="#51ccb4" stroke-width="4"/></svg></div></section>`;}
  function modeNotice() {return state.mode==='demo' ? `<div class="info-banner"><span class="info-symbol">ⓘ</span><div><strong>Preview mode is active.</strong><p>Predictions, points and the sample leaderboard are stored or simulated in this browser only. No real users, live prices, or real rewards. Connect Supabase to launch online accounts.</p></div></div>` : '' ;}
  function marketCard(m) {
    const s=marketStatus(m),pct=marketPerc(m),choice=ownPick(m.id),total=Number(m.yes_votes||0)+Number(m.no_votes||0);
    const cls=String(m.category||'').toLowerCase().replace(/[^a-z]/g,'');
    return `<article class="market-card" data-market-card="${esc(m.id)}"><div class="market-card-top"><div class="market-category"><span class="category-icon ${cls}">${ICONS[m.category]||'◉'}</span>${esc(m.category)}</div><span class="market-status ${s}">${s==='open'?'● OPEN':s==='resolved'?'● RESOLVED':s==='void'?'● VOID':'● CLOSED'}</span></div><h3>${esc(m.question)}</h3><div class="bar-labels"><span class="yes">YES ${pct}%</span><span class="no">NO ${100-pct}%</span></div><div class="prob-bar" role="img" aria-label="Community picks: ${pct} percent yes, ${100-pct} percent no"><div class="yes-fill" style="width:${pct}%"></div></div><div class="market-meta"><span>${num(total)} community picks${state.mode==='demo'?' · sample':''}</span><span>${s==='resolved'?`Result: ${String(m.outcome||'').toUpperCase()}`:s==='void'?'Refunded':daysTo(m.ends_at)}</span></div><div class="market-actions">${s==='open'&&!choice?`<button class="btn-yes" type="button" data-action="vote" data-choice="yes" data-id="${esc(m.id)}">↗ Yes</button><button class="btn-no" type="button" data-action="vote" data-choice="no" data-id="${esc(m.id)}">↘ No</button>`:`<button class="btn-outline btn-small full-action" type="button" data-action="detail" data-id="${esc(m.id)}">${choice?`✓ Your pick: ${esc(choice.choice).toUpperCase()}`:'View result / details'} &nbsp;→</button>`}</div></article>`;
  }
  function filteredMarkets() {
    let markets=[...state.markets];
    if(state.category!=='All')markets=markets.filter(m=>m.category===state.category);
    if(state.query.trim()) {const q=state.query.trim().toLowerCase();markets=markets.filter(m=>(m.question+' '+m.category+' '+(m.description||'')).toLowerCase().includes(q));}
    if(state.view==='trending'||state.sort==='popular')markets.sort((a,b)=>Number(b.yes_votes||0)+Number(b.no_votes||0)-Number(a.yes_votes||0)-Number(a.no_votes||0));
    if(state.view!=='trending'&&state.sort==='ending')markets.sort((a,b)=>new Date(a.ends_at)-new Date(b.ends_at));
    if(state.view!=='trending'&&state.sort==='newest')markets.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
    return markets;
  }
  function marketList() {
    const markets=filteredMarkets();
    const chips=CATEGORIES.map(c=>`<button type="button" class="chip ${state.category===c?'active':''}" data-category="${c}">${c}</button>`).join('');
    return `<section id="marketsSection"><div class="section-heading"><div><h2>${state.view==='trending'?'Trending predictions':'Explore predictions'}</h2><p>Pick a side. Build your accuracy. Community pick % is not a probability forecast.</p></div><span class="count-badge">${markets.length} Markets</span></div><div class="filters"><div class="chip-group">${chips}</div><select id="sortSelect" class="filter-select" aria-label="Sort predictions"><option value="popular" ${state.sort==='popular'?'selected':''}>Most popular</option><option value="newest" ${state.sort==='newest'?'selected':''}>Newest</option><option value="ending" ${state.sort==='ending'?'selected':''}>Closing soon</option></select></div><div class="market-grid">${markets.length ? markets.map(marketCard).join(''):`<div class="empty-state empty-grid"><div class="empty-icon">⌕</div><h3>No predictions found</h3><p>Try another category or search phrase.</p><button class="btn-outline" data-action="resetFilters" type="button">Clear filters</button></div>`}</div></section>`;
  }
  function exploreView() {
    const st=getStats();
    const balance=state.profile?num(state.profile.coin_balance):'—';
    const name=state.profile?.username?.split(' ')[0]||'there';
    return `<div class="greeting"><div><h1>Hey, ${esc(name)} <span aria-hidden="true">👋</span></h1><p>Ready to put your perspective to the test?</p></div><span class="small-clock">${new Date().toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</span></div>${modeNotice()}${hero()}<section class="stat-grid">${statCard('Your balance',balance,'Free virtual points','◈')}${statCard('Active predictions',state.profile?st.active:'—','Waiting for results','▤')}${statCard('Prediction accuracy',state.profile?st.accuracy+'%':'—',`${st.settled} resolved picks`,'⌁')}</section>${marketList()}`;
  }
  function trendingView() {return `<div class="eyebrow">THE COMMUNITY</div><h1 class="page-title">What's trending</h1><p class="page-subtitle">The most-picked prediction questions in our community.</p>${modeNotice()}${marketList()}`;}
  function resultBadge(p) {return p.status==='won'?'<span class="mini-tag yes">✓ WON</span>':p.status==='lost'?'<span class="mini-tag no">✕ LOST</span>':p.status==='refunded'?'<span class="mini-tag">↩ REFUNDED</span>':'<span class="mini-tag">◷ PENDING</span>';}
  function portfolioView() {
    const stats=getStats();
    const entries=state.predictions;
    return `<div class="eyebrow">YOUR TRACK RECORD</div><h1 class="page-title">My predictions</h1><p class="page-subtitle">All your opinions, outcomes and virtual point gains in one place.</p>${!state.profile?signinEmpty():`<section class="stat-grid">${statCard('Total picks',stats.total,'Since joining','▤')}${statCard('Correct picks',stats.wins,'Resolved wins','✓')}${statCard('Accuracy',stats.accuracy+'%',`${stats.settled} resolved picks`,'⌁')}</section><div class="wide-panel"><h3>Prediction history</h3>${entries.length?entries.map(p=>{const m=getMarket(p.market_id);return `<div class="prediction-row"><span class="history-icon">${ICONS[m?.category]||'◉'}</span><div class="history-info"><div class="history-title">${esc(m?.question||'Market #'+String(p.market_id).slice(0,8))}</div><div class="history-sub">Picked ${esc(p.choice).toUpperCase()} · ${num(p.stake)} points staked · ${niceTime(p.created_at)}</div></div><div style="text-align:right">${resultBadge(p)}<div class="history-sub" style="margin-top:5px">${p.status==='won'?`+${num(p.payout||0)} paid`:p.status==='lost'?'No payout':p.status==='refunded'?'Stake returned':'Awaiting result'}</div></div></div>`;}).join(''):`<div class="empty-state"><div class="empty-icon">◎</div><h3>No predictions yet</h3><p>Explore questions and make your first pick.</p><button class="btn-primary" data-view="explore" type="button">Explore markets</button></div>`}</div>`}`;
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
    return `<div class="eyebrow">${state.mode==='demo'?'LOCAL SANDBOX':'ADMIN AREA'}</div><h1 class="page-title">Market management</h1><p class="page-subtitle">${state.mode==='demo'?'Simulated outcomes for browser testing only.':'Only approved admins can create and resolve markets through secure database functions.'}</p>${modeNotice()}<div class="wide-panel"><h3>Create a new ${state.mode==='demo'?'demo ':''}market</h3><form id="createMarketForm" class="admin-form"><div class="field"><label for="adminQuestion">Question (clear, verifiable outcome)</label><input id="adminQuestion" name="question" maxlength="220" minlength="15" required placeholder="Will XYZ happen by a specific date?"></div><div class="field"><label for="adminDescription">Settlement criteria</label><textarea id="adminDescription" name="description" maxlength="1000" required placeholder="Exact source, measurement, deadline, tie / cancellation policy..."></textarea></div><div class="two-col"><div class="field"><label for="adminCategory">Category</label><select name="category" id="adminCategory">${CATEGORIES.slice(1).map(c=>`<option>${c}</option>`).join('')}</select></div><div class="field"><label for="adminEnd">Closes at (your local time)</label><input name="ends_at" id="adminEnd" type="datetime-local" required></div></div><button class="btn-primary" ${state.busy?'disabled':''} type="submit">Create market</button></form></div><div class="wide-panel"><h3>Settle markets</h3><p class="subtle">${state.mode==='demo'?'Demo outcomes are arbitrary simulations.':'Real markets can only be settled after their closing time. Verify an authoritative source first.'}</p>${state.markets.filter(m=>!['resolved','void'].includes(marketStatus(m))).length?state.markets.filter(m=>!['resolved','void'].includes(marketStatus(m))).map(m=>`<div class="admin-market"><div class="history-info"><div class="history-title">${esc(m.question)}</div><div class="history-sub">${marketStatus(m).toUpperCase()} · Closes ${niceTime(m.ends_at)}</div></div><button type="button" class="btn-outline btn-small" data-action="settle" data-id="${esc(m.id)}" ${state.mode==='live'&&marketStatus(m)==='open'?'disabled title="Market not closed"':''}>Resolve</button></div>`).join(''):'<p class="subtle">No unresolved markets.</p>'}</div>${state.mode==='demo'?'<button class="btn-outline btn-small" data-action="resetDemo" type="button">Reset browser demo (erase local picks)</button>':''}`;
  }
  function renderMain() {
    const output=state.view==='portfolio'?portfolioView():state.view==='wallet'?walletView():state.view==='leaderboard'?leaderboardView():state.view==='admin'?adminView():state.view==='trending'?trendingView():exploreView();
    $('#mainContent').innerHTML=(state.error?`<div class="info-banner"><span class="info-symbol">!</span><div><strong>Backend notice</strong><p>${esc(state.error)}</p></div></div>`:'')+output;
    const defaultTime=new Date(Date.now()+86400000);defaultTime.setMinutes(defaultTime.getMinutes()-defaultTime.getTimezoneOffset());
    const endInput=$('#adminEnd');if(endInput&&!endInput.value)endInput.value=defaultTime.toISOString().slice(0,16);
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
    document.querySelectorAll('#categoryNav [data-category]').forEach(el=>el.classList.toggle('active',state.view==='explore'&&state.category===el.dataset.category));
  }
  function render() {renderMain();renderRail();renderTop();}
  function toast(message,type='') {const stack=$('#toastStack');const e=document.createElement('div');e.className='toast '+type;e.textContent=message;stack.append(e);window.setTimeout(()=>e.remove(),4300);}
  function modal(html,size='') {$('#modalRoot').innerHTML=`<div class="modal-backdrop" data-backdrop="1"><div class="modal ${size}" role="dialog" aria-modal="true" aria-label="Opinzo dialog"><button class="modal-close" type="button" data-action="closeModal" aria-label="Close dialog">×</button>${html}</div></div>`;window.setTimeout(()=>$('#modalRoot .modal input, #modalRoot .modal button:not(.modal-close)')?.focus(),0);}
  function closeModal() {state.modal=null;$('#modalRoot').innerHTML='';}
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
    state.modal={type:'vote',marketId};state.voteChoice=choice||'yes';state.stake=25;renderVote();
  }
  function renderVote() {
    const m=getMarket(state.modal.marketId);if(!m){closeModal();return;}
    const bal=Number(state.profile?.coin_balance||0);const amount=state.stake;
    modal(`<div class="eyebrow">MAKE A PREDICTION</div><h2>Pick your side</h2><div class="market-category"><span class="category-icon">${ICONS[m.category]||'◎'}</span>${esc(m.category)} · Ends ${niceTime(m.ends_at)}</div><h3 class="modal-question">${esc(m.question)}</h3><p class="subtle">${esc(m.description||'')}</p><div class="modal-options"><button class="option-card ${state.voteChoice==='yes'?'selected':''}" type="button" data-action="pick" data-choice="yes">↗ YES</button><button class="option-card no ${state.voteChoice==='no'?'selected':''}" type="button" data-action="pick" data-choice="no">↘ NO</button></div><div class="field"><label>Choose your virtual point stake</label></div><div class="stake-picker">${[10,25,50,100].map(n=>`<button type="button" data-action="stake" data-stake="${n}" class="${state.stake===n?'active':''}">${n}</button>`).join('')}</div><div class="vote-details"><span>Your balance</span><strong>◈ ${num(bal)} points</strong></div><div class="vote-details"><span>Stake deducted now</span><strong class="negative">−${num(amount)}</strong></div><div class="vote-details"><span>Payout if correct (includes stake)</span><strong class="positive">+${num(amount*2)}</strong></div><div class="settlement-note">Outcome is resolved by the admin after the deadline. Each market allows one prediction per account. ${state.mode==='demo'?'This is a browser-local simulation.':''}</div><button class="btn-primary modal-submit" type="button" data-action="submitVote" ${state.busy||amount>bal?'disabled':''}>Confirm ${state.voteChoice.toUpperCase()} · Stake ${amount} points</button>${amount>bal?'<p class="form-error">Insufficient points.</p>':''}`);
  }
  function openDetail(marketId) {
    const m=getMarket(marketId);if(!m)return;const p=ownPick(marketId);const status=marketStatus(m);
    state.modal={type:'detail',marketId};modal(`<div class="eyebrow">MARKET DETAILS</div><h2>${esc(m.question)}</h2><div class="market-category"><span class="category-icon">${ICONS[m.category]||'◎'}</span>${esc(m.category)}</div><div class="settlement-note">${esc(m.description||'No additional criteria provided.')}</div><div class="vote-details"><span>Closes</span><strong>${niceTime(m.ends_at)}</strong></div><div class="vote-details"><span>Status</span><strong>${status.toUpperCase()}</strong></div>${(status==='resolved'||status==='void')?`<div class="vote-details"><span>Official outcome</span><strong>${status==='void'?'VOID / REFUND':esc(String(m.outcome).toUpperCase())}</strong></div>${safeLink(m.resolution_source)?`<p class="subtle">Source: <a class="muted-link" href="${safeLink(m.resolution_source)}" target="_blank" rel="noopener noreferrer">View resolution evidence ↗</a></p>`:''}`:''}${p?`<div class="vote-details"><span>Your prediction</span><strong>${esc(p.choice).toUpperCase()} · ${num(p.stake)} points</strong></div><div class="vote-details"><span>Result</span>${resultBadge(p)}</div>`:''}<button class="btn-primary modal-submit" type="button" data-action="closeModal">Close</button>`);
  }
  function openSettle(marketId) {
    const m=getMarket(marketId);if(!m)return;
    state.modal={type:'settle',marketId};modal(`<div class="eyebrow">${state.mode==='demo'?'SIMULATE RESULT':'ADMIN RESOLUTION'}</div><h2>Resolve prediction</h2><p class="modal-intro">${esc(m.question)}</p><form id="settleForm" class="admin-form"><div class="field"><label for="settleOutcome">Verified outcome</label><select id="settleOutcome" name="outcome"><option value="yes">YES</option><option value="no">NO</option><option value="void">VOID (refund points)</option></select></div>${state.mode==='live'?'<div class="field"><label for="settleSource">Public source URL (https://)</label><input type="url" id="settleSource" name="source" required placeholder="https://official-source.example/result"></div>':'<div class="info-banner"><span class="info-symbol">ⓘ</span><div>This simulates a result locally. It does not verify an actual event.</div></div>'}<div class="form-error" id="settleError"></div><button class="btn-primary modal-submit" type="submit">${state.mode==='demo'?'Simulate outcome':'Confirm verified outcome'}</button></form>`);
  }
  function navigate(view) {if(!['explore','trending','portfolio','wallet','leaderboard','admin'].includes(view))return;state.view=view;state.category='All';state.query='';$('#searchInput').value='';$('#sidebar').classList.remove('mobile-open');window.location.hash=view;render();window.scrollTo({top:0,behavior:'auto'});}
  function ledgerEntry(amount,reason,marketId=null) {return {id:id(),amount,reason,market_id:marketId,balance_after:state.demo.profile.coin_balance,created_at:new Date().toISOString()};}
  async function submitVote() {
    if(state.busy||state.modal?.type!=='vote')return;
    const m=getMarket(state.modal.marketId),pick=state.voteChoice,stake=state.stake;
    if(!m||!['yes','no'].includes(pick)||![10,25,50,100].includes(stake)||ownPick(m.id)||marketStatus(m)!=='open') {toast('Prediction is no longer available.','error');return;}
    if(!state.profile||Number(state.profile.coin_balance)<stake){toast('Insufficient points.','error');return;}
    state.busy=true;
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
    } catch(e){toast(humanError(e),'error');}finally{state.busy=false;}
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
  async function createMarket(form) {
    if(state.busy)return;
    const q=form.question.value.trim(),description=form.description.value.trim(),category=form.category.value,end=new Date(form.ends_at.value);
    if(q.length<15||description.length<15||!CATEGORIES.includes(category)||isNaN(end.getTime())||end.getTime()<=Date.now()+300000){toast('Add a clear question, settlement criteria, and closing time at least 5 minutes from now.','error');return;}
    state.busy=true;
    try {
      if(state.mode==='demo') {state.demo.markets.unshift({id:id(),question:q,description,category,ends_at:end.toISOString(),created_at:new Date().toISOString(),status:'open',outcome:null,resolution_source:null,yes_votes:0,no_votes:0});saveDemo();setDemoState();}
      else {const {error}=await sb.rpc('admin_create_market',{p_question:q,p_description:description,p_category:category,p_ends_at:end.toISOString()});if(error)throw error;await loadLive();}
      state.busy=false;toast('Market created successfully.','success');render();
    }catch(e){toast(humanError(e),'error');}finally{state.busy=false;}
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
    if(action==='scrollMarkets')$('#marketsSection')?.scrollIntoView({behavior:'smooth'});
    else if(action==='vote')openVote(mId,button.dataset.choice);
    else if(action==='detail')openDetail(mId);
    else if(action==='closeModal')closeModal();
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
    const cat=e.target.closest('button[data-category]');if(cat){state.view='explore';state.category=cat.dataset.category;render();$('#sidebar').classList.remove('mobile-open');return;}
    const a=e.target.closest('[data-action]');if(a){runAction(a);return;}
    if(e.target.matches('[data-backdrop]'))closeModal();
  });
  document.addEventListener('submit',e=>{
    if(e.target.id==='resetRequestForm'){e.preventDefault();requestPasswordReset(e.target);}
    if(e.target.id==='passwordUpdateForm'){e.preventDefault();updatePassword(e.target);}
    if(e.target.id==='authForm'){e.preventDefault();authSubmit(e.target);}
    if(e.target.id==='createMarketForm'){e.preventDefault();createMarket(e.target);}
    if(e.target.id==='settleForm'){e.preventDefault();settle(e.target);}
  });
  $('#sortSelect')?.addEventListener('change',e=>{state.sort=e.target.value;renderMain();});
  document.addEventListener('change',e=>{if(e.target.id==='sortSelect'){state.sort=e.target.value;renderMain();}});
  $('#searchInput').addEventListener('input',e=>{state.query=e.target.value;if(!['explore','trending'].includes(state.view))state.view='explore';renderMain();renderTop();});
  $('#walletTop').addEventListener('click',()=>navigate('wallet'));
  $('#authButton').addEventListener('click',openAuth);
  $('#sideHow').addEventListener('click',openHow);
  $('#menuButton').addEventListener('click',()=>$('#sidebar').classList.toggle('mobile-open'));
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();if(e.key==='/'&&!['INPUT','TEXTAREA'].includes(document.activeElement.tagName)&&!$('#modalRoot .modal')){e.preventDefault();$('#searchInput').focus();}});
  window.addEventListener('hashchange',()=>{
    const view=window.location.hash.slice(1)||'explore';
    if(['explore','trending','portfolio','wallet','leaderboard','admin'].includes(view)&&view!==state.view){
      closeModal();state.view=view;state.category='All';state.query='';$('#searchInput').value='';render();
    }
  });
  document.getElementById('footerYear').textContent=String(new Date().getFullYear());
  async function init() {
    if(isConfigured&&!isLive){state.error='Supabase SDK failed to load. Check your connection or the script CDN.';}
    const hash=window.location.hash.slice(1);if(['explore','trending','portfolio','wallet','leaderboard','admin'].includes(hash))state.view=hash;
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
      if(state.recovery){
        if(session)openPasswordUpdate();
        else{state.recovery=false;openPasswordReset();$('#recoveryError').textContent='Reset link expired. Request a new reset email.';}
      }
    }catch(e){state.error=humanError(e);render();}
  }
  init();
})();


