using System.Text.Json;
using CounterStrikeSharp.API;
using RoundDamageRecap.Models;

namespace RoundDamageRecap.Managers;

public sealed class Persistence
{
    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        WriteIndented = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    private string GetStorageDir()
    {
        var baseDir = Path.Combine(Server.GameDirectory, "cs2-match-history");
        Directory.CreateDirectory(baseDir);
        return baseDir;
    }

    public void SaveMatch(MatchRecord record)
    {
        try
        {
            var dir = GetStorageDir();
            var timestamp = record.Timestamp.Replace(":", "-").Replace("T", "_");
            var map = record.Map.Replace("/", "_").Replace("\\", "_");
            var filename = $"{timestamp}_{map}.json";
            var path = Path.Combine(dir, filename);

            var json = JsonSerializer.Serialize(record, JsonOpts);
            File.WriteAllText(path, json);

            // Cleanup old files (keep last 200)
            CleanupOldFiles(dir, 200);
        }
        catch (Exception ex)
        {
            Server.PrintToConsole($"[RoundDamageRecap] Failed to save match: {ex.Message}");
        }
    }

    public List<MatchRecord> LoadRecent(int count = 20)
    {
        try
        {
            var dir = GetStorageDir();
            if (!Directory.Exists(dir)) return [];

            return Directory.GetFiles(dir, "*.json")
                .OrderByDescending(f => f)
                .Take(count)
                .Select(f =>
                {
                    try
                    {
                        var json = File.ReadAllText(f);
                        return JsonSerializer.Deserialize<MatchRecord>(json, JsonOpts);
                    }
                    catch
                    {
                        return null;
                    }
                })
                .Where(r => r != null)
                .Cast<MatchRecord>()
                .ToList();
        }
        catch
        {
            return [];
        }
    }

    private static void CleanupOldFiles(string dir, int maxFiles)
    {
        try
        {
            var files = Directory.GetFiles(dir, "*.json")
                .OrderByDescending(f => f)
                .Skip(maxFiles)
                .ToList();

            foreach (var file in files)
            {
                File.Delete(file);
            }
        }
        catch
        {
            // Best effort
        }
    }
}
