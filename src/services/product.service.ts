import { Product } from "@prisma/client";

import { productRepository } from "@/repositories";
import {
  CreateProductDto,
  UpdateProductDto,
} from "@/repositories/product.repository";

class ProductService {
  async createProduct(data: CreateProductDto): Promise<Product> {
    return productRepository.create(data);
  }

  async updateProduct(
    product_id: string,
    data: UpdateProductDto
  ): Promise<Product | null> {
    return productRepository.update(product_id, data);
  }

  async deleteProduct(product_id: string): Promise<Product | null> {
    return productRepository.delete(product_id);
  }

  async getProductById(product_id: string): Promise<Product | null> {
    return productRepository.findById(product_id);
  }

  async getProductsByShopId(shop_id: string): Promise<Product[]> {
    return productRepository.findManyByShopId(shop_id);
  }
}

export const productService = new ProductService();
export default productService;
