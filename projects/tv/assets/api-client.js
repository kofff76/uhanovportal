/* Тонкий адаптер к существующему MediaCMS. Не содержит секретов. */
(() => {
  const base = (window.ZHURAVLI_API_BASE || '').replace(/\/$/, '');

  async function request(path, options = {}) {
    const response = await fetch(`${base}${path}`, {
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(options.body instanceof FormData ? {} : {'Content-Type': 'application/json'}),
        ...(options.headers || {})
      },
      ...options
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.status === 204 ? null : response.json();
  }

  window.ZhuravliAPI = {
    search(query, page = 1) {
      return request(`/api/v1/search?q=${encodeURIComponent(query)}&page=${page}`);
    },
    whoami() {
      return request('/api/v1/whoami');
    },
    login(payload) {
      return request('/api/v1/login', {method: 'POST', body: JSON.stringify(payload)});
    },
    portalHome() {
      return request('/api/portal/home/');
    },
    createAgentJob(payload) {
      return request('/api/portal/agent/jobs/', {method: 'POST', body: JSON.stringify(payload)});
    },
    agentJob(id) {
      return request(`/api/portal/agent/jobs/${encodeURIComponent(id)}/`);
    }
  };
})();
