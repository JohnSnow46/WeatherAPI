using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;
using WeatherMap.Api.ExceptionHandling;

namespace WeatherMap.IntegrationTests.ExceptionHandling;

public class GlobalExceptionHandlerTests
{
    [Fact]
    public async Task TryHandleAsync_SwallowsCancellation_WhenClientAbortedRequest()
    {
        using var cts = new CancellationTokenSource();
        cts.Cancel();

        var httpContext = new DefaultHttpContext { RequestAborted = cts.Token };
        var problemDetailsService = new RecordingProblemDetailsService();
        var handler = new GlobalExceptionHandler(problemDetailsService, NullLogger<GlobalExceptionHandler>.Instance);

        var handled = await handler.TryHandleAsync(httpContext, new TaskCanceledException(), CancellationToken.None);

        Assert.True(handled);
        Assert.False(problemDetailsService.WasCalled);
    }

    [Fact]
    public async Task TryHandleAsync_ReturnsServiceUnavailable_ForUpstreamTimeoutUnrelatedToClientAbort()
    {
        var httpContext = new DefaultHttpContext();
        var problemDetailsService = new RecordingProblemDetailsService();
        var handler = new GlobalExceptionHandler(problemDetailsService, NullLogger<GlobalExceptionHandler>.Instance);

        await handler.TryHandleAsync(httpContext, new TaskCanceledException(), CancellationToken.None);

        Assert.Equal(StatusCodes.Status503ServiceUnavailable, httpContext.Response.StatusCode);
    }

    private sealed class RecordingProblemDetailsService : IProblemDetailsService
    {
        public bool WasCalled { get; private set; }

        public ValueTask WriteAsync(ProblemDetailsContext context)
        {
            WasCalled = true;
            return ValueTask.CompletedTask;
        }
    }
}
