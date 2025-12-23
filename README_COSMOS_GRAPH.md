# Cosmos DB Graph Visualizer

A beautiful Python script to visualize your Azure Cosmos DB data as a dynamic, aesthetically pleasing graph with PortalPay-inspired styling.

## Features

- **Dynamic force-directed graph** with organic node positioning
- **PortalPay color scheme** - Dark theme with vibrant green/teal/blue accents
- **Beautiful styling** - Glowing nodes, gradient effects, modern typography
- **Interactive matplotlib window** - Pan, zoom, and explore your data
- **High-resolution output** - 300 DPI PNG export for presentations
- **Smart relationship detection** - Automatically finds connections between documents
- **Detailed statistics** - Comprehensive graph metrics and analysis
- **JSON export** - Machine-readable graph data for further processing

## Design Aesthetic

Inspired by PortalPay's signature glass morphism style:

- 🌙 **Dark background** (`#0a0a0a`) for reduced eye strain
- 💚 **Primary green** (`#10b981`) with vibrant accent colors
- ✨ **Glowing node effects** for visual depth
- 🎨 **Color-coded by type** - Each document type gets a unique color
- 📊 **Clean typography** with proper hierarchy
- 🔲 **Rounded squares** for field nodes vs circles for documents

## Prerequisites

- Python 3.8 or higher
- Azure Cosmos DB with accessible data
- Environment variables configured in `.env` file

## Installation

1. Install required Python packages:

```bash
pip install -r requirements_cosmos_graph.txt
```

Or install packages individually:

```bash
pip install azure-cosmos python-dotenv networkx matplotlib numpy
```

## Configuration

The script reads configuration from your `.env` file. Ensure these variables are set:

```env
COSMOS_CONNECTION_STRING=AccountEndpoint=https://your-account.documents.azure.com:443/;AccountKey=your-key;
COSMOS_PAYPORTAL_DB_ID=payportal
COSMOS_PAYPORTAL_CONTAINER_ID=payportal_events
```

**Required:**
- `COSMOS_CONNECTION_STRING` - Your Cosmos DB connection string

**Optional (with defaults):**
- `COSMOS_PAYPORTAL_DB_ID` - Database ID (default: 'payportal')
- `COSMOS_PAYPORTAL_CONTAINER_ID` - Container ID (default: 'payportal_events')

## Usage

Simply run the script:

```bash
python visualize_cosmos_graph.py
```

### What It Does

The visualizer will:

1. 🔍 **Connect to your Cosmos DB** using environment variables
2. 📦 **Fetch up to 100 documents** from the specified container
3. 🔨 **Build a graph network** with smart relationship detection
4. 📊 **Display comprehensive statistics** in the terminal
5. 💾 **Export graph data** to `cosmos_graph.json`
6. 🎨 **Create a beautiful visualization** saved as `cosmos_graph.png`
7. 🖼️ **Show interactive plot** in a matplotlib window

### Output Files

- **`cosmos_graph.png`** - High-resolution graph visualization (300 DPI)
  - Dark theme with PortalPay colors
  - Glowing nodes with type-based colors
  - Clean labels and legend
  - Professional title and statistics

- **`cosmos_graph.json`** - JSON export containing:
  - All nodes with their properties
  - All edges with relationship types
  - Metadata (total nodes/edges, node types)

## Graph Structure

### Node Types

**Document Nodes (Colored Circles)**
- Represent individual documents from your Cosmos DB
- Color-coded by document type
- Glowing effect for visual appeal
- Labeled with document type

**Field Nodes (Teal Rounded Squares)**
- Represent shared field values across documents
- Connect documents with common properties
- Help identify patterns and groupings

### Edges

**Reference Edges**
- Detected from fields containing 'id', 'ref', 'link', or 'parent'
- Show direct relationships between documents

**Field Edges**
- Connect documents to shared field values
- Reveal implicit relationships and patterns

## Customization

You can easily customize the visualization by editing `visualize_cosmos_graph.py`:

### Change Colors

Modify the `COLORS` dictionary at the top of the file:

```python
COLORS = {
    'background': '#0a0a0a',
    'primary': '#10b981',      # Your custom primary color
    'secondary': '#14b8a6',    # Your custom secondary color
    # ... more colors
}
```

### Adjust Node Count

Change the max_items parameter:

```python
items = visualizer.fetch_data(max_items=200)  # Fetch more items
```

### Modify Figure Size

Adjust the figsize parameter:

```python
visualizer.visualize_dynamic(figsize=(24, 20))  # Larger visualization
```

### Custom Queries

Modify the query in the `fetch_data()` method:

```python
query = "SELECT * FROM c WHERE c.type = 'order'"  # Filter by type
```

### Node Sizing

Edit the circle/rectangle sizes in `visualize_dynamic()`:

```python
circle = plt.Circle((x, y), 0.04, ...)  # Larger nodes
```

## Statistics Output

The script provides detailed statistics including:

```
📊 GRAPH STATISTICS
======================================================================
Database:        payportal
Container:       payportal_events
Total Nodes:     45
Total Edges:     78
Graph Density:   0.0412

📁 Node Types:
  • order (document): 25
  • user (document): 15
  • field (field): 5

🔗 Graph has 3 connected components
   Component sizes: [35, 8, 2]
======================================================================
```

## Troubleshooting

### Import Errors

```
Error: Missing required package
```

**Solution:** Install all required packages:
```bash
pip install azure-cosmos python-dotenv networkx matplotlib numpy
```

### Connection Errors

```
ValueError: COSMOS_CONNECTION_STRING not found
```

**Solution:** 
1. Ensure `.env` file exists in the same directory
2. Verify `COSMOS_CONNECTION_STRING` is set correctly
3. Check connection string format

### No Data Found

```
⚠ No data found in the container
```

**Solution:**
1. Verify database and container names are correct
2. Ensure the container has documents
3. Check your Cosmos DB permissions

### Empty or Sparse Graph

If the graph looks sparse or disconnected:

- Your documents may not have many relationships
- Try increasing `max_items` to fetch more data
- Adjust the field value threshold in `build_graph()`
- Customize relationship detection logic for your data structure

### Display Issues

If the matplotlib window doesn't show:

**On Windows:**
- Make sure you're not running in WSL without X server
- Try: `plt.savefig()` completes successfully, just view the PNG

**On Linux/Mac:**
- Ensure you have a display server running
- Set `DISPLAY` environment variable if using SSH

## Advanced Usage

### Programmatic Access

You can use the visualizer as a library:

```python
from visualize_cosmos_graph import CosmosGraphVisualizer

visualizer = CosmosGraphVisualizer()
items = visualizer.fetch_data(max_items=50)
visualizer.build_graph(items)

# Access the NetworkX graph object
graph = visualizer.graph
print(f"Graph has {graph.number_of_nodes()} nodes")

# Custom visualization
visualizer.visualize_dynamic(output_file='my_custom_graph.png')
```

### Batch Processing

Generate visualizations for multiple containers:

```python
containers = ['container1', 'container2', 'container3']

for container in containers:
    os.environ['COSMOS_PAYPORTAL_CONTAINER_ID'] = container
    visualizer = CosmosGraphVisualizer()
    # ... rest of the code
```

## Performance

- **Optimized for 50-200 nodes** - Smooth rendering and clear visualization
- **Handles up to 500+ nodes** - May become dense, consider filtering
- **Force-directed layout** - 100 iterations for optimal positioning
- **High-quality export** - 300 DPI for presentations and reports

## Tech Stack

- **azure-cosmos** (≥4.5.0) - Azure Cosmos DB client
- **networkx** (≥3.0) - Graph algorithms and structure
- **matplotlib** (≥3.7.0) - Visualization and plotting
- **python-dotenv** (≥1.0.0) - Environment variable management
- **numpy** - Numerical operations and color handling

## Example Output

The visualization features:

- **Dark background** for modern aesthetic
- **Color-coded nodes** - Each type gets a unique vibrant color
- **Glowing effects** - Outer glow on document nodes
- **Clean labels** - Node type displayed below each node
- **Professional legend** - Shows all node types with colors
- **Title section** - Database/container info and statistics
- **High contrast** - White edges on nodes for clarity

## License

This visualization tool is provided for the PayPortal project to help understand and analyze Cosmos DB data structure and relationships.

## Tips for Best Results

1. **Start small** - Begin with 50-100 nodes to understand your data
2. **Filter strategically** - Use custom queries for focused views
3. **Iterate** - Adjust colors and sizes to match your preferences
4. **Export JSON** - Use the JSON export for further analysis
5. **Share visuals** - High-res PNG is perfect for documentation

## Support

For issues or questions:
- Check the troubleshooting section
- Verify your environment configuration
- Ensure all dependencies are installed correctly
