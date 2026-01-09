import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const BLOG_DIR = path.join(__dirname, '../src/content/blog')

async function moveContentToFrontmatter() {
	console.log('🔄 Moving content to frontmatter...\n')

	const files = await fs.readdir(BLOG_DIR)
	const mdFiles = files.filter((f) => f.endsWith('.md'))

	console.log(`Found ${mdFiles.length} markdown files\n`)

	let successCount = 0
	let errorCount = 0

	for (const file of mdFiles) {
		try {
			const filePath = path.join(BLOG_DIR, file)
			const content = await fs.readFile(filePath, 'utf-8')

			// Parse frontmatter and content
			const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
			if (!match) {
				console.log(`⚠️  Skipping ${file} - no valid frontmatter`)
				errorCount++
				continue
			}

			const frontmatterStr = match[1]
			const bodyContent = match[2].trim()

			// Escape the content for YAML (use literal style with |)
			const escapedContent = bodyContent

			// Build new file with content in frontmatter
			const newContent = `---\n${frontmatterStr}\ncontent: |\n${escapedContent.split('\n').map(line => '  ' + line).join('\n')}\n---\n`

			await fs.writeFile(filePath, newContent, 'utf-8')

			console.log(`✅ Converted: ${file}`)
			successCount++
		} catch (error) {
			console.error(`❌ Error converting ${file}:`, error.message)
			errorCount++
		}
	}

	console.log(`\n🎉 Conversion complete!`)
	console.log(`   ✅ Success: ${successCount}`)
	console.log(`   ❌ Errors: ${errorCount}`)
}

moveContentToFrontmatter().catch(console.error)
