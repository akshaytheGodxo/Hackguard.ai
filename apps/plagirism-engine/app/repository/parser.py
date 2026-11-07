
import io
import stat
import zipfile

from dataclasses import dataclass
from pathlib import PurePosixPath


LANGUAGE_EXTENSIONS = {
    ".cpp": "cpp",
    ".cc": "cpp",
    ".cxx": "cpp",
    ".hpp": "cpp",
    ".hh": "cpp",
    ".h": "cpp",

    ".py": "python",

    ".java": "java",

    ".js": "javascript",
    ".jsx": "javascript",
    ".ts": "typescript",
    ".tsx": "typescript",
}

IGNORED_DIRECTORIES = {
    "node_modules",
    ".git",
    ".next",
    "dist",
    "build",
    "__pycache__",
    ".venv",
    "venv",
    "coverage",
    ".pytest_cache",
    "target",
}

MAX_FILES = 500
MAX_FILE_SIZE = 1_000_000       # 1 MB per file
MAX_TOTAL_SIZE = 10_000_000     # 10 MB total
MAX_COMPRESSION_RATIO = 100


@dataclass
class RepositoryFile:
    path: str
    language: str
    content: str


def should_ignore(path: PurePosixPath) -> bool:
    if any(part in IGNORED_DIRECTORIES for part in path.parts):
        return True

    return path.name in {
        "package-lock.json",
        "yarn.lock",
        "pnpm-lock.yaml",
        "poetry.lock",
    }


def parse_repository_zip(
    zip_bytes: bytes,
) -> list[RepositoryFile]:

    files = []
    seen_paths = set()
    total_size = 0

    try:
        archive = zipfile.ZipFile(io.BytesIO(zip_bytes))

        with archive:
            entries = archive.infolist()

            if len(entries) > MAX_FILES * 5:
                raise ValueError("Archive contains too many entries")

            source_count = 0

            for entry in entries:
                if entry.is_dir():
                    continue

                raw_path = entry.filename.replace("\\", "/")
                path = PurePosixPath(raw_path)

                # Prevent ZIP Slip and absolute paths.
                if path.is_absolute() or ".." in path.parts:
                    raise ValueError("Unsafe archive path detected")

                if not path.parts:
                    continue

                # Reject symbolic links.
                unix_mode = entry.external_attr >> 16

                if stat.S_ISLNK(unix_mode):
                    raise ValueError("Symbolic links are not allowed")

                if should_ignore(path):
                    continue

                language = LANGUAGE_EXTENSIONS.get(path.suffix.lower())

                if not language:
                    continue

                if raw_path in seen_paths:
                    raise ValueError("Duplicate file path detected")

                seen_paths.add(raw_path)
                source_count += 1

                if source_count > MAX_FILES:
                    raise ValueError("Too many source files")

                if entry.file_size > MAX_FILE_SIZE:
                    raise ValueError(
                        f"File too large: {raw_path}"
                    )

                total_size += entry.file_size

                if total_size > MAX_TOTAL_SIZE:
                    raise ValueError(
                        "Repository exceeds total size limit"
                    )

                if entry.file_size > 0:
                    ratio = entry.file_size / max(
                        entry.compress_size, 1
                    )

                    if ratio > MAX_COMPRESSION_RATIO:
                        raise ValueError(
                            "Suspicious compression ratio"
                        )

                try:
                    content = archive.read(entry).decode(
                        "utf-8-sig"
                    )
                except (UnicodeDecodeError, RuntimeError):
                    # Ignore unreadable or encrypted source files.
                    continue

                files.append(
                    RepositoryFile(
                        path=raw_path,
                        language=language,
                        content=content,
                    )
                )

    except zipfile.BadZipFile:
        raise ValueError("Invalid ZIP archive")

    if not files:
        raise ValueError("No supported source files found")

    return files
