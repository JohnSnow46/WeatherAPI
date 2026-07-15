namespace WeatherMap.Domain.Models;

public sealed record Location(
    string Name,
    string? Country,
    string? Admin1,
    double Latitude,
    double Longitude,
    string? Timezone);
