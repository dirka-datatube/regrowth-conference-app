module.exports = {
  extends: ['expo'],
  ignorePatterns: ['/dist/*', 'supabase/functions/**', 'admin/**'],
  rules: {
    'react-hooks/exhaustive-deps': 'warn',
  },
  overrides: [
    {
      files: ['*.config.js', '.eslintrc.js', 'babel.config.js', 'metro.config.js'],
      env: { node: true },
    },
  ],
};
