import { useCallback, useEffect, useState } from 'react';
import { useFetchClient } from '@strapi/strapi/admin';

interface FaqRow {
  documentId: string;
  question: string;
  displayOrder: number;
}

interface FaqListResponse {
  data: FaqRow[];
}

export default function FaqOrderPage() {
  const [rows, setRows] = useState<FaqRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const { get, post } = useFetchClient();

  const loadFaqs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await get<FaqListResponse>(
        '/api/faqs?sort[0]=displayOrder:asc&pagination[pageSize]=100'
      );
      setRows(Array.isArray(data?.data) ? data.data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load FAQs');
    } finally {
      setLoading(false);
    }
  }, [get]);

  useEffect(() => {
    loadFaqs();
  }, [loadFaqs]);

  const onDrop = (index: number) => {
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null);
      return;
    }
    setRows((previous) => {
      const next = [...previous];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(index, 0, moved);
      return next;
    });
    setDragIndex(null);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    const previousRows = rows;
    try {
      await post('/api/faqs/reorder', {
        body: { ids: rows.map((row) => row.documentId) },
      });
      await loadFaqs();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save order');
      setRows(previousRows);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading FAQs…</p>;

  return (
    <main style={{ padding: '24px', maxWidth: '720px' }}>
      <h1 style={{ fontSize: '20px', marginBottom: '16px' }}>FAQ Display Order</h1>
      <p style={{ marginBottom: '16px', color: '#666' }}>
        Drag rows to reorder. Click <strong>Save order</strong> to apply.
      </p>
      {error && (
        <p role="alert" style={{ color: '#d02b29', marginBottom: '12px' }}>
          {error}
        </p>
      )}
      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px 0' }}>
        {rows.map((row, index) => (
          <li
            key={row.documentId}
            draggable
            onDragStart={() => setDragIndex(index)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => onDrop(index)}
            style={{
              padding: '12px 16px',
              border: '1px solid #dcdce4',
              borderRadius: '4px',
              marginBottom: '8px',
              cursor: 'grab',
              background: dragIndex === index ? '#e7f0ff' : '#fff',
            }}
          >
            <strong>{row.question || '(no question)'}</strong>
            <span style={{ color: '#888', marginLeft: '12px' }}>#{row.displayOrder}</span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={save}
        disabled={saving || rows.length === 0}
        style={{
          background: '#1771B9',
          color: '#fff',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '4px',
          cursor: saving ? 'wait' : 'pointer',
        }}
      >
        {saving ? 'Saving…' : 'Save order'}
      </button>
    </main>
  );
}
