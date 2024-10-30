const CategoryProvides = require('../../../models/Category_Providers')
const Shopping = require('../../../models/Shopping');
const Provider = require('../../../models/Providers');
const DetailShopping = require('../../../models/DetailShopping');
const Product = require('../../../models/Product');
// require('')
const { Category } = require('../../../models/Categories');
const { jsPDF } = require('jspdf');

require('jspdf-autotable');

// Leer la imagen del disco duro

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

exports.generatePDFInvoice = async (req, res) => {
  try {
      const { id } = req.params;
      const filename = req.params.filename;

      // URL de la imagen en Cloudinary

      // Obtener la imagen como base64
      const base64Image = await getBase64FromUrl(imageUrl);

      const purchase = await Shopping.findOne({
          where: {
              id_shopping: id,
          },
          include: [
              {
                  model: Provider,
                  include: [{
                      model: CategoryProvides
                  }]
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

      if (!purchase) {
          return res.status(404).json({
              message: 'Compra no encontrada',
          });
      }

      var doc = new jsPDF();

      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const imgWidth = 13;
      const imgHeight = (imgWidth * 10) / 10;

      // Define header function
      const header = () => {
          try {
              doc.setFontSize(6);
              doc.text(`Fecha de impresión: ${new Date().toLocaleDateString('es-ES')}`, pageWidth / 2, 8, { align: 'center' });

              // Agregar el logotipo solo si tenemos la imagen
              if (base64Image) {
                  doc.addImage(`data:image/png;base64,${base64Image}`, 'PNG', 14, 2, imgWidth, imgHeight, { align: 'left' });
              }

              doc.setFont("Helvetica", "bold"); // Cambiar a Helvetica
              doc.setFontSize(10);
              doc.text('Tipicos Chiroy', pageWidth / 2, 12, { align: 'center' });

              doc.setFont("Helvetica", "normal"); // Cambiar a Helvetica
              doc.setFontSize(8);
              doc.text(`Factura No. ${purchase.bill_number}`, doc.internal.pageSize.width - 20, 12, { align: 'right' });

              doc.line(0, 15, pageWidth, 15);
          } catch (error) {
              console.error('Error en el header:', error);
          }
      }

      // Llamar al header inicialmente
      header();

      doc.setFont("Helvetica", "bold"); // Cambiar a Helvetica
      doc.setFontSize(10);
      const date = new Date(purchase.createdAt);
      const formattedDate = date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

      doc.text('Detalles de Compra', pageWidth / 2, 20, { align: 'center' });

      doc.setFont("Helvetica", "normal"); // Cambiar a Helvetica
      doc.setFontSize(10);
      doc.text(`Fecha Registro ${formattedDate}`, doc.internal.pageSize.width - 20, 20, { align: 'right' });

      // Corregir el acceso a CategoryProvides
      const providerCategory = purchase?.Provider?.CategoryProvider?.name || 'NI';
      doc.text(`Categorias Proveedor: ${providerCategory}`, 14, 26);
      doc.text(`Trabajador Proveedor: ${purchase?.Provider?.name || 'NI'}`, 14, 32);
      doc.text(`NIT: ${purchase?.Provider?.nit || 'NI'}`, 14, 38);
      doc.text(`Telefono ${purchase?.Provider?.phone || 'NI'}`, doc.internal.pageSize.width - 20, 32, { align: 'right' });

      const columns = ['Codigo', 'Producto', 'Categoría', 'Cantidad', 'Precio Compra U', 'Subtotal'];

      // Preparar los datos de la tabla
      const tableData = purchase.DetailShoppings.map((detail) => {
          const product = detail.Product || {};
          const category = product.Category ? product.Category.type : 'No tiene datos';
          return [
              String(product.code_product || '0'),
              String(product.name || 'NA'),
              String(category || 'NA'),
              String(detail.amount || '0'),
              `Q${(detail.purchase_price || 0).toFixed(2)}`,
              `Q${(detail.subtotal || 0).toFixed(2)}`
          ];
      });

      const tableOptions = {
          startY: 45,
          head: [columns],
          body: tableData,
          didDrawPage: function() {
              header(); // Llamar al header en cada página nueva
          },
          theme: 'grid',
          tableLineWidth: 0.1,
          tableWidth: 'auto',
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

      const tableWidth = tableOptions.head[0].length * 30;
      const marginLeft = (doc.internal.pageSize.width - tableWidth) / 2;
      tableOptions.margin.left = marginLeft;

      doc.autoTable(tableOptions);

      const totalAmount = purchase.total.toFixed(2);
      doc.text(`Total: Q${totalAmount}`, doc.internal.pageSize.width - 20, doc.autoTable.previous.finalY + 10, { align: 'right' });

      const pdfBuffer = doc.output();
      res.contentType('application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=invoice-${filename}.pdf`);
      res.end(pdfBuffer, 'binary');
  } catch (error) {
      console.error(error);
      res.status(500).json({
          message: 'Error al generar la factura',
          error: error.message
      });
  }
};


  