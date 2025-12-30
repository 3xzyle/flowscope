//! FlowScope Backend - Docker Container Discovery Service
//!
//! This service provides real-time Docker container topology discovery
//! and generates flowchart data for the FlowScope frontend.
//!
//! ## Features
//! - Container discovery and status monitoring
//! - Network topology mapping
//! - Service relationship inference
//! - Real-time health status
//!
//! Part of Val's ecosystem - December 2025

use anyhow::Result;
use axum::{
    response::IntoResponse,
    routing::get,
    Json, Router,
};
use bollard::Docker;
use std::{net::SocketAddr, sync::Arc};
use tower_http::{cors::CorsLayer, trace::TraceLayer};
use tracing::info;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};

mod discovery;
mod models;
mod routes;
mod websocket;

use discovery::DockerDiscovery;

/// Application state shared across handlers
#[derive(Clone)]
pub struct AppState {
    pub docker: Arc<DockerDiscovery>,
}

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize logging
    tracing_subscriber::registry()
        .with(EnvFilter::try_from_default_env().unwrap_or_else(|_| {
            EnvFilter::new("flowscope_backend=debug,tower_http=debug")
        }))
        .with(tracing_subscriber::fmt::layer())
        .init();

    info!("🔭 FlowScope Backend starting...");

    // Connect to Docker
    let docker = Docker::connect_with_local_defaults()
        .expect("Failed to connect to Docker daemon");
    
    let discovery = DockerDiscovery::new(docker);
    
    let state = AppState {
        docker: Arc::new(discovery),
    };

    // Build router
    let app = Router::new()
        .route("/health", get(health_check))
        .route("/api/topology", get(routes::get_topology))
        .route("/api/containers", get(routes::get_containers))
        .route("/api/containers/stats", get(routes::get_containers_with_stats))
        .route("/api/networks", get(routes::get_networks))
        .route("/api/images/sizes", get(routes::get_image_sizes))
        .route("/api/flowchart/:id", get(routes::get_flowchart))
        .route("/api/container/:id", get(routes::get_container_detail))
        .route("/api/container/:id/detail", get(routes::get_container_full_detail))
        .route("/api/container/:id/logs", get(routes::get_container_logs))
        .route("/api/container/:id/stats", get(routes::get_container_stats))
        .route("/api/container/:id/restart", axum::routing::post(routes::restart_container))
        .route("/api/container/:id/stop", axum::routing::post(routes::stop_container))
        .route("/api/container/:id/start", axum::routing::post(routes::start_container))
        .route("/ws", get(websocket::ws_handler))
        .with_state(state)
        .layer(
            CorsLayer::very_permissive()
        )
        .layer(TraceLayer::new_for_http());

    let addr = SocketAddr::from(([0, 0, 0, 0], 8850));
    info!("🚀 FlowScope Backend listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}

async fn health_check() -> impl IntoResponse {
    Json(serde_json::json!({
        "status": "healthy",
        "service": "flowscope-backend",
        "version": "0.1.0"
    }))
}
