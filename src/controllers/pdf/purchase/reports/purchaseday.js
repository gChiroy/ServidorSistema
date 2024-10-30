const { jsPDF } = require('jspdf');
const Shopping = require('../../../../models/Shopping');
const { Op } = require('sequelize');
const moment = require('moment');
const CategoryProviders = require('../../../../models/Category_Providers');
const DetailShopping = require('../../../../models/DetailShopping');
const Product = require('../../../../models/Product');
const Provider = require('../../../../models/Providers');
const { Category } = require('../../../../models/Categories');
require('moment/locale/es'); // Importa la configuración regional en español


require('jspdf-autotable');

const https = require('https');

function getBase64FromUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      let data = [];

      // Almacenar los datos del cuerpo de la imagen
      response.on('data', (chunk) => {
        data.push(chunk);
      });

      // Al finalizar la descarga
      response.on('end', () => {
        // Unir los datos y convertirlos a base64
        const buffer = Buffer.concat(data);
        const base64Image = `data:image/jpeg;base64,${buffer.toString('base64')}`; // Asegurarse del prefijo adecuado
        resolve(base64Image);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}
const logoUrl = 'https://res.cloudinary.com/dtvauhqrt/image/upload/v1729663622/LogoTipicosChiroy_dlufoe.png'; 


exports.dayPurPdf = async (req, res) => {
  try {
    const purchases = await Shopping.findAll({
      where: {
        createdAt: {
          [Op.gte]: moment().startOf('day').toDate(),
          [Op.lte]: moment().endOf('day').toDate()
        }
      },
      include: [
        {
          model: Provider,
          include: [{ model: CategoryProviders }]
        },
        {
          model: DetailShopping,
          include: [
            {
              model: Product,
              include: [
                {
                  model: Category,
                },
              ],
            },
          ],
        },
      ],
    });

    if (!purchases) {
      return res.status(404).json({ message: 'No se encontraron compras' });
    }

    const doc = new jsPDF();

    const guatemalaTime = moment().tz('America/Guatemala');
    const formattedDateTime = guatemalaTime.format('DD/MM/YYYY HH:mm');
    const pageWidth = doc.internal.pageSize.width;
    const imgWidth = 14; 
    const imgHeight = (imgWidth * 10) / 10;

    doc.setFont('Helvetica');
    doc.setFontSize(6);
    doc.text(`Fecha de impresión: ${formattedDateTime}`, pageWidth / 2, 8, { align: 'center' });

    const base64Image = await getBase64FromUrl(logoUrl);
    doc.addImage(base64Image, 'PNG', 14, 2, imgWidth, imgHeight);

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Tipicos Chiroy', pageWidth / 2, 12, { align: 'center' });
    doc.line(0, 15, pageWidth, 15);

    doc.setFontSize(12);
    doc.text(`Informe de Compras del Día: ${new Date().toLocaleDateString('es-ES')}`, pageWidth / 2, 20, { align: 'center' });

    let y = 30;

    const purchaseSummary = purchases.map((purchase) => ({
      billNumber: purchase.bill_number || 0,
      providerName: purchase?.Provider ? purchase.Provider.CategoryProviders.name : 'Sin datos',
      workName: purchase?.Provider ? purchase.Provider.name : 'Sin datos',
      date: moment(purchase.createdAt).format('DD/MM/YYYY'),
      total: purchase.total || 0,
    }));

    const purchaseSummaryColumns = ['Factura #', 'Com. Proveedor', 'Trab. Proveedor', 'Fecha', 'Total'];
    const purchaseSummaryData = purchaseSummary.map((summary) => [
      summary.billNumber,
      summary.providerName,
      summary.workName,
      summary.date,
      `Q${summary.total.toFixed(2)}`,
    ]);

    doc.setFontSize(11);
    doc.text('Resumen de Compras del Día', 20, y);
    y += 5;

    const purchaseSummaryTableOptions = {
      startY: y,
      head: [purchaseSummaryColumns],
      body: purchaseSummaryData,
      theme: 'grid',
      styles: {
        halign: 'center',
        valign: 'middle',
        font: 'Helvetica',
        fontSize: 10,
      },
      headStyles: {
        fillColor: [0, 51, 102], // Azul oscuro
        textColor: 255,
        fontStyle: 'bold',
      },
    };

    doc.autoTable(purchaseSummaryTableOptions);
    y = doc.autoTable.previous.finalY + 10;

    const allPurchaseDetails = purchases.reduce((details, purchase) => details.concat(
      purchase.DetailShoppings.map((detail) => ({
        billNumber: purchase.bill_number || 0,
        productName: detail?.Product ? detail.Product.name : 'NA',
        categoryName: detail.Product?.category ? detail.Product.category.type : 'Sin datos',
        amount: detail.amount || 0,
        purchasePrice: detail.purchase_price ? detail.purchase_price.toFixed(2) : 0,
        discount: detail.discount || 0,
        subtotal: detail.subtotal ? detail.subtotal.toFixed(2) : 0,
      }))
    ), []);

    const purchaseDetailsColumns = ['Fac. Comp', 'Producto', 'Marca', 'Categoría', 'Cantidad', 'Precio Compra U', 'Desc.', 'Subtotal'];
    const purchaseDetailsData = allPurchaseDetails.map((detail) => [
      detail.billNumber,
      detail.productName,
      detail.categoryName,
      detail.amount,
      `Q${detail.purchasePrice}`,
      detail.discount ? `Q ${detail.discount}` : 'Sin datos',
      `Q${detail.subtotal}`,
    ]);

    doc.setFontSize(11);
    doc.text('Detalles de Compras del Día', 20, y);
    y += 5;

    const purchaseDetailsTableOptions = {
      startY: y,
      head: [purchaseDetailsColumns],
      body: purchaseDetailsData,
      theme: 'grid',
      styles: {
        halign: 'center',
        valign: 'middle',
        font: 'Helvetica',
        fontSize: 10,
      },
      headStyles: {
        fillColor: [0, 51, 102], // Azul oscuro
        textColor: 255,
        fontStyle: 'bold',
      },
    };

    doc.autoTable(purchaseDetailsTableOptions);
    y = doc.autoTable.previous.finalY + 2;

    const totalDayPurchases = purchases.reduce((total, purchase) => total + purchase.total, 0);

    y += 5;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(`Total del Día: Q${totalDayPurchases.toFixed(2)}`, 20, y + 4);

    const pdfBuffer = doc.output();
    res.contentType('application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-day.pdf`);
    res.end(pdfBuffer, 'binary');
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Error al generar el PDF' });
  }
};


exports.selectdayPurPdf = async (req, res) => {
  try {
      const { date } = req.query;
      if (!date) {
          return res.status(400).json({ message: 'Debes proporcionar una fecha en el formato DD-MM-YYYY' });
      }

      const startDate = moment(date, 'DD-MM-YYYY').startOf('day');
      const endDate = moment(date, 'DD-MM-YYYY').endOf('day');

      const purchases = await Shopping.findAll({
          where: {
              createdAt: {
                  [Op.gte]: startDate.toDate(),
                  [Op.lte]: endDate.toDate()
              }
          },
          include: [
              {
                  model: Provider,
                  include: [{ model: CategoryProviders }]
              },
              {
                  model: DetailShopping,
                  include: [
                      {
                          model: Product,
                          include: [{ model: Category }]
                      }
                  ]
              }
          ]
      });
      
      if (!purchases) {
          return res.status(404).json({ message: 'No se encontraron compras' });
      }

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;

      const guatemalaTime = moment().tz('America/Guatemala');
      const formattedDateTime = guatemalaTime.format('DD/MM/YYYY HH:mm');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.text(`Fecha de impresión: ${formattedDateTime}`, pageWidth / 2, 8, { align: 'center' });

      const base64Image = await getBase64FromUrl(logoUrl);
      doc.addImage(base64Image, 'PNG', 14, 2, 13, 13);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Tipicos Chiroy', pageWidth / 2, 12, { align: 'center' });
      doc.line(0, 15, pageWidth, 15);
      
      doc.setFontSize(12);
      doc.text(`Informe de Compras del Día: ${date}`, pageWidth / 2, 20, { align: 'center' });

      let y = 30;

      const purchaseSummary = purchases.map((purchase) => ({
          billNumber: purchase.bill_number || 0,
          providerName: purchase.Provider ? purchase.Provider.CategoryProviders.name : 'Sin datos',
          workName: purchase.Provider ? purchase.Provider.name : 'Sin datos',
          date: moment(purchase.createdAt).format('DD/MM/YYYY'),
          total: purchase.total || 0
      }));

      const purchaseSummaryColumns = ['Factura #', 'Com. Proveedor', 'Trab. Proveedor', 'Fecha', 'Total'];
      const purchaseSummaryData = purchaseSummary.map((summary) => [
          summary.billNumber,
          summary.providerName,
          summary.workName,
          summary.date,
          `Q${summary.total.toFixed(2)}`
      ]);

      doc.setFontSize(11);
      doc.text('Resumen de Compras del Día', 20, y);
      y += 5;

      const purchaseSummaryTableOptions = {
          startY: y,
          head: [purchaseSummaryColumns],
          body: purchaseSummaryData,
          theme: 'grid',
          tableLineWidth: 0.1,
          tableWidth: 'auto',
          margin: { top: 60 },
          didParseCell: (data) => {
              data.cell.styles.fontSize = 10;
              data.cell.styles.font = 'helvetica';
              if (data.row.index === 0 && purchaseSummaryColumns.includes(data.cell.raw.toString())) {
                  // Color de fondo azul oscuro para la cabecera
                  data.cell.styles.fillColor = [0, 51, 102];
                  data.cell.styles.textColor = [255, 255, 255]; // Texto en blanco
              }
              data.cell.styles.halign = 'center';
              data.cell.styles.valign = 'middle';
          }
      };

      const purchaseSummaryTableWidth = purchaseSummaryTableOptions.head[0].length * 24;
      const purchaseSummaryTableMarginLeft = (pageWidth - purchaseSummaryTableWidth) / 2;
      purchaseSummaryTableOptions.margin.left = purchaseSummaryTableMarginLeft;

      doc.autoTable(purchaseSummaryTableOptions);
      y = doc.autoTable.previous.finalY + 10;

      const allPurchaseDetails = purchases.reduce((details, purchase) => details.concat(
          purchase.DetailShoppings.map((detail) => ({
              billNumber: purchase.bill_number || 0,
              productName: detail.Product ? detail.Product.name : 'NA',
              categoryName: detail.Product?.category ? detail.Product.category.type : 'Sin datos',
              amount: detail.amount || 0,
              purchasePrice: detail.purchase_price?.toFixed(2) || 0,
              discount: detail.discount || 0,
              subtotal: detail.subtotal?.toFixed(2) || 0
          }))
      ), []);

      const purchaseDetailsColumns = ['Fac. Comp', 'Producto', 'Categoría', 'Cantidad', 'Precio Compra U', 'Desc.', 'Subtotal'];
      const purchaseDetailsData = allPurchaseDetails.map((detail) => [
          detail.billNumber,
          detail.productName,
          detail.categoryName,
          detail.amount,
          `Q${detail.purchasePrice}`,
          `Q ${detail.discount}`,
          `Q${detail.subtotal}`
      ]);

      doc.text('Detalles de Compras del Día', 20, y);
      y += 5;

      const purchaseDetailsTableOptions = {
          startY: y,
          head: [purchaseDetailsColumns],
          body: purchaseDetailsData,
          theme: 'grid',
          tableLineWidth: 0.1,
          tableWidth: 'auto',
          margin: { top: 2 },
          didParseCell: (data) => {
              data.cell.styles.fontSize = 8;
              data.cell.styles.font = 'helvetica';
              if (data.row.index === 0 && purchaseDetailsColumns.includes(data.cell.raw.toString())) {
                  // Color de fondo azul oscuro para la cabecera
                  data.cell.styles.fillColor = [0, 51, 102];
                  data.cell.styles.textColor = [255, 255, 255]; // Texto en blanco
              }
              data.cell.styles.halign = 'center';
              data.cell.styles.valign = 'middle';
          }
      };

      const purchaseDetailsTableWidth = purchaseDetailsTableOptions.head[0].length * 22;
      const purchaseDetailsTableMarginLeft = (pageWidth - purchaseDetailsTableWidth) / 2;
      purchaseDetailsTableOptions.margin.left = purchaseDetailsTableMarginLeft;

      doc.autoTable(purchaseDetailsTableOptions);
      y = doc.autoTable.previous.finalY + 2;

      const totalDayPurchases = purchases.reduce((total, purchase) => total + purchase.total, 0);

      y += 5;

      doc.setFontSize(13);
      doc.text(`Total del Día: Q${totalDayPurchases.toFixed(2)}`, 20, y + 4);

      const pdfBuffer = doc.output();
      res.contentType('application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=invoice-day.pdf`);
      res.end(pdfBuffer, 'binary');
  } catch (error) {
      console.log(error);
      res.status(500).json({ message: 'Error al generar el PDF' });
  }
};


  
exports.weeklyPurPdf = async (req, res) => {
  try {
    const currentDate = moment().tz('America/Guatemala');
    const startOfWeek = currentDate.clone().startOf('week').day(1);
    const endOfWeek = currentDate.clone().endOf('week').day(7);
    
    const purchases = await Shopping.findAll({
      where: {
        createdAt: {
          [Op.between]: [startOfWeek.toDate(), endOfWeek.toDate()],
        },
      },
    });

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const guatemalaTime = moment().tz('America/Guatemala');
    const formattedDateTime = guatemalaTime.format('DD/MM/YYYY HH:mm');

    const header = async () => {
      doc.setFontSize(6);
      doc.text(`Fecha de impresión: ${formattedDateTime}`, pageWidth / 2, 8, { align: 'center' });
      
      const base64Image = await getBase64FromUrl(logoUrl);
      doc.addImage(base64Image, 'PNG', 14, 2, 13, 10);
      
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.text('Tipicos Chiroy', pageWidth / 2, 12, { align: 'center' });
      doc.line(0, 15, pageWidth, 15);
    };

    await header();

    doc.setFontSize(12);
    doc.text('Informe Semanal de Compras', pageWidth / 2, 23, { align: "center" });
    
    const tableData = [];
    const tableHeaders = ['Día', 'Total día', 'Diferencia', 'Detalles'];
    const dailyTotals = {};
    let previousTotal = null;

    purchases.forEach((purchase) => {
      const dayOfWeek = moment(purchase.createdAt).format('dddd');
      const total = purchase.total ? purchase.total.toFixed(2) : 0;

      if (!dailyTotals[dayOfWeek]) {
        dailyTotals[dayOfWeek] = { total: 0, details: [] };
      }
      dailyTotals[dayOfWeek].total += purchase.total || 0;
      dailyTotals[dayOfWeek].details.push(`Factura ${purchase.bill_number}: Q. ${total}`);
    });

    for (const day in dailyTotals) {
      const { total, details } = dailyTotals[day];
      const detailsText = details.join('\n');
      let difference = 0;
      if (previousTotal !== null) {
        difference = total - previousTotal;
      }
      previousTotal = total;

      tableData.push([
        day,
        `Q. ${total.toFixed(2)}`,
        `Q. ${difference.toFixed(2)}`,
        detailsText,
      ]);
    }

    let weeklyTotal = 0;
    for (const day in dailyTotals) {
      weeklyTotal += dailyTotals[day].total;
    }
    tableData.push(['', 'Total de la semana:', `Q. ${weeklyTotal ? weeklyTotal.toFixed(2) : 0}`, '']);

    doc.autoTable({
      head: [tableHeaders],
      body: tableData,
      startY: 30,
      theme: 'grid',
      tableLineWidth: 0.1,
      tableWidth: 'auto',
      didParseCell: (data) => {
        data.cell.styles.fontSize = 9;
        data.cell.styles.font = 'Helvetica';
        if (data.row.index === 0 && tableHeaders.includes(data.cell.raw.toString())) {
          data.cell.styles.fillColor = [0, 51, 102]; // Azul oscuro
          data.cell.styles.textColor = [255, 255, 255]; // Blanco para texto
        }
        data.cell.styles.halign = 'center';
        data.cell.styles.valign = 'middle';
      },
    });

    const pdfBuffer = doc.output();
    res.setHeader('Content-Disposition', 'attachment; filename="weekly_report.pdf"');
    res.setHeader('Content-Type', 'application/pdf');
    res.end(pdfBuffer, 'binary');
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al generar el informe semanal de compras' });
  }
};


exports.selectweeklyPurPdf = async (req, res) => {
  try {
      const { week, month } = req.query;

      if (!week || !month) {
          return res.status(400).json({ message: 'Debes proporcionar el número de semana y el número de mes' });
      }

      const currentYear = moment().year();
      if (month < 1 || month > 12 || week < 1 || week > 5) {
          return res.status(400).json({ message: 'El número de mes debe estar en el rango 1-12 y el número de semana en el rango 1-4' });
      }

      const currentDate = moment().tz('America/Guatemala');
      const startOfMonth = moment().year(currentYear).month(month - 1).startOf('month');
      const startOfWeek = startOfMonth.clone().add(7 * (week - 1) + 1, 'days');
      const endOfWeek = startOfWeek.clone().add(7, 'days');

      const purchases = await Shopping.findAll({
          where: {
              createdAt: {
                  [Op.between]: [startOfWeek.toDate(), endOfWeek.toDate()],
              },
          },
      });

      const doc = new jsPDF();
      const guatemalaTime = moment().tz('America/Guatemala');
      const formattedDateTime = guatemalaTime.format('DD/MM/YYYY HH:mm');
      const pageWidth = doc.internal.pageSize.width;
      const imgWidth = 13;
      const imgHeight = (imgWidth * 10) / 10;

      const header = async () => {
          doc.setFontSize(6);
          doc.text(`Fecha de impresión: ${formattedDateTime}`, pageWidth / 2, 8, { align: 'center' });

          const base64Image = await getBase64FromUrl(logoUrl);
          doc.addImage(base64Image, 'JPG', 14, 2, imgWidth, imgHeight);

          doc.setFont("Helvetica", "bold");
          doc.setFontSize(10);
          doc.text('Tipicos Chiroy', pageWidth / 2, 12, { align: 'center' });
          doc.line(0, 15, pageWidth, 15);
      };

      await header();

      doc.setFontSize(12);
      doc.text(`Informe Semanal de Compras`, pageWidth / 2, 23, { align: "center" });
      doc.setFont("Helvetica");

      const tableData = [];
      const tableHeaders = ['Día', 'Total día.', 'Diferencia', 'Detalles'];
      const dailyTotals = {};
      let previousTotal = null;

      purchases.forEach((purchase) => {
          const dayOfWeek = moment(purchase.createdAt).format('dddd');
          const total = purchase.total ? purchase.total.toFixed(2) : 0;

          if (!dailyTotals[dayOfWeek]) {
              dailyTotals[dayOfWeek] = { total: 0, details: [] };
          }
          dailyTotals[dayOfWeek].total += purchase.total ? purchase.total : 0;
          dailyTotals[dayOfWeek].details.push(`Factura ${purchase.bill_number}: Q. ${total}`);
      });

      for (const day in dailyTotals) {
          const { total, details } = dailyTotals[day];
          const formattedDate = startOfWeek.clone().day(day).format('YYYY-MM-DD');
          const detailsText = details.join('\n');

          let difference = 0;
          if (previousTotal !== null) {
              difference = total - previousTotal;
          }
          previousTotal = total;

          tableData.push([day, `Q. ${total.toFixed(2)}`, `Q. ${difference.toFixed(2)}`, detailsText]);
      }

      let weeklyTotal = 0;
      for (const day in dailyTotals) {
          weeklyTotal += dailyTotals[day].total;
      }

      tableData.push(['', 'Total de la semana:', `Q. ${weeklyTotal.toFixed(2)}`, '', '']);

      doc.autoTable({
          head: [tableHeaders],
          body: tableData,
          startY: 30,
          theme: 'grid',
          tableLineWidth: 0.1,
          tableWidth: 'auto',
          didParseCell: (data) => {
              data.cell.styles.fontSize = 9;
              data.cell.styles.font = 'Helvetica';
              if (data.row.index === 0 && tableHeaders.includes(data.cell.raw.toString())) {
                  data.cell.styles.fillColor = [0, 0, 102]; // Azul oscuro
                  data.cell.styles.textColor = [255, 255, 255]; // Blanco
              }
              data.cell.styles.halign = 'center';
              data.cell.styles.valign = 'middle';
          },
      });

      const pdfBuffer = doc.output();
      res.setHeader('Content-Disposition', 'attachment; filename="weekly_report.pdf"');
      res.setHeader('Content-Type', 'application/pdf');
      res.end(pdfBuffer, 'binary');
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error al generar el informe semanal de compras' });
  }
};


exports.monthlyPurPdf = async (req, res) => {
  try {
    const currentDate = moment().tz('America/Guatemala');
    const startOfMonth = currentDate.clone().startOf('month').startOf('isoWeek');
    const endOfMonth = currentDate.clone().endOf('month').endOf('isoWeek');

    const purchases = await Shopping.findAll({
      where: {
        createdAt: {
          [Op.between]: [startOfMonth.toDate(), endOfMonth.toDate()],
        },
      },
    });

    moment.locale('es');
    const doc = new jsPDF();
    const guatemalaTime = moment().tz('America/Guatemala');
    const formattedDateTime = guatemalaTime.format('DD/MM/YYYY HH:mm');
    const pageWidth = doc.internal.pageSize.width;

    const header1 = async () => {
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(6);
      doc.text(`Fecha de impresión: ${formattedDateTime}`, pageWidth / 2, 8, { align: 'center' });

      doc.setFontSize(10);
      doc.text('Tipicos Chiroy', pageWidth / 2, 12, { align: 'center' });
      doc.line(0, 15, pageWidth, 15);
    }

    const weeklyPurchases = {};
    purchases.forEach((purchase) => {
      const weekOfYear = moment(purchase.createdAt).isoWeek();
      if (!weeklyPurchases[weekOfYear]) {
        weeklyPurchases[weekOfYear] = {};
      }

      const purchaseDate = moment(purchase.createdAt);
      const dayOfWeek = purchaseDate.format('dddd');
      const total = purchase.total ? purchase.total.toFixed(2) : 0;

      if (!weeklyPurchases[weekOfYear][dayOfWeek]) {
        weeklyPurchases[weekOfYear][dayOfWeek] = {
          total: 0,
          details: [],
        };
      }

      weeklyPurchases[weekOfYear][dayOfWeek].total += purchase.total ? purchase.total : 0;
      weeklyPurchases[weekOfYear][dayOfWeek].details.push(`Factura ${purchase.bill_number}: Q. ${total}`);
    });

    const weekInfo = Object.keys(weeklyPurchases).map((week) => {
      const weekNumber = parseInt(week);
      const monthName = currentDate.format('MMMM');
      return { weekNumber, monthName };
    });

    for (const [index, info] of weekInfo.entries()) {
      const { weekNumber, monthName } = info;
      const weekData = weeklyPurchases[weekNumber];

      const header = `Semana ${weekNumber} de ${monthName}`;
      const tableData = [];
      const tableHeaders = ['Día', 'Total de Compras', 'Detalles'];

      const daysInWeek = Object.keys(weekData);
      const daysUsedInPreviousWeek = {};

      let startY = 35;

      for (let i = 0; i < daysInWeek.length; i++) {
        const dayOfWeek = daysInWeek[i];
        const { total, details } = weekData[dayOfWeek];

        if (index > 0 && daysUsedInPreviousWeek[dayOfWeek]) {
          continue;
        }

        tableData.push([dayOfWeek, `Q. ${total ? total.toFixed(2) : 0}`, details.join('\n')]);
        if (index > 0) {
          daysUsedInPreviousWeek[dayOfWeek] = true;
        }
      }

      if (index > 0) {
        doc.addPage();
      }

      await header1();
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(12);
      doc.text('Informe Mensual de Compras', pageWidth / 2, 20, { align: 'center' });

      doc.setFontSize(12);
      doc.text(header, 10, 30);
      doc.setFontSize(12);

      doc.autoTable({
        head: [tableHeaders],
        body: tableData,
        startY,
        theme: 'grid',
        tableLineWidth: 0.1,
        tableWidth: 'auto',
        
        didParseCell: (data) => {
          data.cell.styles.fontSize = 9;
          data.cell.styles.font = 'Helvetica';
          data.cell.styles.halign = 'center';
          data.cell.styles.valign = 'middle';
          if (data.row.index === 0 && tableHeaders.includes(data.cell.raw.toString())) {
            data.cell.styles.fillColor = [0, 51, 102];  // Azul oscuro
            data.cell.styles.textColor = [255, 255, 255];
          }
          data.cell.styles.halign = 'center';
          data.cell.styles.valign = 'middle';
        },
      });
    }

    const pdfBuffer = doc.output();
    res.setHeader('Content-Disposition', 'attachment; filename="monthly_report.pdf"');
    res.setHeader('Content-Type', 'application/pdf');
    res.end(pdfBuffer, 'binary');
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al generar el informe mensual de compras' });
  }
};


exports.selectmonthlyPurPdf = async (req, res) => {
  try {
    const { month } = req.query; // Obtén el número de mes del query de la solicitud

    const currentDate = moment().tz('America/Guatemala');
    const currentYear = moment().year();

    const startOfMonth = moment().year(currentYear).month(month - 1).startOf('month').startOf('isoWeek');
    const endOfMonth = moment().year(currentYear).month(month - 1).endOf('month').endOf('isoWeek');

    const purchases = await Shopping.findAll({
      where: {
        createdAt: {
          [Op.between]: [startOfMonth.toDate(), endOfMonth.toDate()],
        },
      },
    });

    moment.locale('es');

    const doc = new jsPDF();
    doc.setFont("Helvetica"); // Cambiar la fuente a Helvetica
    const pageWidth = doc.internal.pageSize.width;

    const guatemalaTime = moment().tz('America/Guatemala');
    const formattedDateTime = guatemalaTime.format('DD/MM/YYYY HH:mm');

    const header1 = async () => {
      doc.setFontSize(6);
      doc.text(`Fecha de impresión: ${formattedDateTime}`, pageWidth / 2, 8, { align: 'center' });

      const base64Image = await getBase64FromUrl(logoUrl);
      const imgWidth = 13;
      const imgHeight = (imgWidth * 10) / 10;
      doc.addImage(base64Image, 'JPG', 14, 2, imgWidth, imgHeight);
    
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.text('Tipicos Chiroy', pageWidth / 2, 12, { align: 'center' });
      doc.line(0, 15, pageWidth, 15);
    }

    const weeklyPurchases = {};
    purchases.forEach((purchase) => {
      const weekOfYear = moment(purchase.createdAt).isoWeek();
      if (!weeklyPurchases[weekOfYear]) {
        weeklyPurchases[weekOfYear] = {};
      }

      const purchaseDate = moment(purchase.createdAt);
      const dayOfWeek = purchaseDate.format('dddd');
      const total = purchase.total ? purchase.total.toFixed(2) : 0;

      if (!weeklyPurchases[weekOfYear][dayOfWeek]) {
        weeklyPurchases[weekOfYear][dayOfWeek] = {
          total: 0,
          details: [],
        };
      }

      weeklyPurchases[weekOfYear][dayOfWeek].total += purchase.total ? purchase.total : 0;
      weeklyPurchases[weekOfYear][dayOfWeek].details.push(`Factura ${purchase.bill_number}: Q. ${total}`);
    });

    const weekInfo = Object.keys(weeklyPurchases).map((week) => {
      const weekNumber = parseInt(week);
      const monthName = currentDate.format('MMMM');
      return {
        weekNumber,
        monthName,
      };
    });

    const monthName = moment().month(month - 1).format('MMMM');

    for (const [index, info] of weekInfo.entries()) {
      const { weekNumber } = info;
      const weekData = weeklyPurchases[weekNumber];
      const header = `Semana ${weekNumber} de ${monthName}`;
      const tableData = [];
      const tableHeaders = ['Día', 'Total de Compras', 'Detalles'];
      const daysInWeek = Object.keys(weekData);
      const daysUsedInPreviousWeek = {};
      let startY = 35;

      for (let i = 0; i < daysInWeek.length; i++) {
        const dayOfWeek = daysInWeek[i];
        const { total, details } = weekData[dayOfWeek];

        if (index > 0 && daysUsedInPreviousWeek[dayOfWeek]) {
          continue;
        }

        tableData.push([dayOfWeek, `Q. ${total ? total.toFixed(2) : 0}`, details.join('\n')]);
        if (index > 0) {
          daysUsedInPreviousWeek[dayOfWeek] = true;
        }
      }

      if (index > 0) {
        doc.addPage();
      }
      await header1();
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(12);
      doc.text('Informe Mensual de Compras', pageWidth / 2, 20, { align: 'center' });
      doc.setFontSize(12);
      doc.text(header, 10, 30);

      doc.autoTable({
        head: [tableHeaders],
        body: tableData,
        startY,
        theme: 'grid',
        tableLineWidth: 0.1,
        tableWidth: 'auto',
        didParseCell: (data) => {
          data.cell.styles.fontSize = 9;
          data.cell.styles.font = 'Helvetica';
          if (data.row.index === 0 && tableHeaders.includes(data.cell.raw.toString())) {
            data.cell.styles.fillColor = [0, 51, 102]; // Azul oscuro
            data.cell.styles.textColor = [255, 255, 255]; // Blanco
          }
          data.cell.styles.halign = 'center';
          data.cell.styles.valign = 'middle';
        },
      });
    }

    const pdfBuffer = doc.output();
    res.setHeader('Content-Disposition', 'attachment; filename="monthly_report.pdf"');
    res.setHeader('Content-Type', 'application/pdf');
    res.end(pdfBuffer, 'binary');
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al generar el informe mensual de compras' });
  }
};








  