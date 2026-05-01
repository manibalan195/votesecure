import { useState, useEffect, useCallback } from 'react';
import api from '../services/api.js';

export function useFetch(url, deps = []) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetch = useCallback(async () => {
    if (!url) { setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const res = await api.get(url);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load');
    } finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, ...deps]);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, error, refetch: fetch };
}

export function useCountdown(endTime) {
  const [remaining, setRemaining] = useState('');
  useEffect(() => {
    function calc() {
      const diff = new Date(endTime) - Date.now();
      if (diff <= 0) { setRemaining('Ended'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if (h > 24) setRemaining(`${Math.floor(h/24)}d ${h%24}h left`);
      else if (h)  setRemaining(`${h}h ${m}m left`);
      else         setRemaining(`${m}m ${s}s left`);
    }
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [endTime]);
  return remaining;
}

export function useForm(initial) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setValues(v => ({ ...v, [name]: type === 'checkbox' ? checked : value }));
    setErrors(e => ({ ...e, [name]: '' }));
  }
  function setField(name, value) { setValues(v => ({ ...v, [name]: value })); }
  function reset() { setValues(initial); setErrors({}); }
  return { values, errors, setErrors, handleChange, setField, reset };
}
