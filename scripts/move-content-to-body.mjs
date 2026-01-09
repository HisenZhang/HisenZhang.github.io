import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import yaml from 'js-yaml'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const BLOG_DIR = path.join(__dirname, '../src/content/blog')

async function moveContentToBody() {
	console.log('🔄 Moving content back to body...\n')

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
			const match = content.match(/^---\n([\s\S]*?)\n---\n?(.*)$/s)
			if (!match) {
				console.log(`⚠️  Skipping ${file} - no valid frontmatter`)
				errorCount++
				continue
			}

			const frontmatterStr = match[1]

			// Parse YAML frontmatter
			const frontmatter = yaml.load(frontmatterStr)

			// Extract content from frontmatter
			const bodyContent = frontmatter.content || ''
			delete frontmatter.content

			// Rebuild file
			const newFrontmatter = yaml.dump(frontmatter, { lineWidth: -1, quotingType: '"' })
			const newContent = `---\n${newFrontmatter}---\n\n${bodyContent}\n`

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

moveContentToBody().catch(console.error)
