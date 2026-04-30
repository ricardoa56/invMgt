export interface DDProduct {
  id: number;
  name: string;
  quantity: number;
  sellingPrice: number;
}

//this is intended for dropdown list, to avoid unnecessary data transfer of the whole product details when only id and name are needed.