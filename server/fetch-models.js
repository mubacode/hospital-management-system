fetch("https://openrouter.ai/api/v1/models").then(r=>r.json()).then(data=>{
  const freeModels = data.data.filter(m => m.pricing.prompt === "0" || m.pricing.prompt === 0 || m.id.includes(':free'));
  console.log(freeModels.map(m=>m.id).join('\n'));
});
