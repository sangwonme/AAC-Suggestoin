// 고른 카드 → 다음 카드 추천. 사전 정의된 컨텍스트만 사용, 네트워크/모델 없음.
// 점수 = 카테고리 전이 × (1 + 1.5 × 쓰임새 코사인) + 1.2 × 빈출어 가중
const REC = (() => {
  const tags = {};                                    // 단어 → Set(쓰임새 태그)
  for (const [tag, words] of Object.entries(FRAMES))
    for (const w of words.split(",")) (tags[w] ??= new Set()).add(tag);

  const df = {};
  for (const s of Object.values(tags)) for (const t of s) df[t] = (df[t] || 0) + 1;
  const n = Object.keys(tags).length;
  const vec = (w) => Object.fromEntries([...(tags[w] || [])].map((t) => [t, Math.log(n / df[t])]));
  const norm = (v) => Math.hypot(...Object.values(v)) || 1;

  const V = {}, NORM = {};
  for (const w in tags) { V[w] = vec(w); NORM[w] = norm(V[w]); }

  const cos = (a, b) => {
    let dot = 0;
    for (const t in V[a]) if (t in V[b]) dot += V[a][t] * V[b][t];
    return dot / (NORM[a] * NORM[b]);
  };

  const prio = Object.fromEntries(PRIORITY.map((w, i) => [w, 1 - i / PRIORITY.length]));

  return function recommend(cards, selected, count) {
    const last = selected.length ? selected[selected.length - 1].c : "시작";
    const chosen = new Set(selected.map((c) => c.w));
    return cards
      .filter((c) => !chosen.has(c.w))
      .map((c, i) => {
        const sim = selected.reduce((m, s) => Math.max(m, cos(s.w, c.w)), 0);
        return { c, i, score: TRANS[last][c.c] * (1 + 1.5 * sim) + 1.2 * (prio[c.w] || 0) };
      })
      .sort((a, b) => b.score - a.score || a.i - b.i)
      .slice(0, count)
      .map((x) => x.c);
  };
})();
