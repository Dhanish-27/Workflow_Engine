import React, { useCallback, useRef, useEffect, useState } from 'react';
import ReactFlow, {
    Background,
    MiniMap,
    Panel,
    useReactFlow,
    ReactFlowProvider,
    getBezierPath,
    EdgeLabelRenderer,
    BaseEdge,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    LayoutGrid,
    Save,
    Play,
    Moon,
    Sun,
    Undo2,
    Redo2,
    Maximize2,
    CheckCircle,
    AlertCircle,
    Loader2,
    Info,
    Trash2,
    Copy,
    ZoomIn,
    ZoomOut,
    Layers,
    ChevronDown,
} from 'lucide-react';
import { cn } from '../../utils';
import useWorkflowStore from '../../store/workflowStore';
import WorkflowNode from './WorkflowNode';
import StepModal from './StepModal';
import NodeConfigPanel from './NodeConfigPanel';
import ConditionBuilder from './ConditionBuilder';

// ─── Custom Animated Edge ────────────────────────────────────────────────────
const AnimatedEdge = ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    data,
    markerEnd,
    selected,
}) => {
    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    const { setSelectedEdge, selectedEdge } = useWorkflowStore();
    const isSelected = selected || selectedEdge?.id === id;

    const handleEdgeClick = (e) => {
        e.stopPropagation();
    };

    return (
        <>
            {/* Invisible wide hit area for easier clicking */}
            <path
                id={`${id}-hitarea`}
                d={edgePath}
                fill="none"
                strokeWidth={20}
                stroke="transparent"
                style={{ cursor: 'pointer' }}
            />
            <BaseEdge
                id={id}
                path={edgePath}
                markerEnd={markerEnd}
                style={{
                    ...style,
                    strokeWidth: isSelected ? 2.5 : 1.8,
                    stroke: isSelected ? '#6366f1' : '#94a3b8',
                    strokeDasharray: undefined,
                    transition: 'stroke 0.2s, stroke-width 0.2s',
                }}
            />
            {/* Animated dot flowing along edge in execution mode */}
            {data?.animated && (
                <circle r={4} fill="#6366f1">
                    <animateMotion dur="1.5s" repeatCount="indefinite" path={edgePath} />
                </circle>
            )}
            {/* Edge Label */}
            <EdgeLabelRenderer>
                <div
                    style={{
                        position: 'absolute',
                        transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                        pointerEvents: 'all',
                    }}
                    className="nodrag nopan"
                >
                    <div
                        className={cn(
                            'px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer select-none',
                            'transition-all duration-200',
                            isSelected
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-105'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-sm',
                            'hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-300 hover:text-indigo-600'
                        )}
                    >
                        {data?.label || 'Next'}
                    </div>
                </div>
            </EdgeLabelRenderer>
        </>
    );
};

const edgeTypes = { animated: AnimatedEdge };

// ─── Custom node types ───────────────────────────────────────────────────────
const nodeTypes = { workflowNode: WorkflowNode };

// ─── Validation Toast ──────────────────────────────────────────────────────
const ValidationResult = ({ result, onClose }) => {
    if (!result) return null;
    const hasIssues = result.errors.length > 0 || result.warnings.length > 0;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={cn(
                    'absolute top-4 left-1/2 -translate-x-1/2 z-50 w-80 rounded-xl shadow-xl p-4',
                    hasIssues
                        ? 'bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700'
                        : 'bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700'
                )}
            >
                <div className="flex items-center justify-between mb-2">
                    <span className={cn('font-medium text-sm', hasIssues ? 'text-amber-800 dark:text-amber-200' : 'text-emerald-800 dark:text-emerald-200')}>
                        {hasIssues ? '⚠️ Validation Issues' : '✅ Workflow Valid'}
                    </span>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
                </div>
                {result.errors.map((e, i) => (
                    <p key={i} className="text-xs text-rose-600 dark:text-rose-400 mt-1">• {e}</p>
                ))}
                {result.warnings.map((w, i) => (
                    <p key={i} className="text-xs text-amber-600 dark:text-amber-400 mt-1">• {w}</p>
                ))}
                {!hasIssues && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">All steps are connected and valid.</p>
                )}
            </motion.div>
        </AnimatePresence>
    );
};

// ─── Context Menu ─────────────────────────────────────────────────────────
const ContextMenu = ({ x, y, type, data, onClose }) => {
    const { openStepModal, deleteNode, addNode } = useWorkflowStore();

    const handleAddStep = () => {
        openStepModal();
        onClose();
    };

    const handleDelete = () => {
        if (data?.nodeId) deleteNode(data.nodeId);
        onClose();
    };

    const handleDuplicate = () => {
        if (data?.nodeData) {
            addNode({
                label: `${data.nodeData.label} (Copy)`,
                stepType: data.nodeData.stepType,
                description: data.nodeData.description,
                assignedTo: data.nodeData.assignedTo,
            });
        }
        onClose();
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            style={{ position: 'fixed', left: x, top: y, zIndex: 9999 }}
            className="w-44 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden py-1"
        >
            {type === 'pane' && (
                <button
                    onClick={handleAddStep}
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                    <Plus className="w-4 h-4" /> Add Step
                </button>
            )}
            {type === 'node' && (
                <>
                    <button
                        onClick={handleDuplicate}
                        className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                        <Copy className="w-4 h-4" /> Duplicate
                    </button>
                    <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
                    <button
                        onClick={handleDelete}
                        className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" /> Delete Step
                    </button>
                </>
            )}
        </motion.div>
    );
};

// ─── Workflow Selector Dropdown ───────────────────────────────────────────
const WorkflowSelector = () => {
    const { workflowId, loadWorkflow, resetCanvas, workflowName } = useWorkflowStore();
    const [workflows, setWorkflows] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchWorkflows = async () => {
            setIsLoading(true);
            try {
                const { workflowsAPI } = await import('../../services/api');
                const res = await workflowsAPI.list();
                const data = res.data.results || res.data;
                setWorkflows(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error('Failed to fetch workflows:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchWorkflows();
    }, []);

    const handleChange = (e) => {
        const val = e.target.value;
        if (val === '__new__') {
            resetCanvas();
        } else if (val) {
            loadWorkflow(val);
        }
    };

    return (
        <div className="relative flex items-center">
            <div className="flex items-center gap-1.5 mr-1 text-slate-400">
                <Layers className="w-4 h-4" />
            </div>
            <select
                value={workflowId || '__new__'}
                onChange={handleChange}
                disabled={isLoading}
                className={cn(
                    'appearance-none pr-7 pl-2 py-1.5 rounded-lg text-sm font-medium border transition-colors cursor-pointer',
                    'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800',
                    'text-slate-700 dark:text-slate-300',
                    'focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500',
                    'hover:border-indigo-300 dark:hover:border-indigo-600',
                    'max-w-[200px]'
                )}
            >
                <option value="__new__">✦ New Workflow</option>
                {workflows.map(wf => (
                    <option key={wf.id} value={wf.id}>
                        {wf.name}
                    </option>
                ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 pointer-events-none" />
        </div>
    );
};

// ─── Top Toolbar ───────────────────────────────────────────────────────────
const Toolbar = ({ onValidate }) => {
    const {
        workflowName,
        setWorkflowName,
        openStepModal,
        autoLayout,
        saveStatus,
        isExecutionMode,
        toggleExecutionMode,
        theme,
        toggleTheme,
        undo,
        redo,
        history,
        historyIndex,
        isSaving,
        saveWorkflow,
    } = useWorkflowStore();

    const canUndo = historyIndex > 0;
    const canRedo = historyIndex < history.length - 1;

    return (
        <div className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 flex-shrink-0 shadow-sm">
            {/* Left: Workflow Selector + Name + Save Status */}
            <div className="flex items-center gap-3 min-w-0">
                <WorkflowSelector />

                <div className="w-px h-5 bg-slate-200 dark:bg-slate-700" />

                <input
                    type="text"
                    value={workflowName}
                    onChange={(e) => setWorkflowName(e.target.value)}
                    className="text-base font-semibold bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 rounded-lg px-2 py-1 text-slate-900 dark:text-white placeholder:text-slate-400 max-w-[200px]"
                    placeholder="Workflow Name"
                />
                <div className="flex items-center gap-1.5 text-sm flex-shrink-0">
                    {saveStatus === 'saving' && (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" /><span className="text-amber-500 text-xs">Saving…</span></>
                    )}
                    {saveStatus === 'saved' && (
                        <><CheckCircle className="w-3.5 h-3.5 text-emerald-500" /><span className="text-emerald-500 text-xs">Saved</span></>
                    )}
                    {saveStatus === 'error' && (
                        <><AlertCircle className="w-3.5 h-3.5 text-rose-500" /><span className="text-rose-500 text-xs">Error</span></>
                    )}
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1.5">
                {/* Undo/Redo */}
                <div className="flex items-center gap-0.5 mr-2">
                    <button
                        onClick={undo}
                        disabled={!canUndo}
                        title="Undo (Ctrl+Z)"
                        className={cn('p-2 rounded-lg transition-colors', canUndo ? 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300' : 'text-slate-300 dark:text-slate-600 cursor-not-allowed')}
                    >
                        <Undo2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={redo}
                        disabled={!canRedo}
                        title="Redo (Ctrl+Shift+Z)"
                        className={cn('p-2 rounded-lg transition-colors', canRedo ? 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300' : 'text-slate-300 dark:text-slate-600 cursor-not-allowed')}
                    >
                        <Redo2 className="w-4 h-4" />
                    </button>
                </div>

                {/* Add Step */}
                <button
                    onClick={openStepModal}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-medium text-sm bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-sm shadow-indigo-500/30"
                >
                    <Plus className="w-4 h-4" /> Add Step
                </button>

                {/* Auto Layout */}
                <button
                    onClick={() => autoLayout('vertical')}
                    title="Auto Layout"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                >
                    <LayoutGrid className="w-4 h-4" /> Layout
                </button>

                {/* Validate */}
                <button
                    onClick={onValidate}
                    title="Validate Workflow"
                    className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                >
                    <Info className="w-4 h-4" />
                </button>

                {/* Execution Mode */}
                <button
                    onClick={toggleExecutionMode}
                    title={isExecutionMode ? 'Exit Execution Mode' : 'Enter Execution Mode'}
                    className={cn(
                        'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        isExecutionMode
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-500/30'
                            : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                    )}
                >
                    <Play className="w-4 h-4" />
                    {isExecutionMode ? 'Exit' : 'Run'}
                </button>

                {/* Theme */}
                <button
                    onClick={toggleTheme}
                    title="Toggle Theme"
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                >
                    {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                </button>

                {/* Save → calls saveWorkflow() */}
                <button
                    onClick={saveWorkflow}
                    disabled={isSaving}
                    className={cn(
                        'flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm',
                        isSaving
                            ? 'bg-emerald-400 cursor-not-allowed text-white'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/30'
                    )}
                >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {isSaving ? 'Saving…' : 'Save'}
                </button>
            </div>
        </div>
    );
};

// ─── Canvas Controls ──────────────────────────────────────────────────────
const CanvasControls = () => {
    const { fitView, zoomIn, zoomOut } = useReactFlow();
    const isDark = document.documentElement.classList.contains('dark');
    const btnClass = `p-2 rounded-lg ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-white hover:bg-slate-50 text-slate-700'} shadow-md transition-colors`;

    return (
        <div className="flex flex-col gap-1.5">
            <button onClick={() => zoomIn()} className={btnClass} title="Zoom In"><ZoomIn className="w-4 h-4" /></button>
            <button onClick={() => zoomOut()} className={btnClass} title="Zoom Out"><ZoomOut className="w-4 h-4" /></button>
            <button onClick={() => fitView({ padding: 0.2 })} className={btnClass} title="Fit View"><Maximize2 className="w-4 h-4" /></button>
        </div>
    );
};

// ─── Main Builder Content ─────────────────────────────────────────────────
const WorkflowBuilderContent = () => {
    const wrapperRef = useRef(null);
    const [contextMenu, setContextMenu] = useState(null);
    const [validationResult, setValidationResult] = useState(null);

    const {
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        onConnect,
        setSelectedNode,
        setSelectedEdge,
        clearSelection,
        selectedNode,
        selectedEdge,
        isExecutionMode,
        executionState,
        theme,
        validateWorkflow,
    } = useWorkflowStore();

    const { fitView } = useReactFlow();

    // ── theme effect ──
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    // ── keyboard shortcuts ──
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'z' && !e.shiftKey) {
                    e.preventDefault();
                    useWorkflowStore.getState().undo();
                } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
                    e.preventDefault();
                    useWorkflowStore.getState().redo();
                }
            }
            if (e.key === 'Escape') {
                setContextMenu(null);
                clearSelection();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [clearSelection]);

    // ── close context menu on click ──
    useEffect(() => {
        if (!contextMenu) return;
        const close = () => setContextMenu(null);
        window.addEventListener('click', close);
        return () => window.removeEventListener('click', close);
    }, [contextMenu]);

    // ── fit view on mount ──
    useEffect(() => {
        setTimeout(() => fitView({ padding: 0.15 }), 100);
    }, []);

    // ── prepare nodes with execution state ──
    const nodesWithExecution = nodes.map(node => ({
        ...node,
        data: {
            ...node.data,
            executionState: isExecutionMode ? executionState : null,
            id: node.id,
        },
    }));

    // ── prepare edges with animation in execution mode ──
    const edgesWithAnimation = edges.map(edge => ({
        ...edge,
        type: 'animated',
        data: {
            ...edge.data,
            label: edge.label || 'Next',
            conditions: edge.conditions || [],
            animated: isExecutionMode,
        },
        markerEnd: {
            type: 'arrowclosed',
            color: selectedEdge?.id === edge.id ? '#6366f1' : '#94a3b8',
            width: 18,
            height: 18,
        },
    }));

    const onNodeClick = useCallback((event, node) => {
        setSelectedNode(node);
    }, [setSelectedNode]);

    const onEdgeClick = useCallback((event, edge) => {
        setSelectedEdge(edge);
    }, [setSelectedEdge]);

    const onPaneClick = useCallback(() => {
        clearSelection();
        setContextMenu(null);
    }, [clearSelection]);

    const onPaneContextMenu = useCallback((event) => {
        event.preventDefault();
        setContextMenu({ x: event.clientX, y: event.clientY, type: 'pane' });
    }, []);

    const onNodeContextMenu = useCallback((event, node) => {
        event.preventDefault();
        event.stopPropagation();
        setContextMenu({
            x: event.clientX,
            y: event.clientY,
            type: 'node',
            data: { nodeId: node.id, nodeData: node.data },
        });
    }, []);

    const handleValidate = () => {
        const result = validateWorkflow();
        setValidationResult(result);
        setTimeout(() => setValidationResult(null), 6000);
    };

    const isDark = theme === 'dark';

    return (
        <div className="h-full flex flex-col" style={{ background: isDark ? '#020617' : '#f8fafc' }}>
            <Toolbar onValidate={handleValidate} />

            <div className="flex-1 relative" ref={wrapperRef} style={{ minHeight: 0 }}>
                <ReactFlow
                    nodes={nodesWithExecution}
                    edges={edgesWithAnimation}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onNodeClick={onNodeClick}
                    onEdgeClick={onEdgeClick}
                    onPaneClick={onPaneClick}
                    onPaneContextMenu={onPaneContextMenu}
                    onNodeContextMenu={onNodeContextMenu}
                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}
                    fitView
                    snapToGrid
                    snapGrid={[15, 15]}
                    defaultEdgeOptions={{ type: 'animated' }}
                    proOptions={{ hideAttribution: true }}
                    style={{ width: '100%', height: '100%', background: 'transparent' }}
                >
                    <Background
                        variant="dots"
                        gap={20}
                        size={1.5}
                        color={isDark ? '#1e293b' : '#cbd5e1'}
                    />

                    <MiniMap
                        nodeStrokeWidth={2}
                        zoomable
                        pannable
                        style={{
                            background: isDark ? '#0f172a' : '#f1f5f9',
                            border: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
                            borderRadius: 12,
                        }}
                    />

                    <Panel position="top-right" style={{ marginTop: 8 }}>
                        <CanvasControls />
                    </Panel>

                    {/* Execution Mode Banner */}
                    {isExecutionMode && (
                        <Panel position="top-left" style={{ marginTop: 8 }}>
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 text-sm font-medium"
                            >
                                <motion.div
                                    animate={{ scale: [1, 1.3, 1] }}
                                    transition={{ repeat: Infinity, duration: 1 }}
                                    className="w-2 h-2 rounded-full bg-white"
                                />
                                Execution Mode
                            </motion.div>
                        </Panel>
                    )}
                </ReactFlow>

                {/* Validation Result Toast */}
                {validationResult && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
                        <ValidationResult result={validationResult} onClose={() => setValidationResult(null)} />
                    </div>
                )}

                {/* Step Modal */}
                <StepModal />

                {/* Node Config Panel */}
                {selectedNode && !selectedEdge && <NodeConfigPanel />}

                {/* Condition Builder Panel */}
                {selectedEdge && !selectedNode && <ConditionBuilder />}

                {/* Context Menu */}
                <AnimatePresence>
                    {contextMenu && (
                        <ContextMenu
                            x={contextMenu.x}
                            y={contextMenu.y}
                            type={contextMenu.type}
                            data={contextMenu.data}
                            onClose={() => setContextMenu(null)}
                        />
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

// ─── Exported Component ───────────────────────────────────────────────────
const WorkflowBuilder = () => {
    return (
        <ReactFlowProvider>
            <div style={{ width: '100%', height: '100%', minHeight: '500px' }}>
                <WorkflowBuilderContent />
            </div>
        </ReactFlowProvider>
    );
};

export default WorkflowBuilder;
