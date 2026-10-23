import { useParams } from 'react-router-dom'
import { getCategory, toolsOf } from '../tools/registry'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import SectionTitle from '../components/SectionTitle'
import ToolCard from '../components/ToolCard'
import NotFound from './NotFound'

export default function CategoryPage() {
  const { category: categoryId } = useParams()
  const category = getCategory(categoryId)
  useDocumentTitle(category?.label)
  if (!category) return <NotFound />
  const tools = toolsOf(category.id)

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <SectionTitle kicker={`${tools.length} outil${tools.length > 1 ? 's' : ''}`} title={category.label}>
        {category.description}
      </SectionTitle>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>
    </div>
  )
}
