#!/usr/bin/env node

/**
 * Text Rendering Validation Script
 * 
 * Scans the codebase for potential "text strings must be rendered within a <Text> component" issues
 */

const fs = require('fs');
const path = require('path');

// Patterns that could indicate text rendering issues
const WARNING_PATTERNS = [
  // Orphaned comments not in JSX comment format
  {
    pattern: /^\s*\/\/(?!\s*\{\/\*|\s*<|\s*\*|\s*eslint|\s*@|\s*TODO|\s*FIXME|\s*NOTE)/,
    message: 'Potentially orphaned comment - ensure it\'s properly formatted',
    severity: 'warning'
  },
  
  // String literals that might be outside JSX
  {
    pattern: /^\s*['"`][^'"`]*['"`]\s*$/,
    message: 'Standalone string literal - ensure it\'s wrapped in <Text>',
    severity: 'error'
  },
  
  // Direct variable rendering without Text wrapper
  {
    pattern: /\{\s*[a-zA-Z_$][a-zA-Z0-9_$]*\s*\}/,
    message: 'Direct variable rendering - consider using SafeText utilities',
    severity: 'info'
  },
  
  // Conditional text that might not be wrapped
  {
    pattern: /\{\s*\w+\s*&&\s*['"`]/,
    message: 'Conditional text rendering - ensure wrapped in <Text>',
    severity: 'warning'
  }
];

// Safe patterns to ignore
const SAFE_PATTERNS = [
  /import\s+.*from/,
  /export\s+.*{/,
  /\/\*\*?.*\*\//,
  /<Text[^>]*>/,
  /<SafeText[^>]*>/,
  /testID=/,
  /className=/,
  /style=/,
  /onPress=/,
  /useState/,
  /useEffect/,
  /console\./,
];

function shouldIgnoreLine(line) {
  return SAFE_PATTERNS.some(pattern => pattern.test(line));
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const issues = [];
  
  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    
    // Skip empty lines and safe patterns
    if (!trimmedLine || shouldIgnoreLine(trimmedLine)) {
      return;
    }
    
    // Check for warning patterns
    WARNING_PATTERNS.forEach(({ pattern, message, severity }) => {
      if (pattern.test(trimmedLine)) {
        issues.push({
          file: filePath,
          line: index + 1,
          content: trimmedLine,
          message,
          severity
        });
      }
    });
  });
  
  return issues;
}

function scanDirectory(dir, extensions = ['.tsx', '.ts', '.jsx', '.js']) {
  const allIssues = [];
  
  function scanRecursive(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      
      try {
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          // Skip node_modules, .git, and other build directories
          if (!['node_modules', '.git', 'dist', 'build', '.expo', 'ios/Pods'].includes(item)) {
            scanRecursive(fullPath);
          }
        } else if (stat.isFile() && extensions.some(ext => fullPath.endsWith(ext))) {
          const issues = scanFile(fullPath);
          allIssues.push(...issues);
        }
      } catch (error) {
        // Skip files/directories that can't be accessed (broken symlinks, etc.)
        if (error.code !== 'ENOENT') {
          console.warn(`Warning: Could not access ${fullPath}: ${error.message}`);
        }
      }
    }
  }
  
  scanRecursive(dir);
  return allIssues;
}

function main() {
  console.log('🔍 Scanning for potential text rendering issues...\n');
  
  const projectRoot = process.cwd();
  const issues = scanDirectory(projectRoot);
  
  if (issues.length === 0) {
    console.log('✅ No potential text rendering issues found!');
    return;
  }
  
  // Group issues by severity
  const grouped = issues.reduce((acc, issue) => {
    acc[issue.severity] = acc[issue.severity] || [];
    acc[issue.severity].push(issue);
    return acc;
  }, {});
  
  // Report issues
  ['error', 'warning', 'info'].forEach(severity => {
    const severityIssues = grouped[severity] || [];
    if (severityIssues.length === 0) return;
    
    const emoji = severity === 'error' ? '❌' : severity === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${emoji} ${severity.toUpperCase()} (${severityIssues.length} issues):`);
    
    severityIssues.forEach(issue => {
      console.log(`  ${issue.file}:${issue.line}`);
      console.log(`    ${issue.message}`);
      console.log(`    ${issue.content}`);
      console.log();
    });
  });
  
  console.log(`📊 Total issues found: ${issues.length}`);
  console.log('\n💡 See docs/text-rendering-guidelines.md for fixes');
}

if (require.main === module) {
  main();
}

module.exports = { scanFile, scanDirectory }; 