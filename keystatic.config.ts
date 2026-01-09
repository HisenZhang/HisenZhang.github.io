import { config, fields, collection } from '@keystatic/core'

export default config({
	storage: {
		kind: 'local',
	},
	collections: {
		blog: collection({
			label: 'Blog Posts',
			path: 'src/content/blog/*',
			slugField: 'title',
			format: { data: { extension: 'md' } },
			columns: ['title', 'pubDate'],
			schema: {
				title: fields.slug({ name: { label: 'Title' } }),
				description: fields.text({
					label: 'Description',
					multiline: true,
				}),
				pubDate: fields.text({
					label: 'Publish Date',
					validation: { isRequired: true },
				}),
				updatedDate: fields.text({
					label: 'Updated Date',
				}),
				tags: fields.array(
					fields.text({ label: 'Tag' }),
					{
						label: 'Tags',
						itemLabel: (props) => props.value,
					}
				),
				category: fields.text({
					label: 'Category',
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
