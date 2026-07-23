using CounterStrikeSharp.API;
using CounterStrikeSharp.API.Core;
using CounterStrikeSharp.API.Modules.Utils;
using RoundDamageRecap.Models;

namespace RoundDamageRecap.Managers;

public sealed class SummaryPrinter
{
    private readonly Localizer _l;
    private const string Green = "\u0006";
    private const string Gold = "\u0009";
    private const string Red = "\u0008";
    private const string Default = "\u0001";

    public SummaryPrinter(Localizer localizer)
    {
        _l = localizer;
    }

    public void PrintDifficulty(CCSPlayerController player, string difficultyName, string difficultyLevel)
    {
        player.PrintToChat($" {Gold}{_l["match.difficulty", difficultyName, difficultyLevel]}{Default}");
    }

    public void PrintMatchSummary(MatchRecord record)
    {
        var recipients = Utilities.GetPlayers()
            .Where(p => p is { IsValid: true, IsHLTV: false, IsBot: false }
                        && p.Team is CsTeam.CounterTerrorist or CsTeam.Terrorist)
            .ToList();

        var duration = TimeSpan.FromSeconds(record.Duration);

        foreach (var player in recipients)
        {
            player.PrintToChat($" {Green}{_l["match.title", record.Map]}{Default}");
            player.PrintToChat($" {Green}{_l["match.score", record.Score.Ct, record.Score.T, $"{duration.Minutes}:{duration.Seconds:D2}"]}{Default}");
            player.PrintToChat($" {Gold}{_l["match.header"]}{Default}");

            foreach (var p in record.Players.OrderByDescending(p => p.Rating))
            {
                var ratingStars = p.Rating >= 1.5 ? $" {_l["rating.symbol"]}" : "";
                player.PrintToChat($" {Default}{_l["match.player_line", p.Name, $"{p.Kills}-{p.Deaths}", p.Adr.ToString("F1"), $"{p.Rating:F2}{ratingStars}"]}{Default}");
            }

            player.PrintToChat($" {Green}{_l["match.show_history"]}{Default}");
        }
    }

    public void PrintRoundRecap(CCSPlayerController player, int round, List<RoundRecapEntry> entries)
    {
        player.PrintToChat($" {Gold}{_l["round.title", round]}{Default}");

        foreach (var entry in entries)
        {
            var hpText = entry.RemainingHp > 0
                ? _l["round.remaining_hp", entry.RemainingHp]
                : _l["round.dead"];

            var dealtHits = entry.DealtHits == 1 ? "hit" : "hits";
            var takenHits = entry.TakenHits == 1 ? "hit" : "hits";

            player.PrintToChat($" {Default}{_l["round.line",
                entry.EnemyName,
                entry.DealtDamage, $"{entry.DealtHits} {dealtHits}",
                entry.TakenDamage, $"{entry.TakenHits} {takenHits}",
                hpText
            ]}{Default}");
        }
    }

    public void PrintHistoryList(CCSPlayerController player, List<MatchRecord> matches)
    {
        if (matches.Count == 0)
        {
            player.PrintToChat($" {Red}{_l["history.empty"]}{Default}");
            return;
        }

        player.PrintToChat($" {Gold}{_l["history.title", matches.Count]}{Default}");
        player.PrintToChat($" {Gold}{_l["history.header"]}{Default}");

        for (int i = 0; i < matches.Count; i++)
        {
            var m = matches[i];
            var topPlayer = m.Players.OrderByDescending(p => p.Rating).FirstOrDefault();
            var kd = topPlayer != null ? $"{topPlayer.Kills}-{topPlayer.Deaths}" : "-";
            var adr = topPlayer?.Adr.ToString("F1") ?? "-";
            var rating = topPlayer?.Rating.ToString("F2") ?? "-";

            player.PrintToChat($" {Default}{_l["history.line", i + 1, m.Map, kd, adr, rating]}{Default}");
        }

        player.PrintToChat($" {Green}{_l["history.detail", "<index>"]}{Default}");
    }
}

public sealed class RoundRecapEntry
{
    public required string EnemyName { get; set; }
    public int DealtDamage { get; set; }
    public int DealtHits { get; set; }
    public int TakenDamage { get; set; }
    public int TakenHits { get; set; }
    public int RemainingHp { get; set; }
}
