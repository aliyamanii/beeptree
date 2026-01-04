# B+ Tree Visual Simulator

An interactive web-based visualization tool for B+ tree data structures, built with TypeScript.

## Features

- **Interactive Operations**: Insert, delete, and search values in the B+ tree
- **Visual Feedback**: Highlights nodes and keys during operations
- **Configurable Order**: Adjust the tree order (minimum 3)
- **Random Insertion**: Quickly populate the tree with random values
- **Beautiful UI**: Modern, responsive design with smooth animations

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Compile TypeScript:
```bash
npm run build
```

3. Open `index.html` in a web browser

### Development

To watch for changes and automatically recompile:
```bash
npm run watch
```

## Usage

1. **Set Tree Order**: Adjust the order input (minimum 3) to change the maximum number of keys per node
2. **Insert**: Enter a number and click "Insert" or press Enter
3. **Delete**: Enter a number and click "Delete" to remove it from the tree
4. **Search**: Enter a number and click "Search" to find and highlight it
5. **Clear**: Remove all nodes from the tree
6. **Random Insert**: Add 10 random values to the tree with animation

## B+ Tree Properties

- **Leaf Nodes**: Store actual data values and are linked together
- **Internal Nodes**: Store keys that guide searches to leaf nodes
- **Order**: Maximum number of keys in a node (minimum keys = ⌈order/2⌉ - 1)
- **Balanced**: All leaf nodes are at the same level
- **Self-Balancing**: Automatically splits and merges nodes to maintain properties

## Technical Details

- **Language**: TypeScript
- **Visualization**: HTML5 Canvas
- **Architecture**: Modular design with separate classes for tree logic and visualization

## File Structure

```
beeptree/
├── src/
│   ├── BPlusTree.ts      # B+ tree data structure implementation
│   ├── TreeVisualizer.ts # Canvas-based visualization
│   └── main.ts           # Main application logic
├── dist/                 # Compiled JavaScript (generated)
├── index.html            # HTML entry point
├── styles.css            # Styling
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── README.md             # This file
```

