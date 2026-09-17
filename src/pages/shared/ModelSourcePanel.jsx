import React from 'react';
import { Icon, useToast } from '../../components';

export function ModelSourcePanel({ files, current, onSelect, open, onClose }) {
  const toast = useToast();
  if (!open) return null;
  return <div className="model-source-backdrop" role="presentation" onClick={onClose}>
    <section className="model-source-panel" role="dialog" aria-modal="true" aria-labelledby="model-source-title" onClick={event => event.stopPropagation()}>
      <header><div><p className="eyebrow">BIM / model evidence</p><h2 id="model-source-title">Source files</h2></div><button onClick={onClose} aria-label="Close source files"><Icon name="close" /></button></header>
      <p className="model-source-intro">The active canvas is driven by these validated project artifacts. Select a file to inspect its role.</p>
      <div className="model-source-list">{files.map(file => <button key={file.name} className={current === file.name ? 'active' : ''} onClick={() => onSelect(file.name)}><span className="source-file-icon"><Icon name={file.icon || 'file'} /></span><span><b>{file.name}</b><small>{file.description}</small></span><em>{current === file.name ? 'Selected' : file.status || 'Ready'}</em></button>)}</div>
      <footer><span>Project 8591 · Site E-2</span><button className="secondary-btn" onClick={() => toast(`Preview prepared for ${current}`)}><Icon name="eye" />Preview selected</button></footer>
    </section>
  </div>;
}
