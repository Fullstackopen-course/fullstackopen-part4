const dummy = (blogs) => {
  return 1;
}

const totalLikes = (blogs) => {
	return blogs.reduce(
		(sumLikes, blog) => sumLikes + blog.likes,
		0
	)
};

const favoriteBlog = (blogs) => {
	return blogs.reduce(
		(max, blog) => blog.likes > max.likes ? blog : max,
		blogs[0] || {}
	)
}

const mostBlogs = (blogs) => {
	const counts = {}

	return blogs.reduce(
		(topAuthor, {author}) => {
			const newCount = (counts[author] || 0) + 1
			counts[author] = newCount

			return newCount > topAuthor.blogs ?
				{author: author, blogs: newCount} :
				topAuthor
		},
		{
			author: '',
			blogs: 0
		}
	)
}

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs
}