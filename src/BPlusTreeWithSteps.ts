import { BPlusTreeNode, BPlusTree } from './BPlusTree.js';
import { StepTracker, OperationStep } from './StepTracker.js';

export class BPlusTreeWithSteps extends BPlusTree {
    private stepTracker: StepTracker;
    private operationKey: number | null = null;

    constructor(order: number = 4, copyFrom?: BPlusTree) {
        super(order);
        this.stepTracker = new StepTracker();
        if (copyFrom) {
            this.copyTree(copyFrom);
        }
    }

    private copyTree(source: BPlusTree): void {
        // Deep copy the tree structure
        const nodeMap = new Map<BPlusTreeNode, BPlusTreeNode>();
        
        const copyNode = (node: BPlusTreeNode): BPlusTreeNode => {
            const newNode = new BPlusTreeNode(node.isLeaf);
            newNode.keys = [...node.keys];
            nodeMap.set(node, newNode);
            
            if (!node.isLeaf) {
                newNode.children = node.children.map(child => {
                    return copyNode(child as BPlusTreeNode);
                });
            }
            
            return newNode;
        };
        
        this.root = copyNode(source.root);
        
        // Set parent references
        const setParents = (node: BPlusTreeNode, parent: BPlusTreeNode | null): void => {
            node.parent = parent;
            if (!node.isLeaf) {
                for (const child of node.children) {
                    setParents(child as BPlusTreeNode, node);
                }
            }
        };
        setParents(this.root, null);
        
        // Set next references for leaf nodes
        const leafNodes: BPlusTreeNode[] = [];
        const collectLeaves = (node: BPlusTreeNode): void => {
            if (node.isLeaf) {
                leafNodes.push(node);
            } else {
                for (const child of node.children) {
                    collectLeaves(child as BPlusTreeNode);
                }
            }
        };
        collectLeaves(this.root);
        
        // Link leaf nodes
        for (let i = 0; i < leafNodes.length - 1; i++) {
            leafNodes[i].next = leafNodes[i + 1];
        }
    }

    insertWithSteps(key: number): StepTracker {
        this.stepTracker.reset();
        this.operationKey = key;
        
        this.stepTracker.addStep(
            `Starting insertion of key ${key}. Beginning search from root.`,
            this.root,
            key,
            [this.root],
            []
        );

        const leaf = this.findLeafWithSteps(key);
        
        if (leaf.keys.includes(key)) {
            this.stepTracker.addStep(
                `Key ${key} already exists in the tree. Insertion aborted.`,
                leaf,
                key,
                [leaf],
                [key]
            );
            return this.stepTracker;
        }

        this.stepTracker.addStep(
            `Found target leaf node. Inserting key ${key} into leaf node.`,
            leaf,
            key,
            [leaf],
            []
        );

        this.insertIntoLeaf(leaf, key);
        
        this.stepTracker.addStep(
            `Key ${key} inserted into leaf. Current keys: [${leaf.keys.join(', ')}]. Checking if split is needed...`,
            leaf,
            key,
            [leaf],
            [key]
        );

        if (leaf.keys.length > this.order - 1) {
            this.stepTracker.addStep(
                `Leaf node is full (${leaf.keys.length} keys, max ${this.order - 1}). Splitting leaf node...`,
                leaf,
                key,
                [leaf],
                []
            );
            this.splitLeafWithSteps(leaf);
        } else {
            this.stepTracker.addStep(
                `Leaf node has ${leaf.keys.length} keys (within limit). Insertion complete!`,
                leaf,
                key,
                [leaf],
                [key]
            );
        }

        return this.stepTracker;
    }

    searchWithSteps(key: number): StepTracker {
        this.stepTracker.reset();
        this.operationKey = key;
        
        this.stepTracker.addStep(
            `Starting search for key ${key}. Beginning from root node.`,
            this.root,
            key,
            [this.root],
            []
        );

        let node = this.root;
        let stepCount = 1;
        
        while (!node.isLeaf) {
            let i = 0;
            let comparisonText = '';
            
            while (i < node.keys.length && key >= node.keys[i]) {
                comparisonText += `Comparing ${key} >= ${node.keys[i]} → true. `;
                i++;
            }
            
            if (i < node.keys.length) {
                comparisonText += `Comparing ${key} < ${node.keys[i]} → true. `;
            }
            
            this.stepTracker.addStep(
                `At internal node. ${comparisonText}Following child pointer ${i} (${i === 0 ? 'leftmost' : `after key ${node.keys[i - 1]}`}).`,
                node,
                key,
                [node],
                node.keys.length > 0 ? [node.keys[Math.min(i, node.keys.length - 1)]] : []
            );

            node = node.children[i] as BPlusTreeNode;
            stepCount++;
        }

        // Check if key exists in leaf
        if (node.keys.includes(key)) {
            this.stepTracker.addStep(
                `Reached leaf node. Key ${key} found! Search successful.`,
                node,
                key,
                [node],
                [key]
            );
        } else {
            this.stepTracker.addStep(
                `Reached leaf node. Key ${key} not found in keys [${node.keys.join(', ')}]. Search unsuccessful.`,
                node,
                key,
                [node],
                []
            );
        }

        return this.stepTracker;
    }

    private findLeafWithSteps(key: number): BPlusTreeNode {
        let node = this.root;
        
        while (!node.isLeaf) {
            let i = 0;
            while (i < node.keys.length && key >= node.keys[i]) {
                i++;
            }
            
            this.stepTracker.addStep(
                `At internal node with keys [${node.keys.join(', ')}]. Comparing ${key} with keys. Following child ${i}.`,
                node,
                key,
                [node],
                node.keys.length > 0 ? [node.keys[Math.min(i, node.keys.length - 1)]] : []
            );
            
            node = node.children[i] as BPlusTreeNode;
        }
        
        this.stepTracker.addStep(
            `Reached leaf node with keys [${node.keys.join(', ')}].`,
            node,
            key,
            [node],
            []
        );
        
        return node;
    }

    private splitLeafWithSteps(leaf: BPlusTreeNode): void {
        const mid = Math.ceil(this.order / 2);
        const newLeaf = new BPlusTreeNode(true);
        
        const keysToMove = leaf.keys.slice(mid);
        newLeaf.keys = leaf.keys.splice(mid);
        newLeaf.parent = leaf.parent;
        newLeaf.next = leaf.next;
        leaf.next = newLeaf;

        const promoteKey = newLeaf.keys[0];

        this.stepTracker.addStep(
            `Split leaf node. Left node: [${leaf.keys.join(', ')}], Right node: [${newLeaf.keys.join(', ')}]. Promoting key ${promoteKey} to parent.`,
            null,
            promoteKey,
            [leaf, newLeaf],
            [promoteKey]
        );

        if (leaf.parent === null) {
            // Create new root
            const newRoot = new BPlusTreeNode(false);
            newRoot.keys = [promoteKey];
            newRoot.children = [leaf, newLeaf];
            leaf.parent = newRoot;
            newLeaf.parent = newRoot;
            this.root = newRoot;

            this.stepTracker.addStep(
                `No parent exists. Creating new root with key ${promoteKey}. Tree height increased.`,
                newRoot,
                promoteKey,
                [newRoot, leaf, newLeaf],
                [promoteKey]
            );
        } else {
            this.stepTracker.addStep(
                `Inserting promoted key ${promoteKey} into parent node.`,
                leaf.parent,
                promoteKey,
                [leaf.parent, leaf, newLeaf],
                [promoteKey]
            );
            this.insertIntoInternalWithSteps(leaf.parent, promoteKey, newLeaf);
        }
    }

    private insertIntoInternalWithSteps(node: BPlusTreeNode, key: number, rightChild: BPlusTreeNode): void {
        let i = 0;
        while (i < node.keys.length && node.keys[i] < key) {
            i++;
        }
        
        this.stepTracker.addStep(
            `Inserting key ${key} into internal node at position ${i}. Current keys: [${node.keys.join(', ')}].`,
            node,
            key,
            [node, rightChild],
            [key]
        );

        node.keys.splice(i, 0, key);
        node.children.splice(i + 1, 0, rightChild);
        rightChild.parent = node;

        this.stepTracker.addStep(
            `Key ${key} inserted. New keys: [${node.keys.join(', ')}]. Checking if split is needed...`,
            node,
            key,
            [node],
            [key]
        );

        if (node.keys.length > this.order - 1) {
            this.stepTracker.addStep(
                `Internal node is full (${node.keys.length} keys, max ${this.order - 1}). Splitting internal node...`,
                node,
                key,
                [node],
                []
            );
            this.splitInternalWithSteps(node);
        } else {
            this.stepTracker.addStep(
                `Internal node has ${node.keys.length} keys (within limit). Insertion complete!`,
                node,
                key,
                [node],
                [key]
            );
        }
    }

    private splitInternalWithSteps(node: BPlusTreeNode): void {
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

        this.stepTracker.addStep(
            `Split internal node. Left: [${node.keys.join(', ')}], Right: [${newInternal.keys.join(', ')}]. Promoting key ${promoteKey}.`,
            null,
            promoteKey,
            [node, newInternal],
            [promoteKey]
        );

        if (node.parent === null) {
            // Create new root
            const newRoot = new BPlusTreeNode(false);
            newRoot.keys = [promoteKey];
            newRoot.children = [node, newInternal];
            node.parent = newRoot;
            newInternal.parent = newRoot;
            this.root = newRoot;

            this.stepTracker.addStep(
                `No parent exists. Creating new root with key ${promoteKey}. Tree height increased.`,
                newRoot,
                promoteKey,
                [newRoot, node, newInternal],
                [promoteKey]
            );
        } else {
            this.stepTracker.addStep(
                `Inserting promoted key ${promoteKey} into parent node.`,
                node.parent,
                promoteKey,
                [node.parent, node, newInternal],
                [promoteKey]
            );
            this.insertIntoInternalWithSteps(node.parent, promoteKey, newInternal);
        }
    }

    getStepTracker(): StepTracker {
        return this.stepTracker;
    }
}

