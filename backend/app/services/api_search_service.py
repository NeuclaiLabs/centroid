import json
from pathlib import Path

import chromadb
from chromadb.config import Settings
from pydantic import BaseModel

from app.core.config import settings
from app.services.utils import APIEndpoint, parse_api_collection


class ChromaDBMetadata(BaseModel):
    file_id: str
    method: str
    url: str
    name: str
    folder_path: str
    has_examples: bool
    has_auth: bool
    has_body: bool


# Initialize ChromaDB client
chroma_client = chromadb.PersistentClient(
    path=str(Path(settings.UPLOAD_DIR) / ".chromadb"),
    settings=Settings(anonymized_telemetry=False),
)


def store_embeddings(project_id: str, file_id: str, content: dict):
    """Store endpoints in ChromaDB with their embeddings."""
    try:
        # First check if this is a supported API collection
        if not isinstance(content, dict) or not (
            content.get("info", {})
            .get("schema", "")
            .startswith("https://schema.getpostman.com")
            or content.get("openapi")
            or content.get("swagger")
        ):
            return  # Not a supported API collection format

        # Parse the collection
        endpoints = parse_api_collection(content)
        if not endpoints:
            return

        collection = chroma_client.get_or_create_collection(
            name=project_id,
            metadata={"hnsw:space": "cosine"},
        )

        # Process endpoints in smaller batches to prevent memory issues
        BATCH_SIZE = 50
        for i in range(0, len(endpoints), BATCH_SIZE):
            batch = endpoints[i : i + BATCH_SIZE]

            documents = []
            metadatas = []
            ids = []

            for j, endpoint in enumerate(batch):
                # Validate endpoint structure
                endpoint_model = APIEndpoint(**endpoint)
                endpoint_for_embedding = endpoint_model.model_dump()

                # Remove any empty or None values
                doc_text = json.dumps(
                    {k: v for k, v in endpoint_for_embedding.items() if v}, indent=2
                )

                doc_id = f"{file_id}_{i + j}"

                # Create and validate metadata
                metadata = ChromaDBMetadata(
                    file_id=file_id,
                    method=endpoint_model.method,
                    url=endpoint_model.url,
                    name=endpoint_model.name,
                    folder_path=endpoint_model.folder_path,
                    has_examples=len(endpoint_model.examples) > 0,
                    has_auth=bool(endpoint_model.auth),
                    has_body=bool(endpoint_model.body),
                )

                documents.append(doc_text)
                metadatas.append(metadata.model_dump())
                ids.append(doc_id)

            # Add batch of documents to collection
            if documents:
                collection.add(documents=documents, metadatas=metadatas, ids=ids)

    except Exception as e:
        print(f"Error storing embeddings: {str(e)}")


def delete_embeddings(project_id: str, file_id: str):
    """Delete embeddings for a specific file from ChromaDB."""
    try:
        collection = chroma_client.get_collection(name=project_id)
        collection.delete(where={"file_id": file_id})
    except Exception as e:
        print(f"Error deleting embeddings: {str(e)}")


def search_endpoints(
    project_id: str, query: str, limit: int = 10, where: dict | None = None
):
    """Search for API endpoints using semantic similarity."""
    collection = chroma_client.get_collection(name=project_id)

    results = collection.query(
        query_texts=[query],
        n_results=limit,
        where=where,
        include=["documents", "metadatas", "distances"],
    )

    return results
