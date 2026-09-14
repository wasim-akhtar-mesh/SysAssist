import { JiraTicket, InventoryThreshold } from '../types';

export const INITIAL_JIRA_TICKETS: JiraTicket[] = [
  {
    key: 'SYS-1084',
    summary: 'Hardware Request: Sina Vance needs high-spec MacBook Pro 16" for AI fine-tuning',
    description: 'Current 15" MacBook Air is bottlenecking local PyTorch model testing and LLM evals. Requiring MacBook Pro 16" with M3 Max and 64GB RAM. Approval confirmed by VP of Product.',
    issueType: 'Hardware Request',
    status: 'Open',
    priority: 'High',
    requester: {
      name: 'Sina Vance',
      email: 'sina.vance@company.internal',
      department: 'Product Management'
    },
    requestedEquipment: 'MacBook Pro 16" (M3 Max / 64GB / 2TB)',
    createdAt: '2024-09-12T10:15:00Z',
    updatedAt: '2024-09-12T10:15:00Z'
  },
  {
    key: 'SYS-1085',
    summary: 'Docking Station Request: CalDigit TS4 Thunderbolt 4 for Executive Desk',
    description: 'Need dual 4K display support and single-cable 98W laptop charging for Desk 402 executive setup.',
    issueType: 'Hardware Request',
    status: 'Open',
    priority: 'Medium',
    requester: {
      name: 'Evelyn Reed',
      email: 'evelyn.reed@company.internal',
      department: 'Executive Operations'
    },
    requestedEquipment: 'CalDigit TS4 Thunderbolt 4 Dock',
    createdAt: '2024-09-13T14:30:00Z',
    updatedAt: '2024-09-13T14:30:00Z'
  },
  {
    key: 'SYS-1055',
    summary: 'MacBook Pro 16" Battery Swelling - Repair / Swap',
    description: 'Trackpad clicking is stiff and battery health dropped to 79%. Asset AST-8826 sent to repair depot.',
    issueType: 'Defect / Repair',
    status: 'In Progress',
    priority: 'Highest',
    requester: {
      name: 'Marcus Chen',
      email: 'marcus.chen@company.internal',
      department: 'IT Support'
    },
    requestedEquipment: 'Battery Replacement Kit (A2485)',
    createdAt: '2024-09-08T09:00:00Z',
    updatedAt: '2024-09-10T11:20:00Z',
    linkedAssetTag: 'AST-8826'
  },
  {
    key: 'SYS-1079',
    summary: 'New Hire Equipment Bundle: Senior Security Researcher (Start Date: Oct 1)',
    description: 'Requires standard Dev Kit: MacBook Pro 14" M3 Pro, 4K Monitor, Ergonomic Mouse & Mechanical Keyboard.',
    issueType: 'New Hire Provisioning',
    status: 'Open',
    priority: 'Medium',
    requester: {
      name: 'Sarah Jenkins',
      email: 'sarah.jenkins@company.internal',
      department: 'Security & Compliance'
    },
    requestedEquipment: 'MacBook Pro 14" M3 Pro + Dell UltraSharp 32"',
    createdAt: '2024-09-11T16:45:00Z',
    updatedAt: '2024-09-11T16:45:00Z'
  },
  {
    key: 'SYS-1012',
    summary: 'Fulfill Principal Architect Tech Bundle for John Doe',
    description: 'Equipped with M3 Max 16", CalDigit TS4 and Studio Display 5K.',
    issueType: 'Hardware Request',
    status: 'Fulfilled',
    priority: 'High',
    requester: {
      name: 'John Doe',
      email: 'john.doe@company.internal',
      department: 'Enterprise Architecture'
    },
    requestedEquipment: 'MacBook Pro 16" M3 Max',
    createdAt: '2024-02-01T10:00:00Z',
    updatedAt: '2024-02-02T14:15:00Z',
    linkedAssetTag: 'AST-8821'
  }
];

export const INVENTORY_THRESHOLDS: InventoryThreshold[] = [
  {
    category: 'Laptop',
    modelName: 'MacBook Pro 16" / 14"',
    minQuantity: 3,
    criticalThreshold: 1
  },
  {
    category: 'Dock',
    modelName: 'Thunderbolt 4 Docks',
    minQuantity: 3,
    criticalThreshold: 1
  },
  {
    category: 'Display',
    modelName: '4K / 5K External Displays',
    minQuantity: 2,
    criticalThreshold: 1
  },
  {
    category: 'Keyboard',
    modelName: 'Mechanical Keyboards',
    minQuantity: 2,
    criticalThreshold: 1
  },
  {
    category: 'Mouse',
    modelName: 'Ergonomic Mice',
    minQuantity: 2,
    criticalThreshold: 1
  }
];
