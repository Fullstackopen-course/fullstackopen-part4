const { test, after, beforeEach, describe } = require('node:test')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const assert = require('node:assert')
const Blog = require('../models/blog')
const { initialBlogs, blogsInDb } = require('./utils/test_helper')

const api = supertest(app)

describe('get blogs', () => {
	beforeEach(async () => {
		await Blog.deleteMany({})

		const BlogObjects = initialBlogs.map((blog) => new Blog(blog))
		const promiseArray = BlogObjects.map((blog) => blog.save())
		await Promise.all(promiseArray)
	})

	test('blogs are returned as json', async () => {
	  await api
		.get('/api/blogs')
		.expect(200)
		.expect('Content-Type', /application\/json/)
	})

	test('amount of blogs is correct', async () => {
		const response = await api.get('/api/blogs')

		assert.strictEqual(response.body.length, initialBlogs.length)
	})

	test('all blogs are uniquely identified by id property', async () => {
		const blogs = await blogsInDb()

		const ids = blogs.map(blog => blog.id)
		assert.strictEqual(ids.length, new Set(ids).size)
	})
})

describe('post blogs', () => {
	test('a valid blog can be added', async () => {
		const newBlog = {
			title: 'New blog',
			author: 'John Doe',
			url: 'https://johndoe.com/',
			likes: 1
		}

		await api
			.post('/api/blogs')
			.send(newBlog)
			.expect(201)
			.expect('Content-Type', /application\/json/)

		const response = await api.get('/api/blogs')

		const titles = response.body.map(b => b.title)

		assert.strictEqual(response.body.length, initialBlogs.length + 1)
		assert(titles.includes(newBlog.title))
	})
})

after(async () => {
  await mongoose.connection.close()
})