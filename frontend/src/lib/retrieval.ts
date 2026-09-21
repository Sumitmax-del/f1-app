/**
 * Lightweight BM25-style lexical retrieval engine.
 * Zero external dependencies — runs entirely in-memory.
 */

import knowledgeBase from './knowledgeBase.json';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface KBDocument {
  id: string;
  title: string;
  content: string;
}

export interface ScoredDocument {
  document: KBDocument;
  score: number;
}

// ── Tokenizer ──────────────────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'shall',
  'should', 'may', 'might', 'must', 'can', 'could', 'of', 'in', 'to',
  'for', 'with', 'on', 'at', 'by', 'from', 'as', 'into', 'through',
  'during', 'before', 'after', 'above', 'below', 'between', 'and',
  'but', 'or', 'nor', 'not', 'so', 'yet', 'both', 'either', 'neither',
  'each', 'every', 'all', 'any', 'few', 'more', 'most', 'other',
  'some', 'such', 'no', 'only', 'own', 'same', 'than', 'too', 'very',
  'just', 'about', 'it', 'its', 'this', 'that', 'these', 'those',
  'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'him', 'his',
  'she', 'her', 'they', 'them', 'their', 'what', 'which', 'who',
  'whom', 'when', 'where', 'why', 'how', 'if', 'then', 'also',
  'up', 'out', 'off', 'over', 'under', 'again', 'there', 'here',
]);

/**
 * Tokenize text: lowercase → strip non-alphanumeric (keep hyphens for F1
 * terms like "MGU-K") → split → remove stop words → deduplicate.
 */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\-\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}

// ── BM25 Parameters ────────────────────────────────────────────────────────────

const K1 = 1.5;   // Term-frequency saturation
const B = 0.75;    // Length-normalisation weight

// ── Corpus Pre-processing (runs once at module load) ───────────────────────────

interface CorpusEntry {
  doc: KBDocument;
  tokens: string[];
  tf: Map<string, number>;
}

const corpus: CorpusEntry[] = [];
let avgDl = 0;                             // average document length
const df = new Map<string, number>();      // document frequency per term

for (const doc of knowledgeBase.documents as KBDocument[]) {
  const tokens = tokenize(`${doc.title} ${doc.content}`);
  const tf = new Map<string, number>();
  for (const t of tokens) {
    tf.set(t, (tf.get(t) ?? 0) + 1);
  }
  corpus.push({ doc, tokens, tf });
  avgDl += tokens.length;

  // Count each unique term once per document for DF
  const seen = new Set<string>();
  for (const t of tokens) {
    if (!seen.has(t)) {
      df.set(t, (df.get(t) ?? 0) + 1);
      seen.add(t);
    }
  }
}
avgDl = corpus.length > 0 ? avgDl / corpus.length : 1;

const N = corpus.length; // total number of documents

// ── BM25 Scoring ───────────────────────────────────────────────────────────────

/**
 * Compute IDF for a term using the classic BM25 formula:
 *   idf(t) = ln( (N - df(t) + 0.5) / (df(t) + 0.5) + 1 )
 */
function idf(term: string): number {
  const n = df.get(term) ?? 0;
  return Math.log((N - n + 0.5) / (n + 0.5) + 1);
}

/**
 * Score a single document against a set of query tokens.
 */
function scoreDocument(entry: CorpusEntry, queryTokens: string[]): number {
  const dl = entry.tokens.length;
  let score = 0;

  for (const qt of queryTokens) {
    const termFreq = entry.tf.get(qt) ?? 0;
    if (termFreq === 0) continue;

    const termIdf = idf(qt);
    const numerator = termFreq * (K1 + 1);
    const denominator = termFreq + K1 * (1 - B + B * (dl / avgDl));
    score += termIdf * (numerator / denominator);
  }

  // Boost: award extra credit when query tokens appear in the title
  const titleTokens = new Set(tokenize(entry.doc.title));
  let titleHits = 0;
  for (const qt of queryTokens) {
    if (titleTokens.has(qt)) titleHits++;
  }
  if (titleHits > 0) {
    score *= 1 + 0.3 * (titleHits / queryTokens.length);
  }

  return score;
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Retrieve the top-K most relevant documents for a query string.
 *
 * @param query  – The user's natural-language question.
 * @param topK   – Number of results to return (default 3).
 * @returns Scored documents sorted by relevance (descending).
 */
export function retrieve(query: string, topK = 3): ScoredDocument[] {
  const queryTokens = tokenize(query);

  if (queryTokens.length === 0) return [];

  const scored: ScoredDocument[] = corpus.map((entry) => ({
    document: entry.doc,
    score: scoreDocument(entry, queryTokens),
  }));

  // Sort descending by score, keep only topK with score > 0
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

/**
 * Format retrieved documents into a context string suitable for injection
 * into the system/user prompt.
 */
export function formatContext(results: ScoredDocument[]): string {
  if (results.length === 0) return '';

  return results
    .map(
      (r, i) =>
        `[Source ${i + 1}: ${r.document.title}]\n${r.document.content}`
    )
    .join('\n\n');
}
