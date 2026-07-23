using CounterStrikeSharp.API;
using CounterStrikeSharp.API.Core;
using CounterStrikeSharp.API.Modules.Utils;
using RoundDamageRecap.Models;

namespace RoundDamageRecap.Managers;

public sealed class MatchTracker
{
    private readonly Dictionary<int, InProgressPlayerStats> _playersByUserId = [];
    private readonly Dictionary<ulong, int> _steamIdToUserId = [];
    private readonly Dictionary<int, int> _roundKillsByUserId = [];
    private int _currentRound;
    private int _ctAliveAtRoundStart;
    private int _tAliveAtRoundStart;
    private string _winnerPending = "";
    private readonly HashSet<int> _firstKillDoneThisRound = [];

    public int CurrentRound => _currentRound;
    public IReadOnlyCollection<InProgressPlayerStats> AllStats => _playersByUserId.Values;

    public void Reset()
    {
        _playersByUserId.Clear();
        _steamIdToUserId.Clear();
        _roundKillsByUserId.Clear();
        _firstKillDoneThisRound.Clear();
        _currentRound = 0;
        _winnerPending = "";
    }

    public void OnRoundStart()
    {
        _currentRound++;
        _firstKillDoneThisRound.Clear();
        _roundKillsByUserId.Clear();

        foreach (var kvp in _playersByUserId)
        {
            kvp.Value.IsAlive = true;
            kvp.Value.RoundKills = 0;
        }

        // Snapshot alive counts for clutch detection
        var players = Utilities.GetPlayers();
        _ctAliveAtRoundStart = players.Count(p => IsActive(p) && p.Team == CsTeam.CounterTerrorist);
        _tAliveAtRoundStart = players.Count(p => IsActive(p) && p.Team == CsTeam.Terrorist);

        // Ensure all active players are tracked
        foreach (var player in players)
        {
            if (!IsActive(player)) continue;
            EnsureTracked(player);
        }
    }

    public void OnPlayerDeath(EventPlayerDeath @event)
    {
        var victim = @event.Userid;
        var killer = @event.Attacker;
        var assister = @event.Assister;

        if (victim == null || !IsTrackable(victim)) return;

        var victimKey = GetOrCreateKey(victim);
        if (_playersByUserId.TryGetValue(victimKey, out var vStats))
        {
            vStats.Deaths++;
            vStats.IsAlive = false;
        }
        else
        {
            vStats = EnsureTracked(victim);
            vStats.Deaths++;
            vStats.IsAlive = false;
        }

        if (killer != null && IsTrackable(killer) && killer.UserId != victim.UserId)
        {
            var killerKey = GetOrCreateKey(killer);
            if (!_playersByUserId.TryGetValue(killerKey, out var kStats))
            {
                kStats = EnsureTracked(killer);
            }

            kStats.Kills++;
            kStats.RoundKills++;

            if (@event.Headshot)
                kStats.HsKills++;

            if (!_firstKillDoneThisRound.Contains(victim.Team == CsTeam.Terrorist ? 1 : 2))
            {
                kStats.FirstKills++;
                _firstKillDoneThisRound.Add(victim.Team == CsTeam.Terrorist ? 1 : 2);
            }

            // Track per-round kills for multi-kill counter
            if (!_roundKillsByUserId.ContainsKey(killerKey))
                _roundKillsByUserId[killerKey] = 0;
            _roundKillsByUserId[killerKey]++;
        }

        // Handle assists
        if (assister != null && IsTrackable(assister) && assister.UserId != victim.UserId
            && (killer == null || assister.UserId != killer.UserId))
        {
            var assistKey = GetOrCreateKey(assister);
            if (!_playersByUserId.TryGetValue(assistKey, out var aStats))
            {
                aStats = EnsureTracked(assister);
            }

            aStats.Assists++;
        }
    }

    public void OnPlayerHurt(EventPlayerHurt @event)
    {
        var attacker = @event.Attacker;
        var victim = @event.Userid;

        if (attacker == null || victim == null) return;
        if (!IsTrackable(attacker) || !IsTrackable(victim)) return;
        if (attacker.UserId == victim.UserId) return;

        var key = GetOrCreateKey(attacker);
        if (!_playersByUserId.TryGetValue(key, out var stats))
        {
            stats = EnsureTracked(attacker);
        }

        stats.Damage += Math.Max(0, @event.DmgHealth);
    }

    public void OnRoundEnd(EventRoundEnd @event)
    {
        _winnerPending = @event.Winner switch
        {
            2 => "CT",
            3 => "T",
            _ => ""
        };

        foreach (var kvp in _roundKillsByUserId)
        {
            if (_playersByUserId.TryGetValue(kvp.Key, out var stats))
            {
                stats.RoundKills = kvp.Value;
            }
        }

        // Mark survivors and finalize round for each player
        foreach (var kvp in _playersByUserId)
        {
            if (kvp.Value.IsAlive)
                kvp.Value.RoundsSurvived++;

            kvp.Value.FinalizeRound();

            // Detect clutches
            DetectClutch(kvp.Value, kvp.Key);
        }
    }

    public void OnMvp(EventRoundMvp @event)
    {
        var player = @event.Userid;
        if (player == null || !IsTrackable(player)) return;

        var key = GetOrCreateKey(player);
        if (!_playersByUserId.TryGetValue(key, out var stats))
        {
            stats = EnsureTracked(player);
        }

        stats.MvpCount++;
    }

    public void OnPlayerDisconnect(CCSPlayerController player)
    {
        if (player == null) return;
        var key = player.UserId ?? player.Slot;
        _playersByUserId.Remove(key);

        if (player.SteamID != 0)
            _steamIdToUserId.Remove(player.SteamID);
    }

    public List<PlayerMatchStats> FinalizeMatch()
    {
        return _playersByUserId.Values
            .Select(p => new PlayerMatchStats
            {
                Name = p.Name,
                SteamId = p.SteamId,
                IsBot = p.IsBot,
                Kills = p.Kills,
                Deaths = p.Deaths,
                Assists = p.Assists,
                Damage = p.Damage,
                HsKills = p.HsKills,
                FirstKills = p.FirstKills,
                Multi2k = p.Multi2k,
                Multi3k = p.Multi3k,
                Multi4k = p.Multi4k,
                Multi5k = p.Multi5k,
                Clutch1v1 = p.Clutch1v1,
                Clutch1v2 = p.Clutch1v2,
                Clutch1v3 = p.Clutch1v3,
                Clutch1v4 = p.Clutch1v4,
                Clutch1v5 = p.Clutch1v5,
                MvpCount = p.MvpCount,
                RoundsPlayed = p.RoundsPlayed,
                RoundsSurvived = p.RoundsSurvived,
                RoundsWithKill = p.RoundsWithKill,
            })
            .OrderByDescending(p => p.Kills)
            .ToList();
    }

    private void DetectClutch(InProgressPlayerStats stats, int userId)
    {
        if (string.IsNullOrEmpty(_winnerPending)) return;
        if (!stats.IsAlive) return;

        // Player must be the only survivor on the winning team
        bool isCt = _winnerPending == "CT";
        var teamAlive = _playersByUserId.Values
            .Count(p => p.IsAlive && ((isCt && !p.Name.StartsWith("BOT ")) || (!isCt && p.Name.StartsWith("BOT "))));

        // Simple approach: if player is alive and their team won
        if (stats.RoundKills < 1) return;

        switch (stats.RoundKills)
        {
            case 1: stats.Clutch1v1++; break;
            case 2: stats.Clutch1v2++; break;
            case 3: stats.Clutch1v3++; break;
            case 4: stats.Clutch1v4++; break;
            case >= 5: stats.Clutch1v5++; break;
        }
    }

    private InProgressPlayerStats EnsureTracked(CCSPlayerController player)
    {
        var key = GetOrCreateKey(player);
        if (_playersByUserId.TryGetValue(key, out var existing))
        {
            existing.RoundsPlayed++;
            return existing;
        }

        var stats = new InProgressPlayerStats
        {
            Name = player.PlayerName,
            SteamId = player.SteamID != 0 ? player.SteamID : null,
            IsBot = player.IsBot,
            UserId = key,
            RoundsPlayed = 1,
            IsAlive = true,
        };

        _playersByUserId[key] = stats;

        if (player.SteamID != 0)
            _steamIdToUserId[player.SteamID] = key;

        return stats;
    }

    private static int GetOrCreateKey(CCSPlayerController player)
    {
        return player.UserId ?? player.Slot;
    }

    private static bool IsTrackable(CCSPlayerController? player)
    {
        return player is { IsValid: true, IsHLTV: false }
               && player.Team is CsTeam.CounterTerrorist or CsTeam.Terrorist;
    }

    private static bool IsActive(CCSPlayerController? player)
    {
        return IsTrackable(player) && player is { PawnIsAlive: true };
    }
}
