import { useMemo } from "react";

export type RestockItem = {
  productId: number;
  productTitle: string;
  variantId: number;
  shopifyVariantId: string;

  currentInventory: number;
  avgDailySales: number;

  approvedQty?: number;
  suggestedQty: number;
};

type Props = {
  items: RestockItem[];

  selectedItems: RestockItem[];
  onSelect: (items: RestockItem[]) => void;
};

export function RestockTable({ items, selectedItems, onSelect }: Props) {
  const selectedSet = useMemo(
    () => new Set(selectedItems.map((i) => i.variantId)),
    [selectedItems],
  );

  const toggleItem = (item: RestockItem) => {
    if (selectedSet.has(item.variantId)) {
      onSelect(selectedItems.filter((i) => i.variantId !== item.variantId));
    } else {
      onSelect([...selectedItems, item]);
    }
  };

  const updateQty = (variantId: number, qty: number) => {
    onSelect(
      selectedItems.map((i) =>
        i.variantId === variantId ? { ...i, suggestedQty: qty } : i,
      ),
    );
  };

  const totalSelectedQty = selectedItems.reduce(
    (sum, i) => sum + (i.suggestedQty ?? 0),
    0,
  );

  return (
    <>
      <s-text>
        Selected items: {selectedItems.length} | Total qty: {totalSelectedQty}
      </s-text>

      <s-table>
        <s-table-header-row>
          <s-table-header></s-table-header>
          <s-table-header>Product</s-table-header>
          <s-table-header>Variant</s-table-header>
          <s-table-header>Inventory</s-table-header>
          <s-table-header>Avg Daily Sales</s-table-header>
          <s-table-header>Suggested Qty</s-table-header>
        </s-table-header-row>

        <s-table-body>
          {items.map((item) => {
            const isSelected = selectedSet.has(item.variantId);

            return (
              <s-table-row key={item.variantId}>
                <s-table-cell>
                  <s-checkbox
                    checked={isSelected}
                    onChange={() => toggleItem(item)}
                  />
                </s-table-cell>

                <s-table-cell>{item.productTitle}</s-table-cell>
                <s-table-cell>{item.shopifyVariantId}</s-table-cell>
                <s-table-cell>{item.currentInventory}</s-table-cell>
                <s-table-cell>{item.avgDailySales.toFixed(2)}</s-table-cell>

                <s-table-cell>
                  <s-number-field
                    min={0}
                    value={String(
                      selectedItems.find((i) => i.variantId === item.variantId)
                        ?.suggestedQty ?? item.suggestedQty,
                    )}
                    disabled={!isSelected}
                    onChange={(e) =>
                      updateQty(item.variantId, Number(e.currentTarget.value))
                    }
                  />
                </s-table-cell>
              </s-table-row>
            );
          })}
        </s-table-body>
      </s-table>
    </>
  );
}
