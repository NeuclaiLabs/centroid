import json
from pathlib import Path

import chromadb
from chromadb.config import Settings
from pydantic import BaseModel

from app.core.config import settings
from app.core.logger import get_logger
from app.services.utils import APIEndpoint, parse_api_collection

logger = get_logger(__name__, service="api_search_service")


class ChromaDBMetadata(BaseModel):
    file_id: str
    method: str | None = None
    url: str | None = None
    name: str | None = None
    folder: str | None = None


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
            logger.warning(f"Unsupported API collection format for file_id: {file_id}")
            return

        # Parse the collection
        endpoints = parse_api_collection(content)
        if not endpoints:
            logger.warning(f"No endpoints found in collection for file_id: {file_id}")
            return

        logger.info(f"Found {len(endpoints)} API endpoints to process")

        collection = chroma_client.get_or_create_collection(
            name=project_id,
            metadata={"hnsw:space": "cosine"},
        )

        # Process endpoints in smaller batches to prevent memory issues
        batch_size = 50
        for i in range(0, len(endpoints), batch_size):
            batch = endpoints[i : i + batch_size]
            documents = []
            metadatas = []
            ids = []

            for endpoint in batch:
                endpoint_model = APIEndpoint(**endpoint)
                # Use the request object to access method and url
                doc_id = f"{file_id}_{endpoint_model.id}"

                # Serialize the entire endpoint model to JSON
                doc_text = json.dumps(endpoint_model.model_dump(), indent=2)

                metadata = ChromaDBMetadata(
                    file_id=file_id,
                    method=endpoint_model.request.method,
                    url="/".join(endpoint_model.request.url.path)
                    or "",  # Use raw URL string
                    name=endpoint_model.request.name or endpoint_model.name,
                    folder=endpoint_model.folder,  # Updated to match the model field name
                )

                documents.append(doc_text)
                metadatas.append(metadata.model_dump())
                ids.append(doc_id)

            # Add batch of documents to collection
            if documents:
                collection.add(documents=documents, metadatas=metadatas, ids=ids)
                logger.debug(
                    f"Processing API endpoints: {i + 1} to {min(i + batch_size, len(endpoints))} of {len(endpoints)}"
                )

        logger.info("Successfully processed and stored all API endpoints")

    except Exception as e:
        logger.error(
            f"Error storing embeddings for file_id {file_id}: {str(e)}", exc_info=True
        )
        print(f"Error storing embeddings: {str(e)}")


def delete_embeddings(project_id: str, file_id: str):
    """Delete embeddings for a specific file from ChromaDB."""
    try:
        logger.info(
            f"Attempting to delete embeddings for file_id: {file_id} in project: {project_id}"
        )
        collection = chroma_client.get_collection(name=project_id)
        collection.delete(where={"file_id": file_id})
        logger.info(f"Successfully deleted embeddings for file_id: {file_id}")
    except Exception as e:
        logger.error(
            f"Error deleting embeddings for file_id {file_id}: {str(e)}", exc_info=True
        )
        print(f"Error deleting embeddings: {str(e)}")


def search_endpoints(
    project_id: str, query: str, limit: int = 10, where: dict | None = None
):
    """Search for API endpoints using semantic similarity."""
    collection = chroma_client.get_collection(name=project_id)
    logger.info(
        f"Searching for {query} in {project_id} with limit {limit} and where {where}"
    )

    results = collection.query(
        query_texts=[query],
        n_results=limit,
        where=where,
        include=["documents", "metadatas", "distances"],
    )

    return results
