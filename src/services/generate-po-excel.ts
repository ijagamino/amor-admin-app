import ExcelJS from "exceljs";

type Item = {
  productId: number;
  productTitle: string;
  variantId: number;
  shopifyVariantId: string;

  approvedQty: number;
};

export async function generatePurchaseOrderExcel(items: Item[]) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Purchase Order");

  sheet.columns = [
    { header: "Product", key: "productTitle", width: 30 },
    { header: "Order Qty", key: "approvedQty", width: 15 },
  ];

  items.forEach((item) => {
    sheet.addRow({
      productTitle: item.productTitle,
      approvedQty: item.approvedQty,
    });
  });

  sheet.getRow(1).font = { bold: true };

  // Auto filter
  sheet.autoFilter = "A1:B1";

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}
