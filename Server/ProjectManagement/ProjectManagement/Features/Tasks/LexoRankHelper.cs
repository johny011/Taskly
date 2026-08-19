namespace ProjectManagement.Features.Tasks;

public static class LexoRankHelper
{
    public static string GetRankAfter(string lastRank)
    {
        // منطق مبسط جداً: نأخذ السلسلة ونضيف حرفاً في نهايتها 
        // أو نزيد قيمة آخر حرف لضمان ترتيب أبجدي أكبر.
        // الـ ":" في Lexorank الأصلي هي نهاية الجزء الأساسي.

        char lastChar = lastRank[lastRank.Length - 1];

        // إذا كان الحرف الأخير ليس z، نزيده ببساطة
        if (lastChar < 'z')
        {
            return lastRank.Substring(0, lastRank.Length - 1) + (char)(lastChar + 1);
        }

        // إذا وصلنا لـ z، نزيد طول السلسلة لضمان مساحة جديدة
        return lastRank + "h:";
    }
}