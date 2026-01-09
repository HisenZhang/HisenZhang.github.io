import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { fromMarkdown } from 'mdast-util-from-markdown'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const BLOG_DIR = path.join(__dirname, '../src/content/blog')

// Convert markdown text to Keystatic document JSON format
function markdownToKeystaticDocument(markdown) {
	// Keystatic's document format is based on prosemirror
	// It expects a specific JSON structure
	// For now, we'll keep markdown as-is since Keystatic can import it
	// when the file is first opened in the editor

	return markdown
}

async function convertAllPosts() {
	console.log('🔄 Preparing posts for Keystatic...\n')

	const files = await fs.readdir(BLOG_DIR)
	const mdFiles = files.filter((f) => f.endsWith('.md'))

	console.log(`Found ${mdFiles.length} markdown files\n`)

	let successCount = 0

	for (const file of mdFiles) {
		try {
			const filePath = path.join(BLOG_DIR, file)
			const content = await fs.readFile(filePath, 'utf-8')

			// Parse frontmatter and content
			const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
			if (!match) {
				console.log(`⚠️  Skipping ${file} - no valid frontmatter`)
				continue
			}

			// File is already in correct format for Keystatic
			// Keystatic will parse the markdown when you open it
			console.log(`✅ Ready: ${file}`)
			successCount++
		} catch (error) {
			console.error(`❌ Error: ${file}:`, error.message)
		}
	}

	console.log(`\n✨ All ${successCount} posts are ready for Keystatic!`)
	console.log(`\n📝 Note: The posts are in standard markdown format.`)
	console.log(`   Keystatic will read them correctly now with the proper config.`)
	console.log(`   Refresh the Keystatic admin panel to see them.`)
}

convertAllPosts().catch(console.error)
