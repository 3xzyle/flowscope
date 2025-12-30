//! API Routes for FlowScope
//!
//! HTTP endpoints for the FlowScope frontend

use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use tracing::{debug, error, info};

use crate::AppState;

/// GET /api/topology - Get system topology overview
pub async fn get_topology(State(state): State<AppState>) -> impl IntoResponse {
    match state.docker.get_topology().await {
        Ok(topology) => {
            info!(
                "Topology: {} containers, {} running",
                topology.total_containers, topology.running_containers
            );
            (StatusCode::OK, Json(topology)).into_response()
        }
        Err(e) => {
            error!("Failed to get topology: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({
                    "error": "Failed to get system topology",
                    "details": e.to_string()
                })),
            )
                .into_response()
        }
    }
}

/// GET /api/containers - List all containers
pub async fn get_containers(State(state): State<AppState>) -> impl IntoResponse {
    match state.docker.list_containers().await {
        Ok(containers) => {
            info!("Listed {} containers", containers.len());
            (StatusCode::OK, Json(containers)).into_response()
        }
        Err(e) => {
            error!("Failed to list containers: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({
                    "error": "Failed to list containers",
                    "details": e.to_string()
                })),
            )
                .into_response()
        }
    }
}

/// GET /api/networks - List all networks
pub async fn get_networks(State(state): State<AppState>) -> impl IntoResponse {
    match state.docker.list_networks().await {
        Ok(networks) => {
            info!("Listed {} networks", networks.len());
            (StatusCode::OK, Json(networks)).into_response()
        }
        Err(e) => {
            error!("Failed to list networks: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({
                    "error": "Failed to list networks",
                    "details": e.to_string()
                })),
            )
                .into_response()
        }
    }
}

/// GET /api/flowchart/:id - Get a specific flowchart
pub async fn get_flowchart(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    debug!("Getting flowchart: {}", id);

    match state.docker.generate_flowchart(&id).await {
        Ok(Some(flowchart)) => {
            info!(
                "Generated flowchart '{}' with {} nodes",
                flowchart.name,
                flowchart.nodes.len()
            );
            (StatusCode::OK, Json(flowchart)).into_response()
        }
        Ok(None) => (
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({
                "error": "Flowchart not found",
                "id": id
            })),
        )
            .into_response(),
        Err(e) => {
            error!("Failed to generate flowchart '{}': {}", id, e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({
                    "error": "Failed to generate flowchart",
                    "details": e.to_string()
                })),
            )
                .into_response()
        }
    }
}

/// GET /api/container/:id - Get container details
pub async fn get_container_detail(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    debug!("Getting container: {}", id);

    match state.docker.get_container(&id).await {
        Ok(Some(container)) => {
            info!("Found container: {}", container.name);
            (StatusCode::OK, Json(container)).into_response()
        }
        Ok(None) => (
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({
                "error": "Container not found",
                "id": id
            })),
        )
            .into_response(),
        Err(e) => {
            error!("Failed to get container '{}': {}", id, e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({
                    "error": "Failed to get container",
                    "details": e.to_string()
                })),
            )
                .into_response()
        }
    }
}
