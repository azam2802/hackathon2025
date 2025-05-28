import { useCallback } from 'react';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import html2canvas from 'html2canvas';
import { useTranslation } from 'react-i18next';
import * as XLSX from 'xlsx';
import FileSaver from 'file-saver';

// Initialize pdfMake with proper Cyrillic font support
pdfMake.vfs = pdfFonts;

// Define Cyrillic-compatible fonts
pdfMake.fonts = {
  Roboto: {
    normal: 'Roboto-Regular.ttf',
    bold: 'Roboto-Medium.ttf',
    italics: 'Roboto-Italic.ttf',
    bolditalics: 'Roboto-MediumItalic.ttf'
  }
};

/**
 * Custom hook for generating PDF reports
 * @returns {Object} Report generation functions
 */
export const useReportGenerator = () => {
  const { t } = useTranslation();

  /**
   * Format days with proper grammatical form
   * @param {number} days - Number of days
   * @returns {string} Formatted string with days
   */
  const formatDays = (days) => {
    return `${days} ${t("complaints.days")}`;
  };

  /**
   * Capture chart component as image
   * @param {React.RefObject} ref - Reference to chart component
   * @returns {Promise<string>} Promise resolving to base64 image data
   */
  const captureChartAsImage = useCallback(async (ref) => {
    if (!ref.current) return null;
    
    try {
      const canvas = await html2canvas(ref.current, {
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true
      });
      
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Error capturing chart:', error);
      return null;
    }
  }, []);

  /**
   * Generate dashboard analytics report
   * @param {Object} data - Dashboard analytics data
   * @param {Object} options - Report generation options
   * @returns {Promise<void>} Promise that resolves when PDF is generated
   */
  const generateDashboardReport = useCallback(async (data, options = {}) => {
    const {
      reportsCount = 0,
      resolvedCount = 0,
      avgResolutionTime = 0,
      problemServices = 0,
      problemServicesList = [],
      selectedRegion = '',
      chartRefs = {}
    } = data;

    try {
      // Capture charts if refs provided
      let agencyChartImage = null;
      let serviceTypeChartImage = null;
      
      if (chartRefs?.agencyChartRef) {
        agencyChartImage = await captureChartAsImage(chartRefs.agencyChartRef);
      }
      
      if (chartRefs?.serviceTypeChartRef) {
        serviceTypeChartImage = await captureChartAsImage(chartRefs.serviceTypeChartRef);
      }
      
      // Define document definition
      const docDefinition = {
        content: [
          { text: t('reports.title', 'ОТЧЕТ ПО АНАЛИЗУ ОБРАЩЕНИЙ ГРАЖДАН'), style: 'header' },
          { text: `${t('reports.generatedDate', 'Дата формирования')}: ${new Date().toLocaleDateString('ru-RU')}`, margin: [0, 5, 0, 0] },
          { text: `${t('reports.region', 'Регион')}: ${selectedRegion === 'all' ? t('dashboard.allRegions', 'Все регионы') : selectedRegion}`, margin: [0, 5, 0, 15] },
          
          { text: t('reports.keySummary', 'ОСНОВНЫЕ ПОКАЗАТЕЛИ'), style: 'subheader' },
          { ul: [
            `${t('dashboard.totalComplaints', 'Всего обращений')}: ${reportsCount.toLocaleString()}`,
            `${t('dashboard.resolvedComplaints', 'Решенные обращения')}: ${resolvedCount.toLocaleString()}`,
            `${t('dashboard.averageResolutionTime', 'Среднее время решения')}: ${formatDays(avgResolutionTime)}`,
            `${t('dashboard.problemServices', 'Проблемные услуги')}: ${problemServices}`
          ], margin: [0, 0, 0, 15] },
        ],
        styles: {
          header: {
            fontSize: 18,
            bold: true,
            alignment: 'center',
            margin: [0, 0, 0, 10]
          },
          subheader: {
            fontSize: 14,
            bold: true,
            margin: [0, 10, 0, 5]
          },
          tableHeader: {
            bold: true,
            fontSize: 10,
            color: 'black'
          }
        },
        defaultStyle: {
          font: 'Roboto'
        }
      };
      
      // Add agency chart if available
      if (agencyChartImage) {
        docDefinition.content.push(
          { text: t('dashboard.complaintsByAgency', 'ДИНАМИКА ОБРАЩЕНИЙ ПО ВЕДОМСТВАМ'), style: 'subheader' },
          { image: agencyChartImage, width: 500, margin: [0, 5, 0, 15] }
        );
      }
      
      // Add service type chart if available
      if (serviceTypeChartImage) {
        docDefinition.content.push(
          { text: t('dashboard.serviceTypeDistribution', 'РАСПРЕДЕЛЕНИЕ ПО ТИПАМ УСЛУГ'), style: 'subheader' },
          { image: serviceTypeChartImage, width: 500, margin: [0, 5, 0, 15] }
        );
      }
      
      // Add problem services table if available
      if (problemServicesList?.length > 0) {
        const tableBody = [
          [
            { text: t('reports.serviceName', 'Название услуги'), style: 'tableHeader' },
            { text: t('reports.agency', 'Ведомство'), style: 'tableHeader' },
            { text: t('reports.complaints', 'Кол-во обращений'), style: 'tableHeader' },
            { text: t('reports.status', 'Статус'), style: 'tableHeader' }
          ]
        ];
        
        problemServicesList.filter(Boolean).forEach(item => {
          let status = t('reports.normal', 'Нормальный');
          if (item.count > 100) status = t('reports.critical', 'Критический');
          else if (item.count > 50) status = t('reports.warning', 'Требует внимания');
          
          tableBody.push([
            item.service || '',
            item.agency || '',
            (item.count || 0).toString(),
            status
          ]);
        });
        
        docDefinition.content.push(
          { text: t('dashboard.problemServices', 'ПРОБЛЕМНЫЕ УСЛУГИ'), style: 'subheader' },
          {
            table: {
              headerRows: 1,
              widths: ['*', '*', 'auto', 'auto'],
              body: tableBody
            },
            margin: [0, 5, 0, 15]
          }
        );
      } else {
        docDefinition.content.push(
          { text: t('dashboard.problemServices', 'ПРОБЛЕМНЫЕ УСЛУГИ'), style: 'subheader' },
          { text: t('reports.noProblems', 'Нет данных о проблемных услугах'), italics: true }
        );
      }
      
      // Create and download PDF
      pdfMake.createPdf(docDefinition).download(`Отчет_по_обращениям_${new Date().toISOString().slice(0,10).replace(/-/g, '')}.pdf`);
      
    } catch (error) {
      console.error('Error generating report:', error);
      throw new Error(t('reports.error', 'Ошибка при создании отчета'));
    }
  }, [captureChartAsImage, t, formatDays]);

  /**
   * Generate complaints list report
   * @param {Object} data - Complaints data
   * @param {Object} options - Report generation options
   * @returns {Promise<void>} Promise that resolves when PDF is generated
   */
  const generateComplaintsReport = useCallback(async (data, options = {}) => {
    const { complaints = [], stats = {} } = data;
    
    try {
      // Ensure stats values are valid numbers
      const safeStats = {
        total: stats.total || 0,
        resolved: stats.resolved || 0,
        pending: stats.pending || 0,
        overdue: stats.overdue || 0
      };
      
      // Define document definition
      const docDefinition = {
        content: [
          { text: t('reports.complaintsTitle', 'ОТЧЕТ ПО ОБРАЩЕНИЯМ ГРАЖДАН'), style: 'header' },
          { text: `${t('reports.generatedDate', 'Дата формирования')}: ${new Date().toLocaleDateString('ru-RU')}`, margin: [0, 5, 0, 0] },
          
          { text: t('reports.summaryStats', 'СВОДНАЯ СТАТИСТИКА'), style: 'subheader' },
          { ul: [
            `${t('reports.totalCount', 'Всего обращений')}: ${safeStats.total}`,
            `${t('reports.resolvedCount', 'Решенные обращения')}: ${safeStats.resolved}`,
            `${t('reports.pendingCount', 'Ожидающие обращения')}: ${safeStats.pending}`,
            `${t('reports.overdueCount', 'Просроченные обращения')}: ${safeStats.overdue}`
          ], margin: [0, 0, 0, 15] },
        ],
        styles: {
          header: {
            fontSize: 18,
            bold: true,
            alignment: 'center',
            margin: [0, 0, 0, 10]
          },
          subheader: {
            fontSize: 14,
            bold: true,
            margin: [0, 10, 0, 5]
          },
          tableHeader: {
            bold: true,
            fontSize: 10,
            color: 'black'
          }
        },
        defaultStyle: {
          font: 'Roboto'
        }
      };
      
      // Add complaints table if available
      if (complaints && complaints.length > 0) {
        // First, filter out any potentially undefined complaints
        const validComplaints = complaints.filter(Boolean);
        
        if (validComplaints.length > 0) {
          const tableBody = [
            [
              { text: 'ID', style: 'tableHeader' },
              { text: t('reports.service', 'Услуга'), style: 'tableHeader' },
              { text: t('reports.status', 'Статус'), style: 'tableHeader' },
              { text: t('reports.createdAt', 'Дата создания'), style: 'tableHeader' },
              { text: t('reports.content', 'Содержание'), style: 'tableHeader' }
            ]
          ];
          
          // Ensure all cells have valid values
          validComplaints.forEach(item => {
            let statusText = '';
            switch(item.status) {
              case 'pending': statusText = t('reports.statusPending', 'Ожидает'); break;
              case 'in_progress': statusText = t('reports.statusInProgress', 'В работе'); break;
              case 'resolved': statusText = t('reports.statusResolved', 'Решено'); break;
              case 'cancelled': statusText = t('reports.statusCancelled', 'Отменено'); break;
              default: statusText = item.status || '';
            }

            // Use full complaint text without truncation
            const content = item.report_text || '';

            // Make sure all columns have values (empty string if undefined)
            tableBody.push([
              item.id ? item.id.substring(0, 8) : '',
              item.service || '',
              statusText,
              item.created_at || '',
              content
            ]);
          });
          
          docDefinition.content.push(
            { text: t('reports.complaintsTable', 'ТАБЛИЦА ОБРАЩЕНИЙ'), style: 'subheader' },
            {
              table: {
                headerRows: 1,
                widths: ['auto', '*', 'auto', 'auto', '*'],
                body: tableBody
              },
              margin: [0, 5, 0, 15]
            }
          );
        } else {
          docDefinition.content.push(
            { text: t('reports.complaintsTable', 'ТАБЛИЦА ОБРАЩЕНИЙ'), style: 'subheader' },
            { text: t('reports.noComplaints', 'Нет данных об обращениях'), italics: true }
          );
        }
      } else {
        docDefinition.content.push(
          { text: t('reports.complaintsTable', 'ТАБЛИЦА ОБРАЩЕНИЙ'), style: 'subheader' },
          { text: t('reports.noComplaints', 'Нет данных об обращениях'), italics: true }
        );
      }
      
      // Create and download PDF
      pdfMake.createPdf(docDefinition).download(`Отчет_по_обращениям_${new Date().toISOString().slice(0,10).replace(/-/g, '')}.pdf`);
      
    } catch (error) {
      console.error('Error generating complaints report:', error);
      throw new Error(t('reports.error', 'Ошибка при создании отчета'));
    }
  }, [t]);

  /**
   * Export complaints data to CSV format
   * @param {Object} data - Complaints data
   * @returns {void}
   */
  const exportComplaintsToCsv = useCallback((data) => {
    const { complaints = [] } = data;
    
    // CSV escape helper
    const escapeCSV = (text) => {
      if (!text) return '';
      const escaped = text.toString().replace(/"/g, '""');
      return /[",\n\r]/.test(escaped) ? `"${escaped}"` : escaped;
    };
    
    // Filter out any potentially undefined complaints
    const validComplaints = complaints.filter(Boolean);
    
    if (validComplaints.length === 0) {
      console.warn('No valid complaints data to export');
      return;
    }
    
    // Create CSV header (including Priority)
    let csvContent = `ID,${t('reports.service', 'Услуга')},${t('reports.status', 'Статус')},${t('complaints.priority', 'Приоритет')},${t('reports.createdAt', 'Дата создания')},${t('reports.content', 'Содержание')}\n`;
    
    // Add data rows
    validComplaints.forEach(item => {
      let statusText = '';
      switch(item.status) {
        case 'pending': statusText = t('reports.statusPending', 'Ожидает'); break;
        case 'in_progress': statusText = t('reports.statusInProgress', 'В работе'); break;
        case 'resolved': statusText = t('reports.statusResolved', 'Решено'); break;
        case 'cancelled': statusText = t('reports.statusCancelled', 'Отменено'); break;
        default: statusText = item.status || '';
      }
      
      // Format priority
      const priorityText = item.importance ? t(`status.${item.importance}`) : '';
      // Force date as text in Excel by using formula
      const dateValue = item.created_at || '';
      const csvDate = dateValue ? `="${dateValue}"` : '';
      // Create CSV row including priority and full content
      const csvRow = [
        escapeCSV(item.id ? item.id.substring(0, 8) : ''),
        escapeCSV(item.service || ''),
        escapeCSV(statusText),
        escapeCSV(priorityText),
        csvDate,
        escapeCSV(item.report_text || '')
      ].join(',');
      
      csvContent += csvRow + '\n';
    });
    
    // Create Blob with BOM for proper Cyrillic encoding
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Download file
    FileSaver.saveAs(blob, `Обращения_${new Date().toISOString().slice(0,10).replace(/-/g, '')}.csv`);
  }, [t]);

  /**
   * Export complaints data to Excel format
   * @param {Object} data - Complaints data
   * @returns {void}
   */
  const exportComplaintsToExcel = useCallback((data) => {
    const { complaints = [], stats = {} } = data;
    
    // Filter out any potentially undefined complaints
    const validComplaints = complaints.filter(Boolean);
    
    if (validComplaints.length === 0) {
      console.warn('No valid complaints data to export');
      return;
    }
    
    // Prepare summary data for the first sheet
    const summaryData = [
      [t('reports.summaryStats', 'СВОДНАЯ СТАТИСТИКА'), ''],
      [t('reports.totalCount', 'Всего обращений'), stats.total || 0],
      [t('reports.resolvedCount', 'Решенные обращения'), stats.resolved || 0],
      [t('reports.pendingCount', 'Ожидающие обращения'), stats.pending || 0],
      [t('reports.overdueCount', 'Просроченные обращения'), stats.overdue || 0],
      [t('reports.generatedDate', 'Дата формирования'), new Date().toLocaleDateString('ru-RU')]
    ];
    
    // Prepare complaints data for the second sheet (including Priority)
    const complaintsHeaders = [
      'ID',
      t('reports.service', 'Услуга'),
      t('reports.status', 'Статус'),
      t('complaints.priority', 'Приоритет'),
      t('reports.createdAt', 'Дата создания'),
      t('reports.content', 'Содержание')
    ];
    
    const complaintsData = validComplaints.map(item => {
      let statusText = '';
      switch(item.status) {
        case 'pending': statusText = t('reports.statusPending', 'Ожидает'); break;
        case 'in_progress': statusText = t('reports.statusInProgress', 'В работе'); break;
        case 'resolved': statusText = t('reports.statusResolved', 'Решено'); break;
        case 'cancelled': statusText = t('reports.statusCancelled', 'Отменено'); break;
        default: statusText = item.status || '';
      }
      
      // Determine priority text
      const priorityText = item.importance ? t(`status.${item.importance}`) : '';
      return [
        item.id ? item.id.substring(0, 8) : '',
        item.service || '',
        statusText,
        priorityText,
        item.created_at || '',
        item.report_text || ''
      ];
    });
    
    // Combine headers and data
    const completeComplaintsData = [complaintsHeaders, ...complaintsData];
    
    // Create workbook with multiple sheets
    const wb = XLSX.utils.book_new();
    
    // Determine sheet names
    const summaryName = t('reports.summary', 'Сводка');
    const complaintsName = t('reports.complaints', 'Обращения');
    // Add complaints sheet first
    const complaintsWs = XLSX.utils.aoa_to_sheet(completeComplaintsData);
    XLSX.utils.book_append_sheet(wb, complaintsWs, complaintsName);
    // Add summary sheet
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, summaryName);
    // Ensure the complaints sheet is the first sheet shown
    wb.SheetNames = [complaintsName, summaryName];
    
    // Auto-size columns for better readability
    const wscols = [
      {wch: 10}, // ID column width
      {wch: 30}, // Service column width
      {wch: 15}, // Status column width
      {wch: 15}, // Date column width
      {wch: 70}  // Content column width
    ];
    complaintsWs['!cols'] = wscols;
    
    // Save workbook
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    FileSaver.saveAs(blob, `Обращения_${new Date().toISOString().slice(0,10).replace(/-/g, '')}.xlsx`);
  }, [t]);

  return {
    generateDashboardReport,
    generateComplaintsReport,
    captureChartAsImage,
    exportComplaintsToCsv,
    exportComplaintsToExcel
  };
};
