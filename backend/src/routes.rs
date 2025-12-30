//! API Routes for FlowScope
//!
//! HTTP endpoints for the FlowScope frontend

use axum::{
    extract::{Path, State, Query},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use serde::Deserialize;
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

/// GET /api/container/:id/detail - Get detailed container info (env, volumes, health)
pub async fn get_container_full_detail(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    debug!("Getting container detail: {}", id);

    match state.docker.get_container_detail(&id).await {
        Ok(Some(detail)) => {
            info!("Found container detail: {}", detail.info.name);
            (StatusCode::OK, Json(detail)).into_response()
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
            error!("Failed to get container detail '{}': {}", id, e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({
                    "error": "Failed to get container detail",
                    "details": e.to_string()
                })),
            )
                .into_response()
        }
    }
}

#[derive(Deserialize)]
pub struct LogsQuery {
    #[serde(default = "default_tail")]
    pub tail: usize,
}

fn default_tail() -> usize {
    100
}

/// GET /api/container/:id/logs - Get container logs
pub async fn get_container_logs(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Query(query): Query<LogsQuery>,
) -> impl IntoResponse {
    debug!("Getting container logs: {} (tail: {})", id, query.tail);

    match state.docker.get_container_logs(&id, query.tail).await {
        Ok(Some(logs)) => {
            info!("Got {} log lines for container: {}", logs.logs.len(), logs.container_name);
            (StatusCode::OK, Json(logs)).into_response()
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
            error!("Failed to get logs for '{}': {}", id, e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({
                    "error": "Failed to get container logs",
                    "details": e.to_string()
                })),
            )
                .into_response()
        }
    }
}

/// POST /api/container/:id/restart - Restart a container
pub async fn restart_container(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    info!("Restarting container: {}", id);

    match state.docker.restart_container(&id).await {
        Ok(Some(result)) => {
            if result.success {
                info!("Restarted container: {}", result.container_name);
            } else {
                error!("Failed to restart: {}", result.message);
            }
            (if result.success { StatusCode::OK } else { StatusCode::INTERNAL_SERVER_ERROR }, Json(result)).into_response()
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
            error!("Failed to restart '{}': {}", id, e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({
                    "error": "Failed to restart container",
                    "details": e.to_string()
                })),
            )
                .into_response()
        }
    }
}

/// POST /api/container/:id/stop - Stop a container
pub async fn stop_container(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    info!("Stopping container: {}", id);

    match state.docker.stop_container(&id).await {
        Ok(Some(result)) => {
            if result.success {
                info!("Stopped container: {}", result.container_name);
            } else {
                error!("Failed to stop: {}", result.message);
            }
            (if result.success { StatusCode::OK } else { StatusCode::INTERNAL_SERVER_ERROR }, Json(result)).into_response()
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
            error!("Failed to stop '{}': {}", id, e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({
                    "error": "Failed to stop container",
                    "details": e.to_string()
                })),
            )
                .into_response()
        }
    }
}

/// POST /api/container/:id/start - Start a container
pub async fn start_container(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    info!("Starting container: {}", id);

    match state.docker.start_container(&id).await {
        Ok(Some(result)) => {
            if result.success {
                info!("Started container: {}", result.container_name);
            } else {
                error!("Failed to start: {}", result.message);
            }
            (if result.success { StatusCode::OK } else { StatusCode::INTERNAL_SERVER_ERROR }, Json(result)).into_response()
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
            error!("Failed to start '{}': {}", id, e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({
                    "error": "Failed to start container",
                    "details": e.to_string()
                })),
            )
                .into_response()
        }
    }
}

/// GET /api/container/:id/stats - Get container resource stats
pub async fn get_container_stats(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    debug!("Getting container stats: {}", id);

    match state.docker.get_container_stats(&id).await {
        Ok(Some(stats)) => {
            info!("Got stats for container: {}", id);
            (StatusCode::OK, Json(stats)).into_response()
        }
        Ok(None) => (
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({
                "error": "Container not found or not running",
                "id": id
            })),
        )
            .into_response(),
        Err(e) => {
            error!("Failed to get stats for '{}': {}", id, e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({
                    "error": "Failed to get container stats",
                    "details": e.to_string()
                })),
            )
                .into_response()
        }
    }
}

/// GET /api/containers/stats - Get all containers with live stats
pub async fn get_containers_with_stats(State(state): State<AppState>) -> impl IntoResponse {
    match state.docker.list_containers_with_stats().await {
        Ok(containers) => {
            info!("Listed {} containers with stats", containers.len());
            (StatusCode::OK, Json(containers)).into_response()
        }
        Err(e) => {
            error!("Failed to list containers with stats: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({
                    "error": "Failed to list containers with stats",
                    "details": e.to_string()
                })),
            )
                .into_response()
        }
    }
}

/// GET /api/images/sizes - Get all image sizes
pub async fn get_image_sizes(State(state): State<AppState>) -> impl IntoResponse {
    match state.docker.list_image_sizes().await {
        Ok(sizes) => {
            info!("Listed {} image sizes", sizes.len());
            (StatusCode::OK, Json(sizes)).into_response()
        }
        Err(e) => {
            error!("Failed to list image sizes: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({
                    "error": "Failed to list image sizes",
                    "details": e.to_string()
                })),
            )
                .into_response()
        }
    }
}
