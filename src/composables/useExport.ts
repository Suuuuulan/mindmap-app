import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import type { MindMapNode, ExportData } from '@/types';

export function useExport() {
  // 计算节点边界框
  const calculateNodeBounds = (root: MindMapNode) => {
    const padding = 100; // 边距
    
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
      
      // 使用 setTimeout 确保在 Mac/Firefox 等浏览器中正常工作
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
  const exportToPNG = async (element: HTMLElement, root: MindMapNode, filename: string = 'mindmap') => {
    try {
      // 计算节点边界
      const bounds = calculateNodeBounds(root);
      
      // 临时隐藏不需要导出的元素
      const noExportElements = element.querySelectorAll('.no-export');
      noExportElements.forEach(el => {
        (el as HTMLElement).style.visibility = 'hidden';
      });

      // 保存原始样式
      const canvasContent = element.querySelector('.canvas-content') as HTMLElement;
      const svgLayer = element.querySelector('.connections-layer') as HTMLElement;
      const originalTransform = canvasContent?.style.transform;
      const originalSvgTop = svgLayer?.style.top;
      const originalSvgLeft = svgLayer?.style.left;

      // 重置画布变换为无缩放、无平移
      if (canvasContent) {
        canvasContent.style.transform = 'none';
      }

      // 调整 SVG 位置到原点
      if (svgLayer) {
        svgLayer.style.top = '0';
        svgLayer.style.left = '0';
      }

      // 使用 html2canvas 直接捕获，设置合适的捕获区域
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#f5f5f5',
        logging: false,
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
      });

      // 恢复原始样式
      if (canvasContent) {
        canvasContent.style.transform = originalTransform || '';
      }
      if (svgLayer) {
        svgLayer.style.top = originalSvgTop || '-2000px';
        svgLayer.style.left = originalSvgLeft || '-2000px';
      }
      noExportElements.forEach(el => {
        (el as HTMLElement).style.visibility = '';
      });
      
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

  // 导出为PDF
  const exportToPDF = async (element: HTMLElement, root: MindMapNode, filename: string = 'mindmap') => {
    try {
      // 计算节点边界
      const bounds = calculateNodeBounds(root);
      
      // 临时隐藏不需要导出的元素
      const noExportElements = element.querySelectorAll('.no-export');
      noExportElements.forEach(el => {
        (el as HTMLElement).style.visibility = 'hidden';
      });

      // 保存原始样式
      const canvasContent = element.querySelector('.canvas-content') as HTMLElement;
      const svgLayer = element.querySelector('.connections-layer') as HTMLElement;
      const originalTransform = canvasContent?.style.transform;
      const originalSvgTop = svgLayer?.style.top;
      const originalSvgLeft = svgLayer?.style.left;

      // 重置画布变换为无缩放、无平移
      if (canvasContent) {
        canvasContent.style.transform = 'none';
      }

      // 调整 SVG 位置到原点
      if (svgLayer) {
        svgLayer.style.top = '0';
        svgLayer.style.left = '0';
      }

      // 使用 html2canvas 直接捕获
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#f5f5f5',
        logging: false,
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
      });

      // 恢复原始样式
      if (canvasContent) {
        canvasContent.style.transform = originalTransform || '';
      }
      if (svgLayer) {
        svgLayer.style.top = originalSvgTop || '-2000px';
        svgLayer.style.left = originalSvgLeft || '-2000px';
      }
      noExportElements.forEach(el => {
        (el as HTMLElement).style.visibility = '';
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      // 计算PDF尺寸（A4横向）
      const imgWidth = 297;
      const pageHeight = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      const pdf = new jsPDF('l', 'mm', 'a4');
      
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`${filename}.pdf`);
      return true;
    } catch (error) {
      console.error('Export to PDF failed:', error);
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
    exportToPDF,
    importFromJSON,
  };
}
