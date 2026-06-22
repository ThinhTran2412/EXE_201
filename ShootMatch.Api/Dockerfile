# Build Stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy project files first for caching
COPY ShootMatch.sln ./
COPY ShootMatch.Api/ShootMatch.Api.csproj ShootMatch.Api/
COPY ShootMatch.Application/ShootMatch.Application.csproj ShootMatch.Application/
COPY ShootMatch.Domain/ShootMatch.Domain.csproj ShootMatch.Domain/
COPY ShootMatch.Infrastructure/ShootMatch.Infrastructure.csproj ShootMatch.Infrastructure/

# Restore dependencies
RUN dotnet restore

# Copy all source files
COPY . .

# Build and publish
WORKDIR /src/ShootMatch.Api
RUN dotnet publish -c Release -o /app/publish

# Runtime Stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

# Environment variables
ENV ASPNETCORE_URLS=http://+:5062
ENV ASPNETCORE_ENVIRONMENT=Production

# Ensure we create the pictures upload directory inside container if it doesn't exist
RUN mkdir -p /data/Pictures

EXPOSE 5062
ENTRYPOINT ["dotnet", "ShootMatch.Api.dll"]
