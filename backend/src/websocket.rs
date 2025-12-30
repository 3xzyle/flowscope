//! WebSocket handler for real-time container updates
//!
//! Broadcasts container status changes to connected clients

use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        State,
    },
    response::IntoResponse,
};
use futures::{SinkExt, StreamExt};
use serde::Serialize;
use std::time::Duration;
use tokio::time::interval;
use tracing::{debug, error, info};

use crate::{models::ContainerInfo, AppState};

#[derive(Debug, Clone, Serialize)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum WsMessage {
    #[serde(rename_all = "camelCase")]
    ContainerUpdate {
        containers: Vec<ContainerInfo>,
        timestamp: String,
    },
    #[serde(rename_all = "camelCase")]
    TopologyUpdate {
        total_containers: usize,
        running_containers: usize,
        healthy_containers: usize,
        unhealthy_containers: usize,
        timestamp: String,
    },
    Heartbeat {
        timestamp: String,
    },
}

/// WebSocket upgrade handler
pub async fn ws_handler(
    ws: WebSocketUpgrade,
    State(state): State<AppState>,
) -> impl IntoResponse {
    info!("New WebSocket connection");
    ws.on_upgrade(|socket| handle_socket(socket, state))
}

/// Handle WebSocket connection
async fn handle_socket(socket: WebSocket, state: AppState) {
    let (mut sender, mut receiver) = socket.split();

    // Spawn a task to send periodic updates
    let state_clone = state.clone();
    let send_task = tokio::spawn(async move {
        let mut ticker = interval(Duration::from_secs(5));
        
        loop {
            ticker.tick().await;
            
            // Get current topology
            match state_clone.docker.get_topology().await {
                Ok(topology) => {
                    let msg = WsMessage::TopologyUpdate {
                        total_containers: topology.total_containers,
                        running_containers: topology.running_containers,
                        healthy_containers: topology.healthy_containers,
                        unhealthy_containers: topology.unhealthy_containers,
                        timestamp: chrono::Utc::now().to_rfc3339(),
                    };
                    
                    let json = serde_json::to_string(&msg).unwrap();
                    if sender.send(Message::Text(json.into())).await.is_err() {
                        break;
                    }
                }
                Err(e) => {
                    error!("Failed to get topology for WS update: {}", e);
                }
            }
        }
    });

    // Handle incoming messages (mainly for ping/pong)
    let recv_task = tokio::spawn(async move {
        while let Some(Ok(msg)) = receiver.next().await {
            match msg {
                Message::Text(text) => {
                    debug!("Received WS text: {}", text);
                }
                Message::Close(_) => {
                    info!("WebSocket closed by client");
                    break;
                }
                _ => {}
            }
        }
    });

    // Wait for either task to finish
    tokio::select! {
        _ = send_task => {},
        _ = recv_task => {},
    }
    
    info!("WebSocket connection closed");
}
