import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

const mockProducts = [
  {
    id: "1",
    name_es: "Baklava de Pistacho Premium",
    name_en: "Premium Pistachio Baklava",
    description_es: "Exquisita baklava rellena con pistachos de la mejor calidad",
    description_en: "Exquisite baklava filled with the finest quality pistachios",
    long_description_es:
      "Nuestra baklava de pistacho premium está elaborada con las mejores nueces de pistacho importadas, capas de hojaldre crujiente y miel natural. Cada pieza es cuidadosamente preparada por nuestros maestros pasteleros siguiendo recetas tradicionales que han sido perfeccionadas durante generaciones.",
    long_description_en:
      "Our premium pistachio baklava is crafted with the finest imported pistachio nuts, layers of crispy phyllo pastry, and natural honey. Each piece is carefully prepared by our master pastry chefs following traditional recipes that have been perfected over generations.",
    ingredients_es: "Pistachos (45%), masa filo, azúcar, miel natural, mantequilla clarificada, agua de rosas",
    ingredients_en: "Pistachios (45%), phyllo dough, sugar, natural honey, clarified butter, rose water",
    shelf_life_es: "30 días en refrigeración, 90 días congelado",
    shelf_life_en: "30 days refrigerated, 90 days frozen",
    storage_es: "Conservar en lugar fresco y seco. Una vez abierto, refrigerar.",
    storage_en: "Store in a cool, dry place. Once opened, refrigerate.",
    packaging_es: "Cajas de 1kg, 2kg, 5kg y 10kg. Empaquetado al vacío disponible.",
    packaging_en: "Boxes of 1kg, 2kg, 5kg and 10kg. Vacuum packaging available.",
    price: 28.99,
    unit: "kg",
    min_order_quantity: 5,
    image_url: "/premium-baklava-dessert-close-up-honey-golden.jpg",
    category: "Pistacho",
  },
  {
    id: "2",
    name_es: "Baklava de Nuez Clásica",
    name_en: "Classic Walnut Baklava",
    description_es: "Baklava tradicional con nueces de alta calidad",
    description_en: "Traditional baklava with high-quality walnuts",
    long_description_es:
      "La baklava de nuez clásica es nuestra receta más tradicional. Elaborada con nueces frescas seleccionadas, masa filo crujiente y un almíbar dulce que la hace irresistible. Perfecta para quienes aprecian los sabores auténticos.",
    long_description_en:
      "Classic walnut baklava is our most traditional recipe. Made with selected fresh walnuts, crispy phyllo dough, and a sweet syrup that makes it irresistible. Perfect for those who appreciate authentic flavors.",
    ingredients_es: "Nueces (40%), masa filo, azúcar, miel, mantequilla, canela",
    ingredients_en: "Walnuts (40%), phyllo dough, sugar, honey, butter, cinnamon",
    shelf_life_es: "30 días en refrigeración, 90 días congelado",
    shelf_life_en: "30 days refrigerated, 90 days frozen",
    storage_es: "Conservar en lugar fresco y seco. Una vez abierto, refrigerar.",
    storage_en: "Store in a cool, dry place. Once opened, refrigerate.",
    packaging_es: "Cajas de 1kg, 2kg, 5kg y 10kg",
    packaging_en: "Boxes of 1kg, 2kg, 5kg and 10kg",
    price: 24.99,
    unit: "kg",
    min_order_quantity: 5,
    image_url: "/premium-baklava-dessert-close-up-honey-golden.jpg",
    category: "Nuez",
  },
  {
    id: "3",
    name_es: "Baklava Mixta Surtida",
    name_en: "Mixed Assorted Baklava",
    description_es: "Variedad de baklavas con diferentes rellenos",
    description_en: "Variety of baklavas with different fillings",
    long_description_es:
      "Una selección cuidadosamente curada de nuestras mejores baklavas. Incluye pistacho, nuez, almendra y avellana. Ideal para ofrecer variedad a sus clientes y probar diferentes sabores.",
    long_description_en:
      "A carefully curated selection of our finest baklavas. Includes pistachio, walnut, almond, and hazelnut. Ideal for offering variety to your customers and trying different flavors.",
    ingredients_es: "Frutos secos variados (45%), masa filo, azúcar, miel, mantequilla",
    ingredients_en: "Mixed nuts (45%), phyllo dough, sugar, honey, butter",
    shelf_life_es: "30 días en refrigeración, 90 días congelado",
    shelf_life_en: "30 days refrigerated, 90 days frozen",
    storage_es: "Conservar en lugar fresco y seco. Una vez abierto, refrigerar.",
    storage_en: "Store in a cool, dry place. Once opened, refrigerate.",
    packaging_es: "Cajas surtidas de 2kg, 5kg y 10kg",
    packaging_en: "Assorted boxes of 2kg, 5kg and 10kg",
    price: 26.99,
    unit: "kg",
    min_order_quantity: 5,
    image_url: "/premium-baklava-dessert-close-up-honey-golden.jpg",
    category: "Mixta",
  },
]

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    try {
      const product = await db.products.findById(id)
      if (product) {
        return NextResponse.json(product)
      }
    } catch (dbError) {
      console.log("[v0] Database not available, using mock data")
    }

    const product = mockProducts.find((p) => p.id === id)

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error: any) {
    console.error("[v0] Get product error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
