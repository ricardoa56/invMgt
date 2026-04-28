namespace Inventory.Contract
{
    public class GetProductResponse
    {
        public List<ProductResponse> Products { get; set; } = new List<ProductResponse>();
    }   

}
