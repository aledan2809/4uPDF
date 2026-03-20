import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { getAllBlogPosts, getBlogPostBySlug } from '@/lib/blog'
import ArticleSchema from '@/app/components/ArticleSchema'
import SocialShare from '@/app/components/SocialShare'
import NewsletterSignup from '@/app/components/NewsletterSignup'
import Navbar from '@/app/components/Navbar'
import Footer from '@/app/components/Footer'

export async function generateStaticParams() {
  const posts = getAllBlogPosts()
  return posts.map((post) => ({
    slug: post.slug,
  }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = getBlogPostBySlug(slug)

  if (!post) {
    return {
      title: 'Post Not Found',
    }
  }

  return {
    title: `${post.title} | 4uPDF Blog`,
    description: post.description,
    keywords: [post.category, ...post.tags, 'pdf', 'pdf tools'].join(', '),
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
      authors: [post.author],
      tags: post.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
    },
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getBlogPostBySlug(slug)

  if (!post) {
    notFound()
  }

  const allPosts = getAllBlogPosts()
  const relatedPosts = allPosts
    .filter(p => p.slug !== slug && p.category === post.category)
    .slice(0, 3)

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <ArticleSchema
        title={post.title}
        description={post.description}
        datePublished={post.date}
        author={post.author}
        url={`https://4updf.com/blog/${post.slug}`}
      />

      <article className="flex-1 bg-gray-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link
            href="/blog"
            className="inline-flex items-center text-blue-400 hover:text-blue-300 mb-8 transition-colors"
          >
            ← Back to Blog
          </Link>

          <header className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-sm font-semibold px-4 py-1.5 bg-blue-600 text-white rounded-full">
                {post.category}
              </span>
              <span className="text-gray-400">{post.readTime}</span>
            </div>
            <h1 className="text-5xl font-bold text-white mb-6 leading-tight">{post.title}</h1>
            <p className="text-xl text-gray-300 mb-6">{post.description}</p>
            <div className="flex items-center gap-4 text-gray-400">
              <span>By {post.author}</span>
              <span>•</span>
              <time dateTime={post.date}>
                {new Date(post.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
            </div>
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-gray-800 text-gray-400 px-3 py-1 rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </header>

          <div className="prose prose-invert prose-lg max-w-none mb-12">
            <MDXRemote source={post.content} />
          </div>

          <div className="border-t border-gray-800 pt-8 mb-12">
            <SocialShare title={post.title} url={`https://4updf.com/blog/${post.slug}`} />
          </div>

          {relatedPosts.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">Related Articles</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {relatedPosts.map((relatedPost) => (
                  <Link
                    key={relatedPost.slug}
                    href={`/blog/${relatedPost.slug}`}
                    className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-blue-500 transition-all"
                  >
                    <span className="text-xs bg-purple-600 text-white px-3 py-1 rounded-full">
                      {relatedPost.category}
                    </span>
                    <h3 className="text-lg font-bold text-white mt-4 mb-2">{relatedPost.title}</h3>
                    <p className="text-gray-400 text-sm line-clamp-2">{relatedPost.description}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <NewsletterSignup />
        </div>
      </article>

      <Footer />
    </div>
  )
}
