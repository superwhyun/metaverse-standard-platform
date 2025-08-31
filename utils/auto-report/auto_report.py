#!/usr/bin/env python3
"""
Batch-process VTT files with OpenAI (Responses API) using prompts from conf/auto.conf.

Reads:
- Prompts from `conf/auto.conf` (INI format, [prompts] section with system_prompt and user_prompt)
- Input files from `data/` (recursively finds *.vtt)
- Environment from `.env` if present (auto-loaded)

Writes:
- Markdown results to `result/` with the same base filename and `.md` extension

Environment:
- Requires `OPENAI_API_KEY` for OpenAI SDK.
- Optional: `OPENAI_BASE_URL` if using a compatible endpoint.

CLI:
- `python auto_report.py --conf conf/auto.conf --data data --out result --model gpt-5`
"""

from __future__ import annotations

import argparse
import os
import re
import sys
import time
from pathlib import Path
from typing import Iterable

try:
    # OpenAI Python SDK v1.x
    from openai import OpenAI  # type: ignore
except Exception:  # pragma: no cover
    OpenAI = None  # type: ignore

import configparser
from typing import Optional

try:
    from dotenv import load_dotenv  # type: ignore
except Exception:  # pragma: no cover
    load_dotenv = None  # type: ignore

"""
Utilities for loading .env early so main() can rely on env vars.
"""

def _find_env_file(start: Path | None = None, limit: int = 5) -> Path | None:
    start = start or Path.cwd()
    cur = start.resolve()
    for _ in range(limit):
        candidate = cur / ".env"
        if candidate.exists():
            return candidate
        if cur.parent == cur:
            break
        cur = cur.parent
    return None


def _simple_parse_env(path: Path) -> None:
    try:
        for raw in path.read_text(encoding="utf-8", errors="ignore").splitlines():
            line = raw.strip()
            if not line or line.startswith("#"):
                continue
            if "=" not in line:
                continue
            key, val = line.split("=", 1)
            key = key.strip()
            val = val.strip().strip('"').strip("'")
            os.environ.setdefault(key, val)
    except Exception:
        pass


def _load_env_auto() -> None:
    # Try python-dotenv if available, otherwise a lightweight parser
    env_path = _find_env_file()
    if load_dotenv is not None:
        if env_path is not None:
            try:
                load_dotenv(dotenv_path=str(env_path), override=False)
                return
            except Exception:
                pass
        # fallback to default search
        try:
            load_dotenv(override=False)
            return
        except Exception:
            pass
    # fallback simple parser
    if env_path is not None:
        _simple_parse_env(env_path)


def load_prompts(conf_path: Path) -> tuple[str, str]:
    """
    설정 파일을 읽어 (system_prompt, user_prompt) 튜플을 반환한다.

    - INI 모드: [prompts] 섹션에 system_prompt, user_prompt 키가 있으면 그대로 사용
    - RAW 모드: 위 형식이 아니면 파일 전체를 system_prompt로 간주하고,
      user_prompt는 기본 템플릿을 사용한다.
    """
    if not conf_path.exists():
        raise FileNotFoundError(f"Config not found: {conf_path}")

    text = conf_path.read_text(encoding="utf-8", errors="ignore")
    # 빠른 감지: [prompts]로 시작하거나 포함하면 INI 시도
    if "[prompts]" in text:
        parser = configparser.ConfigParser()
        try:
            parser.read_string(text)
            if "prompts" in parser:
                section = parser["prompts"]
                system_prompt = section.get("system_prompt", "").strip()
                user_prompt = section.get("user_prompt", "").strip()
                if system_prompt and user_prompt:
                    return system_prompt, user_prompt
        except Exception:
            # INI 파싱 실패 시 RAW로 폴백
            pass

    # RAW 모드: 파일 전체를 시스템 프롬프트로 사용
    system_prompt = text.strip()
    # 첨부 파일(file_search)을 활용하도록 기본 사용자 프롬프트 제공
    user_prompt = (
        "첨부된 전사 파일을 file_search 도구로 검색해 내용을 활용하여 Markdown 문서를 작성해 주세요.\n"
        "파일명: {filename}\n"
        "요구사항: 제목, 요약, 핵심 포인트, 결정 사항, 액션 아이템, Technical Details, 주의할 점(note)을 포함하세요."
    )
    return system_prompt, user_prompt


_TIME_RE = re.compile(r"\d{2}:\d{2}:\d{2}\.\d{3}\s+-->\s+\d{2}:\d{2}:\d{2}\.\d{3}")


def parse_vtt_to_text(lines: Iterable[str]) -> str:
    """Very lightweight VTT-to-text extractor.

    - Skips WEBVTT header, NOTE/STYLE/REGION blocks, cue timings, sequence numbers
    - Returns joined plain text with normalized spaces
    """
    out: list[str] = []
    skip_block = None  # type: str | None
    for raw in lines:
        line = raw.rstrip("\n")
        if not line.strip():
            # Preserve paragraph breaks lightly
            if out and out[-1] != "":
                out.append("")
            continue

        u = line.strip()

        # Headers / blocks
        if skip_block:
            if u.upper().startswith("NOTE") and skip_block == "NOTE":
                # still in NOTE; continue until blank line (handled above)
                continue
            if skip_block in {"STYLE", "REGION"}:
                # simple handling: skip until blank line (handled above)
                continue
        if u.upper().startswith("WEBVTT"):
            continue
        if u.upper().startswith("NOTE"):
            skip_block = "NOTE"
            continue
        if u.upper().startswith("STYLE"):
            skip_block = "STYLE"
            continue
        if u.upper().startswith("REGION"):
            skip_block = "REGION"
            continue
        if _TIME_RE.search(u):
            # timing line
            skip_block = None
            continue
        if u.isdigit():
            # sequence number
            continue

        # text line
        skip_block = None
        out.append(u)

    # collapse extra empties and join
    # Also remove duplicate consecutive lines sometimes present in VTTs
    cleaned: list[str] = []
    prev = None
    for line in out:
        if line == prev:
            continue
        prev = line
        cleaned.append(line)

    # Normalize extra blank lines (max 1)
    normalized: list[str] = []
    blank = False
    for line in cleaned:
        if line.strip() == "":
            if not blank:
                normalized.append("")
                blank = True
        else:
            normalized.append(line)
            blank = False

    return "\n".join(normalized).strip()


def format_user_prompt(template: str, filename: str, content: str) -> str:
    try:
        return template.format(filename=filename, content=content)
    except Exception:
        # Fall back to appending content if placeholders missing/malformed
        return f"{template}\n\nTranscript ({filename}):\n\n{content}"


def call_openai(
    prompt_input: str,
    model: str,
    request_timeout: Optional[float] = None,
    verbose: bool = True,
    max_retries: int = 2,
    attachments: Optional[list] = None,
    tools: Optional[list] = None,
) -> str:
    """Responses API 호출. 단일 문자열 입력과 파일 첨부(attachments)를 지원한다."""
    if OpenAI is None:
        raise RuntimeError(
            "openai SDK not installed in this environment. Install with `pip install -r requirements.txt` (ensure the same venv is active)."
        )
    if not os.getenv("OPENAI_API_KEY"):
        raise EnvironmentError("OPENAI_API_KEY is not set (load from .env or env)")

    timeout = request_timeout if request_timeout is not None else 90.0

    if verbose:
        print(
            f"[debug] OpenAI client init. model={model} base_url={os.getenv('OPENAI_BASE_URL') or 'default'}",
            file=sys.stderr,
            flush=True,
        )
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    last_err: Optional[Exception] = None
    for attempt in range(1, max_retries + 1):
        try:
            size = len(prompt_input) if isinstance(prompt_input, str) else 0
            if verbose:
                print(
                    f"[debug] Sending Responses request (attempt {attempt}/{max_retries})… timeout={timeout} bytes={size} attachments={len(attachments or [])}",
                    file=sys.stderr,
                    flush=True,
                )
            if attachments:
                content_items = [
                    {"type": "input_text", "text": prompt_input}
                ]
                for att in attachments:
                    fid = att.get("file_id") if isinstance(att, dict) else None
                    if fid:
                        content_items.append({"type": "input_file", "file_id": fid})
                input_payload = [{"role": "user", "content": content_items}]
            else:
                input_payload = prompt_input

            resp = client.responses.create(
                model=model,
                input=input_payload,
                tools=tools,
                timeout=timeout,
            )  # type: ignore[arg-type]

            # Prefer convenience property if present
            text = getattr(resp, "output_text", None)
            if isinstance(text, str) and text.strip():
                if verbose:
                    print("[debug] Responses: received output_text.", file=sys.stderr, flush=True)
                return text.strip()

            # Fallback: collect text segments from structured output
            chunks: list[str] = []
            for item in getattr(resp, "output", []) or []:
                for part in getattr(item, "content", []) or []:
                    t: Optional[str] = getattr(getattr(part, "text", None), "value", None)
                    if isinstance(t, str) and t:
                        chunks.append(t)
            if chunks:
                if verbose:
                    print("[debug] Responses: collected text chunks.", file=sys.stderr, flush=True)
                return "".join(chunks).strip()
            raise RuntimeError("No text content in OpenAI response")

            raise RuntimeError("No text content in OpenAI response")
        except Exception as e:
            last_err = e
            if attempt < max_retries:
                # 짧은 지수 백오프
                backoff = min(2 ** attempt, 8)
                if verbose:
                    print(
                        f"[warn] OpenAI call failed (attempt {attempt}): {e}. retrying in {backoff}s…",
                        file=sys.stderr,
                        flush=True,
                    )
                time.sleep(backoff)
            else:
                if verbose:
                    print(
                        f"[error] OpenAI call failed after {max_retries} attempt(s): {e}",
                        file=sys.stderr,
                        flush=True,
                    )
                raise last_err


 


def _get_openai_client() -> "OpenAI":
    if OpenAI is None:
        raise RuntimeError(
            "openai SDK not installed in this environment. Install with `pip install -r requirements.txt` and activate your venv."
        )
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise EnvironmentError("OPENAI_API_KEY is not set (.env or environment)")
    return OpenAI(api_key=api_key)  # type: ignore


def process_file(
    vtt_path: Path,
    out_dir: Path,
    system_prompt: str,
    user_prompt_tmpl: str,
    model: str,
    request_timeout: Optional[float] = None,
    verbose: bool = True,
    use_attachments: bool = True,
) -> Path:
    if use_attachments:
        if verbose:
            print(f"[debug] Uploading file for attachment: {vtt_path}", file=sys.stderr, flush=True)
        client = _get_openai_client()
        upload_path = vtt_path
        allowed_exts = {"c","cpp","css","csv","doc","docx","gif","go","html","java","jpeg","jpg","js","json","md","pdf","php","pkl","png","pptx","py","rb","tar","tex","ts","txt","webp","xlsx","xml","zip"}
        if vtt_path.suffix.lower().lstrip(".") not in allowed_exts:
            # Create a temporary .txt copy for upload
            tmp_dir = Path(".tmp_uploads")
            tmp_dir.mkdir(exist_ok=True)
            upload_path = tmp_dir / (vtt_path.stem + ".txt")
            try:
                upload_path.write_text(vtt_path.read_text(encoding="utf-8", errors="ignore"), encoding="utf-8")
                if verbose:
                    print(f"[debug] Converted to uploadable: {upload_path}", file=sys.stderr, flush=True)
            except Exception as e:
                print(f"[error] failed to prepare upload file: {e}", file=sys.stderr)
                raise
        # Create a temporary vector store and upload the file into it for retrieval
        vs = client.vector_stores.create(name=f"auto-report-{vtt_path.stem}")
        if verbose:
            print(f"[debug] Created vector store: {vs.id}", file=sys.stderr, flush=True)
        # Upload and ensure indexing is complete
        try:
            if hasattr(client.vector_stores, "file_batches") and hasattr(client.vector_stores.file_batches, "upload_and_poll"):
                with upload_path.open("rb") as f:
                    client.vector_stores.file_batches.upload_and_poll(vector_store_id=vs.id, files=[f])
                if verbose:
                    print(f"[debug] Uploaded via file_batches.upload_and_poll", file=sys.stderr, flush=True)
            else:
                with upload_path.open("rb") as f:
                    _ = client.vector_stores.files.upload(vector_store_id=vs.id, file=f)
                # Poll for readiness
                for attempt in range(30):
                    flist = client.vector_stores.files.list(vector_store_id=vs.id)
                    statuses = [getattr(getattr(it, "status", None), "value", getattr(it, "status", None)) for it in getattr(flist, "data", [])]
                    if verbose:
                        print(f"[debug] Indexing poll {attempt+1}: statuses={statuses}", file=sys.stderr, flush=True)
                    # consider completed or ready if no 'in_progress' present
                    if statuses and all(str(s).lower() in ("completed", "ready", "processed") for s in statuses):
                        break
                    time.sleep(2)
        except Exception as e:
            print(f"[error] vector store upload/indexing failed: {e}", file=sys.stderr)
            raise
        # Build prompt instructing to use the attached file via file_search
        base_user = format_user_prompt(user_prompt_tmpl, vtt_path.name, "")
        attach_instruction = "첨부된 전사 파일을 file_search 도구로 검색해 내용을 활용해 주세요. 본문 텍스트는 입력에 포함되어 있지 않으니 반드시 첨부 파일을 참조하세요."
        user_prompt = f"{attach_instruction}\n\n{base_user}"
        prompt_input = f"{system_prompt}\n\n{user_prompt}"
        tools = [{"type": "file_search", "vector_store_ids": [vs.id]}]
        final_path = out_dir / (vtt_path.stem + ".md")
        output_md = call_openai(
            prompt_input,
            model=model,
            request_timeout=request_timeout,
            verbose=verbose,
            attachments=None,
            tools=tools,
        )
        out_dir.mkdir(parents=True, exist_ok=True)
        final_path.write_text(output_md, encoding="utf-8")
        return final_path
    else:
        if verbose:
            print(f"[debug] Reading VTT as text (no attachments): {vtt_path}", file=sys.stderr, flush=True)
        text = parse_vtt_to_text(vtt_path.read_text(encoding="utf-8", errors="ignore").splitlines())
        user_prompt = format_user_prompt(user_prompt_tmpl, vtt_path.name, text)
        prompt_input = f"{system_prompt}\n\n{user_prompt}"
        final_path = out_dir / (vtt_path.stem + ".md")
        output_md = call_openai(prompt_input, model=model, request_timeout=request_timeout, verbose=verbose)
        out_dir.mkdir(parents=True, exist_ok=True)
        final_path.write_text(output_md, encoding="utf-8")
        return final_path


def iter_vtt_files(root: Path) -> list[Path]:
    return sorted([p for p in root.rglob("*.vtt") if p.is_file()])


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(description="Generate Markdown from VTT using OpenAI")
    ap.add_argument("--conf", default="conf/auto.conf", type=Path, help="Path to config INI with prompts")
    ap.add_argument("--data", default="data", type=Path, help="Directory containing .vtt files (searched recursively)")
    ap.add_argument("--out", default="result", type=Path, help="Output directory for .md files")
    ap.add_argument("--model", default="gpt-4o", help="OpenAI model name (default: gpt-4o)")
    ap.add_argument("--request-timeout", type=float, default=90.0, help="Per-request timeout in seconds for OpenAI API")
    ap.add_argument("--limit-files", type=int, default=0, help="Process only first N files (0=all)")
    ap.add_argument("-q", "--quiet", action="store_true", help="Reduce logging output")
    ap.add_argument("--no-attachments", action="store_true", help="Disable file attachments and send raw text instead")
    # Streaming disabled: removed flags --stream-to-file and --stream
    args = ap.parse_args(argv)

    # Load environment from .env if available
    _load_env_auto()
    verbose = not args.quiet

    try:
        system_prompt, user_prompt = load_prompts(args.conf)
    except Exception as e:
        print(f"[error] loading prompts: {e}", file=sys.stderr)
        return 2

    if not args.data.exists():
        print(f"[error] data dir not found: {args.data}", file=sys.stderr)
        return 2

    files = iter_vtt_files(args.data)
    if not files:
        print(f"[warn] no .vtt files found under {args.data}")
        return 0

    print(f"Found {len(files)} VTT file(s). Writing to: {args.out}")
    ok = 0
    processed = 0
    for vtt in files:
        if args.limit_files and processed >= args.limit_files:
            if verbose:
                print(f"[debug] Reached file limit: {args.limit_files}", file=sys.stderr, flush=True)
            break
        rel = vtt.relative_to(args.data)
        out_dir = args.out / rel.parent
        try:
            if verbose:
                print(f"[debug] Start file: {vtt}", file=sys.stderr, flush=True)
            out_path = process_file(
                vtt,
                out_dir,
                system_prompt,
                user_prompt,
                args.model,
                request_timeout=args.request_timeout,
                verbose=verbose,
                use_attachments=(not args.no_attachments),
            )
            print(f"[ok] {vtt} -> {out_path}")
            ok += 1
            processed += 1
        except Exception as e:
            print(f"[fail] {vtt}: {e}", file=sys.stderr)

    print(f"Done. {ok}/{len(files)} succeeded.")
    return 0 if ok == len(files) else 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
