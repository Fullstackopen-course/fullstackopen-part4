const blogRouter = require('express').Router()
const Blog = require('../models/blog')

blogRouter.get("/", async (req, res) => {
	const blogs = await Blog.find({})
	res.json(blogs)
})

blogRouter.post('/', async (req, res) => {
	const blog = new Blog(req.body)

	const result = await blog.save()

	res.status(201).json(result)
})

blogRouter.delete('/:id', async (req, res) => {
	const result = await Blog.findByIdAndDelete(req.params.id)
	res.status(204).end()
})

blogRouter.put('/:id', async (req, res) => {
	const blog = req.body

	const result = await Blog.findByIdAndUpdate(
		req.params.id,
		blog,
		{
			new: true,
			runValidators: true
		}
	)
	res.json(result)
})

module.exports = blogRouter