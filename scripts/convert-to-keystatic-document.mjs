import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { toMarkdown } from 'mdast-util-to-markdown'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const BLOG_DIR = path.join(__dirname, '../src/content/blog')

// Convert markdown AST to Keystatic document format
function markdownToKeystaticDocument(markdown) {
	// For now, we'll use a simple approach that preserves the markdown
	// Keystatic's document format stores content as a structured format
	// We'll create a basic document with paragraphs

	const lines = markdown.trim().split('\n\n')
	const children = []

	for (const block of lines) {
		if (!block.trim()) continue

		// Handle headings
		if (block.startsWith('#')) {
			const match = block.match(/^(#{1,6})\s+(.+)$/)
			if (match) {
				children.push({
					type: 'heading',
					level: match[1].length,
					children: [{ type: 'text', text: match[2] }]
				})
				continue
			}
		}

		// Handle images
		if (block.match(/^!\[.*?\]\(.*?\)$/)) {
			const match = block.match(/^!\[(.*?)\]\((.*?)\)$/)
			if (match) {
				children.push({
					type: 'image',
					src: match[2],
					alt: match[1] || ''
				})
				continue
			}
		}

		// Everything else as paragraph
		children.push({
			type: 'paragraph',
			children: [{ type: 'text', text: block }]
		})
	}

	return children
}

async function convertPosts() {
	console.log('🔄 Converting posts to Keystatic document format...\n')

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
			const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)

			if (!frontmatterMatch) {
				console.log(`⚠️  Skipping ${file} - no frontmatter`)
				continue
			}

			const frontmatterStr = frontmatterMatch[1]
			const bodyContent = frontmatterMatch[2].trim()

			// Convert markdown body to Keystatic document format
			const documentContent = markdownToKeystaticDocument(bodyContent)

			// Parse frontmatter
			const frontmatter = {}
			const lines = frontmatterStr.split('\n')
			let currentKey = null
			let currentArray = null

			for (const line of lines) {
				if (line.trim() === '') continue

				// Array item
				if (line.match(/^\s+-\s+(.+)$/)) {
					const value = line.match(/^\s+-\s+(.+)$/)[1].trim()
					if (currentArray) {
						currentArray.push(value)
					}
					continue
				}

				// Key-value pair
				const match = line.match(/^([^:]+):\s*(.*)$/)
				if (match) {
					const key = match[1].trim()
					let value = match[2].trim()
					value = value.replace(/^['"]|['"]$/g, '')

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

			// Build new file content
			const newFrontmatter = {
				title: frontmatter.title || file.replace('.md', ''),
				description: frontmatter.description || '',
				pubDate: frontmatter.pubDate || new Date().toISOString(),
				updatedDate: frontmatter.updatedDate || '',
				tags: frontmatter.tags || [],
				category: frontmatter.category || '',
				heroImage: frontmatter.heroImage || '',
				coverImageCredit: frontmatter.coverImageCredit || '',
			}

			// Create YAML frontmatter
			let yamlFrontmatter = '---\n'
			yamlFrontmatter += `title: ${JSON.stringify(newFrontmatter.title)}\n`
			if (newFrontmatter.description) {
				yamlFrontmatter += `description: ${JSON.stringify(newFrontmatter.description)}\n`
			}
			yamlFrontmatter += `pubDate: ${newFrontmatter.pubDate}\n`
			if (newFrontmatter.updatedDate) {
				yamlFrontmatter += `updatedDate: ${newFrontmatter.updatedDate}\n`
			}
			if (Array.isArray(newFrontmatter.tags) && newFrontmatter.tags.length > 0) {
				yamlFrontmatter += 'tags:\n'
				newFrontmatter.tags.forEach((tag) => {
					yamlFrontmatter += `  - ${JSON.stringify(tag)}\n`
				})
			}
			if (newFrontmatter.category) {
				yamlFrontmatter += `category: ${JSON.stringify(newFrontmatter.category)}\n`
			}
			if (newFrontmatter.heroImage) {
				yamlFrontmatter += `heroImage: ${JSON.stringify(newFrontmatter.heroImage)}\n`
			}
			if (newFrontmatter.coverImageCredit) {
				yamlFrontmatter += `coverImageCredit: ${JSON.stringify(newFrontmatter.coverImageCredit)}\n`
			}
			yamlFrontmatter += '---\n'

			// For Keystatic document format, we keep the markdown as-is
			// Keystatic will convert it when you first edit it
			const newContent = yamlFrontmatter + bodyContent

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
	console.log(`\n⚠️  NOTE: Keystatic will convert the markdown to its document format`)
	console.log(`   when you first edit each post in the admin panel.`)
}

convertPosts().catch(console.error)
