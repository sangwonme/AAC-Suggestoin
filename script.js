const $ = (id) => document.getElementById(id);
const img = (c, w) => `aac_images/${encodeURIComponent(c)}/${encodeURIComponent(w)}.png`;
const key = (card) => `${card.c}/${card.w}`;

const favs = new Set(JSON.parse(localStorage.getItem("favs") || "[]"));
const saveFavs = () => localStorage.setItem("favs", JSON.stringify([...favs]));

const selected = [];

function cardEl(card, withStar) {
  const el = document.createElement("div");
  el.className = "card";
  el.innerHTML =
    `<button class="pick" type="button"><img src="${img(card.c, card.w)}" alt=""><div>${card.w}</div></button>` +
    (withStar ? `<button class="star" type="button" aria-pressed="${favs.has(key(card))}" aria-label="${card.w} 즐겨찾기">★</button>` : "");
  el.querySelector(".pick").onclick = () => pick(card);
  if (withStar) el.querySelector(".star").onclick = () => {
    favs.has(key(card)) ? favs.delete(key(card)) : favs.add(key(card));
    saveFavs();
    render();
  };
  return el;
}

function pick(card) {
  new Audio(`aac_audios/${encodeURIComponent(card.c)}/${encodeURIComponent(card.w)}.mp3`).play();
  selected.push(card);
  renderSentence();
  $("sentence").scrollLeft = $("sentence").scrollWidth;
}

// 고른 카드 줄: 누르면 그 카드만 빼기
function renderSentence() {
  $("sentence").replaceChildren(
    ...selected.map((card, i) => {
      const b = document.createElement("button");
      b.className = "chip";
      b.type = "button";
      b.setAttribute("aria-label", `${card.w} 빼기`);
      b.innerHTML = `<img src="${img(card.c, card.w)}" alt=""><div>${card.w}</div>`;
      b.onclick = () => {
        selected.splice(i, 1);
        renderSentence();
      };
      return b;
    })
  );
  renderSuggest();
}

function renderSuggest() {
  $("suggest").replaceChildren(...REC(CARDS, selected, 20).map((c) => cardEl(c, false)));
}

let showing = () => [];
const render = () => $("cards").replaceChildren(...showing().map((c) => cardEl(c, true)));

const tabs = {
  전체: () => CARDS,
  즐겨찾기: () => CARDS.filter((c) => favs.has(key(c))),
  ...Object.fromEntries([...new Set(CARDS.map((c) => c.c))].map((cat) => [cat, () => CARDS.filter((c) => c.c === cat)])),
};
const buttons = Object.entries(tabs).map(([name, filter]) => {
  const b = document.createElement("button");
  b.type = "button";
  b.textContent = name;
  b.onclick = () => {
    buttons.forEach((x) => x.setAttribute("aria-pressed", x === b));
    showing = filter;
    render();
  };
  return b;
});
$("tabs").replaceChildren(...buttons);
buttons[0].click();
renderSentence();

$("reset").onclick = () => {
  selected.length = 0;
  renderSentence();
};
