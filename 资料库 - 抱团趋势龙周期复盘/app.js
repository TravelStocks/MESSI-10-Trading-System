(() => {
  'use strict';
  const archive = window.CROWD_CYCLES;
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const pct = value => Number.isFinite(value) ? `${value > 0 ? '+' : ''}${value.toFixed(2)}%` : '—';
  const number = value => Number.isFinite(value) ? value.toFixed(2) : '—';
  const short = value => value.slice(5).replace('-', '/');
  const colors = ['#dbad4f','#63cfb4','#87aee0','#c8a2da'];
  let current, selectedDate, chart, chartMode='daily';
  if (!archive?.cases?.length) { $('case-panel').innerHTML = '<p class="empty">案例数据未能载入，请刷新页面。<a href="data.json">也可打开原始记录</a>。</p>'; return; }

  function primaryGroup(day) {
    return day.groups.find(g => g.leaderIncluded) || day.groups.find(g => g.theme === '机器人' && g.count !== null) || day.groups.find(g => g.count !== null) || day.groups[0];
  }
  function groupText(g) {
    return g.count === null ? `${g.theme}：待核实` : `${g.sourceTitle||g.theme} ${g.count}只 / 其他${g.assistCount}只${g.status==='pool_reviewed'?'（复核）':''}`;
  }
  function board(day) {
    const s = day.leaderGroups[0]?.leaderStock;
    return s ? `${s.board} · ${s.type}` : day.pct <= -9.9 ? '大幅下跌' : '未收录于当日涨停池';
  }
  function nodeText(day) {
    return day.annotation ? day.annotation.title : day.phase;
  }
  function MA(days, n) {
    return days.map((_, i) => i < n-1 ? null : days.slice(i-n+1, i+1).reduce((a,d) => a+d.close,0)/n);
  }

  function renderTabs() {
    $('case-tabs').innerHTML = archive.cases.map((c,i) => `<button type="button" role="tab" id="tab-${c.id}" aria-controls="case-panel" aria-selected="${c.id===current.id}" tabindex="${c.id===current.id?0:-1}" data-case="${c.id}"><span>CASE 0${i+1} / ${c.code}</span><strong>${esc(c.name)}</strong><small>${esc(c.subtitle)}</small></button>`).join('');
  }

  function dayWidth() { return current.themeKeys.length>2?190:172; }
  function renderDailyLabels() {
    const daily=chartMode==='daily';
    $('chart-canvas').style.width=daily?`${current.days.length*dayWidth()+102}px`:'100%';
    $('daily-chart-labels').hidden=!daily;
    $('daily-chart-labels').style.gridTemplateColumns=`repeat(${current.days.length},${dayWidth()}px)`;
    $('daily-chart-labels').innerHTML=current.days.map(d=>`<button class="daily-label ${d.date===selectedDate?'active':''}" type="button" data-day="${d.date}" aria-pressed="${d.date===selectedDate}" aria-label="${d.date} ${esc(current.name)} 每日标注"><span class="daily-date">${short(d.date)} <small>${esc(d.phase)}</small></span><strong>${number(d.close)}元 <span class="${d.pct>=0?'gain':'loss'}">${pct(d.pct)}</span></strong><span class="daily-volume">成交量 ${(d.volume/10000).toFixed(2)}万手</span>${d.groups.map(g=>`<span class="daily-theme"><span>${esc(g.sourceTitle||g.theme)}</span><b>涨停 ${g.count??'待核实'}只 <small>其他 ${g.assistCount??'—'}只</small></b>${g.status==='pool_reviewed'?'<em>完整池复核补录</em>':'<em class="source-basis">源站分组</em>'}</span>`).join('')}<span class="daily-open">查看当日名单 ↓</span></button>`).join('');
    $('daily-view').setAttribute('aria-pressed',String(daily));
    $('overview-view').setAttribute('aria-pressed',String(!daily));
    $('previous-days').disabled=!daily;$('next-days').disabled=!daily;
    $('chart-hint').textContent=daily?'每天一列 · 横向滚动查看全部日期 · 点击日期展开名单':'全周期价格与题材概览 · 切回“逐日标注”查看每一天的完整标注';
    $('chart-range').textContent=`${current.start} — ${current.end} · ${current.days.length}个交易日`;
  }

  function chartOption() {
    const days=current.days, dates=days.map(d=>d.date), daily=chartMode==='daily', mobile=!daily&&window.innerWidth<700;
    const lo=Math.min(...days.map(d=>d.low)), hi=Math.max(...days.map(d=>d.high)), spread=hi-lo;
    const yTop=hi+spread*.13;
    const axes=[0,1,2].map(i=>({type:'category',gridIndex:i,data:dates,boundaryGap:true,axisLine:{lineStyle:{color:'#596457'}},axisTick:{show:false},axisLabel:{show:i===0||i===2,interval:daily?0:'auto',color:'#a8b4a6',fontSize:10,formatter:v=>short(v)},splitLine:{show:daily,lineStyle:{color:'#ffffff09'}},axisPointer:{show:true,label:{show:i===2,formatter:p=>p.value}}}));
    const lines=days.map(d=>[{coord:[d.date,hi+spread*.11],symbol:'none'},{coord:[d.date,d.high],symbol:'arrow',symbolSize:6}]);
    const series=[
      {name:current.name,type:'candlestick',data:days.map(d=>[d.open,d.close,d.low,d.high]),itemStyle:{color:'#ed6f5f',color0:'#63cfb4',borderColor:'#ed6f5f',borderColor0:'#63cfb4'},barMaxWidth:17,
       markArea:{silent:true,label:{show:false},data:current.phases.map((p,i)=>[{name:p[2],xAxis:p[0],itemStyle:{color:i%2?'#dbad4f08':'#63cfb407'}},{xAxis:p[1]}])},
       markLine:{silent:true,animation:false,label:{show:false},lineStyle:{color:'#84998766',type:'solid',width:1},data:daily?lines:[]}},
      {name:'MA5',type:'line',data:MA(days,5),showSymbol:false,itemStyle:{color:'#d8d4b7'},lineStyle:{color:'#d8d4b7',width:1},silent:true},
      {name:'MA10',type:'line',data:MA(days,10),showSymbol:false,itemStyle:{color:'#ba88b5'},lineStyle:{color:'#ba88b5',width:1},silent:true},
      {name:'成交量',type:'bar',xAxisIndex:1,yAxisIndex:1,data:days.map(d=>({value:d.volume/10000,itemStyle:{color:d.close>=d.open?'#ed6f5f':'#63cfb4'}})),barMaxWidth:17}
    ];
    current.themeKeys.forEach((theme,i)=>series.push({name:theme,type:'bar',xAxisIndex:2,yAxisIndex:2,data:days.map(d=>d.groups.find(g=>g.theme===theme)?.count??null),barMaxWidth:daily?20:current.themeKeys.length>1?9:17,itemStyle:{color:colors[i]},label:{show:daily||current.themeKeys.length===1,position:'top',fontSize:10,color:colors[i],formatter:p=>p.value??''}}));
    return {animation:false,backgroundColor:'#151a18',textStyle:{fontFamily:'Microsoft YaHei, sans-serif'},legend:{top:10,left:mobile?30:60,data:['MA5','MA10',...current.themeKeys],textStyle:{color:'#bdc6b8',fontSize:10},itemWidth:14,itemHeight:7},
      grid:[{left:mobile?43:62,right:mobile?13:40,top:49,height:mobile?'47%':'48%'},{left:mobile?43:62,right:mobile?13:40,top:'60%',height:'12%'},{left:mobile?43:62,right:mobile?13:40,top:'79%',height:'13%'}],
      xAxis:axes,yAxis:[{scale:true,min:lo-spread*.06,max:yTop,name:'价格 / 元',nameTextStyle:{color:'#a8b4a6',fontSize:10},axisLabel:{color:'#a8b4a6',fontSize:10,formatter:v=>v.toFixed(1)},splitLine:{lineStyle:{color:'#ffffff0b'}}},
      {gridIndex:1,min:0,name:'成交量 / 万手',nameTextStyle:{color:'#a8b4a6',fontSize:10},axisLabel:{color:'#a8b4a6',fontSize:10},splitNumber:2,splitLine:{lineStyle:{color:'#ffffff0b'}}},
      {gridIndex:2,min:0,minInterval:1,name:'题材涨停合计 / 只',nameTextStyle:{color:'#a8b4a6',fontSize:10},axisLabel:{color:'#a8b4a6',fontSize:10},splitNumber:2,splitLine:{lineStyle:{color:'#ffffff0b'}}}],
      axisPointer:{link:[{xAxisIndex:'all'}],label:{backgroundColor:'#53634c'}},tooltip:{trigger:'axis',confine:true,backgroundColor:'#fffdf7',borderColor:'#d7d2c6',textStyle:{color:'#1c1b18',fontSize:11},formatter:params=>{
        const d=days.find(d=>d.date===params[0]?.axisValue);if(!d)return '';
        return `<b>${d.date} · ${esc(current.name)}</b><br>收盘 ${number(d.close)}元（${pct(d.pct)}）<br>成交量 ${(d.volume/10000).toFixed(2)}万手<br>${d.groups.map(g=>esc(groupText(g))).join('<br>')}<br><span style="color:#716b61">点击该日期，下方查看完整名单</span>`;
      }},dataZoom:daily?[]:[{type:'inside',xAxisIndex:[0,1,2],zoomOnMouseWheel:'ctrl',moveOnMouseWheel:false},{type:'slider',xAxisIndex:[0,1,2],height:15,bottom:4,borderColor:'#52614a',textStyle:{color:'#a8b4a6',fontSize:9},dataBackground:{lineStyle:{color:'#607258'},areaStyle:{color:'#607258'}},selectedDataBackground:{lineStyle:{color:'#c7aa60'},areaStyle:{color:'#a89555'}},fillerColor:'#d7ad4f20',handleStyle:{color:'#ad9a69'}}],series};
  }

  function renderChart() {
    renderDailyLabels();
    if(!window.echarts){$('cycle-chart').innerHTML='<p class="empty">图表库未能载入，完整行情和数量仍可在下方表格查看。</p>';return;}
    chart ||= window.echarts.init($('cycle-chart'),null,{renderer:'svg'});
    chart.resize();chart.setOption(chartOption(),true);
    chart.off('click');chart.on('click',p=>{const date=current.days[p.dataIndex]?.date;if(date)selectDay(date);});
    chart.getZr().off('click');chart.getZr().on('click',event=>{
      for(let i=0;i<3;i++)if(chart.containPixel({gridIndex:i},[event.offsetX,event.offsetY])){
        const v=chart.convertFromPixel({gridIndex:i},[event.offsetX,event.offsetY]);
        const date=current.days[Math.round(v[0])]?.date;if(date)selectDay(date);break;
      }
    });
  }

  function renderNodes() {
    $('key-nodes').innerHTML=current.nodes.map(n=>{
      const d=current.days.find(d=>d.date===n.date),g=primaryGroup(d);
      return `<button type="button" class="node ${selectedDate===n.date?'active':''}" data-day="${n.date}" aria-pressed="${selectedDate===n.date}"><span class="date">${n.date}</span><strong>${esc(n.title)}</strong><p>${esc(current.name)} ${pct(d.pct)} · ${number(d.close)}元</p><p class="count-line">${current.id==='jinjian'?d.groups.map(g=>esc(groupText(g))).join('<br>'):esc(groupText(g))}</p></button>`;
    }).join('');
  }
  function renderDay() {
    const d=current.days.find(x=>x.date===selectedDate),leaders=d.leaderGroups.map(g=>g.title);
    $('day-detail').innerHTML=`<div class="day-head"><h4>${d.date} · ${esc(current.name)}</h4><p>${esc(d.phase)} · ${esc(board(d))}</p></div><div class="day-facts"><span>收盘 <b>${number(d.close)}元</b></span><span class="${d.pct>=0?'up':'down'}">${pct(d.pct)}</span><span>开 ${number(d.open)} / 高 ${number(d.high)} / 低 ${number(d.low)}</span><span>成交量 <b>${(d.volume/10000).toFixed(2)}万手</b></span>${d.amount!==null?`<span>成交额 ${(d.amount/1e8).toFixed(2)}亿元</span>`:''}</div><p class="data-note">核心在源站的当日归类：${leaders.length?esc(leaders.join('、')):'未收录于当日涨停池'}。下列“其他涨停”是同分组剔除核心后的名单，用于观察助攻，不等同逐只已证实反推核心。</p><div class="group-grid">${d.groups.map(g=>{
      const title=g.sourceTitle||g.theme;
      if(g.count===null)return `<section class="group-card"><strong>${esc(title)}</strong><p>该日数据待核实。</p></section>`;
      const reviewed=g.status==='pool_reviewed';
      return `<section class="group-card"><div class="group-heading"><strong>${esc(title)}${reviewed?' <small class="review-badge">复核补录</small>':''}</strong><span class="group-count">${g.count}<small>只涨停</small></span></div><p>其他涨停（助攻观察） <b>${g.assistCount}只</b> · ${g.leaderIncluded?'合计中包含核心':'合计中不含核心'}</p><div class="stock-chips">${g.stocks.map(s=>`<span class="stock-chip ${s.code===current.code?'core':''}" title="${esc(s.reason)}">${esc(s.name)} <small>${esc(s.board)} · ${esc(s.firstSeal||'时间未提供')}</small></span>`).join('')}</div>${reviewed?`<p class="group-source">原站未单列，已复核该日完整涨停池。${g.count===0?'按本页归类规则，源池内没有匹配股票。':'以下保留原分组与涨停原因；补录表示题材关联。'}</p>${g.stocks.length?`<details class="review-evidence"><summary>查看${g.stocks.length}只股票的补录依据</summary>${g.stocks.map(s=>`<p><b>${esc(s.name)}</b> · 原分组：${esc(s.originalGroup||s.sourceGroup||'')}<br>${esc(s.reason)}</p>`).join('')}</details>`:''}`:`<p class="group-source">${esc(g.catalyst||'')}<br>时间为首次封板；名称悬停可看源站涨停原因。</p>`}</section>`;
    }).join('')}</div>${d.annotation?`<div class="day-note"><strong>节点归纳：</strong>${esc(d.annotation.note)}</div>`:''}<p class="data-note">来源：<a href="${esc(d.sourceUrl)}" target="_blank" rel="noopener">短线侠 ${d.request?.date||d.date} 涨停复盘</a> · <a href="sources/case-pools.json" target="_blank">原分组存档</a> · <a href="sources/supplemental-review.json" target="_blank">补录复核记录</a> · 采集 ${esc(d.retrievedAt.slice(0,10))}</p>`;
  }
  function renderLedger() {
    const q=$('day-filter').value.trim().toLowerCase();
    const days=current.days.filter(d=>!q||`${d.date} ${d.phase} ${d.annotation?.title||''} ${d.groups.map(g=>(g.sourceTitle||g.theme)+' '+g.stocks.map(s=>s.name).join(' ')).join(' ')}`.toLowerCase().includes(q));
    $('ledger-title').textContent=`${current.name} · 逐日题材与涨停数量`;
    $('ledger-status').textContent=`显示 ${days.length} / ${current.days.length} 个交易日`;
    $('ledger-body').innerHTML=days.length?days.map(d=>`<tr class="${d.date===selectedDate?'selected':''}"><td>${d.date}</td><td><strong>${number(d.close)}元</strong> <span class="${d.pct>=0?'up':'down'}">${pct(d.pct)}</span><br><span class="muted">${esc(board(d))}<br>成交量 ${(d.volume/10000).toFixed(2)}万手</span></td><td>${d.groups.map(g=>`<span class="ledger-group">${esc(g.sourceTitle||g.theme)}：${g.count===null?'<span class="muted">待核实</span>':`<b>${g.count}只</b> / 其他${g.assistCount}只`}${g.status==='pool_reviewed'?' <small class="review-badge">复核</small>':''}</span>`).join('')}</td><td>${esc(nodeText(d))}${d.annotation?`<br><span class="muted">${esc(d.annotation.note)}</span>`:''}</td><td><button class="small-button" type="button" data-day="${d.date}" data-scroll="true" aria-label="查看${d.date}涨停名单">查看名单 ↑</button></td></tr>`).join(''):'<tr><td colspan="5">没有匹配记录，试试其他日期或个股名。</td></tr>';
    const groups=current.days.flatMap(d=>d.groups), reviewed=groups.filter(g=>g.status==='pool_reviewed').length;
    $('coverage-note').textContent=`覆盖 ${current.days.length} 个交易日、${groups.length} 个题材日期组合：${groups.length-reviewed} 个沿用源站分组，${reviewed} 个由完整池逐股复核补录。补录不是源站原分组数，两种口径比较时须结合名单；补录按当日明确涨停原因识别题材关联；0仅指该日源池在本页规则下无匹配。日K：${current.marketSource.provider}，不复权。`;
  }
  function selectDay(date) {
    if(!current.days.some(d=>d.date===date))return;
    selectedDate=date;renderNodes();renderDay();renderLedger();
    document.querySelectorAll('.daily-label').forEach(el=>{const active=el.dataset.day===date;el.classList.toggle('active',active);el.setAttribute('aria-pressed',String(active));});
    if(chartMode==='daily'){
      const scroll=$('chart-scroll'),x=current.days.findIndex(d=>d.date===date)*dayWidth()+62;
      if(x<scroll.scrollLeft||x+dayWidth()>scroll.scrollLeft+scroll.clientWidth)scroll.scrollTo({left:Math.max(0,x-62),behavior:'smooth'});
    }
    chart?.dispatchAction({type:'showTip',seriesIndex:0,dataIndex:current.days.findIndex(d=>d.date===date)});
  }
  function selectCase(id, changeHash=true) {
    current=archive.cases.find(c=>c.id===id)||archive.cases[1];
    selectedDate=current.days[0].date;
    if(changeHash)history.replaceState(null,'',`#${current.id}`);
    $('case-panel').setAttribute('aria-labelledby',`tab-${current.id}`);
    $('case-meta').textContent=`${current.code} / ${current.start} — ${current.end}`;
    $('case-name').textContent=current.name;
    $('case-thesis').textContent=current.thesis;
    $('case-topics').innerHTML=current.themeKeys.map(t=>`<span class="tag">${esc(t)}</span>`).join('');
    $('case-summary').innerHTML=`<p>${esc(current.summary)}</p><p class="status">${esc(current.status)}</p>`;
    $('phase-strip').innerHTML=current.phases.map(p=>`<span><strong>${esc(p[2])}</strong><small>${short(p[0])}—${short(p[1])}</small></span>`).join('');
    $('chart-title').textContent=`${current.name} · 日K × 成交量 × 题材涨停`;
    $('chart-source').innerHTML=`日K：<a href="${esc(current.marketSource.sourceUrl)}" target="_blank" rel="noopener">${esc(current.marketSource.provider)}</a>，不复权。所有交易日直接标注，柱为题材涨停合计（可能含核心）。带“复核”标记的日期由当日完整源池逐股补录；<a href="sources/supplemental-review.json" target="_blank">查看补录规则与依据</a>。`;
    $('day-filter').value='';renderTabs();renderChart();renderNodes();renderDay();renderLedger();$('chart-scroll').scrollLeft=0;
  }
  $('case-tabs').addEventListener('click',e=>{const b=e.target.closest('[data-case]');if(b)selectCase(b.dataset.case);});
  $('case-tabs').addEventListener('keydown',e=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
    e.preventDefault();const index=archive.cases.indexOf(current), next=e.key==='Home'?0:e.key==='End'?3:(index+(e.key==='ArrowRight'?1:3))%4;
    selectCase(archive.cases[next].id);$(`tab-${current.id}`).focus();
  });
  document.addEventListener('click',e=>{const b=e.target.closest('[data-day]');if(!b)return;selectDay(b.dataset.day);if(b.dataset.scroll)$('day-detail').scrollIntoView({behavior:'smooth',block:'start'});});
  $('day-filter').addEventListener('input',renderLedger);
  $('daily-view').addEventListener('click',()=>{chartMode='daily';renderChart();});
  $('overview-view').addEventListener('click',()=>{chartMode='overview';renderChart();$('chart-scroll').scrollLeft=0;});
  $('previous-days').addEventListener('click',()=>$('chart-scroll').scrollBy({left:-dayWidth()*5,behavior:'smooth'}));
  $('next-days').addEventListener('click',()=>$('chart-scroll').scrollBy({left:dayWidth()*5,behavior:'smooth'}));
  $('evidence-sources').innerHTML=`<a href="${archive.sourceUrl}" target="_blank" rel="noopener">短线侠 · 按概念涨停复盘 ↗</a><p>单列题材采用原分组；未单列日期按当日完整池涨停原因逐股补录，并标明原分组。<a href="sources/case-pools.json">原分组存档</a> · <a href="sources/full-market-pools.json">完整源池</a> · <a href="sources/supplemental-review.json">补录规则与依据</a> · <a href="sources/market-data.json">日K与来源</a> · <a href="data.json">完整案例数据</a></p>`;
  selectCase(location.hash.slice(1),false);
  window.addEventListener('hashchange',()=>{const id=location.hash.slice(1);if(archive.cases.some(c=>c.id===id)&&id!==current.id)selectCase(id,false);});
  let resizeTimer;window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{chart?.resize();renderChart();},150);});
})();
