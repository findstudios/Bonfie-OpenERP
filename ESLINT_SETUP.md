# ESLint Configuration for Vue 3 + TypeScript Project

This project is now configured with ESLint v9 using the modern flat config format for code quality and consistency.

## 🚀 Features

- **Vue 3 Support**: Comprehensive rules for Vue 3 Composition API
- **TypeScript Integration**: Full TypeScript linting with proper type checking
- **Tailwind CSS**: Class ordering and validation rules
- **Code Quality**: Consistent formatting and best practices
- **Test Support**: Special configuration for Vitest test files

## 📦 Installed Packages

```json
{
  "eslint": "^9.34.0",
  "@eslint/js": "^9.34.0",
  "@typescript-eslint/eslint-plugin": "^8.41.0",
  "@typescript-eslint/parser": "^8.41.0",
  "eslint-plugin-vue": "^10.4.0",
  "eslint-plugin-tailwindcss": "^3.18.2",
  "vue-eslint-parser": "^10.2.0"
}
```

## 🛠 Available Scripts

### Basic Linting
```bash
# Lint all files
npm run lint

# Lint specific files
npm run lint -- src/components/**/*.vue

# Get help
npm run lint -- --help
```

### Auto-Fix Issues
```bash
# Fix all auto-fixable issues
npm run lint:fix

# Fix specific files
npm run lint:fix -- src/App.vue
```

### Strict Mode (CI/CD)
```bash
# Fail if any warnings exist (good for CI/CD)
npm run lint:check
```

## 📁 Configuration Files

- **`eslint.config.js`**: Main ESLint configuration (ESLint v9 flat config)
- **`package.json`**: Contains lint scripts

## 🔧 Configuration Overview

### File-Specific Rules

1. **`.vue` files**: Vue 3 + TypeScript + Tailwind CSS rules
2. **`.ts/.tsx` files**: TypeScript-only rules
3. **Test files** (`*.test.ts`, `*.spec.ts`): Relaxed rules for testing
4. **Config files** (`*.config.js`): Node.js environment rules
5. **Script files** (`*.mjs`, scripts/): Node.js script rules

### Key Rule Categories

#### Vue 3 Rules
- Component naming and structure
- Template syntax validation
- Composition API best practices
- Script setup support

#### TypeScript Rules
- Unused variable detection (with `_` prefix exemption)
- Type safety warnings
- Import/export consistency

#### Tailwind CSS Rules
- Class name ordering
- Shorthand enforcement (e.g., `h-12 w-12` → `size-12`)
- Migration from Tailwind 2.x
- Custom class name warnings

#### Code Quality Rules
- Consistent formatting (quotes, semicolons, indentation)
- No console.log (except console.warn/error)
- Proper spacing and line endings

### Global Variables

The configuration includes common browser globals:
- `window`, `document`, `console`
- `setTimeout`, `setInterval`, `fetch`
- `localStorage`, `sessionStorage`
- Vue globals: `defineProps`, `defineEmits`, etc.
- Test globals: `describe`, `it`, `expect`, `vi`

## 🚫 Ignored Files

The following files/directories are ignored:
- `dist/`, `node_modules/`, build outputs
- `*.sql` files and database migrations
- Generated type definitions (`*.d.ts`)
- Coverage and cache directories

## 💡 Tips for Developers

### Quick Fixes
Many issues can be auto-fixed:
```bash
npm run lint:fix
```

### VS Code Integration
Install the ESLint extension for real-time linting in your editor.

### Pre-commit Hooks
Consider adding ESLint to your pre-commit hooks:
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run lint:check"
    }
  }
}
```

### Common Issues

1. **Unused imports**: Remove or prefix with underscore `_unusedImport`
2. **Console statements**: Use `console.warn()` or `console.error()` instead of `console.log()`
3. **Tailwind classes**: Use shorthand classes where available
4. **Missing newlines**: Files should end with a newline

### Custom Rules
To modify rules, edit `eslint.config.js`:

```javascript
// Example: Turn off a specific rule
rules: {
  'vue/multi-word-component-names': 'off',
  '@typescript-eslint/no-explicit-any': 'warn'
}
```

## 🔄 Upgrading from Legacy ESLint

This project uses ESLint v9's flat config format. Key differences:
- Single `eslint.config.js` file instead of multiple config files
- No `.eslintrc.js` or `.eslintignore` files
- `ignores` property replaces `.eslintignore`
- Simplified plugin configuration

## 📝 Current Status

ESLint is now successfully configured and working. The codebase has existing linting issues that can be addressed incrementally:
- ~2,200 total issues found
- ~1,000+ auto-fixable issues
- Most are formatting and unused variables

Run `npm run lint:fix` to automatically resolve many issues, then address remaining ones manually for best code quality.