import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

// Create axios instance with base configuration
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// API service functions
export const contractApi = {
    // Process a document
    processDocument: async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await api.post('/process/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // Submit metadata
    submitMetadata: async (metadata) => {
        const response = await api.post('/metadata/', metadata);
        return response.data;
    },

    // Health check
    checkHealth: async () => {
        const response = await api.get('/health');
        return response.data;
    },
    
    // Query the knowledge graph
    queryKnowledgeGraph: async (query, topK = 5, useGraphContext = true) => {
        const response = await api.post('/kg/query', {
            query: query,
            top_k: topK, 
            use_graph_context: useGraphContext
        });
        return response.data;
    },
    
    // Upload contract to knowledge graph
    uploadContract: async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await api.post('/contracts/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
    
    // Setup vector index
    setupVectorIndex: async () => {
        const response = await api.get('/kg/index');
        return response.data;
    }
};