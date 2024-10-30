const { jsPDF } = require('jspdf');
const { Op } = require('sequelize');
const moment = require('moment');
// const Product = require('../../../../models/Product');
// const { Brand, Category } = require('../../../../models/CategoriesBrands');
const Sale = require('../../../models/Sales');
const Customer = require('../../../models/Customers');
const DetailSale = require('../../../models/DetailSales');
const InventoryProduct = require('../../../models/InventoryProducts');
const Product = require('../../../models/Product');
const { Category } = require('../../../models/Categories');
require('jspdf-autotable');

const https = require('https');



// Función para obtener la imagen como base64
function getBase64FromUrl(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (resp) => {
            let data = [];
            
            resp.on('data', (chunk) => {
                data.push(chunk);
            });
            
            resp.on('end', () => {
                const buffer = Buffer.concat(data);
                resolve(buffer.toString('base64'));
            });
            
        }).on('error', (err) => {
            console.error("Error al obtener la imagen:", err.message);
            resolve(null); // Resolvemos con null en caso de error
        });
    });
}
const imageUrl = 'https://res.cloudinary.com/dtvauhqrt/image/upload/v1729663622/LogoTipicosChiroy_dlufoe.png';

const marginLeft = 15; // margen izquierdo
const marginRight = 15; // margen derecho

// VARIABLES PARA LA LINEA
// Calcula el inicio y fin de la línea en función de los márgenes
const startX = marginLeft;
const endX = 210 - marginRight;

exports.daySalesPdf = async (req, res) => {
  try {
    const base64Image = await getBase64FromUrl(imageUrl);

    const purchases = await Sale.findAll({
      where: {
        createdAt: {
          [Op.gte]: moment().startOf('day').toDate(),
          [Op.lte]: moment().endOf('day').toDate()
        }
      },
      include: [
        { model: Customer }, 
        {
          model: DetailSale,
          include: [
            {
              model: InventoryProduct,
              include: [{ model: Product, include: [{ model: Category }] }]
            }
          ]
        }
      ]
    });

    if (!purchases) {
      return res.status(404).json({ message: 'No se encontraron ventas' });
    }

    const doc = new jsPDF();
    doc.setFont("Helvetica");  // Establece la fuente a Helvetica

    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const imgWidth = 13;
    const imgHeight = (imgWidth * 10) / 10;
    const guatemalaTime = moment().tz('America/Guatemala');
    const formattedDateTime = guatemalaTime.format('DD/MM/YYYY HH:mm');

    doc.setFontSize(6);
    doc.text(`Fecha de impresión: ${formattedDateTime}`, pageWidth / 2, 8, { align: 'center' });
    
    if (base64Image) {
      doc.addImage(`data:image/png;base64,${base64Image}`, 'PNG', 14, 2, imgWidth, imgHeight, { align: 'left' });
    }

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.text('Tipicos Chiroy', pageWidth / 2, 12, { align: 'center' });
    doc.line(10, 15, pageWidth - 10, 15);

    doc.setFontSize(12);
    doc.text(`Informe de Ventas del Día: ${new Date().toLocaleDateString('es-ES')}`, pageWidth / 2, 20, { align: 'center' });

    let y = 30;

    const purchaseSummaryColumns = ['Factura #', 'Cliente', 'Fecha', 'Total'];
    const purchaseSummaryData = purchases.map((purchase) => [
      purchase.bill_number || 0,
      purchase.Customer ? purchase.Customer.name : 'NA',
      moment(purchase.createdAt).format('DD/MM/YYYY'),
      `Q${(purchase.total || 0).toFixed(2)}`,
    ]);

    doc.setFont("Helvetica");
    doc.setFontSize(11);
    doc.text('Resumen de Ventas del Día', 20, y);

    y += 5;

    doc.autoTable({
      startY: y,
      head: [purchaseSummaryColumns],
      body: purchaseSummaryData,
      theme: 'grid',
      tableLineWidth: 0.1,

      margin: { top: 60 },
      didParseCell: (data) => {
        data.cell.styles.fontSize = 10;
        data.cell.styles.font = 'Helvetica';
        if (data.row.index === 0 && purchaseSummaryColumns.includes(data.cell.raw.toString())) {
            data.cell.styles.fillColor = [0, 51, 102]; // Azul oscuro
            data.cell.styles.textColor = [255, 255, 255]; // Blanco
        }
        data.cell.styles.halign = 'center';
        data.cell.styles.valign = 'middle';
    },
    });

    y = doc.autoTable.previous.finalY + 10;

    const purchaseDetailsColumns = ['Fac. #', 'Codigo', 'Producto', 'Categoría', 'Cantidad', 'Precio Venta U', 'Desc.', 'Subtotal'];
    const purchaseDetailsData = purchases.reduce((details, purchase) => {
      return details.concat(
        purchase.DetailSales.map((detail) => [
          purchase.bill_number || 0,
          detail.inventory_product?.Product ? detail.inventory_product.Product.code_product : 0,
          detail.inventory_product?.Product ? detail.inventory_product.Product.name : 'NA',
          detail.inventory_product?.Product?.category ? detail.inventory_product.Product.category.type : 'Sin dato',
          detail.amount || 0,
          `Q. ${detail.price_inv_prod ? detail.price_inv_prod.toFixed(2) : 0}`,
          `Q. ${detail.discount || 0}`,
          `Q. ${detail.subtotal ? detail.subtotal.toFixed(2) : 0}`,
        ])
      );
    }, []);

    doc.setFontSize(11);
    doc.text('Detalles de Ventas del Día', 20, y);
    y += 5;

    doc.autoTable({
      startY: y,
      head: [purchaseDetailsColumns],
      body: purchaseDetailsData,
      theme: 'grid',
      tableLineWidth: 0.1,
      headStyles: { fillColor: [40, 40, 40], textColor: 255 },  // Color oscuro en el encabezado
      bodyStyles: { font: 'Helvetica' },
      margin: { top: 60 },
      didParseCell: (data) => {
        data.cell.styles.fontSize = 9;
        data.cell.styles.font = 'Helvetica';
        if (data.row.index === 0 && purchaseDetailsColumns.includes(data.cell.raw.toString())) {
            data.cell.styles.fillColor = [0, 51, 102]; // Azul oscuro
            data.cell.styles.textColor = [255, 255, 255]; // Blanco
        }
        data.cell.styles.halign = 'center';
        data.cell.styles.valign = 'middle';
    },
    });

    const totalDayPurchases = purchases.reduce((total, purchase) => total + (purchase.total || 0), 0);
    y = doc.autoTable.previous.finalY + 10;

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.text(`Total del Día: Q${totalDayPurchases.toFixed(2)}`, 20, y);

    const productsSold = purchases.reduce((acc, purchase) => {
      purchase.DetailSales.forEach((detail) => {
        const productName = detail.inventory_product?.Product.name || 'NA';
        acc[productName] = (acc[productName] || 0) + (detail.amount || 0);
      });
      return acc;
    }, {});

    const sortedProducts = Object.keys(productsSold).sort((a, b) => productsSold[b] - productsSold[a]).slice(0, 5);
    y += 6;
    doc.setFontSize(10);
    doc.text('Productos más Vendidos del Día (Top 5)', 20, y);
    y += 7;
    
    sortedProducts.forEach((productName, index) => {
      doc.text(`${index + 1}. ${productName}: ${productsSold[productName]} unidades`, 20, y);
      y += 10;
    });

    const pdfBuffer = doc.output();
    res.contentType('application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-day.pdf`);
    res.end(pdfBuffer, 'binary');
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Error al generar el PDF' });
  }
};

exports.SelecteddaySalesPdf = async (req, res) => {
  try {
    const base64Image = await getBase64FromUrl(imageUrl);
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: 'Debes proporcionar una fecha en el formato DD-MM-YYYY' });
    }

    const startDate = moment(date, 'DD-MM-YYYY').startOf('day');
    const endDate = moment(date, 'DD-MM-YYYY').endOf('day');

    const purchases = await Sale.findAll({
      where: {
        createdAt: {
          [Op.gte]: startDate.toDate(),
          [Op.lte]: endDate.toDate()
        }
      },
      include: [{
          model: Customer
      }, {
          model: DetailSale,
          include: [{
              model: InventoryProduct,
              include: [{
                  model: Product,
                  include: [{ model: Category }]
              }]
          }]
      }]
    });

    if (!purchases) {
      return res.status(404).json({ message: 'No se encontraron ventas' });
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const guatemalaTime = moment().tz('America/Guatemala');
    const formattedDateTime = guatemalaTime.format('DD/MM/YYYY HH:mm');

    // Configuración de fuente y encabezado
    doc.setFont('Helvetica');
    doc.setFontSize(6);
    doc.text(`Fecha de impresión: ${formattedDateTime}`, pageWidth / 2, 8, { align: 'center' });

    if (base64Image) {
      doc.addImage(`data:image/png;base64,${base64Image}`, 'PNG', 14, 2, 13, 13);
    }

    doc.setFontSize(10);
    doc.text('Tipicos Chiroy', pageWidth / 2, 12, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Informe de Ventas del Día: ${date}`, pageWidth / 2, 20, { align: 'center' });

    // Resumen de ventas
    const purchaseSummaryColumns = ['Factura #', 'Cliente', 'Fecha', 'Total'];
    const purchaseSummaryData = purchases.map((purchase) => [
      purchase.bill_number || 0,
      purchase.Customer ? purchase.Customer.name : 'NA',
      moment(purchase.createdAt).format('DD/MM/YYYY'),
      `Q${(purchase.total || 0).toFixed(2)}`,
    ]);

    const summaryOptions = {
      startY: 30,
      head: [purchaseSummaryColumns],
      body: purchaseSummaryData,
      theme: 'grid',
      headStyles: { fillColor: [0, 51, 102] }, // Azul oscuro
      styles: { fontSize: 10, font: 'Helvetica' },
      margin: { top: 60 },
      didParseCell: (data) => {
        data.cell.styles.halign = 'center';
        data.cell.styles.valign = 'middle';
      },
    };

    doc.autoTable(summaryOptions);
    let y = doc.autoTable.previous.finalY + 10;

    // Detalles de ventas
    const detailColumns = ['Fac. #', 'Código', 'Producto', 'Categoría', 'Cantidad', 'Precio Venta U', 'Desc.', 'Subtotal'];
    const detailsData = purchases.reduce((details, purchase) => {
      return details.concat(
        purchase.DetailSales.map((detail) => [
          purchase.bill_number || 0,
          detail.inventory_product?.Product ? detail.inventory_product.Product.code_product : 'NA',
          detail.inventory_product?.Product ? detail.inventory_product.Product.name : 'NA',
          detail.inventory_product?.Product?.category?.type || 'Sin dato',
          detail.amount || 0,
          `Q. ${detail.price_inv_prod ? detail.price_inv_prod.toFixed(2) : 0}`,
          `Q. ${detail.discount || 0}`,
          `Q. ${detail.subtotal ? detail.subtotal.toFixed(2) : 0}`,
        ])
      );
    }, []);

    const detailsOptions = {
      startY: y,
      head: [detailColumns],
      body: detailsData,
      theme: 'grid',
      headStyles: { fillColor: [0, 51, 102] }, // Azul oscuro
      styles: { fontSize: 9, font: 'Helvetica' },
      margin: { top: 60 },
      didParseCell: (data) => {
        data.cell.styles.halign = 'center';
        data.cell.styles.valign = 'middle';
      },
    };

    doc.autoTable(detailsOptions);
    y = doc.autoTable.previous.finalY + 10;

    // Total del día
    const totalDayPurchases = purchases.reduce((total, purchase) => {
      return total + (purchase.total || 0);
    }, 0);

    doc.setFontSize(11);
    doc.text(`Total del Día: Q${totalDayPurchases.toFixed(2)}`, 20, y);

    // Productos más vendidos del día (Top 5)
    const productsSold = purchases.reduce((products, purchase) => {
      purchase.DetailSales.forEach((detail) => {
        const productName = detail.inventory_product?.Product?.name || 'Desconocido';
        products[productName] = (products[productName] || 0) + (detail.amount || 0);
      });
      return products;
    }, {});

    const sortedProducts = Object.keys(productsSold).sort((a, b) => productsSold[b] - productsSold[a]).slice(0, 5);

    y += 15;
    doc.setFontSize(10);
    doc.text('Productos más Vendidos del Día (Top 5)', 20, y);
    y += 7;

    sortedProducts.forEach((productName, index) => {
      doc.text(`${index + 1}. ${productName}: ${productsSold[productName]} unidades`, 20, y);
      y += 5;
    });

    // Exportar PDF
    const pdfBuffer = doc.output();
    res.contentType('application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=invoice-day.pdf');
    res.end(pdfBuffer, 'binary');

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Error al generar el PDF' });
  }
};

 exports.weeklySalesPdf = async (req, res) => {
    try {
        const base64Image = await getBase64FromUrl(imageUrl);

        // Obtener la fecha de inicio y fin de la semana actual
        const currentDate = moment().tz('America/Guatemala');
        const startOfWeek = currentDate.clone().startOf('week').day(1);
        const endOfWeek = currentDate.clone().endOf('week').day(7);

        // Obtener las compras realizadas durante la semana
        const purchases = await Sale.findAll({
            where: {
                createdAt: {
                    [Op.between]: [startOfWeek.toDate(), endOfWeek.toDate()],
                },
            },
        });

        // Inicializar un nuevo documento PDF
        const doc = new jsPDF();

        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        const imgWidth = 13; // Ancho de la imagen
        const imgHeight = (imgWidth * 10) / 10; // Altura de la imagen (proporción)

        const guatemalaTime = moment().tz('America/Guatemala');

        // Formateo de fecha
        const formattedDateTime = guatemalaTime.format('DD/MM/YYYY HH:mm');

        const header = () => {
            doc.setFontSize(6);
            doc.setFont("Helvetica", "normal"); // Usar Helvetica
            doc.text(`Fecha de impresión: ${formattedDateTime}`, pageWidth / 2, 8, { align: 'center' });

            if (base64Image) {
                doc.addImage(`data:image/png;base64,${base64Image}`, 'PNG', 14, 2, imgWidth, imgHeight, { align: 'left' });
            }

            doc.setFont("Helvetica", "bold"); // Usar Helvetica
            doc.setFontSize(10);
            doc.text('Tipicos Chiroy', pageWidth / 2, 12, { align: 'center' });

            doc.line(10, 15, pageWidth - 10, 15);
        }
        header();

        // Establecer el título y encabezado del informe
        doc.setFontSize(12);
        doc.setFont("Helvetica", "bold"); // Usar Helvetica
        doc.text(`Informe Semanal de Ventas`, pageWidth / 2, 23, { align: "center" });

        doc.setFontSize(12);
        doc.setFont("Helvetica", "normal"); // Usar Helvetica

        // Crear una tabla para mostrar los datos de compras
        const tableData = [];
        const tableHeaders = ['Dia', 'Total día', 'Diferencia', 'Detalles'];

        const dailyTotals = {}; // Para mantener el total de compras por día
        let previousTotal = null; // Inicializar la variable previousTotal

        purchases.forEach((purchase) => {
            const dayOfWeek = moment(purchase.createdAt).format('dddd');
            const total = purchase.total ? purchase.total.toFixed(2) : 0;

            // Actualizar el total de compras diario
            if (!dailyTotals[dayOfWeek]) {
                dailyTotals[dayOfWeek] = {
                    total: 0,
                    details: [],
                };
            }
            dailyTotals[dayOfWeek].total += purchase.total ? purchase.total : 0;
            dailyTotals[dayOfWeek].details.push(`Proforma ${purchase.bill_number}: Q. ${total}`);
        });

        // Obtener los días de la semana y ordenarlos en forma descendente
        const daysOfWeek = Object.keys(dailyTotals).sort((a, b) =>
            moment(b, 'dddd').diff(moment(a, 'dddd'))
        );

        // Revertir el orden de los días de la semana
        daysOfWeek.reverse();

        // Recorrer los días de la semana en orden descendente y construir la tabla
        for (const day of daysOfWeek) {
            const { total, details } = dailyTotals[day];
            const detailsText = details.join('\n');

            // Calcular la diferencia con el día anterior
            let difference = 0;
            if (previousTotal !== null) {
                difference = total - previousTotal;
            }
            previousTotal = total;

            tableData.push([
                day, `Q. ${total.toFixed(2)}`, `Q. ${difference}`, detailsText
            ]);
        }

        // Calcular el total de la semana
        let weeklyTotal = 0;
        for (const day of daysOfWeek) {
            weeklyTotal += dailyTotals[day].total;
        }

        // Agregar una fila para mostrar el total de la semana
        tableData.push(['', 'Total de la semana:', `Q. ${weeklyTotal.toFixed(2)}`, '']);

        // Agregar la tabla al documento
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
                  data.cell.styles.textColor = [255, 255, 255]; // Blanco
              }
              data.cell.styles.halign = 'center';
              data.cell.styles.valign = 'middle';
          },
        });

        // Guardar el archivo PDF o enviarlo como respuesta
        const pdfBuffer = doc.output();
        res.contentType('application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice-day.pdf`);
        res.end(pdfBuffer, 'binary');
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al generar el informe semanal de compras' });
    }
};


  exports.selectedweeklySalesPdf = async (req, res) => {
    try {
      const base64Image = await getBase64FromUrl(imageUrl);

      const { week, month } = req.query; // Obtén el número de semana y el número de mes del query de la solicitud

      if (!week || !month) {
        return res.status(400).json({ message: 'Debes proporcionar el número de semana y el número de mes' });
      }
      // Obtén el año actual
      const currentYear = moment().year();
  
      // Valida que el mes esté en el rango 1-12 y la semana en el rango 1-4
      if (month < 1 || month > 12 || week < 1 || week > 5) {
        return res.status(400).json({ message: 'El número de mes debe estar en el rango 1-12 y el número de semana en el rango 1-4' });
      }
      const currentDate = moment().tz('America/Guatemala');
  
      const startOfMonth = moment().year(currentYear).month(month - 1).startOf('month');
      const startOfWeek = startOfMonth.clone().add(7 * (week - 1) + 1, 'days');
      const endOfWeek = startOfWeek.clone().add(7, 'days');
  
      
      // Obtener las compras realizadas durante la semana
      const purchases = await Sale.findAll({
        where: {
          createdAt: {
            [Op.between]: [startOfWeek.toDate(), endOfWeek.toDate()],
          },
        },
      });

      // Inicializar un nuevo documento PDF
      const doc = new jsPDF();

      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const imgWidth = 13; // Ancho de la imagen
      const imgHeight = (imgWidth * 10) / 10; // Altura de la imagen (proporción)

      const guatemalaTime = moment().tz('America/Guatemala');

// Formateo de fecha
const formattedDateTime = guatemalaTime.format('DD/MM/YYYY HH:mm');
  
      const header = () => {
        doc.setFontSize(6);
        doc.text(`Fecha de impresion: ${formattedDateTime}`, pageWidth / 2, 8, { align: 'center' });
        
        if (base64Image) {
          doc.addImage(`data:image/png;base64,${base64Image}`, 'PNG', 14, 2, imgWidth, imgHeight, { align: 'left' });
      }

        doc.setFont("Helvetica", "bold");
        doc.setFontSize(10);
        doc.text('Tipicos Chiroy', pageWidth / 2, 12, { align: 'center' }); 
        doc.line(startX, 15, endX, 15);
      }

      header();
      // Establecer el título y encabezado del informe
      doc.setFontSize(12);
      // doc.text('Informe Semanal de Ventas', 10, 20);
      doc.text(`Informe Semanal de Ventas`, pageWidth / 2, 23, {align: "center",});
      doc.setFontSize(12);
  
      // Crear una tabla para mostrar los datos de compras
      const tableData = [];
      const tableHeaders = [
        // 'Fecha', 
        'Dia', 'Total día', 'Diferencia', 'Detalles'];
  
      const dailyTotals = {}; // Para mantener el total de compras por día
      let previousTotal = null; // Inicializar la variable previousTotal
  
      purchases.forEach((purchase) => {
        const dayOfWeek = moment(purchase.createdAt).format('dddd');
        const total = purchase.total ? purchase.total.toFixed(2) : 0;
  
        // Actualizar el total de compras diario
        if (!dailyTotals[dayOfWeek]) {
          dailyTotals[dayOfWeek] = {
            total: 0,
            details: [],
          };
        }
        dailyTotals[dayOfWeek].total += purchase.total ? purchase.total : 0;
        dailyTotals[dayOfWeek].details.push(`Proforma ${purchase.bill_number}: Q. ${total}`);
      });
  
      // Obtener los días de la semana y ordenarlos en forma descendente
      // const daysOfWeek = Object.keys(dailyTotals).sort((a, b) =>
      //   moment(b, 'dddd').diff(moment(a, 'dddd'))
      // );

      // Obtener los días de la semana y ordenarlos en forma descendente
      const daysOfWeek = Object.keys(dailyTotals).sort((a, b) =>
      moment(b, 'dddd').diff(moment(a, 'dddd'))
      );

      // Revertir el orden de los días de la semana
      daysOfWeek.reverse();
  
      // Recorrer los días de la semana en orden descendente y construir la tabla
      for (const day of daysOfWeek) {
        const { total, details } = dailyTotals[day];
        const formattedDate = startOfWeek.clone().day(day).format('YYYY-MM-DD');
        const detailsText = details.join('\n');
  
        // Calcular la diferencia con el día anterior
        let difference = 0;
        if (previousTotal !== null) {
          difference = total - previousTotal;
        }
        previousTotal = total;
  
        tableData.push([
          // formattedDate, 
          day, `Q. ${total.toFixed(2)}`, `Q. ${difference}`, detailsText]);
      }
  
      // Calcular el total de la semana
      let weeklyTotal = 0;
      for (const day of daysOfWeek) {
        weeklyTotal += dailyTotals[day].total;
      }
  
      // Agregar una fila para mostrar el total de la semana
      tableData.push(['', 'Total de la semana:', `Q. ${weeklyTotal.toFixed(2)}`, '', '']);
  
      // Agregar la tabla al documento
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
              data.cell.styles.textColor = [255, 255, 255]; // Blanco
          }
          data.cell.styles.halign = 'center';
          data.cell.styles.valign = 'middle';
      },
      });
  
      // Guardar el archivo PDF o enviarlo como respuesta
      const pdfBuffer = doc.output();
      res.contentType('application/pdf');
      res.setHeader('Content-Disposition',`attachment; filename=invoice-day.pdf`);
      res.end(pdfBuffer, 'binary');
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error al generar el informe semanal de compras' });
    }
  };

  exports.monthlySalePdf = async (req, res) => {
    try {
      const base64Image = await getBase64FromUrl(imageUrl);

      // Obtener la fecha de inicio y fin del mes actual
      const currentDate = moment().tz('America/Guatemala');
      const startOfMonth = currentDate.clone().startOf('month').startOf('isoWeek'); // Inicio del mes, comienza en el lunes
      const endOfMonth = currentDate.clone().endOf('month').endOf('isoWeek'); // Fin del mes, termina en el domingo
  
      // Obtener las compras realizadas durante el mes
      const purchases = await Sale.findAll({
        where: {
          createdAt: {
            [Op.between]: [startOfMonth.toDate(), endOfMonth.toDate()],
          },
        },
      });
  
      moment.locale('es');
  
      // Inicializar un nuevo documento PDF
      const doc = new jsPDF();
      // const logoUrl = ''
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const imgWidth = 13; // Ancho de la imagen
      const imgHeight = (imgWidth * 10) / 10; // Altura de la imagen (proporción)
  
      const guatemalaTime = moment().tz('America/Guatemala');

      // Formateo de fecha
      const formattedDateTime = guatemalaTime.format('DD/MM/YYYY HH:mm');

      const header1 = () => {
        doc.setFontSize(6);
        doc.text(`Fecha de impresion: ${formattedDateTime}`, pageWidth / 2, 8, { align: 'center' });
        
        if (base64Image) {
          doc.addImage(`data:image/png;base64,${base64Image}`, 'PNG', 14, 2, imgWidth, imgHeight, { align: 'left' });
      }

        doc.setFont("Helvetica", "bold");
        doc.setFontSize(10);
        doc.text('Tipicos Chiroy', pageWidth / 2, 12, { align: 'center' }); 
        doc.line(startX, 15, endX, 15);
    }
    
  
      
      // Dividir las compras por semanas
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
  
        weeklyPurchases[weekOfYear][dayOfWeek].total += purchase.total ? purchase.total: 0;
        weeklyPurchases[weekOfYear][dayOfWeek].details.push(`Factura ${purchase.bill_number}: Q. ${total}`);
      });
  
      // Obtener el número de semana y el nombre del mes para cada semana
      const weekInfo = Object.keys(weeklyPurchases).map((week) => {
        const weekNumber = parseInt(week);
        const monthName = currentDate.format('MMMM'); // Corrección aquí para usar la fecha actual (octubre)
        return {
          weekNumber,
          monthName,
        };
      });


  
      // Iterar sobre las semanas y generar una tabla por semana
      weekInfo.forEach((info, index) => {
        const { weekNumber, monthName } = info;
        const weekData = weeklyPurchases[weekNumber];
  
        const header = `Semana ${weekNumber} de ${monthName}`;
  
        const tableData = [];
        const tableHeaders = ['Dia', 'Total de ventas', 'Detalles'];
  
        // Obtener la fecha de inicio de la semana actual
        const daysInWeek = Object.keys(weekData);
  
        // Seguimiento de los días utilizados en la semana anterior
        const daysUsedInPreviousWeek = {};
  
        let startY = 35;
  
        for (let i = 0; i < daysInWeek.length; i++) {
          const dayOfWeek = daysInWeek[i];
          const { total, details } = weekData[dayOfWeek];
  
          // Verificar si el día ya se usó en la semana anterior
          if (index > 0 && daysUsedInPreviousWeek[dayOfWeek]) {
            continue; // Saltar el día si ya se utilizó en la semana anterior
          }
  
          tableData.push([dayOfWeek, `Q. ${total.toFixed(2)}`, details.join('\n')]);
  
          // Marcar el día como utilizado en la semana anterior
          if (index > 0) {
            daysUsedInPreviousWeek[dayOfWeek] = true;
          }
        }
  
        // doc.addPage(); // Agregar una página para cada semana
        // Agregar una página para cada semana, excepto la primera
        if (index > 0) {
          doc.addPage();
        }
  
        header1();
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(12);
        // doc.text('Informe Mensual de Compras', 10, 20);
        doc.text('Informe Mensual de ventas', pageWidth / 2, 20, { align: 'center' });
  
      // doc.setFontSize(12);
  
        doc.setFontSize(12);
        doc.text(header, 10, 30);
        doc.setFontSize(12);
  
       
        // didDrawPage: () => {
          
          // footer();
        // },
  
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
      });
  
      // Guardar el archivo PDF o enviarlo como respuesta
      const pdfBuffer = doc.output();
      res.contentType('application/pdf');
      res.setHeader('Content-Disposition',`attachment; filename=invoice-day.pdf`);
      res.end(pdfBuffer, 'binary');
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error al generar el informe mensual de compras' });
    }
  };

  exports.selectedmonthlySalePdf = async (req, res) => {
    try {
      const base64Image = await getBase64FromUrl(imageUrl);

      const { month } = req.query; // Obtén el número de mes del query de la solicitud

    if (!month) {
      return res.status(400).json({ message: 'Debes proporcionar el número de mes' });
    }

    const currentDate = moment().tz('America/Guatemala');

    // Obtener el año actual
    const currentYear = moment().year();

    // Validar que el mes esté en el rango 1-12
    if (month < 1 || month > 12) {
      return res.status(400).json({ message: 'El número de mes debe estar en el rango 1-12' });
    }

    // Calcular la fecha de inicio y fin del mes proporcionado
    const startOfMonth = moment().year(currentYear).month(month - 1).startOf('month').startOf('isoWeek'); // Inicio del mes, comienza en el lunes
    const endOfMonth = moment().year(currentYear).month(month - 1).endOf('month').endOf('isoWeek'); // Fin del mes, termina en el domingo

      // Obtener las compras realizadas durante el mes
      const purchases = await Sale.findAll({
        where: {
          createdAt: {
            [Op.between]: [startOfMonth.toDate(), endOfMonth.toDate()],
          },
        },
      });
  
      moment.locale('es');
  

          const guatemalaTime = moment().tz('America/Guatemala');

// Formateo de fecha
const formattedDateTime = guatemalaTime.format('DD/MM/YYYY HH:mm');
  
      // Inicializar un nuevo documento PDF
      const doc = new jsPDF();
      // const logoUrl = ''
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const imgWidth = 13; // Ancho de la imagen
      const imgHeight = (imgWidth * 10) / 10; // Altura de la imagen (proporción)
  
      const header1 = () => {
        doc.setFontSize(6);
        doc.text(`Fecha de impresion: ${formattedDateTime}`, pageWidth / 2, 8, { align: 'center' });
        
        if (base64Image) {
          doc.addImage(`data:image/png;base64,${base64Image}`, 'PNG', 14, 2, imgWidth, imgHeight, { align: 'left' });
      }
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(10);
        doc.text('Tipcios Chiroy', pageWidth / 2, 12, { align: 'center' }); 
        doc.line(startX, 15, endX, 15);
    }
    
  
      
      // Dividir las compras por semanas
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
  
      // Obtener el número de semana y el nombre del mes para cada semana
      const weekInfo = Object.keys(weeklyPurchases).map((week) => {
        const weekNumber = parseInt(week);
        const monthName = currentDate.format('MMMM'); // Corrección aquí para usar la fecha actual (octubre)
        return {
          weekNumber,
          monthName,
        };
      });


      const monthName = moment().month(month-1).format('MMMM'); 

      // Iterar sobre las semanas y generar una tabla por semana
      weekInfo.forEach((info, index) => {
        const { weekNumber} = info;
        const weekData = weeklyPurchases[weekNumber];
  
        const header = `Semana ${weekNumber} de ${monthName}`;
  
        const tableData = [];
        const tableHeaders = ['Dia', 'Total de ventas', 'Detalles'];
  
        // Obtener la fecha de inicio de la semana actual
        const daysInWeek = Object.keys(weekData);
  
        // Seguimiento de los días utilizados en la semana anterior
        const daysUsedInPreviousWeek = {};
  
        let startY = 35;
  
        for (let i = 0; i < daysInWeek.length; i++) {
          const dayOfWeek = daysInWeek[i];
          const { total, details } = weekData[dayOfWeek];
  
          // Verificar si el día ya se usó en la semana anterior
          if (index > 0 && daysUsedInPreviousWeek[dayOfWeek]) {
            continue; // Saltar el día si ya se utilizó en la semana anterior
          }
  
          tableData.push([dayOfWeek, `Q. ${total.toFixed(2)}`, details.join('\n')]);
  
          // Marcar el día como utilizado en la semana anterior
          if (index > 0) {
            daysUsedInPreviousWeek[dayOfWeek] = true;
          }
        }
  
        // doc.addPage(); // Agregar una página para cada semana
        // Agregar una página para cada semana, excepto la primera
        if (index > 0) {
          doc.addPage();
        }
  
        header1();
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(12);
        // doc.text('Informe Mensual de Compras', 10, 20);
        doc.text('Informe Mensual de ventas', pageWidth / 2, 20, { align: 'center' });
  
      // doc.setFontSize(12);
  
        doc.setFontSize(12);
        doc.text(header, 10, 30);
        doc.setFontSize(12);
  
       
        // didDrawPage: () => {
          
          // footer();
        // },
  
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
      });
  
      // Guardar el archivo PDF o enviarlo como respuesta
      // const pdfBuffer = doc.output();
      // res.setHeader('Content-Disposition', 'attachment; filename="monthly_report.pdf"');
      // res.setHeader('Content-Type', 'application/pdf');
      // res.send(pdfBuffer);


      const pdfBuffer = doc.output();
        res.contentType('application/pdf');
        res.setHeader('Content-Disposition', /*'attachment; filename=invoice.pdf'*/ `attachment; filename=monthly_report.pdf`);
        res.end(pdfBuffer, 'binary');
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error al generar el informe mensual de ventas' });
    }
  };
  
  
  