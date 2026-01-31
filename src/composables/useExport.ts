import html2canvas from 'html2canvas';
import type { MindMapNode, ExportData } from '@/types';

export function useExport() {
  // 计算节点边界框
  const calculateNodeBounds = (root: MindMapNode) => {
    const padding = 100;
    
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    
    const traverse = (node: MindMapNode) => {
      const left = node.x - node.width / 2;
      const right = node.x + node.width / 2;
      const top = node.y - node.height / 2;
      const bottom = node.y + node.height / 2;
      
      minX = Math.min(minX, left);
      maxX = Math.max(maxX, right);
      minY = Math.min(minY, top);
      maxY = Math.max(maxY, bottom);
      
      if (!node.collapsed) {
        node.children.forEach(traverse);
      }
    };
    
    traverse(root);
    
    return {
      minX,
      maxX,
      minY,
      maxY,
      x: minX - padding,
      y: minY - padding,
      width: maxX - minX + padding * 2,
      height: maxY - minY + padding * 2,
    };
  };

  // 导出为JSON
  const exportToJSON = (data: ExportData, filename: string = 'mindmap') => {
    try {
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.json`;
      link.style.display = 'none';
      document.body.appendChild(link);
      
      setTimeout(() => {
        link.click();
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, 100);
      }, 0);
    } catch (error) {
      console.error('Export to JSON failed:', error);
      alert('导出失败，请重试');
    }
  };

  // 导出为PNG
  const exportToPNG = async (root: MindMapNode, filename: string = 'mindmap') => {
    try {
      const bounds = calculateNodeBounds(root);
      
      const exportContainer = document.createElement('div');
      exportContainer.style.position = 'absolute';
      exportContainer.style.top = '-9999px';
      exportContainer.style.left = '-9999px';
      exportContainer.style.width = `${bounds.width}px`;
      exportContainer.style.height = `${bounds.height}px`;
      exportContainer.style.backgroundColor = '#f5f5f5';
      exportContainer.style.overflow = 'hidden';
      exportContainer.style.fontFamily = 'Arial, sans-serif';
      document.body.appendChild(exportContainer);
      
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', bounds.width.toString());
      svg.setAttribute('height', bounds.height.toString());
      svg.style.position = 'absolute';
      svg.style.top = '0';
      svg.style.left = '0';
      svg.setAttribute('viewBox', `0 0 ${bounds.width} ${bounds.height}`);
      svg.style.pointerEvents = 'none';
      svg.style.overflow = 'visible';
      exportContainer.appendChild(svg);
      
      const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
      marker.setAttribute('id', 'export-arrowhead');
      marker.setAttribute('markerWidth', '10');
      marker.setAttribute('markerHeight', '7');
      marker.setAttribute('refX', '9');
      marker.setAttribute('refY', '3.5');
      marker.setAttribute('orient', 'auto');
      const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
      polygon.setAttribute('fill', '#999');
      marker.appendChild(polygon);
      defs.appendChild(marker);
      svg.appendChild(defs);
      
      const traverse = (node: MindMapNode) => {
        for (const child of node.children) {
          if (node.collapsed) continue;
          
          const startX = node.x + node.width / 2;
          const startY = node.y;
          const endX = child.x - child.width / 2;
          const endY = child.y;
          const midX = (startX + endX) / 2;
          const arrowGap = 8;
          const endXWithGap = endX - arrowGap;
          const endYWithGap = endY;
          
          const exportStartX = startX - bounds.x;
          const exportStartY = startY - bounds.y;
          const exportEndX = endXWithGap - bounds.x;
          const exportEndY = endYWithGap - bounds.y;
          const exportMidX = midX - bounds.x;
          
          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('d', `M ${exportStartX} ${exportStartY} C ${exportMidX} ${exportStartY}, ${exportMidX} ${exportEndY}, ${exportEndX} ${exportEndY}`);
          path.setAttribute('fill', 'none');
          path.setAttribute('stroke', '#999');
          path.setAttribute('stroke-width', '1.5');
          path.setAttribute('marker-end', 'url(#export-arrowhead)');
          svg.appendChild(path);
          
          traverse(child);
        }
      };
      traverse(root);
      
      const nodesLayer = document.createElement('div');
      nodesLayer.style.position = 'absolute';
      nodesLayer.style.top = '0';
      nodesLayer.style.left = '0';
      exportContainer.appendChild(nodesLayer);
      
      const traverseNodes = (node: MindMapNode) => {
        const nodeEl = document.createElement('div');
        nodeEl.style.position = 'absolute';
        nodeEl.style.left = `${node.x - bounds.x - node.width / 2}px`;
        nodeEl.style.top = `${node.y - bounds.y - node.height / 2}px`;
        nodeEl.style.width = `${node.width}px`;
        nodeEl.style.height = `${node.height}px`;
        nodeEl.style.backgroundColor = node.style.backgroundColor;
        nodeEl.style.color = node.style.textColor;
        nodeEl.style.border = `${node.style.borderWidth}px solid ${node.style.borderColor}`;
        nodeEl.style.borderRadius = `${node.style.borderRadius}px`;
        nodeEl.style.fontSize = `${node.style.fontSize}px`;
        nodeEl.style.fontWeight = node.style.fontWeight;
        nodeEl.style.fontFamily = node.style.fontFamily;
        nodeEl.style.padding = `${node.style.padding}px`;
        nodeEl.style.display = 'flex';
        nodeEl.style.alignItems = 'center';
        nodeEl.style.justifyContent = 'center';
        nodeEl.style.boxSizing = 'border-box';
        nodeEl.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        
        const textSpan = document.createElement('span');
        textSpan.textContent = node.text;
        textSpan.style.display = 'block';
        textSpan.style.overflow = 'hidden';
        textSpan.style.textOverflow = 'ellipsis';
        textSpan.style.whiteSpace = 'nowrap';
        textSpan.style.maxWidth = '200px';
        nodeEl.appendChild(textSpan);
        
        if (node.children.length > 0 && node.collapsed) {
          const collapseBtn = document.createElement('div');
          collapseBtn.textContent = '+';
          collapseBtn.style.position = 'absolute';
          collapseBtn.style.right = '-12px';
          collapseBtn.style.top = '50%';
          collapseBtn.style.transform = 'translateY(-50%)';
          collapseBtn.style.width = '20px';
          collapseBtn.style.height = '20px';
          collapseBtn.style.borderRadius = '50%';
          collapseBtn.style.background = '#fff';
          collapseBtn.style.border = '2px solid #1890ff';
          collapseBtn.style.display = 'flex';
          collapseBtn.style.alignItems = 'center';
          collapseBtn.style.justifyContent = 'center';
          collapseBtn.style.fontSize = '12px';
          collapseBtn.style.fontWeight = 'bold';
          collapseBtn.style.color = '#1890ff';
          nodeEl.appendChild(collapseBtn);
        }
        
        nodesLayer.appendChild(nodeEl);
        
        if (!node.collapsed) {
          node.children.forEach(traverseNodes);
        }
      };
      traverseNodes(root);
      
      const canvas = await html2canvas(exportContainer, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#f5f5f5',
        logging: false,
      });
      
      document.body.removeChild(exportContainer);
      
      const url = canvas.toDataURL('image/png', 1.0);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      return true;
    } catch (error) {
      console.error('Export to PNG failed:', error);
      return false;
    }
  };

  // 从JSON导入
  const importFromJSON = (file: File): Promise<ExportData | null> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          resolve(data);
        } catch (error) {
          reject(new Error('Invalid JSON file'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsText(file);
    });
  };

  return {
    exportToJSON,
    exportToPNG,
    importFromJSON,
  };
}
