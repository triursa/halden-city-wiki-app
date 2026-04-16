import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ManifestProvider } from './ManifestContext'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import SectionPage from './pages/SectionPage'
import EntryPage from './pages/EntryPage'
import SearchPage from './pages/SearchPage'

export default function App() {
  return (
    <ManifestProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/:sectionKey" element={<SectionPage />} />
            <Route path="/:sectionKey/:stem" element={<EntryPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ManifestProvider>
  )
}