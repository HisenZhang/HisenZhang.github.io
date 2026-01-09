import { config, fields, collection } from '@keystatic/core'

export default config({
	storage: import.meta.env.DEV
		? { kind: 'local' }
		: {
				kind: 'github',
				repo: {
					owner: 'HisenZhang',
					name: 'HisenZhang.github.io',
				},
				// GitHub App credentials
				// These will be automatically picked up from environment variables:
				// KEYSTATIC_GITHUB_CLIENT_ID
				// KEYSTATIC_GITHUB_CLIENT_SECRET
		  },
	collections: {
		blog: collection({
			label: 'Blog Posts',
			path: 'src/content/blog/**',
			slugField: 'title',
			format: { contentField: 'content' },
			columns: ['title', 'pubDate'],
			schema: {
				title: fields.slug({ name: { label: 'Title' } }),
				description: fields.text({
					label: 'Description',
					multiline: true,
				}),
				content: fields.markdoc({
					label: 'Content',
				}),
				pubDate: fields.datetime({
					label: 'Publish Date',
					validation: { isRequired: true },
				}),
				updatedDate: fields.datetime({
					label: 'Updated Date',
				}),
				tags: fields.array(
					fields.text({ label: 'Tag' }),
					{
						label: 'Tags',
						itemLabel: (props) => props.value,
					}
				),
				category: fields.select({
					label: 'Category',
					options: [
						{ label: 'Spark', value: 'Spark' },
						{ label: 'Music', value: 'Music' },
						{ label: 'Technology', value: 'Technology' },
						{ label: 'Lecture', value: 'Lecture' },
						{ label: 'Food', value: 'Food' },
					],
					defaultValue: 'Spark',
				}),
				heroImage: fields.text({
					label: 'Hero Image',
				}),
				coverImageCredit: fields.text({
					label: 'Cover Image Credit',
				}),
			},
		}),
	},
})
