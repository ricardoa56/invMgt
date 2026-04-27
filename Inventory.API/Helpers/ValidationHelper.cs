namespace Inventory.API.Helpers
{
    public static class ValidationHelper
    {
        public static bool IsValidId(int id)
        {
            return id > 0;
        }

        public static bool IsPositive(decimal value)
        {
            return value > 0;
        }

        // Add more validation methods as needed
    }
}