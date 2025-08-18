const { test, after, beforeEach, describe } = require('node:test')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const assert = require('node:assert')
const Blog = require('../models/blog')
const { initialBlogs } = require('./utils/test_helper')

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

	after(async () => {
	  await mongoose.connection.close()
	})
})
