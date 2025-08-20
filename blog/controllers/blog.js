const blogRouter = require('express').Router()
const Blog = require('../models/blog')
const User = require('../models/user')

blogRouter.get("/", async (req, res) => {
	const blogs = await Blog.find({}).populate('user', 'username name')
	res.json(blogs)
})

blogRouter.post('/', async (req, res) => {
	const blog = new Blog(req.body)

	const user = await User.findById(req.body.userId)

	if (!user) {
		return res.status(404).json({ error: 'userId missing or invalid' })
	}

	blog.user = user._id
	const savedBlog = await blog.save()

	user.blogs = user.blogs.concat(savedBlog._id)
	await user.save()

	res.status(201).json(savedBlog)
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