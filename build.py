#!/usr/bin/env python3
"""에셋을 바꾼 뒤 실행하면 cards.js를 다시 만들고, 음성이 없는 카드만 만들어 넣는다.

    python3 build.py            # 빠진 음성만 생성
    python3 build.py --all      # 모든 음성 다시 생성

음성: edge-tts (설치: pip install edge-tts). 네트워크는 음성 생성할 때만 쓴다.
"""
import asyncio, json, os, sys

ROOT = os.path.dirname(os.path.abspath(__file__))
VOICE = "ko-KR-SunHiNeural"


def scan():
    out = []
    for cat in sorted(os.listdir(f"{ROOT}/aac_images")):
        d = f"{ROOT}/aac_images/{cat}"
        if not os.path.isdir(d):
            continue
        for f in sorted(os.listdir(d)):
            if f.endswith(".png"):
                out.append({"c": cat, "w": f[:-4]})
    return out


async def speak(cards, redo):
    import edge_tts
    sem = asyncio.Semaphore(8)  # ponytail: 동시 8개. 막히면 숫자만 줄이면 됨.

    async def one(card):
        out = f"{ROOT}/aac_audios/{card['c']}/{card['w']}.mp3"
        if not redo and os.path.exists(out):
            return 0
        os.makedirs(os.path.dirname(out), exist_ok=True)
        async with sem:
            await edge_tts.Communicate(card["w"], VOICE).save(out)
        return 1

    return sum(await asyncio.gather(*(one(c) for c in cards)))


cards = scan()
made = asyncio.run(speak(cards, "--all" in sys.argv))
with open(f"{ROOT}/cards.js", "w") as f:
    f.write("const CARDS = " + json.dumps(cards, ensure_ascii=False) + ";\n")
print(f"카드 {len(cards)}장, 음성 {made}개 생성")
