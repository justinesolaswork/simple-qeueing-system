const PREFIX = "sqs:";
const GLOBAL_PREFIX = "sqs:global:";

const api = {
  async get(key, isGlobal = false) {
    const fullKey = (isGlobal ? GLOBAL_PREFIX : PREFIX) + key;
    const value = localStorage.getItem(fullKey);
    if (value === null) return null;
    return { key, value };
  },

  async set(key, value, isGlobal = false) {
    const fullKey = (isGlobal ? GLOBAL_PREFIX : PREFIX) + key;
    localStorage.setItem(fullKey, value);
    return null;
  },

  async remove(key, isGlobal = false) {
    const fullKey = (isGlobal ? GLOBAL_PREFIX : PREFIX) + key;
    localStorage.removeItem(fullKey);
    return null;
  },
};

if (typeof window !== "undefined") {
  window.storage = api;
}

export default api;
