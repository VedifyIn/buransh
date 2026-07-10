export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-case': [2, 'always', 'kebab-case'],
    'subject-case': [0],
    'subject-full-stop': [2, 'never', '.'],
  },
};
