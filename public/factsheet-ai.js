(() => {
  const toolbar=document.querySelector('.reference-toolbar');
  const button=document.createElement('button');button.textContent='AI draft KYP assessment';toolbar.append(button);
  const status=document.createElement('span');status.setAttribute('role','status');status.style.alignSelf='center';toolbar.append(status);
  const paper=document.querySelector('.paper');
  let busy=false;
  button.onclick=async()=>{
    if(location.port==='3100'){location.href='http://localhost:3000/factsheet-preview.html'+location.search;return;}
    if(busy)return;
    const title=paper.querySelector('h2')?.textContent;
    if(!title||paper.textContent.includes('Loading the TD'))return;
    const originalSections=[...paper.children];
    const sourceText=originalSections.filter(n=>n.id!=='ai-assessment-result'&&!n.querySelector('.field-grid')).map(n=>n.innerText).join('\n').slice(0,50000);
    let criteria={};try{criteria=JSON.parse(localStorage.getItem('bullbrief-rationale-profile')||'{}')}catch{}
    busy=true;button.disabled=true;status.textContent='Analyzing document and drafting assessment...';
    try{
      let facts={productName:title,assetType:title.includes('Bank')?'stock':'fund',historicalPerformance:sourceText},products;
      if(title.includes('Toronto-Dominion')){
        const dataResponse=await fetch('/factsheet-reference-data.json');if(!dataResponse.ok)throw Error('Could not load source facts.');
        products=(await dataResponse.json()).products;facts=products[0];
      }else if(title==='Investment comparison report'){
        products=[
          {productName:'Fidelity All-in-One Growth ETF B',mer:1.71,return1Y:14.93,return3Y:15.92,standardDeviation:10.29,sharpeRatio:1.10},
          {productName:'CI U.S. Monthly Income B',mer:2.30,return1Y:12.01,return3Y:13.89,standardDeviation:10.88,sharpeRatio:.88},
          {productName:'BMO Growth ETF Portfolio Advisor',mer:1.72,return1Y:10.99,return3Y:11.20,standardDeviation:9.48,sharpeRatio:.74},
          {productName:'Axiom Global Growth Portfolio Elite',mer:1.59,return1Y:10.59,return3Y:11.01,standardDeviation:9.07,sharpeRatio:.75}
        ].map(p=>({...p,assetType:'fund',asOfDate:'2025-07-31',currency:'CAD',category:'Canada Fund Global'}));facts=products[0];
      }
      const response=await fetch('/api/kyp/ai-assessment',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({fileName:title+' (preview reference)',facts,products,criteria}),signal:AbortSignal.timeout(40000)});
      const result=await response.json().catch(()=>({error:'Unexpected server response. Please retry.'}));
      if(!response.ok)throw Error(result.error||'AI drafting failed.');
      // Do not apply a response to another document after navigation.
      if(paper.querySelector('h2')?.textContent!==title){status.textContent='Document changed. Generate a draft for the current document.';return;}
      document.getElementById('ai-assessment-result')?.remove();
      const section=document.createElement('section');section.id='ai-assessment-result';section.className='ref-page';
      const heading=document.createElement('h2');heading.textContent='AI-drafted KYP assessment';section.append(heading);
      const labels={structure:'Product structure',risk:'Material risks',costs:'Costs',liquidityComplexity:'Liquidity and complexity',conflicts:'Conflicts',alternatives:'Alternatives',lowerCostRationale:'Cost comparison',rationale:'Product rationale',clientExplanation:'Client explanation',changeMonitoring:'Monitoring',evidenceSources:'Evidence'};
      for(const [key,label] of Object.entries(labels)){const h=document.createElement('h3');h.textContent=label;const answer=document.createElement('div');answer.contentEditable='true';answer.setAttribute('role','textbox');answer.setAttribute('aria-label',label);answer.style.cssText='white-space:pre-wrap;font-size:12px;padding:8px;border:1px solid #d9e2de';answer.textContent=result.data[key]||'';section.append(h,answer);}
      paper.append(section);
      const rationaleLabel=[...paper.querySelectorAll('label')].find(n=>n.textContent==='Rationale for choosing this product');
      if(rationaleLabel){const input=document.getElementById(rationaleLabel.htmlFor);if(input)input.value=result.data.rationale;}
      status.textContent='Assessment drafted. Edit the answers below; they are included when printing.';
      section.scrollIntoView({behavior:'smooth',block:'start'});
    }catch(e){status.textContent=e.name==='TimeoutError'?'AI timed out. Your document is unchanged; try again.':e.message;}
    finally{busy=false;button.disabled=false;}
  };
})();
