import { useCallback, useEffect, useState } from 'react';
import { loadStudioModel } from '../services/studioService';

/** Loads one project option and protects UI state from stale responses. */
export function useStudioModel(projectId, optionId) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const [revision, setRevision] = useState(0);
  const reload = useCallback(() => setRevision(value => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    setState(current => ({ ...current, loading: true, error: null }));
    loadStudioModel(projectId, optionId, { signal: controller.signal })
      .then(data => { if (!controller.signal.aborted) setState({ data, loading: false, error: null }); })
      .catch(error => { if (error.name !== 'AbortError' && !controller.signal.aborted) setState({ data: null, loading: false, error }); });
    return () => controller.abort();
  }, [projectId, optionId, revision]);

  return { ...state, reload };
}
