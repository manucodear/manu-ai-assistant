# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy csproj and restore as distinct layers
COPY Manu.AiAssistant.WebApi/*.csproj ./Manu.AiAssistant.WebApi/
RUN dotnet restore ./Manu.AiAssistant.WebApi/Manu.AiAssistant.WebApi.csproj

# Copy everything else and build
COPY . .
WORKDIR /src/Manu.AiAssistant.WebApi
RUN dotnet publish Manu.AiAssistant.WebApi.csproj -c Release -o /app/publish --no-restore

# Stage 2: Serve
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Expose port 80 (default for ASP.NET Core)
EXPOSE 80

# Set environment variables if needed
# ENV ASPNETCORE_URLS="http://+:80"

ENTRYPOINT ["dotnet", "Manu.AiAssistant.WebApi.dll"]
