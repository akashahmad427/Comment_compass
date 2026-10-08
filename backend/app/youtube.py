import logging
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
    try:
        r = httpx.get(f"{API}/{path}", params={**params, "key": YOUTUBE_API_KEY}, timeout=20)
    except httpx.RequestError:
        raise ValueError("Could not reach YouTube. Please try again in a moment.")

    if r.status_code >= 400:
        try:
            err = r.json().get("error", {})
        except ValueError:
            err = {}
        reason = (err.get("errors") or [{}])[0].get("reason", "")
        message = err.get("message", "")
        # Never log r.url: it contains the API key.
        logging.warning("YouTube API error %s on %s: %s", r.status_code, path, reason or message[:80])

        if reason == "commentsDisabled":
            raise ValueError("Comments are turned off for this video.")
        if reason in ("quotaExceeded", "dailyLimitExceeded", "rateLimitExceeded"):
            raise ValueError("Our YouTube quota is used up for today. Please try again tomorrow.")
        if reason in ("videoNotFound", "notFound") or r.status_code == 404:
            raise ValueError("Video not found or is private.")
        if reason in ("keyInvalid", "accessNotConfigured") or "API key" in message:
            raise ValueError("The service has a YouTube configuration problem. Please contact support.")
        raise ValueError("YouTube could not process this video. Please try another one.")
    return r.json()


def fetch_meta(video_id: str) -> dict:
    data = _get("videos", {"part": "snippet,statistics", "id": video_id})
    if not data.get("items"):
        raise ValueError("Video not found or is private.")
    item = data["items"][0]
    s = item["snippet"]
    raw_count = item.get("statistics", {}).get("commentCount")
    return {
        "title": s.get("title", ""),
        "channel": s.get("channelTitle", ""),
        # YouTube's own total: includes every reply. None when the video hides it.
        "comment_count": int(raw_count) if raw_count is not None else None,
    }


def fetch_comments(video_id: str, limit: int) -> list[dict]:
    """Top-level comments plus the replies YouTube returns inline (up to 5 per thread).

    Asking for "snippet,replies" costs the same quota as "snippet" alone.
    """
    out, token = [], None
    while len(out) < limit:
        params = {"part": "snippet,replies", "videoId": video_id, "maxResults": 100,
                  "order": "relevance", "textFormat": "plainText"}
        if token:
            params["pageToken"] = token
        data = _get("commentThreads", params)
        for it in data.get("items", []):
            c = it["snippet"]["topLevelComment"]["snippet"]
            out.append({"text": c.get("textDisplay", ""), "likes": c.get("likeCount", 0), "is_reply": False})
            for rep in it.get("replies", {}).get("comments", []):
                rs = rep["snippet"]
                out.append({"text": rs.get("textDisplay", ""), "likes": rs.get("likeCount", 0), "is_reply": True})
        token = data.get("nextPageToken")
        if not token:
            break
    return out[:limit]