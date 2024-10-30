// const jsPDF = require('jspdf');
const { jsPDF } = require("jspdf");

const moment = require('moment');
const { Op } = require("sequelize");
const DailyBox = require('../../../models/Daily_Box');
const MovementBox = require('../../../models/Movement_Box');
const https = require('https');

require("jspdf-autotable");

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
const imageUrl = 'https://res.cloudinary.com/dtvauhqrt/image/upload/v1729663622/LogoTipicosChiroy_dlufoe.png'; // Reemplaza esto con tu URL


exports.dailyBoxReportPdf = async (req, res) => {
  try {
    const { id } = req.params; 
    const dailyBox = await DailyBox.findByPk(id); 

    if (!dailyBox) {
      return res.status(404).json({ message: 'Caja diaria no encontrada' });
    }

    const movements = await MovementBox.findAll({
      where: {
        daily_box_id_daily_box: id,
      },
    });

    const sales = movements.filter((movement) => movement.type_movement_box_id_type_movement_box === 1);
    const purchases = movements.filter((movement) => movement.type_movement_box_id_type_movement_box === 2);

    const totalSales = sales.reduce((total, sale) => total + (sale.total ? sale.total : 0), 0);
    const totalPurchases = purchases.reduce((total, purchase) => total + (purchase.total ? purchase.total : 0), 0);

    const countSales = sales.length;
    const countPurchases = purchases.length;

    const doc = new jsPDF();

    const pageWidth = doc.internal.pageSize.width;
    const guatemalaTime = moment().tz('America/Guatemala');
    const formattedDateTime = guatemalaTime.format('DD/MM/YYYY HH:mm');

    const imgWidth = 20; // Ajusta el ancho de la imagen
    const imgHeight = (imgWidth * 10) / 10; // Mantén la proporción

    // Función de encabezado personalizado
    const header = async () => {
      // URL de la imagen

      // Convertir la imagen a base64
      const base64Image = await getBase64FromUrl(imageUrl);

      // Agregar imagen en base64 al PDF
      doc.addImage(base64Image, 'JPEG', 10, 5, imgWidth, imgHeight);

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.text('Reporte Diario de Caja - Tipicos Chiroy', pageWidth / 2, 15, { align: 'center' });

      doc.setFontSize(8);
      doc.text(`Fecha de creación: ${formattedDateTime}`, pageWidth / 2, 20, { align: 'center' });

      doc.line(10, 25, pageWidth - 10, 25); // Línea separadora
    };

    // Función de pie de página
    const footer = () => {
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.text(`Página ${doc.internal.getCurrentPageInfo().pageNumber} de ${pageCount}`, pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });
    };

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(12);
    doc.text(`Informe de Caja - ${dailyBox.createdAt ? dailyBox.createdAt : 'N/A'}`, pageWidth / 2, 30, { align: 'center' });

    // Agregar encabezado
    await header();

    // Resumen de Caja
    const cajaTableBody = [
      ['Saldo Inicial', `Q${dailyBox.initial_balance?.toFixed(2) || 0}`],
      ['Total Ventas', `Q${totalSales.toFixed(2)}`],
      ['Total Compras', `Q${totalPurchases.toFixed(2)}`],
      ['Ganancias', `Q${dailyBox.revenue?.toFixed(2) || 0}`],
      ['Saldo Neto', `Q${dailyBox.net_balance?.toFixed(2) || 0}`],
      ['Saldo Retirado', `Q${dailyBox.deliver_cash?.toFixed(2) || 0}`],
      ['Saldo Final', `Q${dailyBox.ending_balance?.toFixed(2) || 0}`]
    ];

    doc.autoTable({
      head: [['Descripción', 'Total']],
      body: cajaTableBody,
      startY: 40,
      theme: 'grid',
      margin: { top: 30 },
      styles: {
        font: 'Helvetica',
        fontSize: 10,
        cellPadding: 3,
        halign: 'center',
      },
      headStyles: {
        fillColor: [0, 51, 102], // Color azul oscuro
        textColor: [255, 255, 255], // Texto blanco
      },
    });

    // Resumen de Operaciones
    const countTableData = [
      ['Ventas', countSales],
      ['Compras', countPurchases],
    ];

    doc.text('Resumen de Operaciones', 20, doc.autoTable.previous.finalY + 10);

    doc.autoTable({
      head: [['Operación', 'Cantidad']],
      body: countTableData,
      startY: doc.autoTable.previous.finalY + 15,
      theme: 'grid',
      styles: {
        font: 'Helvetica',
        fontSize: 10,
        halign: 'center',
      },
      headStyles: {
        fillColor: [0, 51, 102],
        textColor: [255, 255, 255],
      },
    });

    // Agregar pie de página
    footer();

    const pdfBuffer = doc.output();
    res.contentType('application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=daily-box-report.pdf`);
    res.end(pdfBuffer, 'binary');
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al generar el informe en PDF' });
  }
};




exports.weeklyBoxPdf = async (req, res) => {
  try {
    // Obtener la fecha de inicio y fin de la semana actual
    const currentDate = moment().tz("America/Guatemala");
    const startOfWeek = currentDate.clone().startOf("week").day(1);
    const endOfWeek = currentDate.clone().endOf("week").day(7);

    // Consultar las compras realizadas durante la semana
    const purchases = await DailyBox.findAll({
      where: {
        createdAt: {
          [Op.between]: [startOfWeek.toDate(), endOfWeek.toDate()],
        },
      },
    });

    // Obtener la hora actual de Guatemala
    const guatemalaTime = moment().tz("America/Guatemala");
    const formattedDateTime = guatemalaTime.format("DD/MM/YYYY HH:mm");

    // Inicializar documento PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    const imgWidth = 14; // Ajusta el ancho de la imagen
    const imgHeight = (imgWidth * 10) / 10; // Mantén la proporción

      // URL de la imagen

      // Convertir la imagen a base64
      const base64Image = await getBase64FromUrl(imageUrl);

      // Agregar imagen en base64 al PDF
      doc.addImage(base64Image, 'JPEG', 10, 1, imgWidth, imgHeight);


    // Encabezado
    doc.setFontSize(6);
    doc.setFont("Helvetica");
    doc.text(`Generado el: ${formattedDateTime}`, pageWidth / 2, 8, { align: "center" });
    
    // Agregar el logotipo (opcional, comentar si no es necesario)
    // doc.addImage(logoUrl, "PNG", 14, 4, 20, (20 * 10) / 20);

    // Título
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Tipicos Chiroy", pageWidth / 2, 12, { align: "center" });
    doc.line(0, 15, pageWidth, 15);

    // Título del Informe
    doc.setFontSize(12);
    doc.text(`Informe Semanal de Caja`, pageWidth / 2, 23, { align: "center" });

    // Tabla de Datos
    const tableData = [];
    const tableHeaders = ["Día", "Total Día", "Diferencia", "Detalles"];
    const dailyTotals = {};
    let previousTotal = null;

    purchases.forEach((purchase) => {
      const dayOfWeek = moment(purchase.createdAt).format("dddd");
      const total = purchase.ending_balance ? purchase.ending_balance.toFixed(2) : 0;

      if (!dailyTotals[dayOfWeek]) {
        dailyTotals[dayOfWeek] = { total: 0, details: [] };
      }
      dailyTotals[dayOfWeek].total += purchase.ending_balance || 0;
      dailyTotals[dayOfWeek].details.push(`Caja ${purchase.id_daily_box}: Q. ${total}`);
    });

    // Ordenar los días de la semana
    const daysOfWeek = Object.keys(dailyTotals).sort((a, b) =>
      moment(b, "dddd").diff(moment(a, "dddd"))
    ).reverse();

    // Llenar los datos de la tabla
    for (const day of daysOfWeek) {
      const { total, details } = dailyTotals[day];
      const difference = previousTotal !== null ? total - previousTotal : 0;
      previousTotal = total;

      tableData.push([
        day,
        `Q. ${total.toFixed(2)}`,
        `Q. ${difference.toFixed(2)}`,
        details.join("\n"),
      ]);
    }

    // Calcular el total semanal
    const weeklyTotal = daysOfWeek.reduce((sum, day) => sum + dailyTotals[day].total, 0);
    tableData.push(["", "Total de la semana actual:", `Q. ${weeklyTotal.toFixed(2)}`, ""]);

    // Agregar la tabla al PDF con tema azul
    doc.autoTable({
      head: [tableHeaders],
      body: tableData,
      startY: 30,
      theme: "grid",
      tableLineWidth: 0.1,
      headStyles: {
        fillColor: [0, 102, 204], // Color de encabezado (azul)
        textColor: [255, 255, 255], // Texto blanco para contraste
      },
      bodyStyles: {
        fillColor: [240, 248, 255], // Color de fondo de celdas (azul claro)
        textColor: [0, 0, 0], // Texto negro
      },
      didParseCell: (data) => {
        data.cell.styles.fontSize = 10;
        data.cell.styles.font = 'Helvetica';
        data.cell.styles.halign = "center";
        data.cell.styles.valign = "middle";
      },
    });

    // Generar el PDF y enviar la respuesta
    const pdfBuffer = doc.output();
    res.contentType("application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=weekly_report.pdf`);
    res.end(pdfBuffer, "binary");

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al generar el informe semanal de caja" });
  }
};



exports.selectedweeklyBoxPdf = async (req, res) => {
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

    const purchases = await DailyBox.findAll({
      where: {
        createdAt: {
          [Op.between]: [startOfWeek.toDate(), endOfWeek.toDate()],
        },
      },
    });

    const guatemalaTime = moment().tz("America/Guatemala");
    const formattedDateTime = guatemalaTime.format("DD/MM/YYYY HH:mm");
    console.log(formattedDateTime);

    const doc = new jsPDF();
  
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
  
    const imgWidth = 14; // Ajusta el ancho de la imagen
    const imgHeight = (imgWidth * 10) / 10; // Mantén la proporción

      // URL de la imagen

      // Convertir la imagen a base64
      const base64Image = await getBase64FromUrl(imageUrl);

      // Agregar imagen en base64 al PDF
      doc.addImage(base64Image, 'JPEG', 10, 1, imgWidth, imgHeight);



    doc.setFontSize(6);
    doc.text(`Generado el: ${formattedDateTime}`, pageWidth / 2, 8, { align: "center" });

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Tipicos Chiroy", pageWidth / 2, 12, { align: "center" });
  
    doc.line(0, 15, pageWidth, 15);

    doc.setFontSize(12);
    doc.text(`Informe Semanal de Caja`, pageWidth / 2, 23, { align: "center" });

    doc.setFontSize(12);

    const tableData = [];
    const tableHeaders = [
      "Dia",
      "Total día",
      "Diferencia",
      "Detalles",
    ];

    const dailyTotals = {};
    let previousTotal = null;

    purchases.forEach((purchase) => {
      const dayOfWeek = moment(purchase.createdAt).format("dddd");
      const total = purchase.ending_balance ? purchase.ending_balance.toFixed(2) : 0;

      if (!dailyTotals[dayOfWeek]) {
        dailyTotals[dayOfWeek] = {
          total: 0,
          details: [],
        };
      }
      dailyTotals[dayOfWeek].total += purchase.ending_balance ? purchase.ending_balance : 0;
      dailyTotals[dayOfWeek].details.push(`Caja ${purchase.id_daily_box}: Q. ${total}`);
    });

    const daysOfWeek = Object.keys(dailyTotals).sort((a, b) => moment(b, "dddd").diff(moment(a, "dddd")));
    daysOfWeek.reverse();

    for (const day of daysOfWeek) {
      const { total, details } = dailyTotals[day];
      const formattedDate = startOfWeek.clone().day(day).format("YYYY-MM-DD");
      const detailsText = details.join("\n");

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
    for (const day of daysOfWeek) {
      weeklyTotal += dailyTotals[day].total;
    }

    tableData.push([
      "",
      "Total de la semana actual:",
      `Q. ${weeklyTotal.toFixed(2)}`,
      "",
    ]);


        // Agregar la tabla al PDF con tema azul
        doc.autoTable({
          head: [tableHeaders],
          body: tableData,
          startY: 30,
          theme: "grid",
          tableLineWidth: 0.1,
          headStyles: {
            fillColor: [0, 102, 204], // Color de encabezado (azul)
            textColor: [255, 255, 255], // Texto blanco para contraste
          },
          bodyStyles: {
            fillColor: [240, 248, 255], // Color de fondo de celdas (azul claro)
            textColor: [0, 0, 0], // Texto negro
          },
          didParseCell: (data) => {
            data.cell.styles.fontSize = 10;
            data.cell.styles.font = 'Helvetica';
            data.cell.styles.halign = "center";
            data.cell.styles.valign = "middle";
          },
        });
    

    const pdfBuffer = doc.output();
    res.contentType("application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-day.pdf`
    );
    res.end(pdfBuffer, "binary");
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al generar el informe semanal de compras" });
  }
};


exports.monthlyBoxPdf = async (req, res) => {
  try {
    // Obtener la fecha de inicio y fin del mes actual
    const currentDate = moment().tz('America/Guatemala');
    const startOfMonth = currentDate.clone().startOf('month').startOf('isoWeek'); // Inicio del mes, comienza en el lunes
    const endOfMonth = currentDate.clone().endOf('month').endOf('isoWeek'); // Fin del mes, termina en el domingo

    // Obtener las compras realizadas durante el mes
    const purchases = await DailyBox.findAll({
      where: {
        createdAt: {
          [Op.between]: [startOfMonth.toDate(), endOfMonth.toDate()],
        },
      },
    });

    moment.locale('es');

    const guatemalaTime = moment().tz("America/Guatemala");

    // Formateo de fecha
    const formattedDateTime = guatemalaTime.format("DD/MM/YYYY HH:mm");
    console.log(formattedDateTime);

    // Inicializar un nuevo documento PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

      const imgWidth = 14; // Ajusta el ancho de la imagen
    const imgHeight = (imgWidth * 10) / 10; // Mantén la proporción

  
      // URL de la imagen

  
    const header1 = async () => {
     
            // Convertir la imagen a base64
      const base64Image = await getBase64FromUrl(imageUrl);

      // Agregar imagen en base64 al PDF
      doc.addImage(base64Image, 'JPEG', 10, 1, imgWidth, imgHeight);
  
      doc.setFontSize(6);
      doc.text(`Fecha de impresion: ${formattedDateTime}`, pageWidth / 2, 8, { align: 'center' });

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.text('Tipicos Chiroy', pageWidth / 2, 12, { align: 'center' });
      doc.line(0, 15, pageWidth, 15);
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
      const total = purchase.ending_balance ? purchase.ending_balance : 0;
      const ganancia = purchase.revenue ? purchase.revenue : 0;

      if (!weeklyPurchases[weekOfYear][dayOfWeek]) {
        weeklyPurchases[weekOfYear][dayOfWeek] = {
          fecha: null,
          saldoInicial: 0,
          ingresos: 0,
          egresos: 0,
          gastos: 0,
          retirado: 0,
          saldoBruto: 0,
          saldoNeto: 0,
          total: 0,
          ganancia: 0,
        };
      }

      weeklyPurchases[weekOfYear][dayOfWeek].fecha = purchase.createdAt ? purchase.createdAt : 'N/A';
      weeklyPurchases[weekOfYear][dayOfWeek].saldoInicial = purchase.initial_balance ? purchase.initial_balance : 0;
      weeklyPurchases[weekOfYear][dayOfWeek].ingresos = purchase.effective_income ? purchase.effective_income : 0;
      weeklyPurchases[weekOfYear][dayOfWeek].egresos = purchase.effective_expenditure ? purchase.effective_expenditure : 0;
      weeklyPurchases[weekOfYear][dayOfWeek].gastos = purchase.effective_bill ? purchase.effective_bill : 0;
      weeklyPurchases[weekOfYear][dayOfWeek].retirado = purchase.deliver_cash ? purchase.deliver_cash : 0;
      weeklyPurchases[weekOfYear][dayOfWeek].saldoBruto = purchase.effective_income ? purchase.effective_income : 0;
      weeklyPurchases[weekOfYear][dayOfWeek].saldoNeto = purchase.net_balance ? purchase.net_balance : 0;
      weeklyPurchases[weekOfYear][dayOfWeek].total = purchase.ending_balance ? purchase.ending_balance : 0;
      weeklyPurchases[weekOfYear][dayOfWeek].ganancia = purchase.revenue ? purchase.revenue : 0;
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
    for (const [index, info] of weekInfo.entries()) {
      const { weekNumber, monthName } = info;
      const weekData = weeklyPurchases[weekNumber];

      const header = `Semana ${weekNumber} de ${monthName}`;
      const tableData = [];
      const tableHeaders = ['Fecha','Dia', 'S Inicial', 'Ventas', 'Compras', 'Gastos', 'Retirado', 'S. Bruto', 'S. Neto', 'S Final'];

      // Obtener la fecha de inicio de la semana actual
      const daysInWeek = Object.keys(weekData);

      let startY = 35;

      for (let i = 0; i < daysInWeek.length; i++) {
        const dayOfWeek = daysInWeek[i];
        const { fecha,
          saldoInicial,
          ingresos,
          egresos,
          gastos,
          retirado,
          saldoBruto,
          saldoNeto, total, ganancia } = weekData[dayOfWeek];

        tableData.push([
          fecha,
          dayOfWeek, 
          `Q. ${saldoInicial ? saldoInicial.toFixed(2) : 0}`, 
          `Q. ${ingresos ? ingresos.toFixed(2) : 0}`, 
          `Q. ${egresos ? egresos.toFixed(2) : 0}`, 
          `Q. ${gastos ? gastos.toFixed(2) : 0}`, 
          `Q. ${retirado ? retirado.toFixed(2) : 0}`, 
          `Q. ${saldoBruto ? saldoBruto.toFixed(2) : 0}`, 
          `Q. ${saldoNeto ? saldoNeto.toFixed(2) : 0}`, 
          `Q. ${total ? total.toFixed(2) : 0}`, 
          `Q. ${ganancia ? ganancia.toFixed(2) : 0}`, 
        ]);
      }

      // Agregar una página para cada semana, excepto la primera
      if (index > 0) {
        doc.addPage();
      }

      // Esperar a que se complete el encabezado
      await header1();
      
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(12);
      doc.text('Informe Mensual de Caja', pageWidth / 2, 20, { align: 'center' });

      doc.setFontSize(12);
      doc.text(header, 10, 30);

      doc.autoTable({
        head: [tableHeaders],
        body: tableData,
        startY,
        theme: 'grid',
        tableLineWidth: 0.1,
        headStyles: {
          fillColor: [0, 102, 204], // Color de encabezado (azul)
          textColor: [255, 255, 255], // Texto blanco para contraste
        },
        bodyStyles: {
          fillColor: [240, 248, 255], // Color de fondo de celdas (azul claro)
          textColor: [0, 0, 0], // Texto negro
        },
        didParseCell: (data) => {
          data.cell.styles.fontSize = 8;
          data.cell.styles.font = 'Helvetica';
          data.cell.styles.halign = "center";
          data.cell.styles.valign = "middle";
        },
      });
    }

    const pdfBuffer = doc.output();
    res.contentType("application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=invoice-day.pdf`);
    res.end(pdfBuffer, "binary");
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al generar el informe mensual de compras' });
  }
};



exports.selectedmonthlyBoxPdf = async (req, res) => {
  try {
    const { month } = req.query; // Obtén el número de mes del query de la solicitud

    const currentDate = moment().tz('America/Guatemala');

    // Obtener el año actual
    const currentYear = moment().year();

    // Calcular la fecha de inicio y fin del mes proporcionado
    const startOfMonth = moment().year(currentYear).month(month - 1).startOf('month').startOf('isoWeek'); // Inicio del mes, comienza en el lunes
    const endOfMonth = moment().year(currentYear).month(month - 1).endOf('month').endOf('isoWeek'); // Fin del mes, termina en el domingo

    // Obtener las compras realizadas durante el mes
    const purchases = await DailyBox.findAll({
      where: {
        createdAt: {
          [Op.between]: [startOfMonth.toDate(), endOfMonth.toDate()],
        },
      },
    });

    moment.locale('es');
    const guatemalaTime = moment().tz("America/Guatemala");
    const formattedDateTime = guatemalaTime.format("DD/MM/YYYY HH:mm");

    // Inicializar un nuevo documento PDF
    const doc = new jsPDF();

    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const imgWidth = 14; // Ajusta el ancho de la imagen
    const imgHeight = (imgWidth * 10) / 10; // Mantén la proporción

  
    const header1 = async () => {

              // Convertir la imagen a base64
        const base64Image = await getBase64FromUrl(imageUrl);
  
        // Agregar imagen en base64 al PDF
        doc.addImage(base64Image, 'JPEG', 10, 1, imgWidth, imgHeight);
  
        
      doc.setFontSize(6);
      doc.text(`Fecha de impresion: ${formattedDateTime}`, pageWidth / 2, 8, { align: 'center' });

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.text('Tipicos Chiroy', pageWidth / 2, 12, { align: 'center' });
      doc.line(0, 15, pageWidth, 15);
    };

    // Dividir las compras por semanas
    const weeklyPurchases = {};
    purchases.forEach((purchase) => {
      const weekOfYear = moment(purchase.createdAt).isoWeek();
      if (!weeklyPurchases[weekOfYear]) {
        weeklyPurchases[weekOfYear] = {};
      }

      const purchaseDate = moment(purchase.createdAt);
      const dayOfWeek = purchaseDate.format('dddd');

      if (!weeklyPurchases[weekOfYear][dayOfWeek]) {
        weeklyPurchases[weekOfYear][dayOfWeek] = {
          fecha: null,
          saldoInicial: 0,
          ingresos: 0,
          egresos: 0,
          gastos: 0,
          retirado: 0,
          saldoBruto: 0,
          saldoNeto: 0,
          total: 0,
          ganancia: 0,
        };
      }

      weeklyPurchases[weekOfYear][dayOfWeek].fecha = purchase.createdAt ? purchase.createdAt : 'N/A';
      weeklyPurchases[weekOfYear][dayOfWeek].saldoInicial = purchase.initial_balance ? purchase.initial_balance : 0;
      weeklyPurchases[weekOfYear][dayOfWeek].ingresos = purchase.effective_income ? purchase.effective_income : 0;
      weeklyPurchases[weekOfYear][dayOfWeek].egresos = purchase.effective_expenditure ? purchase.effective_expenditure : 0;
      weeklyPurchases[weekOfYear][dayOfWeek].gastos = purchase.effective_bill ? purchase.effective_bill : 0;
      weeklyPurchases[weekOfYear][dayOfWeek].retirado = purchase.deliver_cash ? purchase.deliver_cash : 0;
      weeklyPurchases[weekOfYear][dayOfWeek].saldoBruto = purchase.effective_income ? purchase.effective_income : 0;
      weeklyPurchases[weekOfYear][dayOfWeek].saldoNeto = purchase.net_balance ? purchase.net_balance : 0;
      weeklyPurchases[weekOfYear][dayOfWeek].total = purchase.ending_balance ? purchase.ending_balance : 0;
      weeklyPurchases[weekOfYear][dayOfWeek].ganancia = purchase.revenue ? purchase.revenue : 0;
    });

    // Obtener el número de semana y el nombre del mes para cada semana
    const weekInfo = Object.keys(weeklyPurchases).map((week) => {
      const weekNumber = parseInt(week);
      const monthName = currentDate.format('MMMM');
      return {
        weekNumber,
        monthName,
      };
    });

    const monthName = moment().month(month - 1).format('MMMM');
    
    // Iterar sobre las semanas y generar una tabla por semana
    for (const [index, info] of weekInfo.entries()) {
      const { weekNumber } = info;
      const weekData = weeklyPurchases[weekNumber];
    
      const header = `Semana ${weekNumber} de ${monthName}`;
      const tableData = [];
      const tableHeaders = ['Fecha', 'Dia', 'S Inicial', 'Ventas', 'Compras', 'Gastos', 'Retirado', 'S. Bruto', 'S. Neto', 'S Final'];
    
      const daysInWeek = Object.keys(weekData);
      const daysUsedInPreviousWeek = {};
      let startY = 35;
    
      for (let i = 0; i < daysInWeek.length; i++) {
        const dayOfWeek = daysInWeek[i];
        const { fecha, saldoInicial, ingresos, egresos, gastos, retirado, saldoBruto, saldoNeto, total, ganancia } = weekData[dayOfWeek];
    
        if (index > 0 && daysUsedInPreviousWeek[dayOfWeek]) {
          continue; // Saltar el día si ya se utilizó en la semana anterior
        }
    
        tableData.push([
          fecha,
          dayOfWeek,
          `Q. ${saldoInicial ? saldoInicial.toFixed(2) : 0}`,
          `Q. ${ingresos ? ingresos.toFixed(2) : 0}`,
          `Q. ${egresos ? egresos.toFixed(2) : 0}`,
          `Q. ${gastos ? gastos.toFixed(2) : 0}`,
          `Q. ${retirado ? retirado.toFixed(2) : 0}`,
          `Q. ${saldoBruto ? saldoBruto.toFixed(2) : 0}`,
          `Q. ${saldoNeto ? saldoNeto.toFixed(2) : 0}`,
          `Q. ${total ? total.toFixed(2) : 0}`,
          `Q. ${ganancia ? ganancia.toFixed(2) : 0}`,
        ]);
    
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
      doc.text('Informe Mensual de Caja', pageWidth / 2, 20, { align: 'center' });
    
      doc.setFontSize(12);
      doc.text(header, 10, 30);
    
      doc.autoTable({
        head: [tableHeaders],
        body: tableData,
        startY,
        theme: 'grid',
        tableLineWidth: 0.1,
        tableWidth: 'auto',
        headStyles: {
          fillColor: [0, 102, 204], // Color azul para el encabezado
          textColor: [255, 255, 255], // Texto en blanco
          fontSize: 10,
          font: 'Helvetica',
        },
        didParseCell: (data) => {
          data.cell.styles.fontSize = 8;
          data.cell.styles.font = 'Helvetica'; // Cambiar la fuente a Helvetica
          data.cell.styles.halign = 'center';
          data.cell.styles.valign = 'middle';
        },
      });
    }
    

    const pdfBuffer = doc.output();
    res.contentType("application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=invoice-day.pdf`);
    res.end(pdfBuffer, "binary");
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al generar el informe mensual de compras' });
  }
};




