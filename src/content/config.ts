import { defineCollection, z } from 'astro:content'

const blog = defineCollection({
	// Type-check frontmatter using a schema
	schema: z.object({
		title: z.string(),
		description: z.string().optional(),
		pubDate: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),
		coverImageCredit: z.string().optional(),
		heroImage: z.string().optional(),
		tags: z.array(z.string()).optional(),
		category: z.string().optional(),
	}),
})

export const collections = { blog }
