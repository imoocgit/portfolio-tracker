import { useState } from 'react'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { ThemeProvider } from './context/ThemeContext'
import { Header, View } from './components/Header'
import { BlockSection } from './components/BlockSection'
import { BlockModal } from './components/BlockModal'
import { HistoryView } from './components/HistoryView'
import { useBlocks, useCreateBlock, useUpdateBlock, useDeleteBlock } from './hooks/usePortfolio'
import { Block } from './api/services'
import { Plus } from 'lucide-react'

const queryClient = new QueryClient()

const AppContent = () => {
  const [view, setView] = useState<View>('portfolio')
  const [searchQuery, setSearchQuery] = useState('')
  const [blockModalOpen, setBlockModalOpen] = useState(false)
  const [editingBlock, setEditingBlock] = useState<Block | null>(null)

  const { data: blocks = [], isLoading } = useBlocks()
  const createBlock = useCreateBlock()
  const updateBlock = useUpdateBlock()
  const deleteBlock = useDeleteBlock()

  const filteredBlocks = blocks.filter(b =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.company.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSaveBlock = async (data: Omit<Block, 'id' | 'createdAt'>) => {
    if (editingBlock) {
      await updateBlock.mutateAsync({ id: editingBlock.id, data })
    } else {
      await createBlock.mutateAsync(data)
    }
    setBlockModalOpen(false)
    setEditingBlock(null)
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <Header onSearch={setSearchQuery} view={view} onNavigate={setView} />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Portfolio stays mounted while History is open so prices keep saving */}
        <div className={view === 'portfolio' ? '' : 'hidden'}>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Portfolio</h2>
            <button
              onClick={() => {
                setEditingBlock(null)
                setBlockModalOpen(true)
              }}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="w-5 h-5" />
              New Block
            </button>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-slate-500">Loading...</div>
          ) : filteredBlocks.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              {blocks.length === 0 ? 'No portfolio blocks yet. Create one to get started.' : 'No results found.'}
            </div>
          ) : (
            <div className="space-y-6">
              {filteredBlocks.map(block => (
                <BlockSection
                  key={block.id}
                  block={block}
                  onDelete={(id) => deleteBlock.mutate(id)}
                  onEdit={(b) => {
                    setEditingBlock(b)
                    setBlockModalOpen(true)
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {view === 'history' && <HistoryView blocks={blocks} />}

        {blockModalOpen && (
          <BlockModal
            block={editingBlock}
            onSave={handleSaveBlock}
            onClose={() => {
              setBlockModalOpen(false)
              setEditingBlock(null)
            }}
          />
        )}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </QueryClientProvider>
  )
}
