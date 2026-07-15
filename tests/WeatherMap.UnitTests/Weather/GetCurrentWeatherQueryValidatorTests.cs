using WeatherMap.Application.Weather;

namespace WeatherMap.UnitTests.Weather;

public class GetCurrentWeatherQueryValidatorTests
{
    private readonly GetCurrentWeatherQueryValidator _validator = new();

    [Fact]
    public void Validate_Succeeds_ForValidCoordinates()
    {
        var result = _validator.Validate(new GetCurrentWeatherQuery(51.11, 17.03));

        Assert.True(result.IsValid);
    }

    [Theory]
    [InlineData(-90.1, 0)]
    [InlineData(90.1, 0)]
    [InlineData(0, -180.1)]
    [InlineData(0, 180.1)]
    public void Validate_Fails_ForOutOfRangeCoordinates(double lat, double lon)
    {
        var result = _validator.Validate(new GetCurrentWeatherQuery(lat, lon));

        Assert.False(result.IsValid);
    }
}
