"""
Axiora AI Chatbot — Backend API Contract
=========================================
This is the RECOMMENDED server-side proxy pattern.
Never expose raw OpenAI/Gemini/Claude API keys to the browser.

POST /api/chat
--------------
The frontend sends this payload:

  {
    "message": "How do I create a survey?",
    "history": [
      { "role": "user",      "content": "Hi!"            },
      { "role": "assistant", "content": "Hello! How can I help?" }
    ]
  }

Expected response (200 OK):

  {
    "reply": "To create a survey, click the **New Survey** button...",
    "quickReplies": ["Tell me more", "See pricing", "Contact support"]
  }

Error response (4xx / 5xx):

  { "error": "Rate limit exceeded. Please try again later." }

Security notes:
  - Validate & sanitize `message` length (max 2000 chars)
  - Limit `history` depth (max 20 turns)
  - Rate-limit per IP or per user session
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field, validator
from typing import Literal
import re
from sqlalchemy.orm import Session

from db.database import get_db
from db.models import ChatbotQA

router = APIRouter()

# ── Request / Response models ──────────────────────────────────────
class HistoryItem(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(..., max_length=4000)

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    history: list[HistoryItem] = Field(default=[], max_items=20)

    @validator("history")
    def trim_history(cls, v):
        return v[-20:]  # Keep last 20 turns max

class ChatResponse(BaseModel):
    reply: str
    quickReplies: list[str] = []

@router.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(body: ChatRequest, db: Session = Depends(get_db)):
    qa_match = _find_chatbot_qa(body.message, db)
    if qa_match:
        return ChatResponse(reply=qa_match.answer, quickReplies=qa_match.quick_replies or [])

    return ChatResponse(
        reply="Sorry, I don't have an answer for that in the Axiora Pulse knowledge base yet.",
        quickReplies=["How do I create a survey?", "How do I view analytics?", "How do I invite team members?"]
    )


def _tokenize_text(text: str) -> list[str]:
    return re.findall(r"\b[a-z0-9]{3,}\b", text.lower())


def _find_chatbot_qa(message: str, db: Session, tenant_id: str | None = None):
    normalized = re.sub(r"[^a-z0-9 ]", " ", message.strip().lower())
    message_tokens = set(_tokenize_text(normalized))

    query = db.query(ChatbotQA).filter(
        (ChatbotQA.is_active.is_(True)) | (ChatbotQA.is_active.is_(None))
    )

    if tenant_id:
        query = query.filter((ChatbotQA.tenant_id == tenant_id) | (ChatbotQA.tenant_id.is_(None)))
    else:
        query = query.filter(ChatbotQA.tenant_id.is_(None))

    best_match = None
    best_score = 0

    for qa in query.order_by(ChatbotQA.sort_order.asc()).all():
        if not qa.question:
            continue

        score = 0
        question_text = re.sub(r"[^a-z0-9 ]", " ", qa.question.lower()).strip()

        if question_text == normalized:
            return qa

        if question_text and question_text in normalized:
            score += 20

        if qa.keywords:
            for keyword in qa.keywords:
                if not keyword:
                    continue
                kw = keyword.strip().lower()
                if re.search(rf"\b{re.escape(kw)}\b", normalized):
                    score += 15

        for word in _tokenize_text(question_text):
            if word in message_tokens:
                score += 3

        if score > best_score:
            best_score = score
            best_match = qa

    return best_match if best_score >= 10 else None


# ── Health check ──────────────────────────────────────────────────
@router.get("/api/health")
async def health():
    return {"status": "ok", "service": "axiora-chat-proxy"}
