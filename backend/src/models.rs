//! Data models for FlowScope
//!
//! These models match the frontend TypeScript types for seamless integration

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

// =============================================================================
// CONTAINER MODELS
// =============================================================================

/// Container status enum matching Docker states
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum ContainerStatus {
    Running,
    Healthy,
    Unhealthy,
    Exited,
    Created,
    Paused,
    Restarting,
    Dead,
}

impl From<&str> for ContainerStatus {
    fn from(s: &str) -> Self {
        match s.to_lowercase().as_str() {
            "running" => Self::Running,
            "healthy" => Self::Healthy,
            "unhealthy" => Self::Unhealthy,
            "exited" => Self::Exited,
            "created" => Self::Created,
            "paused" => Self::Paused,
            "restarting" => Self::Restarting,
            "dead" => Self::Dead,
            _ => Self::Exited,
        }
    }
}

/// Service category for grouping containers
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "kebab-case")]
pub enum ServiceCategory {
    Aiml,
    Application,
    Infrastructure,
    Frontend,
    Monitoring,
    Game,
    Val,
    Blockchain,
    Other,
}

impl ServiceCategory {
    pub fn from_name(name: &str) -> Self {
        let lower = name.to_lowercase();
        if lower.starts_with("aiml-") {
            Self::Aiml
        } else if lower.starts_with("application-") {
            Self::Application
        } else if lower.starts_with("infrastructure-") {
            Self::Infrastructure
        } else if lower.starts_with("frontend-") {
            Self::Frontend
        } else if lower.starts_with("monitoring-") {
            Self::Monitoring
        } else if lower.starts_with("game-") {
            Self::Game
        } else if lower.starts_with("val-") {
            Self::Val
        } else if lower.starts_with("valina-validator") || lower.contains("chain") {
            Self::Blockchain
        } else {
            Self::Other
        }
    }
}

/// Container information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContainerInfo {
    pub id: String,
    pub name: String,
    pub image: String,
    pub status: ContainerStatus,
    pub health: Option<String>,
    pub category: ServiceCategory,
    pub ports: Vec<PortMapping>,
    pub networks: Vec<String>,
    pub created: DateTime<Utc>,
    pub labels: HashMap<String, String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub rust_equivalent: Option<String>,
}

/// Port mapping information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PortMapping {
    pub host_port: Option<u16>,
    pub container_port: u16,
    pub protocol: String,
}

// =============================================================================
// FLOWCHART MODELS (matching frontend types)
// =============================================================================

/// Node type for the flowchart
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum NodeType {
    Service,
    Process,
    Decision,
    Group,
}

/// Connection type between nodes
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum ConnectionType {
    Primary,
    Secondary,
    Data,
    Control,
    Network,
}

/// A node in the flowchart (matches frontend ServiceNode type)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FlowchartNode {
    pub id: String,
    pub name: String,
    pub description: String,
    pub status: ContainerStatus,
    pub node_type: NodeType,
    pub category: ServiceCategory,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub port: Option<u16>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub child_flowchart: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metrics: Option<NodeMetrics>,
}

/// Metrics for a node
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NodeMetrics {
    pub cpu_percent: Option<f64>,
    pub memory_mb: Option<u64>,
    pub uptime_hours: Option<f64>,
}

/// A connection between nodes (matches frontend ServiceConnection type)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FlowchartConnection {
    pub id: String,
    pub source: String,
    pub target: String,
    pub label: Option<String>,
    pub connection_type: ConnectionType,
}

/// A complete flowchart (matches frontend ServiceFlowchart type)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Flowchart {
    pub id: String,
    pub name: String,
    pub description: String,
    pub nodes: Vec<FlowchartNode>,
    pub connections: Vec<FlowchartConnection>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub parent_id: Option<String>,
}

// =============================================================================
// API RESPONSE MODELS
// =============================================================================

/// System topology overview
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SystemTopology {
    pub total_containers: usize,
    pub running_containers: usize,
    pub healthy_containers: usize,
    pub unhealthy_containers: usize,
    pub categories: HashMap<String, usize>,
    pub flowcharts: Vec<FlowchartSummary>,
    pub generated_at: DateTime<Utc>,
}

/// Summary of a flowchart for the overview
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FlowchartSummary {
    pub id: String,
    pub name: String,
    pub node_count: usize,
    pub category: ServiceCategory,
}

/// Network information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkInfo {
    pub id: String,
    pub name: String,
    pub driver: String,
    pub containers: Vec<String>,
}
