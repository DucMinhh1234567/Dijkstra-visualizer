document.addEventListener('DOMContentLoaded', function() {
    // Constants
    const MAZE_WIDTH = 64;
    const MAZE_HEIGHT = 64;
    const TOTAL_LEVELS = 10;
    
    // DOM elements
    const mazeElement = document.getElementById('maze');
    const mazeButtonsContainer = document.getElementById('maze-buttons');
    const currentLevelSpan = document.getElementById('current-level');
    const stepCountSpan = document.getElementById('step-count');
    const bombsHitSpan = document.getElementById('bombs-hit');
    const scoreSpan = document.getElementById('score');
    const resetPathButton = document.getElementById('reset-path');
    const showSolutionButton = document.getElementById('show-solution');
    const resultsContent = document.getElementById('results-content');
    const levelCompleteModal = document.getElementById('level-complete-modal');
    const yourPathLengthSpan = document.getElementById('your-path-length');
    const optimalPathLengthSpan = document.getElementById('optimal-path-length');
    const modalBombsHitSpan = document.getElementById('modal-bombs-hit');
    const finalScoreSpan = document.getElementById('final-score');
    const nextLevelButton = document.getElementById('next-level');
    
    // Game state
    let mazes = [];
    let currentLevel = 1;
    let currentMaze = null;
    let currentPath = [];
    let bombsHit = 0;
    let userStartedDrawing = false;
    let userCompletedPath = false;
    let optimalPath = [];
    
    // Setup maze selection buttons
    for (let i = 1; i <= TOTAL_LEVELS; i++) {
        const button = document.createElement('button');
        button.className = 'maze-button';
        button.textContent = `Level ${i}`;
        button.addEventListener('click', () => loadMaze(i));
        mazeButtonsContainer.appendChild(button);
    }
    
    // Highlight the active maze button
    function updateMazeButtons() {
        const buttons = document.querySelectorAll('.maze-button');
        buttons.forEach((button, index) => {
            if (index + 1 === currentLevel) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }
    
    // Generate all mazes at startup
    generateAllMazes();
    
    // Generate all maze levels
    function generateAllMazes() {
        for (let i = 0; i < TOTAL_LEVELS; i++) {
            const maze = generateMaze(MAZE_WIDTH, MAZE_HEIGHT);
            mazes.push(maze);
        }
        
        // Load the first maze by default
        loadMaze(1);
    }
    
    // Load a specific maze level
    function loadMaze(level) {
        currentLevel = level;
        currentLevelSpan.textContent = level;
        updateMazeButtons();
        
        // Clear the user's path and reset score
        currentPath = [];
        bombsHit = 0;
        userStartedDrawing = false;
        userCompletedPath = false;
        
        // Update UI
        stepCountSpan.textContent = '0';
        bombsHitSpan.textContent = '0';
        scoreSpan.textContent = '0';
        resultsContent.textContent = 'Complete the maze to see results.';
        
        // Get the maze for this level
        currentMaze = mazes[level - 1];
        
        // Calculate optimal path using Dijkstra
        optimalPath = findOptimalPath(currentMaze);
        
        // Render the maze
        renderMaze();
    }
    
    // Render the current maze
    function renderMaze() {
        // Clear the maze container
        mazeElement.innerHTML = '';
        
        // Create cells
        for (let y = 0; y < MAZE_HEIGHT; y++) {
            for (let x = 0; x < MAZE_WIDTH; x++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                
                const cellType = currentMaze.grid[y][x];
                
                if (cellType === 'wall') {
                    cell.classList.add('wall');
                } else if (cellType === 'start') {
                    cell.classList.add('start');
                } else if (cellType === 'end') {
                    cell.classList.add('end');
                } else if (cellType === 'bomb') {
                    cell.classList.add('bomb');
                }
                
                // Add click event for path drawing
                cell.addEventListener('click', () => handleCellClick(x, y));
                
                // Add data attributes for position
                cell.dataset.x = x;
                cell.dataset.y = y;
                
                mazeElement.appendChild(cell);
            }
        }
    }
    
    // Handle cell click for drawing the path
    function handleCellClick(x, y) {
        const cellType = currentMaze.grid[y][x];
        
        // Can't click on walls
        if (cellType === 'wall') return;
        
        // If the user has completed the path, do nothing
        if (userCompletedPath) return;
        
        // Start drawing from the start cell
        if (!userStartedDrawing) {
            if (cellType === 'start') {
                userStartedDrawing = true;
                addToPath(x, y);
            }
            return;
        }
        
        // If this is the end cell, complete the path
        if (cellType === 'end') {
            // Check if the clicked cell is adjacent to the last cell in the path
            if (isAdjacent(x, y, currentPath[currentPath.length - 1])) {
                addToPath(x, y);
                completePathDrawing();
            }
            return;
        }
        
        // Otherwise, add to path if it's valid
        if (isValidPathMove(x, y)) {
            addToPath(x, y);
        }
    }
    
    // Add a cell to the path
    function addToPath(x, y) {
        currentPath.push({x, y});
        
        // Update the cell appearance
        const cell = document.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
        
        // Don't change the appearance of start and end cells
        const cellType = currentMaze.grid[y][x];
        if (cellType !== 'start' && cellType !== 'end') {
            cell.classList.add('path');
        }
        
        // Check if this is a bomb
        if (cellType === 'bomb') {
            bombsHit++;
            bombsHitSpan.textContent = bombsHit;
        }
        
        // Update step count
        stepCountSpan.textContent = currentPath.length - 1; // Subtract start position
        
        // Update score: path length + bombs penalty
        updateScore();
    }
    
    // Check if a move is valid for the path
    function isValidPathMove(x, y) {
        // Check if the cell is already in the path
        if (currentPath.some(pos => pos.x === x && pos.y === y)) {
            return false;
        }
        
        // Check if the cell is adjacent to the last cell in the path
        return isAdjacent(x, y, currentPath[currentPath.length - 1]);
    }
    
    // Check if two cells are adjacent
    function isAdjacent(x1, y1, pos2) {
        const {x: x2, y: y2} = pos2;
        
        // Check if cells are adjacent horizontally or vertically (not diagonally)
        return (
            (Math.abs(x1 - x2) === 1 && y1 === y2) ||
            (Math.abs(y1 - y2) === 1 && x1 === x2)
        );
    }
    
    // Complete the path drawing
    function completePathDrawing() {
        userCompletedPath = true;
        
        // Calculate and display results
        const pathLength = currentPath.length - 1; // Subtract start position
        const optimalLength = optimalPath.length - 1; // Subtract start position
        const score = calculateScore(pathLength, bombsHit);
        
        // Display results
        displayResults(pathLength, optimalLength, bombsHit, score);
        
        // Show level complete modal
        yourPathLengthSpan.textContent = pathLength;
        optimalPathLengthSpan.textContent = optimalLength;
        modalBombsHitSpan.textContent = bombsHit;
        finalScoreSpan.textContent = score;
        levelCompleteModal.style.display = 'block';
    }
    
    // Update score
    function updateScore() {
        const pathLength = currentPath.length - 1; // Subtract start position
        const score = calculateScore(pathLength, bombsHit);
        scoreSpan.textContent = score;
    }
    
    // Calculate score
    function calculateScore(pathLength, bombsHit) {
        // Score is penalized by both path length and bombs hit
        return pathLength + bombsHit;
    }
    
    // Display results
    function displayResults(pathLength, optimalLength, bombsHit, score) {
        let html = `<p><strong>Your path length:</strong> ${pathLength}</p>`;
        html += `<p><strong>Optimal path length:</strong> ${optimalLength}</p>`;
        html += `<p><strong>Bombs hit:</strong> ${bombsHit}</p>`;
        html += `<p><strong>Your score:</strong> ${score}</p>`;
        
        if (pathLength === optimalLength && bombsHit === 0) {
            html += `<p><strong>Perfect! You found the optimal path!</strong></p>`;
        } else {
            const difference = pathLength - optimalLength + bombsHit;
            html += `<p>You were ${difference} steps away from the optimal score.</p>`;
        }
        
        resultsContent.innerHTML = html;
    }
    
    // Reset path button
    resetPathButton.addEventListener('click', () => {
        if (userCompletedPath) return;
        
        // Clear the user's path
        currentPath = [];
        bombsHit = 0;
        userStartedDrawing = false;
        
        // Update UI
        stepCountSpan.textContent = '0';
        bombsHitSpan.textContent = '0';
        scoreSpan.textContent = '0';
        
        // Remove path styling
        const pathCells = document.querySelectorAll('.path');
        pathCells.forEach(cell => {
            cell.classList.remove('path');
        });
    });
    
    // Show solution button
    showSolutionButton.addEventListener('click', () => {
        // Remove existing solution cells
        const solutionCells = document.querySelectorAll('.solution');
        solutionCells.forEach(cell => {
            cell.classList.remove('solution');
        });
        
        // Display the optimal path
        optimalPath.forEach(pos => {
            const cellType = currentMaze.grid[pos.y][pos.x];
            if (cellType !== 'start' && cellType !== 'end') {
                const cell = document.querySelector(`.cell[data-x="${pos.x}"][data-y="${pos.y}"]`);
                cell.classList.add('solution');
            }
        });
    });
    
    // Next level button
    nextLevelButton.addEventListener('click', () => {
        // Hide the modal
        levelCompleteModal.style.display = 'none';
        
        // Load the next level or cycle back to level 1
        const nextLevel = currentLevel % TOTAL_LEVELS + 1;
        loadMaze(nextLevel);
    });
    
    // Generate a random maze
    function generateMaze(width, height) {
        // Initialize the maze grid with walls
        const grid = Array.from({length: height}, () => Array(width).fill('wall'));
        
        // Use a recursive backtracking algorithm to generate the maze
        const startX = 1 + Math.floor(Math.random() * (width - 2) / 2) * 2;
        const startY = 1 + Math.floor(Math.random() * (height - 2) / 2) * 2;
        
        // Create passages
        carvePassages(startX, startY, grid);
        
        // Create more openings to make the maze less linear
        addCycles(grid, width, height);
        
        // Add start and end points
        let startPoint = findRandomEmptyCell(grid);
        grid[startPoint.y][startPoint.x] = 'start';
        
        let endPoint = findRandomEmptyCell(grid);
        // Make sure start and end are not too close
        while (manhattanDistance(startPoint, endPoint) < Math.min(width, height) / 2) {
            endPoint = findRandomEmptyCell(grid);
        }
        grid[endPoint.y][endPoint.x] = 'end';
        
        // Add bombs
        const bombCount = Math.floor(Math.min(width, height) / 4);
        for (let i = 0; i < bombCount; i++) {
            const bombPoint = findRandomEmptyCell(grid);
            grid[bombPoint.y][bombPoint.x] = 'bomb';
        }
        
        return {
            width,
            height,
            grid,
            start: startPoint,
            end: endPoint
        };
    }
    
    // Carve passages in the maze using recursive backtracking
    function carvePassages(x, y, grid) {
        const directions = [
            [0, -2], // North
            [2, 0],  // East
            [0, 2],  // South
            [-2, 0]  // West
        ];
        
        // Randomize directions
        shuffleArray(directions);
        
        // Mark current cell as passage
        grid[y][x] = 'empty';
        
        // Explore in each direction
        for (const [dx, dy] of directions) {
            const nx = x + dx;
            const ny = y + dy;
            
            // Check if the new position is within the grid and is a wall
            if (isInGrid(nx, ny, grid) && grid[ny][nx] === 'wall') {
                // Carve a passage by making the wall in between a passage too
                grid[y + dy/2][x + dx/2] = 'empty';
                carvePassages(nx, ny, grid);
            }
        }
    }
    
    // Add some cycles to make the maze less linear
    function addCycles(grid, width, height) {
        const cycles = Math.floor(Math.min(width, height) / 10);
        
        for (let i = 0; i < cycles; i++) {
            // Find a random wall that connects two passages
            let x, y;
            do {
                x = 1 + Math.floor(Math.random() * (width - 2));
                y = 1 + Math.floor(Math.random() * (height - 2));
            } while (
                grid[y][x] !== 'wall' ||
                !isWallConnectingPassages(x, y, grid)
            );
            
            // Remove the wall to create a cycle
            grid[y][x] = 'empty';
        }
    }
    
    // Check if a wall connects two passages
    function isWallConnectingPassages(x, y, grid) {
        const horizontalPassages = 
            isInGrid(x-1, y, grid) && grid[y][x-1] === 'empty' &&
            isInGrid(x+1, y, grid) && grid[y][x+1] === 'empty';
        
        const verticalPassages = 
            isInGrid(x, y-1, grid) && grid[y-1][x] === 'empty' &&
            isInGrid(x, y+1, grid) && grid[y+1][x] === 'empty';
        
        return horizontalPassages || verticalPassages;
    }
    
    // Check if a position is within the grid
    function isInGrid(x, y, grid) {
        return y >= 0 && y < grid.length && x >= 0 && x < grid[0].length;
    }
    
    // Find a random empty cell in the grid
    function findRandomEmptyCell(grid) {
        const height = grid.length;
        const width = grid[0].length;
        
        let x, y;
        do {
            x = Math.floor(Math.random() * width);
            y = Math.floor(Math.random() * height);
        } while (grid[y][x] !== 'empty');
        
        return {x, y};
    }
    
    // Calculate Manhattan distance between two points
    function manhattanDistance(point1, point2) {
        return Math.abs(point1.x - point2.x) + Math.abs(point1.y - point2.y);
    }
    
    // Shuffle array in place
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    
    // Find optimal path using Dijkstra's algorithm
    function findOptimalPath(maze) {
        const grid = maze.grid;
        const height = grid.length;
        const width = grid[0].length;
        
        // Find start and end positions
        let start = null;
        let end = null;
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (grid[y][x] === 'start') {
                    start = {x, y};
                } else if (grid[y][x] === 'end') {
                    end = {x, y};
                }
            }
        }
        
        if (!start || !end) return [];
        
        // Dijkstra's algorithm
        const distances = {};
        const previous = {};
        const unvisited = new Set();
        
        // Initialize
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (grid[y][x] !== 'wall') {
                    const key = `${x},${y}`;
                    distances[key] = Infinity;
                    previous[key] = null;
                    unvisited.add(key);
                }
            }
        }
        
        distances[`${start.x},${start.y}`] = 0;
        
        // Main loop
        while (unvisited.size > 0) {
            // Find the unvisited node with the smallest distance
            let minDistance = Infinity;
            let current = null;
            
            unvisited.forEach(key => {
                if (distances[key] < minDistance) {
                    minDistance = distances[key];
                    current = key;
                }
            });
            
            if (current === null || current === `${end.x},${end.y}`) break;
            
            unvisited.delete(current);
            
            // Get the coordinates of the current node
            const [x, y] = current.split(',').map(Number);
            
            // Check neighbors
            const neighbors = [
                {x: x + 1, y},
                {x: x - 1, y},
                {x, y: y + 1},
                {x, y: y - 1}
            ];
            
            for (const neighbor of neighbors) {
                const nx = neighbor.x;
                const ny = neighbor.y;
                
                if (isInGrid(nx, ny, grid) && grid[ny][nx] !== 'wall') {
                    const key = `${nx},${ny}`;
                    
                    if (unvisited.has(key)) {
                        // The weight is 1 for each step, with additional penalty for bombs
                        let weight = 1;
                        if (grid[ny][nx] === 'bomb') {
                            weight = 2; // Extra penalty for bombs
                        }
                        
                        const alt = distances[current] + weight;
                        
                        if (alt < distances[key]) {
                            distances[key] = alt;
                            previous[key] = current;
                        }
                    }
                }
            }
        }
        
        // Reconstruct the path
        const path = [];
        let current = `${end.x},${end.y}`;
        
        if (previous[current] !== null || current === `${start.x},${start.y}`) {
            while (current) {
                const [x, y] = current.split(',').map(Number);
                path.unshift({x, y});
                current = previous[current];
            }
        }
        
        return path;
    }
}); 