import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const BLOG_DIR = path.join(__dirname, '../src/content/blog')

async function preparePostsForKeystatic() {
	console.log('🔄 Preparing posts for Keystatic...\n')

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

			// Parse frontmatter
			const frontmatter = {}
			const lines = frontmatterStr.split('\n')
			let currentKey = null
			let currentArray = null

			for (const line of lines) {
				if (line.trim() === '') continue

				// Array item
				if (line.match(/^\s+-\s+(.+)$/)) {
					const value = line.match(/^\s+-\s+(.+)$/)[1].trim().replace(/^["']|["']$/g, '')
					if (currentArray) {
						currentArray.push(value)
					}
					continue
				}

				// Key-value pair
				const kvMatch = line.match(/^([^:]+):\s*(.*)$/)
				if (kvMatch) {
					const key = kvMatch[1].trim()
					let value = kvMatch[2].trim()
					value = value.replace(/^["']|["']$/g, '')

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

			// Build normalized frontmatter
			const normalized = {
				title: frontmatter.title || file.replace('.md', ''),
				description: frontmatter.description || '',
				pubDate: frontmatter.pubDate || new Date().toISOString(),
				updatedDate: frontmatter.updatedDate || '',
				tags: Array.isArray(frontmatter.tags) ? frontmatter.tags : [],
				category: frontmatter.category || '',
				heroImage: frontmatter.heroImage || '',
				coverImageCredit: frontmatter.coverImageCredit || '',
			}

			// Remove meta tags and HTML comments that might confuse Keystatic
			let cleanBody = bodyContent
				.replace(/<meta[^>]*>/gi, '')
				.replace(/<!-- more -->/g, '')
				.trim()

			// Build new file content
			let newContent = '---\n'
			newContent += `title: ${JSON.stringify(normalized.title)}\n`
			if (normalized.description) {
				newContent += `description: ${JSON.stringify(normalized.description)}\n`
			}
			newContent += `pubDate: ${normalized.pubDate}\n`
			if (normalized.updatedDate) {
				newContent += `updatedDate: ${normalized.updatedDate}\n`
			}
			if (normalized.tags.length > 0) {
				newContent += 'tags:\n'
				normalized.tags.forEach((tag) => {
					newContent += `  - ${JSON.stringify(tag)}\n`
				})
			}
			if (normalized.category) {
				newContent += `category: ${JSON.stringify(normalized.category)}\n`
			}
			if (normalized.heroImage) {
				newContent += `heroImage: ${JSON.stringify(normalized.heroImage)}\n`
			}
			if (normalized.coverImageCredit) {
				newContent += `coverImageCredit: ${JSON.stringify(normalized.coverImageCredit)}\n`
			}
			newContent += '---\n\n'
			newContent += cleanBody

			await fs.writeFile(filePath, newContent, 'utf-8')

			console.log(`✅ Prepared: ${file}`)
			successCount++
		} catch (error) {
			console.error(`❌ Error preparing ${file}:`, error.message)
			errorCount++
		}
	}

	console.log(`\n🎉 Preparation complete!`)
	console.log(`   ✅ Success: ${successCount}`)
	console.log(`   ❌ Errors: ${errorCount}`)
}

preparePostsForKeystatic().catch(console.error)
