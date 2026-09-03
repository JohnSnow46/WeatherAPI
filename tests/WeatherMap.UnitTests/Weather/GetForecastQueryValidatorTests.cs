using WeatherMap.Application.Weather;

namespace WeatherMap.UnitTests.Weather;

public class GetForecastQueryValidatorTests
{
    private readonly GetForecastQueryValidator _validator = new();

    [Fact]
    public void Validate_Succeeds_ForValidRequest()
    {
        var result = _validator.Validate(new GetForecastQuery(51.11, 17.03, 7));

        Assert.True(result.IsValid);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(17)]
    public void Validate_Fails_ForDaysOutOfRange(int days)
    {
        var result = _validator.Validate(new GetForecastQuery(51.11, 17.03, days));

        Assert.False(result.IsValid);
    }

    [Theory]
    [InlineData(-90.1, 0)]
    [InlineData(90.1, 0)]
    [InlineData(0, -180.1)]
    [InlineData(0, 180.1)]
    public void Validate_Fails_ForOutOfRangeCoordinates(double lat, double lon)
    {
        var result = _validator.Validate(new GetForecastQuery(lat, lon, 7));

        Assert.False(result.IsValid);
    }

    [Theory]
    [InlineData(null, 17.03)]
    [InlineData(51.11, null)]
    [InlineData(null, null)]
    public void Validate_Fails_ForMissingCoordinates(double? lat, double? lon)
    {
        var result = _validator.Validate(new GetForecastQuery(lat, lon, 7));

        Assert.False(result.IsValid);
    }
}
