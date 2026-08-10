(()=>{
  const KEY='vanta-live-approval-mode';
  let policy=localStorage.getItem(KEY)||'guarded';
  let proposalTimer=null;
  let proposalExpires=0;
  let proposalCA='';
  let proposalSymbol='';
  let lastProposalAt=0;

  const el=id=>document.getElementById(id);
  const safeText=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function inject(){
    const center=document.querySelector('.wallet-center');
    if(center&&!el('approvalPolicyCard')){
      const card=document.createElement('article');
      card.id='approvalPolicyCard';
      card.className='glass form approval-card';
      card.innerHTML=`
        <div class="card-head"><div><span class="eyebrow">EXECUTION POLICY</span><h3>Trade approvals</h3></div><span id="approvalPolicyBadge" class="pill">GUARDED</span></div>
        <div class="approval-options">
          <button data-live-policy="wallet" class="approval-option"><b>👛 WALLET SIGN</b><span>Open Phantom immediately for every real swap.</span></button>
          <button data-live-policy="guarded" class="approval-option"><b>⚡ 3-SECOND GATE</b><span>VANTA shows BUY / REJECT with a 3-second countdown before opening the wallet signer.</span></button>
          <button data-live-policy="paper-auto" class="approval-option"><b>🤖 AUTO PAPER</b><span>Fully automatic execution, but virtual funds only.</span></button>
          <button class="approval-option locked" disabled><b>☢ AUTO LIVE · LOCKED</b><span>Unattended spending is not enabled in a public GitHub Pages build.</span></button>
        </div>
        <div class="approval-note">A Phantom connection is not a spending permission. A real transaction still needs a cryptographic wallet signature. VANTA never stores a seed phrase/private key.</div>`;
      center.prepend(card);
      card.querySelectorAll('[data-live-policy]').forEach(b=>{
        const fire=e=>{e?.preventDefault?.();policy=b.dataset.livePolicy;localStorage.setItem(KEY,policy);syncPolicy();if(policy==='paper-auto'){state.mode='paper';el('modeBadge').textContent='PAPER AUTO';toast('Auto Paper enabled');}else toast(policy==='guarded'?'3-second gate enabled':'Wallet signing enabled')};
        b.addEventListener('pointerup',fire,{passive:false});
        b.addEventListener('click',e=>{if(e.detail===0)return;fire(e)});
      });
      syncPolicy();
    }
    if(!el('tradeProposal')){
      const modal=document.createElement('div');
      modal.id='tradeProposal';modal.className='trade-proposal hidden';
      modal.innerHTML=`<div class="trade-proposal-card glass">
        <div class="proposal-head"><div><span class="eyebrow">LIVE TRADE PROPOSAL</span><h2 id="proposalTitle">BUY</h2></div><div id="proposalCountdown" class="count-ring">3.0</div></div>
        <div class="proposal-grid"><div><span>Token</span><b id="proposalToken">—</b></div><div><span>Spend</span><b id="proposalSpend">—</b></div><div><span>Slippage cap</span><b id="proposalSlip">—</b></div><div><span>Signal</span><b id="proposalSignal">—</b></div></div>
        <p id="proposalReason">Waiting for proposal details.</p>
        <div class="proposal-actions"><button id="proposalReject" class="btn danger">✕ REJECT</button><button id="proposalAccept" class="btn primary">✓ ACCEPT</button></div>
        <small>Accepting advances to the wallet signing step for a real transaction. It does not bypass Phantom's signature requirement.</small>
      </div>`;
      document.body.appendChild(modal);
      bindProposalButtons();
    }
    replaceLiveSwapButton();
  }

  function syncPolicy(){
    document.querySelectorAll('[data-live-policy]').forEach(b=>b.classList.toggle('selected',b.dataset.livePolicy===policy));
    const badge=el('approvalPolicyBadge');if(badge)badge.textContent=policy==='guarded'?'3S GATE':policy==='wallet'?'WALLET SIGN':'AUTO PAPER';
  }

  function replaceLiveSwapButton(){
    const old=el('liveSwap');if(!old||old.dataset.v21==='1')return;
    const btn=old.cloneNode(true);btn.dataset.v21='1';old.replaceWith(btn);
    const fire=e=>{e?.preventDefault?.();requestTradeFromTicket()};
    btn.addEventListener('pointerup',fire,{passive:false});
    btn.addEventListener('click',e=>{if(e.detail===0)return;fire(e)});
  }

  function requestTradeFromTicket(){
    const ca=el('liveTokenCA')?.value?.trim();
    if(!ca){toast('Paste/select a token CA');return}
    if(policy==='paper-auto'){state.mode='paper';toast('AUTO PAPER is active · no real funds used');return}
    if(policy==='wallet'){openRealSwap(ca);return}
    const p=state.byCA?.[ca];
    showProposal({ca,symbol:p?.baseToken?.symbol||ca.slice(0,6)+'…',score:p?scorePair(p).score:'MANUAL',reason:p?`Liquidity ${money(scorePair(p).liq,0)} · flow ${(scorePair(p).flow*100).toFixed(0)}% · risk ${scorePair(p).risk}/100`:'Manual token ticket'});
  }

  function showProposal({ca,symbol,score,reason}){
    if(!ca||!el('tradeProposal'))return;
    proposalCA=ca;proposalSymbol=symbol||'TOKEN';proposalExpires=performance.now()+3000;
    el('proposalTitle').textContent=`BUY ${proposalSymbol}`;
    el('proposalToken').textContent=proposalSymbol;
    el('proposalSpend').textContent=`${Number(el('liveSpend')?.value||0.01).toFixed(3)} SOL`;
    el('proposalSlip').textContent=`${el('liveSlippage')?.value||3}%`;
    el('proposalSignal').textContent=typeof score==='number'?`${score}/100`:String(score||'—');
    el('proposalReason').textContent=reason||'VANTA strategy proposal';
    el('tradeProposal').classList.remove('hidden');
    clearInterval(proposalTimer);proposalTimer=setInterval(updateCountdown,50);updateCountdown();
    if(typeof log==='function')log('SIGNAL',`Live proposal ${proposalSymbol} · 3s gate`);
  }

  function updateCountdown(){
    const left=Math.max(0,proposalExpires-performance.now());
    const out=el('proposalCountdown');if(out)out.textContent=(left/1000).toFixed(1);
    if(left<=0){clearInterval(proposalTimer);closeProposal('expired')}
  }
  function closeProposal(reason){
    clearInterval(proposalTimer);el('tradeProposal')?.classList.add('hidden');
    if(reason==='expired'&&typeof log==='function')log('RISK',`${proposalSymbol||'Trade'} proposal expired · no order sent`);
    proposalCA='';proposalSymbol='';
  }
  function bindProposalButtons(){
    const reject=el('proposalReject'),accept=el('proposalAccept');
    const rejectFn=e=>{e?.preventDefault?.();closeProposal('rejected');toast('Trade rejected')};
    const acceptFn=e=>{e?.preventDefault?.();const ca=proposalCA;if(!ca)return;closeProposal('accepted');toast('Accepted · opening wallet signer');openRealSwap(ca)};
    reject?.addEventListener('pointerup',rejectFn,{passive:false});reject?.addEventListener('click',e=>{if(e.detail===0)return;rejectFn(e)});
    accept?.addEventListener('pointerup',acceptFn,{passive:false});accept?.addEventListener('click',e=>{if(e.detail===0)return;acceptFn(e)});
  }

  function maybeCreateBotProposal(){
    if(policy!=='guarded'||state.mode!=='real'||!state.running||!state.market?.length||!el('tradeProposal')?.classList.contains('hidden'))return;
    if(Date.now()-lastProposalAt<12000)return;
    const ranked=state.market.map(p=>({p,s:scorePair(p)})).sort((a,b)=>b.s.score-a.s.score);
    const c=ranked.find(x=>qualityGate(x.p,'MASTER'));
    if(!c)return;
    lastProposalAt=Date.now();
    el('liveTokenCA').value=c.p.baseToken.address;
    showProposal({ca:c.p.baseToken.address,symbol:c.p.baseToken.symbol,score:c.s.score,reason:`Quality ${c.s.score}/100 · risk ${c.s.risk}/100 · liquidity ${money(c.s.liq,0)} · buy flow ${(c.s.flow*100).toFixed(0)}%`});
  }

  document.addEventListener('DOMContentLoaded',()=>{
    inject();
    const originalShowView=showView;
    showView=function(name){originalShowView(name);if(name==='wallet')setTimeout(inject,0)};
    setInterval(()=>{inject();maybeCreateBotProposal()},1000);
  });
})();