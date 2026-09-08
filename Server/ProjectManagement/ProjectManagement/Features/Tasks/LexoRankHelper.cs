namespace ProjectManagement.Features.Tasks;

public static class LexoRankHelper
{
    private const char MinChar = 'a';
    private const char MaxChar = 'z';
    private const string Prefix = "0|";
    private const string Suffix = ":";

    /// <summary>
    /// 1. حالة العمود الفارغ: توليد رتبة ابتدائية متوازنة
    /// </summary>
    public static string GetInitialRank() => $"{Prefix}m0000{Suffix}";

    /// <summary>
    /// 2. حالة الإضافة في أسفل القائمة (بعد آخر مهمة)
    /// </summary>
    public static string GetRankAfter(string lastRank)
    {
        if (string.IsNullOrWhiteSpace(lastRank))
            return GetInitialRank();

        string val = CleanRank(lastRank);
        // سقف أعلى افتراضي للحساب
        string upperBound = $"{Prefix}{new string(MaxChar, val.Length + 2)}{Suffix}";
        return GetRankBetween(lastRank, upperBound);
    }

    /// <summary>
    /// 3. حالة الإضافة في أعلى القائمة (قبل أول مهمة)
    /// </summary>
    public static string GetRankBefore(string firstRank)
    {
        if (string.IsNullOrWhiteSpace(firstRank))
            return GetInitialRank();

        string val = CleanRank(firstRank);
        // حد أدنى افتراضي للحساب
        string lowerBound = $"{Prefix}{new string(MinChar, val.Length + 2)}{Suffix}";
        return GetRankBetween(lowerBound, firstRank);
    }

    /// <summary>
    /// 4. حالة النقل والسحب والإسقاط بين مهمتين (Drag & Drop)
    /// </summary>
    public static string GetRankBetween(string? prevRank, string? nextRank)
    {
        // إذا كانت القائمة فارغة
        if (string.IsNullOrWhiteSpace(prevRank) && string.IsNullOrWhiteSpace(nextRank))
            return GetInitialRank();

        // إذا تم النقل لأعلى القائمة تماماً
        if (string.IsNullOrWhiteSpace(prevRank))
            return GetRankBefore(nextRank!);

        // إذا تم النقل لأسفل القائمة تماماً
        if (string.IsNullOrWhiteSpace(nextRank))
            return GetRankAfter(prevRank);

        string p = CleanRank(prevRank);
        string n = CleanRank(nextRank);

        // حماية: إذا كانت المدخلات غير مرتبة أبجدياً
        if (string.CompareOrdinal(p, n) >= 0)
            return $"{Prefix}{p}m{Suffix}";

        var result = new System.Text.StringBuilder();
        int i = 0;

        while (true)
        {
            char pChar = i < p.Length ? p[i] : MinChar;
            char nChar = i < n.Length ? n[i] : MaxChar;

            if (pChar == nChar)
            {
                result.Append(pChar);
                i++;
                continue;
            }

            int diff = nChar - pChar;

            if (diff > 1)
            {
                // يوجد مسافة متوفرة بين الحرفين (مثال: بين a و c يوجد b)
                char midChar = (char)(pChar + diff / 2);
                result.Append(midChar);
                break;
            }

            // حرفان متتاليان تماماً (مثال: بين a و b) -> نضيف الحرف الحالي وننتقل للخانة التالية
            result.Append(pChar);
            i++;
        }

        return $"{Prefix}{result}{Suffix}";
    }

    /// <summary>
    /// تنظيف الرتبة واستخراج الجزء النصي المخصص للمقارنة
    /// </summary>
    private static string CleanRank(string rank)
    {
        if (rank.StartsWith(Prefix))
            rank = rank[Prefix.Length..];

        if (rank.EndsWith(Suffix))
            rank = rank[..^Suffix.Length];

        return rank;
    }
}

//namespace ProjectManagement.Features.Tasks;

//public static class LexoRankHelper
//{
//    public static string GetRankAfter(string lastRank)
//    {
//        // منطق مبسط جداً: نأخذ السلسلة ونضيف حرفاً في نهايتها 
//        // أو نزيد قيمة آخر حرف لضمان ترتيب أبجدي أكبر.
//        // الـ ":" في Lexorank الأصلي هي نهاية الجزء الأساسي.

//        char lastChar = lastRank[lastRank.Length - 1];

//        // إذا كان الحرف الأخير ليس z، نزيده ببساطة
//        if (lastChar < 'z')
//        {
//            return lastRank.Substring(0, lastRank.Length - 1) + (char)(lastChar + 1);
//        }

//        // إذا وصلنا لـ z، نزيد طول السلسلة لضمان مساحة جديدة
//        return lastRank + "h:";
//    }
//}
