import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const BLOG_DIR = path.join(__dirname, '../src/content/blog')

async function migratePosts() {
	console.log('🚀 Starting migration to Keystatic format...\n')

	const files = await fs.readdir(BLOG_DIR)
	const mdFiles = files.filter((f) => f.endsWith('.md'))

	console.log(`Found ${mdFiles.length} markdown files to migrate\n`)

	let successCount = 0
	let errorCount = 0

	for (const file of mdFiles) {
		try {
			const filePath = path.join(BLOG_DIR, file)
			const content = await fs.readFile(filePath, 'utf-8')

			// Parse frontmatter and content
			const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)

			if (!frontmatterMatch) {
				console.log(`⚠️  Skipping ${file} - no frontmatter found`)
				continue
			}

			const frontmatterStr = frontmatterMatch[1]
			const bodyContent = frontmatterMatch[2]

			// Parse YAML frontmatter manually
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

			// Normalize frontmatter for Keystatic
			const normalized = {}

			// Title (required)
			normalized.title = frontmatter.title || file.replace('.md', '')

			// Description
			if (frontmatter.description) {
				normalized.description = frontmatter.description
			}

			// Convert pubDate to ISO format
			if (frontmatter.pubDate) {
				const date = new Date(frontmatter.pubDate)
				if (!isNaN(date.getTime())) {
					normalized.pubDate = date.toISOString()
				} else {
					console.log(`⚠️  Invalid date in ${file}, using current date`)
					normalized.pubDate = new Date().toISOString()
				}
			} else {
				normalized.pubDate = new Date().toISOString()
			}

			// Convert updatedDate if exists
			if (frontmatter.updatedDate) {
				const date = new Date(frontmatter.updatedDate)
				if (!isNaN(date.getTime())) {
					normalized.updatedDate = date.toISOString()
				}
			}

			// Tags - ensure it's an array
			if (frontmatter.tags) {
				normalized.tags = Array.isArray(frontmatter.tags)
					? frontmatter.tags
					: [frontmatter.tags]
			}

			// Category - ensure it's an array
			if (frontmatter.category) {
				normalized.category = Array.isArray(frontmatter.category)
					? frontmatter.category
					: [frontmatter.category]
			}

			// Hero image
			if (frontmatter.heroImage) {
				normalized.heroImage = frontmatter.heroImage
			}

			// Cover image credit
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

			// Create new content
			const newContent = newFrontmatter + bodyContent

			// Write to .mdx file
			const newFilePath = filePath.replace('.md', '.mdx')
			await fs.writeFile(newFilePath, newContent, 'utf-8')

			// Delete old .md file
			await fs.unlink(filePath)

			console.log(`✅ Migrated: ${file} -> ${file.replace('.md', '.mdx')}`)
			successCount++
		} catch (error) {
			console.error(`❌ Error migrating ${file}:`, error.message)
			errorCount++
		}
	}

	console.log(`\n🎉 Migration complete!`)
	console.log(`   ✅ Success: ${successCount}`)
	console.log(`   ❌ Errors: ${errorCount}`)
}

migratePosts().catch(console.error)
