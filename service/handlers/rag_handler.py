import asyncio
import math
import re

from service.commands import RAGCommand


class RAGHandler:
    def __init__(self, llm, retriever):
        self.llm = llm
        self.retriever = retriever

    async def handle(self, cmd: RAGCommand):
        context = cmd.context or self._retrieve_context(cmd.query)
        history_text = self._history_to_text(cmd.conversation_history)
        prompt = f"""
You are an AI concierge for digital banking.

RULES:
- Use injected context and conversation history to personalize response.
- For factual policy answers, answer ONLY from policy context.
- Do NOT repeat words or sentences.
- Keep response SHORT (max 2-3 lines).

INJECTED_CONTEXT:
{cmd.injected_context}

CONVERSATION_HISTORY:
{history_text}

CONTEXT:
{context}

QUESTION:
{cmd.query}

ANSWER:
"""
        res = await asyncio.to_thread(self.llm.invoke, prompt)
        return {"response": self._clean_text(res.content)}

    def _retrieve_context(self, query: str) -> str:
        docs = self._hybrid_retrieve(query=query, candidate_k=24, top_k=6)
        if not docs:
            return ""
        return "\n\n".join([doc.page_content for doc in docs])

    def _hybrid_retrieve(self, query: str, candidate_k: int = 24, top_k: int = 6):
        dense_candidates = self._dense_candidates(query=query, k=candidate_k)
        if not dense_candidates:
            return []

        query_terms = self._tokenize(query)
        if not query_terms:
            return [doc for doc, _ in dense_candidates[:top_k]]

        docs = [doc for doc, _ in dense_candidates]
        dense_scores = [score for _, score in dense_candidates]
        keyword_scores = self._keyword_bm25_scores(query_terms=query_terms, docs=docs)

        max_keyword = max(keyword_scores) if keyword_scores else 0.0
        normalized_keyword = [
            (score / max_keyword) if max_keyword > 0 else 0.0 for score in keyword_scores
        ]

        reranked = []
        for idx, doc in enumerate(docs):
            # Weighted hybrid score: semantic relevance + keyword precision.
            hybrid_score = 0.65 * dense_scores[idx] + 0.35 * normalized_keyword[idx]
            reranked.append((doc, hybrid_score))

        reranked.sort(key=lambda item: item[1], reverse=True)
        return [doc for doc, _ in reranked[:top_k]]

    def _dense_candidates(self, query: str, k: int):
        vectorstore = getattr(self.retriever, "vectorstore", None)
        if vectorstore and hasattr(vectorstore, "similarity_search_with_score"):
            try:
                pairs = vectorstore.similarity_search_with_score(query, k=k)
                if not pairs:
                    return []

                raw_scores = [float(score) for _, score in pairs]
                # Convert backend-specific distance/score values into a stable 0..1 relevance.
                min_score = min(raw_scores)
                max_score = max(raw_scores)

                normalized = []
                if max_score == min_score:
                    normalized = [(doc, 1.0) for doc, _ in pairs]
                else:
                    for doc, score in pairs:
                        s = float(score)
                        # Lower distance => higher relevance.
                        relevance = (max_score - s) / (max_score - min_score)
                        normalized.append((doc, relevance))
                return normalized
            except Exception:
                pass

        docs = self.retriever.invoke(query)
        dense = []
        total = max(len(docs), 1)
        for idx, doc in enumerate(docs):
            # Rank-based proxy when explicit relevance scores are unavailable.
            dense.append((doc, 1.0 - (idx / total)))
        return dense

    def _keyword_bm25_scores(self, query_terms: list[str], docs: list):
        doc_tokens = [self._tokenize(getattr(doc, "page_content", "")) for doc in docs]
        if not doc_tokens:
            return []

        doc_count = len(doc_tokens)
        avg_doc_len = sum(len(tokens) for tokens in doc_tokens) / max(doc_count, 1)
        avg_doc_len = avg_doc_len or 1.0
        k1 = 1.5
        b = 0.75

        # Document frequency for query terms.
        df: dict[str, int] = {}
        for term in query_terms:
            df[term] = sum(1 for tokens in doc_tokens if term in set(tokens))

        scores = []
        for tokens in doc_tokens:
            term_freq: dict[str, int] = {}
            for token in tokens:
                term_freq[token] = term_freq.get(token, 0) + 1

            score = 0.0
            doc_len = len(tokens) or 1
            for term in query_terms:
                tf = term_freq.get(term, 0)
                if tf == 0:
                    continue
                n_qi = df.get(term, 0)
                idf = math.log(1 + (doc_count - n_qi + 0.5) / (n_qi + 0.5))
                denom = tf + k1 * (1 - b + b * (doc_len / avg_doc_len))
                score += idf * ((tf * (k1 + 1)) / denom)
            scores.append(score)
        return scores

    def _tokenize(self, text: str) -> list[str]:
        return re.findall(r"[a-zA-Z0-9]{2,}", text.lower())

    def _history_to_text(self, conversation_history: list[dict]) -> str:
        if not conversation_history:
            return "No prior conversation."
        recent = conversation_history[-6:]
        lines = []
        for item in recent:
            role = str(item.get("role", "user")).strip().lower()
            content = str(item.get("content", "")).strip()
            if not content:
                continue
            if role not in {"user", "assistant"}:
                role = "user"
            lines.append(f"{role}: {content}")
        return "\n".join(lines) if lines else "No prior conversation."

    def _clean_text(self, text: str) -> str:
        words = text.split()
        cleaned = []
        for token in words:
            if not cleaned or cleaned[-1] != token:
                cleaned.append(token)
        return " ".join(cleaned)