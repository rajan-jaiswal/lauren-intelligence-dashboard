import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { fetchPractices, fetchProduct } from '../api/products.js';

const DataContext = createContext(null);

/**
 * Provides product data from MongoDB to the entire app.
 * Replaces the static dashboardData.js as the single source of truth.
 */
export function DataProvider({ children }) {
  const [practices, setPractices]       = useState({});   // { IBM: [...], AWS: [...] }
  const [productCache, setProductCache] = useState({});   // { 'IBM/Instana': data }
  const productCacheRef                 = useRef({});     // mirror for stable reads inside callbacks
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);

  // Load practices + product list on mount
  useEffect(() => {
    fetchPractices()
      .then((map) => {
        setPractices(map);
        setLoading(false);
      })
      .catch((err) => {
        console.warn('API unavailable, falling back to static data:', err.message);
        // Graceful fallback — import static data lazily
        import('../dashboardData.js').then((mod) => {
          setPractices(mod.PRODUCTS_BY_PRACTICE);
          setLoading(false);
        });
      });
  }, []);

  /**
   * Get full product data. Fetches from API on first call; caches in state.
   * If API is down falls back to static dashboardData.js.
   */
  // Keep ref in sync with state so callbacks can read latest cache without
  // needing to be recreated (prevents useEffect re-run loops in App.jsx).
  useEffect(() => { productCacheRef.current = productCache; }, [productCache]);

  const getProductData = useCallback(
    async (practice, product) => {
      // AWS data is fully static — always use dashboardData directly
      // (avoids DB field-name mismatch between Gemini schema and AWS-specific schema)
      if (practice === 'AWS') {
        const { getProductData: staticGet } = await import('../dashboardData.js');
        return staticGet(practice, product);
      }

      const key = `${practice}/${product}`;
      // Read from ref — stable across renders, no dependency on productCache state
      if (productCacheRef.current[key]) return productCacheRef.current[key];

      try {
        const doc = await fetchProduct(practice, product);
        if (doc) {
          productCacheRef.current = { ...productCacheRef.current, [key]: doc };
          setProductCache((prev) => ({ ...prev, [key]: doc }));
          return doc;
        }
      } catch (_) {
        // fall through to static fallback
      }

      // Static fallback — returns null for unknown products
      const { getProductData: staticGet } = await import('../dashboardData.js');
      const staticDoc = staticGet(practice, product);
      if (staticDoc) return staticDoc;

      // Return a minimal empty shell so the dashboard doesn't crash or show IBM data
      return {
        practice,
        product,
        overview: { name: product, description: 'No data yet. Use "Add Product" to generate intelligence.' },
        keyFeatures: [], discoveryQuestions: [], recommendedResponses: [],
        strengths: [], weaknesses: [], caseStudies: [], keyCustomers: [],
        competitorSummary: [], objectionHandling: [], featureMatrix: { labels: {}, rows: [] },
        tcoData: { labels: {}, rows: [], totals: {} }, winLoss: { total: 0, won: 0, lost: 0, winRate: 0, competitors: [] },
        aiCoach: {}, pricingTiers: [],
      };
    },
    [] // stable — reads cache via ref, never needs to recreate
  );

  /**
   * Invalidate one product from cache (called when SSE says product_added).
   */
  const invalidateProduct = useCallback((practice, product) => {
    const key = `${practice}/${product}`;
    delete productCacheRef.current[key];
    setProductCache((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  /**
   * Add a new practice/product combo to the local list without refetching all.
   */
  const addProductToList = useCallback((practice, product) => {
    setPractices((prev) => {
      const existing = prev[practice] || [];
      if (existing.includes(product)) return prev;
      return { ...prev, [practice]: [...existing, product] };
    });
  }, []);

  /** Add a brand-new practice (empty product list) */
  const addPracticeToList = useCallback((practiceName) => {
    setPractices((prev) => {
      if (prev[practiceName]) return prev;
      return { ...prev, [practiceName]: [] };
    });
  }, []);

  /** Remove a product from the local list (after delete) */
  const removeProductFromList = useCallback((practice, product) => {
    setPractices((prev) => {
      const updated = (prev[practice] || []).filter(p => p !== product);
      return { ...prev, [practice]: updated };
    });
    invalidateProduct(practice, product);
  }, [invalidateProduct]);

  /** Rename a practice key in the local list (after a successful rename API call) */
  const renamePracticeInList = useCallback((oldName, newName) => {
    setPractices((prev) => {
      if (!prev[oldName]) return prev;
      const next = { ...prev };
      next[newName] = next[oldName];
      delete next[oldName];
      return next;
    });
    // Re-key cached products for this practice
    const keysToRename = Object.keys(productCacheRef.current).filter(k => k.startsWith(`${oldName}/`));
    keysToRename.forEach(k => {
      const newKey = `${newName}/${k.slice(oldName.length + 1)}`;
      productCacheRef.current[newKey] = { ...productCacheRef.current[k], practice: newName };
      delete productCacheRef.current[k];
    });
    setProductCache((prev) => {
      const next = { ...prev };
      keysToRename.forEach(k => {
        const newKey = `${newName}/${k.slice(oldName.length + 1)}`;
        next[newKey] = { ...next[k], practice: newName };
        delete next[k];
      });
      return next;
    });
  }, []);

  /** Remove an entire practice and all its cached products */
  const removePracticeFromList = useCallback((practiceName) => {
    setPractices((prev) => {
      const next = { ...prev };
      delete next[practiceName];
      return next;
    });
    // Also evict all cached products for this practice
    const keysToDelete = Object.keys(productCacheRef.current).filter(k => k.startsWith(`${practiceName}/`));
    keysToDelete.forEach(k => delete productCacheRef.current[k]);
    setProductCache((prev) => {
      const next = { ...prev };
      keysToDelete.forEach(k => delete next[k]);
      return next;
    });
  }, []);

  return (
    <DataContext.Provider value={{ practices, loading, error, getProductData, invalidateProduct, addProductToList, addPracticeToList, removeProductFromList, removePracticeFromList, renamePracticeInList }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used inside <DataProvider>');
  return ctx;
}
