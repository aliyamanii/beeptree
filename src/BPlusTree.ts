export class BPlusTreeNode {
    keys: number[] = [];
    children: (BPlusTreeNode | number)[] = [];
    isLeaf: boolean;
    parent: BPlusTreeNode | null = null;
    next: BPlusTreeNode | null = null; // For leaf nodes

    constructor(isLeaf: boolean = false) {
        this.isLeaf = isLeaf;
    }
}

export class BPlusTree {
    root: BPlusTreeNode;
    order: number; // Maximum number of keys in a node
    minKeys: number; // Minimum number of keys (except root)

    constructor(order: number = 4) {
        if (order < 3) {
            throw new Error("Order must be at least 3");
        }
        this.order = order;
        this.minKeys = Math.ceil(order / 2) - 1;
        this.root = new BPlusTreeNode(true);
    }

    search(key: number): BPlusTreeNode | null {
        let node = this.root;
        
        while (!node.isLeaf) {
            let i = 0;
            while (i < node.keys.length && key >= node.keys[i]) {
                i++;
            }
            node = node.children[i] as BPlusTreeNode;
        }

        // Check if key exists in leaf
        if (node.keys.includes(key)) {
            return node;
        }
        return null;
    }

    insert(key: number): void {
        const leaf = this.findLeaf(key);
        
        if (leaf.keys.includes(key)) {
            return; // Key already exists
        }

        this.insertIntoLeaf(leaf, key);
        
        if (leaf.keys.length > this.order - 1) {
            this.splitLeaf(leaf);
        }
    }

    protected findLeaf(key: number): BPlusTreeNode {
        let node = this.root;
        
        while (!node.isLeaf) {
            let i = 0;
            while (i < node.keys.length && key >= node.keys[i]) {
                i++;
            }
            node = node.children[i] as BPlusTreeNode;
        }
        
        return node;
    }

    protected insertIntoLeaf(leaf: BPlusTreeNode, key: number): void {
        let i = 0;
        while (i < leaf.keys.length && leaf.keys[i] < key) {
            i++;
        }
        leaf.keys.splice(i, 0, key);
    }

    protected splitLeaf(leaf: BPlusTreeNode): void {
        const mid = Math.ceil(this.order / 2);
        const newLeaf = new BPlusTreeNode(true);
        
        newLeaf.keys = leaf.keys.splice(mid);
        newLeaf.parent = leaf.parent;
        newLeaf.next = leaf.next;
        leaf.next = newLeaf;

        const promoteKey = newLeaf.keys[0];

        if (leaf.parent === null) {
            // Create new root
            const newRoot = new BPlusTreeNode(false);
            newRoot.keys = [promoteKey];
            newRoot.children = [leaf, newLeaf];
            leaf.parent = newRoot;
            newLeaf.parent = newRoot;
            this.root = newRoot;
        } else {
            this.insertIntoInternal(leaf.parent, promoteKey, newLeaf);
        }
    }

    protected insertIntoInternal(node: BPlusTreeNode, key: number, rightChild: BPlusTreeNode): void {
        let i = 0;
        while (i < node.keys.length && node.keys[i] < key) {
            i++;
        }
        node.keys.splice(i, 0, key);
        node.children.splice(i + 1, 0, rightChild);
        rightChild.parent = node;

        if (node.keys.length > this.order - 1) {
            this.splitInternal(node);
        }
    }

    protected splitInternal(node: BPlusTreeNode): void {
        const mid = Math.floor(this.order / 2);
        const promoteKey = node.keys[mid];
        const newInternal = new BPlusTreeNode(false);
        
        newInternal.keys = node.keys.splice(mid + 1);
        newInternal.children = node.children.splice(mid + 1);
        newInternal.parent = node.parent;

        // Update parent references
        for (const child of newInternal.children) {
            (child as BPlusTreeNode).parent = newInternal;
        }

        if (node.parent === null) {
            // Create new root
            const newRoot = new BPlusTreeNode(false);
            newRoot.keys = [promoteKey];
            newRoot.children = [node, newInternal];
            node.parent = newRoot;
            newInternal.parent = newRoot;
            this.root = newRoot;
        } else {
            this.insertIntoInternal(node.parent, promoteKey, newInternal);
        }
    }

    delete(key: number): boolean {
        const leaf = this.findLeaf(key);
        const keyIndex = leaf.keys.indexOf(key);
        
        if (keyIndex === -1) {
            return false; // Key not found
        }

        leaf.keys.splice(keyIndex, 1);

        if (leaf === this.root) {
            return true; // Root can have any number of keys
        }

        if (leaf.keys.length < this.minKeys) {
            this.handleLeafUnderflow(leaf);
        }

        return true;
    }

    private handleLeafUnderflow(leaf: BPlusTreeNode): void {
        const parent = leaf.parent!;
        const leafIndex = parent.children.indexOf(leaf);

        // Try borrowing from left sibling
        if (leafIndex > 0) {
            const leftSibling = parent.children[leafIndex - 1] as BPlusTreeNode;
            if (leftSibling.keys.length > this.minKeys) {
                const borrowedKey = leftSibling.keys.pop()!;
                leaf.keys.unshift(borrowedKey);
                parent.keys[leafIndex - 1] = leaf.keys[0];
                return;
            }
        }

        // Try borrowing from right sibling
        if (leafIndex < parent.children.length - 1) {
            const rightSibling = parent.children[leafIndex + 1] as BPlusTreeNode;
            if (rightSibling.keys.length > this.minKeys) {
                const borrowedKey = rightSibling.keys.shift()!;
                leaf.keys.push(borrowedKey);
                parent.keys[leafIndex] = rightSibling.keys[0];
                return;
            }
        }

        // Merge with sibling
        if (leafIndex > 0) {
            const leftSibling = parent.children[leafIndex - 1] as BPlusTreeNode;
            leftSibling.keys.push(...leaf.keys);
            leftSibling.next = leaf.next;
            parent.keys.splice(leafIndex - 1, 1);
            parent.children.splice(leafIndex, 1);
            
            if (parent === this.root && parent.keys.length === 0) {
                this.root = leftSibling;
                leftSibling.parent = null;
            } else if (parent.keys.length < this.minKeys && parent !== this.root) {
                this.handleInternalUnderflow(parent);
            }
        } else {
            const rightSibling = parent.children[leafIndex + 1] as BPlusTreeNode;
            leaf.keys.push(...rightSibling.keys);
            leaf.next = rightSibling.next;
            parent.keys.splice(leafIndex, 1);
            parent.children.splice(leafIndex + 1, 1);
            
            if (parent === this.root && parent.keys.length === 0) {
                this.root = leaf;
                leaf.parent = null;
            } else if (parent.keys.length < this.minKeys && parent !== this.root) {
                this.handleInternalUnderflow(parent);
            }
        }
    }

    private handleInternalUnderflow(node: BPlusTreeNode): void {
        const parent = node.parent!;
        const nodeIndex = parent.children.indexOf(node);

        // Try borrowing from left sibling
        if (nodeIndex > 0) {
            const leftSibling = parent.children[nodeIndex - 1] as BPlusTreeNode;
            if (leftSibling.keys.length > this.minKeys) {
                const parentKey = parent.keys[nodeIndex - 1];
                node.keys.unshift(parentKey);
                parent.keys[nodeIndex - 1] = leftSibling.keys.pop()!;
                const borrowedChild = leftSibling.children.pop() as BPlusTreeNode;
                node.children.unshift(borrowedChild);
                borrowedChild.parent = node;
                return;
            }
        }

        // Try borrowing from right sibling
        if (nodeIndex < parent.children.length - 1) {
            const rightSibling = parent.children[nodeIndex + 1] as BPlusTreeNode;
            if (rightSibling.keys.length > this.minKeys) {
                const parentKey = parent.keys[nodeIndex];
                node.keys.push(parentKey);
                parent.keys[nodeIndex] = rightSibling.keys.shift()!;
                const borrowedChild = rightSibling.children.shift() as BPlusTreeNode;
                node.children.push(borrowedChild);
                borrowedChild.parent = node;
                return;
            }
        }

        // Merge with sibling
        if (nodeIndex > 0) {
            const leftSibling = parent.children[nodeIndex - 1] as BPlusTreeNode;
            const parentKey = parent.keys[nodeIndex - 1];
            leftSibling.keys.push(parentKey, ...node.keys);
            leftSibling.children.push(...node.children);
            for (const child of node.children) {
                (child as BPlusTreeNode).parent = leftSibling;
            }
            parent.keys.splice(nodeIndex - 1, 1);
            parent.children.splice(nodeIndex, 1);
            
            if (parent === this.root && parent.keys.length === 0) {
                this.root = leftSibling;
                leftSibling.parent = null;
            } else if (parent.keys.length < this.minKeys && parent !== this.root) {
                this.handleInternalUnderflow(parent);
            }
        } else {
            const rightSibling = parent.children[nodeIndex + 1] as BPlusTreeNode;
            const parentKey = parent.keys[nodeIndex];
            node.keys.push(parentKey, ...rightSibling.keys);
            node.children.push(...rightSibling.children);
            for (const child of rightSibling.children) {
                (child as BPlusTreeNode).parent = node;
            }
            parent.keys.splice(nodeIndex, 1);
            parent.children.splice(nodeIndex + 1, 1);
            
            if (parent === this.root && parent.keys.length === 0) {
                this.root = node;
                node.parent = null;
            } else if (parent.keys.length < this.minKeys && parent !== this.root) {
                this.handleInternalUnderflow(parent);
            }
        }
    }

    getHeight(): number {
        let height = 0;
        let node = this.root;
        while (!node.isLeaf) {
            height++;
            node = node.children[0] as BPlusTreeNode;
        }
        return height + 1;
    }

    getAllNodes(): BPlusTreeNode[] {
        const nodes: BPlusTreeNode[] = [];
        const queue: BPlusTreeNode[] = [this.root];
        
        while (queue.length > 0) {
            const node = queue.shift()!;
            nodes.push(node);
            
            if (!node.isLeaf) {
                for (const child of node.children) {
                    queue.push(child as BPlusTreeNode);
                }
            }
        }
        
        return nodes;
    }

    // Get all keys from the tree by traversing leaf nodes
    getAllKeys(): number[] {
        const keys: number[] = [];
        let node: BPlusTreeNode | null = this.root;
        
        // Find the leftmost leaf
        while (!node.isLeaf) {
            node = node.children[0] as BPlusTreeNode;
        }
        
        // Traverse all leaf nodes using the 'next' pointer
        while (node !== null) {
            keys.push(...node.keys);
            node = node.next;
        }
        
        return keys;
    }
}

