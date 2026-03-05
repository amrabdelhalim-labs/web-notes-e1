const base = 'http://127.0.0.1:3000';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitUp() {
  for (let i = 0; i < 30; i += 1) {
    try {
      const response = await fetch(`${base}/api/health`);
      if (response.ok || response.status === 503) return;
    } catch {}
    await sleep(1000);
  }
  throw new Error('Server not reachable on port 3000');
}

async function request(path, options) {
  const response = await fetch(`${base}${path}`, options);
  const text = await response.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { status: response.status, json, text };
}

function out(label, value) {
  console.log(`${label}=${value}`);
}

async function main() {
  await waitUp();

  const health = await request('/api/health');
  out('HEALTH_STATUS', health.status);

  const email = `tester_${Date.now()}@example.com`;
  const username = `tester_${Math.floor(Math.random() * 1e9)}`;
  const password = 'Pass1234!';

  const register = await request('/api/auth/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  });
  out('REGISTER_STATUS', register.status);
  if (register.status !== 201) {
    out('REGISTER_BODY', register.text);
    process.exit(1);
  }

  const token = register.json?.data?.token;
  const userId = register.json?.data?.user?._id ?? register.json?.data?.user?.id;
  out('USER_ID_PRESENT', Boolean(userId));

  const login = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  out('LOGIN_STATUS', login.status);

  const me = await request('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  out('ME_STATUS', me.status);

  const put = await request(`/api/users/${userId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ displayName: 'Tester Updated' }),
  });
  out('PUT_STATUS', put.status);

  const del = await request(`/api/users/${userId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ password }),
  });
  out('DELETE_STATUS', del.status);

  if (del.status !== 200) {
    out('DELETE_BODY', del.text);
    process.exit(1);
  }

  out('HTTP_SMOKE', 'PASS');
}

main().catch((error) => {
  console.error('HTTP_SMOKE_ERROR', error.message);
  process.exit(1);
});
