import { useCallback } from "react";
import ReactFlow, {
  ConnectionLineType,
  useNodesState,
  useEdgesState,
  MarkerType,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  Edge,
} from "reactflow";
import {
  Upload,
  CheckCircle,
  Gauge,
  Eye,
  FileText,
  Plus,
  Vote,
} from "lucide-react";

// Custom node component
type CustomNodeData = {
  label: string;
  type: string;
  icon?: React.ElementType;
  description?: string;
  route?: string;
};

type CustomNodeProps = {
  data: CustomNodeData;
};

// Custom node component
const CustomNode = ({ data }: CustomNodeProps) => {
  const { label, type, icon: Icon, description, route } = data;

  const handleClick = () => {
    if (route) {
      window.location.href = route;
    }
  };

  return (
    <div
      className={`px-4 py-3 shadow-lg rounded-lg border-2 cursor-pointer transition-all hover:scale-105 ${
        type === "start"
          ? "bg-primary text-primary-foreground border-primary"
          : type === "route"
            ? "bg-accent text-accent-foreground border-accent-foreground/20"
            : type === "action"
              ? "bg-card text-card-foreground border-border"
              : "bg-secondary text-secondary-foreground border-secondary"
      }`}
      onClick={handleClick}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-2 h-2 bg-primary"
      />

      <div className="flex items-center space-x-2">
        {Icon && <Icon className="w-5 h-5" />}
        <div>
          <div className="font-semibold text-sm">{label}</div>
          {description && (
            <div className="text-xs opacity-75 mt-1">{description}</div>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2 h-2 bg-primary"
      />
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

const GovernanceFlowChart = () => {
  const initialNodes = [
    {
      id: "start",
      type: "custom",
      position: { x: 400, y: 0 },
      data: {
        label: "OTTER Governance",
        type: "start",
        description: "What would you like to do?",
      },
    },
    {
      id: "launch",
      type: "custom",
      position: { x: 200, y: 150 },
      data: {
        label: "Launch Governance",
        type: "route",
        icon: Upload,
        description: "Setup for your dApp",
        route: "/governance/launch",
      },
    },
    {
      id: "explore",
      type: "custom",
      position: { x: 600, y: 150 },
      data: {
        label: "Explore Governance",
        type: "route",
        icon: Eye,
        description: "Browse existing dApps",
        route: "/governance",
      },
    },
    {
      id: "upload",
      type: "custom",
      position: { x: 100, y: 300 },
      data: {
        label: "Upload Contract",
        type: "action",
        icon: Upload,
        description: "Submit your contract",
      },
    },
    {
      id: "select",
      type: "custom",
      position: { x: 250, y: 300 },
      data: {
        label: "Select Functions",
        type: "action",
        icon: CheckCircle,
        description: "Choose what to govern",
      },
    },
    {
      id: "deploy",
      type: "custom",
      position: { x: 400, y: 300 },
      data: {
        label: "Deploy Governance",
        type: "action",
        icon: Gauge,
        description: "Generate & deploy",
      },
    },
    {
      id: "dapps",
      type: "custom",
      position: { x: 500, y: 300 },
      data: {
        label: "Browse dApps",
        type: "action",
        icon: Eye,
        description: "View apps",
      },
    },
    {
      id: "proposals",
      type: "custom",
      position: { x: 650, y: 300 },
      data: {
        label: "View Proposals",
        type: "action",
        icon: FileText,
        description: "See proposals",
        route: "/governance/:app/proposals",
      },
    },
    {
      id: "create",
      type: "custom",
      position: { x: 550, y: 450 },
      data: {
        label: "Create Proposal",
        type: "action",
        icon: Plus,
        description: "Submit proposal",
        route: "/governance/:app/proposals/create",
      },
    },
    {
      id: "vote",
      type: "custom",
      position: { x: 750, y: 450 },
      data: {
        label: "Vote on Proposal",
        type: "action",
        icon: Vote,
        description: "Cast your vote",
        route: "/governance/:app/proposals/:proposalId",
      },
    },
  ];

  const initialEdges = [
    { id: "e1", source: "start", target: "launch", type: "smoothstep", markerEnd: { type: MarkerType.ArrowClosed } },
    { id: "e2", source: "start", target: "explore", type: "smoothstep", markerEnd: { type: MarkerType.ArrowClosed } },
    { id: "e3", source: "launch", target: "upload", type: "smoothstep", markerEnd: { type: MarkerType.ArrowClosed } },
    { id: "e4", source: "upload", target: "select", type: "smoothstep", markerEnd: { type: MarkerType.ArrowClosed } },
    { id: "e5", source: "select", target: "deploy", type: "smoothstep", markerEnd: { type: MarkerType.ArrowClosed } },
    { id: "e6", source: "explore", target: "dapps", type: "smoothstep", markerEnd: { type: MarkerType.ArrowClosed } },
    { id: "e7", source: "dapps", target: "proposals", type: "smoothstep", markerEnd: { type: MarkerType.ArrowClosed } },
    { id: "e8", source: "proposals", target: "create", type: "smoothstep", markerEnd: { type: MarkerType.ArrowClosed } },
    { id: "e9", source: "proposals", target: "vote", type: "smoothstep", markerEnd: { type: MarkerType.ArrowClosed } },
  ];

  // @ts-ignore
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: ConcatArray<Edge<any>>) => {
      setEdges((eds) => eds.concat(params));
    },
    [setEdges]
  );

  return (
    <section className="py-12 md:py-24 bg-secondary/50" style={{ height: '100vh' }}>
      <div className="container px-4 md:px-6 mx-auto h-full">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl text-foreground">
              How OTTER Governance Works
            </h2>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
              Explore the governance flow interactively. Click on any node
              to navigate.
            </p>
          </div>
        </div>
        <div className="w-full h-full rounded-lg border border-border bg-card overflow-hidden">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            // @ts-ignore
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            connectionLineType={ConnectionLineType.SmoothStep}
            fitView
            attributionPosition="bottom-left"
            className="bg-card"
          >
            <Background color="#aaa" gap={16} />
            <Controls className="bg-card rounded-lg" />
            <MiniMap
              className="bg-cardrounded-lg"
              nodeColor={(node) => {
                if (node.data.type === "start") return "#8B5CF6";
                if (node.data.type === "route") return "#059669";
                if (node.data.type === "action") return "#0891B2";
                return "#64748B";
              }}
            />
          </ReactFlow>
        </div>
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Tip:</strong> Click on any node to navigate directly
            to that section
          </p>
        </div>
      </div>
    </section>
  );
};

export default GovernanceFlowChart;