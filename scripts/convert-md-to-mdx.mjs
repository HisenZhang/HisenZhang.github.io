import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const BLOG_DIR = path.join(__dirname, '../src/content/blog')

async function convertMdToMdx() {
	console.log('🔄 Converting .md files to .mdx...\n')

	const files = await fs.readdir(BLOG_DIR)
	const mdFiles = files.filter((f) => f.endsWith('.md'))

	console.log(`Found ${mdFiles.length} markdown files\n`)

	let successCount = 0

	for (const file of mdFiles) {
		try {
			const oldPath = path.join(BLOG_DIR, file)
			const newPath = path.join(BLOG_DIR, file.replace('.md', '.mdx'))

			await fs.rename(oldPath, newPath)

			console.log(`✅ Converted: ${file} → ${file.replace('.md', '.mdx')}`)
			successCount++
		} catch (error) {
			console.error(`❌ Error converting ${file}:`, error.message)
		}
	}

	console.log(`\n🎉 Conversion complete!`)
	console.log(`   ✅ Converted: ${successCount} files`)
}

convertMdToMdx().catch(console.error)
