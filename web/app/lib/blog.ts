import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const postsDirectory = path.join(process.cwd(), 'content/blog')

export interface BlogPost {
  slug: string
  title: string
  description: string
  excerpt?: string
  date: string
  category: string
  author: string
  readTime: string
  image?: string
  tags: string[]
  featured: boolean
  content: string
}

export function getAllPosts(): BlogPost[] {
  if (!fs.existsSync(postsDirectory)) {
    return []
  }

  const fileNames = fs.readdirSync(postsDirectory)
  const allPostsData = fileNames
    .filter((fileName) => fileName.endsWith('.mdx') || fileName.endsWith('.md'))
    .map((fileName) => {
      const slug = fileName.replace(/\.mdx?$/, '')
      const fullPath = path.join(postsDirectory, fileName)
      const fileContents = fs.readFileSync(fullPath, 'utf8')
      const { data, content } = matter(fileContents)

      return {
        slug,
        title: data.title || '',
        description: data.description || data.excerpt || '',
        excerpt: data.excerpt,
        date: data.date || '',
        category: data.category || 'Uncategorized',
        author: data.author || '4uPDF Team',
        readTime: data.readTime || '5 min read',
        image: data.image,
        tags: data.tags || [],
        featured: data.featured || false,
        content,
      }
    })

  return allPostsData.sort((a, b) => (a.date < b.date ? 1 : -1))
}

export function getPostBySlug(slug: string): BlogPost | null {
  const posts = getAllPosts()
  return posts.find((post) => post.slug === slug) || null
}

export function getPostsByCategory(category: string): BlogPost[] {
  const posts = getAllPosts()
  return posts.filter((post) => post.category === category)
}

export function getAllCategories(): string[] {
  const posts = getAllPosts()
  const categories = [...new Set(posts.map((post) => post.category))]
  return categories
}

export function getFeaturedPosts(limit: number = 3): BlogPost[] {
  const posts = getAllPosts()
  return posts.filter((post) => post.featured).slice(0, limit)
}

export function getRelatedPosts(currentSlug: string, limit: number = 3): BlogPost[] {
  const currentPost = getPostBySlug(currentSlug)
  if (!currentPost) return []

  const allPosts = getAllPosts().filter((post) => post.slug !== currentSlug)

  const scored = allPosts.map((post) => {
    let score = 0
    if (post.category === currentPost.category) score += 3
    const commonTags = post.tags.filter((tag) => currentPost.tags.includes(tag))
    score += commonTags.length * 2
    return { post, score }
  })

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.post)
}

export function getAllTags(): string[] {
  const posts = getAllPosts()
  const tags = posts.flatMap((post) => post.tags)
  return [...new Set(tags)]
}
