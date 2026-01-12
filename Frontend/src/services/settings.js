// Settings persistence service using backend API with localStorage fallback
import api from './api';

const STORAGE_KEY = 'app_settings_v1';

// Load settings from backend API
export async function loadSettings() {
  try {
    const response = await api.get('/settings');
    if (response.data.success) {
      const settings = response.data.data;
      // Also save to localStorage as backup
      saveToLocalStorage(settings);
      return settings;
    }
  } catch (error) {
    console.warn('Failed to load settings from API, trying localStorage:', error);
    // Fallback to localStorage
    return loadFromLocalStorage();
  }
}

// Save settings to backend API
export async function saveSettings(allSettings) {
  try {
    const response = await api.put('/settings', allSettings);
    if (response.data.success) {
      // Also save to localStorage as backup
      saveToLocalStorage(response.data.data);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to save settings to API, saving to localStorage:', error);
    // Fallback to localStorage
    return saveToLocalStorage(allSettings);
  }
}

// Reset settings to default
export async function resetSettings() {
  try {
    const response = await api.post('/settings/reset');
    if (response.data.success) {
      // Also save to localStorage as backup
      saveToLocalStorage(response.data.data);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to reset settings:', error);
    return false;
  }
}

// LocalStorage fallback functions
function loadFromLocalStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Failed to parse saved settings from localStorage:', error);
    return null;
  }
}

function saveToLocalStorage(settings) {
  try {
    const serialized = JSON.stringify(settings);
    localStorage.setItem(STORAGE_KEY, serialized);
    return true;
  } catch (error) {
    console.error('Failed to save settings to localStorage:', error);
    return false;
  }
}

export function clearSettings() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    // no-op
  }
}


