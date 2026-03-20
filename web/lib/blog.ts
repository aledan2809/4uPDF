import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const contentDirectory = path.join(process.cwd(), 'content')

export interface BlogPost {
  slug: string
  title: string
  description: string
  date: string
  category: string
  author: string
  readTime: string
  tags: string[]
  content: string
}

export interface HowToPage {
  slug: string
  title: string
  description: string
  content: string
}

export function getAllBlogPosts(): BlogPost[] {
  const blogDir = path.join(contentDirectory, 'blog')

  if (!fs.existsSync(blogDir)) {
    return []
  }

  const fileNames = fs.readdirSync(blogDir)
  const posts = fileNames
    .filter(fileName => fileName.endsWith('.mdx'))
    .map(fileName => {
      const slug = fileName.replace(/\.mdx$/, '')
      const fullPath = path.join(blogDir, fileName)
      const fileContents = fs.readFileSync(fullPath, 'utf8')
      const { data, content } = matter(fileContents)

      return {
        slug,
        title: data.title || '',
        description: data.description || '',
        date: data.date || '',
        category: data.category || 'General',
        author: data.author || '4uPDF Team',
        readTime: data.readTime || '5 min read',
        tags: data.tags || [],
        content,
      }
    })

  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function getBlogPostBySlug(slug: string): BlogPost | null {
  try {
    const fullPath = path.join(contentDirectory, 'blog', `${slug}.mdx`)
    const fileContents = fs.readFileSync(fullPath, 'utf8')
    const { data, content } = matter(fileContents)

    return {
      slug,
      title: data.title || '',
      description: data.description || '',
      date: data.date || '',
      category: data.category || 'General',
      author: data.author || '4uPDF Team',
      readTime: data.readTime || '5 min read',
      tags: data.tags || [],
      content,
    }
  } catch {
    return null
  }
}

export function getHowToPage(slug: string): HowToPage | null {
  try {
    const fullPath = path.join(contentDirectory, 'how-to', `${slug}.mdx`)
    const fileContents = fs.readFileSync(fullPath, 'utf8')
    const { data, content } = matter(fileContents)

    return {
      slug,
      title: data.title || '',
      description: data.description || '',
      content,
    }
  } catch {
    return null
  }
}

export function getBlogCategories(): string[] {
  const posts = getAllBlogPosts()
  const categories = new Set(posts.map(post => post.category))
  return Array.from(categories)
}
