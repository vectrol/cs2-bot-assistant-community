using RoundDamageRecap.Models;

namespace RoundDamageRecap.Managers;

public static class RatingCalculator
{
    public static double Compute(PlayerMatchStats stats, int totalRounds)
    {
        if (totalRounds <= 0) return 0;

        var kpr = (double)stats.Kills / totalRounds;
        var dpr = (double)stats.Deaths / totalRounds;
        var adr = stats.Adr;
        var kast = totalRounds > 0
            ? (double)(stats.RoundsWithKill + stats.RoundsSurvived) / totalRounds * 100
            : 0;

        // HLTV 2.0 formula with simplified KAST estimation
        var rating = 0.0073 * kast
                     + 0.3591 * kpr
                     - 0.5329 * dpr
                     + 0.2372 * Math.Min(adr / 100.0, 1.5)
                     + 0.3403;

        return Math.Round(Math.Clamp(rating, 0.1, 2.5), 2);
    }
}
