#!/usr/bin/env python3
"""
Cosmos DB Graph Visualizer - Dynamic & Aesthetic Edition
--------------------------------------------------------
Beautiful, interactive graph visualization of Azure Cosmos DB data
with PortalPay-inspired styling and modern aesthetics.
"""

import os
import sys
from typing import Dict, List, Any
import json

try:
    from azure.cosmos import CosmosClient, exceptions
    import networkx as nx
    import matplotlib.pyplot as plt
    import matplotlib.patches as mpatches
    from matplotlib.patches import FancyBboxPatch
    from dotenv import load_dotenv
    import numpy as np
except ImportError as e:
    print(f"Error: Missing required package - {e}")
    print("\nPlease install required packages:")
    print("  pip install azure-cosmos python-dotenv networkx matplotlib numpy")
    sys.exit(1)


# PortalPay Color Scheme
COLORS = {
    'background': '#0a0a0a',
    'primary': '#10b981',      # Green
    'secondary': '#14b8a6',    # Teal
    'accent1': '#06b6d4',      # Cyan
    'accent2': '#3b82f6',      # Blue
    'accent3': '#8b5cf6',      # Purple
    'accent4': '#ec4899',      # Pink
    'accent5': '#f59e0b',      # Amber
    'foreground': '#ededed',
    'text_muted': '#9ca3af',
    'edge': (1, 1, 1, 0.15),  # White with 15% opacity (RGBA tuple)
}


class CosmosGraphVisualizer:
    """Visualize Cosmos DB data as a beautiful, dynamic graph network."""
    
    def __init__(self):
        """Initialize the visualizer with environment variables."""
        load_dotenv()
        
        self.connection_string = os.getenv('COSMOS_CONNECTION_STRING')
        self.database_id = os.getenv('COSMOS_PAYPORTAL_DB_ID', 'payportal')
        self.container_id = os.getenv('COSMOS_PAYPORTAL_CONTAINER_ID', 'payportal_events')
        
        if not self.connection_string:
            raise ValueError("COSMOS_CONNECTION_STRING not found in environment variables")
        
        # Initialize Cosmos client
        self.client = CosmosClient.from_connection_string(self.connection_string)
        self.database = self.client.get_database_client(self.database_id)
        self.container = self.database.get_container_client(self.container_id)
        
        # Initialize graph
        self.graph = nx.DiGraph()
        self.node_colors = []
        self.node_types = {}
        
    def fetch_data(self, max_items: int = 100) -> List[Dict[str, Any]]:
        """Fetch data from Cosmos DB container."""
        print(f"🔍 Fetching data from {self.database_id}/{self.container_id}...")
        
        try:
            query = "SELECT * FROM c"
            items = list(self.container.query_items(
                query=query,
                enable_cross_partition_query=True,
                max_item_count=max_items
            ))
            
            print(f"✓ Fetched {len(items)} items")
            return items
            
        except exceptions.CosmosHttpResponseError as e:
            print(f"✗ Error fetching data: {e.message}")
            return []
    
    def build_graph(self, items: List[Dict[str, Any]]):
        """Build a graph from Cosmos DB items with smart relationship detection."""
        print("🔨 Building graph from data...")
        
        field_values: Dict[str, set] = {}
        
        for item in items:
            doc_id = item.get('id', str(item.get('_rid', 'unknown')))
            doc_type = item.get('type', item.get('_type', 'document'))
            
            # Track node types
            if doc_type not in self.node_types:
                self.node_types[doc_type] = len(self.node_types)
            
            # Add document node
            self.graph.add_node(
                doc_id,
                label=f"{doc_type}",
                type=doc_type,
                data=item,
                node_class='document'
            )
            
            # Track relationships
            for key, value in item.items():
                if key.startswith('_'):
                    continue
                    
                if isinstance(value, (str, int, float, bool)):
                    field_key = f"{key}:{value}"
                    if field_key not in field_values:
                        field_values[field_key] = set()
                    field_values[field_key].add(doc_id)
                
                # Create edges for reference fields
                if any(suffix in key.lower() for suffix in ['id', 'ref', 'link', 'parent']):
                    if isinstance(value, str) and value != doc_id:
                        if any(d.get('id') == value for d in items):
                            self.graph.add_edge(
                                doc_id, 
                                value, 
                                relation=key,
                                edge_type='reference'
                            )
        
        # Add field nodes for shared values
        for field_key, doc_ids in field_values.items():
            if 1 < len(doc_ids) < len(items) * 0.3:
                field_node = f"field_{field_key}"
                field_name, field_value = field_key.split(':', 1)
                
                self.graph.add_node(
                    field_node,
                    label=field_name,
                    type='field',
                    field_name=field_name,
                    field_value=field_value,
                    node_class='field'
                )
                
                for doc_id in doc_ids:
                    self.graph.add_edge(
                        doc_id, 
                        field_node, 
                        relation='has_field',
                        edge_type='field'
                    )
        
        print(f"✓ Graph built: {self.graph.number_of_nodes()} nodes, {self.graph.number_of_edges()} edges")
    
    def get_node_color(self, node_type: str, node_class: str) -> str:
        """Get color for node based on type."""
        if node_class == 'field':
            return COLORS['secondary']
        
        color_list = [
            COLORS['primary'],
            COLORS['accent1'],
            COLORS['accent2'],
            COLORS['accent3'],
            COLORS['accent4'],
            COLORS['accent5'],
        ]
        
        type_index = self.node_types.get(node_type, 0)
        return color_list[type_index % len(color_list)]
    
    def visualize_dynamic(self, output_file: str = 'cosmos_graph.png', figsize: tuple = (20, 16)):
        """Create a beautiful, dynamic visualization with PortalPay styling."""
        if self.graph.number_of_nodes() == 0:
            print("⚠ No data to visualize!")
            return
        
        print(f"🎨 Creating dynamic visualization...")
        
        # Set up the plot with dark theme
        plt.style.use('dark_background')
        fig, ax = plt.subplots(figsize=figsize, facecolor=COLORS['background'])
        ax.set_facecolor(COLORS['background'])
        
        # Use spring layout for organic positioning
        pos = nx.spring_layout(
            self.graph, 
            k=2.5,  # Optimal node spacing
            iterations=100,  # More iterations for better layout
            seed=42
        )
        
        # Separate nodes by class
        doc_nodes = [n for n, d in self.graph.nodes(data=True) if d.get('node_class') == 'document']
        field_nodes = [n for n, d in self.graph.nodes(data=True) if d.get('node_class') == 'field']
        
        # Prepare node colors
        doc_colors = [self.get_node_color(self.graph.nodes[n]['type'], 'document') for n in doc_nodes]
        field_colors = [COLORS['secondary']] * len(field_nodes)
        
        # Draw edges with gradient effect
        for edge in self.graph.edges():
            x = [pos[edge[0]][0], pos[edge[1]][0]]
            y = [pos[edge[0]][1], pos[edge[1]][1]]
            ax.plot(x, y, 
                   color=COLORS['edge'], 
                   linewidth=1.5, 
                   alpha=0.3,
                   zorder=1)
        
        # Draw document nodes with glow effect
        for i, node in enumerate(doc_nodes):
            x, y = pos[node]
            color = doc_colors[i]
            
            # Outer glow
            circle_glow = plt.Circle((x, y), 0.045, 
                                    color=color, 
                                    alpha=0.2,
                                    zorder=2)
            ax.add_patch(circle_glow)
            
            # Main node
            circle = plt.Circle((x, y), 0.03, 
                               color=color, 
                               alpha=0.9,
                               edgecolor='white',
                               linewidth=1.5,
                               zorder=3)
            ax.add_patch(circle)
        
        # Draw field nodes as rounded squares
        for node in field_nodes:
            x, y = pos[node]
            rect = FancyBboxPatch(
                (x - 0.025, y - 0.025), 
                0.05, 0.05,
                boxstyle="round,pad=0.005",
                facecolor=COLORS['secondary'],
                edgecolor='white',
                linewidth=1.5,
                alpha=0.85,
                zorder=3
            )
            ax.add_patch(rect)
        
        # Add labels with better typography
        labels = {}
        for node, data in self.graph.nodes(data=True):
            label = data.get('label', node)
            if len(label) > 15:
                label = label[:12] + '...'
            labels[node] = label
        
        # Draw labels
        for node, label in labels.items():
            x, y = pos[node]
            ax.text(x, y - 0.06, label,
                   fontsize=9,
                   ha='center',
                   va='top',
                   color=COLORS['foreground'],
                   weight='medium',
                   family='sans-serif',
                   zorder=4)
        
        # Create beautiful legend
        legend_elements = []
        for node_type, index in sorted(self.node_types.items(), key=lambda x: x[1]):
            color = self.get_node_color(node_type, 'document')
            legend_elements.append(
                mpatches.Patch(facecolor=color, edgecolor='white', label=node_type, linewidth=1.5)
            )
        
        if field_nodes:
            legend_elements.append(
                mpatches.Patch(facecolor=COLORS['secondary'], edgecolor='white', 
                             label='Field Node', linewidth=1.5)
            )
        
        legend = ax.legend(
            handles=legend_elements,
            loc='upper left',
            frameon=True,
            fancybox=True,
            shadow=True,
            framealpha=0.8,
            facecolor='#1a1a1a',
            edgecolor=COLORS['primary'],
            fontsize=10
        )
        legend.get_frame().set_linewidth(2)
        
        # Add title with gradient-like effect
        title_text = 'Cosmos DB Graph Visualization'
        subtitle_text = f'{self.database_id} / {self.container_id}'
        stats_text = f'Nodes: {self.graph.number_of_nodes()} | Edges: {self.graph.number_of_edges()}'
        
        ax.text(0.5, 0.98, title_text,
               transform=fig.transFigure,
               fontsize=24,
               weight='bold',
               ha='center',
               va='top',
               color=COLORS['primary'])
        
        ax.text(0.5, 0.95, subtitle_text,
               transform=fig.transFigure,
               fontsize=14,
               ha='center',
               va='top',
               color=COLORS['text_muted'],
               style='italic')
        
        ax.text(0.5, 0.92, stats_text,
               transform=fig.transFigure,
               fontsize=11,
               ha='center',
               va='top',
               color=COLORS['foreground'],
               family='monospace')
        
        # Remove axes
        ax.axis('off')
        ax.set_xlim(-1.15, 1.15)
        ax.set_ylim(-1.15, 1.15)
        
        plt.tight_layout(rect=[0, 0, 1, 0.90])
        
        # Save with high quality
        plt.savefig(output_file, 
                   dpi=300, 
                   bbox_inches='tight', 
                   facecolor=COLORS['background'],
                   edgecolor='none')
        print(f"✓ Visualization saved to {output_file}")
        
        # Show interactive plot
        plt.show()
    
    def export_graph_data(self, output_file: str = 'cosmos_graph.json'):
        """Export graph data to JSON file."""
        graph_data = {
            'nodes': [],
            'edges': [],
            'metadata': {
                'database': self.database_id,
                'container': self.container_id,
                'total_nodes': self.graph.number_of_nodes(),
                'total_edges': self.graph.number_of_edges(),
                'node_types': dict(self.node_types)
            }
        }
        
        for node, data in self.graph.nodes(data=True):
            node_data = {'id': node, **data}
            if 'data' in node_data and isinstance(node_data['data'], dict):
                node_data['data'] = {k: v for k, v in list(node_data['data'].items())[:5]}
            graph_data['nodes'].append(node_data)
        
        for source, target, data in self.graph.edges(data=True):
            graph_data['edges'].append({
                'source': source,
                'target': target,
                **data
            })
        
        with open(output_file, 'w') as f:
            json.dump(graph_data, f, indent=2, default=str)
        
        print(f"✓ Graph data exported to {output_file}")
    
    def print_statistics(self):
        """Print detailed graph statistics."""
        print("\n" + "="*70)
        print("📊 GRAPH STATISTICS")
        print("="*70)
        print(f"Database:        {self.database_id}")
        print(f"Container:       {self.container_id}")
        print(f"Total Nodes:     {self.graph.number_of_nodes()}")
        print(f"Total Edges:     {self.graph.number_of_edges()}")
        
        if self.graph.number_of_nodes() > 0:
            density = nx.density(self.graph)
            print(f"Graph Density:   {density:.4f}")
        
        if self.node_types:
            print(f"\n📁 Node Types:")
            node_type_counts = {}
            for _, data in self.graph.nodes(data=True):
                node_type = data.get('type', 'unknown')
                node_class = data.get('node_class', 'unknown')
                key = f"{node_type} ({node_class})"
                node_type_counts[key] = node_type_counts.get(key, 0) + 1
            
            for node_type, count in sorted(node_type_counts.items()):
                print(f"  • {node_type}: {count}")
        
        if self.graph.number_of_nodes() > 0:
            try:
                if nx.is_weakly_connected(self.graph):
                    print(f"\n🔗 Graph is fully connected")
                else:
                    components = list(nx.weakly_connected_components(self.graph))
                    print(f"\n🔗 Graph has {len(components)} connected components")
                    
                    # Show component sizes
                    comp_sizes = sorted([len(c) for c in components], reverse=True)
                    if len(comp_sizes) <= 5:
                        print(f"   Component sizes: {comp_sizes}")
                    else:
                        print(f"   Largest components: {comp_sizes[:5]}")
            except:
                pass
        
        print("="*70 + "\n")


def main():
    """Main execution function."""
    print("\n" + "="*70)
    print("🎨 COSMOS DB GRAPH VISUALIZER")
    print("   Dynamic & Aesthetic Edition")
    print("="*70 + "\n")
    
    try:
        visualizer = CosmosGraphVisualizer()
        
        items = visualizer.fetch_data(max_items=100)
        
        if not items:
            print("\n⚠  No data found in the container.")
            print("   Please check your configuration.")
            return
        
        visualizer.build_graph(items)
        visualizer.print_statistics()
        visualizer.export_graph_data()
        visualizer.visualize_dynamic()
        
        print("\n✨ Done! Your beautiful graph visualization is ready.")
        
    except Exception as e:
        print(f"\n✗ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
