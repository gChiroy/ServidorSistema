const { Brand, Category } = require("../../../models/Categories");
const Customer = require("../../../models/Customers");
const DetailSale = require("../../../models/DetailSales");
const InventoryProduct = require("../../../models/InventoryProducts");
const Product = require("../../../models/Product");
const Sale = require("../../../models/Sales");
const moment = require('moment');
const { jsPDF } = require('jspdf');
require('jspdf-autotable');
// const numberToWords = require('number-to-words');



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

// Calcula el inicio y fin de la línea en función de los márgenes
const startX = marginLeft;
const endX = 210 - marginRight;



exports.generatePDFProforma = async (req, res) => {
  try {
      const { id } = req.params;
      const base64Image = await getBase64FromUrl(imageUrl);

      const purchase = await Sale.findOne({
          where: { id_sales: id },
          include: [
              {
                  model: Customer,
              },
              {
                  model: DetailSale,
                  include: [
                      {
                          model: InventoryProduct,
                          include: [
                              {
                                  model: Product,
                                  include: [{ model: Category }]
                              }
                          ]
                      }
                  ]
              }
          ],
      });

      if (!purchase) {
          return res.status(404).json({
              message: 'Venta no encontrada',
          });
      }

      var doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const imgWidth = 13;
      const imgHeight = (imgWidth * 10) / 10;
      const guatemalaTime = moment().tz('America/Guatemala');
      const formattedDateTime = guatemalaTime.format('DD/MM/YYYY HH:mm');

      const header = () => {
          doc.setFontSize(6);
          doc.text(`Fecha de impresión: ${formattedDateTime}`, pageWidth / 2, 4, { align: 'center' });

          if (base64Image) {
              doc.addImage(`data:image/png;base64,${base64Image}`, 'PNG', 14, 2, imgWidth, imgHeight, { align: 'left' });
          }

          doc.setFont("Helvetica", "bold");
          doc.setFontSize(12);
          doc.text('Tipicos Chiroy', pageWidth / 2, 11, { align: 'center' });

          doc.setFont("Helvetica", "normal");
          doc.setFontSize(8);
          doc.text(`Factura No. ${purchase.bill_number}`, doc.internal.pageSize.width - 20, 12, { align: 'right' });

          doc.line(startX, 15, endX, 15);
      }

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(11);
      const date = new Date(purchase.createdAt);
      const formattedDate = date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

      doc.text('Detalles de su Venta', pageWidth / 2, 20, { align: 'center' });

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.text(`Fecha de Registro ${formattedDate}`, doc.internal.pageSize.width - 20, 20, { align: 'right' });
      doc.setFontSize(10);
      doc.text(`Cliente: ${purchase?.Customer ? purchase.Customer.name : 'NI'}`, 14, 26);
      doc.text(`Direccion: ${purchase?.Customer ? purchase.Customer.address : 'NI'} `, 14, 32)
      doc.text(`NIT: ${purchase?.Customer ? purchase.Customer.nit : 'NI'} `, 14, 38)
      doc.text(`Telefono ${purchase?.Customer ? purchase.Customer.phone : 'NI'}`, doc.internal.pageSize.width - 20, 26, { align: 'right' });

      const columns = ['Codigo', 'Producto', 'Categoría', 'Cantidad', 'Precio Venta U', 'Subtotal'];

      const tableOptions = {
          startY: 45,
          head: [columns],
          body: purchase.DetailSales.map((detail) => {
              const product = detail.inventory_product?.Product;
              const category = product?.category ? product.category.type : 'No tiene datos';
              return [
                  `${product?.code_product ? product.code_product : 0}`,
                  `${product?.name ? product.name : 'NA'}`,
                  `${category}`,
                  `${detail?.amount ? detail.amount : 0}`,
                  `Q${detail?.price_inv_prod ? detail.price_inv_prod.toFixed(2) : 0}`,
                  `Q${detail?.subtotal ? detail.subtotal.toFixed(2) : 0}`,
              ];
          }),
          didDrawPage: () => {
              header();
          },
          theme: 'grid',
          tableLineWidth: 0.1,
          tableWidth: 'wrap',
          margin: { top: 60 },
          didParseCell: (data) => {
              data.cell.styles.fontSize = 9;
              data.cell.styles.font = 'Helvetica';
              if (data.row.index === 0 && columns.includes(data.cell.raw.toString())) {
                  data.cell.styles.fillColor = [0, 51, 102]; // Azul oscuro
                  data.cell.styles.textColor = [255, 255, 255]; // Blanco
              }
              data.cell.styles.halign = 'center';
              data.cell.styles.valign = 'middle';
          },
      };

      const tableWidth = tableOptions.head[0].length * 20;
      const marginLeft = (doc.internal.pageSize.width - tableWidth) / 2;
      tableOptions.margin.left = marginLeft;

      doc.autoTable(tableOptions);
      let totalAmount = purchase.total ? purchase.total.toFixed(2) : 0;

      doc.text(`Total: Q${totalAmount}`, doc.internal.pageSize.width - 20, doc.autoTable.previous.finalY + 10, { align: 'right' });

      doc.setFontSize(8);
      doc.text('Centro Comercial Municipal, Sololá ', pageWidth / 2, doc.autoTable.previous.finalY + 15, { align: 'center' });
      doc.text('Cel. 4566-0530', pageWidth / 2, doc.autoTable.previous.finalY + 18, { align: 'center' });

      const pdfBuffer = doc.output();
      res.setHeader('Content-Disposition', `attachment; filename=proforma${purchase.proforma_number}.pdf`);
      res.setHeader('Content-Type', 'application/pdf');

      res.end(pdfBuffer, 'binary');

  } catch (error) {
      console.error(error);
      res.status(500).json({
          message: 'Error al generar la factura',
      });
  }
};




  
 