import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import partytown from '@astrojs/partytown'
import icon from 'astro-icon'
import rehypeFigureTitle from 'rehype-figure-title'
import { rehypeAccessibleEmojis } from 'rehype-accessible-emojis'
import { remarkReadingTime } from './src/plugins/remark-reading-time.mjs'
import { remarkModifiedTime } from './src/plugins/remark-modified-time.mjs'
import react from '@astrojs/react'
import keystatic from '@keystatic/astro'
import cloudflare from '@astrojs/cloudflare'
import markdoc from '@astrojs/markdoc'

// https://astro.build/config
export default defineConfig({
	site: 'https://hisenz.com',
	output: 'server',
	adapter: cloudflare(),
	integrations: [
		react(),
		keystatic(),
		markdoc(),
		mdx(),
		sitemap(),
		icon(),
		partytown({
			config: {
				forward: ['dataLayer.push'],
			},
		}),
	],
	vite: {
		plugins: [tailwindcss()],
		resolve: {
			alias: process.env.NODE_ENV === 'production' && {
				'react-dom/server': 'react-dom/server.edge',
			},
		},
	},
	markdown: {
		remarkPlugins: [remarkReadingTime, remarkModifiedTime],
		rehypePlugins: [rehypeFigureTitle, rehypeAccessibleEmojis],
	},
})
