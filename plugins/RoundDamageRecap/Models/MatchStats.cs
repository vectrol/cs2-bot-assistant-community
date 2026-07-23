using System.Text.Json.Serialization;

namespace RoundDamageRecap.Models;

public sealed class MatchRecord
{
    public int Version { get; set; } = 1;
    public string Timestamp { get; set; } = "";
    public string Map { get; set; } = "";
    public int Duration { get; set; }
    public int MaxRounds { get; set; } = 24;
    public TeamScore Score { get; set; } = new();
    public List<PlayerMatchStats> Players { get; set; } = [];
    public List<RoundRecord> Rounds { get; set; } = [];
}

public sealed class TeamScore
{
    public int Ct { get; set; }
    public int T { get; set; }
}

public sealed class RoundRecord
{
    public int Round { get; set; }
    public string Winner { get; set; } = "";
    public string Reason { get; set; } = "";
    public Dictionary<string, int> RoundKills { get; set; } = [];
}

public sealed class PlayerMatchStats
{
    public string Name { get; set; } = "";
    public ulong? SteamId { get; set; }
    public bool IsBot { get; set; }
    public int Kills { get; set; }
    public int Deaths { get; set; }
    public int Assists { get; set; }
    public int Damage { get; set; }
    public int HsKills { get; set; }
    public int FirstKills { get; set; }
    public int Multi2k { get; set; }
    public int Multi3k { get; set; }
    public int Multi4k { get; set; }
    public int Multi5k { get; set; }
    public int Clutch1v1 { get; set; }
    public int Clutch1v2 { get; set; }
    public int Clutch1v3 { get; set; }
    public int Clutch1v4 { get; set; }
    public int Clutch1v5 { get; set; }
    public int MvpCount { get; set; }
    public int RoundsPlayed { get; set; }
    public int RoundsSurvived { get; set; }
    public int RoundsWithKill { get; set; }

    [JsonIgnore]
    public double Adr => RoundsPlayed > 0 ? Math.Round((double)Damage / RoundsPlayed, 1) : 0;

    [JsonIgnore]
    public double KdRatio => Deaths > 0 ? Math.Round((double)Kills / Deaths, 2) : Kills;

    [JsonIgnore]
    public double HsPercent => Kills > 0 ? Math.Round((double)HsKills / Kills * 100, 1) : 0;

    [JsonIgnore]
    public int MultiKillCount => Multi2k + Multi3k + Multi4k + Multi5k;

    [JsonIgnore]
    public int ClutchCount => Clutch1v1 + Clutch1v2 + Clutch1v3 + Clutch1v4 + Clutch1v5;

    public double Rating { get; set; }
}

public sealed class InProgressPlayerStats
{
    public required string Name { get; set; }
    public ulong? SteamId { get; set; }
    public bool IsBot { get; set; }
    public int Kills { get; set; }
    public int Deaths { get; set; }
    public int Assists { get; set; }
    public int Damage { get; set; }
    public int HsKills { get; set; }
    public int RoundKills { get; set; }
    public int FirstKills { get; set; }
    public int MvpCount { get; set; }
    public int RoundsPlayed { get; set; }
    public int RoundsSurvived { get; set; }
    public int RoundsWithKill { get; set; }
    public int Multi2k { get; set; }
    public int Multi3k { get; set; }
    public int Multi4k { get; set; }
    public int Multi5k { get; set; }
    public int Clutch1v1 { get; set; }
    public int Clutch1v2 { get; set; }
    public int Clutch1v3 { get; set; }
    public int Clutch1v4 { get; set; }
    public int Clutch1v5 { get; set; }
    public bool IsAlive { get; set; } = true;

    [JsonIgnore]
    public int UserId { get; set; }

    public void FinalizeRound()
    {
        if (RoundKills == 5) Multi5k++;
        else if (RoundKills == 4) Multi4k++;
        else if (RoundKills == 3) Multi3k++;
        else if (RoundKills == 2) Multi2k++;

        if (RoundKills > 0) RoundsWithKill++;
        RoundKills = 0;
    }
}
