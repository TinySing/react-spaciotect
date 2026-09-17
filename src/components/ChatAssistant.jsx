import React, { useState } from 'react';
import { Icon } from './primitives';
import { useToast } from './state';

export function ChatAssistant({ open, onToggle }) {
  const toast = useToast();
  const [value, setValue] = useState('');
  const send = () => { if (!value.trim()) return; setValue(''); onToggle(); toast('Design assistant received your request'); };
  return <><aside className={`chat-drawer ${open ? 'open' : ''}`} aria-label="Design assistant"><div className="chat-header"><span className="chat-icon"><Icon name="spark" /></span><b>Design assistant</b><button onClick={onToggle}><Icon name="close" /></button></div>{open && <><div className="chat-history">I can compare options, explain constraints, or help refine this view.</div><textarea value={value} onChange={event => setValue(event.target.value)} placeholder="Ask me to inspect or build on your canvas..." /><div className="chat-footer"><span>25 / turn</span><button onClick={send} disabled={!value.trim()}><Icon name="arrow" /></button></div></>}</aside><button className={`chat-fab ${open ? 'active' : ''}`} onClick={onToggle} aria-expanded={open}><Icon name="spark" />{open ? 'Close assistant' : 'AI chat'}</button></>;
}
