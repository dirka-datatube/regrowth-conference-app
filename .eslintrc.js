module.exports = {
  extends: ['expo'],
  ignorePatterns: ['/dist/*', 'supabase/functions/**'],
  rules: {
    'react-hooks/exhaustive-deps': 'warn',
  },
};
