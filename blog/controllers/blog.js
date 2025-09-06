const blogRouter = require('express').Router()
const middleware = require('../utils/middleware')
const Blog = require('../models/blog')

blogRouter.get("/", async (req, res) => {
	const blogs = await Blog.find({}).populate('user', 'username name')
	res.json(blogs)
})

blogRouter.post('/',  middleware.userExtractor, async (req, res) => {
	const blog = new Blog(req.body)
	blog.user = req.user._id
	const savedBlog = await blog.save()

	req.user.blogs = req.user.blogs.concat(savedBlog._id)
	await req.user.save()

	res.status(201).json(await savedBlog.populate('user', 'username name'))
})

blogRouter.delete('/:id', middleware.userExtractor, async (req, res) => {
	const blog = await Blog.findById(req.params.id)
	if (blog.user.toString() !== req.user._id.toString())
		res
			.status(401)
			.json({error: 'unauthorized operation'})
	else {
		await Blog.deleteOne(blog)
		res.status(204).end()
	}
})

blogRouter.put('/:id', middleware.userExtractor, async (req, res) => {
	const blog = req.body
	blog.user = req.user._id

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