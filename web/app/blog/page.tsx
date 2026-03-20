import { Metadata } from 'next'
import Link from 'next/link'
import { getAllBlogPosts, getBlogCategories } from '../../lib/blog'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import NewsletterSignup from '../components/NewsletterSignup'

export const metadata: Metadata = {
  title: 'PDF Tools Blog - Expert Tips & Tutorials',
  description:
    'Learn everything about PDFs: merging, splitting, compression, OCR, and document management. Expert tutorials and tips for maximizing PDF productivity.',
  openGraph: {
    title: 'PDF Tools Blog - Expert Tips & Tutorials | 4uPDF',
    description:
      'Expert guides on PDF management, conversion, and optimization. Learn how to work with PDFs more efficiently.',
  },
}

export default function BlogPage() {
  const posts = getAllBlogPosts()
  const categories = getBlogCategories()
  const featuredPosts = posts.filter(p => p.tags.includes('featured')).slice(0, 3)
  const recentPosts = posts.slice(0, 9)
  const allTags = Array.from(new Set(posts.flatMap(p => p.tags)))

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        <div className="bg-gradient-to-br from-blue-900 via-purple-900 to-gray-900 text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-5xl font-bold mb-6">PDF Tools Blog</h1>
            <p className="text-xl text-gray-300 max-w-3xl">
              Expert guides, tutorials, and tips for working with PDFs. Learn how to merge, split, compress,
              and manage your documents like a pro.
            </p>
          </div>
        </div>

        {featuredPosts.length > 0 && (
          <section className="py-16 bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold text-white mb-8">Featured Articles</h2>
              <div className="grid md:grid-cols-3 gap-8">
                {featuredPosts.map((post) => (
                  <Link
                    key={post.slug}
                    href={`/blog/${post.slug}`}
                    className="group bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-blue-500 transition-all"
                  >
                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full">
                          {post.category}
                        </span>
                        <span className="text-gray-400 text-sm">{post.readTime}</span>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-gray-400 mb-4 line-clamp-3">{post.description}</p>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>{post.author}</span>
                        <span>{new Date(post.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="py-16 bg-gray-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="lg:w-3/4">
                <h2 className="text-3xl font-bold text-white mb-8">Recent Articles</h2>
                <div className="space-y-8">
                  {recentPosts.map((post) => (
                    <Link
                      key={post.slug}
                      href={`/blog/${post.slug}`}
                      className="group block bg-gray-900 rounded-lg overflow-hidden border border-gray-800 hover:border-blue-500 transition-all"
                    >
                      <div className="p-8">
                        <div className="flex items-center gap-3 mb-4">
                          <span className="bg-purple-600 text-white text-xs px-3 py-1 rounded-full">
                            {post.category}
                          </span>
                          <span className="text-gray-400 text-sm">{post.readTime}</span>
                          <span className="text-gray-500 text-sm">
                            {new Date(post.date).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">
                          {post.title}
                        </h3>
                        <p className="text-gray-400 mb-4">{post.description}</p>
                        <div className="flex items-center gap-4">
                          <span className="text-gray-500 text-sm">By {post.author}</span>
                          {post.tags.length > 0 && (
                            <div className="flex gap-2">
                              {post.tags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              <aside className="lg:w-1/4">
                <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 sticky top-4">
                  <h3 className="text-xl font-bold text-white mb-4">Categories</h3>
                  <div className="space-y-2">
                    {categories.map((category) => {
                      const count = posts.filter((p) => p.category === category).length
                      return (
                        <Link
                          key={category}
                          href={`/blog?category=${encodeURIComponent(category)}`}
                          className="block text-gray-400 hover:text-blue-400 transition-colors"
                        >
                          {category} ({count})
                        </Link>
                      )
                    })}
                  </div>

                  <div className="mt-8 pt-8 border-t border-gray-800">
                    <h3 className="text-xl font-bold text-white mb-4">Popular Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {allTags.slice(0, 10).map((tag) => (
                        <Link
                          key={tag}
                          href={`/blog?tag=${encodeURIComponent(tag)}`}
                          className="text-xs bg-gray-800 text-gray-400 hover:text-blue-400 hover:bg-gray-700 px-3 py-1 rounded-full transition-colors"
                        >
                          #{tag}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>

        <NewsletterSignup />
      </main>

      <Footer />
    </div>
  )
}
