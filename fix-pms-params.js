/**
 * Script to fix Next.js 15 params awaiting in PMS API routes
 * Changes params.slug -> const { slug } = await params
 */

const fs = require('fs');

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
  'src/app/api/pms/instances/[slug]/route.ts',
];

files.forEach(filePath => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Fix function parameter from { params: { slug } } to { params: Promise<{ slug }> }
    content = content.replace(
      /\{\s*params\s*\}:\s*\{\s*params:\s*\{\s*slug:\s*string\s*\}\s*\}/g,
      '{ params }: { params: Promise<{ slug: string }> }'
    );

    content = content.replace(
      /\{\s*params\s*\}:\s*\{\s*params:\s*\{\s*slug:\s*string,\s*id:\s*string\s*\}\s*\}/g,
      '{ params }: { params: Promise<{ slug: string, id: string }> }'
    );

    content = content.replace(
      /\{\s*params\s*\}:\s*\{\s*params:\s*\{\s*id:\s*string\s*\}\s*\}/g,
      '{ params }: { params: Promise<{ id: string }> }'
    );

    // Fix params.slug access - find and replace with await pattern
    // Look for: const slug = params.slug;
    const slugAccessPattern = /(\s+)const\s+slug\s*=\s*params\.slug;/g;
    if (slugAccessPattern.test(content)) {
      content = content.replace(slugAccessPattern, '$1const { slug } = await params;');
      modified = true;
    }

    // Look for: const id = params.id;
    const idAccessPattern = /(\s+)const\s+id\s*=\s*params\.id;/g;
    if (idAccessPattern.test(content)) {
      content = content.replace(idAccessPattern, '$1const { id } = await params;');
      modified = true;
    }

    // For routes with both slug and id
    const bothPattern = /(\s+)const\s+slug\s*=\s*params\.slug;\s+const\s+id\s*=\s*params\.id;/g;
    if (bothPattern.test(content)) {
      content = content.replace(bothPattern, '$1const { slug, id } = await params;');
      modified = true;
    }

    if (modified || content !== fs.readFileSync(filePath, 'utf8')) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✓ Fixed params: ${filePath}`);
    } else {
      console.log(`- No param changes: ${filePath}`);
    }
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
  }
});

console.log('\nDone! Params have been updated to Next.js 15 format.');
