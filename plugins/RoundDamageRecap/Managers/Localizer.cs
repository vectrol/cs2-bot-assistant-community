namespace RoundDamageRecap.Managers;

public sealed class Localizer
{
    private readonly string _lang;

    public Localizer(string language)
    {
        _lang = language switch
        {
            "zh" or "zh-CN" or "zh_CN" => "zh-CN",
            _ => "en-US"
        };
    }

    public string this[string key, params object?[] args] => Get(key, args);

    public string Get(string key, params object?[] args)
    {
        var value = _lang == "zh-CN"
            ? key switch
            {
                "match.title" => "══ 比赛总结 - {0} ══",
                "match.score" => "CT {0} - {1} T    时长: {2}",
                "match.header" => "玩家                K/D     ADR    Rating",
                "match.player_line" => "{0,-16} {1,-7} {2,-6} {3,-6}",
                "match.show_history" => "输入 !history 查看完整历史",
                "match.difficulty" => "Bot 难度: {0} [{1}]",
                "round.title" => "--- 回合 {0} 统计 ---",
                "round.line" => "{0,-16} 造成: {1} ({2} 命中)  承受: {3} ({4} 命中)",
                "round.remaining_hp" => "{0} HP 剩余",
                "round.dead" => "阵亡",
                "rating.symbol" => "★",
                "history.title" => "--- 历史比赛 ({0} 场) ---",
                "history.line" => "{0}  {1,-16}  {2}  {3}  {4,-6}  {5}",
                "history.empty" => "暂无历史记录",
                "history.header" => "#  地图              K/D     ADR    Rating",
                "history.detail" => "输入 !history {0} 查看详情",
                _ => key
            }
            : key switch
            {
                "match.title" => "══ Match Summary - {0} ══",
                "match.score" => "CT {0} - {1} T    Duration: {2}",
                "match.header" => "Player             K/D     ADR    Rating",
                "match.player_line" => "{0,-16} {1,-7} {2,-6} {3,-6}",
                "match.show_history" => "Type !history to view full history",
                "match.difficulty" => "BOT Difficulty: {0} [{1}]",
                "round.title" => "--- Round {0} Recap ---",
                "round.line" => "{0,-16} Dealt: {1} ({2} hit{3})  Taken: {4} ({5} hit{6})",
                "round.remaining_hp" => "{0} HP left",
                "round.dead" => "DEAD",
                "rating.symbol" => "★",
                "history.title" => "--- Match History ({0} games) ---",
                "history.line" => "{0}  {1,-16}  {2}  {3}  {4,-6}  {5}",
                "history.empty" => "No match history found.",
                "history.header" => "#   Map               K/D     ADR    Rating",
                "history.detail" => "Type !history {0} for details",
                _ => key
            };

        return args.Length > 0 ? string.Format(value, args) : value;
    }
}
