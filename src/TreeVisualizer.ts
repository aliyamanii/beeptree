import { BPlusTreeNode, BPlusTree } from './BPlusTree.js';
import { Language, t } from './translations.js';

interface NodePosition {
    node: BPlusTreeNode;
    x: number;
    y: number;
    width: number;
    height: number;
}

interface KeyAnimation {
    key: number;
    fromNode: BPlusTreeNode;
    toNode: BPlusTreeNode;
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    progress: number;
}

interface NodeSplitAnimation {
    originalNode: BPlusTreeNode;
    leftNode: BPlusTreeNode;
    rightNode: BPlusTreeNode;
    progress: number;
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
    
    // Animation state
    private previousPositions: Map<BPlusTreeNode, NodePosition> = new Map();
    private activeAnimations: {
        keyPromotions: KeyAnimation[];
        nodeSplits: NodeSplitAnimation[];
        positionTransitions: boolean;
    } = {
        keyPromotions: [],
        nodeSplits: [],
        positionTransitions: false
    };
    private animationStartTime: number = 0;
    private animationDuration: number = 600; // milliseconds
    private animationFrameId: number | null = null;
    
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

    // Update tree while preserving previous positions for animation
    updateTree(newTree: BPlusTree, preservePositions: boolean = true): void {
        if (preservePositions) {
            // Store current positions as previous positions before updating
            // Match nodes by ID so animations work even when tree is recreated
            const currentPositions = this.calculatePositions();
            const previousById = new Map<number, NodePosition>();
            
            for (const [node, pos] of currentPositions) {
                previousById.set(node.id, pos);
            }
            
            // Convert back to node-based map after tree update
            this.tree = newTree;
            const newPositions = this.calculatePositions();
            this.previousPositions = new Map<BPlusTreeNode, NodePosition>();
            
            for (const [node, pos] of newPositions) {
                const prevPos = previousById.get(node.id);
                if (prevPos) {
                    // Create a position with the previous coordinates but current node reference
                    this.previousPositions.set(node, {
                        node,
                        x: prevPos.x,
                        y: prevPos.y,
                        width: prevPos.width,
                        height: prevPos.height
                    });
                }
            }
        } else {
            this.tree = newTree;
        }
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

    draw(animate: boolean = false): void {
        this.resizeCanvas();
        
        if (this.tree.root.keys.length === 0) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.drawEmptyTree();
            return;
        }

        const newPositions = this.calculatePositions();
        
        if (animate && this.previousPositions.size > 0) {
            // Start animation
            this.startAnimation(newPositions);
        } else {
            // Draw immediately without animation
            this.previousPositions = new Map(newPositions);
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.drawConnections(newPositions);
            this.drawNodes(newPositions);
        }
    }

    // Method to set up key promotion animation
    setKeyPromotionAnimation(key: number, fromNode: BPlusTreeNode, toNode: BPlusTreeNode): void {
        const fromPos = this.previousPositions.get(fromNode);
        const toPos = this.previousPositions.get(toNode);
        
        if (fromPos && toPos) {
            // Calculate key positions
            const fromKeySpacing = fromPos.width / (fromNode.keys.length + 1);
            const keyIndex = fromNode.keys.indexOf(key);
            const fromKeyX = fromPos.x - fromPos.width / 2 + (keyIndex + 1) * fromKeySpacing;
            const fromKeyY = fromPos.y;
            
            const toKeySpacing = toPos.width / (toNode.keys.length + 1);
            const toKeyIndex = toNode.keys.indexOf(key);
            const toKeyX = toPos.x - toPos.width / 2 + (toKeyIndex + 1) * toKeySpacing;
            const toKeyY = toPos.y;
            
            this.activeAnimations.keyPromotions.push({
                key,
                fromNode,
                toNode,
                fromX: fromKeyX,
                fromY: fromKeyY,
                toX: toKeyX,
                toY: toKeyY,
                progress: 0
            });
        }
    }

    // Method to set up node split animation
    setNodeSplitAnimation(originalNode: BPlusTreeNode, leftNode: BPlusTreeNode, rightNode: BPlusTreeNode): void {
        const originalPos = this.previousPositions.get(originalNode);
        if (originalPos) {
            this.activeAnimations.nodeSplits.push({
                originalNode,
                leftNode,
                rightNode,
                progress: 0
            });
        }
    }

    private startAnimation(newPositions: Map<BPlusTreeNode, NodePosition>): void {
        this.animationStartTime = performance.now();
        this.activeAnimations.positionTransitions = true;
        
        const animate = () => {
            const elapsed = performance.now() - this.animationStartTime;
            const progress = Math.min(elapsed / this.animationDuration, 1);
            
            // Easing function (ease-out)
            const easedProgress = 1 - Math.pow(1 - progress, 3);
            
            // Update animation progress
            for (const anim of this.activeAnimations.keyPromotions) {
                anim.progress = easedProgress;
            }
            for (const anim of this.activeAnimations.nodeSplits) {
                anim.progress = easedProgress;
            }
            
            // Calculate interpolated positions
            const interpolatedPositions = this.interpolatePositions(newPositions, easedProgress);
            
            // Clear and redraw
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.drawConnections(interpolatedPositions);
            this.drawNodes(interpolatedPositions);
            this.drawAnimations(interpolatedPositions);
            
            if (progress < 1) {
                this.animationFrameId = requestAnimationFrame(animate);
            } else {
                // Animation complete
                this.previousPositions = new Map(newPositions);
                this.activeAnimations.keyPromotions = [];
                this.activeAnimations.nodeSplits = [];
                this.activeAnimations.positionTransitions = false;
                this.animationFrameId = null;
                
                // Final draw without animation
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.drawConnections(newPositions);
                this.drawNodes(newPositions);
            }
        };
        
        this.animationFrameId = requestAnimationFrame(animate);
    }

    private interpolatePositions(newPositions: Map<BPlusTreeNode, NodePosition>, progress: number): Map<BPlusTreeNode, NodePosition> {
        const interpolated = new Map<BPlusTreeNode, NodePosition>();
        
        for (const [node, newPos] of newPositions) {
            const oldPos = this.previousPositions.get(node);
            
            if (oldPos && this.activeAnimations.positionTransitions) {
                // Interpolate position
                interpolated.set(node, {
                    node,
                    x: oldPos.x + (newPos.x - oldPos.x) * progress,
                    y: oldPos.y + (newPos.y - oldPos.y) * progress,
                    width: oldPos.width + (newPos.width - oldPos.width) * progress,
                    height: newPos.height
                });
            } else {
                // No previous position, use new position
                interpolated.set(node, newPos);
            }
        }
        
        return interpolated;
    }

    private drawAnimations(positions: Map<BPlusTreeNode, NodePosition>): void {
        // Draw key promotion animations
        for (const anim of this.activeAnimations.keyPromotions) {
            const currentX = anim.fromX + (anim.toX - anim.fromX) * anim.progress;
            const currentY = anim.fromY + (anim.toY - anim.fromY) * anim.progress;
            
            // Draw animated key
            this.ctx.save();
            this.ctx.font = 'bold 14px Inter, Arial, sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            // Draw glow effect
            const gradient = this.ctx.createRadialGradient(currentX, currentY, 0, currentX, currentY, 25);
            gradient.addColorStop(0, 'rgba(245, 158, 11, 0.9)');
            gradient.addColorStop(1, 'rgba(245, 158, 11, 0.2)');
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(currentX, currentY, 25, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw key circle
            this.ctx.fillStyle = '#fbbf24';
            this.ctx.beginPath();
            this.ctx.arc(currentX, currentY, 22, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw key text
            this.ctx.fillStyle = '#0f172a';
            this.ctx.fillText(anim.key.toString(), currentX, currentY);
            this.ctx.restore();
        }
        
        // Draw node split animations
        for (const anim of this.activeAnimations.nodeSplits) {
            const leftPos = positions.get(anim.leftNode);
            const rightPos = positions.get(anim.rightNode);
            const originalPos = this.previousPositions.get(anim.originalNode);
            
            if (leftPos && rightPos && originalPos) {
                // Calculate split positions
                const leftX = originalPos.x + (leftPos.x - originalPos.x) * anim.progress;
                const leftY = originalPos.y + (leftPos.y - originalPos.y) * anim.progress;
                const rightX = originalPos.x + (rightPos.x - originalPos.x) * anim.progress;
                const rightY = originalPos.y + (rightPos.y - originalPos.y) * anim.progress;
                
                const leftWidth = originalPos.width + (leftPos.width - originalPos.width) * anim.progress;
                const rightWidth = originalPos.width + (rightPos.width - originalPos.width) * anim.progress;
                
                // Draw left node (fading out original, fading in new)
                const leftAlpha = anim.progress;
                this.drawNodeAtPosition(anim.leftNode, {
                    node: anim.leftNode,
                    x: leftX,
                    y: leftY,
                    width: leftWidth,
                    height: leftPos.height
                }, leftAlpha);
                
                // Draw right node
                const rightAlpha = anim.progress;
                this.drawNodeAtPosition(anim.rightNode, {
                    node: anim.rightNode,
                    x: rightX,
                    y: rightY,
                    width: rightWidth,
                    height: rightPos.height
                }, rightAlpha);
                
                // Draw original node fading out
                if (anim.progress < 1) {
                    const originalAlpha = 1 - anim.progress;
                    this.drawNodeAtPosition(anim.originalNode, originalPos, originalAlpha);
                }
            }
        }
    }

    private drawNodeAtPosition(node: BPlusTreeNode, pos: NodePosition, alpha: number = 1): void {
        const isHighlighted = this.highlightedNode === node || this.highlightedNodes.includes(node);
        const theme = this.getTheme();
        
        this.ctx.save();
        this.ctx.globalAlpha = alpha;
        
        // Draw node background
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
        
        // Draw rounded rectangle
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
            
            if (isKeyHighlighted) {
                this.ctx.fillStyle = '#0f172a';
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
        
        this.ctx.restore();
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

