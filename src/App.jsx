// src/App.jsx
import { useState, useRef, useEffect } from 'react';
import { generateBlobPoints, buildPath } from '@ikg-systems/moyo';
import './App.css';

const IMAGE_MODELS = [
  { value: 'bfl/flux-2-flex', label: 'FLUX.2 Flex' },
  { value: 'bfl/flux-pro-1.1', label: 'FLUX.1 Pro' },
  { value: 'google/imagen-4.0-fast-generate', label: 'Imagen 4.0 Fast' },
];

const VIDEO_MODELS = [
  { value: 'google/veo-3.1-fast-generate-001', label: 'Veo 3.1 Fast' },
];

// Arp-inspired organic blob loader
function ArpBlob() {
  const pathRef = useRef(null);

  useEffect(() => {
    const points = generateBlobPoints(8, '690-blob');
    let startedAt = performance.now();
    let rafId;

    function frame(now) {
      const t = (now - startedAt) / 1000;
      if (pathRef.current) {
        pathRef.current.setAttribute(
          'd',
          buildPath(points, t, { base: 'wander', edge: 0.4, spike: 0.2 })
        );
      }
      rafId = requestAnimationFrame(frame);
    }

    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <svg width="120" height="120" viewBox="0 0 400 400" aria-hidden="true">
      <path ref={pathRef} fill="#D7CF07" />
    </svg>
  );
}

export default function App() {
  const [type, setType] = useState('image');
  const [model, setModel] = useState(IMAGE_MODELS[0].value);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [filename, setFilename] = useState('');
  const [error, setError] = useState('');

  const isImage = type === 'image';
  const models = isImage ? IMAGE_MODELS : VIDEO_MODELS;

  // Reset model when type changes
  useEffect(() => {
    setModel(models[0].value);
  }, [type]);

  async function handleGenerate() {
    if (!prompt.trim()) {
      setError('Please enter a prompt.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, type, model }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Generation failed');
      }

      const data = await res.json();
      setResult(data);

      // Pre-fill filename with timestamp
      const ext = data.mimeType === 'video/mp4' ? 'mp4' : 'png';
      const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      setFilename(`690_${ts}.${ext}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    if (!result || !filename) return;
    const a = document.createElement('a');
    a.href = result.data;
    a.download = filename;
    a.click();
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <h1>690</h1>
        <p className="subtitle">Generative media studio</p>
      </header>

      {/* Specification Tab */}
      <section className="spec-panel">
        <div className="spec-tabs">
          <button
            className={`tab ${isImage ? 'active' : ''}`}
            onClick={() => setType('image')}
          >
            Image
          </button>
          <button
            className={`tab ${!isImage ? 'active' : ''}`}
            onClick={() => setType('video')}
          >
            Video
          </button>
        </div>

        <label className="field">
          <span>Model</span>
          <select value={model} onChange={(e) => setModel(e.target.value)}>
            {models.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Prompt</span>
          <textarea
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe what you want to create..."
          />
        </label>

        <button
          className="generate-btn"
          onClick={handleGenerate}
          disabled={loading || !prompt.trim()}
        >
          {loading ? 'Generating...' : `Generate ${isImage ? 'Image' : 'Video'}`}
        </button>

        {error && <p className="error">{error}</p>}
      </section>

      {/* Loading state — Arp blob */}
      {loading && (
        <div className="loading-zone">
          <ArpBlob />
          <p>Shaping your {isImage ? 'image' : 'video'}...</p>
        </div>
      )}

      {/* Result preview */}
      {result && !loading && (
        <section className="result-panel">
          <div className="preview-wrap">
            {result.type === 'image' ? (
              <img src={result.data} alt="Generated" className="preview" />
            ) : (
              <video src={result.data} controls className="preview" />
            )}
          </div>

          <div className="result-controls">
            <label className="field">
              <span>Filename</span>
              <input
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
              />
            </label>
            <button className="download-btn" onClick={handleDownload}>
              Download
            </button>
          </div>
        </section>
      )}
    </div>
  );
                                                   }
