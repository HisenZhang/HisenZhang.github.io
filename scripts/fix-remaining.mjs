import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const BLOG_DIR = path.join(__dirname, '../src/content/blog')

const remainingFiles = [
	'Connected-to-Telegram.md',
	'Data-Mining.md',
	'Elementary-Programming-Study-Package.md',
	'Reverse-Polish-Notation-Implement.md',
	'lake-side.md',
]

async function fixRemainingFiles() {
	console.log('🔧 Fixing remaining files...\n')

	for (const file of remainingFiles) {
		try {
			const filePath = path.join(BLOG_DIR, file)

			// Check if file exists
			try {
				await fs.access(filePath)
			} catch {
				console.log(`⚠️  File not found: ${file}`)
				continue
			}

			const content = await fs.readFile(filePath, 'utf-8')

			// Remove any leading whitespace or line numbers
			const cleanContent = content.replace(/^[\s\d→]+---/, '---')

			// Parse frontmatter and content
			const frontmatterMatch = cleanContent.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/)

			if (!frontmatterMatch) {
				console.log(`⚠️  Skipping ${file} - could not parse frontmatter`)
				console.log('Content preview:', content.substring(0, 200))
				continue
			}

			const frontmatterStr = frontmatterMatch[1]
			const bodyContent = frontmatterMatch[2]

			// Parse YAML frontmatter
			const frontmatter = {}
			const lines = frontmatterStr.split('\n')

			let currentKey = null
			let currentArray = null

			for (const line of lines) {
				if (line.trim() === '') continue

				// Check for array item
				if (line.match(/^\s+-\s+(.+)$/)) {
					const value = line.match(/^\s+-\s+(.+)$/)[1].trim()
					if (currentArray) {
						currentArray.push(value)
					}
					continue
				}

				// Check for key-value pair
				const match = line.match(/^([^:]+):\s*(.*)$/)
				if (match) {
					const key = match[1].trim()
					let value = match[2].trim()

					// Remove quotes
					value = value.replace(/^['"]|['"]$/g, '')

					// Check if this starts an array
					if (value === '') {
						currentKey = key
						currentArray = []
						frontmatter[key] = currentArray
					} else {
						currentKey = key
						currentArray = null
						frontmatter[key] = value
					}
				}
			}

			// Normalize frontmatter
			const normalized = {}

			normalized.title = frontmatter.title || file.replace('.md', '')

			if (frontmatter.description) {
				normalized.description = frontmatter.description
			}

			// Convert pubDate to ISO format
			if (frontmatter.pubDate) {
				const date = new Date(frontmatter.pubDate)
				if (!isNaN(date.getTime())) {
					normalized.pubDate = date.toISOString()
				} else {
					normalized.pubDate = new Date().toISOString()
				}
			} else {
				normalized.pubDate = new Date().toISOString()
			}

			if (frontmatter.updatedDate) {
				const date = new Date(frontmatter.updatedDate)
				if (!isNaN(date.getTime())) {
					normalized.updatedDate = date.toISOString()
				}
			}

			if (frontmatter.tags) {
				normalized.tags = Array.isArray(frontmatter.tags)
					? frontmatter.tags
					: [frontmatter.tags]
			}

			if (frontmatter.category) {
				normalized.category = Array.isArray(frontmatter.category)
					? frontmatter.category
					: [frontmatter.category]
			}

			if (frontmatter.heroImage) {
				normalized.heroImage = frontmatter.heroImage
			}

			if (frontmatter.coverImageCredit) {
				normalized.coverImageCredit = frontmatter.coverImageCredit
			}

			// Build new frontmatter
			let newFrontmatter = '---\n'
			newFrontmatter += `title: ${JSON.stringify(normalized.title)}\n`

			if (normalized.description) {
				newFrontmatter += `description: ${JSON.stringify(normalized.description)}\n`
			}

			newFrontmatter += `pubDate: ${normalized.pubDate}\n`

			if (normalized.updatedDate) {
				newFrontmatter += `updatedDate: ${normalized.updatedDate}\n`
			}

			if (normalized.tags && normalized.tags.length > 0) {
				newFrontmatter += 'tags:\n'
				normalized.tags.forEach((tag) => {
					newFrontmatter += `  - ${JSON.stringify(tag)}\n`
				})
			}

			if (normalized.category && normalized.category.length > 0) {
				newFrontmatter += 'category:\n'
				normalized.category.forEach((cat) => {
					newFrontmatter += `  - ${JSON.stringify(cat)}\n`
				})
			}

			if (normalized.heroImage) {
				newFrontmatter += `heroImage: ${JSON.stringify(normalized.heroImage)}\n`
			}

			if (normalized.coverImageCredit) {
				newFrontmatter += `coverImageCredit: ${JSON.stringify(normalized.coverImageCredit)}\n`
			}

			newFrontmatter += '---\n'

			const newContent = newFrontmatter + bodyContent

			// Write to .mdx file
			const newFilePath = filePath.replace('.md', '.mdx')
			await fs.writeFile(newFilePath, newContent, 'utf-8')

			// Delete old .md file
			await fs.unlink(filePath)

			console.log(`✅ Fixed: ${file} -> ${file.replace('.md', '.mdx')}`)
		} catch (error) {
			console.error(`❌ Error fixing ${file}:`, error.message)
		}
	}

	console.log('\n✨ Done!')
}

fixRemainingFiles().catch(console.error)
