import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import ToolsIndex from './pages/ToolsIndex'
import CategoryPage from './pages/CategoryPage'
import ToolPage from './pages/ToolPage'
import Projects from './pages/Projects'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="outils" element={<ToolsIndex />} />
        <Route path="projets" element={<Projects />} />
        <Route path=":category" element={<CategoryPage />} />
        <Route path=":category/:toolId" element={<ToolPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
