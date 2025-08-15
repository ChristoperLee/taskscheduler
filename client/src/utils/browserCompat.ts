// Browser compatibility utilities

export const checkBrowserCompatibility = () => {
  const issues: string[] = [];

  // Check for CSS Grid support
  if (!CSS.supports('display', 'grid')) {
    issues.push('CSS Grid is not supported');
  }

  // Check for Flexbox support
  if (!CSS.supports('display', 'flex')) {
    issues.push('Flexbox is not supported');
  }

  // Check for fetch API
  if (!window.fetch) {
    issues.push('Fetch API is not supported');
  }

  // Check for Promise support
  if (typeof Promise === 'undefined') {
    issues.push('Promises are not supported');
  }

  // Check for localStorage
  try {
    const testKey = '__localStorage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
  } catch (e) {
    issues.push('localStorage is not available');
  }

  return issues;
};

// Detect operating system
export const getOS = (): string => {
  const userAgent = window.navigator.userAgent;
  const platform = window.navigator.platform;
  const macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'];
  const windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'];
  const iosPlatforms = ['iPhone', 'iPad', 'iPod'];

  if (macosPlatforms.indexOf(platform) !== -1) {
    return 'macOS';
  } else if (iosPlatforms.indexOf(platform) !== -1) {
    return 'iOS';
  } else if (windowsPlatforms.indexOf(platform) !== -1) {
    return 'Windows';
  } else if (/Android/.test(userAgent)) {
    return 'Android';
  } else if (/Linux/.test(platform)) {
    return 'Linux';
  }

  return 'Unknown';
};

// Add CSS class based on OS
export const applyOSClass = () => {
  const os = getOS();
  document.documentElement.classList.add(`os-${os.toLowerCase()}`);
};

// Polyfill for line-clamp if needed
export const setupLineClampFallback = () => {
  // Check if -webkit-line-clamp is supported
  const testElement = document.createElement('div');
  testElement.style.cssText = '-webkit-line-clamp: 1';
  
  if (!testElement.style.webkitLineClamp) {
    // Add fallback class
    document.documentElement.classList.add('no-line-clamp');
  }
};

// Initialize all compatibility checks
export const initializeCompatibility = () => {
  applyOSClass();
  setupLineClampFallback();
  
  const issues = checkBrowserCompatibility();
  if (issues.length > 0) {
    console.warn('Browser compatibility issues detected:', issues);
  }
  
  return issues;
};