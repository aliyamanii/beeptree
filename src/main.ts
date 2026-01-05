import { BPlusTree, BPlusTreeNode } from './BPlusTree.js';
import { BPlusTreeWithSteps } from './BPlusTreeWithSteps.js';
import { TreeVisualizer } from './TreeVisualizer.js';
import { StepTracker, OperationStep } from './StepTracker.js';
import { TreeStateManager } from './TreeStateManager.js';
import { Language, translations, t } from './translations.js';

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
    private toastContainer: HTMLDivElement;
    
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
    private tipText: HTMLDivElement;
    private themeToggle: HTMLButtonElement;
    private languageToggle: HTMLButtonElement;
    
    private currentLanguage: Language = 'en';
    private currentStepTracker: StepTracker | null = null;
    private isPlaying: boolean = false;
    private playInterval: number | null = null;
    private useStepMode: boolean = false;

    constructor() {
        // Get DOM elements with error checking
        this.canvas = document.getElementById('tree-canvas') as HTMLCanvasElement;
        this.orderInput = document.getElementById('order-input') as HTMLInputElement;
        this.valueInput = document.getElementById('value-input') as HTMLInputElement;
        this.insertBtn = document.getElementById('insert-btn') as HTMLButtonElement;
        this.deleteBtn = document.getElementById('delete-btn') as HTMLButtonElement;
        this.searchBtn = document.getElementById('search-btn') as HTMLButtonElement;
        this.clearBtn = document.getElementById('clear-btn') as HTMLButtonElement;
        this.randomBtn = document.getElementById('random-btn') as HTMLButtonElement;
        this.toastContainer = document.getElementById('toast-container') as HTMLDivElement;
        
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
        this.tipText = document.querySelector('.tip-text') as HTMLDivElement;
        this.themeToggle = document.getElementById('theme-toggle') as HTMLButtonElement;
        this.languageToggle = document.getElementById('language-toggle') as HTMLButtonElement;

        // Verify critical elements exist
        if (!this.canvas || !this.insertBtn || !this.valueInput) {
            const missing = [];
            if (!this.canvas) missing.push('tree-canvas');
            if (!this.insertBtn) missing.push('insert-btn');
            if (!this.valueInput) missing.push('value-input');
            throw new Error(`Missing required DOM elements: ${missing.join(', ')}`);
        }

        const initialOrder = parseInt(this.orderInput?.value || '4') || 4;
        this.tree = new BPlusTree(initialOrder);
        this.treeWithSteps = new BPlusTreeWithSteps(initialOrder, undefined, this.currentLanguage);
        this.visualizer = new TreeVisualizer(this.canvas, this.tree, this.currentLanguage);

        // Load language preference
        const savedLanguage = localStorage.getItem('language') as Language || 'en';
        this.currentLanguage = savedLanguage;
        document.documentElement.setAttribute('lang', savedLanguage);
        if (savedLanguage === 'fa') {
            document.documentElement.setAttribute('dir', 'rtl');
        } else {
            document.documentElement.setAttribute('dir', 'ltr');
        }

        this.setupEventListeners();
        this.setupThemeToggle();
        this.setupLanguageToggle();
        this.updateUIText();

        this.updateStatus(t('ready', this.currentLanguage), 'info');
        this.visualizer.draw();
    }

    private setupEventListeners(): void {
        this.orderInput.addEventListener('change', () => {
            const newOrder = parseInt(this.orderInput.value);
            if (newOrder >= 3) {
                // Extract all keys from the current tree
                const allKeys = this.tree.getAllKeys();
                
                // Create new tree with the new order
                this.tree = new BPlusTree(newOrder);
                this.treeWithSteps = new BPlusTreeWithSteps(newOrder);
                
                // Re-insert all keys into the new tree
                for (const key of allKeys) {
                    this.tree.insert(key);
                }
                
                this.visualizer = new TreeVisualizer(this.canvas, this.tree, this.currentLanguage);
                this.closeStepMode();
                const plural = allKeys.length !== 1 ? (this.currentLanguage === 'fa' ? 'ها' : 's') : '';
                this.updateStatus(t('orderReorganized', this.currentLanguage, { count: allKeys.length.toString(), plural }), 'info');
                this.visualizer.draw();
            } else {
                this.updateStatus(t('orderMustBeAtLeast', this.currentLanguage), 'error');
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
            this.updateStatus(t('pleaseEnterValidNumber', this.currentLanguage), 'error');
            return null;
        }
        return value;
    }

    private insertValue(value: number): void {
        if (this.useStepMode) {
            // Use step-by-step mode
            this.treeWithSteps = new BPlusTreeWithSteps(parseInt(this.orderInput.value) || 4, this.tree, this.currentLanguage);
            this.currentStepTracker = this.treeWithSteps.insertWithSteps(value);
            this.tree = this.treeWithSteps; // Use the tree with steps
            this.visualizer = new TreeVisualizer(this.canvas, this.tree, this.currentLanguage);
            this.startStepMode();
        } else {
            // Normal mode
            try {
                this.tree.insert(value);
                this.updateStatus(t('valueInserted', this.currentLanguage, { value: value.toString() }), 'success');
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
            this.treeWithSteps = new BPlusTreeWithSteps(parseInt(this.orderInput.value) || 4, this.tree, this.currentLanguage);
            this.currentStepTracker = this.treeWithSteps.searchWithSteps(value);
            this.tree = this.treeWithSteps; // Use the tree with steps
            this.visualizer = new TreeVisualizer(this.canvas, this.tree, this.currentLanguage);
            this.startStepMode();
        } else {
            // Normal mode
            const node = this.tree.search(value);
            if (node) {
                this.updateStatus(t('valueFound', this.currentLanguage, { value: value.toString() }), 'success');
                this.visualizer.setHighlightedKey(value);
                this.visualizer.setHighlightedNode(node);
                this.visualizer.draw();
                setTimeout(() => {
                    this.visualizer.setHighlightedKey(null);
                    this.visualizer.setHighlightedNode(null);
                    this.visualizer.draw();
                }, 3000);
            } else {
                this.updateStatus(t('valueNotFound', this.currentLanguage, { value: value.toString() }), 'error');
            }
            this.valueInput.value = '';
            this.valueInput.focus();
        }
    }

    private deleteValue(value: number): void {
        const success = this.tree.delete(value);
        if (success) {
            this.updateStatus(t('valueDeleted', this.currentLanguage, { value: value.toString() }), 'success');
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
        this.treeWithSteps = new BPlusTreeWithSteps(order, undefined, this.currentLanguage);
        this.visualizer = new TreeVisualizer(this.canvas, this.tree, this.currentLanguage);
        this.closeStepMode();
        this.updateStatus(t('treeCleared', this.currentLanguage), 'info');
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

        this.updateStatus(t('insertingRandomValues', this.currentLanguage, { values: values.join(', ') }), 'info');
    }


    private startStepMode(): void {
        if (!this.currentStepTracker) return;
        
        this.stepControls.style.display = 'block';
        this.explanationPanel.style.display = 'none'; // Hide explanation panel, use tip area instead
        this.currentStepTracker.goToFirst();
        this.updateStepDisplay();
        this.valueInput.value = '';
    }

    private closeStepMode(): void {
        this.stepControls.style.display = 'none';
        this.explanationPanel.style.display = 'none';
        this.stopPlaying();
        this.currentStepTracker = null;
        this.updateTipText(); // Restore tip text to original
        this.visualizer.clearHighlights();
        this.visualizer.draw(); // Redraw to remove highlights from canvas
    }

    private updateStepDisplay(): void {
        if (!this.currentStepTracker) return;
        
        const currentStep = this.currentStepTracker.getCurrentStep();
        const totalSteps = this.currentStepTracker.getTotalSteps();
        const currentIndex = this.currentStepTracker.getCurrentStepIndex();
        
        this.stepCounter.innerHTML = `<span data-i18n="step">${t('step', this.currentLanguage)}</span> ${currentIndex + 1} <span data-i18n="of">${t('of', this.currentLanguage)}</span> ${totalSteps}`;
        
        if (currentStep) {
            this.explanationText.textContent = currentStep.description;
            // Update tip text with explanation
            if (this.tipText) {
                this.tipText.textContent = currentStep.description;
            }
            
            // Restore tree state for this step
            if (currentStep.treeState && currentStep.treeState.length > 0) {
                try {
                    const restoredTree = TreeStateManager.deserializeTree(currentStep.treeState, currentStep.treeOrder);
                    this.tree = restoredTree;
                    this.visualizer = new TreeVisualizer(this.canvas, this.tree, this.currentLanguage);
                    
                    // Find corresponding nodes in the restored tree using IDs
                    let restoredCurrentNode: BPlusTreeNode | null = null;
                    const restoredHighlightedNodes: BPlusTreeNode[] = [];
                    
                    // Find current node in restored tree by ID
                    if (currentStep.currentNodeId !== null) {
                        restoredCurrentNode = TreeStateManager.findNodeById(restoredTree, currentStep.currentNodeId);
                    }
                    
                    // Find highlighted nodes in restored tree by IDs
                    for (const nodeId of currentStep.highlightedNodeIds) {
                        const found = TreeStateManager.findNodeById(restoredTree, nodeId);
                        if (found && !restoredHighlightedNodes.includes(found)) {
                            restoredHighlightedNodes.push(found);
                        }
                    }
                    
                    // Fallback to old method if IDs are not available (backward compatibility)
                    if (!restoredCurrentNode && currentStep.currentNode) {
                        restoredCurrentNode = TreeStateManager.findNodeByKeys(restoredTree, currentStep.currentNode.keys);
                    }
                    if (restoredHighlightedNodes.length === 0 && currentStep.highlightedNodes) {
                        for (const node of currentStep.highlightedNodes) {
                            if (node && node.keys.length > 0) {
                                const found = TreeStateManager.findNodeByKeys(restoredTree, node.keys);
                                if (found && !restoredHighlightedNodes.includes(found)) {
                                    restoredHighlightedNodes.push(found);
                                }
                            }
                        }
                    }
                    
                    // Prioritize currentNode - it's the main focus of the step
                    // Use currentNode as the primary highlight, add other highlightedNodes as secondary
                    const finalHighlightedNodes: BPlusTreeNode[] = [];
                    if (restoredCurrentNode) {
                        // currentNode is the primary highlight (e.g., the child being followed)
                        finalHighlightedNodes.push(restoredCurrentNode);
                        // Add other highlighted nodes that aren't the current node
                        for (const node of restoredHighlightedNodes) {
                            if (node !== restoredCurrentNode && !finalHighlightedNodes.includes(node)) {
                                finalHighlightedNodes.push(node);
                            }
                        }
                    } else {
                        // Fallback to highlightedNodes if currentNode not found
                        finalHighlightedNodes.push(...restoredHighlightedNodes);
                    }
                    
                    // Update visualization with restored nodes
                    this.visualizer.clearHighlights();
                    this.visualizer.setHighlightedNode(restoredCurrentNode);
                    this.visualizer.setHighlightedKey(currentStep.currentKey);
                    this.visualizer.setHighlightedNodes(finalHighlightedNodes);
                    this.visualizer.setHighlightedKeys(currentStep.highlightedKeys);
                    this.visualizer.draw();
                } catch (error) {
                    console.error('Error restoring tree state:', error);
                }
            } else {
                // No tree state, use original node references
                // Prioritize currentNode - it's the main focus of the step
                const finalHighlightedNodes: BPlusTreeNode[] = [];
                
                if (currentStep.currentNode) {
                    // currentNode is the primary highlight
                    finalHighlightedNodes.push(currentStep.currentNode);
                    // Add other highlighted nodes that aren't the current node
                    if (currentStep.highlightedNodes && currentStep.highlightedNodes.length > 0) {
                        for (const node of currentStep.highlightedNodes) {
                            if (node !== currentStep.currentNode && !finalHighlightedNodes.includes(node)) {
                                finalHighlightedNodes.push(node);
                            }
                        }
                    }
                } else if (currentStep.highlightedNodes && currentStep.highlightedNodes.length > 0) {
                    // Fallback to highlightedNodes if currentNode doesn't exist
                    finalHighlightedNodes.push(...currentStep.highlightedNodes);
                }
                
                this.visualizer.clearHighlights();
                this.visualizer.setHighlightedNode(currentStep.currentNode ?? null);
                this.visualizer.setHighlightedKey(currentStep.currentKey ?? null);
                this.visualizer.setHighlightedNodes(finalHighlightedNodes);
                this.visualizer.setHighlightedKeys(currentStep.highlightedKeys);
                this.visualizer.draw();
            }
            
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
        this.playPauseBtn.innerHTML = `⏸ <span data-i18n="pause">${t('pause', this.currentLanguage)}</span>`;
        
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
        this.playPauseBtn.innerHTML = `▶ <span data-i18n="play">${t('play', this.currentLanguage)}</span>`;
        if (this.playInterval !== null) {
            clearInterval(this.playInterval);
            this.playInterval = null;
        }
    }

    private updateStatus(message: string, type: 'info' | 'success' | 'error'): void {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        // Add to container
        this.toastContainer.appendChild(toast);
        
        // Remove after animation completes (3 seconds total)
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 3000);
    }

    private setupThemeToggle(): void {
        // Load saved theme preference
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(savedTheme);

        // Toggle theme on button click
        this.themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            this.updateThemeIcon(newTheme);
            
            // Redraw the canvas with new theme colors
            this.visualizer.draw();
        });
    }

    private setupLanguageToggle(): void {
        this.updateLanguageIcon(this.currentLanguage);

        this.languageToggle.addEventListener('click', () => {
            this.currentLanguage = this.currentLanguage === 'en' ? 'fa' : 'en';
            localStorage.setItem('language', this.currentLanguage);
            document.documentElement.setAttribute('lang', this.currentLanguage);
            if (this.currentLanguage === 'fa') {
                document.documentElement.setAttribute('dir', 'rtl');
            } else {
                document.documentElement.setAttribute('dir', 'ltr');
            }
            this.updateLanguageIcon(this.currentLanguage);
            this.updateUIText();
            this.visualizer.setLanguage(this.currentLanguage);
            this.visualizer.draw();
        });
    }

    private updateLanguageIcon(lang: Language): void {
        if (this.languageToggle) {
            const icon = this.languageToggle.querySelector('.language-icon');
            if (icon) {
                icon.textContent = lang === 'en' ? 'EN' : 'FA';
            }
        }
    }

    private updateUIText(): void {
        // Update all elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n') as keyof typeof translations.en;
            if (key && translations[this.currentLanguage][key]) {
                if (element instanceof HTMLInputElement && element.hasAttribute('data-i18n-placeholder')) {
                    const placeholderKey = element.getAttribute('data-i18n-placeholder') as keyof typeof translations.en;
                    if (placeholderKey && translations[this.currentLanguage][placeholderKey]) {
                        element.placeholder = translations[this.currentLanguage][placeholderKey];
                    }
                } else {
                    element.textContent = translations[this.currentLanguage][key];
                }
            }
        });

        // Update title and subtitle
        const title = document.querySelector('h1');
        if (title) {
            title.textContent = translations[this.currentLanguage].title;
        }
        const subtitle = document.querySelector('.subtitle');
        if (subtitle) {
            subtitle.textContent = translations[this.currentLanguage].subtitle;
        }

        // Update play/pause button if needed
        if (this.isPlaying) {
            this.playPauseBtn.innerHTML = `⏸ <span data-i18n="pause">${t('pause', this.currentLanguage)}</span>`;
        } else {
            this.playPauseBtn.innerHTML = `▶ <span data-i18n="play">${t('play', this.currentLanguage)}</span>`;
        }

        // Update step counter if in step mode
        if (this.currentStepTracker) {
            this.updateStepDisplay();
        }

        // Update tip text if not in step mode
        this.updateTipText();
    }

    private updateTipText(): void {
        if (this.tipText && !this.currentStepTracker) {
            // Restore original tip text when not in step mode
            this.tipText.innerHTML = translations[this.currentLanguage].tipText;
        }
    }

    private updateThemeIcon(theme: string): void {
        const icon = this.themeToggle.querySelector('.theme-icon');
        if (icon) {
            icon.textContent = theme === 'dark' ? '🌙' : '☀️';
        }
    }
}

// Initialize the simulator when the page loads
// Check if DOM is already loaded (for dynamic imports) or wait for it
function initializeApp() {
    try {
        console.log('Initializing B+ Tree Simulator...');
        new BPlusTreeSimulator();
        console.log('B+ Tree Simulator initialized successfully');
    } catch (error) {
        console.error('Error initializing B+ Tree Simulator:', error);
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = 'padding: 40px; text-align: center; color: #ef4444; font-family: Arial;';
        const errorMessage = error instanceof Error ? error.message : String(error);
        errorDiv.innerHTML = `
            <h2>Error Initializing Application</h2>
            <p>An error occurred while initializing the application.</p>
            <p>Check the browser console (F12) for details.</p>
            <p style="font-size: 12px; color: #666;">Error: ${errorMessage}</p>
        `;
        document.body.appendChild(errorDiv);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    // DOM is already loaded, initialize immediately
    initializeApp();
}
