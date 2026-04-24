fetch("https://api.x.ai/v1/models", {headers: {"Authorization": "Bearer " + process.env.XAI_API_KEY}})
  .then(r=>r.json())
  .then(data => console.log(data.data.map(m=>m.id).join('\n')));
