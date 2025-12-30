// Mock data representing a VAL-like ecosystem
// This simulates what would come from Docker/config scanning

export type ServiceStatus = "running" | "stopped" | "warning" | "error";
export type ServiceType =
  | "api"
  | "worker"
  | "database"
  | "queue"
  | "cache"
  | "gateway"
  | "ai"
  | "storage";
export type ConnectionType =
  | "http"
  | "grpc"
  | "redis"
  | "postgres"
  | "rabbitmq"
  | "websocket"
  | "internal"
  | "flow"; // for process flows

export type NodeType = "service" | "process" | "decision" | "group";
export type ProcessType =
  | "trigger"
  | "process"
  | "validation"
  | "success"
  | "error"
  | "action";

export interface ServiceNode {
  id: string;
  label: string;
  type: ServiceType;
  nodeType?: NodeType; // defaults to 'service' if not specified
  processType?: ProcessType; // for process nodes
  status: ServiceStatus;
  description: string;
  port?: number;
  cpu?: string;
  memory?: string;
  uptime?: string;
  linkedFlowchart?: string; // ID of deeper flowchart
  color?: string; // for group nodes
  metrics?: {
    requests?: string;
    latency?: string;
    errorRate?: string;
  };
}

export interface ServiceConnection {
  id: string;
  source: string;
  target: string;
  type: ConnectionType;
  label?: string;
  animated?: boolean;
}

export interface ServiceFlowchart {
  id: string;
  name: string;
  description: string;
  nodes: ServiceNode[];
  connections: ServiceConnection[];
}

// ============================================
// MOCK DATA - Simulating VAL Ecosystem
// ============================================

export const flowchartData: Record<string, ServiceFlowchart> = {
  // ============================================
  // TOP LEVEL: System Overview
  // ============================================
  "system-overview": {
    id: "system-overview",
    name: "System Overview",
    description: "VAL Platform - High-level architecture",
    nodes: [
      {
        id: "api-gateway",
        label: "API Gateway",
        type: "gateway",
        status: "running",
        description: "Main entry point for all external requests",
        port: 8080,
        cpu: "12%",
        memory: "256MB",
        uptime: "14d 3h",
        linkedFlowchart: "api-gateway-detail",
        metrics: { requests: "1.2k/min", latency: "45ms", errorRate: "0.02%" },
      },
      {
        id: "automation-runner",
        label: "Automation Runner",
        type: "worker",
        status: "running",
        description: "Executes automated tasks and pipelines",
        port: 8081,
        cpu: "45%",
        memory: "1.2GB",
        uptime: "14d 3h",
        linkedFlowchart: "automation-runner-detail",
        metrics: { requests: "340/min", latency: "120ms", errorRate: "0.1%" },
      },
      {
        id: "ai-services",
        label: "AI/ML Services",
        type: "ai",
        status: "running",
        description: "LLM inference, embeddings, autonomous thinking",
        port: 8082,
        cpu: "78%",
        memory: "8GB",
        uptime: "7d 12h",
        linkedFlowchart: "ai-services-detail",
        metrics: { requests: "89/min", latency: "2.3s", errorRate: "0.5%" },
      },
      {
        id: "data-layer",
        label: "Data Layer",
        type: "database",
        status: "running",
        description: "PostgreSQL, Redis, Vector DB",
        cpu: "23%",
        memory: "4GB",
        uptime: "30d 0h",
        linkedFlowchart: "data-layer-detail",
      },
      {
        id: "message-queue",
        label: "Message Queue",
        type: "queue",
        status: "running",
        description: "RabbitMQ for async task distribution",
        port: 5672,
        cpu: "8%",
        memory: "512MB",
        uptime: "30d 0h",
        linkedFlowchart: "message-queue-detail",
      },
      {
        id: "nlp-engine",
        label: "NLP Engine",
        type: "ai",
        status: "running",
        description: "Natural language processing pipeline",
        port: 8083,
        cpu: "34%",
        memory: "2GB",
        uptime: "14d 3h",
        linkedFlowchart: "nlp-engine-detail",
      },
    ],
    connections: [
      {
        id: "e1",
        source: "api-gateway",
        target: "automation-runner",
        type: "http",
        label: "REST",
        animated: true,
      },
      {
        id: "e2",
        source: "api-gateway",
        target: "ai-services",
        type: "http",
        label: "REST",
        animated: true,
      },
      {
        id: "e3",
        source: "api-gateway",
        target: "nlp-engine",
        type: "http",
        label: "REST",
      },
      {
        id: "e4",
        source: "automation-runner",
        target: "message-queue",
        type: "rabbitmq",
        label: "AMQP",
        animated: true,
      },
      {
        id: "e5",
        source: "automation-runner",
        target: "data-layer",
        type: "postgres",
        label: "SQL",
      },
      {
        id: "e6",
        source: "ai-services",
        target: "data-layer",
        type: "redis",
        label: "Cache",
      },
      {
        id: "e7",
        source: "ai-services",
        target: "message-queue",
        type: "rabbitmq",
        label: "AMQP",
      },
      {
        id: "e8",
        source: "nlp-engine",
        target: "ai-services",
        type: "grpc",
        label: "gRPC",
        animated: true,
      },
      {
        id: "e9",
        source: "nlp-engine",
        target: "data-layer",
        type: "postgres",
        label: "SQL",
      },
    ],
  },

  // ============================================
  // DETAIL: API Gateway
  // ============================================
  "api-gateway-detail": {
    id: "api-gateway-detail",
    name: "API Gateway",
    description: "Request routing, authentication, rate limiting",
    nodes: [
      {
        id: "load-balancer",
        label: "Load Balancer",
        type: "gateway",
        status: "running",
        description: "Nginx-based load balancing",
        port: 80,
        cpu: "5%",
        memory: "64MB",
      },
      {
        id: "auth-service",
        label: "Auth Service",
        type: "api",
        status: "running",
        description: "JWT validation, OAuth2",
        cpu: "8%",
        memory: "128MB",
      },
      {
        id: "rate-limiter",
        label: "Rate Limiter",
        type: "cache",
        status: "running",
        description: "Token bucket rate limiting",
        cpu: "3%",
        memory: "64MB",
      },
      {
        id: "request-router",
        label: "Request Router",
        type: "api",
        status: "running",
        description: "Routes requests to appropriate services",
        cpu: "12%",
        memory: "256MB",
      },
      {
        id: "response-cache",
        label: "Response Cache",
        type: "cache",
        status: "running",
        description: "Redis-based response caching",
        cpu: "4%",
        memory: "512MB",
      },
    ],
    connections: [
      {
        id: "ag1",
        source: "load-balancer",
        target: "auth-service",
        type: "internal",
        animated: true,
      },
      {
        id: "ag2",
        source: "auth-service",
        target: "rate-limiter",
        type: "internal",
      },
      {
        id: "ag3",
        source: "rate-limiter",
        target: "request-router",
        type: "internal",
        animated: true,
      },
      {
        id: "ag4",
        source: "request-router",
        target: "response-cache",
        type: "redis",
      },
    ],
  },

  // ============================================
  // DETAIL: Automation Runner
  // ============================================
  "automation-runner-detail": {
    id: "automation-runner-detail",
    name: "Automation Runner",
    description: "Task execution engine with pipeline support",
    nodes: [
      {
        id: "task-scheduler",
        label: "Task Scheduler",
        type: "worker",
        status: "running",
        description: "Cron-based and event-driven scheduling",
        cpu: "8%",
        memory: "256MB",
      },
      {
        id: "pipeline-engine",
        label: "Pipeline Engine",
        type: "worker",
        status: "running",
        description: "DAG-based pipeline execution",
        cpu: "25%",
        memory: "512MB",
        linkedFlowchart: "pipeline-engine-detail",
      },
      {
        id: "docker-executor",
        label: "Docker Executor",
        type: "worker",
        status: "running",
        description: "Container-based task isolation",
        cpu: "40%",
        memory: "1GB",
      },
      {
        id: "result-collector",
        label: "Result Collector",
        type: "worker",
        status: "running",
        description: "Aggregates execution results",
        cpu: "5%",
        memory: "128MB",
      },
      {
        id: "retry-handler",
        label: "Retry Handler",
        type: "worker",
        status: "warning",
        description: "Exponential backoff retry logic",
        cpu: "2%",
        memory: "64MB",
      },
    ],
    connections: [
      {
        id: "ar1",
        source: "task-scheduler",
        target: "pipeline-engine",
        type: "internal",
        animated: true,
      },
      {
        id: "ar2",
        source: "pipeline-engine",
        target: "docker-executor",
        type: "internal",
        animated: true,
      },
      {
        id: "ar3",
        source: "docker-executor",
        target: "result-collector",
        type: "internal",
      },
      {
        id: "ar4",
        source: "docker-executor",
        target: "retry-handler",
        type: "internal",
      },
      {
        id: "ar5",
        source: "retry-handler",
        target: "pipeline-engine",
        type: "internal",
      },
    ],
  },

  // ============================================
  // DETAIL: AI Services
  // ============================================
  "ai-services-detail": {
    id: "ai-services-detail",
    name: "AI/ML Services",
    description: "LLM inference and autonomous reasoning",
    nodes: [
      {
        id: "llm-router",
        label: "LLM Router",
        type: "ai",
        status: "running",
        description: "Routes to appropriate model (GPT-4, Claude, Local)",
        cpu: "5%",
        memory: "256MB",
      },
      {
        id: "local-llm",
        label: "Local LLM",
        type: "ai",
        status: "running",
        description: "llama.cpp based local inference",
        cpu: "85%",
        memory: "6GB",
        linkedFlowchart: "local-llm-detail",
      },
      {
        id: "embedding-service",
        label: "Embedding Service",
        type: "ai",
        status: "running",
        description: "Text to vector embeddings",
        cpu: "30%",
        memory: "1GB",
      },
      {
        id: "autonomous-thinking",
        label: "Autonomous Thinking",
        type: "ai",
        status: "running",
        description: "Multi-step reasoning engine",
        cpu: "45%",
        memory: "2GB",
        linkedFlowchart: "val-coding-loop",
      },
      {
        id: "context-manager",
        label: "Context Manager",
        type: "cache",
        status: "running",
        description: "Conversation and context storage",
        cpu: "10%",
        memory: "512MB",
      },
    ],
    connections: [
      {
        id: "ai1",
        source: "llm-router",
        target: "local-llm",
        type: "grpc",
        animated: true,
      },
      {
        id: "ai2",
        source: "llm-router",
        target: "embedding-service",
        type: "grpc",
      },
      {
        id: "ai3",
        source: "autonomous-thinking",
        target: "llm-router",
        type: "internal",
        animated: true,
      },
      {
        id: "ai4",
        source: "autonomous-thinking",
        target: "context-manager",
        type: "redis",
      },
      {
        id: "ai5",
        source: "embedding-service",
        target: "context-manager",
        type: "redis",
      },
    ],
  },

  // ============================================
  // DETAIL: Data Layer
  // ============================================
  "data-layer-detail": {
    id: "data-layer-detail",
    name: "Data Layer",
    description: "Persistent storage and caching infrastructure",
    nodes: [
      {
        id: "postgres-primary",
        label: "PostgreSQL Primary",
        type: "database",
        status: "running",
        description: "Main relational database",
        port: 5432,
        cpu: "20%",
        memory: "2GB",
      },
      {
        id: "postgres-replica",
        label: "PostgreSQL Replica",
        type: "database",
        status: "running",
        description: "Read replica for scaling",
        port: 5433,
        cpu: "10%",
        memory: "2GB",
      },
      {
        id: "redis-cluster",
        label: "Redis Cluster",
        type: "cache",
        status: "running",
        description: "Distributed caching",
        port: 6379,
        cpu: "8%",
        memory: "1GB",
      },
      {
        id: "vector-db",
        label: "Vector Database",
        type: "database",
        status: "running",
        description: "Qdrant for embeddings storage",
        port: 6333,
        cpu: "15%",
        memory: "4GB",
      },
      {
        id: "backup-service",
        label: "Backup Service",
        type: "storage",
        status: "running",
        description: "Automated backup to S3",
        cpu: "2%",
        memory: "128MB",
      },
    ],
    connections: [
      {
        id: "dl1",
        source: "postgres-primary",
        target: "postgres-replica",
        type: "internal",
        label: "Replication",
        animated: true,
      },
      {
        id: "dl2",
        source: "postgres-primary",
        target: "backup-service",
        type: "internal",
      },
      {
        id: "dl3",
        source: "redis-cluster",
        target: "backup-service",
        type: "internal",
      },
      {
        id: "dl4",
        source: "vector-db",
        target: "backup-service",
        type: "internal",
      },
    ],
  },

  // ============================================
  // DETAIL: Message Queue
  // ============================================
  "message-queue-detail": {
    id: "message-queue-detail",
    name: "Message Queue",
    description: "Asynchronous message processing",
    nodes: [
      {
        id: "rabbitmq-node1",
        label: "RabbitMQ Node 1",
        type: "queue",
        status: "running",
        description: "Primary queue node",
        port: 5672,
        cpu: "10%",
        memory: "256MB",
      },
      {
        id: "rabbitmq-node2",
        label: "RabbitMQ Node 2",
        type: "queue",
        status: "running",
        description: "Secondary queue node",
        port: 5673,
        cpu: "8%",
        memory: "256MB",
      },
      {
        id: "task-queue",
        label: "Task Queue",
        type: "queue",
        status: "running",
        description: "High-priority task processing",
        metrics: { requests: "450/min" },
      },
      {
        id: "event-queue",
        label: "Event Queue",
        type: "queue",
        status: "running",
        description: "System event broadcasting",
        metrics: { requests: "1.2k/min" },
      },
      {
        id: "dead-letter",
        label: "Dead Letter Queue",
        type: "queue",
        status: "warning",
        description: "Failed message storage",
        metrics: { requests: "12/hour" },
      },
    ],
    connections: [
      {
        id: "mq1",
        source: "rabbitmq-node1",
        target: "rabbitmq-node2",
        type: "internal",
        label: "Cluster",
        animated: true,
      },
      {
        id: "mq2",
        source: "rabbitmq-node1",
        target: "task-queue",
        type: "rabbitmq",
      },
      {
        id: "mq3",
        source: "rabbitmq-node1",
        target: "event-queue",
        type: "rabbitmq",
      },
      {
        id: "mq4",
        source: "task-queue",
        target: "dead-letter",
        type: "internal",
      },
      {
        id: "mq5",
        source: "event-queue",
        target: "dead-letter",
        type: "internal",
      },
    ],
  },

  // ============================================
  // DETAIL: NLP Engine
  // ============================================
  "nlp-engine-detail": {
    id: "nlp-engine-detail",
    name: "NLP Engine",
    description: "Natural language processing pipeline",
    nodes: [
      {
        id: "tokenizer",
        label: "Tokenizer",
        type: "ai",
        status: "running",
        description: "Text tokenization and normalization",
        cpu: "10%",
        memory: "256MB",
      },
      {
        id: "ner-service",
        label: "NER Service",
        type: "ai",
        status: "running",
        description: "Named entity recognition",
        cpu: "25%",
        memory: "512MB",
      },
      {
        id: "sentiment-analyzer",
        label: "Sentiment Analyzer",
        type: "ai",
        status: "running",
        description: "Sentiment classification",
        cpu: "15%",
        memory: "384MB",
      },
      {
        id: "intent-classifier",
        label: "Intent Classifier",
        type: "ai",
        status: "running",
        description: "User intent detection",
        cpu: "20%",
        memory: "512MB",
      },
      {
        id: "response-generator",
        label: "Response Generator",
        type: "ai",
        status: "running",
        description: "Template-based response generation",
        cpu: "8%",
        memory: "256MB",
      },
    ],
    connections: [
      {
        id: "nlp1",
        source: "tokenizer",
        target: "ner-service",
        type: "internal",
        animated: true,
      },
      {
        id: "nlp2",
        source: "tokenizer",
        target: "sentiment-analyzer",
        type: "internal",
        animated: true,
      },
      {
        id: "nlp3",
        source: "ner-service",
        target: "intent-classifier",
        type: "internal",
      },
      {
        id: "nlp4",
        source: "sentiment-analyzer",
        target: "intent-classifier",
        type: "internal",
      },
      {
        id: "nlp5",
        source: "intent-classifier",
        target: "response-generator",
        type: "internal",
        animated: true,
      },
    ],
  },

  // ============================================
  // DEEPER: Pipeline Engine
  // ============================================
  "pipeline-engine-detail": {
    id: "pipeline-engine-detail",
    name: "Pipeline Engine",
    description: "DAG-based workflow execution",
    nodes: [
      {
        id: "dag-parser",
        label: "DAG Parser",
        type: "worker",
        status: "running",
        description: "Parses pipeline definitions",
        cpu: "5%",
        memory: "128MB",
      },
      {
        id: "dependency-resolver",
        label: "Dependency Resolver",
        type: "worker",
        status: "running",
        description: "Resolves task dependencies",
        cpu: "8%",
        memory: "256MB",
      },
      {
        id: "parallel-executor",
        label: "Parallel Executor",
        type: "worker",
        status: "running",
        description: "Runs independent tasks concurrently",
        cpu: "35%",
        memory: "512MB",
      },
      {
        id: "state-tracker",
        label: "State Tracker",
        type: "worker",
        status: "running",
        description: "Tracks pipeline execution state",
        cpu: "3%",
        memory: "128MB",
      },
    ],
    connections: [
      {
        id: "pe1",
        source: "dag-parser",
        target: "dependency-resolver",
        type: "internal",
        animated: true,
      },
      {
        id: "pe2",
        source: "dependency-resolver",
        target: "parallel-executor",
        type: "internal",
        animated: true,
      },
      {
        id: "pe3",
        source: "parallel-executor",
        target: "state-tracker",
        type: "internal",
      },
    ],
  },

  // ============================================
  // DEEPER: Local LLM
  // ============================================
  "local-llm-detail": {
    id: "local-llm-detail",
    name: "Local LLM",
    description: "llama.cpp inference server",
    nodes: [
      {
        id: "model-loader",
        label: "Model Loader",
        type: "ai",
        status: "running",
        description: "Loads GGUF models into memory",
        cpu: "2%",
        memory: "4GB",
      },
      {
        id: "inference-engine",
        label: "Inference Engine",
        type: "ai",
        status: "running",
        description: "llama.cpp inference",
        cpu: "90%",
        memory: "6GB",
      },
      {
        id: "kv-cache",
        label: "KV Cache",
        type: "cache",
        status: "running",
        description: "Attention key-value cache",
        cpu: "5%",
        memory: "2GB",
      },
      {
        id: "batch-processor",
        label: "Batch Processor",
        type: "worker",
        status: "running",
        description: "Batches requests for efficiency",
        cpu: "8%",
        memory: "256MB",
      },
    ],
    connections: [
      {
        id: "ll1",
        source: "model-loader",
        target: "inference-engine",
        type: "internal",
      },
      {
        id: "ll2",
        source: "batch-processor",
        target: "inference-engine",
        type: "internal",
        animated: true,
      },
      {
        id: "ll3",
        source: "inference-engine",
        target: "kv-cache",
        type: "internal",
        animated: true,
      },
    ],
  },

  // ============================================
  // PROCESS FLOW: Val's Autonomous Coding Loop
  // (Example of a process/workflow flowchart)
  // ============================================
  "val-coding-loop": {
    id: "val-coding-loop",
    name: "Val's Autonomous Coding Loop",
    description: "The self-improvement and code generation workflow",
    nodes: [
      // Trigger Section
      {
        id: "coding-request",
        label: "Coding Request",
        type: "ai",
        nodeType: "process" as NodeType,
        processType: "trigger" as ProcessType,
        status: "running",
        description: "External coding request received",
      },
      {
        id: "autonomous-quest",
        label: "Autonomous Quest",
        type: "ai",
        nodeType: "process" as NodeType,
        processType: "trigger" as ProcessType,
        status: "running",
        description: "Self-initiated improvement task",
      },
      {
        id: "self-improvement-goal",
        label: "Self-Improvement Goal",
        type: "ai",
        nodeType: "process" as NodeType,
        processType: "trigger" as ProcessType,
        status: "running",
        description: "Goal-driven enhancement",
      },
      // Code Generation Section
      {
        id: "analyze-requirements",
        label: "Analyze Requirements",
        type: "ai",
        nodeType: "process" as NodeType,
        processType: "process" as ProcessType,
        status: "running",
        description: "Parse and understand the coding task",
      },
      {
        id: "select-algorithm",
        label: "Select Algorithm Template",
        type: "ai",
        nodeType: "process" as NodeType,
        processType: "process" as ProcessType,
        status: "running",
        description: "Choose optimal algorithm pattern",
      },
      {
        id: "apply-val-style",
        label: "Apply Val Style",
        type: "ai",
        nodeType: "process" as NodeType,
        processType: "process" as ProcessType,
        status: "running",
        description: "Apply Val's coding conventions",
      },
      {
        id: "compose-patterns",
        label: "Compose Patterns",
        type: "ai",
        nodeType: "process" as NodeType,
        processType: "process" as ProcessType,
        status: "running",
        description: "Combine patterns into solution",
      },
      {
        id: "explore-mutations",
        label: "Explore Mutations",
        type: "ai",
        nodeType: "process" as NodeType,
        processType: "process" as ProcessType,
        status: "running",
        description: "Try alternative implementations",
      },
      // Validation Section
      {
        id: "execute-sandbox",
        label: "Execute in Sandbox",
        type: "worker",
        nodeType: "process" as NodeType,
        processType: "validation" as ProcessType,
        status: "running",
        description: "Run code in isolated environment",
      },
      {
        id: "run-tests",
        label: "Run Tests",
        type: "worker",
        nodeType: "process" as NodeType,
        processType: "validation" as ProcessType,
        status: "running",
        description: "Execute test suite",
      },
      {
        id: "self-critique",
        label: "Self-Critique",
        type: "ai",
        nodeType: "process" as NodeType,
        processType: "validation" as ProcessType,
        status: "running",
        description: "Evaluate code quality",
      },
      {
        id: "creativity-score",
        label: "Creativity Score",
        type: "ai",
        nodeType: "process" as NodeType,
        processType: "validation" as ProcessType,
        status: "running",
        description: "Rate solution creativity",
      },
      // Decision
      {
        id: "success-check",
        label: "Success?",
        type: "ai",
        nodeType: "decision" as NodeType,
        status: "running",
        description: "Did the code pass all checks?",
      },
      // Learning Section - Success Path
      {
        id: "cache-pattern",
        label: "Cache Pattern",
        type: "cache",
        nodeType: "process" as NodeType,
        processType: "success" as ProcessType,
        status: "running",
        description: "Store successful pattern",
      },
      {
        id: "store-memory",
        label: "Store in Memory",
        type: "database",
        nodeType: "process" as NodeType,
        processType: "success" as ProcessType,
        status: "running",
        description: "Persist to long-term memory",
      },
      {
        id: "earn-spc",
        label: "Earn SPC",
        type: "ai",
        nodeType: "process" as NodeType,
        processType: "success" as ProcessType,
        status: "running",
        description: "Earn Self-Programming Credits",
      },
      // Learning Section - Retry Path
      {
        id: "iterate-retry",
        label: "Iterate and Retry",
        type: "worker",
        nodeType: "process" as NodeType,
        processType: "error" as ProcessType,
        status: "warning",
        description: "Adjust and try again",
      },
    ],
    connections: [
      // Triggers to Analyze
      {
        id: "vcl1",
        source: "coding-request",
        target: "analyze-requirements",
        type: "flow",
        animated: true,
      },
      {
        id: "vcl2",
        source: "autonomous-quest",
        target: "analyze-requirements",
        type: "flow",
        animated: true,
      },
      {
        id: "vcl3",
        source: "self-improvement-goal",
        target: "analyze-requirements",
        type: "flow",
        animated: true,
      },
      // Code Generation Chain
      {
        id: "vcl4",
        source: "analyze-requirements",
        target: "select-algorithm",
        type: "flow",
        animated: true,
      },
      {
        id: "vcl5",
        source: "select-algorithm",
        target: "apply-val-style",
        type: "flow",
      },
      {
        id: "vcl6",
        source: "apply-val-style",
        target: "compose-patterns",
        type: "flow",
      },
      {
        id: "vcl7",
        source: "compose-patterns",
        target: "explore-mutations",
        type: "flow",
      },
      // Validation Chain
      {
        id: "vcl8",
        source: "explore-mutations",
        target: "execute-sandbox",
        type: "flow",
        animated: true,
      },
      {
        id: "vcl9",
        source: "execute-sandbox",
        target: "run-tests",
        type: "flow",
      },
      {
        id: "vcl10",
        source: "run-tests",
        target: "self-critique",
        type: "flow",
      },
      {
        id: "vcl11",
        source: "self-critique",
        target: "creativity-score",
        type: "flow",
      },
      // Decision
      {
        id: "vcl12",
        source: "creativity-score",
        target: "success-check",
        type: "flow",
        animated: true,
      },
      // Success Path
      {
        id: "vcl13",
        source: "success-check",
        target: "cache-pattern",
        type: "flow",
        label: "Yes",
      },
      {
        id: "vcl14",
        source: "cache-pattern",
        target: "store-memory",
        type: "flow",
      },
      {
        id: "vcl15",
        source: "store-memory",
        target: "earn-spc",
        type: "flow",
        animated: true,
      },
      // Retry Path
      {
        id: "vcl16",
        source: "success-check",
        target: "iterate-retry",
        type: "flow",
        label: "No",
      },
      {
        id: "vcl17",
        source: "iterate-retry",
        target: "analyze-requirements",
        type: "flow",
        animated: true,
      },
    ],
  },
};

// Helper to get all flowchart IDs for navigation
export const getAllFlowchartIds = (): string[] => Object.keys(flowchartData);
