(() => {
  'use strict';
  const archive = window.CROWD_CYCLES;
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const pct = value => Number.isFinite(value) ? `${value > 0 ? '+' : ''}${value.toFixed(2)}%` : '—';
  const number = value => Number.isFinite(value) ? value.toFixed(2) : '—';
  const short = value => value.slice(5).replace('-', '/');
  const colors = ['#dbad4f','#63cfb4','#87aee0','#c8a2da'];
  let current, selectedDate, chart;
  if (!archive?.cases?.length) { $('case-panel').innerHTML = '<p class="empty">案例数据未能载入，请刷新页面。<a href="data.json">也可打开原始记录</a>。</p>'; return; }

  function primaryGroup(day) {
    return day.groups.find(g => g.leaderIncluded) || day.groups.find(g => g.theme === '机器人' && g.count !== null) || day.groups.find(g => g.count !== null) || day.groups[0];
  }
  function groupText(g) {
    return g.count === null ? `${g.theme}：未单列` : `${g.sourceTitle} ${g.count}只 / 其他${g.assistCount}只`;
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

  function chartOption() {
    const days=current.days, dates=days.map(d=>d.date), mobile=window.innerWidth<700;
    const lo=Math.min(...days.map(d=>d.low)), hi=Math.max(...days.map(d=>d.high)), spread=hi-lo;
    const nodes=current.nodes.filter(n=>n.chart);
    const yTop=hi+spread*(mobile?.16:.6);
    const axes=[0,1,2].map(i=>({type:'category',gridIndex:i,data:dates,boundaryGap:true,axisLine:{lineStyle:{color:'#596457'}},axisTick:{show:false},axisLabel:{show:i===2,color:'#a8b4a6',fontSize:10,formatter:v=>short(v)},splitLine:{show:false},axisPointer:{show:true,label:{show:i===2,formatter:p=>p.value}}}));
    const lines=nodes.map((n,i)=>{
      const d=days.find(d=>d.date===n.date), g=primaryGroup(d);
      const textIndex=Math.round((i+.5)/nodes.length*(days.length-1));
      const countLabel=g.count===null?`${g.theme}：未单列`:`${g.sourceTitle}\n涨停${g.count}只 · 其他${g.assistCount}只`;
      return [{coord:[textIndex,hi+spread*.34],label:{show:!mobile,formatter:`${short(n.date)} · ${n.title}\n${countLabel}`,position:'start',color:i%2?'#d9ba68':'#7fe1cc',backgroundColor:'#151a18ed',padding:[5,7],fontSize:11,lineHeight:17,align:'center',width:Math.max(140,($('cycle-chart').clientWidth-110)/nodes.length-22),overflow:'break'},symbol:'none'},{coord:[n.date,d.high],symbol:'arrow',symbolSize:7}];
    });
    const series=[
      {name:current.name,type:'candlestick',data:days.map(d=>[d.open,d.close,d.low,d.high]),itemStyle:{color:'#ed6f5f',color0:'#63cfb4',borderColor:'#ed6f5f',borderColor0:'#63cfb4'},barMaxWidth:17,
       markArea:{silent:true,label:{show:false},data:current.phases.map((p,i)=>[{name:p[2],xAxis:p[0],itemStyle:{color:i%2?'#dbad4f08':'#63cfb407'}},{xAxis:p[1]}])},
       markLine:{silent:true,animation:false,lineStyle:{color:'#849987',type:'solid',width:1},data:mobile?[]:lines},
       markPoint:{symbol:'circle',symbolSize:mobile?18:6,data:nodes.map((n,i)=>({coord:[n.date,days.find(d=>d.date===n.date).high],value:i+1,label:{show:mobile,color:'#151a18',fontSize:10},itemStyle:{color:'#dbad4f'}}))}},
      {name:'MA5',type:'line',data:MA(days,5),showSymbol:false,itemStyle:{color:'#d8d4b7'},lineStyle:{color:'#d8d4b7',width:1},silent:true},
      {name:'MA10',type:'line',data:MA(days,10),showSymbol:false,itemStyle:{color:'#ba88b5'},lineStyle:{color:'#ba88b5',width:1},silent:true},
      {name:'成交量',type:'bar',xAxisIndex:1,yAxisIndex:1,data:days.map(d=>({value:d.volume/10000,itemStyle:{color:d.close>=d.open?'#ed6f5f':'#63cfb4'}})),barMaxWidth:17}
    ];
    current.themeKeys.forEach((theme,i)=>series.push({name:theme,type:'bar',xAxisIndex:2,yAxisIndex:2,data:days.map(d=>d.groups.find(g=>g.theme===theme)?.count??null),barMaxWidth:current.themeKeys.length>1?9:17,itemStyle:{color:colors[i]},label:{show:current.themeKeys.length===1,position:'top',fontSize:10,color:'#ded8bf',formatter:p=>p.value??''}}));
    return {animation:false,backgroundColor:'#151a18',textStyle:{fontFamily:'Microsoft YaHei, sans-serif'},legend:{top:10,left:mobile?30:60,data:['MA5','MA10',...current.themeKeys],textStyle:{color:'#bdc6b8',fontSize:10},itemWidth:14,itemHeight:7},
      grid:[{left:mobile?43:62,right:mobile?13:40,top:49,height:mobile?'47%':'48%'},{left:mobile?43:62,right:mobile?13:40,top:'60%',height:'12%'},{left:mobile?43:62,right:mobile?13:40,top:'79%',height:'13%'}],
      xAxis:axes,yAxis:[{scale:true,min:lo-spread*.06,max:yTop,name:'价格 / 元',nameTextStyle:{color:'#a8b4a6',fontSize:10},axisLabel:{color:'#a8b4a6',fontSize:10,formatter:v=>v.toFixed(1)},splitLine:{lineStyle:{color:'#ffffff0b'}}},
      {gridIndex:1,min:0,name:'成交量 / 万手',nameTextStyle:{color:'#a8b4a6',fontSize:10},axisLabel:{color:'#a8b4a6',fontSize:10},splitNumber:2,splitLine:{lineStyle:{color:'#ffffff0b'}}},
      {gridIndex:2,min:0,minInterval:1,name:'题材涨停合计 / 只',nameTextStyle:{color:'#a8b4a6',fontSize:10},axisLabel:{color:'#a8b4a6',fontSize:10},splitNumber:2,splitLine:{lineStyle:{color:'#ffffff0b'}}}],
      axisPointer:{link:[{xAxisIndex:'all'}],label:{backgroundColor:'#53634c'}},tooltip:{trigger:'axis',confine:true,backgroundColor:'#fffdf7',borderColor:'#d7d2c6',textStyle:{color:'#1c1b18',fontSize:11},formatter:params=>{
        const d=days.find(d=>d.date===params[0]?.axisValue);if(!d)return '';
        return `<b>${d.date} · ${esc(current.name)}</b><br>收盘 ${number(d.close)}元（${pct(d.pct)}）<br>成交量 ${(d.volume/10000).toFixed(2)}万手<br>${d.groups.map(g=>esc(groupText(g))).join('<br>')}<br><span style="color:#716b61">点击该日期，下方查看完整名单</span>`;
      }},dataZoom:[{type:'inside',xAxisIndex:[0,1,2],zoomOnMouseWheel:'ctrl',moveOnMouseWheel:false},{type:'slider',xAxisIndex:[0,1,2],height:15,bottom:4,borderColor:'#52614a',textStyle:{color:'#a8b4a6',fontSize:9},dataBackground:{lineStyle:{color:'#607258'},areaStyle:{color:'#607258'}},selectedDataBackground:{lineStyle:{color:'#c7aa60'},areaStyle:{color:'#a89555'}},fillerColor:'#d7ad4f20',handleStyle:{color:'#ad9a69'}}],series};
  }

  function renderChart() {
    if(!window.echarts){$('cycle-chart').innerHTML='<p class="empty">图表库未能载入，完整行情和数量仍可在下方表格查看。</p>';return;}
    chart ||= window.echarts.init($('cycle-chart'),null,{renderer:'svg'});
    chart.setOption(chartOption(),true);
    chart.off('click');chart.on('click',p=>{const date=current.days[p.dataIndex]?.date;if(date)selectDay(date);});
    chart.getZr().off('click');chart.getZr().on('click',event=>{
      for(let i=0;i<3;i++)if(chart.containPixel({gridIndex:i},[event.offsetX,event.offsetY])){
        const v=chart.convertFromPixel({gridIndex:i},[event.offsetX,event.offsetY]);
        const date=current.days[Math.round(v[0])]?.date;if(date)selectDay(date);break;
      }
    });
  }

  function renderNodes() {
    let chartIndex=0;
    $('key-nodes').innerHTML=current.nodes.map(n=>{
      const d=current.days.find(d=>d.date===n.date),g=primaryGroup(d),idx=n.chart?++chartIndex:null;
      return `<button type="button" class="node ${selectedDate===n.date?'active':''}" data-day="${n.date}" aria-pressed="${selectedDate===n.date}"><span class="date">${n.date}${idx?` · 图中 ${idx}`:''}</span><strong>${esc(n.title)}</strong><p>${esc(current.name)} ${pct(d.pct)} · ${number(d.close)}元</p><p class="count-line">${esc(groupText(g))}</p></button>`;
    }).join('');
  }
  function renderDay() {
    const d=current.days.find(x=>x.date===selectedDate),leaders=d.leaderGroups.map(g=>g.title);
    $('day-detail').innerHTML=`<div class="day-head"><h4>${d.date} · ${esc(current.name)}</h4><p>${esc(d.phase)} · ${esc(board(d))}</p></div><div class="day-facts"><span>收盘 <b>${number(d.close)}元</b></span><span class="${d.pct>=0?'up':'down'}">${pct(d.pct)}</span><span>开 ${number(d.open)} / 高 ${number(d.high)} / 低 ${number(d.low)}</span><span>成交量 <b>${(d.volume/10000).toFixed(2)}万手</b></span>${d.amount!==null?`<span>成交额 ${(d.amount/1e8).toFixed(2)}亿元</span>`:''}</div><p class="data-note">核心在源站的当日归类：${leaders.length?esc(leaders.join('、')):'未收录于当日涨停池'}。下列“其他涨停”是同分组剔除核心后的名单，用于观察助攻，不等同逐只已证实反推核心。</p><div class="group-grid">${d.groups.map(g=>{
      const title=g.sourceTitle||g.theme;
      if(g.count===null)return `<section class="group-card"><div class="group-heading"><strong>${esc(title)}</strong><span class="group-count"><small>未单列</small></span></div><p>来源当日没有独立列出这一题材，数量不补写为0。</p></section>`;
      return `<section class="group-card"><div class="group-heading"><strong>${esc(title)}</strong><span class="group-count">${g.count}<small>只涨停</small></span></div><p>其他涨停（助攻观察） <b>${g.assistCount}只</b> · ${g.leaderIncluded?'合计中包含核心':'合计中不含核心'}</p><div class="stock-chips">${g.stocks.map(s=>`<span class="stock-chip ${s.code===current.code?'core':''}" title="${esc(s.reason)}">${esc(s.name)} <small>${esc(s.board)} · ${esc(s.firstSeal||'时间未提供')}</small></span>`).join('')}</div><p class="group-source">${esc(g.catalyst||'')}<br>时间为首次封板；名称悬停可看源站涨停原因。</p></section>`;
    }).join('')}</div>${d.annotation?`<div class="day-note"><strong>节点归纳：</strong>${esc(d.annotation.note)}</div>`:''}<p class="data-note">来源：<a href="${esc(d.sourceUrl)}" target="_blank" rel="noopener">短线侠 ${d.request?.date||d.date} 涨停复盘</a> · <a href="sources/case-pools.json" target="_blank">查看存档与请求日期</a> · 采集 ${esc(d.retrievedAt.slice(0,10))}</p>`;
  }
  function renderLedger() {
    const q=$('day-filter').value.trim().toLowerCase();
    const days=current.days.filter(d=>!q||`${d.date} ${d.phase} ${d.annotation?.title||''} ${d.groups.map(g=>(g.sourceTitle||g.theme)+' '+g.stocks.map(s=>s.name).join(' ')).join(' ')}`.toLowerCase().includes(q));
    $('ledger-title').textContent=`${current.name} · 逐日题材与涨停数量`;
    $('ledger-status').textContent=`显示 ${days.length} / ${current.days.length} 个交易日`;
    $('ledger-body').innerHTML=days.length?days.map(d=>`<tr class="${d.date===selectedDate?'selected':''}"><td>${d.date}</td><td><strong>${number(d.close)}元</strong> <span class="${d.pct>=0?'up':'down'}">${pct(d.pct)}</span><br><span class="muted">${esc(board(d))}<br>成交量 ${(d.volume/10000).toFixed(2)}万手</span></td><td>${d.groups.map(g=>`<span class="ledger-group">${esc(g.sourceTitle||g.theme)}：${g.count===null?'<span class="muted">未单列</span>':`<b>${g.count}只</b> / 其他${g.assistCount}只`}</span>`).join('')}</td><td>${esc(nodeText(d))}${d.annotation?`<br><span class="muted">${esc(d.annotation.note)}</span>`:''}</td><td><button class="small-button" type="button" data-day="${d.date}" data-scroll="true" aria-label="查看${d.date}涨停名单">查看名单 ↑</button></td></tr>`).join(''):'<tr><td colspan="5">没有匹配记录，试试其他日期或个股名。</td></tr>';
    const groups=current.days.flatMap(d=>d.groups), known=groups.filter(g=>g.count!==null).length;
    $('coverage-note').textContent=`覆盖 ${current.days.length} 个交易日、${groups.length} 个题材日期组合：${known} 个有明确数量及名单，${groups.length-known} 个未单列。日K来源：${current.marketSource.provider}，${current.marketSource.adjustment}；成交量单位手。合并分组保留原名，不把多个题材简单相加。`;
  }
  function selectDay(date) {
    if(!current.days.some(d=>d.date===date))return;
    selectedDate=date;renderNodes();renderDay();renderLedger();
    chart?.dispatchAction({type:'showTip',seriesIndex:0,dataIndex:current.days.findIndex(d=>d.date===date)});
  }
  function selectCase(id, changeHash=true) {
    current=archive.cases.find(c=>c.id===id)||archive.cases[1];
    selectedDate=current.nodes.find(n=>n.chart)?.date||current.cycleStart;
    if(changeHash)history.replaceState(null,'',`#${current.id}`);
    $('case-panel').setAttribute('aria-labelledby',`tab-${current.id}`);
    $('case-meta').textContent=`${current.code} / ${current.start} — ${current.end}`;
    $('case-name').textContent=current.name;
    $('case-thesis').textContent=current.thesis;
    $('case-topics').innerHTML=current.themeKeys.map(t=>`<span class="tag">${esc(t)}</span>`).join('');
    $('case-summary').innerHTML=`<p>${esc(current.summary)}</p><p class="status">${esc(current.status)}</p>`;
    $('phase-strip').innerHTML=current.phases.map(p=>`<span><strong>${esc(p[2])}</strong><small>${short(p[0])}—${short(p[1])}</small></span>`).join('');
    $('chart-title').textContent=`${current.name} · 日K × 成交量 × 题材涨停`;
    $('chart-source').innerHTML=`日K：<a href="${esc(current.marketSource.sourceUrl)}" target="_blank" rel="noopener">${esc(current.marketSource.provider)}</a>，不复权。下图柱为题材涨停合计（可能含核心），空白表示未单列。标注为事后节点整理；按住 Ctrl 滚轮或拖动底部滑块缩放。`;
    $('day-filter').value='';renderTabs();renderChart();renderNodes();renderDay();renderLedger();
  }
  $('case-tabs').addEventListener('click',e=>{const b=e.target.closest('[data-case]');if(b)selectCase(b.dataset.case);});
  $('case-tabs').addEventListener('keydown',e=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
    e.preventDefault();const index=archive.cases.indexOf(current), next=e.key==='Home'?0:e.key==='End'?3:(index+(e.key==='ArrowRight'?1:3))%4;
    selectCase(archive.cases[next].id);$(`tab-${current.id}`).focus();
  });
  document.addEventListener('click',e=>{const b=e.target.closest('[data-day]');if(!b)return;selectDay(b.dataset.day);if(b.dataset.scroll)$('day-detail').scrollIntoView({behavior:'smooth',block:'start'});});
  $('day-filter').addEventListener('input',renderLedger);
  $('reset-zoom').addEventListener('click',()=>chart?.dispatchAction({type:'dataZoom',start:0,end:100}));
  $('evidence-sources').innerHTML=`<a href="${archive.sourceUrl}" target="_blank" rel="noopener">短线侠 · 按概念涨停复盘 ↗</a><p>以源站分组计数，并保存完整股票名单、封板时间和请求日期。<a href="sources/case-pools.json">涨停池存档</a> · <a href="sources/market-data.json">日K与来源</a> · <a href="data.json">完整案例数据</a></p>`;
  selectCase(location.hash.slice(1),false);
  window.addEventListener('hashchange',()=>{const id=location.hash.slice(1);if(archive.cases.some(c=>c.id===id)&&id!==current.id)selectCase(id,false);});
  let resizeTimer;window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{chart?.resize();renderChart();},150);});
})();
