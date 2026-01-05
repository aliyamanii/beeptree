import { BPlusTreeNode, BPlusTree } from './BPlusTree.js';
import { Language, t } from './translations.js';

interface NodePosition {
    node: BPlusTreeNode;
    x: number;
    y: number;
    width: number;
    height: number;
}

export class TreeVisualizer {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private tree: BPlusTree;
    private language: Language = 'en';
    private minNodeWidth = 80;
    private maxNodeWidth = 300;
    private baseNodeWidth = 100;
    private keyWidth = 25; // Width per key
    private nodeHeight = 60;
    private horizontalSpacing = 50;
    private verticalSpacing = 100;
    
    // Calculate node width based on number of keys
    private getNodeWidth(node: BPlusTreeNode): number {
        const width = this.baseNodeWidth + (node.keys.length * this.keyWidth);
        return Math.max(this.minNodeWidth, Math.min(this.maxNodeWidth, width));
    }
    private highlightedKey: number | null = null;
    private highlightedNode: BPlusTreeNode | null = null;
    private highlightedNodes: BPlusTreeNode[] = [];
    private highlightedKeys: number[] = [];

    constructor(canvas: HTMLCanvasElement, tree: BPlusTree, language: Language = 'en') {
        this.canvas = canvas;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Could not get canvas context');
        }
        this.ctx = ctx;
        this.tree = tree;
        this.language = language;
        this.resizeCanvas();
    }

    setLanguage(language: Language): void {
        this.language = language;
    }

    setHighlightedKey(key: number | null): void {
        this.highlightedKey = key;
    }

    setHighlightedNode(node: BPlusTreeNode | null): void {
        this.highlightedNode = node;
    }

    setHighlightedNodes(nodes: BPlusTreeNode[]): void {
        this.highlightedNodes = nodes;
    }

    setHighlightedKeys(keys: number[]): void {
        this.highlightedKeys = keys;
    }

    clearHighlights(): void {
        this.highlightedKey = null;
        this.highlightedNode = null;
        this.highlightedNodes = [];
        this.highlightedKeys = [];
    }

    private getTheme(): 'light' | 'dark' {
        return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    }

    private getTextColor(): string {
        return this.getTheme() === 'light' ? '#0f172a' : '#f1f5f9';
    }

    private getMutedTextColor(): string {
        return this.getTheme() === 'light' ? '#64748b' : 'rgba(203, 213, 225, 0.7)';
    }

    private calculateRequiredWidth(): number {
        if (this.tree.root.keys.length === 0) {
            return 1200;
        }

        const levels: BPlusTreeNode[][] = [];
        
        // BFS to get nodes by level
        const queue: { node: BPlusTreeNode; level: number }[] = [{ node: this.tree.root, level: 0 }];
        while (queue.length > 0) {
            const { node, level } = queue.shift()!;
            if (!levels[level]) {
                levels[level] = [];
            }
            levels[level].push(node);
            
            if (!node.isLeaf) {
                for (const child of node.children) {
                    queue.push({ node: child as BPlusTreeNode, level: level + 1 });
                }
            }
        }

        // Find the widest level using actual node widths
        let maxWidth = 0;
        for (const nodes of levels) {
            let totalWidth = 0;
            for (let i = 0; i < nodes.length; i++) {
                totalWidth += this.getNodeWidth(nodes[i]);
                if (i < nodes.length - 1) {
                    totalWidth += this.horizontalSpacing;
                }
            }
            maxWidth = Math.max(maxWidth, totalWidth);
        }

        // Add padding on both sides
        return Math.max(maxWidth + 200, 1200);
    }

    private resizeCanvas(): void {
        const container = this.canvas.parentElement;
        if (container) {
            const containerWidth = container.clientWidth - 64; // Account for padding
            const requiredWidth = this.calculateRequiredWidth();
            
            // Canvas should be at least as wide as the container, but expand if tree is wider
            this.canvas.width = Math.max(containerWidth, requiredWidth);
            this.canvas.height = Math.max(800, this.tree.getHeight() * (this.nodeHeight + this.verticalSpacing) + 100);
        }
    }

    draw(): void {
        this.resizeCanvas();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.tree.root.keys.length === 0) {
            this.drawEmptyTree();
            return;
        }

        const positions = this.calculatePositions();
        this.drawConnections(positions);
        this.drawNodes(positions);
    }

    private drawEmptyTree(): void {
        this.ctx.save();
        this.ctx.font = '24px Inter, Arial, sans-serif';
        this.ctx.fillStyle = this.getMutedTextColor();
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(t('treeIsEmpty', this.language), this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.restore();
    }

    private calculatePositions(): Map<BPlusTreeNode, NodePosition> {
        const positions = new Map<BPlusTreeNode, NodePosition>();
        const levels: BPlusTreeNode[][] = [];
        
        // BFS to get nodes by level
        const queue: { node: BPlusTreeNode; level: number }[] = [{ node: this.tree.root, level: 0 }];
        while (queue.length > 0) {
            const { node, level } = queue.shift()!;
            if (!levels[level]) {
                levels[level] = [];
            }
            levels[level].push(node);
            
            if (!node.isLeaf) {
                for (const child of node.children) {
                    queue.push({ node: child as BPlusTreeNode, level: level + 1 });
                }
            }
        }

        // Calculate positions for each level
        const startY = 50;
        for (let level = 0; level < levels.length; level++) {
            const nodes = levels[level];
            
            // Calculate total width for this level using actual node widths
            let totalWidth = 0;
            const nodeWidths: number[] = [];
            for (const node of nodes) {
                const width = this.getNodeWidth(node);
                nodeWidths.push(width);
                totalWidth += width;
            }
            totalWidth += (nodes.length - 1) * this.horizontalSpacing;
            
            // Calculate starting X position (centered)
            let currentX = (this.canvas.width - totalWidth) / 2;
            
            for (let i = 0; i < nodes.length; i++) {
                const node = nodes[i];
                const nodeWidth = nodeWidths[i];
                const x = currentX + nodeWidth / 2;
                const y = startY + level * (this.nodeHeight + this.verticalSpacing);
                
                positions.set(node, {
                    node,
                    x,
                    y,
                    width: nodeWidth,
                    height: this.nodeHeight
                });
                
                // Move to next node position
                currentX += nodeWidth + this.horizontalSpacing;
            }
        }

        return positions;
    }

    private drawConnections(positions: Map<BPlusTreeNode, NodePosition>): void {
        const theme = this.getTheme();
        this.ctx.strokeStyle = theme === 'light' ? 'rgba(100, 116, 139, 0.4)' : 'rgba(148, 163, 184, 0.4)';
        this.ctx.lineWidth = 2;

        for (const [node, pos] of positions) {
            if (!node.isLeaf) {
                for (let i = 0; i < node.children.length; i++) {
                    const child = node.children[i] as BPlusTreeNode;
                    const childPos = positions.get(child);
                    if (childPos) {
                        // Nodes are centered at pos.x, pos.y
                        // Top edge: pos.y - pos.height / 2
                        // Bottom edge: pos.y + pos.height / 2
                        // Left edge: pos.x - pos.width / 2
                        // Right edge: pos.x + pos.width / 2
                        
                        // Start from center bottom of parent node (exact bottom edge)
                        const startX = pos.x;
                        const startY = pos.y + pos.height / 2;
                        // End at center top of child node (exact top edge)
                        const endX = childPos.x;
                        const endY = childPos.y - childPos.height / 2;
                        
                        // Draw straight diagonal line
                        this.ctx.beginPath();
                        this.ctx.moveTo(startX, startY);
                        this.ctx.lineTo(endX, endY);
                        this.ctx.stroke();
                    }
                }
            }
        }
    }

    private drawNodes(positions: Map<BPlusTreeNode, NodePosition>): void {
        for (const [node, pos] of positions) {
            this.drawNode(node, pos);
        }
    }

    private drawNode(node: BPlusTreeNode, pos: NodePosition): void {
        const isHighlighted = this.highlightedNode === node || this.highlightedNodes.includes(node);
        const theme = this.getTheme();
        
        // Draw node background with elegant colors (theme-aware)
        if (isHighlighted) {
            this.ctx.fillStyle = theme === 'light' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(245, 158, 11, 0.2)';
            this.ctx.strokeStyle = '#f59e0b';
            this.ctx.lineWidth = 3;
        } else if (node.isLeaf) {
            this.ctx.fillStyle = theme === 'light' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.15)';
            this.ctx.strokeStyle = theme === 'light' ? 'rgba(16, 185, 129, 0.7)' : 'rgba(16, 185, 129, 0.6)';
            this.ctx.lineWidth = 2;
        } else {
            this.ctx.fillStyle = theme === 'light' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.15)';
            this.ctx.strokeStyle = theme === 'light' ? 'rgba(99, 102, 241, 0.7)' : 'rgba(99, 102, 241, 0.6)';
            this.ctx.lineWidth = 2;
        }
        
        // Draw rounded rectangle manually for compatibility
        const x = pos.x - pos.width / 2;
        const y = pos.y - pos.height / 2;
        const w = pos.width;
        const h = pos.height;
        const r = 8;
        
        this.ctx.beginPath();
        this.ctx.moveTo(x + r, y);
        this.ctx.lineTo(x + w - r, y);
        this.ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        this.ctx.lineTo(x + w, y + h - r);
        this.ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        this.ctx.lineTo(x + r, y + h);
        this.ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        this.ctx.lineTo(x, y + r);
        this.ctx.quadraticCurveTo(x, y, x + r, y);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        // Draw keys
        const keySpacing = pos.width / (node.keys.length + 1);
        this.ctx.font = 'bold 14px Inter, Arial, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        for (let i = 0; i < node.keys.length; i++) {
            const key = node.keys[i];
            const keyX = pos.x - pos.width / 2 + (i + 1) * keySpacing;
            const keyY = pos.y;

            const isKeyHighlighted = this.highlightedKey === key || this.highlightedKeys.includes(key);
            
            if (isKeyHighlighted) {
                // Draw highlight circle with glow effect
                const gradient = this.ctx.createRadialGradient(keyX, keyY, 0, keyX, keyY, 20);
                gradient.addColorStop(0, 'rgba(245, 158, 11, 0.8)');
                gradient.addColorStop(1, 'rgba(245, 158, 11, 0.3)');
                this.ctx.fillStyle = gradient;
                this.ctx.beginPath();
                this.ctx.arc(keyX, keyY, 20, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.fillStyle = '#fbbf24';
                this.ctx.beginPath();
                this.ctx.arc(keyX, keyY, 18, 0, Math.PI * 2);
                this.ctx.fill();
            }

            // Use theme-aware text color
            if (isKeyHighlighted) {
                this.ctx.fillStyle = '#0f172a'; // Dark text on highlighted (yellow) background
            } else {
                this.ctx.fillStyle = this.getTextColor();
            }
            this.ctx.fillText(key.toString(), keyX, keyY);
        }

        // Draw node type label
        this.ctx.font = '10px Inter, Arial, sans-serif';
        this.ctx.fillStyle = this.getMutedTextColor();
        this.ctx.textAlign = 'left';
        this.ctx.fillText(
            node.isLeaf ? t('leaf', this.language) : t('internal', this.language),
            pos.x - pos.width / 2 + 5,
            pos.y - pos.height / 2 + 12
        );
    }

    clear(): void {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.highlightedKey = null;
        this.highlightedNode = null;
    }
}

