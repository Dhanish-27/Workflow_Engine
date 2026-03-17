import { create } from 'zustand';
import {
    addEdge,
    applyNodeChanges,
    applyEdgeChanges,
    MarkerType,
} from 'reactflow';
import { workflowsAPI, stepsAPI, rulesAPI } from '../services/api';

// Generate unique IDs
const generateId = () => `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
const generateEdgeId = () => `edge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Derive workflow fields dynamically from nodes
// Returns one field entry per node (Step: <Name>) plus any non-empty
// step-level properties that appear across the workflow.
const buildWorkflowFields = (nodes) => {
    const fields = [];

    // One field per node — lets conditions reference specific steps
    nodes.forEach((node) => {
        if (node.data?.label) {
            fields.push({
                id: `step_${node.id}`,
                label: `Step: ${node.data.label}`,
                type: 'select',
                options: ['Pending', 'In Progress', 'Completed', 'Approved', 'Rejected', 'Skipped'],
            });
        }
    });

    // Add step-type field if any node has a stepType
    const hasStepType = nodes.some(n => n.data?.stepType);
    if (hasStepType) {
        fields.push({
            id: 'stepType',
            label: 'Step Type',
            type: 'select',
            options: ['task', 'approval', 'notification'],
        });
    }

    // Add assignedTo field if any node has assignedTo set
    const hasAssignee = nodes.some(n => n.data?.assignedTo && n.data.assignedTo.trim());
    if (hasAssignee) {
        fields.push({
            id: 'assignedTo',
            label: 'Assigned To',
            type: 'text',
        });
    }

    // Add deadline field if any node has a deadline
    const hasDeadline = nodes.some(n => n.data?.deadline && n.data.deadline.trim());
    if (hasDeadline) {
        fields.push({
            id: 'deadline',
            label: 'Deadline',
            type: 'date',
        });
    }

    // Always include a generic status field
    fields.push({
        id: 'status',
        label: 'Status',
        type: 'select',
        options: ['Pending', 'Approved', 'Rejected', 'In Progress', 'Completed'],
    });

    return fields;
};

const initialNodes = [
    {
        id: 'node_1',
        type: 'workflowNode',
        position: { x: 250, y: 100 },
        data: {
            label: 'Start',
            stepType: 'task',
            assignedTo: '',
            description: 'Workflow start point',
            deadline: '',
            status: 'pending',
        },
    },
    {
        id: 'node_2',
        type: 'workflowNode',
        position: { x: 250, y: 300 },
        data: {
            label: 'Review',
            stepType: 'approval',
            assignedTo: 'Manager',
            description: 'Review the request',
            deadline: '2024-12-31',
            status: 'pending',
        },
    },
    {
        id: 'node_3',
        type: 'workflowNode',
        position: { x: 250, y: 500 },
        data: {
            label: 'Notify',
            stepType: 'notification',
            assignedTo: '',
            description: 'Send notification',
            deadline: '',
            status: 'pending',
        },
    },
];

const initialEdges = [
    {
        id: 'edge_1-2',
        source: 'node_1',
        target: 'node_2',
        label: 'Next',
        type: 'smoothstep',
        animated: false,
        conditions: [],
        markerEnd: { type: MarkerType.ArrowClosed },
    },
    {
        id: 'edge_2-3',
        source: 'node_2',
        target: 'node_3',
        label: 'Next',
        type: 'smoothstep',
        animated: false,
        conditions: [],
        markerEnd: { type: MarkerType.ArrowClosed },
    },
];

const useWorkflowStore = create((set, get) => ({
    // Workflow data
    nodes: initialNodes,
    edges: initialEdges,
    workflowName: 'Untitled Workflow',
    workflowDescription: '',
    workflowId: null,     // null = new, UUID string = existing backend workflow
    isSaving: false,

    // UI State
    selectedNode: null,
    selectedEdge: null,
    isStepModalOpen: false,
    isExecutionMode: false,
    theme: 'light',
    saveStatus: 'saved', // 'saving', 'saved', 'error'

    // History for undo/redo
    history: [],
    historyIndex: -1,

    // Fields for condition builder — derived from the actual workflow nodes
    workflowFields: buildWorkflowFields(initialNodes),

    // Recompute workflow fields from current nodes
    refreshWorkflowFields: () => {
        const { nodes } = get();
        set({ workflowFields: buildWorkflowFields(nodes) });
    },

    // Execution state
    executionState: {
        currentNodeId: 'node_1',
        completedNodes: [],
        isRunning: false,
    },

    // Node operations
    addNode: (nodeData) => {
        const newNode = {
            id: generateId(),
            type: 'workflowNode',
            position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
            data: {
                label: nodeData.label,
                stepType: nodeData.stepType,
                assignedTo: nodeData.assignedTo || '',
                assignedRole: nodeData.assignedRole || 'employee',
                approvalType: nodeData.approvalType || 'general',
                taskTemplate: nodeData.taskTemplate || '',
                description: nodeData.description || '',
                deadline: nodeData.deadline || '',
                status: 'pending',
                backendId: null,
            },
        };

        set((state) => ({
            nodes: [...state.nodes, newNode],
            isStepModalOpen: false,
            workflowFields: buildWorkflowFields([...state.nodes, newNode]),
        }));

        get().saveToHistory();
        return newNode;
    },

    updateNode: (nodeId, data) => {
        set((state) => {
            const updatedNodes = state.nodes.map((node) =>
                node.id === nodeId
                    ? { ...node, data: { ...node.data, ...data } }
                    : node
            );
            return {
                nodes: updatedNodes,
                workflowFields: buildWorkflowFields(updatedNodes),
            };
        });
        get().saveToHistory();
    },

    deleteNode: (nodeId) => {
        set((state) => {
            const remainingNodes = state.nodes.filter((node) => node.id !== nodeId);
            return {
                nodes: remainingNodes,
                edges: state.edges.filter(
                    (edge) => edge.source !== nodeId && edge.target !== nodeId
                ),
                selectedNode: state.selectedNode?.id === nodeId ? null : state.selectedNode,
                workflowFields: buildWorkflowFields(remainingNodes),
            };
        });
        get().saveToHistory();
    },

    // Edge operations
    onNodesChange: (changes) => {
        set((state) => ({
            nodes: applyNodeChanges(changes, state.nodes),
        }));
    },

    onEdgesChange: (changes) => {
        set((state) => ({
            edges: applyEdgeChanges(changes, state.edges),
        }));
    },

    onConnect: (connection) => {
        const newEdge = {
            ...connection,
            id: generateEdgeId(),
            label: 'Next',
            type: 'smoothstep',
            animated: false,
            conditions: [],
            markerEnd: { type: MarkerType.ArrowClosed },
            data: { conditions: [] },
        };

        set((state) => ({
            edges: addEdge(newEdge, state.edges),
        }));
        get().saveToHistory();
    },

    updateEdge: (edgeId, data) => {
        set((state) => ({
            edges: state.edges.map((edge) =>
                edge.id === edgeId
                    ? { ...edge, ...data, data: { ...edge.data, ...data } }
                    : edge
            ),
        }));
        get().saveToHistory();
    },

    deleteEdge: (edgeId) => {
        set((state) => ({
            edges: state.edges.filter((edge) => edge.id !== edgeId),
            selectedEdge: state.selectedEdge?.id === edgeId ? null : state.selectedEdge,
        }));
        get().saveToHistory();
    },

    // Selection
    setSelectedNode: (node) => {
        set({ selectedNode: node, selectedEdge: null });
    },

    setSelectedEdge: (edge) => {
        set({ selectedEdge: edge, selectedNode: null });
    },

    clearSelection: () => {
        set({ selectedNode: null, selectedEdge: null });
    },

    // Modal
    openStepModal: () => set({ isStepModalOpen: true }),
    closeStepModal: () => set({ isStepModalOpen: false }),

    // Workflow name / description
    setWorkflowName: (name) => set({ workflowName: name }),
    setWorkflowDescription: (desc) => set({ workflowDescription: desc }),
    setWorkflowId: (id) => set({ workflowId: id }),

    // Reset canvas for a new workflow
    resetCanvas: () => {
        set({
            nodes: [],
            edges: [],
            workflowName: 'Untitled Workflow',
            workflowDescription: '',
            workflowId: null,
            selectedNode: null,
            selectedEdge: null,
            saveStatus: 'saved',
            workflowFields: [],
        });
    },

    // ── Load existing workflow from backend ──
    loadWorkflow: async (workflowId) => {
        try {
            set({ saveStatus: 'saving' });

            // 1. Fetch workflow metadata
            const wfRes = await workflowsAPI.get(workflowId);
            const workflow = wfRes.data;

            // 2. Fetch all steps for this workflow
            const stepsRes = await stepsAPI.list({ workflow: workflowId });
            const steps = stepsRes.data.results || stepsRes.data;

            // 3. Build nodes from steps
            const colWidth = 280;
            const rowHeight = 180;
            const newNodes = steps.map((step, idx) => ({
                id: `node_${step.id}`,
                type: 'workflowNode',
                position: { x: 250 + (idx % 3) * colWidth, y: 100 + Math.floor(idx / 3) * rowHeight },
                data: {
                    label: step.name,
                    stepType: step.step_type,
                    assignedTo: step.assigned_to ? String(step.assigned_to) : '',
                    assignedRole: step.assigned_role || 'employee',
                    approvalType: step.approval_type || 'general',
                    taskTemplate: step.task_template || '',
                    description: '',
                    deadline: '',
                    status: 'pending',
                    backendId: step.id,
                },
            }));

            // 4. Fetch rules for each step and build edges
            const newEdges = [];
            for (const step of steps) {
                try {
                    const rulesRes = await rulesAPI.list({ step: step.id });
                    const rules = rulesRes.data.results || rulesRes.data;
                    rules.forEach((rule, rIdx) => {
                        if (!rule.next_step) return;
                        const sourceNodeId = `node_${step.id}`;
                        const targetNodeId = `node_${rule.next_step}`;
                        // Ensure both nodes exist in our node list
                        const sourceExists = newNodes.some(n => n.id === sourceNodeId);
                        const targetExists = newNodes.some(n => n.id === targetNodeId);
                        if (!sourceExists || !targetExists) return;

                        // Map conditions from RuleCondition model or legacy JSON
                        let mappedConditions = [];

                        // First check if we have RuleCondition model objects (nested conditions)
                        if (rule.conditions && rule.conditions.length > 0) {
                            mappedConditions = rule.conditions.map(cond => ({
                                id: cond.id,
                                field: cond.field_name, // Use field_name from RuleCondition
                                operator: cond.operator,
                                value: cond.value,
                            }));
                        } else if (rule.condition) {
                            // Fall back to legacy JSON condition
                            try {
                                const parsed = typeof rule.condition === 'string'
                                    ? JSON.parse(rule.condition)
                                    : rule.condition;
                                if (parsed && parsed.conditions) {
                                    mappedConditions = parsed.conditions.map((cond, idx) => ({
                                        id: `cond_legacy_${idx}`,
                                        field: cond.field,
                                        operator: cond.operator,
                                        value: cond.value,
                                    }));
                                }
                            } catch (e) {
                                console.warn('Failed to parse legacy condition:', e);
                            }
                        }

                        newEdges.push({
                            id: `edge_${rule.id}`,
                            source: sourceNodeId,
                            target: targetNodeId,
                            label: rule.name || 'Next',
                            type: 'animated',
                            conditions: mappedConditions,
                            conditionLogic: rule.logical_operator || 'AND',
                            markerEnd: { type: MarkerType.ArrowClosed },
                            data: {
                                label: rule.name || 'Next',
                                conditions: mappedConditions,
                                conditionLogic: rule.logical_operator || 'AND'
                            },
                            backendRuleId: rule.id,
                        });
                    });
                } catch (err) {
                    // Ignore rule-fetch errors for individual steps
                    console.warn('Failed to fetch rules for step:', step.id, err);
                }
            }

            const wfFields = buildWorkflowFields(newNodes);
            set({
                nodes: newNodes,
                edges: newEdges,
                workflowName: workflow.name,
                workflowDescription: workflow.description || '',
                workflowId: workflowId,
                workflowFields: wfFields,
                selectedNode: null,
                selectedEdge: null,
                saveStatus: 'saved',
            });
        } catch (err) {
            console.error('Failed to load workflow:', err);
            set({ saveStatus: 'error' });
        }
    },

    // ── Save workflow to backend ──
    saveWorkflow: async () => {
        const { nodes, edges, workflowName, workflowDescription, workflowId } = get();
        set({ isSaving: true, saveStatus: 'saving' });

        try {
            // 1. Create or update workflow record
            let savedWorkflowId = workflowId;
            if (!savedWorkflowId) {
                const wfRes = await workflowsAPI.create({
                    name: workflowName || 'Untitled Workflow',
                    description: workflowDescription || '',
                    is_active: true,
                });
                savedWorkflowId = wfRes.data.id;
            } else {
                await workflowsAPI.update(savedWorkflowId, {
                    name: workflowName,
                    description: workflowDescription,
                });
            }

            // 2. Save each node as a step; build canvasId → backendId map
            const idMap = {}; // canvasNodeId → backend step UUID
            for (let i = 0; i < nodes.length; i++) {
                const node = nodes[i];
                const stepPayload = {
                    workflow: savedWorkflowId,
                    name: node.data.label,
                    step_type: node.data.stepType,
                    order: i + 1,
                    approval_type: node.data.approvalType || 'general',
                    assigned_role: node.data.assignedRole || null,
                    assigned_to: node.data.assignedTo || null,
                    task_template: node.data.taskTemplate || '',
                    description: node.data.description || '',
                    metadata: {},
                    form_fields: [],
                };

                if (node.data.backendId) {
                    // Update existing step
                    await stepsAPI.update(node.data.backendId, stepPayload);
                    idMap[node.id] = node.data.backendId;
                } else {
                    // Create new step
                    const stepRes = await stepsAPI.create(stepPayload);
                    idMap[node.id] = stepRes.data.id;
                }
            }

            // 3. Save each edge as a rule
            for (const edge of edges) {
                const sourceStepId = idMap[edge.source];
                const targetStepId = idMap[edge.target];
                if (!sourceStepId || !targetStepId) continue;

                const conditionJson = edge.conditions?.length > 0
                    ? JSON.stringify({
                        conditions: edge.conditions.map(c => ({
                            field: c.field,
                            operator: c.operator,
                            value: c.value,
                        })),
                        logical_operator: edge.conditionLogic || 'AND',
                    })
                    : '';

                // Prepare conditions array for RuleCondition model
                // Use field_name (field name) for consistency with Rules.jsx
                const conditionsArray = edge.conditions?.length > 0
                    ? edge.conditions.map(c => ({
                        field_name: c.field, // Use field_name - the condition.field is now the field name
                        operator: c.operator,
                        value: c.value,
                        order: 0,
                    }))
                    : [];

                const rulePayload = {
                    step: sourceStepId,
                    next_step: targetStepId,
                    name: edge.label || edge.data?.label || 'Next',
                    condition: conditionJson,
                    logical_operator: edge.conditionLogic || 'AND',
                    priority: 1,
                    is_default: !conditionJson,
                    conditions: conditionsArray, // Send nested conditions for RuleCondition model
                };

                if (edge.backendRuleId) {
                    await rulesAPI.update(edge.backendRuleId, rulePayload);
                } else {
                    await rulesAPI.create(rulePayload);
                }
            }

            // 4. Update store with backend IDs
            const updatedNodes = nodes.map(node => ({
                ...node,
                data: { ...node.data, backendId: idMap[node.id] || node.data.backendId },
            }));

            set({
                workflowId: savedWorkflowId,
                nodes: updatedNodes,
                isSaving: false,
                saveStatus: 'saved',
            });
        } catch (err) {
            console.error('Failed to save workflow:', err);
            set({ isSaving: false, saveStatus: 'error' });
        }
    },

    // Save status
    setSaveStatus: (status) => set({ saveStatus: status }),

    // Theme
    toggleTheme: () => {
        set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' }));
    },

    // Execution mode
    toggleExecutionMode: () => {
        set((state) => ({
            isExecutionMode: !state.isExecutionMode,
            executionState: !state.isExecutionMode
                ? { currentNodeId: 'node_1', completedNodes: [], isRunning: true }
                : { currentNodeId: null, completedNodes: [], isRunning: false }
        }));
    },

    // Execution simulation
    runExecutionStep: () => {
        const { nodes, edges, executionState } = get();
        const { currentNodeId, completedNodes, isRunning } = executionState;

        if (!isRunning || !currentNodeId) return;

        // Find current node
        const currentNode = nodes.find(n => n.id === currentNodeId);
        if (!currentNode) return;

        // Find next node based on conditions
        const outgoingEdges = edges.filter(e => e.source === currentNodeId);

        if (outgoingEdges.length === 0) {
            // No more edges, execution complete
            set({
                executionState: {
                    ...executionState,
                    completedNodes: [...completedNodes, currentNodeId],
                    isRunning: false,
                }
            });
            return;
        }

        // For simplicity, just take the first edge
        // In real implementation, would evaluate conditions
        const nextEdge = outgoingEdges[0];
        const nextNodeId = nextEdge.target;

        set({
            executionState: {
                ...executionState,
                completedNodes: [...completedNodes, currentNodeId],
                currentNodeId: nextNodeId,
            }
        });
    },

    // Auto layout
    autoLayout: (direction = 'vertical') => {
        const { nodes, edges } = get();

        if (nodes.length === 0) return;

        // Find root nodes (nodes with no incoming edges)
        const incomingEdges = new Set(edges.map(e => e.target));
        const rootNodes = nodes.filter(n => !incomingEdges.has(n.id));

        // Build adjacency list
        const adjacency = {};
        nodes.forEach(n => {
            adjacency[n.id] = edges
                .filter(e => e.source === n.id)
                .map(e => e.target);
        });

        // BFS to get levels
        const levels = {};
        const visited = new Set();
        const queue = rootNodes.map(n => ({ id: n.id, level: 0 }));

        while (queue.length > 0) {
            const { id, level } = queue.shift();
            if (visited.has(id)) continue;
            visited.add(id);

            levels[id] = level;

            const children = adjacency[id] || [];
            children.forEach(childId => {
                if (!visited.has(childId)) {
                    queue.push({ id: childId, level: level + 1 });
                }
            });
        }

        // Handle disconnected nodes
        nodes.forEach(n => {
            if (!visited.has(n.id)) {
                levels[n.id] = 0;
            }
        });

        // Position nodes
        const nodeSpacing = direction === 'vertical' ? 200 : 300;
        const levelSpacing = direction === 'vertical' ? 150 : 250;

        const levelNodes = {};
        Object.entries(levels).forEach(([nodeId, level]) => {
            if (!levelNodes[level]) levelNodes[level] = [];
            levelNodes[level].push(nodeId);
        });

        const newNodes = nodes.map(node => {
            const level = levels[node.id] || 0;
            const nodesAtLevel = levelNodes[level] || [];
            const indexInLevel = nodesAtLevel.indexOf(node.id);

            const x = direction === 'vertical'
                ? 250 + (indexInLevel * nodeSpacing)
                : level * levelSpacing + 100;

            const y = direction === 'vertical'
                ? level * levelSpacing + 50
                : 200 + (indexInLevel * nodeSpacing);

            return {
                ...node,
                position: { x, y },
            };
        });

        set({ nodes: newNodes });
        get().saveToHistory();
    },

    // Save status
    setSaveStatus: (status) => set({ saveStatus: status }),

    // History (undo/redo)
    saveToHistory: () => {
        const { nodes, edges, history, historyIndex } = get();
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push({ nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) });

        // Limit history size
        if (newHistory.length > 50) {
            newHistory.shift();
        }

        set({
            history: newHistory,
            historyIndex: newHistory.length - 1,
            saveStatus: 'saving',
        });

        // Simulate save
        setTimeout(() => {
            set({ saveStatus: 'saved' });
        }, 500);
    },

    undo: () => {
        const { history, historyIndex } = get();
        if (historyIndex > 0) {
            const prevState = history[historyIndex - 1];
            set({
                nodes: prevState.nodes,
                edges: prevState.edges,
                historyIndex: historyIndex - 1,
            });
        }
    },

    redo: () => {
        const { history, historyIndex } = get();
        if (historyIndex < history.length - 1) {
            const nextState = history[historyIndex + 1];
            set({
                nodes: nextState.nodes,
                edges: nextState.edges,
                historyIndex: historyIndex + 1,
            });
        }
    },

    // Validation
    validateWorkflow: () => {
        const { nodes, edges } = get();
        const errors = [];
        const warnings = [];

        // Check for disconnected nodes
        const connectedNodeIds = new Set();
        edges.forEach(e => {
            connectedNodeIds.add(e.source);
            connectedNodeIds.add(e.target);
        });

        nodes.forEach(node => {
            if (!connectedNodeIds.has(node.id)) {
                warnings.push(`Node "${node.data.label}" is not connected`);
            }
        });

        // Check for branching without conditions
        edges.forEach(edge => {
            const outgoingFromSource = edges.filter(e => e.source === edge.source);
            if (outgoingFromSource.length > 1 && (!edge.conditions || edge.conditions.length === 0)) {
                warnings.push(`Edge from "${nodes.find(n => n.id === edge.source)?.data.label}" has no conditions but is part of branching`);
            }
        });

        // Check for nodes with no outgoing edges (except last)
        const nodesWithOutgoing = new Set(edges.map(e => e.source));
        nodes.forEach(node => {
            if (!nodesWithOutgoing.has(node.id) && nodes.length > 1) {
                const hasIncoming = edges.some(e => e.target === node.id);
                if (hasIncoming) {
                    warnings.push(`Node "${node.data.label}" has no outgoing connections`);
                }
            }
        });

        return { errors, warnings, isValid: errors.length === 0 };
    },
}));

export default useWorkflowStore;
