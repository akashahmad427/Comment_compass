"""Sentiment + audience insights. Free, fast, no heavy ML (fits free-tier RAM)."""
import re
from collections import Counter
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

_vader = SentimentIntensityAnalyzer()

STOP = set("""a about above after again all also am an and any are as at be because been before being below
between both but by can could did do does doing down during each few for from further had has have having he her
here hers him his how i if in into is it its just me more most my no nor not now of off on once only or other our
out over own same she should so some such than that the their them then there these they this those through to too
under until up very was we were what when where which while who why will with would you your youre dont im ive
video videos watch watching channel really like one get got make thing things much even still lol""".split())

REQUEST_PAT = re.compile(
    r"\b(please (make|do|cover|show|explain)|can you (make|do|cover|show|explain)|could you (make|do|cover|show)|"
    r"make a (video|tutorial|part)|do a (video|tutorial)|next video|part 2|part two|would love to see|"
    r"i want to see|tutorial on|how about (a|making)|you should (make|do|cover))\b", re.I)

THEMES = {
    "audio quality": ["audio", "sound", "volume", "mic", "microphone", "echo", "noise", "loud", "quiet", "music too"],
    "video quality": ["blurry", "resolution", "quality", "lighting", "dark", "camera", "pixel", "4k", "1080"],
    "pacing & length": ["boring", "slow", "too long", "dragged", "drag", "skip", "rambling", "intro", "filler", "fast forward", "too fast"],
    "editing": ["edit", "editing", "cut", "transition", "zoom", "jump cut"],
    "clickbait / title": ["clickbait", "misleading", "thumbnail", "title", "waste of time"],
    "sponsors & ads": ["sponsor", "ad", "ads", "advert", "promo"],
    "clarity of explanation": ["confusing", "confused", "unclear", "didn't understand", "explain better", "lost me"],
}

ADVICE = {
    "audio quality": "Improve audio: use a lapel or USB mic, record in a quiet room, and keep background music lower than your voice.",
    "video quality": "Improve picture quality: add soft front lighting, shoot at 1080p or higher, and check focus before recording.",
    "pacing & length": "Tighten the pacing: cut the intro to under 15 seconds, remove filler, and state the video's promise in the first 10 seconds.",
    "editing": "Refine editing: smoother cuts, fewer abrupt jumps, and use on-screen text to keep attention.",
    "clickbait / title": "Align title and thumbnail with the content. Viewers feel misled, which hurts retention and trust.",
    "sponsors & ads": "Move sponsor segments to the end or keep them short and clearly labeled.",
    "clarity of explanation": "Explain step by step, show examples on screen, and recap the key point at the end.",
}


def _has(text: str, kws) -> bool:
    return any(re.search(r"\b" + re.escape(k) + r"\b", text) for k in kws)


def _words(text: str):
    return [w for w in re.findall(r"[a-z']{3,}", text.lower()) if w not in STOP]


def _top_terms(texts, n=10):
    uni, bi = Counter(), Counter()
    for t in texts:
        ws = _words(t)
        uni.update(set(ws))
        bi.update(set(zip(ws, ws[1:])))
    terms = [(w, c) for w, c in uni.most_common(n * 2) if c >= 2]
    terms += [(" ".join(b), c) for b, c in bi.most_common(n) if c >= 2]
    terms.sort(key=lambda x: -x[1])
    seen, res = set(), []
    for w, c in terms:
        if w in seen:
            continue
        seen.add(w)
        res.append({"term": w, "count": c})
    return res[:n]


QUOTE_MAX = 600   # long enough to read as a real quote; longer ones end with an ellipsis


def _clip(text: str) -> str:
    text = text.strip()
    return text if len(text) <= QUOTE_MAX else text[: QUOTE_MAX - 1].rstrip() + "…"

def analyze(comments: list[dict]) -> dict:
    pos, neg, neu = [], [], []
    for c in comments:
        score = _vader.polarity_scores(c["text"])["compound"]
        item = {"text": c["text"][:300], "likes": c["likes"], "score": round(score, 3)}
        (pos if score >= 0.05 else neg if score <= -0.05 else neu).append(item)

    total = len(comments) or 1
    texts = [c["text"] for c in comments]
    low = [t.lower() for t in texts]

    requests = [c["text"][:200] for c in comments if REQUEST_PAT.search(c["text"])]
    questions = [c["text"][:200] for c in comments if "?" in c["text"]]

    neg_texts = [i["text"].lower() for i in neg]
    theme_hits = {}
    for theme, kws in THEMES.items():
        n_neg = sum(_has(t, kws) for t in neg_texts)
        n_all = sum(_has(t, kws) for t in low)
        if n_all:
            theme_hits[theme] = {"negative": n_neg, "all": n_all}

    result = {
        "topics": _top_terms(texts),
        "positive_topics": _top_terms([i["text"] for i in pos], 6),
        "negative_topics": _top_terms([i["text"] for i in neg], 6),
        "requests": requests[:8],
        "request_count": len(requests),
        "questions": questions[:6],
        "question_count": len(questions),
        "themes": theme_hits,
        "top_positive": sorted(pos, key=lambda x: -x["likes"])[:3],
        "top_negative": sorted(neg, key=lambda x: -x["likes"])[:3],
    }
    result["suggestions"] = build_suggestions(len(pos), len(neg), total, result)
    return {"positive": len(pos), "negative": len(neg), "neutral": len(neu), "result": result}


def build_suggestions(p, n, total, r) -> list[dict]:
    out = []
    neg_ratio, pos_ratio = n / total, p / total

    if neg_ratio > 0.25:
        out.append({"priority": "high", "title": "Negative feedback is high",
                    "text": f"{neg_ratio:.0%} of comments are negative. Read the top negative comments and address the main complaint in your next video or a pinned comment."})
    elif pos_ratio > 0.65:
        out.append({"priority": "low", "title": "Your audience loves this format",
                    "text": f"{pos_ratio:.0%} of comments are positive. Repeat this style, topic, and structure in your next videos."})

    for theme, h in sorted(r["themes"].items(), key=lambda x: -x[1]["negative"]):
        if h["negative"] >= 2 or h["negative"] / total >= 0.03:
            out.append({"priority": "high" if h["negative"] >= 5 else "medium",
                        "title": f"Fix {theme}",
                        "text": f"{h['negative']} negative comments mention {theme}. {ADVICE[theme]}"})

    if r["request_count"]:
        out.append({"priority": "high", "title": "Your audience is asking for new videos",
                    "text": f"{r['request_count']} viewers asked for specific content. Turn the requests below into your next video ideas."})
    if r["question_count"] / total >= 0.1:
        out.append({"priority": "medium", "title": "Answer common questions",
                    "text": "Over 10% of comments are questions. Pin an FAQ comment, reply to the top ones, or make a follow-up video answering them."})
    if r["topics"]:
        top = ", ".join(t["term"] for t in r["topics"][:3])
        out.append({"priority": "medium", "title": "Lean into what people talk about",
                    "text": f"Most-discussed topics: {top}. Use these words in titles, thumbnails, and your next video's hook."})
    out.append({"priority": "low", "title": "Keep the conversation going",
                "text": "Ask a specific question near the end of the video. Videos with active comment sections get recommended more."})
    return out
