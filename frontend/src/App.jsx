import { useEffect, useMemo, useState } from 'react'
import { assistDescription, createResource, deleteResource, listResources, updateResource } from './api'

const defaultForm = {
    title: '',
    description: '',
    resource_type: 'Video',
    url: '',
    tags: '',
}

export default function App() {
    const [form, setForm] = useState(defaultForm)
    const [items, setItems] = useState([])
    const [editingId, setEditingId] = useState(null)
    const [page, setPage] = useState(1)
    const [pageSize] = useState(5)
    const [total, setTotal] = useState(0)
    const [loadingList, setLoadingList] = useState(false)
    const [saving, setSaving] = useState(false)
    const [loadingAI, setLoadingAI] = useState(false)
    const [error, setError] = useState('')

    const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [pageSize, total])

    async function loadResources(targetPage = page) {
        setLoadingList(true)
        setError('')
        try {
            const data = await listResources(targetPage, pageSize)
            setItems(data.items)
            setTotal(data.total)
            setPage(data.page)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoadingList(false)
        }
    }

    useEffect(() => {
        loadResources(page)
    }, [])

    function onChange(event) {
        const { name, value } = event.target
        setForm((current) => ({ ...current, [name]: value }))
    }

    function toPayload() {
        return {
            title: form.title.trim(),
            description: form.description.trim(),
            resource_type: form.resource_type,
            url: form.url.trim(),
            tags: form.tags
                .split(',')
                .map((tag) => tag.trim())
                .filter(Boolean),
        }
    }

    async function onSubmit(event) {
        event.preventDefault()
        setSaving(true)
        setError('')
        try {
            const payload = toPayload()
            if (editingId) {
                await updateResource(editingId, payload)
            } else {
                await createResource(payload)
            }
            setForm(defaultForm)
            setEditingId(null)
            await loadResources(page)
        } catch (err) {
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    function onEdit(resource) {
        setEditingId(resource.id)
        setForm({
            title: resource.title,
            description: resource.description,
            resource_type: resource.resource_type,
            url: resource.url,
            tags: resource.tags.join(', '),
        })
        setError('')
    }

    async function onDelete(resourceId) {
        if (!window.confirm('Deseja realmente excluir este recurso?')) {
            return
        }
        setError('')
        try {
            await deleteResource(resourceId)
            const nextPage = items.length === 1 && page > 1 ? page - 1 : page
            await loadResources(nextPage)
        } catch (err) {
            setError(err.message)
        }
    }

    async function onGenerateAI() {
        if (!form.title.trim()) {
            setError('Informe o título para usar o Smart Assist.')
            return
        }
        setLoadingAI(true)
        setError('')
        try {
            const data = await assistDescription({
                title: form.title.trim(),
                resource_type: form.resource_type,
            })
            setForm((current) => ({
                ...current,
                description: data.description,
                tags: data.tags.join(', '),
            }))
        } catch (err) {
            setError(`Falha ao gerar descrição: ${err.message}`)
        } finally {
            setLoadingAI(false)
        }
    }

    return (
        <main className="container">
            <h1>Hub Inteligente de Recursos Educacionais</h1>

            {error && <p className="error">{error}</p>}

            <section className="card">
                <h2>{editingId ? 'Editar Recurso' : 'Novo Recurso'}</h2>
                <form onSubmit={onSubmit} className="form-grid">
                    <label>
                        Título
                        <input name="title" value={form.title} onChange={onChange} required minLength={3} />
                    </label>

                    <label>
                        Tipo
                        <select name="resource_type" value={form.resource_type} onChange={onChange}>
                            <option value="Video">Vídeo</option>
                            <option value="PDF">PDF</option>
                            <option value="Link">Link</option>
                        </select>
                    </label>

                    <label className="full-width">
                        URL
                        <input name="url" value={form.url} onChange={onChange} required type="url" />
                    </label>

                    <label className="full-width">
                        Descrição
                        <textarea name="description" value={form.description} onChange={onChange} rows={4} required />
                    </label>

                    <label className="full-width">
                        Tags (separadas por vírgula)
                        <input name="tags" value={form.tags} onChange={onChange} />
                    </label>

                    <div className="actions full-width">
                        <button type="button" onClick={onGenerateAI} disabled={loadingAI || saving}>
                            {loadingAI ? 'Gerando com IA...' : 'Gerar Descrição com IA'}
                        </button>

                        <button type="submit" disabled={saving || loadingAI}>
                            {saving ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Cadastrar Recurso'}
                        </button>

                        {editingId && (
                            <button
                                type="button"
                                onClick={() => {
                                    setEditingId(null)
                                    setForm(defaultForm)
                                }}
                            >
                                Cancelar Edição
                            </button>
                        )}
                    </div>
                </form>
            </section>

            <section className="card">
                <h2>Recursos Cadastrados</h2>
                {loadingList ? (
                    <p>Carregando recursos...</p>
                ) : (
                    <>
                        <ul className="resource-list">
                            {items.map((resource) => (
                                <li key={resource.id}>
                                    <div>
                                        <strong>{resource.title}</strong>
                                        <p>{resource.description}</p>
                                        <small>
                                            Tipo: {resource.resource_type} | URL: {resource.url}
                                        </small>
                                        <p>Tags: {resource.tags.join(', ') || '-'}</p>
                                    </div>
                                    <div className="actions">
                                        <button type="button" onClick={() => onEdit(resource)}>
                                            Editar
                                        </button>
                                        <button type="button" onClick={() => onDelete(resource.id)}>
                                            Excluir
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>

                        <div className="pagination">
                            <button type="button" disabled={page <= 1} onClick={() => loadResources(page - 1)}>
                                Anterior
                            </button>
                            <span>
                                Página {page} de {totalPages}
                            </span>
                            <button type="button" disabled={page >= totalPages} onClick={() => loadResources(page + 1)}>
                                Próxima
                            </button>
                        </div>
                    </>
                )}
            </section>
        </main>
    )
}
