/**
 * Script to fix PMS API route imports and Next.js 15 params
 * Runs on all PMS route files to:
 * 1. Fix auth imports from '@/lib/pms' to '@/lib/pms/auth'
 * 2. Fix params from { params: { slug } } to Promise<{ slug }>
 */

const fs = require('fs');
const path = require('path');

const files = [
  'src/app/api/pms/[slug]/auth/logout/route.ts',
  'src/app/api/pms/[slug]/auth/session/route.ts',
  'src/app/api/pms/[slug]/users/route.ts',
  'src/app/api/pms/[slug]/users/[id]/route.ts',
  'src/app/api/pms/[slug]/folios/route.ts',
  'src/app/api/pms/[slug]/folios/[id]/route.ts',
  'src/app/api/pms/[slug]/folios/[id]/checkout/route.ts',
  'src/app/api/pms/[slug]/payments/split/route.ts',
  'src/app/api/pms/[slug]/payments/split/[id]/route.ts',
  'src/app/api/pms/instances/route.ts',
  'src/app/api/pms/instances/[slug]/route.ts',
];

// Auth functions that should be imported from '@/lib/pms/auth'
const authFunctions = [
  'requireStaffSession',
  'getStaffSession',
  'verifyPassword',
  'hashPassword',
  'createStaffToken',
  'setStaffSessionCookie',
  'clearStaffSessionCookie',
  'hasPermission',
  'requirePermission',
  'validateUsername',
  'validatePassword',
  'verifyPMSOwner',
  'isManager',
  'requireManager',
];

files.forEach(filePath => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Extract imports from '@/lib/pms'
    const importRegex = /import\s+{([^}]+)}\s+from\s+['"]@\/lib\/pms['"]/g;
    const matches = [...content.matchAll(importRegex)];

    if (matches.length > 0) {
      matches.forEach(match => {
        const imports = match[1].split(',').map(i => i.trim());
        const authImports = [];
        const regularImports = [];

        imports.forEach(imp => {
          const cleanImp = imp.replace(/^(type\s+)?/, '');
          const isTypeImport = imp.startsWith('type ');
          const importName = cleanImp.split(/\s+as\s+/)[0].trim();

          if (authFunctions.includes(importName)) {
            authImports.push(imp);
          } else {
            regularImports.push(imp);
          }
        });

        // Build new import statements
        let newImports = '';
        if (regularImports.length > 0) {
          newImports += `import {\n  ${regularImports.join(',\n  ')}\n} from '@/lib/pms';\n`;
        }
        if (authImports.length > 0) {
          newImports += `import {\n  ${authImports.join(',\n  ')}\n} from '@/lib/pms/auth';`;
        }

        content = content.replace(match[0], newImports.trim());
        modified = true;
      });
    }

    // Fix params for routes with [slug] or [id]
    if (filePath.includes('[slug]') || filePath.includes('[id]')) {
      // Fix function signatures with params
      const paramPattern = /{\s*params\s*}:\s*{\s*params:\s*{\s*([^}]+)\s*}\s*}/g;
      if (paramPattern.test(content)) {
        content = content.replace(
          paramPattern,
          '{ params }: { params: Promise<{ $1 }> }'
        );
        modified = true;
      }

      // Fix param access (params.slug -> await params then const { slug })
      const directAccessPattern = /(const|let)\s+(\w+)\s*=\s*params\.(\w+)/g;
      if (directAccessPattern.test(content)) {
        // Need to check if params is already awaited
        if (!/const\s+{\s*\w+\s*}\s*=\s*await\s+params/.test(content)) {
          // Find and replace the pattern
          content = content.replace(directAccessPattern, (match, varType, varName, paramName) => {
            // Look for the beginning of the function to add await
            return match; // We'll handle this manually for now
          });
        }
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✓ Fixed: ${filePath}`);
    } else {
      console.log(`- Skipped (no changes): ${filePath}`);
    }
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
  }
});

console.log('\nDone! Please manually verify and fix params awaiting in routes.');
