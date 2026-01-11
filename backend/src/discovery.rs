//! Docker Discovery Service
//!
//! Connects to Docker daemon and discovers container topology,
//! network relationships, and generates flowchart data.

use bollard::{
    container::{ListContainersOptions, LogsOptions, RestartContainerOptions, StopContainerOptions, InspectContainerOptions, StatsOptions},
    image::ListImagesOptions,
    network::ListNetworksOptions,
    Docker,
};
use chrono::{TimeZone, Utc};
use futures_util::StreamExt;
use std::collections::HashMap;

use crate::models::*;

/// Docker discovery service
pub struct DockerDiscovery {
    docker: Docker,
}

impl DockerDiscovery {
    pub fn new(docker: Docker) -> Self {
        Self { docker }
    }

    /// Get all containers with their information
    pub async fn list_containers(&self) -> Result<Vec<ContainerInfo>, bollard::errors::Error> {
        let options = ListContainersOptions::<String> {
            all: true,
            ..Default::default()
        };

        let containers = self.docker.list_containers(Some(options)).await?;
        let mut result = Vec::new();

        for container in containers {
            let id = container.id.clone().unwrap_or_default();
            let names = container.names.unwrap_or_default();
            let name = names
                .first()
                .map(|n| n.trim_start_matches('/').to_string())
                .unwrap_or_else(|| id.chars().take(12).collect());

            let image = container.image.unwrap_or_default();
            
            // Parse status
            let state = container.state.as_deref().unwrap_or("unknown");
            let status_str = container.status.as_deref().unwrap_or("");
            
            let status = if status_str.contains("(healthy)") {
                ContainerStatus::Healthy
            } else if status_str.contains("(unhealthy)") {
                ContainerStatus::Unhealthy
            } else {
                ContainerStatus::from(state)
            };

            // Parse health from status string
            let health = if status_str.contains("(healthy)") {
                Some("healthy".to_string())
            } else if status_str.contains("(unhealthy)") {
                Some("unhealthy".to_string())
            } else {
                None
            };

            // Parse ports
            let ports: Vec<PortMapping> = container
                .ports
                .unwrap_or_default()
                .into_iter()
                .map(|p| PortMapping {
                    host_port: p.public_port,
                    container_port: p.private_port as u16,
                    protocol: p.typ.map(|t| format!("{:?}", t).to_lowercase()).unwrap_or_else(|| "tcp".to_string()),
                })
                .collect();

            // Get networks
            let networks: Vec<String> = container
                .network_settings
                .as_ref()
                .and_then(|ns| ns.networks.as_ref())
                .map(|nets| nets.keys().cloned().collect())
                .unwrap_or_default();

            // Get labels
            let labels = container.labels.unwrap_or_default();

            // Check for Rust equivalent (convention: name ends with -rust-prod)
            let rust_equivalent = if !name.contains("rust") {
                let rust_name = name.replace("-prod", "-rust-prod");
                // We'll check if this exists in a batch later
                Some(rust_name)
            } else {
                None
            };

            // Parse created timestamp
            let created = container
                .created
                .and_then(|ts| Utc.timestamp_opt(ts, 0).single())
                .unwrap_or_else(Utc::now);

            let category = ServiceCategory::from_name(&name);

            result.push(ContainerInfo {
                id: id.chars().take(12).collect(),
                name,
                image,
                status,
                health,
                category,
                ports,
                networks,
                created,
                labels,
                rust_equivalent,
                stats: None, // Stats fetched separately for performance
                image_size_mb: None,
            });
        }

        // Sort by name for consistent output
        result.sort_by(|a, b| a.name.cmp(&b.name));

        Ok(result)
    }

    /// Get container stats (CPU, Memory, Network I/O) for a specific container
    pub async fn get_container_stats(&self, container_id: &str) -> Result<Option<ContainerStats>, bollard::errors::Error> {
        let options = StatsOptions {
            stream: false,
            one_shot: true,
        };
        
        let mut stream = self.docker.stats(container_id, Some(options));
        
        if let Some(result) = stream.next().await {
            match result {
                Ok(stats) => {
                    // Calculate CPU percentage
                    let cpu_delta = stats.cpu_stats.cpu_usage.total_usage.saturating_sub(
                        stats.precpu_stats.cpu_usage.total_usage
                    );
                    let system_delta = stats.cpu_stats.system_cpu_usage.unwrap_or(0).saturating_sub(
                        stats.precpu_stats.system_cpu_usage.unwrap_or(0)
                    );
                    let num_cpus = stats.cpu_stats.online_cpus.unwrap_or(1) as f64;
                    
                    let cpu_percent = if system_delta > 0 && cpu_delta > 0 {
                        (cpu_delta as f64 / system_delta as f64) * num_cpus * 100.0
                    } else {
                        0.0
                    };

                    // Calculate memory usage
                    let memory_usage = stats.memory_stats.usage.unwrap_or(0) as f64 / (1024.0 * 1024.0);
                    let memory_limit = stats.memory_stats.limit.unwrap_or(1) as f64 / (1024.0 * 1024.0);
                    let memory_percent = if memory_limit > 0.0 {
                        (memory_usage / memory_limit) * 100.0
                    } else {
                        0.0
                    };

                    // Calculate network I/O
                    let (network_rx, network_tx) = stats.networks
                        .as_ref()
                        .map(|nets| {
                            nets.values().fold((0u64, 0u64), |(rx, tx), net| {
                                (rx + net.rx_bytes, tx + net.tx_bytes)
                            })
                        })
                        .unwrap_or((0, 0));

                    // Calculate block I/O
                    let (block_read, block_write) = stats.blkio_stats.io_service_bytes_recursive
                        .as_ref()
                        .map(|io| {
                            io.iter().fold((0u64, 0u64), |(r, w), entry| {
                                match entry.op.as_str() {
                                    "read" | "Read" => (r + entry.value, w),
                                    "write" | "Write" => (r, w + entry.value),
                                    _ => (r, w)
                                }
                            })
                        })
                        .unwrap_or((0, 0));

                    Ok(Some(ContainerStats {
                        cpu_percent: (cpu_percent * 100.0).round() / 100.0,
                        memory_usage_mb: (memory_usage * 100.0).round() / 100.0,
                        memory_limit_mb: (memory_limit * 100.0).round() / 100.0,
                        memory_percent: (memory_percent * 100.0).round() / 100.0,
                        network_rx_mb: (network_rx as f64 / (1024.0 * 1024.0) * 100.0).round() / 100.0,
                        network_tx_mb: (network_tx as f64 / (1024.0 * 1024.0) * 100.0).round() / 100.0,
                        block_read_mb: (block_read as f64 / (1024.0 * 1024.0) * 100.0).round() / 100.0,
                        block_write_mb: (block_write as f64 / (1024.0 * 1024.0) * 100.0).round() / 100.0,
                        pids: stats.pids_stats.current.unwrap_or(0),
                    }))
                }
                Err(_) => Ok(None)
            }
        } else {
            Ok(None)
        }
    }

    /// Get all containers with their live stats (more expensive, used for detail views)
    pub async fn list_containers_with_stats(&self) -> Result<Vec<ContainerInfo>, bollard::errors::Error> {
        let mut containers = self.list_containers().await?;
        
        // Fetch stats for running containers only (to avoid timeout on exited containers)
        for container in containers.iter_mut() {
            if matches!(container.status, ContainerStatus::Running | ContainerStatus::Healthy) {
                if let Ok(Some(stats)) = self.get_container_stats(&container.name).await {
                    container.stats = Some(stats);
                }
            }
        }
        
        Ok(containers)
    }

    /// Get image sizes for optimization analysis
    pub async fn list_image_sizes(&self) -> Result<HashMap<String, f64>, bollard::errors::Error> {
        let options = ListImagesOptions::<String> {
            all: false,
            ..Default::default()
        };
        
        let images = self.docker.list_images(Some(options)).await?;
        let mut sizes: HashMap<String, f64> = HashMap::new();
        
        for image in images {
            let tags = image.repo_tags;
            if !tags.is_empty() {
                for tag in tags {
                    let size_mb = image.size as f64 / (1024.0 * 1024.0);
                    sizes.insert(tag, (size_mb * 100.0).round() / 100.0);
                }
            }
        }
        
        Ok(sizes)
    }

    /// Get container details by ID or name
    pub async fn get_container(&self, id: &str) -> Result<Option<ContainerInfo>, bollard::errors::Error> {
        let containers = self.list_containers().await?;
        Ok(containers
            .into_iter()
            .find(|c| c.id == id || c.name == id))
    }

    /// Get all networks with connected containers
    pub async fn list_networks(&self) -> Result<Vec<NetworkInfo>, bollard::errors::Error> {
        let options = ListNetworksOptions::<String> {
            ..Default::default()
        };

        let networks = self.docker.list_networks(Some(options)).await?;
        let mut result = Vec::new();

        for network in networks {
            let id = network.id.unwrap_or_default();
            let name = network.name.unwrap_or_default();
            let driver = network.driver.unwrap_or_else(|| "bridge".to_string());

            // Get containers in this network
            let containers: Vec<String> = network
                .containers
                .map(|c| c.keys().cloned().collect())
                .unwrap_or_default();

            result.push(NetworkInfo {
                id: id.chars().take(12).collect(),
                name,
                driver,
                containers,
            });
        }

        Ok(result)
    }

    /// Generate system topology overview
    pub async fn get_topology(&self) -> Result<SystemTopology, bollard::errors::Error> {
        let containers = self.list_containers().await?;
        
        let total = containers.len();
        let running = containers.iter().filter(|c| matches!(c.status, ContainerStatus::Running | ContainerStatus::Healthy)).count();
        let healthy = containers.iter().filter(|c| c.status == ContainerStatus::Healthy).count();
        let unhealthy = containers.iter().filter(|c| c.status == ContainerStatus::Unhealthy).count();

        // Count by category
        let mut categories: HashMap<String, usize> = HashMap::new();
        for container in &containers {
            let cat_name = format!("{:?}", container.category).to_lowercase();
            *categories.entry(cat_name).or_insert(0) += 1;
        }

        // Generate flowchart summaries
        let flowcharts = self.generate_flowchart_summaries(&containers);

        Ok(SystemTopology {
            total_containers: total,
            running_containers: running,
            healthy_containers: healthy,
            unhealthy_containers: unhealthy,
            categories,
            flowcharts,
            generated_at: Utc::now(),
        })
    }

    /// Generate flowchart summaries for each category
    fn generate_flowchart_summaries(&self, containers: &[ContainerInfo]) -> Vec<FlowchartSummary> {
        let mut summaries = Vec::new();

        // Group containers by category
        let mut by_category: HashMap<ServiceCategory, Vec<&ContainerInfo>> = HashMap::new();
        for container in containers {
            by_category
                .entry(container.category.clone())
                .or_insert_with(Vec::new)
                .push(container);
        }

        // Create a summary for each category
        for (category, cat_containers) in by_category {
            let cat_name = format!("{:?}", category).to_lowercase();
            summaries.push(FlowchartSummary {
                id: format!("{}-overview", cat_name),
                name: format!("{} Services", Self::category_display_name(&category)),
                node_count: cat_containers.len(),
                category,
            });
        }

        // Add system overview
        summaries.insert(0, FlowchartSummary {
            id: "system-overview".to_string(),
            name: "VAL System Overview".to_string(),
            node_count: containers.len(),
            category: ServiceCategory::Other,
        });

        summaries
    }

    fn category_display_name(category: &ServiceCategory) -> &'static str {
        match category {
            ServiceCategory::Aiml => "AI/ML",
            ServiceCategory::Application => "Application",
            ServiceCategory::Infrastructure => "Infrastructure",
            ServiceCategory::Frontend => "Frontend",
            ServiceCategory::Monitoring => "Monitoring",
            ServiceCategory::Game => "Game",
            ServiceCategory::Val => "Val Autonomy",
            ServiceCategory::Blockchain => "Blockchain",
            ServiceCategory::Other => "Other",
        }
    }

    /// Generate a flowchart for a specific category or view
    pub async fn generate_flowchart(&self, id: &str) -> Result<Option<Flowchart>, bollard::errors::Error> {
        let containers = self.list_containers().await?;
        let networks = self.list_networks().await?;

        if id == "system-overview" {
            return Ok(Some(self.generate_system_overview(&containers)));
        }

        // Check if it's a category overview
        if id.ends_with("-overview") {
            let category_str = id.trim_end_matches("-overview");
            let category = match category_str {
                "aiml" => Some(ServiceCategory::Aiml),
                "application" => Some(ServiceCategory::Application),
                "infrastructure" => Some(ServiceCategory::Infrastructure),
                "frontend" => Some(ServiceCategory::Frontend),
                "monitoring" => Some(ServiceCategory::Monitoring),
                "game" => Some(ServiceCategory::Game),
                "val" => Some(ServiceCategory::Val),
                "blockchain" => Some(ServiceCategory::Blockchain),
                _ => None,
            };

            if let Some(cat) = category {
                let filtered: Vec<_> = containers
                    .iter()
                    .filter(|c| c.category == cat)
                    .cloned()
                    .collect();
                return Ok(Some(self.generate_category_flowchart_with_stats(&cat, &filtered, &networks).await));
            }
        }

        // Check if it's a container-specific flowchart
        if let Some(container) = containers.iter().find(|c| c.id == id || c.name == id) {
            return Ok(Some(self.generate_container_flowchart_with_stats(container, &containers, &networks).await));
        }

        Ok(None)
    }

    /// Generate system overview flowchart
    fn generate_system_overview(&self, containers: &[ContainerInfo]) -> Flowchart {
        let mut nodes = Vec::new();
        let mut connections = Vec::new();

        // Create category group nodes
        let categories = [
            (ServiceCategory::Aiml, "AI/ML Services", "Consciousness, Learning, Memory systems"),
            (ServiceCategory::Application, "Application Services", "Backend APIs, Automation, Gateway"),
            (ServiceCategory::Infrastructure, "Infrastructure", "Databases, Cache, Message Queue"),
            (ServiceCategory::Frontend, "Frontend", "Web dashboards and UIs"),
            (ServiceCategory::Monitoring, "Monitoring", "Prometheus, Grafana, Logging"),
            (ServiceCategory::Val, "Val Autonomy", "Goal Manager, Code Editor, Git Service"),
            (ServiceCategory::Blockchain, "Blockchain", "Validators, Chain, Faucet"),
            (ServiceCategory::Game, "Game Services", "RPG Engine, Game Backend"),
        ];

        for (category, name, description) in categories {
            let count = containers.iter().filter(|c| c.category == category).count();
            if count == 0 {
                continue;
            }

            let healthy = containers
                .iter()
                .filter(|c| c.category == category && matches!(c.status, ContainerStatus::Healthy | ContainerStatus::Running))
                .count();

            let status = if healthy == count {
                ContainerStatus::Healthy
            } else if healthy > 0 {
                ContainerStatus::Running
            } else {
                ContainerStatus::Unhealthy
            };

            let cat_id = format!("{:?}", category).to_lowercase();
            nodes.push(FlowchartNode {
                id: cat_id.clone(),
                name: format!("{} ({})", name, count),
                description: description.to_string(),
                status,
                node_type: NodeType::Group,
                category: category.clone(),
                port: None,
                child_flowchart: Some(format!("{}-overview", cat_id)),
                metrics: None,
                stats: None,
            });
        }

        // Add connections between related categories
        let category_connections = [
            ("frontend", "application", "API calls"),
            ("application", "infrastructure", "Data"),
            ("application", "aiml", "AI requests"),
            ("aiml", "infrastructure", "Data"),
            ("val", "aiml", "Intelligence"),
            ("val", "application", "Automation"),
            ("monitoring", "application", "Metrics"),
            ("monitoring", "aiml", "Metrics"),
            ("game", "application", "Backend"),
            ("blockchain", "infrastructure", "State"),
        ];

        for (source, target, label) in category_connections {
            // Only add connection if both categories have containers
            let source_exists = nodes.iter().any(|n| n.id == source);
            let target_exists = nodes.iter().any(|n| n.id == target);
            
            if source_exists && target_exists {
                connections.push(FlowchartConnection {
                    id: format!("{}-to-{}", source, target),
                    source: source.to_string(),
                    target: target.to_string(),
                    label: Some(label.to_string()),
                    connection_type: ConnectionType::Primary,
                });
            }
        }

        Flowchart {
            id: "system-overview".to_string(),
            name: "VAL System Overview".to_string(),
            description: format!(
                "Complete system topology: {} containers across {} categories",
                containers.len(),
                nodes.len()
            ),
            nodes,
            connections,
            parent_id: None,
        }
    }

    /// Generate flowchart for a specific category
    fn generate_category_flowchart(
        &self,
        category: &ServiceCategory,
        containers: &[ContainerInfo],
        _networks: &[NetworkInfo],
    ) -> Flowchart {
        let mut nodes = Vec::new();
        let mut connections = Vec::new();

        // Sort containers by name for consistent ordering
        let mut sorted_containers: Vec<_> = containers.to_vec();
        sorted_containers.sort_by(|a, b| {
            // Try to extract numeric suffix for natural sorting
            let num_a = a.name.split('-').last().and_then(|s| s.parse::<u32>().ok()).unwrap_or(0);
            let num_b = b.name.split('-').last().and_then(|s| s.parse::<u32>().ok()).unwrap_or(0);
            num_a.cmp(&num_b)
        });

        for container in &sorted_containers {
            let port = container.ports.first().and_then(|p| p.host_port);
            
            nodes.push(FlowchartNode {
                id: container.id.clone(),
                name: container.name.clone(),
                description: format!("Image: {}", container.image),
                status: container.status.clone(),
                node_type: NodeType::Service,
                category: container.category.clone(),
                port,
                child_flowchart: Some(container.name.clone()),
                metrics: None,
                stats: None,
            });
        }

        // Create a simple chain/loop for homogeneous services (like validators)
        // Connect each node to the next one, and last to first for a ring
        if sorted_containers.len() > 1 {
            for i in 0..sorted_containers.len() {
                let source = &sorted_containers[i];
                let target = &sorted_containers[(i + 1) % sorted_containers.len()];
                
                connections.push(FlowchartConnection {
                    id: format!("{}-to-{}", source.id, target.id),
                    source: source.id.clone(),
                    target: target.id.clone(),
                    label: None,
                    connection_type: ConnectionType::Network,
                });
            }
        }

        let cat_name = Self::category_display_name(category);
        Flowchart {
            id: format!("{:?}-overview", category).to_lowercase(),
            name: format!("{} Services", cat_name),
            description: format!("{} services in the {} category", containers.len(), cat_name),
            nodes,
            connections,
            parent_id: Some("system-overview".to_string()),
        }
    }

    /// Generate category flowchart with stats for each container
    async fn generate_category_flowchart_with_stats(
        &self,
        category: &ServiceCategory,
        containers: &[ContainerInfo],
        _networks: &[NetworkInfo],
    ) -> Flowchart {
        let mut nodes = Vec::new();
        let mut connections = Vec::new();

        // Sort containers by name for consistent ordering
        let mut sorted_containers: Vec<_> = containers.to_vec();
        sorted_containers.sort_by(|a, b| {
            let num_a = a.name.split('-').last().and_then(|s| s.parse::<u32>().ok()).unwrap_or(0);
            let num_b = b.name.split('-').last().and_then(|s| s.parse::<u32>().ok()).unwrap_or(0);
            num_a.cmp(&num_b)
        });

        for container in &sorted_containers {
            let port = container.ports.first().and_then(|p| p.host_port);
            
            // Fetch stats for this container
            let stats = self.get_container_stats(&container.name).await.ok().flatten();
            
            nodes.push(FlowchartNode {
                id: container.id.clone(),
                name: container.name.clone(),
                description: format!("Image: {}", container.image),
                status: container.status.clone(),
                node_type: NodeType::Service,
                category: container.category.clone(),
                port,
                child_flowchart: Some(container.name.clone()),
                metrics: None,
                stats,
            });
        }

        // Create connections for homogeneous services
        if sorted_containers.len() > 1 {
            for i in 0..sorted_containers.len() {
                let source = &sorted_containers[i];
                let target = &sorted_containers[(i + 1) % sorted_containers.len()];
                
                connections.push(FlowchartConnection {
                    id: format!("{}-to-{}", source.id, target.id),
                    source: source.id.clone(),
                    target: target.id.clone(),
                    label: None,
                    connection_type: ConnectionType::Network,
                });
            }
        }

        let cat_name = Self::category_display_name(category);
        Flowchart {
            id: format!("{:?}-overview", category).to_lowercase(),
            name: format!("{} Services", cat_name),
            description: format!("{} services in the {} category", containers.len(), cat_name),
            nodes,
            connections,
            parent_id: Some("system-overview".to_string()),
        }
    }

    /// Generate container flowchart with stats
    async fn generate_container_flowchart_with_stats(
        &self,
        container: &ContainerInfo,
        all_containers: &[ContainerInfo],
        _networks: &[NetworkInfo],
    ) -> Flowchart {
        let mut nodes = Vec::new();
        let mut connections = Vec::new();

        // Add the main container with stats
        let main_stats = self.get_container_stats(&container.name).await.ok().flatten();
        nodes.push(FlowchartNode {
            id: container.id.clone(),
            name: container.name.clone(),
            description: format!("Image: {}", container.image),
            status: container.status.clone(),
            node_type: NodeType::Service,
            category: container.category.clone(),
            port: container.ports.first().and_then(|p| p.host_port),
            child_flowchart: None,
            metrics: None,
            stats: main_stats,
        });

        // Find related containers (same network)
        for other in all_containers {
            if other.id == container.id {
                continue;
            }

            let shared = container.networks.iter().any(|n| {
                n != "bridge" && other.networks.contains(n)
            });

            if shared {
                let other_stats = self.get_container_stats(&other.name).await.ok().flatten();
                nodes.push(FlowchartNode {
                    id: other.id.clone(),
                    name: other.name.clone(),
                    description: format!("Image: {}", other.image),
                    status: other.status.clone(),
                    node_type: NodeType::Service,
                    category: other.category.clone(),
                    port: other.ports.first().and_then(|p| p.host_port),
                    child_flowchart: Some(other.name.clone()),
                    metrics: None,
                    stats: other_stats,
                });

                connections.push(FlowchartConnection {
                    id: format!("{}-to-{}", container.id, other.id),
                    source: container.id.clone(),
                    target: other.id.clone(),
                    label: None,
                    connection_type: ConnectionType::Network,
                });
            }
        }

        Flowchart {
            id: container.name.clone(),
            name: format!("{} Detail", container.name),
            description: format!(
                "Container {} and its {} connected services",
                container.name,
                nodes.len() - 1
            ),
            nodes,
            connections,
            parent_id: Some(format!("{:?}-overview", container.category).to_lowercase()),
        }
    }

    /// Generate detailed flowchart for a specific container
    fn generate_container_flowchart(
        &self,
        container: &ContainerInfo,
        all_containers: &[ContainerInfo],
        _networks: &[NetworkInfo],
    ) -> Flowchart {
        let mut nodes = Vec::new();
        let mut connections = Vec::new();

        // Add the main container as central node
        nodes.push(FlowchartNode {
            id: container.id.clone(),
            name: container.name.clone(),
            description: format!("Image: {}", container.image),
            status: container.status.clone(),
            node_type: NodeType::Service,
            category: container.category.clone(),
            port: container.ports.first().and_then(|p| p.host_port),
            child_flowchart: None,
            metrics: None,
            stats: None,
        });

        // Find related containers (same network)
        for other in all_containers {
            if other.id == container.id {
                continue;
            }

            let shared = container.networks.iter().any(|n| {
                n != "bridge" && other.networks.contains(n)
            });

            if shared {
                nodes.push(FlowchartNode {
                    id: other.id.clone(),
                    name: other.name.clone(),
                    description: format!("Image: {}", other.image),
                    status: other.status.clone(),
                    node_type: NodeType::Service,
                    category: other.category.clone(),
                    port: other.ports.first().and_then(|p| p.host_port),
                    child_flowchart: Some(other.name.clone()),
                    metrics: None,
                    stats: None,
                });

                connections.push(FlowchartConnection {
                    id: format!("{}-to-{}", container.id, other.id),
                    source: container.id.clone(),
                    target: other.id.clone(),
                    label: None,
                    connection_type: ConnectionType::Network,
                });
            }
        }

        Flowchart {
            id: container.name.clone(),
            name: format!("{} Detail", container.name),
            description: format!(
                "Container {} and its {} connected services",
                container.name,
                nodes.len() - 1
            ),
            nodes,
            connections,
            parent_id: Some(format!("{:?}-overview", container.category).to_lowercase()),
        }
    }

    /// Infer connection type based on service names
    fn infer_connection_type(&self, source: &str, target: &str) -> Option<ConnectionType> {
        let source_lower = source.to_lowercase();
        let target_lower = target.to_lowercase();

        // Gateway/Router patterns
        if source_lower.contains("gateway") || source_lower.contains("router") {
            return Some(ConnectionType::Primary);
        }

        // Database patterns
        if target_lower.contains("postgres") || target_lower.contains("redis") || target_lower.contains("db") {
            return Some(ConnectionType::Data);
        }

        // Queue patterns
        if target_lower.contains("rabbitmq") || target_lower.contains("queue") {
            return Some(ConnectionType::Secondary);
        }

        // Same service prefix (likely related)
        let source_prefix = source_lower.split('-').next().unwrap_or("");
        let target_prefix = target_lower.split('-').next().unwrap_or("");
        if source_prefix == target_prefix && !source_prefix.is_empty() {
            return Some(ConnectionType::Control);
        }

        None
    }

    /// Get detailed container information including environment, volumes, health check
    pub async fn get_container_detail(&self, id: &str) -> Result<Option<ContainerDetail>, bollard::errors::Error> {
        // First get basic container info
        let container_info = match self.get_container(id).await? {
            Some(info) => info,
            None => return Ok(None),
        };

        // Inspect for detailed information
        let inspect = self.docker.inspect_container(&container_info.id, None::<InspectContainerOptions>).await?;
        
        // Extract environment variables
        let environment = inspect.config
            .as_ref()
            .and_then(|c| c.env.clone())
            .unwrap_or_default();

        // Extract command
        let command = inspect.config
            .as_ref()
            .and_then(|c| c.cmd.clone())
            .map(|cmds| cmds.join(" "));

        // Extract entrypoint
        let entrypoint = inspect.config
            .as_ref()
            .and_then(|c| c.entrypoint.clone());

        // Extract working directory
        let working_dir = inspect.config
            .as_ref()
            .and_then(|c| c.working_dir.clone());

        // Extract volumes/mounts
        let volumes: Vec<VolumeMount> = inspect.mounts
            .unwrap_or_default()
            .into_iter()
            .map(|m| VolumeMount {
                source: m.source.unwrap_or_default(),
                destination: m.destination.unwrap_or_default(),
                mode: m.mode.unwrap_or_else(|| "rw".to_string()),
            })
            .collect();

        // Extract health check config
        let health_check = inspect.config
            .as_ref()
            .and_then(|c| c.healthcheck.clone())
            .map(|hc| HealthCheckConfig {
                test: hc.test.unwrap_or_default(),
                interval_seconds: (hc.interval.unwrap_or(0) / 1_000_000_000) as u64,
                timeout_seconds: (hc.timeout.unwrap_or(0) / 1_000_000_000) as u64,
                retries: hc.retries.unwrap_or(0) as u32,
                start_period_seconds: (hc.start_period.unwrap_or(0) / 1_000_000_000) as u64,
            });

        Ok(Some(ContainerDetail {
            info: container_info,
            environment,
            command,
            entrypoint,
            working_dir,
            volumes,
            health_check,
        }))
    }

    /// Get container logs
    pub async fn get_container_logs(&self, id: &str, tail: usize) -> Result<Option<ContainerLogs>, bollard::errors::Error> {
        // First verify container exists
        let container_info = match self.get_container(id).await? {
            Some(info) => info,
            None => return Ok(None),
        };

        let options = LogsOptions::<String> {
            stdout: true,
            stderr: true,
            tail: tail.to_string(),
            ..Default::default()
        };

        let mut stream = self.docker.logs(&container_info.id, Some(options));
        let mut logs = Vec::new();

        while let Some(result) = stream.next().await {
            match result {
                Ok(output) => {
                    let line = output.to_string();
                    logs.push(line);
                }
                Err(_) => break,
            }
        }

        Ok(Some(ContainerLogs {
            container_id: container_info.id,
            container_name: container_info.name,
            logs,
            tail,
            since: None,
        }))
    }

    /// Restart a container
    pub async fn restart_container(&self, id: &str) -> Result<Option<ActionResult>, bollard::errors::Error> {
        let container_info = match self.get_container(id).await? {
            Some(info) => info,
            None => return Ok(None),
        };

        let options = RestartContainerOptions { t: 10 };
        
        match self.docker.restart_container(&container_info.id, Some(options)).await {
            Ok(_) => Ok(Some(ActionResult {
                success: true,
                container_id: container_info.id,
                container_name: container_info.name,
                action: "restart".to_string(),
                message: "Container restart initiated".to_string(),
            })),
            Err(e) => Ok(Some(ActionResult {
                success: false,
                container_id: container_info.id,
                container_name: container_info.name,
                action: "restart".to_string(),
                message: format!("Failed to restart: {}", e),
            })),
        }
    }

    /// Stop a container
    pub async fn stop_container(&self, id: &str) -> Result<Option<ActionResult>, bollard::errors::Error> {
        let container_info = match self.get_container(id).await? {
            Some(info) => info,
            None => return Ok(None),
        };

        let options = StopContainerOptions { t: 10 };
        
        match self.docker.stop_container(&container_info.id, Some(options)).await {
            Ok(_) => Ok(Some(ActionResult {
                success: true,
                container_id: container_info.id,
                container_name: container_info.name,
                action: "stop".to_string(),
                message: "Container stopped".to_string(),
            })),
            Err(e) => Ok(Some(ActionResult {
                success: false,
                container_id: container_info.id,
                container_name: container_info.name,
                action: "stop".to_string(),
                message: format!("Failed to stop: {}", e),
            })),
        }
    }

    /// Start a container
    pub async fn start_container(&self, id: &str) -> Result<Option<ActionResult>, bollard::errors::Error> {
        let container_info = match self.get_container(id).await? {
            Some(info) => info,
            None => return Ok(None),
        };

        match self.docker.start_container::<String>(&container_info.id, None).await {
            Ok(_) => Ok(Some(ActionResult {
                success: true,
                container_id: container_info.id,
                container_name: container_info.name,
                action: "start".to_string(),
                message: "Container started".to_string(),
            })),
            Err(e) => Ok(Some(ActionResult {
                success: false,
                container_id: container_info.id,
                container_name: container_info.name,
                action: "start".to_string(),
                message: format!("Failed to start: {}", e),
            })),
        }
    }
}
