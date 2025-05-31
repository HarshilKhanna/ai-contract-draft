from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
import shutil
from pathlib import Path
import neo4j
from neo4j_graphrag.llm import AzureOpenAILLM
from contextlib import asynccontextmanager
from fastapi import FastAPI
from neo4j_graphrag.embeddings.openai import AzureOpenAIEmbeddings
from neo4j_graphrag.experimental.components.text_splitters.fixed_size_splitter import FixedSizeSplitter
from neo4j_graphrag.experimental.pipeline.kg_builder import SimpleKGPipeline
from neo4j_graphrag.indexes import create_vector_index
from neo4j_graphrag.retrievers import VectorRetriever, VectorCypherRetriever
import asyncio
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from neo4j_graphrag.generation import RagTemplate
from neo4j_graphrag.generation.graphrag import GraphRAG

# Neo4j Configuration
NEO4J_URI = 'neo4j+s://5dc9da8f.databases.neo4j.io'
NEO4J_USERNAME = 'neo4j'
NEO4J_PASSWORD = 'NLmFlrxDkFJYzffdV2WSlCPjibTbU0MUW3uSeRlj9e8'

# Azure OpenAI Configuration
llm = AzureOpenAILLM(
    model_name="gpt-4.1",
    azure_endpoint="https://ishaan.openai.azure.com/",
    api_version="2024-10-01-preview",
    api_key="2S4V3MfGWVFcJcJXk2eibRIOnBsru6tiIukQ587Jcne0KoGKLhgXJQQJ99BDACHYHv6XJ3w3AAABACOGPoUA",
)

embedder = AzureOpenAIEmbeddings(
    azure_endpoint="https://text-embedding-ada-002-ishaan.openai.azure.com",
    model="text-embedding-ada-002",
    api_key="7cTg7lr8xuwHaUFxjXU8XLwtHyk8lg7RT0pc6fTRCWCCrb3M0rBLJQQJ99BDACYeBjFXJ3w3AAABACOGVIat",
    api_version="2023-05-15"
)

# Initialize Neo4j driver
driver = neo4j.GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USERNAME, NEO4J_PASSWORD))

# Global upload directory
UPLOAD_DIR = Path("uploads")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    UPLOAD_DIR.mkdir(exist_ok=True)
    yield
    # Shutdown
    driver.close()

app = FastAPI(lifespan=lifespan)

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Node labels and relationship types
node_labels = [
    "Contract", "Clause", "Party", "PlaybookRule", "Risk", "Liability",
    "ComplianceStatus", "Jurisdiction", "Amendment", "Section", "Keyword",
    "Annotation", "Agent", "User", "DocumentVersion"
]

rel_types = [
    "CONTAINS_CLAUSE", "WRITTEN_BY", "HAS_PARTY", "BELONGS_TO_SECTION",
    "MATCHES_RULE", "VIOLATES_RULE", "HAS_RISK", "HAS_LIABILITY",
    "ASSESSED_BY", "REQUIRES_AMENDMENT", "UNDER_JURISDICTION",
    "HAS_COMPLIANCE_STATUS", "HAS_KEYWORD", "ANNOTATED_BY",
    "SUBMITTED_BY", "UPDATED_TO", "VERSION_OF"
]

# Initialize KG Pipeline
kg_builder_pdf = SimpleKGPipeline(
    llm=llm,
    driver=driver,
    text_splitter=FixedSizeSplitter(chunk_size=1000, chunk_overlap=200),
    embedder=embedder,
    entities=node_labels,
    relations=rel_types,
    prompt_template='''
You are a contract risk analyst tasked with extracting information from contracts
and structuring it into a property graph to enable risk identification, deviation analysis, and actionable mitigation planning.

Extract the entities (nodes) and specify their type from the following Input text.
Also extract the relationships between these nodes. The relationship direction goes from the start node to the end node.

Return the result as JSON using the following format:
{{"nodes": [{{"id": "0", "label": "the type of entity", "properties": {{"name": "name of entity"}}}}],
  "relationships": [{{"type": "TYPE_OF_RELATIONSHIP", "start_node_id": "0", "end_node_id": "1", "properties": {{"details": "Description of the relationship"}}}}]}}

- Use only the information provided in the Input text. Do not add any external knowledge or assumptions.
- If the input text is empty, return an empty JSON.
- Create as many nodes and relationships as necessary to offer rich context for risk and compliance analysis.
- An AI knowledge assistant must be able to read this graph and immediately understand contract risks, deviations from policies, and required mitigations.
- Multiple contracts will be ingested from various sources, and this property graph will be used to connect information across them, so entity types must remain fairly general but accurate.

Use only the following nodes and relationships (if provided):
{schema}

Assign a unique ID (string) to each node, and reuse it appropriately when defining relationships.
Respect the valid source and target node types for each relationship.
The direction of the relationship must follow what is logically correct based on the schema.

Do not return any explanations or additional information beyond the specified JSON.

Examples:
{examples}

Input text:

{text}
''',
   from_pdf=True
)

# Initialize vector index and retrievers
create_vector_index(driver, name="text_embeddings", label="Chunk",
                   embedding_property="embedding", dimensions=1536, similarity_fn="cosine")

vector_retriever = VectorRetriever(
   driver,
   index_name="text_embeddings",
   embedder=embedder,
   return_properties=["text"],
)

vc_retriever = VectorCypherRetriever(
   driver,
   index_name="text_embeddings",
   embedder=embedder,
   retrieval_query="""
//1) Go out 2-3 hops in the entity graph and get relationships
WITH node AS chunk
MATCH (chunk)<-[:FROM_CHUNK]-()-[relList:!FROM_CHUNK]-{1,2}()
UNWIND relList AS rel

//2) collect relationships and text chunks
WITH collect(DISTINCT chunk) AS chunks,
 collect(DISTINCT rel) AS rels

//3) format and return context
RETURN '=== text ===n' + apoc.text.join([c in chunks | c.text], 'n---n') + 'nn=== kg_rels ===n' +
 apoc.text.join([r in rels | startNode(r).name + ' - ' + type(r) + '(' + coalesce(r.details, '') + ')' +  ' -> ' + endNode(r).name ], 'n---n') AS info
"""
)

# Initialize RAG components
rag_template = RagTemplate(template='''Answer the Question using the following Context. Only respond with information mentioned in the Context. Do not inject any speculative information not mentioned.

# Question:
{query_text}

# Context:
{context}

# Answer:
''', expected_inputs=['query_text', 'context'])

# Initialize RAG instances
v_rag = GraphRAG(llm=llm, retriever=vector_retriever, prompt_template=rag_template)
vc_rag = GraphRAG(llm=llm, retriever=vc_retriever, prompt_template=rag_template)

async def run_with_delay(func, delay, *args, **kwargs):
    """Helper function to add delay between API calls."""
    await asyncio.sleep(delay)
    return await func(*args, **kwargs)

async def process_pdf_to_graph(file_path: str):
    """Process a PDF file and create/update the knowledge graph."""
    try:
        # Process the PDF using the KG pipeline with delay
        delay_between_calls = 10  # in seconds
        result = await run_with_delay(
            kg_builder_pdf.run_async,
            delay_between_calls,
            file_path=file_path
        )
        
        # Create vector embeddings for the processed content
        # Note: create_vector_index is synchronous, so we don't await it
        create_vector_index(
            driver,
            name="text_embeddings",
            label="Chunk",
            embedding_property="embedding",
            dimensions=1536,
            similarity_fn="cosine"
        )
        
        return {
            "success": True,
            "message": "PDF processed and graph created successfully",
            "details": result
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Error processing PDF: {str(e)}"
        }

# Pydantic model for metadata validation
class ContractMetadata(BaseModel):
    document_id: str
    ka_category: str
    title: str
    description: str
    business_unit: List[str]
    sub_bu: List[str]
    business_function: List[str]
    related_contract_types: List[str]
    applicable_commercial_models: List[str]
    mapping_primary_document: Optional[str] = None
    risk_category: List[str]
    valuethreshold_rules: Optional[str] = None
    last_updated: str
    version_no: str
    relevance_tags: List[str]
    access_control: Optional[str] = None
    filepath: Optional[str] = None

class AIProcessingRequest(BaseModel):
    document_id: str
    filepath: str

class ChatRequest(BaseModel):
    document_id: str
    message: str

@app.get("/")
async def root():
    return {"status": "ok"}

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        # Ensure file is PDF
        if not file.filename.lower().endswith('.pdf'):
            return {"error": "Only PDF files are allowed"}
        
        # Create safe filename and path
        file_path = UPLOAD_DIR / file.filename
        
        # Save the file
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Process the PDF and create/update graph
        graph_result = await process_pdf_to_graph(str(file_path))
        
        if not graph_result["success"]:
            return {
                "status": "partial_success",
                "file_upload": "success",
                "graph_processing": "failed",
                "error": graph_result["message"],
                "filename": file.filename,
                "filepath": str(file_path)
            }
        
        return {
            "status": "success",
            "file_upload": "success",
            "graph_processing": "success",
            "filename": file.filename,
            "filepath": str(file_path),
            "graph_details": graph_result["details"]
        }
        
    except Exception as e:
        return {"error": str(e)}

@app.post("/metadata/")
async def create_metadata(metadata: ContractMetadata):
    try:
        # Create a Cypher query to store metadata in Neo4j
        with driver.session() as session:
            # Create Contract node with metadata
            result = session.run("""
                CREATE (c:Contract {
                    document_id: $document_id,
                    ka_category: $ka_category,
                    title: $title,
                    description: $description,
                    business_unit: $business_unit,
                    sub_bu: $sub_bu,
                    business_function: $business_function,
                    related_contract_types: $related_contract_types,
                    applicable_commercial_models: $applicable_commercial_models,
                    mapping_primary_document: $mapping_primary_document,
                    risk_category: $risk_category,
                    valuethreshold_rules: $valuethreshold_rules,
                    last_updated: $last_updated,
                    version_no: $version_no,
                    relevance_tags: $relevance_tags,
                    access_control: $access_control,
                    filepath: $filepath
                })
                RETURN c
            """, metadata.dict())
            
            contract_node = result.single()
            
            if contract_node:
                return {
                    "status": "success",
                    "message": "Metadata stored successfully",
                    "contract_id": metadata.document_id
                }
            else:
                raise HTTPException(status_code=500, detail="Failed to store metadata")
                
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/test-neo4j")
async def test_neo4j():
    try:
        with driver.session() as session:
            # Test basic connection
            result = session.run("RETURN 1 as test")
            test_value = result.single()["test"]
            
            # Get count of Contract nodes
            contract_count = session.run("MATCH (c:Contract) RETURN count(c) as count").single()["count"]
            
            # Get sample of recent contracts
            recent_contracts = session.run("""
                MATCH (c:Contract)
                RETURN c.document_id as id, c.title as title, c.last_updated as updated
                ORDER BY c.last_updated DESC
                LIMIT 5
            """).data()
            
            return {
                "status": "success",
                "neo4j_connection": "ok",
                "test_value": test_value,
                "contract_count": contract_count,
                "recent_contracts": recent_contracts
            }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }

@app.post("/process-ai")
async def process_with_ai(request: AIProcessingRequest):
    try:
        print(f"Processing AI request for document: {request.document_id}")
        print(f"Filepath: {request.filepath}")
        
        # Process the PDF with AI
        if not request.filepath:
            raise HTTPException(status_code=400, detail="No filepath provided")
            
        # Ensure the file exists
        file_path = Path("uploads") / request.filepath
        if not file_path.exists():
            raise HTTPException(status_code=404, detail=f"File not found: {request.filepath}")
            
        print(f"Processing file: {file_path}")
        result = await process_pdf_to_graph(str(file_path))
        
        if not result["success"]:
            raise HTTPException(status_code=500, detail=result["message"])
        
        # Here you can add additional AI processing steps
        # For example, analyzing the contract, generating insights, etc.
        
        return {
            "status": "success",
            "message": "AI processing completed successfully",
            "document_id": request.document_id,
            "details": result["details"]
        }
    except HTTPException as he:
        print(f"HTTP Exception: {str(he)}")
        raise he
    except Exception as e:
        print(f"Error processing AI request: {str(e)}")
        print(f"Error type: {type(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error processing AI request: {str(e)}")

@app.post("/chat")
async def chat_with_document(request: ChatRequest):
    try:
        print(f"Processing chat request for document: {request.document_id}")
        
        # Get document context from Neo4j
        with driver.session() as session:
            # Verify document exists
            result = session.run("""
                MATCH (c:Contract {document_id: $document_id})
                RETURN c
            """, document_id=request.document_id)
            
            if not result.single():
                raise HTTPException(status_code=404, detail="Document not found")
            
            # Use both vector and vector+cypher retrievers for better context
            vector_response = v_rag.search(
                request.message, 
                retriever_config={'top_k': 3}
            )
            
            vc_response = vc_rag.search(
                request.message, 
                retriever_config={'top_k': 3}
            )
            
            # Combine responses for better context
            combined_response = f"""Based on the document analysis:

Vector Search Response:
{vector_response.answer}

Additional Context from Knowledge Graph:
{vc_response.answer}"""
            
            return {
                "status": "success",
                "response": combined_response
            }
            
    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")
        print(f"Error type: {type(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error processing chat request: {str(e)}")

# To run the server:
# uvicorn main:app --reload

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)