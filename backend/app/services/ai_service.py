from collections.abc import AsyncIterator
import asyncio
import json
import re
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from google import genai
from google.genai import types
from langchain_google_genai import ChatGoogleGenerativeAI

from app.schemas.quiz import QuizQuestion
from app.services.vector_store import SearchMatch

SUMMARIZE_PROMPT = """
You are an AI assistant specialized in summarizing educational and technical books.
Summarize the following book excerpt:

{context}

Return the answer in this format:
## Main Ideas
- [bullet points]

## Key Concepts
- [concept name]: [short explanation]

## Action Items
- [practical actions the reader can apply immediately]
"""

QUIZ_PROMPT = """
Create {num_questions} multiple-choice questions from the following content.
Output a JSON array in this exact format:
[{{"question": "...", "options": ["A","B","C","D"], "answer": 0, "explanation": "..."}}]

Content:
{context}
"""

ENTITY_PROMPT = """
Extract entities and relationships from the following text.
Output JSON: {{"entities": ["name1","name2"], "relations": [["entity1","relation","entity2"]]}}

Text:
{text}
"""

CHAT_PROMPT = """
You are an AI reading assistant. Answer the user's question using only the provided book excerpts.
If the excerpts do not contain enough information, say that the book excerpts do not provide enough evidence.
Keep the answer concise, useful, and grounded in the cited pages.

Book excerpts:
{context}

Question:
{question}

Return the answer in plain English. Mention page numbers when they are useful.
"""

SUMMARY_MODEL = "gemini-2.5-flash"
QUIZ_MODEL = "gemini-2.5-flash"
CHAT_MODEL = "gemini-2.5-flash"
OPENROUTER_CHAT_MODEL = "openrouter/free"
OPENROUTER_CHAT_URL = "https://openrouter.ai/api/v1/chat/completions"

FULL_BOOK_CHUNK_PROMPT = """
You are creating a source-grounded study summary for part of a book.
Summarize this excerpt clearly and densely.

Include:
## Section Summary
- 4-8 bullets covering the important ideas

## Key Concepts
- concept: brief explanation

## Questions to Remember
- 2-4 useful review questions

Book excerpt:
{context}
"""

FULL_BOOK_FINAL_PROMPT = """
You are creating a NotebookLM-style study guide from partial summaries of a full book.
Synthesize the partial summaries into one coherent answer.

Return this exact structure:
## Big Picture
- the core thesis and purpose of the book

## Chapter / Section Flow
- explain how the ideas progress through the book

## Key Concepts
- concept: concise explanation

## Practical Takeaways
- concrete actions or lessons

## Review Questions
- questions that help the reader remember and test understanding

Partial summaries:
{context}
"""

GEMINI_FULL_PDF_PROMPT = """
Create a NotebookLM-style study guide for this full book.

Use the entire PDF, including structure, headings, tables, diagrams, and captions when visible.
Be accurate and source-grounded. Do not invent chapters or claims that are not supported by the book.

Return this exact structure:
## Big Picture
- core thesis, purpose, and intended reader

## Book Structure
- explain the major sections or chapter flow

## Detailed Summary
- the important ideas in the order the book develops them

## Key Concepts
- concept: concise explanation

## Practical Takeaways
- concrete lessons or actions the reader can apply

## Review Questions
- questions that help remember and test understanding
"""


class AIServiceError(Exception):
    pass


class OpenRouterChatClient:
    def __init__(self, api_key: str, model_name: str = OPENROUTER_CHAT_MODEL, app_name: str = "Gemany Reading App") -> None:
        self.api_key = api_key
        self.model_name = model_name
        self.app_name = app_name

    async def generate(self, prompt: str, temperature: float = 0.2, max_tokens: int = 1800) -> str:
        return await asyncio.to_thread(self._generate_sync, prompt, temperature, max_tokens)

    def _generate_sync(self, prompt: str, temperature: float, max_tokens: int) -> str:
        payload = json.dumps(
            {
                "model": self.model_name,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": temperature,
                "max_tokens": max_tokens,
            }
        ).encode("utf-8")
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": self.app_name,
        }
        request = Request(OPENROUTER_CHAT_URL, data=payload, headers=headers, method="POST")

        try:
            with urlopen(request, timeout=120) as response:
                response_payload = json.loads(response.read().decode("utf-8"))
        except HTTPError as exc:
            raise AIServiceError(f"OpenRouter chat request failed with HTTP {exc.code}: {read_http_error(exc)}") from exc
        except (URLError, TimeoutError) as exc:
            raise AIServiceError(f"Unable to reach OpenRouter: {exc}") from exc
        except json.JSONDecodeError as exc:
            raise AIServiceError("OpenRouter returned an invalid chat response.") from exc

        return parse_openrouter_chat_response(response_payload)


def build_book_context(page_texts: list[tuple[int, str]], max_chars: int) -> str:
    context_parts: list[str] = []
    used_chars = 0

    for page_number, text in page_texts:
        clean_text = text.strip()
        if not clean_text:
            continue

        page_block = f"[Page {page_number}]\n{clean_text}"
        remaining_chars = max_chars - used_chars
        if remaining_chars <= 0:
            break

        if len(page_block) > remaining_chars:
            page_block = page_block[:remaining_chars].rstrip()

        context_parts.append(page_block)
        used_chars += len(page_block)

    return "\n\n".join(context_parts).strip()


async def generate_full_book_summary(
    page_texts: list[tuple[int, str]],
    openrouter_api_key: str,
    openrouter_model_name: str = OPENROUTER_CHAT_MODEL,
    openrouter_app_name: str = "Gemany Reading App",
    gemini_api_key: str = "",
    gemini_model_name: str = SUMMARY_MODEL,
    pages_per_chunk: int = 10,
    max_chunk_chars: int = 45000,
    max_parallel_requests: int = 5,
) -> str:
    if not page_texts:
        raise AIServiceError("No extractable text was found for full-book summarization.")
    if not openrouter_api_key and not gemini_api_key:
        raise AIServiceError("OPENROUTER_API_KEY or GEMINI_API_KEY is required to summarize the full book.")

    page_groups = group_pages_for_summary(page_texts, pages_per_chunk=pages_per_chunk, max_chars=max_chunk_chars)
    if not page_groups:
        raise AIServiceError("No extractable text was found for full-book summarization.")

    semaphore = asyncio.Semaphore(max_parallel_requests)
    client = (
        OpenRouterChatClient(openrouter_api_key, openrouter_model_name, openrouter_app_name)
        if openrouter_api_key
        else None
    )

    async def summarize_group(group_index: int, group: list[tuple[int, str]]) -> str:
        async with semaphore:
            first_page = group[0][0]
            last_page = group[-1][0]
            context = build_book_context(group, max_chunk_chars)
            prompt = FULL_BOOK_CHUNK_PROMPT.format(context=context)
            summary = await generate_text_with_provider(
                prompt=prompt,
                openrouter_client=client,
                gemini_api_key=gemini_api_key,
                gemini_model_name=gemini_model_name,
                max_tokens=1800,
            )
            return f"## Part {group_index + 1}: pages {first_page}-{last_page}\n{summary.strip()}"

    partial_summaries = await asyncio.gather(
        *(summarize_group(group_index, group) for group_index, group in enumerate(page_groups))
    )
    final_context = "\n\n".join(partial_summaries)
    final_prompt = FULL_BOOK_FINAL_PROMPT.format(context=final_context)
    return await generate_text_with_provider(
        prompt=final_prompt,
        openrouter_client=client,
        gemini_api_key=gemini_api_key,
        gemini_model_name=gemini_model_name,
        max_tokens=3000,
    )


async def generate_full_pdf_summary_with_gemini(
    file_path: str,
    gemini_api_key: str,
    model_name: str = SUMMARY_MODEL,
) -> str:
    if not gemini_api_key:
        raise AIServiceError("GEMINI_API_KEY is required to summarize the full PDF.")

    return await asyncio.to_thread(generate_full_pdf_summary_with_gemini_sync, file_path, gemini_api_key, model_name)


def generate_full_pdf_summary_with_gemini_sync(file_path: str, gemini_api_key: str, model_name: str) -> str:
    client = genai.Client(api_key=gemini_api_key)

    try:
        uploaded_file = client.files.upload(
            file=file_path,
            config=types.UploadFileConfig(mime_type="application/pdf"),
        )
        response = client.models.generate_content(
            model=model_name,
            contents=[uploaded_file, GEMINI_FULL_PDF_PROMPT],
        )
    except Exception as exc:
        raise AIServiceError(f"Unable to summarize the full PDF with Gemini: {exc}") from exc

    text = getattr(response, "text", "")
    if not isinstance(text, str) or not text.strip():
        raise AIServiceError("Gemini returned an empty full-book summary.")

    return text.strip()


async def generate_text_with_provider(
    prompt: str,
    openrouter_client: OpenRouterChatClient | None,
    gemini_api_key: str,
    gemini_model_name: str,
    max_tokens: int,
) -> str:
    if openrouter_client is not None:
        return await openrouter_client.generate(prompt, max_tokens=max_tokens)

    model = ChatGoogleGenerativeAI(
        model=gemini_model_name,
        google_api_key=gemini_api_key,
        temperature=0.2,
        max_output_tokens=max_tokens,
    )
    try:
        response = await model.ainvoke(prompt)
    except Exception as exc:
        raise AIServiceError("Unable to generate full-book summary from Gemini.") from exc

    return normalize_model_content(response.content)


def group_pages_for_summary(
    page_texts: list[tuple[int, str]],
    pages_per_chunk: int,
    max_chars: int,
) -> list[list[tuple[int, str]]]:
    groups: list[list[tuple[int, str]]] = []
    current_group: list[tuple[int, str]] = []
    current_chars = 0

    for page_number, text in page_texts:
        clean_text = text.strip()
        if not clean_text:
            continue

        page_chars = len(clean_text)
        group_is_full = len(current_group) >= pages_per_chunk or current_chars + page_chars > max_chars
        if current_group and group_is_full:
            groups.append(current_group)
            current_group = []
            current_chars = 0

        if page_chars > max_chars:
            clean_text = clean_text[:max_chars].rstrip()
            page_chars = len(clean_text)

        current_group.append((page_number, clean_text))
        current_chars += page_chars

    if current_group:
        groups.append(current_group)

    return groups


async def stream_summary(context: str, gemini_api_key: str, model_name: str = SUMMARY_MODEL) -> AsyncIterator[str]:
    if not gemini_api_key:
        raise AIServiceError("GEMINI_API_KEY is required to summarize book text.")

    if not context.strip():
        raise AIServiceError("No extractable text was found for summarization.")

    model = ChatGoogleGenerativeAI(
        model=model_name,
        google_api_key=gemini_api_key,
        temperature=0.2,
    )
    prompt = SUMMARIZE_PROMPT.format(context=context)

    try:
        async for chunk in model.astream(prompt):
            content = chunk.content
            if isinstance(content, str):
                yield content
            elif isinstance(content, list):
                yield "".join(format_content_part(part) for part in content)
    except Exception as exc:
        raise AIServiceError("Unable to stream the summary from Gemini.") from exc


def format_content_part(part: object) -> str:
    if isinstance(part, dict) and isinstance(part.get("text"), str):
        return part["text"]
    if isinstance(part, dict):
        return ""
    return str(part)


async def generate_quiz_questions(
    context: str,
    num_questions: int,
    gemini_api_key: str,
    model_name: str = QUIZ_MODEL,
) -> list[QuizQuestion]:
    if not gemini_api_key:
        raise AIServiceError("GEMINI_API_KEY is required to generate quiz questions.")

    if not context.strip():
        raise AIServiceError("No extractable text was found for quiz generation.")

    model = ChatGoogleGenerativeAI(
        model=model_name,
        google_api_key=gemini_api_key,
        temperature=0.3,
    )
    prompt = QUIZ_PROMPT.format(num_questions=num_questions, context=context)

    try:
        response = await model.ainvoke(prompt)
    except Exception as exc:
        raise AIServiceError("Unable to generate quiz questions from Gemini.") from exc

    content = response.content
    raw_text = normalize_model_content(content)

    return parse_quiz_json(raw_text)


def parse_quiz_json(raw_text: str) -> list[QuizQuestion]:
    cleaned = extract_json_payload(raw_text)

    try:
        payload = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        raise AIServiceError("Gemini returned quiz output that was not valid JSON.") from exc

    if not isinstance(payload, list):
        raise AIServiceError("Gemini quiz output must be a JSON array.")

    questions: list[QuizQuestion] = []
    for item in payload:
        if not isinstance(item, dict):
            raise AIServiceError("Each quiz item must be a JSON object.")
        try:
            questions.append(QuizQuestion.model_validate(item))
        except Exception as exc:
            raise AIServiceError("Gemini returned a quiz item with an invalid shape.") from exc

    if not questions:
        raise AIServiceError("Gemini returned no quiz questions.")

    return questions


def extract_json_payload(raw_text: str) -> str:
    text = raw_text.strip()
    fenced_match = re.search(r"```(?:json)?\s*(.*?)```", text, flags=re.DOTALL | re.IGNORECASE)
    if fenced_match:
        return fenced_match.group(1).strip()

    start = text.find("[")
    end = text.rfind("]")
    if start != -1 and end != -1 and start < end:
        return text[start : end + 1]

    return text


async def generate_chat_answer(
    question: str,
    matches: list[SearchMatch],
    gemini_api_key: str,
    model_name: str = CHAT_MODEL,
) -> str:
    if not gemini_api_key:
        raise AIServiceError("GEMINI_API_KEY is required to chat with a book.")

    clean_question = question.strip()
    if not clean_question:
        raise AIServiceError("Chat question cannot be empty.")

    if not matches:
        raise AIServiceError("No relevant indexed book excerpts were found for this question.")

    context = build_rag_context(matches)
    model = ChatGoogleGenerativeAI(
        model=model_name,
        google_api_key=gemini_api_key,
        temperature=0.2,
    )
    prompt = CHAT_PROMPT.format(context=context, question=clean_question)

    try:
        response = await model.ainvoke(prompt)
    except Exception as exc:
        raise AIServiceError("Unable to generate a chat answer from Gemini.") from exc

    content = response.content
    return normalize_model_content(content).strip()


async def generate_chat_answer_from_context(
    question: str,
    context: str,
    gemini_api_key: str,
    model_name: str = CHAT_MODEL,
) -> str:
    if not gemini_api_key:
        raise AIServiceError("GEMINI_API_KEY is required to chat with a book.")

    clean_question = question.strip()
    if not clean_question:
        raise AIServiceError("Chat question cannot be empty.")

    if not context.strip():
        raise AIServiceError("No extractable text was found for this question.")

    model = ChatGoogleGenerativeAI(
        model=model_name,
        google_api_key=gemini_api_key,
        temperature=0.2,
    )
    prompt = CHAT_PROMPT.format(context=context, question=clean_question)

    try:
        response = await model.ainvoke(prompt)
    except Exception as exc:
        raise AIServiceError("Unable to generate a chat answer from Gemini.") from exc

    content = response.content
    return normalize_model_content(content).strip()


def build_rag_context(matches: list[SearchMatch]) -> str:
    return "\n\n".join(
        f"[Page {match.page_number}, chunk {match.chunk_index}]\n{match.text.strip()}" for match in matches if match.text.strip()
    ).strip()


async def extract_entities_from_text(
    text: str,
    gemini_api_key: str,
    model_name: str = CHAT_MODEL,
) -> tuple[list[str], list[tuple[str, str, str]]]:
    if not gemini_api_key:
        raise AIServiceError("GEMINI_API_KEY is required to extract knowledge graph entities.")

    clean_text = text.strip()
    if not clean_text:
        raise AIServiceError("Note text cannot be empty.")

    model = ChatGoogleGenerativeAI(
        model=model_name,
        google_api_key=gemini_api_key,
        temperature=0.1,
    )
    prompt = ENTITY_PROMPT.format(text=clean_text)

    try:
        response = await model.ainvoke(prompt)
    except Exception as exc:
        raise AIServiceError("Unable to extract entities from Gemini.") from exc

    content = response.content
    raw_text = normalize_model_content(content)

    return parse_entity_json(raw_text)


def parse_entity_json(raw_text: str) -> tuple[list[str], list[tuple[str, str, str]]]:
    cleaned = extract_json_object_payload(raw_text)

    try:
        payload = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        raise AIServiceError("Gemini returned entity output that was not valid JSON.") from exc

    if not isinstance(payload, dict):
        raise AIServiceError("Gemini entity output must be a JSON object.")

    raw_entities = payload.get("entities", [])
    raw_relations = payload.get("relations", [])

    if not isinstance(raw_entities, list) or not isinstance(raw_relations, list):
        raise AIServiceError("Gemini entity output must include entities and relations arrays.")

    entities = [str(entity).strip() for entity in raw_entities if str(entity).strip()]
    deduped_entities = list(dict.fromkeys(entities))
    entity_set = {entity.lower() for entity in deduped_entities}
    relations: list[tuple[str, str, str]] = []

    for relation in raw_relations:
        if not isinstance(relation, list | tuple) or len(relation) != 3:
            continue
        source, label, target = (str(part).strip() for part in relation)
        if not source or not label or not target:
            continue
        if source.lower() not in entity_set:
            deduped_entities.append(source)
            entity_set.add(source.lower())
        if target.lower() not in entity_set:
            deduped_entities.append(target)
            entity_set.add(target.lower())
        relations.append((source, label, target))

    if not deduped_entities:
        raise AIServiceError("Gemini returned no entities.")

    return deduped_entities, relations


def extract_json_object_payload(raw_text: str) -> str:
    text = raw_text.strip()
    fenced_match = re.search(r"```(?:json)?\s*(.*?)```", text, flags=re.DOTALL | re.IGNORECASE)
    if fenced_match:
        return fenced_match.group(1).strip()

    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and start < end:
        return text[start : end + 1]

    return text


def normalize_model_content(content: object) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return "".join(format_content_part(part) for part in content)
    return str(content)


def parse_openrouter_chat_response(payload: object) -> str:
    if not isinstance(payload, dict):
        raise AIServiceError("OpenRouter chat response was not an object.")

    choices = payload.get("choices")
    if not isinstance(choices, list) or not choices:
        raise AIServiceError("OpenRouter chat response did not include choices.")

    first_choice = choices[0]
    if not isinstance(first_choice, dict):
        raise AIServiceError("OpenRouter chat response included an invalid choice.")

    message = first_choice.get("message")
    if not isinstance(message, dict):
        raise AIServiceError("OpenRouter chat response did not include a message.")

    content = message.get("content")
    if isinstance(content, str):
        return content.strip()
    if isinstance(content, list):
        return "".join(format_content_part(part) for part in content).strip()
    raise AIServiceError("OpenRouter chat response did not include text content.")


def read_http_error(exc: HTTPError) -> str:
    try:
        raw_body = exc.read().decode("utf-8", errors="replace")
    except Exception:
        return str(exc.reason)

    try:
        payload = json.loads(raw_body)
    except json.JSONDecodeError:
        return raw_body[:500]

    if isinstance(payload, dict):
        error = payload.get("error")
        if isinstance(error, dict) and error.get("message"):
            return str(error["message"])
        if payload.get("message"):
            return str(payload["message"])

    return raw_body[:500]
