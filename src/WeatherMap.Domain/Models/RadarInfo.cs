namespace WeatherMap.Domain.Models;

public sealed record RadarInfo(
    string Host,
    IReadOnlyList<RadarFrame> Past,
    IReadOnlyList<RadarFrame> Nowcast);
