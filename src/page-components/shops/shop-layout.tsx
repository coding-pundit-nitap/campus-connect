import items from "@/components/service/whole-sale-sub-components/demo-items";
import ItemCard from "@/components/service/whole-sale-sub-components/items-card";
import ItemHeading from "@/components/service/whole-sale-sub-components/items-type-heading";

export default function WholeSale() {
  return (
    <div>
      {Object.keys(items.shopping_complex_items).map((key: string) => (
        <div key={key}>
          <ItemHeading itemType={key} />
          <div className="flex">
            {items.shopping_complex_items[key].map(
              (item: { item_id: number; item_name: string }) => (
                <ItemCard key={item.item_id} itemName={item.item_name} />
              )
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
