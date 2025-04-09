document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const canvas = document.getElementById('graph-canvas');
    const nodeTool = document.getElementById('node-tool');
    const edgeTool = document.getElementById('edge-tool');
    const runDijkstraBtn = document.getElementById('run-dijkstra');
    const clearPathBtn = document.getElementById('clear-path');
    const generateRandomBtn = document.getElementById('generate-random');
    const clearAllBtn = document.getElementById('clear-all');
    const resultsContent = document.getElementById('results-content');
    const weightModal = document.getElementById('weight-modal');
    const weightInput = document.getElementById('weight-input');
    const confirmWeightBtn = document.getElementById('confirm-weight');
    const cancelWeightBtn = document.getElementById('cancel-weight');
    
    // Graph data
    let nodes = [];
    let edges = [];
    let nodeCounter = 0;
    let currentTool = 'node';
    let startNode = null;
    let endNode = null;
    let sourceNode = null;
    let targetNode = null;
    let tempEdge = null;
    let draggingNode = null;
    let offsetX = 0;
    let offsetY = 0;
    let edgeBeingCreated = null;
    
    // Tool selection
    nodeTool.addEventListener('click', () => {
        currentTool = 'node';
        nodeTool.classList.add('active');
        edgeTool.classList.remove('active');
    });
    
    edgeTool.addEventListener('click', () => {
        currentTool = 'edge';
        edgeTool.classList.add('active');
        nodeTool.classList.remove('active');
    });
    
    // Canvas click event - Add node
    canvas.addEventListener('click', (e) => {
        if (currentTool === 'node') {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Check if we're clicking on an existing node
            const clickedNode = getNodeAtPosition(x, y);
            if (clickedNode) return;
            
            addNode(x, y);
        }
    });
    
    // Functions for node management
    function addNode(x, y) {
        const nodeId = `node-${nodeCounter++}`;
        const node = {
            id: nodeId,
            x: x,
            y: y,
            element: createNodeElement(nodeId, x, y)
        };
        
        nodes.push(node);
        canvas.appendChild(node.element);
        
        // Add node event listeners
        setupNodeEventListeners(node);
    }
    
    function createNodeElement(id, x, y) {
        const nodeElement = document.createElement('div');
        nodeElement.className = 'node';
        nodeElement.id = id;
        nodeElement.textContent = id.replace('node-', '');
        nodeElement.style.left = `${x - 20}px`;
        nodeElement.style.top = `${y - 20}px`;
        return nodeElement;
    }
    
    function setupNodeEventListeners(node) {
        const nodeElement = node.element;
        
        // Drag start
        nodeElement.addEventListener('mousedown', (e) => {
            if (currentTool === 'edge') {
                // Start creating an edge
                sourceNode = node;
                const startX = node.x;
                const startY = node.y;
                
                // Create a temporary visual edge
                tempEdge = document.createElement('div');
                tempEdge.style.position = 'absolute';
                tempEdge.style.height = '2px';
                tempEdge.style.backgroundColor = '#666';
                tempEdge.style.transformOrigin = '0 0';
                tempEdge.style.zIndex = '1';
                canvas.appendChild(tempEdge);
                
                const moveHandler = (moveEvent) => {
                    const rect = canvas.getBoundingClientRect();
                    const endX = moveEvent.clientX - rect.left;
                    const endY = moveEvent.clientY - rect.top;
                    
                    // Calculate angle and length
                    const dx = endX - startX;
                    const dy = endY - startY;
                    const length = Math.sqrt(dx * dx + dy * dy);
                    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
                    
                    // Update temp edge style
                    tempEdge.style.width = `${length}px`;
                    tempEdge.style.left = `${startX}px`;
                    tempEdge.style.top = `${startY}px`;
                    tempEdge.style.transform = `rotate(${angle}deg)`;
                };
                
                const upHandler = (upEvent) => {
                    document.removeEventListener('mousemove', moveHandler);
                    document.removeEventListener('mouseup', upHandler);
                    
                    if (tempEdge) {
                        canvas.removeChild(tempEdge);
                        tempEdge = null;
                    }
                    
                    const rect = canvas.getBoundingClientRect();
                    const endX = upEvent.clientX - rect.left;
                    const endY = upEvent.clientY - rect.top;
                    
                    targetNode = getNodeAtPosition(endX, endY);
                    
                    if (targetNode && targetNode !== sourceNode) {
                        // Open weight modal
                        weightModal.style.display = 'block';
                        edgeBeingCreated = { source: sourceNode, target: targetNode };
                    }
                    
                    sourceNode = null;
                };
                
                document.addEventListener('mousemove', moveHandler);
                document.addEventListener('mouseup', upHandler);
            } else {
                // Start dragging the node
                draggingNode = node;
                const rect = nodeElement.getBoundingClientRect();
                offsetX = e.clientX - rect.left;
                offsetY = e.clientY - rect.top;
                
                nodeElement.style.zIndex = '10';
            }
            
            e.stopPropagation();
        });
        
        // Double click to set start node
        nodeElement.addEventListener('dblclick', () => {
            setStartNode(node);
        });
        
        // Right click to set end node
        nodeElement.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            setEndNode(node);
        });
    }
    
    // Mouse move event for dragging nodes
    document.addEventListener('mousemove', (e) => {
        if (draggingNode) {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left - offsetX + 20;
            const y = e.clientY - rect.top - offsetY + 20;
            
            draggingNode.element.style.left = `${x - 20}px`;
            draggingNode.element.style.top = `${y - 20}px`;
            
            // Update node coordinates
            draggingNode.x = x;
            draggingNode.y = y;
            
            // Update connected edges
            updateEdges(draggingNode);
        }
    });
    
    // Mouse up event to end dragging
    document.addEventListener('mouseup', () => {
        if (draggingNode) {
            draggingNode.element.style.zIndex = '2';
            draggingNode = null;
        }
    });
    
    // Weight modal buttons
    confirmWeightBtn.addEventListener('click', () => {
        const weight = parseInt(weightInput.value) || 1;
        if (edgeBeingCreated) {
            addEdge(edgeBeingCreated.source, edgeBeingCreated.target, weight);
            edgeBeingCreated = null;
        }
        weightModal.style.display = 'none';
    });
    
    cancelWeightBtn.addEventListener('click', () => {
        edgeBeingCreated = null;
        weightModal.style.display = 'none';
    });
    
    // Functions for edge management
    function addEdge(sourceNode, targetNode, weight) {
        // Check if edge already exists
        const existingEdge = edges.find(e => 
            (e.source === sourceNode && e.target === targetNode) || 
            (e.source === targetNode && e.target === sourceNode)
        );
        
        if (existingEdge) {
            // Update existing edge weight
            existingEdge.weight = weight;
            existingEdge.label.textContent = weight;
            return;
        }
        
        // Create edge SVG line
        const edgeElement = document.createElement('div');
        edgeElement.style.position = 'absolute';
        edgeElement.style.height = '3px';
        edgeElement.style.backgroundColor = '#666';
        edgeElement.style.transformOrigin = '0 0';
        edgeElement.style.zIndex = '1';
        
        // Create weight label
        const edgeLabel = document.createElement('div');
        edgeLabel.className = 'edge-label';
        edgeLabel.textContent = weight;
        
        canvas.appendChild(edgeElement);
        canvas.appendChild(edgeLabel);
        
        const edge = {
            source: sourceNode,
            target: targetNode,
            weight: weight,
            element: edgeElement,
            label: edgeLabel
        };
        
        edges.push(edge);
        updateEdgePosition(edge);
        
        // Add click event to edit weight
        edgeLabel.addEventListener('click', () => {
            edgeBeingCreated = edge;
            weightInput.value = edge.weight;
            weightModal.style.display = 'block';
        });
    }
    
    function updateEdgePosition(edge) {
        const x1 = edge.source.x;
        const y1 = edge.source.y;
        const x2 = edge.target.x;
        const y2 = edge.target.y;
        
        const dx = x2 - x1;
        const dy = y2 - y1;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        
        edge.element.style.width = `${length}px`;
        edge.element.style.left = `${x1}px`;
        edge.element.style.top = `${y1}px`;
        edge.element.style.transform = `rotate(${angle}deg)`;
        
        // Position the label at the middle of the edge
        edge.label.style.left = `${(x1 + x2) / 2 - 15}px`;
        edge.label.style.top = `${(y1 + y2) / 2 - 15}px`;
    }
    
    function updateEdges(node) {
        edges.forEach(edge => {
            if (edge.source === node || edge.target === node) {
                updateEdgePosition(edge);
            }
        });
    }
    
    // Helper function to find a node at given position
    function getNodeAtPosition(x, y) {
        const clickRadius = 20; // How close to the center we need to be
        
        return nodes.find(node => {
            const dx = node.x - x;
            const dy = node.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance <= clickRadius;
        });
    }
    
    // Set start and end nodes
    function setStartNode(node) {
        // Reset previous start node
        if (startNode) {
            startNode.element.classList.remove('start');
        }
        
        startNode = node;
        node.element.classList.add('start');
    }
    
    function setEndNode(node) {
        // Reset previous end node
        if (endNode) {
            endNode.element.classList.remove('end');
        }
        
        endNode = node;
        node.element.classList.add('end');
    }
    
    // Run Dijkstra button
    runDijkstraBtn.addEventListener('click', () => {
        if (!startNode) {
            alert('Please set a start node (double-click on a node)');
            return;
        }
        
        if (!endNode) {
            alert('Please set an end node (right-click on a node)');
            return;
        }
        
        // Clear previous path
        clearPath();
        
        // Run Dijkstra's algorithm
        const result = dijkstra(startNode);
        displayResults(result);
    });
    
    // Clear path button
    clearPathBtn.addEventListener('click', clearPath);
    
    function clearPath() {
        // Remove path highlighting
        nodes.forEach(node => {
            if (node !== startNode && node !== endNode) {
                node.element.classList.remove('path');
            }
        });
        
        edges.forEach(edge => {
            edge.element.style.backgroundColor = '#666';
        });
        
        resultsContent.innerHTML = 'Run Dijkstra\'s algorithm to see results.';
    }
    
    // Clear all button
    clearAllBtn.addEventListener('click', () => {
        while (nodes.length > 0) {
            const node = nodes.pop();
            canvas.removeChild(node.element);
        }
        
        while (edges.length > 0) {
            const edge = edges.pop();
            canvas.removeChild(edge.element);
            canvas.removeChild(edge.label);
        }
        
        startNode = null;
        endNode = null;
        nodeCounter = 0;
        resultsContent.innerHTML = 'Run Dijkstra\'s algorithm to see results.';
    });
    
    // Generate random graph
    generateRandomBtn.addEventListener('click', () => {
        // Clear existing graph
        clearAllBtn.click();
        
        // Generate random nodes
        const nodeCount = Math.floor(Math.random() * 6) + 5; // 5-10 nodes
        const canvasWidth = canvas.clientWidth - 100;
        const canvasHeight = canvas.clientHeight - 100;
        
        for (let i = 0; i < nodeCount; i++) {
            const x = Math.floor(Math.random() * canvasWidth) + 50;
            const y = Math.floor(Math.random() * canvasHeight) + 50;
            addNode(x, y);
        }
        
        // Generate random edges
        const edgeCount = Math.floor(Math.random() * nodeCount * 2) + nodeCount;
        
        for (let i = 0; i < edgeCount; i++) {
            const sourceIndex = Math.floor(Math.random() * nodes.length);
            let targetIndex = Math.floor(Math.random() * nodes.length);
            
            // Ensure we don't connect a node to itself
            while (targetIndex === sourceIndex) {
                targetIndex = Math.floor(Math.random() * nodes.length);
            }
            
            const weight = Math.floor(Math.random() * 20) + 1;
            addEdge(nodes[sourceIndex], nodes[targetIndex], weight);
        }
        
        // Set random start and end nodes
        const startIndex = Math.floor(Math.random() * nodes.length);
        let endIndex = Math.floor(Math.random() * nodes.length);
        
        while (endIndex === startIndex) {
            endIndex = Math.floor(Math.random() * nodes.length);
        }
        
        setStartNode(nodes[startIndex]);
        setEndNode(nodes[endIndex]);
    });
    
    // Dijkstra's Algorithm Implementation
    function dijkstra(start) {
        // Create adjacency list representation of the graph
        const graph = {};
        nodes.forEach(node => {
            graph[node.id] = {};
        });
        
        edges.forEach(edge => {
            graph[edge.source.id][edge.target.id] = edge.weight;
            graph[edge.target.id][edge.source.id] = edge.weight; // Undirected graph
        });
        
        // Initialize distance and previous data structures
        const distances = {};
        const previous = {};
        const unvisited = new Set();
        
        nodes.forEach(node => {
            distances[node.id] = Infinity;
            previous[node.id] = null;
            unvisited.add(node.id);
        });
        
        distances[start.id] = 0;
        
        while (unvisited.size > 0) {
            // Find the unvisited node with the smallest distance
            let minDistance = Infinity;
            let current = null;
            
            unvisited.forEach(nodeId => {
                if (distances[nodeId] < minDistance) {
                    minDistance = distances[nodeId];
                    current = nodeId;
                }
            });
            
            // If we have no reachable nodes left or reached the end, break
            if (current === null || current === endNode.id) break;
            
            // Remove current from unvisited
            unvisited.delete(current);
            
            // Check each neighbor of current
            for (const neighbor in graph[current]) {
                if (unvisited.has(neighbor)) {
                    const alt = distances[current] + graph[current][neighbor];
                    if (alt < distances[neighbor]) {
                        distances[neighbor] = alt;
                        previous[neighbor] = current;
                    }
                }
            }
        }
        
        return { distances, previous };
    }
    
    // Display results and highlight the path
    function displayResults(result) {
        if (!endNode) return;
        
        const { distances, previous } = result;
        
        // Check if the end node is reachable
        if (distances[endNode.id] === Infinity) {
            resultsContent.innerHTML = '<p>No path found from start to end node!</p>';
            return;
        }
        
        // Reconstruct the path
        const path = [];
        let current = endNode.id;
        
        while (current !== null) {
            path.unshift(current);
            current = previous[current];
        }
        
        // Highlight nodes in the path
        path.forEach(nodeId => {
            const node = nodes.find(n => n.id === nodeId);
            if (node !== startNode && node !== endNode) {
                node.element.classList.add('path');
            }
        });
        
        // Highlight edges in the path
        for (let i = 0; i < path.length - 1; i++) {
            const sourceId = path[i];
            const targetId = path[i + 1];
            
            edges.forEach(edge => {
                if ((edge.source.id === sourceId && edge.target.id === targetId) ||
                    (edge.source.id === targetId && edge.target.id === sourceId)) {
                    edge.element.style.backgroundColor = '#9b59b6';
                    edge.element.style.height = '5px';
                }
            });
        }
        
        // Display results
        let html = `<p><strong>Shortest path from Node ${startNode.id.replace('node-', '')} to Node ${endNode.id.replace('node-', '')}</strong></p>`;
        html += `<p>Total distance: ${distances[endNode.id]}</p>`;
        html += '<p>Path: ';
        
        path.forEach((nodeId, index) => {
            html += nodeId.replace('node-', '');
            if (index < path.length - 1) {
                html += ' → ';
            }
        });
        html += '</p>';
        
        resultsContent.innerHTML = html;
    }
}); 