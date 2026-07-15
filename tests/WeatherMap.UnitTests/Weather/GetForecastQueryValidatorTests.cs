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
}
