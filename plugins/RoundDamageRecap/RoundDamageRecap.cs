using System.Security.Cryptography;
using CounterStrikeSharp.API;
using CounterStrikeSharp.API.Core;
using CounterStrikeSharp.API.Core.Attributes;
using CounterStrikeSharp.API.Core.Attributes.Registration;
using CounterStrikeSharp.API.Modules.Commands;
using CounterStrikeSharp.API.Modules.Utils;
using RoundDamageRecap.Managers;
using RoundDamageRecap.Models;

namespace RoundDamageRecap;

[MinimumApiVersion(304)]
public sealed class RoundDamageRecapPlugin : BasePlugin
{
    public override string ModuleName => "RoundDamageRecap";
    public override string ModuleVersion => "1.0.0";
    public override string ModuleAuthor => "CS2 Bot Assistant Community";
    public override string ModuleDescription => "Round-end damage recap, match history, and HLTV-style rating.";

    private MatchTracker? _tracker;
    private SummaryPrinter? _printer;
    private Persistence? _persistence;
    private Localizer? _l;
    private bool _matchActive;
    private DateTime _matchStartTime;
    private string _currentMap = "";

    // Per-round damage tracking for recap
    private readonly Dictionary<int, Dictionary<int, RoundDamageEntry>> _roundDamageByAttacker = [];

    public override void Load(bool hotReload)
    {
        RegisterEventHandler<EventRoundStart>(OnRoundStart);
        RegisterEventHandler<EventPlayerHurt>(OnPlayerHurt);
        RegisterEventHandler<EventPlayerDeath>(OnPlayerDeath);
        RegisterEventHandler<EventRoundEnd>(OnRoundEnd);
        RegisterEventHandler<EventRoundMvp>(OnRoundMvp);
        RegisterEventHandler<EventPlayerDisconnect>(OnPlayerDisconnect);
        RegisterEventHandler<EventCsWinPanelMatch>(OnMatchEnd);
        RegisterListener<Listeners.OnMapStart>(OnMapStart);

        AddCommand("css_history", "Show match history", CommandHistory);
        AddCommand("css_roundrecap", "Show round recap", CommandRoundRecap);
    }

    private void OnMapStart(string mapName)
    {
        _currentMap = mapName;
        _matchActive = false;
        _matchStartTime = DateTime.UtcNow;
        _tracker = new MatchTracker();
        _roundDamageByAttacker.Clear();

        var config = LoadConfig();
        var lang = config?.Language ?? "en-US";
        _l = new Localizer(lang);
        _printer = new SummaryPrinter(_l);
        _persistence = new Persistence();

        // Announce difficulty after short delay
        Server.NextFrame(() => AnnounceDifficulty());
    }

    private HookResult OnRoundStart(EventRoundStart @event, GameEventInfo info)
    {
        _tracker?.OnRoundStart();
        _roundDamageByAttacker.Clear();
        return HookResult.Continue;
    }

    private HookResult OnPlayerHurt(EventPlayerHurt @event, GameEventInfo info)
    {
        _tracker?.OnPlayerHurt(@event);

        // Also track for round recap
        var attacker = @event.Attacker;
        var victim = @event.Userid;
        if (attacker == null || victim == null || attacker.UserId == victim.UserId) return HookResult.Continue;
        if (!IsTrackable(attacker) || !IsTrackable(victim)) return HookResult.Continue;

        var aKey = attacker.UserId ?? attacker.Slot;
        var vKey = victim.UserId ?? victim.Slot;

        if (!_roundDamageByAttacker.TryGetValue(aKey, out var victims))
        {
            victims = [];
            _roundDamageByAttacker[aKey] = victims;
        }

        if (!victims.TryGetValue(vKey, out var entry))
        {
            entry = new RoundDamageEntry { Name = victim.PlayerName };
            victims[vKey] = entry;
        }

        entry.Damage += Math.Max(0, @event.DmgHealth);
        entry.Hits++;
        entry.LastHealth = Math.Max(0, @event.Health);

        return HookResult.Continue;
    }

    private HookResult OnPlayerDeath(EventPlayerDeath @event, GameEventInfo info)
    {
        _tracker?.OnPlayerDeath(@event);
        return HookResult.Continue;
    }

    private HookResult OnRoundMvp(EventRoundMvp @event, GameEventInfo info)
    {
        _tracker?.OnMvp(@event);
        return HookResult.Continue;
    }

    private HookResult OnRoundEnd(EventRoundEnd @event, GameEventInfo info)
    {
        _tracker?.OnRoundEnd(@event);
        _matchActive = true;

        // Print round recap for human players
        if (_printer != null && _l != null)
        {
            var round = _tracker?.CurrentRound ?? 0;
            Server.NextFrame(() =>
            {
                foreach (var player in Utilities.GetPlayers().Where(IsEligibleRecipient))
                {
                    var entries = BuildRoundRecap(player);
                    if (entries.Count > 0)
                    {
                        _printer.PrintRoundRecap(player, round, entries);
                    }
                }
            });
        }

        return HookResult.Continue;
    }

    private HookResult OnMatchEnd(EventCsWinPanelMatch @event, GameEventInfo info)
    {
        if (!_matchActive) return HookResult.Continue;

        if (_tracker == null || _persistence == null || _printer == null || _l == null)
            return HookResult.Continue;

        var playerStats = _tracker.FinalizeMatch();
        var totalRounds = _tracker.CurrentRound;
        var duration = (int)(DateTime.UtcNow - _matchStartTime).TotalSeconds;

        var record = new MatchRecord
        {
            Timestamp = DateTime.UtcNow.ToString("o"),
            Map = _currentMap,
            Duration = Math.Max(duration, 1),
            MaxRounds = 24,
            Score = GetTeamScores(),
            Players = playerStats.Select(p =>
            {
                p.Rating = RatingCalculator.Compute(p, totalRounds);
                return p;
            }).ToList(),
            Rounds = []
        };

        _persistence.SaveMatch(record);
        _printer.PrintMatchSummary(record);
        _matchActive = false;

        return HookResult.Continue;
    }

    private HookResult OnPlayerDisconnect(EventPlayerDisconnect @event, GameEventInfo info)
    {
        var player = @event.Userid;
        if (player != null)
        {
            _tracker?.OnPlayerDisconnect(player);

            var key = player.UserId ?? player.Slot;
            _roundDamageByAttacker.Remove(key);
            foreach (var victims in _roundDamageByAttacker.Values)
            {
                victims.Remove(key);
            }
        }

        return HookResult.Continue;
    }

    private void CommandHistory(CCSPlayerController? player, CommandInfo command)
    {
        if (player == null || !IsEligibleRecipient(player)) return;
        if (_persistence == null || _printer == null) return;

        var args = command.ArgCount > 1 ? command.ArgByIndex(1) : "";

        if (int.TryParse(args, out var index) && index > 0)
        {
            var matches = _persistence.LoadRecent(50);
            if (index <= matches.Count)
            {
                var match = matches[index - 1];
                _printer.PrintMatchSummary(match);
                return;
            }
        }

        var recent = _persistence.LoadRecent(20);
        _printer.PrintHistoryList(player, recent);
    }

    private void CommandRoundRecap(CCSPlayerController? player, CommandInfo command)
    {
        if (player == null || !IsEligibleRecipient(player)) return;
        if (_printer == null) return;

        var round = _tracker?.CurrentRound ?? 0;
        var entries = BuildRoundRecap(player);
        if (entries.Count > 0)
        {
            _printer.PrintRoundRecap(player, round, entries);
        }
        else
        {
            player.PrintToChat($" \u0006[RoundDamageRecap] No damage data for current round.\u0001");
        }
    }

    private List<RoundRecapEntry> BuildRoundRecap(CCSPlayerController player)
    {
        var entries = new List<RoundRecapEntry>();
        var playerKey = player.UserId ?? player.Slot;
        var enemyTeam = GetEnemyTeam(player.Team);
        if (enemyTeam == null) return entries;

        var enemies = Utilities.GetPlayers()
            .Where(p => IsTrackable(p) && p.Team == enemyTeam && p.UserId.HasValue)
            .ToList();

        foreach (var enemy in enemies)
        {
            var eKey = enemy.UserId!.Value;

            // Damage we dealt to enemy
            int dealtDmg = 0, dealtHits = 0, lastHealth = 100;
            RoundDamageEntry? dealtEntry = null;
            if (_roundDamageByAttacker.TryGetValue(playerKey, out var dealtMap)
                && dealtMap.TryGetValue(eKey, out var de))
            {
                dealtEntry = de;
                dealtDmg = de.Damage;
                dealtHits = de.Hits;
                lastHealth = de.LastHealth;
            }

            // Damage enemy dealt to us
            int takenDmg = 0, takenHits = 0;
            if (_roundDamageByAttacker.TryGetValue(eKey, out var takenMap)
                && takenMap.TryGetValue(playerKey, out var takenEntry))
            {
                takenDmg = takenEntry.Damage;
                takenHits = takenEntry.Hits;
            }

            if (dealtDmg == 0 && takenDmg == 0) continue;

            int remainingHp;
            if (enemy.PawnIsAlive && enemy.PlayerPawn.Value is { IsValid: true } pawn)
            {
                remainingHp = Math.Max(0, pawn.Health);
            }
            else if (dealtEntry != null)
            {
                remainingHp = lastHealth > 0 ? lastHealth : 0;
            }
            else
            {
                remainingHp = 0;
            }

            entries.Add(new RoundRecapEntry
            {
                EnemyName = enemy.PlayerName,
                DealtDamage = dealtDmg,
                DealtHits = dealtHits,
                TakenDamage = takenDmg,
                TakenHits = takenHits,
                RemainingHp = remainingHp,
            });
        }

        return entries;
    }

    private PluginConfig? LoadConfig()
    {
        try
        {
            var configDir = Path.Combine(Server.GameDirectory, "addons", "counterstrikesharp", "configs", "plugins", "RoundDamageRecap");
            var configPath = Path.Combine(configDir, "config.json");
            if (File.Exists(configPath))
            {
                var json = File.ReadAllText(configPath);
                return System.Text.Json.JsonSerializer.Deserialize<PluginConfig>(json);
            }

            // Create default config
            Directory.CreateDirectory(configDir);
            var defaultConfig = new PluginConfig();
            var defaultJson = System.Text.Json.JsonSerializer.Serialize(defaultConfig, new System.Text.Json.JsonSerializerOptions { WriteIndented = true });
            File.WriteAllText(configPath, defaultJson);
            return defaultConfig;
        }
        catch
        {
            return null;
        }
    }

    private void AnnounceDifficulty()
    {
        if (_printer == null || _l == null) return;

        var result = DetectDifficulty();
        var recipients = Utilities.GetPlayers().Where(IsEligibleRecipient).ToList();
        foreach (var player in recipients)
        {
            _printer.PrintDifficulty(player, result.Name, result.Level);
        }
    }

    private static DifficultyResult DetectDifficulty()
    {
        var candidates = new[]
        {
            Path.Combine(Server.GameDirectory, "overrides", "botprofile.vpk"),
            Path.Combine(Server.GameDirectory, "csgo", "overrides", "botprofile.vpk"),
            Path.Combine(Server.GameDirectory, "game", "csgo", "overrides", "botprofile.vpk"),
        };

        string? activePath = null;
        foreach (var c in candidates)
        {
            if (File.Exists(c)) { activePath = c; break; }
        }

        if (activePath == null)
        {
            var dir = new DirectoryInfo(AppContext.BaseDirectory);
            while (dir != null)
            {
                var test = Path.Combine(dir.FullName, "overrides", "botprofile.vpk");
                if (File.Exists(test)) { activePath = test; break; }
                dir = dir.Parent;
            }
        }

        if (activePath == null)
            return new DifficultyResult("Unknown - missing overrides", "?/3");

        var activeHash = ComputeSha256(activePath);
        var overridesDir = Path.GetDirectoryName(activePath);
        if (overridesDir == null)
            return new DifficultyResult("Unknown", "?/3");

        var profiles = new[]
        {
            ("Low", "1/3", Path.Combine(overridesDir, "Low", "botprofile.vpk")),
            ("Medium", "2/3", Path.Combine(overridesDir, "Medium", "botprofile.vpk")),
            ("High", "3/3", Path.Combine(overridesDir, "High", "botprofile.vpk")),
        };

        foreach (var (name, level, path) in profiles)
        {
            if (File.Exists(path) && CryptographicOperations.FixedTimeEquals(activeHash, ComputeSha256(path)))
            {
                return new DifficultyResult(name, level);
            }
        }

        return new DifficultyResult("Custom / Unknown", "?/3");
    }

    private static TeamScore GetTeamScores()
    {
        var ct = Utilities.FindAllEntitiesByDesignerName<CCSTeam>("cs_team_manager")
            .FirstOrDefault(t => t.TeamNum == 2);
        var t = Utilities.FindAllEntitiesByDesignerName<CCSTeam>("cs_team_manager")
            .FirstOrDefault(t => t.TeamNum == 3);

        return new TeamScore
        {
            Ct = ct?.Score ?? 0,
            T = t?.Score ?? 0,
        };
    }

    private static byte[] ComputeSha256(string path)
    {
        using var stream = File.OpenRead(path);
        using var sha = System.Security.Cryptography.SHA256.Create();
        return sha.ComputeHash(stream);
    }

    private static bool IsTrackable(CCSPlayerController? player)
    {
        return player is { IsValid: true, IsHLTV: false }
               && player.Team is CsTeam.CounterTerrorist or CsTeam.Terrorist;
    }

    private static bool IsEligibleRecipient(CCSPlayerController? player)
    {
        return IsTrackable(player) && player is { IsBot: false };
    }

    private static CsTeam? GetEnemyTeam(CsTeam team)
    {
        return team switch
        {
            CsTeam.CounterTerrorist => CsTeam.Terrorist,
            CsTeam.Terrorist => CsTeam.CounterTerrorist,
            _ => null
        };
    }

    private sealed record DifficultyResult(string Name, string Level);

    private sealed class RoundDamageEntry
    {
        public required string Name { get; set; }
        public int Damage { get; set; }
        public int Hits { get; set; }
        public int LastHealth { get; set; } = 100;
    }

    private sealed class PluginConfig
    {
        public string Language { get; set; } = "en-US";
    }
}
