const blogRouter = require('express').Router()
const jwt = require('jsonwebtoken')
const Blog = require('../models/blog')
const User = require('../models/user')

blogRouter.get("/", async (req, res) => {
	const blogs = await Blog.find({}).populate('user', 'username name')
	res.json(blogs)
})

blogRouter.post('/', async (req, res) => {
	const decodedToken = jwt.verify(req.token, process.env.SECRET)
	if (!decodedToken.id) {
		return res
			.status(401)
			.json({ error: 'token missing or invalid' })
	}

	const user = await User.findById(decodedToken.id)

	if (!user) {
		return res.status(404).json({ error: 'userId missing or invalid' })
	}

	const blog = new Blog(req.body)
	blog.user = user._id
	const savedBlog = await blog.save()

	user.blogs = user.blogs.concat(savedBlog._id)
	await user.save()

	res.status(201).json(savedBlog)
})

blogRouter.delete('/:id', async (req, res) => {
	const decodedToken = jwt.verify(req.token, process.env.SECRET)
	if (!decodedToken.id) {
		return res
			.status(401)
			.json({ error: 'token missing or invalid' })
	}

	const user = await User.findById(decodedToken.id)

	if (!user) {
		return res.status(404).json({ error: 'userId missing or invalid' })
	}

	const blog = await Blog.findById(req.params.id)
	if (blog.user.toString() !== user.id)
		res
			.status(401)
			.json({error: 'unauthorized operation'})
	else {
		await Blog.deleteOne(blog)
		res.status(204).end()
	}
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