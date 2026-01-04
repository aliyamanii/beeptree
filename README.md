# B+ Tree Visual Simulator

An elegant, interactive web-based visualization tool for B+ tree data structures, built with TypeScript. Features a beautiful dark theme with step-by-step algorithm visualization.

![B+ Tree Simulator](https://img.shields.io/badge/TypeScript-5.3-blue) ![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

### Core Functionality
- **Interactive Operations**: Insert, delete, and search values in the B+ tree
- **Visual Feedback**: Real-time highlighting of nodes and keys during operations
- **Configurable Order**: Adjust the tree order (minimum 3) to see how it affects structure
- **Random Insertion**: Quickly populate the tree with 10 random values
- **Auto-scrolling Canvas**: Automatically sizes to fit wide trees with horizontal scrolling

### Step-by-Step Mode 🎯
- **Algorithm Visualization**: Hold **Shift** while clicking Insert or Search to enter step-by-step mode
- **Detailed Explanations**: Each step includes a clear description of what's happening
- **Interactive Navigation**: 
  - ⏮ First - Jump to the beginning
  - ⏪ Previous - Go back one step
  - ▶ Play/Pause - Auto-advance through steps (1.5s per step)
  - ⏩ Next - Advance one step
  - ⏭ Last - Jump to the end
  - Close - Exit step-by-step mode
- **Visual Highlights**: Current nodes and keys are highlighted with elegant animations

### Design
- **Elegant Dark Theme**: Modern slate/indigo color palette with gradient accents
- **Glassmorphism Effects**: Beautiful backdrop blur and translucent surfaces
- **Smooth Animations**: Fluid transitions and hover effects throughout
- **Responsive Layout**: Works beautifully on desktop and mobile devices
- **Custom Scrollbars**: Styled to match the elegant theme

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd beeptree
```

2. Install dependencies:
```bash
npm install
```

3. Compile TypeScript:
```bash
npm run build
```

4. Open `index.html` in a web browser

### Development

To watch for changes and automatically recompile:
```bash
npm run watch
```

## 📖 Usage

### Basic Operations

1. **Set Tree Order**: Adjust the order input (minimum 3) to change the maximum number of keys per node
2. **Insert**: Enter a number and click "Insert" or press Enter
3. **Delete**: Enter a number and click "Delete" to remove it from the tree
4. **Search**: Enter a number and click "Search" to find and highlight it
5. **Clear**: Remove all nodes from the tree
6. **Random Insert**: Add 10 random values to the tree with smooth animations

### Step-by-Step Mode

To visualize algorithms step-by-step:

1. **For Insert Operations**:
   - Hold **Shift** and click "Insert" (or press Shift+Enter)
   - Navigate through each step using the controls
   - Watch as the algorithm finds the correct leaf, inserts the key, and handles splits

2. **For Search Operations**:
   - Hold **Shift** and click "Search"
   - Follow the search path through internal nodes
   - See how keys are compared at each level

3. **Navigation Tips**:
   - Use **Play** to automatically advance through steps
   - Click **Previous** to review any step
   - The explanation panel shows what's happening at each step

## 🌳 B+ Tree Properties

- **Leaf Nodes**: Store actual data values and are linked together for range queries
- **Internal Nodes**: Store keys that guide searches to leaf nodes
- **Order**: Maximum number of keys in a node (minimum keys = ⌈order/2⌉ - 1)
- **Balanced**: All leaf nodes are at the same level
- **Self-Balancing**: Automatically splits and merges nodes to maintain properties
- **Efficient**: O(log n) search, insert, and delete operations

## 🏗️ Technical Details

### Technology Stack
- **Language**: TypeScript 5.3+
- **Visualization**: HTML5 Canvas with custom rendering
- **Styling**: Modern CSS with CSS variables and glassmorphism
- **Architecture**: Modular design with separation of concerns

### Key Components

- **BPlusTree**: Core data structure implementation
- **BPlusTreeWithSteps**: Extended tree with step-by-step tracking
- **TreeVisualizer**: Canvas-based visualization engine
- **StepTracker**: Manages operation steps and navigation

## 📁 File Structure

```
beeptree/
├── src/
│   ├── BPlusTree.ts           # Core B+ tree data structure
│   ├── BPlusTreeWithSteps.ts  # Extended tree with step tracking
│   ├── TreeVisualizer.ts      # Canvas-based visualization
│   ├── StepTracker.ts         # Step-by-step operation tracking
│   └── main.ts                # Main application logic
├── dist/                      # Compiled JavaScript (generated)
├── index.html                 # HTML entry point
├── styles.css                 # Elegant dark theme styling
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
└── README.md                  # This file
```

## 🎨 Design Philosophy

The simulator features a carefully crafted dark theme designed for:
- **Clarity**: High contrast for easy reading
- **Elegance**: Subtle gradients and glassmorphism effects
- **Usability**: Intuitive controls and clear visual feedback
- **Performance**: Smooth animations and efficient rendering

## 🔧 Customization

### Changing Tree Order
The tree order determines the maximum number of keys per node. Higher orders create wider, shallower trees, while lower orders create narrower, deeper trees.

### Color Scheme
Colors are defined using CSS variables in `styles.css`. You can customize:
- Primary colors (indigo/purple gradients)
- Node colors (internal vs leaf nodes)
- Highlight colors (for step-by-step mode)
- Background gradients

## 📝 License

MIT License - feel free to use this project for learning and educational purposes.

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests
- Improve documentation

## 💡 Tips

- Use step-by-step mode to understand how B+ trees handle splits
- Try different tree orders to see how structure changes
- Insert random values to quickly build complex trees
- The canvas automatically scrolls to show wide trees

---

**Enjoy exploring B+ trees!** 🌲
