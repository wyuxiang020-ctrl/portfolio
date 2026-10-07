## Phase 9 protocol — project-balanced comparison retrieval

### Hypothesis

For cross-project questions, retrieving a larger global semantic candidate pool and selecting the final context across project groups will improve relevant Project Evidence Coverage without changing Standard Search or weakening insufficient-evidence refusal.

### Controlled change

| Variable | Standard baseline | Compare iteration |
|---|---|---|
| Query embedding | Voyage, `input_type: "query"` | Same |
| Initial retrieval | Global Top-5 | Global Top-20 candidates |
| Final context | 5 chunks | 5 chunks, deterministic project-balanced selection |
| Claude model/prompt | Existing grounded-generation path | Same |
| Citation/retry behavior | Existing path | Same |
| Stored document embeddings | Existing vectors | Same — no re-embedding |

The main experimental variable is source selection. Compare mode does not add metadata filtering, reranking, hybrid search, a similarity threshold, or intent classification.

### Coverage metrics

- **Project Presence Coverage**: target projects represented by at least one selected chunk / target projects expected. This is mechanical and can be calculated from `project_id`.
- **Project Evidence Coverage**: target projects with at least one selected chunk that actually contains evidence needed for the comparison / target projects expected. Presence alone does not count. In this privacy-preserving run, expected evidence was checked in memory with deterministic patterns; it is a narrower proxy than a claim-by-claim human review.

### Test suite

- Standard regression: K1, K4, K6, K7; verify Hit@3 remains 4/4.
- Comparison A/B: C1–C4 plus new C5; run each in Standard and Compare modes.
- Unknown-answer regression: U1 and U4; run each in Standard and Compare modes.
- For comparison answers, record evidence coverage, answer relevance, groundedness, semantic citation accuracy, no-answer behavior, end-to-end latency, and actual Voyage/Claude call count.

Planned normal-path usage: 18 Voyage query-embedding calls and 14 Claude generation calls. Automatic bounded retries are counted if they occur. No document embedding is regenerated.

### Results (run 2026-09-02)

The hypothesis was **not supported strongly enough to promote project balancing as the new retrieval default**. Compare improved mechanical target-project presence in C1 and C2, but did not improve the expected-evidence count for any comparison. The candidate pool also contained four embedded project groups because a historical synthetic smoke-test project remains in the local knowledge base; blindly balancing every `project_id` therefore spent one of five context slots on a non-target project.

| Metric | Standard | Compare | Interpretation |
|---|---:|---:|---|
| Known-answer Hit@3 (K1, K4, K6, K7) | 4/4 | Not run | No regression; Standard is the unchanged Phase 8 path |
| Target Project Presence Coverage, C1–C4 | 9/11 | 11/11 | Mechanical coverage improved, but Compare represented 4 total project groups rather than only the 3 evaluation targets |
| Project Evidence Coverage, C1–C4 | 6/11 | 6/11 | No target-project semantic-evidence improvement from balancing |
| Positive-evidence opportunity check, C1–C4 | 6/9 | 6/9 | C1 has one positive method claim; absence in the other projects cannot be proven from one retrieved chunk each |
| C4 evidence coverage | 1/3; `no_evidence` | 1/3; `no_evidence` | The original area-comparison miss remains; refusal stayed correct |
| Answer Relevance | 3 successful answered comparisons; no independent numerical regrade | 4 successful answered comparisons; no independent numerical regrade | Raw answers were not logged, so Phase 8's manual score is not reused as a Phase 9 score |
| Groundedness / semantic Citation Accuracy proxy | Expected cited evidence present in 3/3 answered comparisons; citation indices valid | Expected cited evidence present in 4/4 answered comparisons; citation indices valid | Useful evidence check, but not a claim-by-claim semantic certification |
| Unknown-answer refusal (U1, U4) | 2/2 | 2/2 | No-answer behaviour did not regress |
| Successful comparison-answer latency | median 6.9s, range 6.5–8.3s (n=4) | median 6.7s, range 4.7–9.3s (n=5) | No meaningful latency penalty was observed at this tiny sample size |
| Formal experiment API calls | 11 Voyage, 8 Claude attempts | 7 Voyage, 7 Claude calls | Total 18 Voyage and 15 Claude; Standard C5 used both D18 attempts and still failed |

C5 was the new “cover every project” question. Compare returned an answer with 3/3 target-project presence but only 2/3 expected positive-evidence coverage. Standard failed structured generation twice within the initial request; one separate targeted rerun also failed after both D18 attempts. These failures are preserved as observed rather than replaced with the successful Compare result. They show that bounded retry mitigates a failure category but cannot guarantee successful structured output.

All successful answered responses had valid citation indices. A privacy-preserving deterministic check also confirmed that cited sources contained the expected positive-evidence patterns counted above. This is **not equivalent to Phase 8's manual, claim-by-claim semantic review**: raw answers and excerpts were intentionally not logged or printed during this Codex-run evaluation. Therefore Phase 9 does not invent new numerical claims for full Answer Relevance, Groundedness, or semantic Citation Accuracy. The evidence available supports “expected cited evidence present and citation indices valid,” not “every generated claim independently certified.”

### Product decision from the experiment

- Keep Standard Search as the default and do not change its retrieval logic.
- Keep Compare Projects explicitly labelled **Experimental** so the A/B behaviour remains inspectable, but do not claim that it fixes C4 or improves semantic evidence coverage.
- Do not add an LLM intent classifier, hybrid search, reranker, metadata filtering, or new embedding model in Phase 9.
- A future target-project picker or metadata-scoped retrieval could prevent non-target groups from consuming context, but that is a new product decision rather than a hidden extension of this experiment.

### Actual provider usage note

The valid formal batch used 18 Voyage query embeddings and 15 Claude generation attempts. Targeted verification added 5 Voyage calls and 2 Claude attempts. Three additional Voyage requests succeeded during rate-limit/setup diagnostics; requests rejected with Voyage 429 and the sandboxed production-server failures did not produce usable results. Total successful/provider-accepted activity for this work session was therefore 26 Voyage calls and 17 Claude attempts. No document embedding was regenerated.

---
归档于 2026-09-07。来源文件：evaluation.md
来源文件 SHA-256：986113a00af6f40c253415e972b069092ad059d0afe17fe9ab504281d40dc6d9
本文件为原文节选，本轮未重新运行底层项目评测。
