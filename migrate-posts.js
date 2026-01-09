import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const hexoBlogDir = path.join(__dirname, '..', 'blog', 'source', '_posts');
const astroBlogDir = path.join(__dirname, 'src', 'content', 'blog');

// Create the Astro blog directory if it doesn't exist
if (!fs.existsSync(astroBlogDir)) {
  fs.mkdirSync(astroBlogDir, { recursive: true });
}

// Read all markdown files from Hexo blog
const files = fs.readdirSync(hexoBlogDir).filter(file => file.endsWith('.md'));

console.log(`Found ${files.length} posts to migrate`);

files.forEach(file => {
  const hexoFilePath = path.join(hexoBlogDir, file);
  const astroFilePath = path.join(astroBlogDir, file);

  // Read the file content
  let content = fs.readFileSync(hexoFilePath, 'utf8');

  // Convert frontmatter from Hexo format to Astro format
  // Hexo uses 'date', Astro blog template uses 'pubDate'
  content = content.replace(/^date:\s*(.+)$/m, 'pubDate: $1');

  // Add description field if missing (use first paragraph or title)
  if (!content.includes('description:')) {
    const titleMatch = content.match(/^title:\s*['"']?(.+?)['"']?$/m);
    if (titleMatch) {
      const title = titleMatch[1];
      content = content.replace(/^(---[\s\S]*?)^(---)/m, `$1description: "${title}"\n$2`);
    }
  }

  // Write to Astro blog directory
  fs.writeFileSync(astroFilePath, content);
  console.log(`Migrated: ${file}`);
});

console.log('\nMigration complete!');
console.log(`All ${files.length} posts have been copied to ${astroBlogDir}`);
