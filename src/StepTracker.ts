import { BPlusTreeNode } from './BPlusTree.js';

export interface OperationStep {
    stepNumber: number;
    description: string;
    currentNode: BPlusTreeNode | null;
    currentKey: number | null;
    highlightedNodes: BPlusTreeNode[];
    highlightedKeys: number[];
    treeState: string; // JSON representation of tree state at this step
    treeOrder: number; // Tree order needed for deserialization
}

export class StepTracker {
    private steps: OperationStep[] = [];
    private currentStepIndex: number = -1;

    addStep(
        description: string,
        currentNode: BPlusTreeNode | null = null,
        currentKey: number | null = null,
        highlightedNodes: BPlusTreeNode[] = [],
        highlightedKeys: number[] = [],
        treeState: string = '',
        treeOrder: number = 4
    ): void {
        const step: OperationStep = {
            stepNumber: this.steps.length + 1,
            description,
            currentNode,
            currentKey,
            highlightedNodes: [...highlightedNodes],
            highlightedKeys: [...highlightedKeys],
            treeState,
            treeOrder
        };
        this.steps.push(step);
    }

    getSteps(): OperationStep[] {
        return this.steps;
    }

    getCurrentStep(): OperationStep | null {
        if (this.currentStepIndex >= 0 && this.currentStepIndex < this.steps.length) {
            return this.steps[this.currentStepIndex];
        }
        return null;
    }

    getStep(index: number): OperationStep | null {
        if (index >= 0 && index < this.steps.length) {
            return this.steps[index];
        }
        return null;
    }

    reset(): void {
        this.steps = [];
        this.currentStepIndex = -1;
    }

    setCurrentStepIndex(index: number): void {
        if (index >= 0 && index < this.steps.length) {
            this.currentStepIndex = index;
        }
    }

    getCurrentStepIndex(): number {
        return this.currentStepIndex;
    }

    getTotalSteps(): number {
        return this.steps.length;
    }

    hasNext(): boolean {
        return this.currentStepIndex < this.steps.length - 1;
    }

    hasPrevious(): boolean {
        return this.currentStepIndex > 0;
    }

    next(): OperationStep | null {
        if (this.hasNext()) {
            this.currentStepIndex++;
            return this.getCurrentStep();
        }
        return null;
    }

    previous(): OperationStep | null {
        if (this.hasPrevious()) {
            this.currentStepIndex--;
            return this.getCurrentStep();
        }
        return null;
    }

    goToFirst(): OperationStep | null {
        if (this.steps.length > 0) {
            this.currentStepIndex = 0;
            return this.getCurrentStep();
        }
        return null;
    }

    goToLast(): OperationStep | null {
        if (this.steps.length > 0) {
            this.currentStepIndex = this.steps.length - 1;
            return this.getCurrentStep();
        }
        return null;
    }
}

