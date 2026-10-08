import re
import httpx
from ..core.config import YOUTUBE_API_KEY

API = "https://www.googleapis.com/youtube/v3"
ID_RE = re.compile(r"(?:v=|youtu\.be/|shorts/|embed/|live/)([A-Za-z0-9_-]{11})")


def extract_video_id(url: str) -> str:
    url = url.strip()
    if re.fullmatch(r"[A-Za-z0-9_-]{11}", url):
        return url
    m = ID_RE.search(url)
    if not m:
        raise ValueError("That doesn't look like a YouTube video link.")
    return m.group(1)


def _get(path: str, params: dict) -> dict:
    r = httpx.get(f"{API}/{path}", params={**params, "key": YOUTUBE_API_KEY}, timeout=20)
    print("===========================  ", r.url)
    if r.status_code == 403:
        reason = r.json().get("error", {}).get("errors", [{}])[0].get("reason", "")
        if reason == "commentsDisabled":
            raise ValueError("Comments are turned off for this video.")
        if reason in ("quotaExceeded", "dailyLimitExceeded"):
            raise ValueError("Our YouTube quota is used up for today. Try again tomorrow.")
        raise ValueError("YouTube refused the request. Check the API key.")
    if r.status_code == 404:
        raise ValueError("Video not found.")
    r.raise_for_status()
    return r.json()


def fetch_meta(video_id: str) -> dict:
    data = _get("videos", {"part": "snippet", "id": video_id})
    if not data.get("items"):
        raise ValueError("Video not found or is private.")
    s = data["items"][0]["snippet"]
    return {"title": s.get("title", ""), "channel": s.get("channelTitle", "")}


def fetch_comments(video_id: str, limit: int) -> list[dict]:
    out, token = [], None
    while len(out) < limit:
        params = {"part": "snippet", "videoId": video_id, "maxResults": 100,
                  "order": "relevance", "textFormat": "plainText"}
        if token:
            params["pageToken"] = token
        data = _get("commentThreads", params)
        for it in data.get("items", []):
            c = it["snippet"]["topLevelComment"]["snippet"]
            out.append({"text": c.get("textDisplay", ""), "likes": c.get("likeCount", 0)})
        token = data.get("nextPageToken")
        if not token:
            break
    return out[:limit]
