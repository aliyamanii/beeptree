import { BPlusTreeNode, BPlusTree } from './BPlusTree.js';

export class TreeStateManager {
    // Find a node in the tree by matching its keys
    static findNodeByKeys(tree: BPlusTree, targetKeys: number[]): BPlusTreeNode | null {
        if (targetKeys.length === 0) return null;
        
        const matchKeys = (node: BPlusTreeNode, target: number[]): boolean => {
            if (node.keys.length !== target.length) return false;
            return node.keys.every((key, i) => key === target[i]);
        };

        const search = (node: BPlusTreeNode): BPlusTreeNode | null => {
            if (matchKeys(node, targetKeys)) {
                return node;
            }
            if (!node.isLeaf) {
                for (const child of node.children) {
                    const found = search(child as BPlusTreeNode);
                    if (found) return found;
                }
            }
            return null;
        };

        return search(tree.root);
    }

    // Find all nodes matching the keys (useful for split scenarios)
    static findAllNodesByKeys(tree: BPlusTree, targetKeys: number[]): BPlusTreeNode[] {
        if (targetKeys.length === 0) return [];
        
        const results: BPlusTreeNode[] = [];
        const matchKeys = (node: BPlusTreeNode, target: number[]): boolean => {
            if (node.keys.length !== target.length) return false;
            return node.keys.every((key, i) => key === target[i]);
        };

        const search = (node: BPlusTreeNode): void => {
            if (matchKeys(node, targetKeys)) {
                results.push(node);
            }
            if (!node.isLeaf) {
                for (const child of node.children) {
                    search(child as BPlusTreeNode);
                }
            }
        };

        search(tree.root);
        return results;
    }

    // Find the root node (always available)
    static findRoot(tree: BPlusTree): BPlusTreeNode {
        return tree.root;
    }
    static serializeTree(tree: BPlusTree): string {
        const serializeNode = (node: BPlusTreeNode): any => {
            const serialized: any = {
                isLeaf: node.isLeaf,
                keys: [...node.keys],
                children: []
            };
            
            if (!node.isLeaf) {
                for (const child of node.children) {
                    serialized.children.push(serializeNode(child as BPlusTreeNode));
                }
            }
            
            return serialized;
        };
        
        return JSON.stringify({
            order: tree['order'],
            root: serializeNode(tree.root)
        });
    }

    static deserializeTree(serialized: string, order: number): BPlusTree {
        const data = JSON.parse(serialized);
        const tree = new BPlusTree(order);
        
        const deserializeNode = (nodeData: any, parent: BPlusTreeNode | null = null): BPlusTreeNode => {
            const node = new BPlusTreeNode(nodeData.isLeaf);
            node.keys = [...nodeData.keys];
            node.parent = parent;
            
            if (!nodeData.isLeaf && nodeData.children) {
                node.children = nodeData.children.map((childData: any) => {
                    return deserializeNode(childData, node);
                });
            }
            
            return node;
        };
        
        tree.root = deserializeNode(data.root);
        
        // Rebuild leaf node links
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
        collectLeaves(tree.root);
        
        // Link leaf nodes
        for (let i = 0; i < leafNodes.length - 1; i++) {
            leafNodes[i].next = leafNodes[i + 1];
        }
        
        return tree;
    }

    static cloneTree(source: BPlusTree): BPlusTree {
        const serialized = this.serializeTree(source);
        return this.deserializeTree(serialized, source['order']);
    }
}

