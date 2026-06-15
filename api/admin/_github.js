// =====================================================================
//  Escritura al repo vía GitHub Contents API.
//  Env: GITHUB_TOKEN (PAT con Contents read/write), GITHUB_REPO ("owner/repo"),
//       GITHUB_BRANCH (rama destino, ej "pagos-mercadopago" o "main").
//  Cada PUT crea un commit → Vercel redeploya esa rama (~30 s).
// =====================================================================

function cfg() {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || 'main';
  if (!token) throw new Error('GITHUB_TOKEN no configurado');
  if (!repo) throw new Error('GITHUB_REPO no configurado');
  return { token, repo, branch };
}

function headers(token) {
  return {
    Authorization: 'Bearer ' + token,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'jmates-admin',
  };
}

// SHA actual del archivo en la rama (null si no existe).
async function getSha(path) {
  const { token, repo, branch } = cfg();
  const url = `https://api.github.com/repos/${repo}/contents/${encodeURIComponent(path).replace(/%2F/g, '/')}?ref=${encodeURIComponent(branch)}`;
  const r = await fetch(url, { headers: headers(token) });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error('GitHub getSha ' + r.status + ': ' + (await r.text()).slice(0, 200));
  const j = await r.json();
  return j.sha || null;
}

// Crea/actualiza un archivo. contentBase64 = contenido ya en base64.
async function putFile(path, contentBase64, message) {
  const { token, repo, branch } = cfg();
  const sha = await getSha(path);
  const url = `https://api.github.com/repos/${repo}/contents/${encodeURIComponent(path).replace(/%2F/g, '/')}`;
  const body = { message, content: contentBase64, branch };
  if (sha) body.sha = sha;
  const r = await fetch(url, { method: 'PUT', headers: headers(token), body: JSON.stringify(body) });
  if (!r.ok) throw new Error('GitHub putFile ' + r.status + ': ' + (await r.text()).slice(0, 300));
  return r.json();
}

// Helper para JSON: escribe un objeto como archivo .json pretty.
async function putJson(path, obj, message) {
  const text = JSON.stringify(obj, null, 2) + '\n';
  return putFile(path, Buffer.from(text, 'utf8').toString('base64'), message);
}

module.exports = { getSha, putFile, putJson };
