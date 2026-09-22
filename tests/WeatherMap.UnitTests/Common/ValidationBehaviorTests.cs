using FluentValidation;
using FluentValidation.Results;
using Moq;
using WeatherMap.Application.Common;

namespace WeatherMap.UnitTests.Common;

// ValidationBehavior is only exercised indirectly through integration tests
// that hit an endpoint with invalid input — no unit test covers its own
// short-circuit/aggregation logic directly.
public class ValidationBehaviorTests
{
    public sealed record SampleRequest(string Value);
    public sealed record SampleResponse;

    [Fact]
    public async Task Handle_WithNoValidators_CallsNext()
    {
        var behavior = new ValidationBehavior<SampleRequest, SampleResponse>([]);
        var nextCalled = false;

        var response = await behavior.Handle(
            new SampleRequest("anything"),
            (_) => { nextCalled = true; return Task.FromResult(new SampleResponse()); },
            CancellationToken.None);

        Assert.True(nextCalled);
        Assert.NotNull(response);
    }

    [Fact]
    public async Task Handle_WithPassingValidators_CallsNext()
    {
        var validator = new Mock<IValidator<SampleRequest>>();
        validator.Setup(v => v.ValidateAsync(It.IsAny<SampleRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ValidationResult());
        var behavior = new ValidationBehavior<SampleRequest, SampleResponse>([validator.Object]);
        var nextCalled = false;

        await behavior.Handle(
            new SampleRequest("anything"),
            (_) => { nextCalled = true; return Task.FromResult(new SampleResponse()); },
            CancellationToken.None);

        Assert.True(nextCalled);
    }

    [Fact]
    public async Task Handle_WithFailingValidator_ThrowsValidationExceptionAndSkipsNext()
    {
        var failure = new ValidationFailure("Value", "Value is required");
        var validator = new Mock<IValidator<SampleRequest>>();
        validator.Setup(v => v.ValidateAsync(It.IsAny<SampleRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ValidationResult([failure]));
        var behavior = new ValidationBehavior<SampleRequest, SampleResponse>([validator.Object]);
        var nextCalled = false;

        var exception = await Assert.ThrowsAsync<ValidationException>(() => behavior.Handle(
            new SampleRequest(""),
            (_) => { nextCalled = true; return Task.FromResult(new SampleResponse()); },
            CancellationToken.None));

        Assert.False(nextCalled);
        Assert.Contains(exception.Errors, e => e.PropertyName == "Value");
    }

    [Fact]
    public async Task Handle_WithMultipleValidators_AggregatesFailuresFromBoth()
    {
        var validatorA = new Mock<IValidator<SampleRequest>>();
        validatorA.Setup(v => v.ValidateAsync(It.IsAny<SampleRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ValidationResult([new ValidationFailure("Value", "Failure from A")]));
        var validatorB = new Mock<IValidator<SampleRequest>>();
        validatorB.Setup(v => v.ValidateAsync(It.IsAny<SampleRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ValidationResult([new ValidationFailure("Value", "Failure from B")]));
        var behavior = new ValidationBehavior<SampleRequest, SampleResponse>([validatorA.Object, validatorB.Object]);

        var exception = await Assert.ThrowsAsync<ValidationException>(() => behavior.Handle(
            new SampleRequest(""),
            (_) => Task.FromResult(new SampleResponse()),
            CancellationToken.None));

        Assert.Equal(2, exception.Errors.Count());
    }
}
