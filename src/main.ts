import { BPlusTree } from './BPlusTree.js';
import { BPlusTreeWithSteps } from './BPlusTreeWithSteps.js';
import { TreeVisualizer } from './TreeVisualizer.js';
import { StepTracker, OperationStep } from './StepTracker.js';

class BPlusTreeSimulator {
    private tree: BPlusTree;
    private treeWithSteps: BPlusTreeWithSteps;
    private visualizer: TreeVisualizer;
    private canvas: HTMLCanvasElement;
    private orderInput: HTMLInputElement;
    private valueInput: HTMLInputElement;
    private insertBtn: HTMLButtonElement;
    private deleteBtn: HTMLButtonElement;
    private searchBtn: HTMLButtonElement;
    private clearBtn: HTMLButtonElement;
    private randomBtn: HTMLButtonElement;
    private statusDiv: HTMLDivElement;
    
    // Step-by-step controls
    private stepControls: HTMLDivElement;
    private stepCounter: HTMLSpanElement;
    private firstStepBtn: HTMLButtonElement;
    private prevStepBtn: HTMLButtonElement;
    private playPauseBtn: HTMLButtonElement;
    private nextStepBtn: HTMLButtonElement;
    private lastStepBtn: HTMLButtonElement;
    private closeStepsBtn: HTMLButtonElement;
    private explanationPanel: HTMLDivElement;
    private explanationText: HTMLParagraphElement;
    
    private currentStepTracker: StepTracker | null = null;
    private isPlaying: boolean = false;
    private playInterval: number | null = null;
    private useStepMode: boolean = false;

    constructor() {
        this.canvas = document.getElementById('tree-canvas') as HTMLCanvasElement;
        this.orderInput = document.getElementById('order-input') as HTMLInputElement;
        this.valueInput = document.getElementById('value-input') as HTMLInputElement;
        this.insertBtn = document.getElementById('insert-btn') as HTMLButtonElement;
        this.deleteBtn = document.getElementById('delete-btn') as HTMLButtonElement;
        this.searchBtn = document.getElementById('search-btn') as HTMLButtonElement;
        this.clearBtn = document.getElementById('clear-btn') as HTMLButtonElement;
        this.randomBtn = document.getElementById('random-btn') as HTMLButtonElement;
        this.statusDiv = document.getElementById('status') as HTMLDivElement;
        
        // Step-by-step elements
        this.stepControls = document.getElementById('step-controls') as HTMLDivElement;
        this.stepCounter = document.getElementById('step-counter') as HTMLSpanElement;
        this.firstStepBtn = document.getElementById('first-step-btn') as HTMLButtonElement;
        this.prevStepBtn = document.getElementById('prev-step-btn') as HTMLButtonElement;
        this.playPauseBtn = document.getElementById('play-pause-btn') as HTMLButtonElement;
        this.nextStepBtn = document.getElementById('next-step-btn') as HTMLButtonElement;
        this.lastStepBtn = document.getElementById('last-step-btn') as HTMLButtonElement;
        this.closeStepsBtn = document.getElementById('close-steps-btn') as HTMLButtonElement;
        this.explanationPanel = document.getElementById('explanation-panel') as HTMLDivElement;
        this.explanationText = document.getElementById('explanation-text') as HTMLParagraphElement;

        const initialOrder = parseInt(this.orderInput.value) || 4;
        this.tree = new BPlusTree(initialOrder);
        this.treeWithSteps = new BPlusTreeWithSteps(initialOrder);
        this.visualizer = new TreeVisualizer(this.canvas, this.tree);

        this.setupEventListeners();
        this.updateStatus('Ready. Enter a value and click Insert, Delete, or Search. Hold Shift for step-by-step mode.', 'info');
        this.visualizer.draw();
    }

    private setupEventListeners(): void {
        this.orderInput.addEventListener('change', () => {
            const newOrder = parseInt(this.orderInput.value);
            if (newOrder >= 3) {
                this.tree = new BPlusTree(newOrder);
                this.treeWithSteps = new BPlusTreeWithSteps(newOrder);
                this.visualizer = new TreeVisualizer(this.canvas, this.tree);
                this.closeStepMode();
                this.updateStatus(`Tree order changed to ${newOrder}. Tree cleared.`, 'info');
                this.visualizer.draw();
            } else {
                this.updateStatus('Order must be at least 3.', 'error');
                this.orderInput.value = '4';
            }
        });

        this.insertBtn.addEventListener('click', (e) => {
            const value = this.getValue();
            if (value !== null) {
                this.useStepMode = e.shiftKey;
                this.insertValue(value);
            }
        });

        this.deleteBtn.addEventListener('click', () => {
            const value = this.getValue();
            if (value !== null) {
                this.deleteValue(value);
            }
        });

        this.searchBtn.addEventListener('click', (e) => {
            const value = this.getValue();
            if (value !== null) {
                this.useStepMode = e.shiftKey;
                this.searchValue(value);
            }
        });

        this.clearBtn.addEventListener('click', () => {
            this.clearTree();
        });

        this.randomBtn.addEventListener('click', () => {
            this.insertRandomValues();
        });

        this.valueInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const value = this.getValue();
                if (value !== null) {
                    this.useStepMode = e.shiftKey;
                    this.insertValue(value);
                }
            }
        });

        // Step-by-step controls
        this.firstStepBtn.addEventListener('click', () => this.goToFirstStep());
        this.prevStepBtn.addEventListener('click', () => this.goToPreviousStep());
        this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        this.nextStepBtn.addEventListener('click', () => this.goToNextStep());
        this.lastStepBtn.addEventListener('click', () => this.goToLastStep());
        this.closeStepsBtn.addEventListener('click', () => this.closeStepMode());
    }

    private getValue(): number | null {
        const value = parseInt(this.valueInput.value);
        if (isNaN(value)) {
            this.updateStatus('Please enter a valid number.', 'error');
            return null;
        }
        return value;
    }

    private insertValue(value: number): void {
        if (this.useStepMode) {
            // Use step-by-step mode
            this.treeWithSteps = new BPlusTreeWithSteps(parseInt(this.orderInput.value) || 4, this.tree);
            this.currentStepTracker = this.treeWithSteps.insertWithSteps(value);
            this.tree = this.treeWithSteps; // Use the tree with steps
            this.visualizer = new TreeVisualizer(this.canvas, this.tree);
            this.startStepMode();
        } else {
            // Normal mode
            try {
                this.tree.insert(value);
                this.updateStatus(`Value ${value} inserted successfully.`, 'success');
                this.visualizer.setHighlightedKey(value);
                this.visualizer.draw();
                setTimeout(() => {
                    this.visualizer.setHighlightedKey(null);
                    this.visualizer.draw();
                }, 2000);
                this.valueInput.value = '';
                this.valueInput.focus();
            } catch (error) {
                this.updateStatus(`Error: ${(error as Error).message}`, 'error');
            }
        }
    }

    private searchValue(value: number): void {
        if (this.useStepMode) {
            // Use step-by-step mode
            this.treeWithSteps = new BPlusTreeWithSteps(parseInt(this.orderInput.value) || 4, this.tree);
            this.currentStepTracker = this.treeWithSteps.searchWithSteps(value);
            this.tree = this.treeWithSteps; // Use the tree with steps
            this.visualizer = new TreeVisualizer(this.canvas, this.tree);
            this.startStepMode();
        } else {
            // Normal mode
            const node = this.tree.search(value);
            if (node) {
                this.updateStatus(`Value ${value} found in the tree.`, 'success');
                this.visualizer.setHighlightedKey(value);
                this.visualizer.setHighlightedNode(node);
                this.visualizer.draw();
                setTimeout(() => {
                    this.visualizer.setHighlightedKey(null);
                    this.visualizer.setHighlightedNode(null);
                    this.visualizer.draw();
                }, 3000);
            } else {
                this.updateStatus(`Value ${value} not found in the tree.`, 'error');
            }
            this.valueInput.value = '';
            this.valueInput.focus();
        }
    }

    private deleteValue(value: number): void {
        const success = this.tree.delete(value);
        if (success) {
            this.updateStatus(`Value ${value} deleted successfully.`, 'success');
            this.visualizer.setHighlightedKey(value);
            this.visualizer.draw();
            setTimeout(() => {
                this.visualizer.setHighlightedKey(null);
                this.visualizer.draw();
            }, 2000);
        } else {
            this.updateStatus(`Value ${value} not found in the tree.`, 'error');
        }
        this.valueInput.value = '';
        this.valueInput.focus();
    }

    private clearTree(): void {
        const order = parseInt(this.orderInput.value) || 4;
        this.tree = new BPlusTree(order);
        this.treeWithSteps = new BPlusTreeWithSteps(order);
        this.visualizer = new TreeVisualizer(this.canvas, this.tree);
        this.closeStepMode();
        this.updateStatus('Tree cleared.', 'info');
        this.visualizer.draw();
    }

    private insertRandomValues(): void {
        const values: number[] = [];
        for (let i = 0; i < 10; i++) {
            let value: number;
            do {
                value = Math.floor(Math.random() * 100) + 1;
            } while (values.includes(value));
            values.push(value);
        }

        values.forEach((value, index) => {
            setTimeout(() => {
                this.tree.insert(value);
                this.visualizer.setHighlightedKey(value);
                this.visualizer.draw();
                setTimeout(() => {
                    this.visualizer.setHighlightedKey(null);
                    this.visualizer.draw();
                }, 500);
            }, index * 300);
        });

        this.updateStatus(`Inserting 10 random values: ${values.join(', ')}`, 'info');
    }


    private startStepMode(): void {
        if (!this.currentStepTracker) return;
        
        this.stepControls.style.display = 'block';
        this.explanationPanel.style.display = 'block';
        this.currentStepTracker.goToFirst();
        this.updateStepDisplay();
        this.valueInput.value = '';
    }

    private closeStepMode(): void {
        this.stepControls.style.display = 'none';
        this.explanationPanel.style.display = 'none';
        this.stopPlaying();
        this.currentStepTracker = null;
        this.visualizer.clearHighlights();
    }

    private updateStepDisplay(): void {
        if (!this.currentStepTracker) return;
        
        const currentStep = this.currentStepTracker.getCurrentStep();
        const totalSteps = this.currentStepTracker.getTotalSteps();
        const currentIndex = this.currentStepTracker.getCurrentStepIndex();
        
        this.stepCounter.textContent = `Step ${currentIndex + 1} of ${totalSteps}`;
        
        if (currentStep) {
            this.explanationText.textContent = currentStep.description;
            
            // Update visualization
            this.visualizer.clearHighlights();
            this.visualizer.setHighlightedNode(currentStep.currentNode);
            this.visualizer.setHighlightedKey(currentStep.currentKey);
            this.visualizer.setHighlightedNodes(currentStep.highlightedNodes);
            this.visualizer.setHighlightedKeys(currentStep.highlightedKeys);
            this.visualizer.draw();
            
            // Update button states
            this.prevStepBtn.disabled = !this.currentStepTracker.hasPrevious();
            this.nextStepBtn.disabled = !this.currentStepTracker.hasNext();
            this.firstStepBtn.disabled = currentIndex === 0;
            this.lastStepBtn.disabled = currentIndex === totalSteps - 1;
        }
    }

    private goToFirstStep(): void {
        if (!this.currentStepTracker) return;
        this.currentStepTracker.goToFirst();
        this.updateStepDisplay();
    }

    private goToPreviousStep(): void {
        if (!this.currentStepTracker) return;
        this.currentStepTracker.previous();
        this.updateStepDisplay();
    }

    private goToNextStep(): void {
        if (!this.currentStepTracker) return;
        this.currentStepTracker.next();
        this.updateStepDisplay();
    }

    private goToLastStep(): void {
        if (!this.currentStepTracker) return;
        this.currentStepTracker.goToLast();
        this.updateStepDisplay();
    }

    private togglePlayPause(): void {
        if (this.isPlaying) {
            this.stopPlaying();
        } else {
            this.startPlaying();
        }
    }

    private startPlaying(): void {
        if (!this.currentStepTracker) return;
        
        this.isPlaying = true;
        this.playPauseBtn.textContent = '⏸ Pause';
        
        this.playInterval = window.setInterval(() => {
            if (this.currentStepTracker && this.currentStepTracker.hasNext()) {
                this.currentStepTracker.next();
                this.updateStepDisplay();
            } else {
                this.stopPlaying();
            }
        }, 1500); // 1.5 seconds per step
    }

    private stopPlaying(): void {
        this.isPlaying = false;
        this.playPauseBtn.textContent = '▶ Play';
        if (this.playInterval !== null) {
            clearInterval(this.playInterval);
            this.playInterval = null;
        }
    }

    private updateStatus(message: string, type: 'info' | 'success' | 'error'): void {
        this.statusDiv.textContent = message;
        this.statusDiv.className = `status ${type}`;
    }
}

// Initialize the simulator when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new BPlusTreeSimulator();
});
