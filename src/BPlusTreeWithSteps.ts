import { BPlusTreeNode, BPlusTree } from './BPlusTree.js';
import { StepTracker, OperationStep } from './StepTracker.js';
import { TreeStateManager } from './TreeStateManager.js';

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
        
        // Step 1: Starting search
        const state1 = TreeStateManager.serializeTree(this);
        this.stepTracker.addStep(
            `Starting insertion of key ${key}. Beginning search from root.`,
            this.root,
            key,
            [this.root],
            [],
            state1,
            this.order
        );

        const leaf = this.findLeafWithSteps(key);
        
        if (leaf.keys.includes(key)) {
            const state2 = TreeStateManager.serializeTree(this);
            this.stepTracker.addStep(
                `Key ${key} already exists in the tree. Insertion aborted.`,
                leaf,
                key,
                [leaf],
                [key],
                state2,
                this.order
            );
            return this.stepTracker;
        }

        // Step 2: Found leaf, before insertion
        const state2 = TreeStateManager.serializeTree(this);
        this.stepTracker.addStep(
            `Found target leaf node with keys [${leaf.keys.join(', ')}]. Ready to insert key ${key}.`,
            leaf,
            key,
            [leaf],
            [],
            state2,
            this.order
        );

        // Step 3: Insert into leaf
        this.insertIntoLeaf(leaf, key);
        const state3 = TreeStateManager.serializeTree(this);
        this.stepTracker.addStep(
            `Key ${key} inserted into leaf. Current keys: [${leaf.keys.join(', ')}]. Checking if split is needed...`,
            leaf,
            key,
            [leaf],
            [key],
            state3,
            this.order
        );

        if (leaf.keys.length > this.order - 1) {
            // Step 4: Before split
            const state4 = TreeStateManager.serializeTree(this);
            this.stepTracker.addStep(
                `Leaf node is full (${leaf.keys.length} keys, max ${this.order - 1}). Splitting leaf node...`,
                leaf,
                key,
                [leaf],
                [],
                state4,
                this.order
            );
            this.splitLeafWithSteps(leaf);
        } else {
            const state4 = TreeStateManager.serializeTree(this);
            this.stepTracker.addStep(
                `Leaf node has ${leaf.keys.length} keys (within limit). Insertion complete!`,
                leaf,
                key,
                [leaf],
                [key],
                state4,
                this.order
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
            
            const state = TreeStateManager.serializeTree(this);
            this.stepTracker.addStep(
                `At internal node with keys [${node.keys.join(', ')}]. Comparing ${key} with keys. Following child ${i}.`,
                node,
                key,
                [node],
                node.keys.length > 0 ? [node.keys[Math.min(i, node.keys.length - 1)]] : [],
                state,
                this.order
            );
            
            node = node.children[i] as BPlusTreeNode;
        }
        
        const state = TreeStateManager.serializeTree(this);
        this.stepTracker.addStep(
            `Reached leaf node with keys [${node.keys.join(', ')}].`,
            node,
            key,
            [node],
            [],
            state,
            this.order
        );
        
        return node;
    }

    private splitLeafWithSteps(leaf: BPlusTreeNode): void {
        const mid = Math.ceil(this.order / 2);
        const newLeaf = new BPlusTreeNode(true);
        
        newLeaf.keys = leaf.keys.splice(mid);
        newLeaf.parent = leaf.parent;
        newLeaf.next = leaf.next;
        leaf.next = newLeaf;

        const promoteKey = newLeaf.keys[0];

        // If parent exists, temporarily add newLeaf to parent's children so it's in the tree
        // This ensures both nodes are visible when we serialize
        if (leaf.parent !== null) {
            // Find the position where leaf is in parent's children
            const leafIndex = leaf.parent.children.indexOf(leaf);
            if (leafIndex !== -1) {
                // Insert newLeaf right after leaf in parent's children
                leaf.parent.children.splice(leafIndex + 1, 0, newLeaf);
            }
        }

        // After split, before promoting - both nodes should now be in the tree
        const stateAfterSplit = TreeStateManager.serializeTree(this);
        this.stepTracker.addStep(
            `Split leaf node. Left node: [${leaf.keys.join(', ')}], Right node: [${newLeaf.keys.join(', ')}]. Promoting key ${promoteKey} to parent.`,
            null,
            promoteKey,
            [leaf, newLeaf],
            [promoteKey],
            stateAfterSplit,
            this.order
        );

        if (leaf.parent === null) {
            // Create new root
            const newRoot = new BPlusTreeNode(false);
            newRoot.keys = [promoteKey];
            newRoot.children = [leaf, newLeaf];
            leaf.parent = newRoot;
            newLeaf.parent = newRoot;
            this.root = newRoot;

            const stateAfterRoot = TreeStateManager.serializeTree(this);
            this.stepTracker.addStep(
                `No parent exists. Creating new root with key ${promoteKey}. Tree height increased.`,
                newRoot,
                promoteKey,
                [newRoot, leaf, newLeaf],
                [promoteKey],
                stateAfterRoot,
                this.order
            );
        } else {
            // Capture state with newLeaf still in parent's children (so it's visible in the tree)
            const stateBeforePromote = TreeStateManager.serializeTree(this);
            this.stepTracker.addStep(
                `Inserting promoted key ${promoteKey} into parent node with keys [${leaf.parent.keys.join(', ')}].`,
                leaf.parent,
                promoteKey,
                [leaf.parent, leaf, newLeaf],
                [promoteKey],
                stateBeforePromote,
                this.order
            );
            
            // Now remove newLeaf from parent's children (insertIntoInternal will add it at the correct position)
            const leafIndex = leaf.parent.children.indexOf(leaf);
            if (leafIndex !== -1) {
                const newLeafIndex = leaf.parent.children.indexOf(newLeaf);
                if (newLeafIndex !== -1) {
                    leaf.parent.children.splice(newLeafIndex, 1);
                }
            }
            
            this.insertIntoInternalWithSteps(leaf.parent, promoteKey, newLeaf);
        }
    }

    private insertIntoInternalWithSteps(node: BPlusTreeNode, key: number, rightChild: BPlusTreeNode): void {
        let i = 0;
        while (i < node.keys.length && node.keys[i] < key) {
            i++;
        }
        
        // Temporarily add rightChild to node's children so it's in the tree when we serialize
        // This ensures the newly split node is visible
        const rightChildIndex = node.children.indexOf(rightChild);
        if (rightChildIndex === -1) {
            // rightChild is not in children yet, add it temporarily at position i+1
            node.children.splice(i + 1, 0, rightChild);
            rightChild.parent = node;
        }
        
        // Before insertion - rightChild should now be in the tree
        const stateBefore = TreeStateManager.serializeTree(this);
        this.stepTracker.addStep(
            `Inserting key ${key} into internal node at position ${i}. Current keys: [${node.keys.join(', ')}].`,
            node,
            key,
            [node, rightChild],
            [key],
            stateBefore,
            this.order
        );

        // Remove rightChild temporarily if we added it (we'll add it properly below)
        if (rightChildIndex === -1) {
            const tempIndex = node.children.indexOf(rightChild);
            if (tempIndex !== -1) {
                node.children.splice(tempIndex, 1);
            }
        }

        node.keys.splice(i, 0, key);
        node.children.splice(i + 1, 0, rightChild);
        rightChild.parent = node;

        // After insertion
        const stateAfter = TreeStateManager.serializeTree(this);
        this.stepTracker.addStep(
            `Key ${key} inserted. New keys: [${node.keys.join(', ')}]. Checking if split is needed...`,
            node,
            key,
            [node],
            [key],
            stateAfter,
            this.order
        );

        if (node.keys.length > this.order - 1) {
            // Before split
            const stateBeforeSplit = TreeStateManager.serializeTree(this);
            this.stepTracker.addStep(
                `Internal node is full (${node.keys.length} keys, max ${this.order - 1}). Splitting internal node...`,
                node,
                key,
                [node],
                [],
                stateBeforeSplit,
                this.order
            );
            this.splitInternalWithSteps(node);
        } else {
            const stateFinal = TreeStateManager.serializeTree(this);
            this.stepTracker.addStep(
                `Internal node has ${node.keys.length} keys (within limit). Insertion complete!`,
                node,
                key,
                [node],
                [key],
                stateFinal,
                this.order
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

        // Update parent references for all children of newInternal
        for (const child of newInternal.children) {
            (child as BPlusTreeNode).parent = newInternal;
        }

        // CRITICAL: Add newInternal to parent's children BEFORE serialization
        // This ensures newInternal and ALL its children are included in the tree structure
        if (node.parent !== null) {
            // Find the position where node is in parent's children
            const nodeIndex = node.parent.children.indexOf(node);
            if (nodeIndex !== -1) {
                // Insert newInternal right after node in parent's children
                // This makes newInternal reachable from root during serialization
                node.parent.children.splice(nodeIndex + 1, 0, newInternal);
            } else {
                // If node is not found in parent's children, add newInternal at the end
                // This should not happen, but we handle it to be safe
                node.parent.children.push(newInternal);
            }
            
            // CRITICAL: Verify newInternal is now in parent's children
            // This ensures it will be included when we serialize from root
            if (!node.parent.children.includes(newInternal)) {
                // Force add it if somehow it wasn't added
                node.parent.children.push(newInternal);
            }
        } else {
            // If node has no parent, it means we're splitting the root
            // In this case, we'll create a new root in the next step
            // But for now, we need to make sure newInternal is reachable
            // Actually, if parent is null, we create a new root below, so this is handled
        }

        // CRITICAL: Handle root split case differently
        // When splitting the root, we need to create the new root BEFORE serializing
        // so that both nodes are in the tree structure
        if (node.parent === null) {
            // We're splitting the root - create new root FIRST so both nodes are in the tree
            const newRoot = new BPlusTreeNode(false);
            newRoot.keys = [promoteKey];
            newRoot.children = [node, newInternal];
            node.parent = newRoot;
            newInternal.parent = newRoot;
            this.root = newRoot;
            
            // Now serialize with the new root structure - both nodes are in the tree
            const stateAfterSplit = TreeStateManager.serializeTree(this);
            this.stepTracker.addStep(
                `Split internal node. Left: [${node.keys.join(', ')}], Right: [${newInternal.keys.join(', ')}]. Promoting key ${promoteKey}.`,
                null,
                promoteKey,
                [node, newInternal],
                [promoteKey],
                stateAfterSplit,
                this.order
            );
            
            // Add step for root creation (already done above, but we document it)
            const stateAfterRoot = TreeStateManager.serializeTree(this);
            this.stepTracker.addStep(
                `No parent exists. Creating new root with key ${promoteKey}. Tree height increased.`,
                newRoot,
                promoteKey,
                [newRoot, node, newInternal],
                [promoteKey],
                stateAfterRoot,
                this.order
            );
        } else {
            // Non-root split: Add newInternal to parent's children BEFORE serialization
            const nodeIndex = node.parent.children.indexOf(node);
            if (nodeIndex !== -1) {
                node.parent.children.splice(nodeIndex + 1, 0, newInternal);
            } else {
                node.parent.children.push(newInternal);
            }
            
            // Verify newInternal is in parent's children
            if (!node.parent.children.includes(newInternal)) {
                node.parent.children.push(newInternal);
            }
            
            // Verify newInternal has children and they have correct parent references
            for (const child of newInternal.children) {
                if ((child as BPlusTreeNode).parent !== newInternal) {
                    (child as BPlusTreeNode).parent = newInternal;
                }
            }
            
            // Serialize AFTER newInternal is added to parent's children
            const stateAfterSplit = TreeStateManager.serializeTree(this);
            this.stepTracker.addStep(
                `Split internal node. Left: [${node.keys.join(', ')}], Right: [${newInternal.keys.join(', ')}]. Promoting key ${promoteKey}.`,
                null,
                promoteKey,
                [node, newInternal],
                [promoteKey],
                stateAfterSplit,
                this.order
            );
            
            // Capture state before promoting
            const stateBeforePromote = TreeStateManager.serializeTree(this);
            this.stepTracker.addStep(
                `Inserting promoted key ${promoteKey} into parent node with keys [${node.parent.keys.join(', ')}].`,
                node.parent,
                promoteKey,
                [node.parent, node, newInternal],
                [promoteKey],
                stateBeforePromote,
                this.order
            );
            
            // Remove newInternal from parent's children (insertIntoInternal will add it at the correct position)
            const newInternalIndex = node.parent.children.indexOf(newInternal);
            if (newInternalIndex !== -1) {
                node.parent.children.splice(newInternalIndex, 1);
            }
            
            this.insertIntoInternalWithSteps(node.parent, promoteKey, newInternal);
        }
    }

    getStepTracker(): StepTracker {
        return this.stepTracker;
    }
}

