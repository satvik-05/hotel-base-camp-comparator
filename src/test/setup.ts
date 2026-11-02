import '@testing-library/jest-dom/vitest';

// Theme preference lives in localStorage and on <html>; isolate every test from the previous one.
afterEach(() => {
  window.localStorage.clear();
  delete document.documentElement.dataset.theme;
});
