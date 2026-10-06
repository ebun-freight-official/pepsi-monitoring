const PREFIX = 'pepsi:'

export const storage = {
  get (key, fallback) {
    try {
      const raw = localStorage.getItem(PREFIX + key)
      return raw ? JSON.parse(raw) : fallback
    } catch {
      return fallback
    }
  },

  set (key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value))
    } catch (err) {
      console.error('storage.set failed:', err)
    }
  },

  remove (key) {
    localStorage.removeItem(PREFIX + key)
  },

  clearAll () {
    Object.keys(localStorage)
      .filter(k => k.startsWith(PREFIX))
      .forEach(k => localStorage.removeItem(k))
  }
}
