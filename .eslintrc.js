module.exports = {
  extends: ['expo'],
  ignorePatterns: ['/dist/*', 'supabase/functions/**'],
  rules: {
    'react-hooks/exhaustive-deps': 'warn',
  },
  overrides: [
    {
      // Service worker runs in its own global scope — `self`, `caches`,
      // `Response` and friends are not the browser window globals.
      files: ['public/sw.js'],
      env: { serviceworker: true, browser: true },
    },
    {
      // Metro/Babel config are Node CommonJS, not RN.
      files: ['metro.config.js', 'babel.config.js', 'tailwind.config.js', '.eslintrc.js'],
      env: { node: true },
    },
  ],
};
