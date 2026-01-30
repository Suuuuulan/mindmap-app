import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import type { MindMapNode, ExportData } from '@/types';

export function useExport() {
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
  const exportToPNG = async (element: HTMLElement, filename: string = 'mindmap') => {
    try {
      // 临时隐藏不需要导出的元素
      const noExportElements = element.querySelectorAll('.no-export');
      noExportElements.forEach(el => {
        (el as HTMLElement).style.visibility = 'hidden';
      });

      // 临时调整 SVG 位置到视口内以便捕获
      const svgLayer = element.querySelector('.connections-layer') as HTMLElement;
      const originalSvgTop = svgLayer?.style.top;
      const originalSvgLeft = svgLayer?.style.left;
      if (svgLayer) {
        svgLayer.style.top = '0';
        svgLayer.style.left = '0';
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#f5f5f5',
        logging: false,
        // 扩大捕获区域以包含整个 SVG
        x: -2000,
        y: -2000,
        width: 4000,
        height: 4000,
        windowWidth: 4000,
        windowHeight: 4000,
      });

      // 恢复元素可见性和 SVG 位置
      noExportElements.forEach(el => {
        (el as HTMLElement).style.visibility = '';
      });
      if (svgLayer) {
        svgLayer.style.top = originalSvgTop || '-2000px';
        svgLayer.style.left = originalSvgLeft || '-2000px';
      }
      
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
  const exportToPDF = async (element: HTMLElement, filename: string = 'mindmap') => {
    try {
      // 临时隐藏不需要导出的元素
      const noExportElements = element.querySelectorAll('.no-export');
      noExportElements.forEach(el => {
        (el as HTMLElement).style.visibility = 'hidden';
      });

      // 临时调整 SVG 位置到视口内以便捕获
      const svgLayer = element.querySelector('.connections-layer') as HTMLElement;
      const originalSvgTop = svgLayer?.style.top;
      const originalSvgLeft = svgLayer?.style.left;
      if (svgLayer) {
        svgLayer.style.top = '0';
        svgLayer.style.left = '0';
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#f5f5f5',
        logging: false,
        // 扩大捕获区域以包含整个 SVG
        x: -2000,
        y: -2000,
        width: 4000,
        height: 4000,
        windowWidth: 4000,
        windowHeight: 4000,
      });

      // 恢复元素可见性和 SVG 位置
      noExportElements.forEach(el => {
        (el as HTMLElement).style.visibility = '';
      });
      if (svgLayer) {
        svgLayer.style.top = originalSvgTop || '-2000px';
        svgLayer.style.left = originalSvgLeft || '-2000px';
      }
      
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
