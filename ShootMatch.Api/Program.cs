using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using HotChocolate;
using HotChocolate.Configuration;
using HotChocolate.Execution.Configuration;
using ShootMatch.Api.GraphQL;
using ShootMatch.Api.Hubs;
using ShootMatch.Application;
using ShootMatch.Infrastructure;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// ──────────────────────────────────────────
//  Core services
// ──────────────────────────────────────────
builder.Services.AddControllers();
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddHttpContextAccessor();

// ──────────────────────────────────────────
//  CORS — allow mobile (Expo Go) requests over LAN
// ──────────────────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddPolicy("MobileDevPolicy", policy =>
        policy
            .AllowAnyOrigin()
            .AllowAnyMethod()
            .AllowAnyHeader());
});

// ──────────────────────────────────────────
//  SignalR (real-time messaging)
// ──────────────────────────────────────────
builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = builder.Environment.IsDevelopment();
});

// ──────────────────────────────────────────
//  JWT Authentication + Role-based Authorization
// ──────────────────────────────────────────
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var key      = builder.Configuration["Jwt:Key"]      ?? "shootmatch-dev-key-change-me-immediately";
        var issuer   = builder.Configuration["Jwt:Issuer"]   ?? "shootmatch-api";
        var audience = builder.Configuration["Jwt:Audience"] ?? "shootmatch-client";

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer           = true,
            ValidateAudience         = true,
            ValidateIssuerSigningKey = true,
            ValidateLifetime         = true,
            ValidIssuer              = issuer,
            ValidAudience            = audience,
            IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
            RoleClaimType            = System.Security.Claims.ClaimTypes.Role
        };

        // SignalR sends JWT via query string (?access_token=...) for WebSocket connections
        // because browsers cannot set Authorization headers for WebSocket upgrades.
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("CustomerOnly",       p => p.RequireRole("customer"));
    options.AddPolicy("PhotographerOnly",   p => p.RequireRole("photographer"));
    options.AddPolicy("AdminOnly",          p => p.RequireRole("admin"));
    options.AddPolicy("BookingParticipant", p =>
        p.RequireAssertion(ctx =>
            ctx.User.IsInRole("customer") || ctx.User.IsInRole("photographer")));
});

// ──────────────────────────────────────────
//  Swagger / OpenAPI
// ──────────────────────────────────────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title       = "ShootMatch API",
        Version     = "v1",
        Description =
            "**REST command endpoints** for ShootMatch — photographer-matching platform.\n\n" +
            "### Role system\n" +
            "| Role | Description |\n" +
            "|---|---|\n" +
            "| `customer` | End-user searching for photographers |\n" +
            "| `photographer` | Photographer managing their profile & bookings |\n" +
            "| `admin` | Platform administrator |\n\n" +
            "### Transport layer\n" +
            "| Type | Endpoint | Purpose |\n" +
            "|---|---|---|\n" +
            "| REST | `/api/**` | Commands (write operations) |\n" +
            "| GraphQL | `/graphql` | Queries (read operations) |\n" +
            "| WebSocket | `/hubs/chat` | Real-time messaging (SignalR) |",
        Contact = new OpenApiContact { Name = "ShootMatch Team" }
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name         = "Authorization",
        Type         = SecuritySchemeType.Http,
        Scheme       = "bearer",
        BearerFormat = "JWT",
        In           = ParameterLocation.Header,
        Description  = "Enter JWT: **Bearer {token}**\n\nRoles: `customer` | `photographer` | `admin`"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

// ──────────────────────────────────────────
//  GraphQL (with HotChocolate authorization)
// ──────────────────────────────────────────
builder.Services
    .AddGraphQLServer()
    .AddQueryType<MatchingQuery>()
    .TryAddTypeInterceptor<IgnoreDomainEventsTypeInterceptor>()
    .AddAuthorization();

// ──────────────────────────────────────────
//  Middleware pipeline
// ──────────────────────────────────────────
var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI(options =>
{
    options.SwaggerEndpoint("/swagger/v1/swagger.json", "ShootMatch API v1");
    options.RoutePrefix = "swagger";
    options.DocumentTitle = "ShootMatch API Docs";
    options.DisplayRequestDuration();
    options.EnableDeepLinking();
});

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseStaticFiles();

// CORS trước Auth để Expo Go request không bị block
app.UseCors("MobileDevPolicy");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapGraphQL("/graphql");

app.MapGet("/", () => Results.Redirect("/swagger"));

// Health check for mobile debug
app.MapGet("/health", () => Results.Ok(new { status = "healthy", time = DateTime.UtcNow }));

// SignalR Hub — WebSocket URL: wss://host/hubs/chat
// Client must pass JWT via ?access_token=... query string
app.MapHub<ChatHub>("/hubs/chat");

app.Run();
